import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
  directUrl?: string; // Fallback direct URL without proxy
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
  const [currentUrl, setCurrentUrl] = useState(url);
  const [triedFallback, setTriedFallback] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Try fallback URL if main URL fails
  const tryFallback = () => {
    if (directUrl && !triedFallback) {
      console.log("VideoPlayer: Trying fallback direct URL:", directUrl);
      setTriedFallback(true);
      setCurrentUrl(directUrl);
      setError(null);
      setIsLoading(true);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentUrl) return;

    console.log("VideoPlayer: Loading URL:", currentUrl);
    setError(null);
    setIsLoading(true);

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsStream = currentUrl.includes(".m3u8");
    
    // For streams going through proxy, try direct playback first
    if (currentUrl.includes("stream-proxy")) {
      console.log("VideoPlayer: Using direct playback for proxied stream");
      video.src = currentUrl;
      video.load();
    } else if (isHlsStream && Hls.isSupported()) {
      // For HLS streams, use HLS.js
      console.log("VideoPlayer: Using HLS.js for m3u8 stream");
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("VideoPlayer: HLS manifest parsed");
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch((e) => {
          console.error("VideoPlayer: Play failed:", e);
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('VideoPlayer: HLS Error:', data);
        if (data.fatal) {
          // Try fallback URL before showing error
          if (directUrl && !triedFallback) {
            tryFallback();
          } else {
            setError("Failed to load stream. The stream may be unavailable.");
            setIsLoading(false);
          }
        }
      });
      // Native HLS support (Safari)
      console.log("VideoPlayer: Using native HLS support");
      video.src = currentUrl;
      video.load();
    } else {
      // Direct video playback
      console.log("VideoPlayer: Using direct playback");
      video.src = currentUrl;
      video.load();
    }
    
    const handleCanPlay = () => {
      console.log("VideoPlayer: Can play event");
      setIsLoading(false);
      video.play().then(() => {
        setIsPlaying(true);
        console.log("VideoPlayer: Playback started");
      }).catch((e) => {
        console.error("VideoPlayer: Autoplay failed:", e);
      });
    };

    const handleError = (e: Event) => {
      console.error('VideoPlayer: Video error:', e, video.error);
      // Try fallback URL before showing error
      if (directUrl && !triedFallback) {
        tryFallback();
      } else if (!hlsRef.current) {
        const errorMsg = video.error?.message || "Failed to load video. The stream may be unavailable.";
        setError(errorMsg);
        setIsLoading(false);
      }
    };

    const handleLoadStart = () => {
      console.log("VideoPlayer: Load start");
      setIsLoading(true);
    };

    const handlePlaying = () => {
      console.log("VideoPlayer: Playing");
      setIsLoading(false);
      setIsPlaying(true);
    };

    const handleWaiting = () => {
      console.log("VideoPlayer: Waiting/buffering");
      setIsLoading(true);
    };

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
  }, [currentUrl, directUrl, triedFallback]);

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
    setIsLoading(true);
    
    const video = videoRef.current;
    if (!video) return;
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    video.src = url;
    video.load();
  };

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onClick={() => togglePlay()}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
      />

      {/* Loading Spinner */}
      {isLoading && (
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
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-red-400 text-lg">{error}</p>
            <div className="flex gap-4">
              <Button onClick={handleRetry} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleBack} variant="default">
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
        {/* Top Bar with Back Button */}
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
          </div>
        </div>

        {/* Center Play Button */}
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

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            {/* Volume */}
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

            {/* Title */}
            <span className="flex-1 text-white text-sm truncate">{title}</span>

            {/* Fullscreen */}
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
