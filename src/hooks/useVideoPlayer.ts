import { useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface PlaybackInfo {
  type: "live" | "vod" | "series";
  streamId: number;
  title: string;
  containerExtension?: string;
}

interface Playlist {
  serverAddress: string;
  username: string;
  password: string;
}

export function useVideoPlayer() {
  const getActivePlaylist = useCallback((): Playlist | null => {
    const playlists = JSON.parse(localStorage.getItem("iptv_playlists") || "[]");
    return playlists.length > 0 ? playlists[0] : null;
  }, []);

  const buildStreamUrl = useCallback((info: PlaybackInfo): string | null => {
    const playlist = getActivePlaylist();
    if (!playlist) {
      toast({
        title: "No Playlist Connected",
        description: "Please add a playlist to play content.",
        variant: "destructive",
      });
      return null;
    }

    // Clean server address
    let serverUrl = playlist.serverAddress.trim();
    if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
      serverUrl = "http://" + serverUrl;
    }
    if (serverUrl.endsWith("/")) {
      serverUrl = serverUrl.slice(0, -1);
    }

    const { username, password } = playlist;
    
    switch (info.type) {
      case "live":
        // Live stream URL format: http://server:port/username/password/streamId
        return `${serverUrl}/${username}/${password}/${info.streamId}`;
      case "vod":
        // VOD URL format: http://server:port/movie/username/password/streamId.extension
        const ext = info.containerExtension || "mp4";
        return `${serverUrl}/movie/${username}/${password}/${info.streamId}.${ext}`;
      case "series":
        // Series URL format: http://server:port/series/username/password/streamId.extension
        const seriesExt = info.containerExtension || "mp4";
        return `${serverUrl}/series/${username}/${password}/${info.streamId}.${seriesExt}`;
      default:
        return null;
    }
  }, [getActivePlaylist]);

  const playWithMXPlayer = useCallback((url: string, title: string) => {
    // MX Player intent URL for Android/Fire TV
    // intent://url#Intent;package=com.mxtech.videoplayer.ad;S.title=Title;end
    const mxPlayerUrl = `intent:${encodeURIComponent(url)}#Intent;package=com.mxtech.videoplayer.ad;S.title=${encodeURIComponent(title)};end`;
    
    // Also try the free version
    const mxPlayerFreeUrl = `intent:${encodeURIComponent(url)}#Intent;package=com.mxtech.videoplayer.ad;S.title=${encodeURIComponent(title)};end`;
    
    // Direct MX Player scheme
    const mxSchemeUrl = `mxplayer://play?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    
    return { mxPlayerUrl, mxPlayerFreeUrl, mxSchemeUrl };
  }, []);

  const playWithVLC = useCallback((url: string) => {
    // VLC intent for Android
    return `vlc://${url}`;
  }, []);

  const playStream = useCallback((info: PlaybackInfo) => {
    const streamUrl = buildStreamUrl(info);
    if (!streamUrl) return;

    // Check if we're on a mobile/TV device (Android/Fire TV)
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes("android");
    const isFireTV = userAgent.includes("silk") || userAgent.includes("amazon") || userAgent.includes("aftt");
    
    if (isAndroid || isFireTV) {
      // Try to launch MX Player
      const { mxSchemeUrl } = playWithMXPlayer(streamUrl, info.title);
      
      // Create a hidden iframe to trigger the intent
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = mxSchemeUrl;
      document.body.appendChild(iframe);
      
      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
      toast({
        title: "Opening MX Player",
        description: `Playing: ${info.title}`,
      });
      
      // Also try opening directly
      window.location.href = mxSchemeUrl;
    } else {
      // For web/desktop, try to open in new tab or copy URL
      navigator.clipboard.writeText(streamUrl).then(() => {
        toast({
          title: "Stream URL Copied",
          description: "Open with your preferred video player (VLC, MX Player, etc.)",
        });
      }).catch(() => {
        // Fallback: show the URL
        toast({
          title: "Stream Ready",
          description: streamUrl,
        });
      });
      
      // Try to open in new tab for browser playback
      window.open(streamUrl, "_blank");
    }
  }, [buildStreamUrl, playWithMXPlayer]);

  return {
    playStream,
    buildStreamUrl,
    getActivePlaylist,
  };
}
