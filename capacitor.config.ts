import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.chicagotvland',
  appName: 'ChicagoTVLand',
  webDir: 'dist',
  server: {
    url: 'https://9aa3d97f-58eb-4335-920c-a758d823377b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#0a0f1a'
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    backgroundColor: '#0a0f1a'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0f1a',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    ScreenOrientation: {
      // Default to landscape
    }
  }
};

export default config;
