import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaylistModal } from "@/components/PlaylistModal";
import { Plus, List, MoreVertical, Play, Trash2, Edit, RefreshCw } from "lucide-react";

const playlists = [
  { id: 1, name: "Main Provider", type: "Xtream", channels: 1250, movies: 5000, series: 850, lastUpdated: "2 hours ago", status: "active" },
  { id: 2, name: "Backup IPTV", type: "M3U", channels: 800, movies: 3000, series: 500, lastUpdated: "1 day ago", status: "active" },
  { id: 3, name: "Sports Package", type: "M3U", channels: 150, movies: 0, series: 0, lastUpdated: "3 days ago", status: "expired" },
];

const Playlists = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2">
              Playlists
            </h1>
            <p className="text-muted-foreground">
              Manage your IPTV playlists and subscriptions
            </p>
          </div>

          <Button variant="hero" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5" />
            Add Playlist
          </Button>
        </div>

        {/* Playlists Grid */}
        {playlists.length > 0 ? (
          <div className="grid gap-6">
            {playlists.map((playlist) => (
              <Card key={playlist.id} variant="elevated" className="overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6 p-6">
                  {/* Playlist Icon */}
                  <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <List className="w-8 h-8 text-primary" />
                  </div>

                  {/* Playlist Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-semibold text-xl text-foreground truncate">
                        {playlist.name}
                      </h3>
                      <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-secondary-foreground">
                        {playlist.type}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        playlist.status === "active"
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      }`}>
                        {playlist.status === "active" ? "Active" : "Expired"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>{playlist.channels} Channels</span>
                      <span>{playlist.movies} Movies</span>
                      <span>{playlist.series} Series</span>
                      <span>Updated {playlist.lastUpdated}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="default">
                      <Play className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="elevated" className="text-center py-16">
            <List className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-xl text-foreground mb-2">
              No playlists added
            </h3>
            <p className="text-muted-foreground mb-6">
              Add your first IPTV playlist to start streaming
            </p>
            <Button variant="hero" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5" />
              Add Playlist
            </Button>
          </Card>
        )}
      </div>

      <PlaylistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </MainLayout>
  );
};

export default Playlists;
