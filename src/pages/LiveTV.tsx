import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Grid, List as ListIcon, Loader2, Tv, Play } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  // Filter channels
  const filteredChannels = useMemo(() => {
    let channels = selectedCategory 
      ? (channelsByCategory[selectedCategory] || [])
      : liveChannels;
    
    if (searchQuery) {
      channels = channels.filter(channel => 
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return channels;
  }, [liveChannels, channelsByCategory, searchQuery, selectedCategory]);

  const handlePlay = (channel: LiveChannel) => {
    playStream({
      type: "live",
      streamId: channel.stream_id,
      title: channel.name,
    });
  };

  const hasPlaylist = getActivePlaylist() !== null;

  if (!hasPlaylist) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
            <Tv className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-2 text-center">
            No Playlist Connected
          </h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Connect your IPTV provider using Xtream Codes to view live TV channels
          </p>
          <Button variant="hero" onClick={() => navigate("/playlists")}>
            Add Playlist
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Categories */}
        <div className="w-64 flex-shrink-0 border-r border-border bg-card/50">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold text-lg text-foreground">Live TV</h2>
            <p className="text-sm text-muted-foreground">{liveChannels.length} channels</p>
          </div>
          
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  selectedCategory === null 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-secondary"
                )}
              >
                All Channels
              </button>
              
              {sortedCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors truncate",
                    selectedCategory === category 
                      ? "bg-primary text-primary-foreground" 
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  {category}
                  <span className="ml-2 text-xs opacity-70">
                    ({channelsByCategory[category]?.length || 0})
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display font-bold text-lg text-foreground">
              {selectedCategory || "All Channels"}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredChannels.length})
              </span>
            </h3>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isLoadingLive ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading channels...</span>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className={cn(
                "p-4",
                viewMode === "grid" 
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  : "space-y-2"
              )}>
                {filteredChannels.map((channel) => (
                  viewMode === "grid" ? (
                    <div
                      key={channel.stream_id}
                      className="group cursor-pointer"
                      onClick={() => handlePlay(channel)}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary mb-2">
                        {channel.stream_icon ? (
                          <img
                            src={channel.stream_icon}
                            alt={channel.name}
                            className="w-full h-full object-contain bg-secondary"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=225&fit=crop";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="w-10 h-10 text-muted-foreground/30" />
                          </div>
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                            <Play className="w-5 h-5 text-primary-foreground fill-current" />
                          </div>
                        </div>

                        {/* Channel Number */}
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-background/80 text-xs font-bold">
                          {channel.num}
                        </div>

                        {/* Live Badge */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/90 text-xs font-bold text-destructive-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          LIVE
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {channel.name}
                      </p>
                    </div>
                  ) : (
                    <div
                      key={channel.stream_id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-secondary transition-colors cursor-pointer group"
                      onClick={() => handlePlay(channel)}
                    >
                      <span className="text-sm text-muted-foreground w-10 text-right flex-shrink-0">
                        {channel.num}
                      </span>
                      <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                        {channel.stream_icon ? (
                          <img
                            src={channel.stream_icon}
                            alt={channel.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {channel.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded bg-destructive/20 text-xs font-medium text-destructive">
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        LIVE
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                ))}
              </div>

              {filteredChannels.length === 0 && (
                <div className="text-center py-16">
                  <Tv className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No channels found</p>
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
