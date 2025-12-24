import { MainLayout } from "@/components/MainLayout";
import { ContentCard } from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Mic, Loader2, Tv } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useVoiceCommandContext } from "@/contexts/VoiceCommandContext";
import { useIPTV } from "@/contexts/IPTVContext";
import { RegionTabs, RegionId, detectRegion } from "@/components/RegionTabs";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";

const ITEMS_PER_PAGE = 50;

const Series = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState<RegionId>("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const { startVoiceSearch, isSupported } = useVoiceCommandContext();
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

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedGenre, selectedRegion]);

  // Update search when URL params change (from voice command)
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const genres = useMemo(() => 
    ["All", ...seriesCategories.map(cat => cat.category_name)],
    [seriesCategories]
  );

  // Group series by region
  const seriesByRegion = useMemo(() => {
    const grouped: Record<RegionId, typeof series> = {
      all: series,
      usa: [],
      europe: [],
      asia: [],
      arabic: [],
      africa: [],
    };

    series.forEach((show) => {
      const categoryName = seriesCategories.find(cat => cat.category_id === show.category_id)?.category_name || "";
      const region = detectRegion(categoryName, show.name);
      if (region !== "all") {
        grouped[region].push(show);
      }
    });

    return grouped;
  }, [series, seriesCategories]);

  const filteredSeries = useMemo(() => {
    const seriesPool = selectedRegion === "all" ? series : seriesByRegion[selectedRegion];
    
    return seriesPool.filter((show) => {
      const matchesSearch = show.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === "All" || 
        seriesCategories.find(cat => cat.category_id === show.category_id)?.category_name === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [series, seriesByRegion, searchQuery, selectedGenre, selectedRegion, seriesCategories]);

  const visibleSeries = useMemo(() => 
    filteredSeries.slice(0, visibleCount),
    [filteredSeries, visibleCount]
  );

  const hasMore = visibleCount < filteredSeries.length;

  const loadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  const handlePlay = (show: typeof series[0]) => {
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
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2">
            TV Series
          </h1>
          <p className="text-muted-foreground">
            {isLoadingSeries ? "Loading series..." : `${filteredSeries.length} series available`}
          </p>
        </div>

        {/* Region Tabs */}
        <div className="mb-6">
          <RegionTabs 
            selectedRegion={selectedRegion} 
            onRegionChange={setSelectedRegion}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search series..."
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
            {genres.slice(0, 7).map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre(genre)}
                className="flex-shrink-0"
              >
                {genre}
              </Button>
            ))}
            {genres.length > 7 && (
              <Button variant="outline" size="sm" className="flex-shrink-0">
                +{genres.length - 7} more
              </Button>
            )}
          </div>

          <Button variant="outline" className="ml-auto flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Loading State */}
        {isLoadingSeries && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading series...</span>
          </div>
        )}

        {/* Series Grid */}
        {!isLoadingSeries && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleSeries.map((show) => (
                <ContentCard
                  key={show.series_id}
                  title={show.name}
                  image={show.cover || "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=225&fit=crop"}
                  category={seriesCategories.find(cat => cat.category_id === show.category_id)?.category_name || show.genre || "Unknown"}
                  year={show.releaseDate?.split("-")[0]}
                  rating={show.rating_5based ? show.rating_5based * 2 : undefined}
                  onPlay={() => handlePlay(show)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" size="lg" onClick={loadMore}>
                  Load More ({filteredSeries.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}

        {!isLoadingSeries && filteredSeries.length === 0 && series.length > 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No series found matching your filters</p>
          </div>
        )}

        {!isLoadingSeries && series.length === 0 && (
          <div className="text-center py-16">
            <Tv className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-4">No series loaded</p>
            <Button variant="outline" onClick={() => loadSeriesContent()}>
              <Loader2 className="w-4 h-4 mr-2" />
              Reload Series
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Series;
