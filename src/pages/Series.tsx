import { MainLayout } from "@/components/MainLayout";
import { ContentCard } from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const series = [
  { id: 1, title: "Breaking Bad", image: "https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=400&h=225&fit=crop", category: "Drama", year: "2008", rating: 9.5 },
  { id: 2, title: "Game of Thrones", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=225&fit=crop", category: "Fantasy", year: "2011", rating: 9.3 },
  { id: 3, title: "Stranger Things", image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2016", rating: 8.7 },
  { id: 4, title: "The Mandalorian", image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2019", rating: 8.8 },
  { id: 5, title: "The Witcher", image: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&h=225&fit=crop", category: "Fantasy", year: "2019", rating: 8.2 },
  { id: 6, title: "The Office", image: "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400&h=225&fit=crop", category: "Comedy", year: "2005", rating: 8.9 },
  { id: 7, title: "Friends", image: "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=400&h=225&fit=crop", category: "Comedy", year: "1994", rating: 8.9 },
  { id: 8, title: "The Crown", image: "https://images.unsplash.com/photo-1461360370896-922624d12a74?w=400&h=225&fit=crop", category: "Drama", year: "2016", rating: 8.7 },
  { id: 9, title: "Dark", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=225&fit=crop", category: "Thriller", year: "2017", rating: 8.8 },
  { id: 10, title: "Money Heist", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=225&fit=crop", category: "Crime", year: "2017", rating: 8.3 },
  { id: 11, title: "Peaky Blinders", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop", category: "Crime", year: "2013", rating: 8.8 },
  { id: 12, title: "Westworld", image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2016", rating: 8.6 },
];

const genres = ["All", "Drama", "Sci-Fi", "Fantasy", "Comedy", "Crime", "Thriller"];

const Series = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const filteredSeries = series.filter((show) => {
    const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "All" || show.category === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2">
            TV Series
          </h1>
          <p className="text-muted-foreground">
            {series.length} series in your library
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search series..."
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

        {/* Series Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSeries.map((show) => (
            <ContentCard
              key={show.id}
              title={show.title}
              image={show.image}
              category={show.category}
              year={show.year}
              rating={show.rating}
            />
          ))}
        </div>

        {filteredSeries.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No series found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Series;
