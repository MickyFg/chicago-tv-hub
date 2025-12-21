import { MainLayout } from "@/components/MainLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Palette, 
  Monitor, 
  Volume2, 
  Download, 
  Shield, 
  Info,
  ExternalLink
} from "lucide-react";

const Settings = () => {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your ChicagoTVLand experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Account */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                Account
              </CardTitle>
              <CardDescription>
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Display Name</label>
                  <Input defaultValue="User" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input type="email" placeholder="your@email.com" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">Show more content in less space</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Channel Numbers</p>
                  <p className="text-sm text-muted-foreground">Display channel numbers on tiles</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Animations</p>
                  <p className="text-sm text-muted-foreground">Enable smooth animations</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Playback */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-primary" />
                Playback
              </CardTitle>
              <CardDescription>
                Video and audio settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto-play Next Episode</p>
                  <p className="text-sm text-muted-foreground">Automatically play next episode in series</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Hardware Acceleration</p>
                  <p className="text-sm text-muted-foreground">Use GPU for video decoding</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Default Quality</p>
                  <p className="text-sm text-muted-foreground">Preferred video quality</p>
                </div>
                <Button variant="outline" size="sm">Auto</Button>
              </div>
            </CardContent>
          </Card>

          {/* Data & Cache */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Download className="w-5 h-5 text-primary" />
                Data & Cache
              </CardTitle>
              <CardDescription>
                Manage storage and downloads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Cache EPG Data</p>
                  <p className="text-sm text-muted-foreground">Store program guide locally</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Cache Size</p>
                  <p className="text-sm text-muted-foreground">Current: 245 MB</p>
                </div>
                <Button variant="outline" size="sm">Clear Cache</Button>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Info className="w-5 h-5 text-primary" />
                About
              </CardTitle>
              <CardDescription>
                App information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Version</p>
                  <p className="text-sm text-muted-foreground">ChicagoTVLand v1.0.0</p>
                </div>
                <Button variant="outline" size="sm">Check for Updates</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Website</p>
                  <p className="text-sm text-muted-foreground">chicagotvland.com</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
