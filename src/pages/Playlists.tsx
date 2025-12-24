import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tv, List, Play, Trash2, RefreshCw, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Playlist {
  id: number;
  name: string;
  type: string;
  serverAddress: string;
  username: string;
  password: string;
  includeTvChannels: boolean;
  includeVod: boolean;
  status: string;
  expirationDate?: string;
  maxConnections?: string;
  createdAt: string;
}

const Playlists = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    const savedPlaylists = JSON.parse(localStorage.getItem("iptv_playlists") || "[]");
    setPlaylists(savedPlaylists);
  }, []);

  const handleDelete = (id: number) => {
    const updatedPlaylists = playlists.filter((p) => p.id !== id);
    localStorage.setItem("iptv_playlists", JSON.stringify(updatedPlaylists));
    setPlaylists(updatedPlaylists);
    toast.success("Playlist deleted");
  };

  const handleRefresh = async (playlist: Playlist) => {
    toast.info("Refreshing playlist...");
    try {
      const apiUrl = `${playlist.serverAddress}/player_api.php?username=${encodeURIComponent(playlist.username)}&password=${encodeURIComponent(playlist.password)}`;
      const response = await fetch(apiUrl);
      if (response.ok) {
        toast.success("Playlist refreshed successfully");
      } else {
        toast.error("Failed to refresh playlist");
      }
    } catch (error) {
      toast.error("Connection error");
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2">
            Playlists
          </h1>
          <p className="text-muted-foreground">
            Add and manage your IPTV playlists
          </p>
        </div>

        {/* Add Playlist Options */}
        <div className="mb-8">
          <h2 className="font-display font-semibold text-lg text-foreground mb-4">
            Add Playlist
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Xtream Codes Option */}
            <Card
              variant="elevated"
              className="group cursor-pointer transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
              onClick={() => navigate("/xtream-setup")}
            >
              <div className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                  <Tv className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                    Xtream Codes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Connect using server URL, username & password
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </div>
        </div>

        {/* Connected Playlists */}
        {playlists.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              Connected Playlists
            </h2>
            <div className="grid gap-4">
              {playlists.map((playlist) => (
                <Card key={playlist.id} variant="elevated" className="overflow-hidden">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-6">
                    {/* Playlist Icon */}
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <List className="w-7 h-7 text-primary" />
                    </div>

                    {/* Playlist Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display font-semibold text-lg text-foreground truncate">
                          {playlist.name}
                        </h3>
                        <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-secondary-foreground">
                          {playlist.type}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            playlist.status === "Active"
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {playlist.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{playlist.serverAddress}</span>
                        {playlist.expirationDate && (
                          <span>
                            Expires:{" "}
                            {new Date(Number(playlist.expirationDate) * 1000).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRefresh(playlist)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(playlist.id)}
                      >
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
          </div>
        )}

        {/* Empty State */}
        {playlists.length === 0 && (
          <Card variant="elevated" className="text-center py-12 mt-4">
            <List className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-xl text-foreground mb-2">
              No playlists connected
            </h3>
            <p className="text-muted-foreground">
              Click on Xtream Codes above to add your first playlist
            </p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Playlists;
