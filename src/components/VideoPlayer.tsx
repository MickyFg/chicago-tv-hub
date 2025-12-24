import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { openStreamInExternalPlayer, getExternalPlayers } from "@/lib/externalPlayers";

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
  const [currentUrl, setCurrentUrl] = useState(url);
  const [urlAttempts, setUrlAttempts] = useState<string[]>([]);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const externalPlayers = getExternalPlayers();

  // Get the stream URL for external players
  const getStreamUrlForExternal = () => directUrl || url;

  // Generate all possible stream URLs to try
  const getStreamUrls = useCallback(() => {
    const urls: string[] = [url];
    
    if (directUrl && directUrl !== url) {
      urls.push(directUrl);
    }
    
    if (url.includes('.m3u8')) {
      urls.push(url.replace('.m3u8', '.ts'));
    } else if (url.includes('.ts')) {
      urls.push(url.replace('.ts', '.m3u8'));
    }
    
    return [...new Set(urls)];
  }, [url, directUrl]);

  const tryNextUrl = useCallback(() => {
    const allUrls = getStreamUrls();
    const untried = allUrls.filter(u => !urlAttempts.includes(u));
    
    if (untried.length > 0) {
      console.log("VideoPlayer: Trying next URL:", untried[0]);
      setUrlAttempts(prev => [...prev, untried[0]]);
      setCurrentUrl(untried[0]);
      setError(null);
      setIsLoading(true);
      return true;
    }
    return false;
  }, [getStreamUrls, urlAttempts]);

  const handleOpenExternalPlayer = (player: 'vlc' | 'mx' | 'default') => {
    openStreamInExternalPlayer(getStreamUrlForExternal(), player, title);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentUrl) return;

    console.log("VideoPlayer: Loading URL:", currentUrl);
    setError(null);
    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsStream = currentUrl.includes(".m3u8");
    const isTsStream = currentUrl.includes(".ts");

    const handlePlaybackError = () => {
      console.log("VideoPlayer: Playback failed, trying alternatives");
      if (!tryNextUrl()) {
        setError("Cannot play this stream. Try opening in VLC or MX Player.");
        setIsLoading(false);
      }
    };
    
    if (isHlsStream && Hls.isSupported()) {
      console.log("VideoPlayer: Using HLS.js for m3u8");
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        manifestLoadingMaxRetry: 2,
        levelLoadingMaxRetry: 2,
        fragLoadingMaxRetry: 2,
      });
      hlsRef.current = hls;
      
      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("VideoPlayer: HLS manifest parsed successfully");
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('VideoPlayer: HLS Error:', data.type, data.details);
        if (data.fatal) {
          hls.destroy();
          hlsRef.current = null;
          handlePlaybackError();
        }
      });
    } else if (isTsStream && Hls.isSupported()) {
      console.log("VideoPlayer: Creating HLS wrapper for TS stream");
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;

      const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:60
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:60.0,
${currentUrl}`;
      
      const blob = new Blob([playlist], { type: 'application/vnd.apple.mpegurl' });
      const playlistUrl = URL.createObjectURL(blob);
      
      hls.loadSource(playlistUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('VideoPlayer: HLS TS Error:', data.type, data.details);
        if (data.fatal) {
          URL.revokeObjectURL(playlistUrl);
          hls.destroy();
          hlsRef.current = null;
          handlePlaybackError();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log("VideoPlayer: Using native HLS");
      video.src = currentUrl;
      video.load();
    } else {
      console.log("VideoPlayer: Direct playback");
      video.src = currentUrl;
      video.load();
    }
    
    const handleCanPlay = () => {
      console.log("VideoPlayer: Can play");
      setIsLoading(false);
      setError(null);
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    };

    const handleError = () => {
      console.error('VideoPlayer: Native video error', video.error?.code, video.error?.message);
      if (!hlsRef.current) {
        handlePlaybackError();
      }
    };

    const handlePlaying = () => {
      console.log("VideoPlayer: Playing");
      setIsLoading(false);
      setIsPlaying(true);
      setError(null);
    };

    const handleWaiting = () => setIsLoading(true);

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("waiting", handleWaiting);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("waiting", handleWaiting);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = "";
    };
  }, [currentUrl, tryNextUrl]);

  useEffect(() => {
    setUrlAttempts([url]);
    setCurrentUrl(url);
  }, [url]);

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
    setUrlAttempts([]);
    setCurrentUrl(url);
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
      onClick={() => !error && togglePlay()}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        crossOrigin="anonymous"
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open External
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-card">
                  {externalPlayers.map((player) => (
                    <DropdownMenuItem 
                      key={player.id}
                      onClick={() => handleOpenExternalPlayer(player.id)}
                      className="cursor-pointer"
                    >
                      {player.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Button onClick={handleBack} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  title="Open in external player"
                >
                  <ExternalLink className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                {externalPlayers.map((player) => (
                  <DropdownMenuItem 
                    key={player.id}
                    onClick={() => handleOpenExternalPlayer(player.id)}
                    className="cursor-pointer"
                  >
                    {player.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
