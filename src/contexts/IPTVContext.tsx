import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LiveChannel {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface VodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface SeriesInfo {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

interface Playlist {
  id: number;
  name: string;
  type: string;
  serverAddress: string;
  username: string;
  password: string;
  includeTvChannels: boolean;
  includeVod: boolean;
  status: string;
}

interface IPTVContextType {
  // Data
  liveChannels: LiveChannel[];
  liveCategories: Category[];
  vodStreams: VodStream[];
  vodCategories: Category[];
  series: SeriesInfo[];
  seriesCategories: Category[];
  
  // Loading states
  isLoadingLive: boolean;
  isLoadingVod: boolean;
  isLoadingSeries: boolean;
  
  // Actions
  loadLiveContent: () => Promise<void>;
  loadVodContent: () => Promise<void>;
  loadSeriesContent: () => Promise<void>;
  getActivePlaylist: () => Playlist | null;
  refreshAllContent: () => Promise<void>;
}

const IPTVContext = createContext<IPTVContextType | undefined>(undefined);

export function IPTVProvider({ children }: { children: React.ReactNode }) {
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [vodStreams, setVodStreams] = useState<VodStream[]>([]);
  const [vodCategories, setVodCategories] = useState<Category[]>([]);
  const [series, setSeries] = useState<SeriesInfo[]>([]);
  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);
  
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isLoadingVod, setIsLoadingVod] = useState(false);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);

  const getActivePlaylist = useCallback((): Playlist | null => {
    const playlists = JSON.parse(localStorage.getItem("iptv_playlists") || "[]");
    return playlists.length > 0 ? playlists[0] : null;
  }, []);

  const fetchFromXtream = useCallback(async (action: string) => {
    const playlist = getActivePlaylist();
    if (!playlist) {
      console.log("No active playlist found");
      return null;
    }

    const { data, error } = await supabase.functions.invoke('xtream-proxy', {
      body: {
        serverAddress: playlist.serverAddress,
        username: playlist.username,
        password: playlist.password,
        action,
      },
    });

    if (error) {
      console.error(`Error fetching ${action}:`, error);
      return null;
    }

    return data;
  }, [getActivePlaylist]);

  const loadLiveContent = useCallback(async () => {
    const playlist = getActivePlaylist();
    if (!playlist || !playlist.includeTvChannels) return;

    setIsLoadingLive(true);
    try {
      // Fetch categories and channels in parallel
      const [categoriesData, channelsData] = await Promise.all([
        fetchFromXtream('get_live_categories'),
        fetchFromXtream('get_live_streams'),
      ]);

      if (Array.isArray(categoriesData)) {
        setLiveCategories(categoriesData);
      }
      if (Array.isArray(channelsData)) {
        setLiveChannels(channelsData);
      }
      
      console.log(`Loaded ${channelsData?.length || 0} live channels`);
    } catch (error) {
      console.error("Error loading live content:", error);
    } finally {
      setIsLoadingLive(false);
    }
  }, [getActivePlaylist, fetchFromXtream]);

  const loadVodContent = useCallback(async () => {
    const playlist = getActivePlaylist();
    if (!playlist || !playlist.includeVod) return;

    setIsLoadingVod(true);
    try {
      const [categoriesData, vodData] = await Promise.all([
        fetchFromXtream('get_vod_categories'),
        fetchFromXtream('get_vod_streams'),
      ]);

      if (Array.isArray(categoriesData)) {
        setVodCategories(categoriesData);
      }
      if (Array.isArray(vodData)) {
        setVodStreams(vodData);
      }
      
      console.log(`Loaded ${vodData?.length || 0} movies`);
    } catch (error) {
      console.error("Error loading VOD content:", error);
    } finally {
      setIsLoadingVod(false);
    }
  }, [getActivePlaylist, fetchFromXtream]);

  const loadSeriesContent = useCallback(async () => {
    const playlist = getActivePlaylist();
    if (!playlist || !playlist.includeVod) return;

    setIsLoadingSeries(true);
    try {
      const [categoriesData, seriesData] = await Promise.all([
        fetchFromXtream('get_series_categories'),
        fetchFromXtream('get_series'),
      ]);

      if (Array.isArray(categoriesData)) {
        setSeriesCategories(categoriesData);
      }
      if (Array.isArray(seriesData)) {
        setSeries(seriesData);
      }
      
      console.log(`Loaded ${seriesData?.length || 0} series`);
    } catch (error) {
      console.error("Error loading series content:", error);
    } finally {
      setIsLoadingSeries(false);
    }
  }, [getActivePlaylist, fetchFromXtream]);

  const refreshAllContent = useCallback(async () => {
    await Promise.all([
      loadLiveContent(),
      loadVodContent(),
      loadSeriesContent(),
    ]);
  }, [loadLiveContent, loadVodContent, loadSeriesContent]);

  // Removed auto-loading on mount to prevent freezing with large datasets
  // Content is now loaded on-demand by individual pages

  const value: IPTVContextType = {
    liveChannels,
    liveCategories,
    vodStreams,
    vodCategories,
    series,
    seriesCategories,
    isLoadingLive,
    isLoadingVod,
    isLoadingSeries,
    loadLiveContent,
    loadVodContent,
    loadSeriesContent,
    getActivePlaylist,
    refreshAllContent,
  };

  return (
    <IPTVContext.Provider value={value}>
      {children}
    </IPTVContext.Provider>
  );
}

export function useIPTV() {
  const context = useContext(IPTVContext);
  if (context === undefined) {
    return {
      liveChannels: [],
      liveCategories: [],
      vodStreams: [],
      vodCategories: [],
      series: [],
      seriesCategories: [],
      isLoadingLive: false,
      isLoadingVod: false,
      isLoadingSeries: false,
      loadLiveContent: async () => {},
      loadVodContent: async () => {},
      loadSeriesContent: async () => {},
      getActivePlaylist: () => null,
      refreshAllContent: async () => {},
    };
  }
  return context;
}
