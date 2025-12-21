import { Tv, Film, Clapperboard, Heart, Settings, List, Search, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Tv, label: "Live TV", path: "/live" },
  { icon: Film, label: "Movies", path: "/movies" },
  { icon: Clapperboard, label: "Series", path: "/series" },
  { icon: Heart, label: "Favorites", path: "/favorites" },
  { icon: List, label: "Playlists", path: "/playlists" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-50 h-full w-20 lg:w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Tv className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="hidden lg:block font-display font-bold text-xl text-foreground">
            Chicago<span className="text-primary">TV</span>Land
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Search Button */}
      <div className="p-3 lg:p-4 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all duration-200">
          <Search className="w-5 h-5 flex-shrink-0" />
          <span className="hidden lg:block font-medium">Search</span>
        </button>
      </div>
    </aside>
  );
};
