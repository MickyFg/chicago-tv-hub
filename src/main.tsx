import { createRoot } from "react-dom/client";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Lock to landscape on native platforms
if (Capacitor.isNativePlatform()) {
  ScreenOrientation.lock({ orientation: "landscape" }).catch(console.error);
}

createRoot(document.getElementById("root")!).render(<App />);
