import { MainLayout } from "@/components/MainLayout";
import { ContentCard } from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Grid, List as ListIcon } from "lucide-react";
import { useState } from "react";

const channels = [
  { id: 1, title: "ESPN Sports", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=225&fit=crop", category: "Sports", channelNumber: "101" },
  { id: 2, title: "CNN News", image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=225&fit=crop", category: "News", channelNumber: "102" },
  { id: 3, title: "Discovery Channel", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=225&fit=crop", category: "Documentary", channelNumber: "103" },
  { id: 4, title: "HBO Max", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=225&fit=crop", category: "Entertainment", channelNumber: "104" },
  { id: 5, title: "National Geographic", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop", category: "Documentary", channelNumber: "105" },
  { id: 6, title: "Fox Sports", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=225&fit=crop", category: "Sports", channelNumber: "106" },
  { id: 7, title: "BBC World", image: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=225&fit=crop", category: "News", channelNumber: "107" },
  { id: 8, title: "Cartoon Network", image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=225&fit=crop", category: "Kids", channelNumber: "108" },
  { id: 9, title: "MTV Music", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop", category: "Music", channelNumber: "109" },
  { id: 10, title: "Comedy Central", image: "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400&h=225&fit=crop", category: "Entertainment", channelNumber: "110" },
  { id: 11, title: "History Channel", image: "https://images.unsplash.com/photo-1461360370896-922624d12a74?w=400&h=225&fit=crop", category: "Documentary", channelNumber: "111" },
  { id: 12, title: "Animal Planet", image: "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&h=225&fit=crop", category: "Documentary", channelNumber: "112" },
];

const categories = ["All", "Sports", "News", "Entertainment", "Documentary", "Kids", "Music"];

const LiveTV = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredChannels = channels.filter((channel) => {
    const matchesSearch = channel.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || channel.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2">
            Live TV
          </h1>
          <p className="text-muted-foreground">
            {channels.length} channels available
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
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

        {/* Channel Grid */}
        <div className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "flex flex-col gap-4"
        }>
          {filteredChannels.map((channel) => (
            <ContentCard
              key={channel.id}
              title={channel.title}
              image={channel.image}
              category={channel.category}
              channelNumber={channel.channelNumber}
              isLive
              className={viewMode === "list" ? "flex-row" : ""}
            />
          ))}
        </div>

        {filteredChannels.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No channels found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LiveTV;
