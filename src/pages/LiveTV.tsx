import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Tv, Play, ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useIPTV, LiveChannel } from "@/contexts/IPTVContext";
import { useVideoPlayer } from "@/contexts/VideoPlayerContext";
import { cn } from "@/lib/utils";

const LiveTV = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { playStream } = useVideoPlayer();
  const { 
    liveChannels, 
    liveCategories, 
    isLoadingLive, 
    loadLiveContent,
    getActivePlaylist 
  } = useIPTV();

  // Load content on mount
  useEffect(() => {
    if (getActivePlaylist()) {
      loadLiveContent();
    }
  }, []);

  // Update search when URL params change
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Group channels by category
  const channelsByCategory = useMemo(() => {
    const grouped: Record<string, LiveChannel[]> = {};
    
    liveChannels.forEach((channel) => {
      const category = liveCategories.find(cat => cat.category_id === channel.category_id);
      const categoryName = category?.category_name || "Uncategorized";
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(channel);
    });
    
    return grouped;
  }, [liveChannels, liveCategories]);

  // Get sorted category names
  const sortedCategories = useMemo(() => {
    return Object.keys(channelsByCategory).sort((a, b) => a.localeCompare(b));
  }, [channelsByCategory]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return sortedCategories;
    return sortedCategories.filter(cat => 
      cat.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedCategories, searchQuery]);

  // Get channels for selected category
  const filteredChannels = useMemo(() => {
    if (!selectedCategory) return [];
    
    let channels = channelsByCategory[selectedCategory] || [];
    
    if (searchQuery) {
      channels = channels.filter(channel => 
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return channels;
  }, [channelsByCategory, searchQuery, selectedCategory]);

  const handlePlay = (channel: LiveChannel) => {
    playStream({
      type: "live",
      streamId: channel.stream_id,
      title: channel.name,
    });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery("");
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSearchQuery("");
  };

  const hasPlaylist = getActivePlaylist() !== null;

  if (!hasPlaylist) {
    return (
      <MainLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
            <Tv className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display font-bold text-lg text-foreground mb-2 text-center">
            No Playlist Connected
          </h2>
          <p className="text-muted-foreground text-center mb-4 text-sm max-w-md">
            Connect your IPTV provider to view live TV channels
          </p>
          <Button variant="hero" size="sm" onClick={() => navigate("/playlists")}>
            Add Playlist
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-1rem)]">
        {/* Header */}
        <div className="p-3 border-b border-border bg-card/50 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            {selectedCategory && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-base text-foreground truncate">
                {selectedCategory || "Live TV"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedCategory 
                  ? `${filteredChannels.length} channels`
                  : `${sortedCategories.length} categories`
                }
              </p>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={selectedCategory ? "Search channels..." : "Search categories..."}
              className="pl-8 h-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isLoadingLive ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground text-sm">Loading...</span>
            </div>
          ) : selectedCategory ? (
            // Channel List View
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {filteredChannels.map((channel) => (
                  <div
                    key={channel.stream_id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-card hover:bg-secondary transition-colors cursor-pointer group"
                    onClick={() => handlePlay(channel)}
                  >
                    <span className="text-xs text-muted-foreground w-7 text-right flex-shrink-0">
                      {channel.num}
                    </span>
                    <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
                      {channel.stream_icon ? (
                        <img
                          src={channel.stream_icon}
                          alt={channel.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tv className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {channel.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-destructive/20 text-[10px] font-medium text-destructive">
                        <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                        LIVE
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-3.5 h-3.5 text-primary fill-current" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredChannels.length === 0 && (
                <div className="text-center py-12">
                  <Tv className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No channels found</p>
                </div>
              )}
            </ScrollArea>
          ) : (
            // Category List View
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {filteredCategories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-secondary transition-colors cursor-pointer group"
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Tv className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {channelsByCategory[category]?.length || 0} channels
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>

              {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <Tv className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No categories found</p>
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default LiveTV;
