import { useVideoPlayer } from "@/contexts/VideoPlayerContext";
import { VideoPlayer } from "@/components/VideoPlayer";

export function GlobalVideoPlayer() {
  const { currentStream, isPlayerModalOpen, closePlayerModal } = useVideoPlayer();
  
  if (!currentStream || !isPlayerModalOpen) {
    return null;
  }
  
  return (
    <VideoPlayer
      url={currentStream.url}
      title={currentStream.title}
      onClose={closePlayerModal}
      directUrl={currentStream.directUrl}
    />
  );
}
