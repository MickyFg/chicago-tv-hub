import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
  directUrl?: string;
}

export function VideoPlayer({ url, title, onClose, directUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get the stream URL to use for playback - prefer direct URL for mobile
  const streamUrl = directUrl || url;

  const openInExternalPlayer = () => {
    // Open stream in external player (works on mobile)
    const streamToOpen = directUrl || url.includes('stream-proxy') 
      ? new URL(url).searchParams.get('url') || url
      : url;
    
    // Try to open in external app
    window.open(streamToOpen, '_blank');
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    console.log("VideoPlayer: Loading URL:", streamUrl, "Attempt:", attemptCount);
    setError(null);
    setIsLoading(true);

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsStream = streamUrl.includes(".m3u8");
    const isTsStream = streamUrl.includes(".ts");
    
    // For .ts streams, create HLS playlist wrapper
    if (isTsStream && Hls.isSupported()) {
      console.log("VideoPlayer: Using HLS.js for TS stream");
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        debug: false,
      });
      hlsRef.current = hls;

      // Create a synthetic HLS playlist for the TS stream
      const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:60
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:60.0,
${streamUrl}`;
      
      const blob = new Blob([playlist], { type: 'application/vnd.apple.mpegurl' });
      const playlistUrl = URL.createObjectURL(blob);
      
      hls.loadSource(playlistUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("VideoPlayer: HLS manifest parsed");
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch((e) => {
          console.error("VideoPlayer: Play failed:", e);
        });
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        console.log("VideoPlayer: Fragment loaded");
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('VideoPlayer: HLS Error:', data);
        if (data.fatal) {
          URL.revokeObjectURL(playlistUrl);
          // Try direct playback as fallback
          console.log("VideoPlayer: HLS failed, trying direct playback");
          hls.destroy();
          hlsRef.current = null;
          video.src = streamUrl;
          video.load();
        }
      });
    } else if (isHlsStream && Hls.isSupported()) {
      console.log("VideoPlayer: Using HLS.js for m3u8 stream");
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError("Failed to load stream");
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || 
               video.canPlayType('video/mp2t')) {
      // Native HLS/TS support (Safari, some mobile browsers)
      console.log("VideoPlayer: Using native playback");
      video.src = streamUrl;
      video.load();
    } else {
      // Direct video playback attempt
      console.log("VideoPlayer: Trying direct playback");
      video.src = streamUrl;
      video.load();
    }
    
    const handleCanPlay = () => {
      console.log("VideoPlayer: Can play");
      setIsLoading(false);
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    };

    const handleError = () => {
      console.error('VideoPlayer: Video error', video.error);
      if (!hlsRef.current) {
        setError("Cannot play this stream format. Try opening in an external player.");
        setIsLoading(false);
      }
    };

    const handleLoadStart = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setError(null);
    };
    const handleWaiting = () => setIsLoading(true);

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("waiting", handleWaiting);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("waiting", handleWaiting);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = "";
    };
  }, [streamUrl, attemptCount]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = value[0];
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    setAttemptCount(prev => prev + 1);
  };

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    openInExternalPlayer();
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onClick={() => !error && togglePlay()}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        muted={false}
      />

      {/* Loading Spinner */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-lg">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-center gap-4 p-6 text-center max-w-sm">
            <p className="text-red-400 text-base">{error}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleOpenExternal} variant="default" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open External
              </Button>
              <Button onClick={handleBack} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={handleBack}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h2 className="text-white text-lg font-semibold truncate flex-1">{title}</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={handleOpenExternal}
            >
              <ExternalLink className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Center Play Button */}
        {!error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              className="w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10 ml-1" />
              )}
            </Button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.1}
                className="w-24"
              />
            </div>

            <span className="flex-1 text-white text-sm truncate">{title}</span>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
