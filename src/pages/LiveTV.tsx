import { MainLayout } from "@/components/MainLayout";
import { ContentCard } from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid, List as ListIcon, Mic, Loader2, Tv } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useVoiceCommandContext } from "@/contexts/VoiceCommandContext";
import { useIPTV } from "@/contexts/IPTVContext";

const ITEMS_PER_PAGE = 50;

const LiveTV = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const { startVoiceSearch, isSupported } = useVoiceCommandContext();
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

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedCategory]);

  // Update search when URL params change (from voice command)
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const categories = useMemo(() => 
    ["All", ...liveCategories.map(cat => cat.category_name)],
    [liveCategories]
  );

  const filteredChannels = useMemo(() => {
    return liveChannels.filter((channel) => {
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || 
        liveCategories.find(cat => cat.category_id === channel.category_id)?.category_name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [liveChannels, searchQuery, selectedCategory, liveCategories]);

  const visibleChannels = useMemo(() => 
    filteredChannels.slice(0, visibleCount),
    [filteredChannels, visibleCount]
  );

  const hasMore = visibleCount < filteredChannels.length;

  const loadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
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
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2">
            Live TV
          </h1>
          <p className="text-muted-foreground">
            {isLoadingLive ? "Loading channels..." : `${liveChannels.length} channels available`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              className="pl-12 pr-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSupported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={startVoiceSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                title="Voice search"
              >
                <Mic className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.slice(0, 10).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex-shrink-0"
              >
                {category}
              </Button>
            ))}
            {categories.length > 10 && (
              <Button variant="outline" size="sm" className="flex-shrink-0">
                +{categories.length - 10} more
              </Button>
            )}
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingLive && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading channels...</span>
          </div>
        )}

        {/* Channel Grid */}
        {!isLoadingLive && (
          <>
            <div className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-4"
            }>
              {visibleChannels.map((channel) => (
                <ContentCard
                  key={channel.stream_id}
                  title={channel.name}
                  image={channel.stream_icon || "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=225&fit=crop"}
                  category={liveCategories.find(cat => cat.category_id === channel.category_id)?.category_name || "Unknown"}
                  channelNumber={String(channel.num)}
                  isLive
                  className={viewMode === "list" ? "flex-row" : ""}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" size="lg" onClick={loadMore}>
                  Load More ({filteredChannels.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}

        {!isLoadingLive && filteredChannels.length === 0 && liveChannels.length > 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No channels found matching your search</p>
          </div>
        )}

        {!isLoadingLive && liveChannels.length === 0 && (
          <div className="text-center py-16">
            <Tv className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-4">No channels loaded</p>
            <Button variant="outline" onClick={() => loadLiveContent()}>
              <Loader2 className="w-4 h-4 mr-2" />
              Reload Channels
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LiveTV;
