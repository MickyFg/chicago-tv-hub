import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  StreamingEngine, 
  StreamConfig, 
  PlaybackState, 
  EngineStats, 
  EngineError, 
  QualityLevel, 
  BufferInfo,
  EngineConfig 
} from '@/lib/streaming/StreamingEngine';

interface UseStreamingEngineOptions {
  onError?: (error: EngineError) => void;
  onStateChange?: (state: PlaybackState) => void;
  onQualityChange?: (quality: QualityLevel) => void;
  onStats?: (stats: EngineStats) => void;
  config?: Partial<EngineConfig>;
}

interface UseStreamingEngineReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  engine: StreamingEngine | null;
  state: PlaybackState;
  stats: EngineStats | null;
  error: EngineError | null;
  qualityLevels: QualityLevel[];
  currentQuality: QualityLevel | null;
  bufferInfo: BufferInfo | null;
  load: (config: StreamConfig) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setQuality: (level: number) => void;
  setAutoQuality: (enabled: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  unload: () => void;
}

export function useStreamingEngine(
  options: UseStreamingEngineOptions = {}
): UseStreamingEngineReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<StreamingEngine | null>(null);
  const [state, setState] = useState<PlaybackState>('idle');
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [error, setError] = useState<EngineError | null>(null);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<QualityLevel | null>(null);
  const [bufferInfo, setBufferInfo] = useState<BufferInfo | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const engine = new StreamingEngine(videoRef.current, options.config);
    engineRef.current = engine;

    engine.on('stateChange', (newState) => {
      setState(newState);
      options.onStateChange?.(newState);
    });

    engine.on('stats', (newStats) => {
      setStats(newStats);
      options.onStats?.(newStats);
    });

    engine.on('error', (err) => {
      setError(err);
      options.onError?.(err);
    });

    engine.on('qualityLevelsLoaded', setQualityLevels);
    engine.on('qualityChange', (quality) => {
      setCurrentQuality(quality);
      options.onQualityChange?.(quality);
    });
    engine.on('bufferUpdate', setBufferInfo);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const load = useCallback(async (config: StreamConfig) => {
    setError(null);
    await engineRef.current?.load(config);
  }, []);

  const play = useCallback(async () => {
    await engineRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    engineRef.current?.seek(time);
  }, []);

  const setVolume = useCallback((volume: number) => {
    engineRef.current?.setVolume(volume);
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    engineRef.current?.setMuted(muted);
  }, []);

  const setQuality = useCallback((level: number) => {
    engineRef.current?.setQuality(level);
  }, []);

  const setAutoQuality = useCallback((enabled: boolean) => {
    engineRef.current?.setAutoQuality(enabled);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    engineRef.current?.setPlaybackRate(rate);
  }, []);

  const unload = useCallback(() => {
    engineRef.current?.unload();
    setState('idle');
    setStats(null);
    setError(null);
    setQualityLevels([]);
    setCurrentQuality(null);
    setBufferInfo(null);
  }, []);

  return {
    videoRef,
    engine: engineRef.current,
    state,
    stats,
    error,
    qualityLevels,
    currentQuality,
    bufferInfo,
    load,
    play,
    pause,
    seek,
    setVolume,
    setMuted,
    setQuality,
    setAutoQuality,
    setPlaybackRate,
    unload,
  };
}
