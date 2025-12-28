import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, ExternalLink, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { openStreamInExternalPlayer, getExternalPlayers } from "@/lib/externalPlayers";
import { useStreamingEngine } from "@/hooks/useStreamingEngine";
import type { PlaybackState } from "@/lib/streaming/StreamingEngine";

interface VideoPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
  directUrl?: string;
  streamType?: 'hls' | 'dash' | 'direct';
}

export function VideoPlayer({ url, title, onClose, directUrl, streamType }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMutedState] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const externalPlayers = getExternalPlayers();

  const {
    videoRef,
    state,
    error,
    qualityLevels,
    currentQuality,
    load,
    play,
    pause,
    setVolume,
    setMuted,
    setQuality,
    setAutoQuality,
    unload,
  } = useStreamingEngine({
    onError: (err) => {
      console.error('[VideoPlayer] Engine error:', err.code, err.message);
    },
    onStateChange: (newState) => {
      console.log('[VideoPlayer] State changed:', newState);
    },
  });

  const isPlaying = state === 'playing';
  const isLoading = state === 'loading' || state === 'buffering';
  const hasError = state === 'error' || error?.fatal;

  // Get the stream URL for external players
  const getStreamUrlForExternal = () => directUrl || url;

  const handleOpenExternalPlayer = (player: 'vlc' | 'mx' | 'default') => {
    openStreamInExternalPlayer(getStreamUrlForExternal(), player, title);
  };

  // Load stream on mount or URL change
  useEffect(() => {
    if (!videoRef.current || !url) return;

    console.log('[VideoPlayer] Loading stream:', url, 'type:', streamType || 'auto');
    
    // Use streamType hint if provided, otherwise auto-detect
    const configType = streamType || 'auto';
    
    load({ url, type: configType })
      .then(() => {
        console.log('[VideoPlayer] Stream loaded, starting playback');
        play();
      })
      .catch((err) => {
        console.error('[VideoPlayer] Failed to load stream:', err);
      });

    return () => {
      unload();
    };
  }, [url, streamType]);

  // Handle fullscreen changes
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
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMutedState(newMuted);
    setMuted(newMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setVolumeState(vol);
    setVolume(vol);
    setIsMutedState(vol === 0);
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
    const configType = streamType || 'auto';
    load({ url, type: configType })
      .then(() => play())
      .catch(console.error);
  };

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleQualitySelect = (index: number) => {
    if (index === -1) {
      setAutoQuality(true);
    } else {
      setQuality(index);
    }
  };

  const getStateLabel = (s: PlaybackState): string => {
    switch (s) {
      case 'loading': return 'Loading...';
      case 'buffering': return 'Buffering...';
      case 'error': return 'Error';
      default: return '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onClick={() => !hasError && togglePlay()}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-lg">{getStateLabel(state)}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-center gap-4 p-6 text-center max-w-sm">
            <p className="text-red-400 text-base">
              {error?.message?.includes('401') 
                ? 'A network error (status 401) occurred while loading manifest'
                : error?.message || 'Cannot play this stream'}
            </p>
            <p className="text-muted-foreground text-sm">
              IPTV streams work best in external players like VLC or MX Player
            </p>
            
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
            
            {/* Quality Selector */}
            {qualityLevels.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    title="Quality"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card">
                  <DropdownMenuLabel>Quality</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleQualitySelect(-1)}
                    className="cursor-pointer"
                  >
                    Auto {!currentQuality && '✓'}
                  </DropdownMenuItem>
                  {qualityLevels.map((level) => (
                    <DropdownMenuItem 
                      key={level.index}
                      onClick={() => handleQualitySelect(level.index)}
                      className="cursor-pointer"
                    >
                      {level.name} {currentQuality?.index === level.index && '✓'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
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
        {!hasError && (
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

            <span className="flex-1 text-white text-sm truncate">
              {title}
              {currentQuality && <span className="ml-2 text-muted-foreground">({currentQuality.name})</span>}
            </span>

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
