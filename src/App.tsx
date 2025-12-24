import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VoiceCommandProvider } from "@/contexts/VoiceCommandContext";
import { IPTVProvider } from "@/contexts/IPTVContext";
import { VideoPlayerProvider, useVideoPlayer } from "@/contexts/VideoPlayerContext";
import { VoiceCommandButton } from "@/components/VoiceCommandButton";
import { VoiceSearchModal } from "@/components/VoiceSearchModal";
import { PlayerModal } from "@/components/PlayerModal";
import Index from "./pages/Index";
import LiveTV from "./pages/LiveTV";
import EPGGuide from "./pages/EPGGuide";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Favorites from "./pages/Favorites";
import Playlists from "./pages/Playlists";
import XtreamSetup from "./pages/XtreamSetup";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PlayerModalWrapper = () => {
  const { currentStream, isPlayerModalOpen, closePlayerModal } = useVideoPlayer();
  
  if (!currentStream) return null;
  
  return (
    <PlayerModal
      isOpen={isPlayerModalOpen}
      onClose={closePlayerModal}
      streamUrl={currentStream.url}
      title={currentStream.title}
    />
  );
};

const AppContent = () => (
  <>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/live" element={<LiveTV />} />
      <Route path="/guide" element={<EPGGuide />} />
      <Route path="/movies" element={<Movies />} />
      <Route path="/series" element={<Series />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/playlists" element={<Playlists />} />
      <Route path="/xtream-setup" element={<XtreamSetup />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    
    {/* Global Voice Command UI */}
    <VoiceCommandButton />
    <VoiceSearchModal />
    
    {/* Global Player Modal */}
    <PlayerModalWrapper />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <IPTVProvider>
          <VideoPlayerProvider>
            <VoiceCommandProvider>
              <AppContent />
            </VoiceCommandProvider>
          </VideoPlayerProvider>
        </IPTVProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
