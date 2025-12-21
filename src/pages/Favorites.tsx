import { MainLayout } from "@/components/MainLayout";
import { ContentCard } from "@/components/ContentCard";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";

const favorites = [
  { id: 1, title: "Breaking Bad", image: "https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=400&h=225&fit=crop", category: "Drama", year: "2008", rating: 9.5, type: "series" },
  { id: 2, title: "ESPN Sports", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=225&fit=crop", category: "Sports", channelNumber: "101", type: "live" },
  { id: 3, title: "The Dark Knight", image: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=225&fit=crop", category: "Action", year: "2008", rating: 9.0, type: "movie" },
  { id: 4, title: "CNN News", image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=225&fit=crop", category: "News", channelNumber: "102", type: "live" },
];

const Favorites = () => {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2 flex items-center gap-3">
              <Heart className="w-8 h-8 text-live fill-live" />
              Favorites
            </h1>
            <p className="text-muted-foreground">
              {favorites.length} items saved
            </p>
          </div>

          {favorites.length > 0 && (
            <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Favorites Grid */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((item) => (
              <ContentCard
                key={item.id}
                title={item.title}
                image={item.image}
                category={item.category}
                year={item.year}
                rating={item.rating}
                channelNumber={item.channelNumber}
                isLive={item.type === "live"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-xl text-foreground mb-2">
              No favorites yet
            </h3>
            <p className="text-muted-foreground">
              Start adding your favorite channels, movies, and series
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Favorites;
