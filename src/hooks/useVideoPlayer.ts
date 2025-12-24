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

  const playStream = useCallback((info: PlaybackInfo) => {
    const streamUrl = buildStreamUrl(info);
    if (!streamUrl) return;

    // Check if we're on a mobile/TV device (Android/Fire TV)
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes("android");
    const isFireTV = userAgent.includes("silk") || userAgent.includes("amazon") || userAgent.includes("aftt");
    
    if (isAndroid || isFireTV) {
      // For Android/Fire TV, use intent URL to launch MX Player
      // Create the intent URL
      const intentUrl = `intent:${streamUrl}#Intent;package=com.mxtech.videoplayer.ad;S.title=${encodeURIComponent(info.title)};end`;
      
      // Try to open MX Player via a new window (won't navigate away from app)
      const newWindow = window.open(intentUrl, '_blank');
      
      // If popup blocked, try iframe approach
      if (!newWindow) {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = intentUrl;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
      
      toast({
        title: "Opening MX Player",
        description: `Playing: ${info.title}`,
      });
    } else {
      // For web/desktop, open stream in new tab only (don't navigate away)
      const newWindow = window.open(streamUrl, "_blank");
      
      if (newWindow) {
        toast({
          title: "Opening Stream",
          description: `Playing: ${info.title}`,
        });
      } else {
        // If popup blocked, copy URL to clipboard
        navigator.clipboard.writeText(streamUrl).then(() => {
          toast({
            title: "Stream URL Copied",
            description: "Paste this URL in VLC or any video player to watch.",
          });
        }).catch(() => {
          toast({
            title: "Stream URL",
            description: streamUrl,
          });
        });
      }
    }
  }, [buildStreamUrl]);

  return {
    playStream,
    buildStreamUrl,
    getActivePlaylist,
  };
}
