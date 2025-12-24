import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Grid, List as ListIcon, Loader2, Tv, Play, ChevronDown, X } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
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

  // Filter channels based on selected category
  const filteredChannels = useMemo(() => {
    let channels: LiveChannel[] = [];
    
    if (selectedCategory) {
      // Filter channels by matching category_id
      const selectedCat = liveCategories.find(cat => cat.category_name === selectedCategory);
      if (selectedCat) {
        channels = liveChannels.filter(channel => channel.category_id === selectedCat.category_id);
      } else {
        channels = channelsByCategory[selectedCategory] || [];
      }
    } else {
      channels = liveChannels;
    }
    
    if (searchQuery) {
      channels = channels.filter(channel => 
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return channels;
  }, [liveChannels, liveCategories, channelsByCategory, searchQuery, selectedCategory]);

  const handlePlay = (channel: LiveChannel) => {
    playStream({
      type: "live",
      streamId: channel.stream_id,
      title: channel.name,
    });
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setShowCategoryPicker(false);
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
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="font-display font-bold text-base text-foreground">Live TV</h2>
              <p className="text-xs text-muted-foreground">{liveChannels.length} channels</p>
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              className="pl-8 h-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Picker Button */}
          <button
            onClick={() => setShowCategoryPicker(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary text-sm"
          >
            <span className="truncate font-medium">
              {selectedCategory || "All Channels"}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
              <span className="text-xs">({filteredChannels.length})</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Category Picker Modal */}
        {showCategoryPicker && (
          <div className="fixed inset-0 bg-background/95 z-50 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-display font-bold text-base">Select Category</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowCategoryPicker(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    selectedCategory === null 
                      ? "bg-primary text-primary-foreground" 
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  All Channels
                  <span className="ml-2 text-xs opacity-70">({liveChannels.length})</span>
                </button>
                
                {sortedCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      selectedCategory === category 
                        ? "bg-primary text-primary-foreground" 
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <span className="truncate block">{category}</span>
                    <span className="text-xs opacity-70">
                      ({channelsByCategory[category]?.length || 0})
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isLoadingLive ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground text-sm">Loading...</span>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className={cn(
                "p-2",
                viewMode === "grid" 
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2"
                  : "space-y-1"
              )}>
                {filteredChannels.map((channel) => (
                  viewMode === "grid" ? (
                    <div
                      key={channel.stream_id}
                      className="group cursor-pointer"
                      onClick={() => handlePlay(channel)}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary mb-1">
                        {channel.stream_icon ? (
                          <img
                            src={channel.stream_icon}
                            alt={channel.name}
                            className="w-full h-full object-contain bg-secondary"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 text-primary-foreground fill-current" />
                          </div>
                        </div>

                        {/* Channel Number */}
                        <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-background/80 text-[10px] font-bold">
                          {channel.num}
                        </div>

                        {/* Live Badge */}
                        <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-destructive/90 text-[10px] font-bold text-destructive-foreground">
                          <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                          LIVE
                        </div>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors px-0.5">
                        {channel.name}
                      </p>
                    </div>
                  ) : (
                    <div
                      key={channel.stream_id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-card hover:bg-secondary transition-colors cursor-pointer group"
                      onClick={() => handlePlay(channel)}
                    >
                      <span className="text-xs text-muted-foreground w-7 text-right flex-shrink-0">
                        {channel.num}
                      </span>
                      <div className="w-8 h-8 rounded bg-secondary overflow-hidden flex-shrink-0">
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
                            <Tv className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {channel.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-destructive/20 text-[10px] font-medium text-destructive">
                        <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                        LIVE
                      </div>
                    </div>
                  )
                ))}
              </div>

              {filteredChannels.length === 0 && (
                <div className="text-center py-12">
                  <Tv className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No channels found</p>
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
