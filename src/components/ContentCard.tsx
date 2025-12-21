import { Play, Heart, Info, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  title: string;
  image: string;
  category?: string;
  rating?: number;
  year?: string;
  isLive?: boolean;
  channelNumber?: string;
  onPlay?: () => void;
  onFavorite?: () => void;
  className?: string;
}

export const ContentCard = ({
  title,
  image,
  category,
  rating,
  year,
  isLive,
  channelNumber,
  onPlay,
  onFavorite,
  className,
}: ContentCardProps) => {
  return (
    <Card variant="content" className={cn("group", className)}>
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Live Badge */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-live/90 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
            <span className="text-xs font-semibold text-foreground">LIVE</span>
          </div>
        )}

        {/* Channel Number */}
        {channelNumber && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm">
            <span className="text-xs font-semibold text-foreground">CH {channelNumber}</span>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="hero"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={onPlay}
          >
            <Play className="w-6 h-6 fill-current" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="glass"
            size="icon"
            className="w-8 h-8"
            onClick={onFavorite}
          >
            <Heart className="w-4 h-4" />
          </Button>
          <Button variant="glass" size="icon" className="w-8 h-8">
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
          {category && <span>{category}</span>}
          {year && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>{year}</span>
            </>
          )}
          {rating && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-warning text-warning" />
                <span>{rating}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
