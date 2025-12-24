import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Tv, Play, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useIPTV, SeriesInfo } from "@/contexts/IPTVContext";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { cn } from "@/lib/utils";

const Series = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { playStream } = useVideoPlayer();
  const { 
    series, 
    seriesCategories, 
    isLoadingSeries, 
    loadSeriesContent,
    getActivePlaylist 
  } = useIPTV();

  // Load content on mount
  useEffect(() => {
    if (getActivePlaylist()) {
      loadSeriesContent();
    }
  }, []);

  // Update search when URL params change (from voice command)
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Group series by category
  const seriesByCategory = useMemo(() => {
    const grouped: Record<string, SeriesInfo[]> = {};
    
    series.forEach((show) => {
      const category = seriesCategories.find(cat => cat.category_id === show.category_id);
      const categoryName = category?.category_name || "Uncategorized";
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(show);
    });
    
    return grouped;
  }, [series, seriesCategories]);

  // Get sorted category names
  const sortedCategories = useMemo(() => {
    return Object.keys(seriesByCategory).sort((a, b) => a.localeCompare(b));
  }, [seriesByCategory]);

  // Filter series based on search
  const filteredSeriesByCategory = useMemo(() => {
    if (!searchQuery) return seriesByCategory;
    
    const filtered: Record<string, SeriesInfo[]> = {};
    Object.entries(seriesByCategory).forEach(([category, shows]) => {
      const matchingShows = shows.filter(show => 
        show.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingShows.length > 0) {
        filtered[category] = matchingShows;
      }
    });
    return filtered;
  }, [seriesByCategory, searchQuery]);

  // Get current category series or all
  const displayCategories = useMemo(() => {
    if (selectedCategory && filteredSeriesByCategory[selectedCategory]) {
      return { [selectedCategory]: filteredSeriesByCategory[selectedCategory] };
    }
    return filteredSeriesByCategory;
  }, [filteredSeriesByCategory, selectedCategory]);

  const handlePlay = (show: SeriesInfo) => {
    playStream({
      type: "series",
      streamId: show.series_id,
      title: show.name,
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
            Connect your IPTV provider using Xtream Codes to view TV series
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
            <h2 className="font-display font-bold text-lg text-foreground">TV Series</h2>
            <p className="text-sm text-muted-foreground">{series.length} total</p>
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
                All Shows
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
                    ({seriesByCategory[category]?.length || 0})
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isLoadingSeries ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading series...</span>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-8">
                {Object.entries(displayCategories).map(([category, shows]) => (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold text-xl text-foreground">
                        {category}
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        See All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    {/* Horizontal Scroll Content Row */}
                    <div className="relative">
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {shows.slice(0, selectedCategory ? 100 : 20).map((show) => (
                          <div
                            key={show.series_id}
                            className="flex-shrink-0 w-36 group cursor-pointer"
                            onClick={() => handlePlay(show)}
                          >
                            {/* Poster */}
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary mb-2">
                              <img
                                src={show.cover || "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200&h=300&fit=crop"}
                                alt={show.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200&h=300&fit=crop";
                                }}
                              />
                              
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              
                              {/* Play Button */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                                  <Play className="w-5 h-5 text-primary-foreground fill-current" />
                                </div>
                              </div>

                              {/* Rating Badge */}
                              {show.rating_5based && show.rating_5based > 0 && (
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-warning/90 text-warning-foreground text-xs font-bold flex items-center gap-1">
                                  {(show.rating_5based * 2).toFixed(1)}
                                </div>
                              )}
                            </div>

                            {/* Title */}
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {show.name}
                            </p>
                            {show.releaseDate && (
                              <p className="text-xs text-muted-foreground">
                                {show.releaseDate.split("-")[0]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {Object.keys(displayCategories).length === 0 && (
                  <div className="text-center py-16">
                    <Tv className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">No series found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Series;
