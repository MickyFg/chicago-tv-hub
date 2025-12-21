import { useState } from "react";
import { Upload, Link, List, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaylistModal = ({ isOpen, onClose }: PlaylistModalProps) => {
  const [m3uUrl, setM3uUrl] = useState("");
  const [xtreamHost, setXtreamHost] = useState("");
  const [xtreamUser, setXtreamUser] = useState("");
  const [xtreamPass, setXtreamPass] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card variant="elevated" className="relative w-full max-w-lg animate-slide-up">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <List className="w-5 h-5 text-primary" />
            </div>
            Add Playlist
          </CardTitle>
          <CardDescription>
            Import your IPTV playlist using M3U URL or Xtream Codes API
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="m3u" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="m3u" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                M3U URL
              </TabsTrigger>
              <TabsTrigger value="xtream" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Xtream Codes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="m3u" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  M3U Playlist URL
                </label>
                <Input
                  placeholder="https://example.com/playlist.m3u"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                />
              </div>
              <Button variant="hero" className="w-full">
                <Check className="w-4 h-4" />
                Load Playlist
              </Button>
            </TabsContent>

            <TabsContent value="xtream" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Server URL
                </label>
                <Input
                  placeholder="http://provider.com:port"
                  value={xtreamHost}
                  onChange={(e) => setXtreamHost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Username
                </label>
                <Input
                  placeholder="Your username"
                  value={xtreamUser}
                  onChange={(e) => setXtreamUser(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={xtreamPass}
                  onChange={(e) => setXtreamPass(e.target.value)}
                />
              </div>
              <Button variant="hero" className="w-full">
                <Check className="w-4 h-4" />
                Connect
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
