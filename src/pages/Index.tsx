import { MainLayout } from "@/components/MainLayout";
import { HeroSection } from "@/components/HeroSection";
import { ContentRow } from "@/components/ContentRow";
import { ContentCard } from "@/components/ContentCard";

// Sample data for demo
const liveChannels = [
  { id: 1, title: "ESPN Sports", image: "https://images.unsplash.com/photo-1461896836934- voices-from-the-field?w=400&h=225&fit=crop", category: "Sports", channelNumber: "101" },
  { id: 2, title: "CNN News", image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=225&fit=crop", category: "News", channelNumber: "102" },
  { id: 3, title: "Discovery Channel", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=225&fit=crop", category: "Documentary", channelNumber: "103" },
  { id: 4, title: "HBO Max", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=225&fit=crop", category: "Entertainment", channelNumber: "104" },
  { id: 5, title: "National Geographic", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop", category: "Documentary", channelNumber: "105" },
];

const trendingMovies = [
  { id: 1, title: "The Dark Knight", image: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=225&fit=crop", category: "Action", year: "2008", rating: 9.0 },
  { id: 2, title: "Inception", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2010", rating: 8.8 },
  { id: 3, title: "Interstellar", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2014", rating: 8.6 },
  { id: 4, title: "The Matrix", image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop", category: "Action", year: "1999", rating: 8.7 },
  { id: 5, title: "Blade Runner 2049", image: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2017", rating: 8.0 },
];

const popularSeries = [
  { id: 1, title: "Breaking Bad", image: "https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=400&h=225&fit=crop", category: "Drama", year: "2008", rating: 9.5 },
  { id: 2, title: "Game of Thrones", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=225&fit=crop", category: "Fantasy", year: "2011", rating: 9.3 },
  { id: 3, title: "Stranger Things", image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2016", rating: 8.7 },
  { id: 4, title: "The Mandalorian", image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&h=225&fit=crop", category: "Sci-Fi", year: "2019", rating: 8.8 },
  { id: 5, title: "The Witcher", image: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&h=225&fit=crop", category: "Fantasy", year: "2019", rating: 8.2 },
];

const Index = () => {
  return (
    <MainLayout>
      <div className="pb-8">
        <HeroSection />

        {/* Live TV Section */}
        <ContentRow title="📺 Live TV" onViewAll={() => {}}>
          {liveChannels.map((channel) => (
            <ContentCard
              key={channel.id}
              title={channel.title}
              image={channel.image}
              category={channel.category}
              channelNumber={channel.channelNumber}
              isLive
              className="w-72 flex-shrink-0"
            />
          ))}
        </ContentRow>

        {/* Trending Movies */}
        <ContentRow title="🎬 Trending Movies" onViewAll={() => {}}>
          {trendingMovies.map((movie) => (
            <ContentCard
              key={movie.id}
              title={movie.title}
              image={movie.image}
              category={movie.category}
              year={movie.year}
              rating={movie.rating}
              className="w-72 flex-shrink-0"
            />
          ))}
        </ContentRow>

        {/* Popular Series */}
        <ContentRow title="📺 Popular Series" onViewAll={() => {}}>
          {popularSeries.map((series) => (
            <ContentCard
              key={series.id}
              title={series.title}
              image={series.image}
              category={series.category}
              year={series.year}
              rating={series.rating}
              className="w-72 flex-shrink-0"
            />
          ))}
        </ContentRow>
      </div>
    </MainLayout>
  );
};

export default Index;
