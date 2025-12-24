import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, Play, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamUrl: string;
  title: string;
}

export function PlayerModal({ isOpen, onClose, streamUrl, title }: PlayerModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(streamUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Stream URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please select and copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const openInVLC = () => {
    // Try VLC protocol
    window.location.href = `vlc://${streamUrl}`;
    toast({
      title: "Opening VLC",
      description: "If VLC doesn't open, copy the URL and paste it manually",
    });
  };

  const openInBrowser = () => {
    window.open(streamUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Copy this URL and open it in VLC Player or your preferred video player
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stream URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Stream URL</label>
            <div className="flex gap-2">
              <Input 
                value={streamUrl} 
                readOnly 
                className="font-mono text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleCopy} className="w-full">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy URL to Clipboard
            </Button>
            
            <Button variant="outline" onClick={openInVLC} className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in VLC Player
            </Button>

            <Button variant="ghost" onClick={openInBrowser} className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Try in Browser
            </Button>
          </div>

          {/* Instructions */}
          <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">How to play:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the stream URL above</li>
              <li>Open VLC Player (or MX Player on Android)</li>
              <li>Go to Media → Open Network Stream</li>
              <li>Paste the URL and click Play</li>
            </ol>
          </div>

          {/* Android/Fire TV Instructions */}
          <div className="rounded-lg bg-primary/10 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">For Android/Fire TV:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Install VLC or MX Player from the app store</li>
              <li>Copy the URL and open the video player app</li>
              <li>Use "Open Network Stream" or "Network" option</li>
              <li>Paste the URL to play</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
