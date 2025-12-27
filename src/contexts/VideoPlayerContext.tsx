import React, { createContext, useContext, useState, useCallback } from "react";
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

interface StreamInfo {
  url: string;
  title: string;
  directUrl?: string; // Direct URL without proxy for fallback
}

interface VideoPlayerContextType {
  playStream: (info: PlaybackInfo) => void;
  buildStreamUrl: (info: PlaybackInfo) => string | null;
  getActivePlaylist: () => Playlist | null;
  currentStream: StreamInfo | null;
  isPlayerModalOpen: boolean;
  closePlayerModal: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export function VideoPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentStream, setCurrentStream] = useState<StreamInfo | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

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
    
    let streamPath = "";
    switch (info.type) {
      case "live":
        streamPath = `${serverUrl}/live/${username}/${password}/${info.streamId}.ts`;
        break;
      case "vod":
        const ext = info.containerExtension || "mp4";
        streamPath = `${serverUrl}/movie/${username}/${password}/${info.streamId}.${ext}`;
        break;
      case "series":
        const seriesExt = info.containerExtension || "mp4";
        streamPath = `${serverUrl}/series/${username}/${password}/${info.streamId}.${seriesExt}`;
        break;
      default:
        return null;
    }

    // Use the stream-proxy edge function to avoid CORS issues
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const proxyUrl = `${supabaseUrl}/functions/v1/stream-proxy?url=${encodeURIComponent(streamPath)}`;
    return proxyUrl;
  }, [getActivePlaylist]);

  const playStream = useCallback((info: PlaybackInfo) => {
    const playlist = getActivePlaylist();
    if (!playlist) {
      toast({
        title: "No Playlist Connected",
        description: "Please add a playlist to play content.",
        variant: "destructive",
      });
      return;
    }

    // Build direct URL - clean the server address
    let serverUrl = playlist.serverAddress.trim();
    // Remove any duplicate protocol prefixes
    serverUrl = serverUrl.replace(/^(https?:\/\/)+/gi, '');
    serverUrl = "http://" + serverUrl;
    if (serverUrl.endsWith("/")) {
      serverUrl = serverUrl.slice(0, -1);
    }

    const { username, password } = playlist;
    let directUrl = "";
    
    switch (info.type) {
      case "live":
        // Use TS format for live streams (more reliable)
        directUrl = `${serverUrl}/live/${username}/${password}/${info.streamId}.ts`;
        break;
      case "vod":
        const ext = info.containerExtension || "mp4";
        directUrl = `${serverUrl}/movie/${username}/${password}/${info.streamId}.${ext}`;
        break;
      case "series":
        const seriesExt = info.containerExtension || "mp4";
        directUrl = `${serverUrl}/series/${username}/${password}/${info.streamId}.${seriesExt}`;
        break;
    }

    // Use stream-proxy to avoid CORS issues
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const proxyUrl = `${supabaseUrl}/functions/v1/stream-proxy?url=${encodeURIComponent(directUrl)}`;

    console.log("Playing stream via proxy:", proxyUrl);
    console.log("Direct URL for external players:", directUrl);
    
    // Use proxy URL for playback, direct URL for external players
    setCurrentStream({ url: proxyUrl, title: info.title, directUrl: directUrl });
    setIsPlayerModalOpen(true);
  }, [getActivePlaylist]);

  const closePlayerModal = useCallback(() => {
    setIsPlayerModalOpen(false);
    setCurrentStream(null);
  }, []);

  return (
    <VideoPlayerContext.Provider value={{
      playStream,
      buildStreamUrl,
      getActivePlaylist,
      currentStream,
      isPlayerModalOpen,
      closePlayerModal,
    }}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error("useVideoPlayer must be used within a VideoPlayerProvider");
  }
  return context;
}
