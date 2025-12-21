import { MainLayout } from "@/components/MainLayout";
import { ContentCard } from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const movies = [
  { id: 1, title: "The Dark Knight", image: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=225&fit=crop", category: "Action", year: "2008", rating: 9.0 },
  { id: 2, title: "Inception", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2010", rating: 8.8 },
  { id: 3, title: "Interstellar", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2014", rating: 8.6 },
  { id: 4, title: "The Matrix", image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop", category: "Action", year: "1999", rating: 8.7 },
  { id: 5, title: "Blade Runner 2049", image: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2017", rating: 8.0 },
  { id: 6, title: "Pulp Fiction", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=225&fit=crop", category: "Crime", year: "1994", rating: 8.9 },
  { id: 7, title: "The Godfather", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop", category: "Crime", year: "1972", rating: 9.2 },
  { id: 8, title: "Fight Club", image: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=400&h=225&fit=crop", category: "Drama", year: "1999", rating: 8.8 },
  { id: 9, title: "Forrest Gump", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=225&fit=crop", category: "Drama", year: "1994", rating: 8.8 },
  { id: 10, title: "The Shawshank Redemption", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop", category: "Drama", year: "1994", rating: 9.3 },
  { id: 11, title: "Gladiator", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=225&fit=crop", category: "Action", year: "2000", rating: 8.5 },
  { id: 12, title: "The Prestige", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=225&fit=crop", category: "Thriller", year: "2006", rating: 8.5 },
];

const genres = ["All", "Action", "Sci-Fi", "Drama", "Crime", "Thriller", "Comedy", "Horror"];

const Movies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "All" || movie.category === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2">
            Movies
          </h1>
          <p className="text-muted-foreground">
            {movies.length} movies in your library
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search movies..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {genres.map((genre) => (
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
          </div>

          <Button variant="outline" className="ml-auto flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <ContentCard
              key={movie.id}
              title={movie.title}
              image={movie.image}
              category={movie.category}
              year={movie.year}
              rating={movie.rating}
            />
          ))}
        </div>

        {filteredMovies.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No movies found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Movies;
