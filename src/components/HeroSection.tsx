import { Play, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

export const HeroSection = () => {
  return (
    <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Featured Content"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 lg:p-12 max-w-2xl">
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium border border-primary/30">
              Featured
            </span>
            <span className="px-3 py-1 rounded-full bg-live/20 text-live text-sm font-medium border border-live/30 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-live animate-pulse" />
              Live Now
            </span>
          </div>
          
          <h1 className="font-display font-bold text-4xl lg:text-6xl text-foreground mb-4 leading-tight">
            Welcome to{" "}
            <span className="text-gradient">ChicagoTVLand</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6 max-w-xl">
            Your premium IPTV experience. Stream Live TV, Movies, and Series in stunning quality across all your devices.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button variant="hero" size="xl">
              <Play className="w-5 h-5 fill-current" />
              Start Watching
            </Button>
            <Button variant="glass" size="xl">
              <Plus className="w-5 h-5" />
              Add Playlist
            </Button>
            <Button variant="ghost" size="xl">
              <Info className="w-5 h-5" />
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/3 w-48 h-48 rounded-full bg-primary/5 blur-2xl animate-float" style={{ animationDelay: "2s" }} />
    </section>
  );
};
