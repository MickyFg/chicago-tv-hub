import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Lock to landscape on native platforms
const initNativeFeatures = async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { ScreenOrientation } = await import("@capacitor/screen-orientation");
      await ScreenOrientation.lock({ orientation: "landscape" });
      console.log("Screen locked to landscape");
    }
  } catch (error) {
    console.log("Screen orientation not available:", error);
  }
};

initNativeFeatures();

createRoot(document.getElementById("root")!).render(<App />);
