import { MainLayout } from "@/components/MainLayout";
import { ContentCard } from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Mic, Loader2, Film } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useVoiceCommandContext } from "@/contexts/VoiceCommandContext";
import { useIPTV } from "@/contexts/IPTVContext";

const Movies = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const { startVoiceSearch, isSupported } = useVoiceCommandContext();
  const { 
    vodStreams, 
    vodCategories, 
    isLoadingVod, 
    loadVodContent,
    getActivePlaylist 
  } = useIPTV();

  // Load content on mount
  useEffect(() => {
    if (getActivePlaylist()) {
      loadVodContent();
    }
  }, []);

  // Update search when URL params change (from voice command)
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const genres = ["All", ...vodCategories.map(cat => cat.category_name)];

  const filteredMovies = vodStreams.filter((movie) => {
    const matchesSearch = movie.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "All" || 
      vodCategories.find(cat => cat.category_id === movie.category_id)?.category_name === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const hasPlaylist = getActivePlaylist() !== null;

  if (!hasPlaylist) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
            <Film className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-2 text-center">
            No Playlist Connected
          </h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Connect your IPTV provider using Xtream Codes to view movies
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
            Movies
          </h1>
          <p className="text-muted-foreground">
            {isLoadingVod ? "Loading movies..." : `${vodStreams.length} movies in your library`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search movies..."
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
            {genres.slice(0, 8).map((genre) => (
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
            {genres.length > 8 && (
              <Button variant="outline" size="sm" className="flex-shrink-0">
                +{genres.length - 8} more
              </Button>
            )}
          </div>

          <Button variant="outline" className="ml-auto flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Loading State */}
        {isLoadingVod && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading movies...</span>
          </div>
        )}

        {/* Movies Grid */}
        {!isLoadingVod && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <ContentCard
                key={movie.stream_id}
                title={movie.name}
                image={movie.stream_icon || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=225&fit=crop"}
                category={vodCategories.find(cat => cat.category_id === movie.category_id)?.category_name || "Unknown"}
                rating={movie.rating_5based ? movie.rating_5based * 2 : undefined}
              />
            ))}
          </div>
        )}

        {!isLoadingVod && filteredMovies.length === 0 && vodStreams.length > 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No movies found matching your search</p>
          </div>
        )}

        {!isLoadingVod && vodStreams.length === 0 && (
          <div className="text-center py-16">
            <Film className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-4">No movies loaded</p>
            <Button variant="outline" onClick={() => loadVodContent()}>
              <Loader2 className="w-4 h-4 mr-2" />
              Reload Movies
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Movies;
