// External player intents for Android
// These work when the app is running as a Capacitor Android app

export interface ExternalPlayer {
  name: string;
  icon: string;
  launch: (url: string, title?: string) => void;
}

// Check if running on Android (Capacitor)
export const isAndroid = (): boolean => {
  return typeof window !== 'undefined' && 
    (window.navigator.userAgent.toLowerCase().includes('android') ||
     // @ts-ignore - Capacitor global
     typeof window.Capacitor !== 'undefined');
};

// Launch stream in VLC Player
export const openInVLC = (streamUrl: string, title?: string): void => {
  // VLC Android intent URL scheme
  const vlcUrl = `vlc://${streamUrl}`;
  
  // Try VLC first
  try {
    window.location.href = vlcUrl;
  } catch {
    // Fallback to intent URL for more control
    const intentUrl = `intent://${streamUrl.replace(/^https?:\/\//, '')}#Intent;scheme=http;package=org.videolan.vlc;end`;
    window.location.href = intentUrl;
  }
};

// Launch stream in MX Player
export const openInMXPlayer = (streamUrl: string, title?: string): void => {
  // MX Player intent URL
  const encodedUrl = encodeURIComponent(streamUrl);
  const encodedTitle = encodeURIComponent(title || 'Stream');
  
  // Try MX Player Free first, then Pro
  const intentUrl = `intent://${streamUrl.replace(/^https?:\/\//, '')}#Intent;scheme=http;type=video/*;S.title=${encodedTitle};package=com.mxtech.videoplayer.ad;end`;
  
  try {
    window.location.href = intentUrl;
  } catch {
    // Try MX Player Pro
    const proIntentUrl = `intent://${streamUrl.replace(/^https?:\/\//, '')}#Intent;scheme=http;type=video/*;S.title=${encodedTitle};package=com.mxtech.videoplayer.pro;end`;
    window.location.href = proIntentUrl;
  }
};

// Launch in any available video player (Android chooser)
export const openInDefaultPlayer = (streamUrl: string, title?: string): void => {
  const encodedTitle = encodeURIComponent(title || 'Stream');
  
  // Generic intent that opens Android's app chooser for video
  const intentUrl = `intent://${streamUrl.replace(/^https?:\/\//, '')}#Intent;scheme=http;type=video/*;S.title=${encodedTitle};end`;
  
  try {
    window.location.href = intentUrl;
  } catch {
    // Fallback to simple window.open
    window.open(streamUrl, '_blank');
  }
};

// Open stream with player selection
export const openStreamInExternalPlayer = (
  streamUrl: string, 
  player: 'vlc' | 'mx' | 'default',
  title?: string
): void => {
  console.log(`Opening stream in ${player}:`, streamUrl);
  
  switch (player) {
    case 'vlc':
      openInVLC(streamUrl, title);
      break;
    case 'mx':
      openInMXPlayer(streamUrl, title);
      break;
    case 'default':
    default:
      openInDefaultPlayer(streamUrl, title);
      break;
  }
};

// Get available external players
export const getExternalPlayers = (): { id: 'vlc' | 'mx' | 'default'; name: string }[] => {
  return [
    { id: 'vlc', name: 'VLC Player' },
    { id: 'mx', name: 'MX Player' },
    { id: 'default', name: 'Default Player' },
  ];
};
