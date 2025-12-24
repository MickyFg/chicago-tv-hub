import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Tv, Film, Loader2 } from "lucide-react";
import { toast } from "sonner";

const XtreamSetup = () => {
  const navigate = useNavigate();
  const [serverAddress, setServerAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [includeTvChannels, setIncludeTvChannels] = useState(true);
  const [includeVod, setIncludeVod] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!serverAddress.trim()) {
      toast.error("Please enter server address");
      return;
    }
    if (!username.trim()) {
      toast.error("Please enter username");
      return;
    }
    if (!password.trim()) {
      toast.error("Please enter password");
      return;
    }

    setIsConnecting(true);

    try {
      // Format the server URL properly
      let baseUrl = serverAddress.trim();
      if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
        baseUrl = "http://" + baseUrl;
      }
      
      // Test connection using Xtream API
      const apiUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error("Connection failed");
      }

      const data = await response.json();
      
      if (data.user_info) {
        // Store the connection info
        const playlist = {
          id: Date.now(),
          name: data.server_info?.server_name || "IPTV Provider",
          type: "Xtream",
          serverAddress: baseUrl,
          username,
          password,
          includeTvChannels,
          includeVod,
          status: data.user_info.status || "active",
          expirationDate: data.user_info.exp_date,
          maxConnections: data.user_info.max_connections,
          createdAt: new Date().toISOString(),
        };

        // Get existing playlists from localStorage
        const existingPlaylists = JSON.parse(localStorage.getItem("iptv_playlists") || "[]");
        existingPlaylists.push(playlist);
        localStorage.setItem("iptv_playlists", JSON.stringify(existingPlaylists));

        toast.success("Successfully connected to IPTV provider!");
        navigate("/playlists");
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect. Please check your credentials and try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-primary/20 via-background to-background items-center justify-center p-12">
          <div className="text-center">
            <div className="w-24 h-24 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
              <Tv className="w-12 h-12 text-primary" />
            </div>
            <h2 className="font-display font-bold text-3xl text-foreground mb-4">
              Xtream Codes
            </h2>
            <p className="text-muted-foreground">
              Connect to your IPTV provider using Xtream Codes API
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <Tv className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground">
                Xtream Codes
              </h2>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Server address
                </label>
                <Input
                  placeholder="http://provider.com:port"
                  value={serverAddress}
                  onChange={(e) => setServerAddress(e.target.value)}
                  className="h-12 bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Username
                </label>
                <Input
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>

              {/* Options */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="tv-channels"
                    checked={includeTvChannels}
                    onCheckedChange={(checked) => setIncludeTvChannels(checked as boolean)}
                  />
                  <label
                    htmlFor="tv-channels"
                    className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2"
                  >
                    <Tv className="w-4 h-4 text-primary" />
                    Include TV channels
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="vod"
                    checked={includeVod}
                    onCheckedChange={(checked) => setIncludeVod(checked as boolean)}
                  />
                  <label
                    htmlFor="vod"
                    className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2"
                  >
                    <Film className="w-4 h-4 text-primary" />
                    Include VOD
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/playlists")}
                className="flex-1 h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                variant="hero"
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1 h-12"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Done"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default XtreamSetup;
