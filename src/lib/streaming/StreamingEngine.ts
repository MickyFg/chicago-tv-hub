/**
 * IPTV Streaming Engine
 * High-performance streaming engine supporting HLS, DASH, and native video formats.
 */

import Hls from 'hls.js';
import * as dashjs from 'dashjs';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface StreamConfig {
  url: string;
  type?: 'auto' | 'hls' | 'dash' | 'direct';
  startPosition?: number;
  lowLatencyMode?: boolean;
  headers?: Record<string, string>;
}

export interface QualityLevel {
  index: number;
  bitrate: number;
  width: number;
  height: number;
  codec?: string;
  name: string;
}

export interface BufferInfo {
  start: number;
  end: number;
  length: number;
  ahead: number;
}

export interface EngineStats {
  currentTime: number;
  duration: number;
  buffered: BufferInfo;
  bitrate: number;
  fps: number;
  droppedFrames: number;
  latency: number;
  downloadSpeed: number;
  qualityLevel: QualityLevel | null;
  state: PlaybackState;
}

export type PlaybackState = 
  | 'idle'
  | 'loading'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'seeking'
  | 'ended'
  | 'error';

export interface EngineError {
  code: string;
  message: string;
  fatal: boolean;
  details?: unknown;
}

export type EngineEvents = {
  stateChange: (state: PlaybackState) => void;
  qualityChange: (quality: QualityLevel) => void;
  qualityLevelsLoaded: (levels: QualityLevel[]) => void;
  stats: (stats: EngineStats) => void;
  error: (error: EngineError) => void;
  bufferUpdate: (buffer: BufferInfo) => void;
  timeUpdate: (time: number, duration: number) => void;
  ended: () => void;
  recovered: () => void;
};

export interface EngineConfig {
  maxBufferLength: number;
  maxBufferSize: number;
  minBufferLength: number;
  startBufferLength: number;
  lowLatencyMode: boolean;
  targetLatency: number;
  maxLiveSyncPlaybackRate: number;
  autoQuality: boolean;
  startLevel: number;
  capLevelToPlayerSize: boolean;
  maxRetries: number;
  retryDelay: number;
  fragmentRetryDelay: number;
  levelLoadingMaxRetry: number;
  enableWorker: boolean;
  enableSoftwareAES: boolean;
  debug: boolean;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  maxBufferLength: 30,
  maxBufferSize: 60 * 1000 * 1000,
  minBufferLength: 2,
  startBufferLength: 0.5,
  lowLatencyMode: false,
  targetLatency: 3,
  maxLiveSyncPlaybackRate: 1.1,
  autoQuality: true,
  startLevel: -1,
  capLevelToPlayerSize: true,
  maxRetries: 6,
  retryDelay: 500,
  fragmentRetryDelay: 300,
  levelLoadingMaxRetry: 4,
  enableWorker: true,
  enableSoftwareAES: true,
  debug: false,
};

// =============================================================================
// EVENT EMITTER
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (...args: any[]) => void;

export class EventEmitter<Events extends Record<string, EventCallback>> {
  private listeners: Map<keyof Events, Set<EventCallback>> = new Map();

  on<K extends keyof Events>(event: K, callback: Events[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
    return () => this.off(event, callback);
  }

  off<K extends keyof Events>(event: K, callback: Events[K]): void {
    this.listeners.get(event)?.delete(callback as EventCallback);
  }

  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
    this.listeners.get(event)?.forEach(cb => {
      try { cb(...args); } catch (e) { console.error(e); }
    });
  }

  emitNoArgs<K extends keyof Events>(event: K): void {
    this.listeners.get(event)?.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });
  }

  removeAllListeners(event?: keyof Events): void {
    event ? this.listeners.delete(event) : this.listeners.clear();
  }
}

// =============================================================================
// BUFFER MANAGER
// =============================================================================

export class BufferManager {
  private video: HTMLVideoElement;
  private config: EngineConfig;
  private bufferHealth: number = 1;
  private downloadSpeeds: number[] = [];
  private maxSpeedSamples: number = 10;

  constructor(video: HTMLVideoElement, config: EngineConfig) {
    this.video = video;
    this.config = config;
  }

  getBufferInfo(): BufferInfo {
    const buffered = this.video.buffered;
    const currentTime = this.video.currentTime;
    
    if (buffered.length === 0) {
      return { start: 0, end: 0, length: 0, ahead: 0 };
    }

    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      
      if (currentTime >= start - 0.1 && currentTime <= end + 0.1) {
        return {
          start,
          end,
          length: end - start,
          ahead: Math.max(0, end - currentTime),
        };
      }
    }

    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      
      if (start > currentTime) {
        return {
          start,
          end,
          length: end - start,
          ahead: 0,
        };
      }
    }

    return { start: 0, end: 0, length: 0, ahead: 0 };
  }

  shouldBuffer(): boolean {
    const buffer = this.getBufferInfo();
    return buffer.ahead < this.config.minBufferLength;
  }

  isBufferHealthy(): boolean {
    const buffer = this.getBufferInfo();
    return buffer.ahead >= this.config.startBufferLength;
  }

  getBufferHealth(): number {
    const buffer = this.getBufferInfo();
    const targetBuffer = this.config.lowLatencyMode 
      ? this.config.targetLatency 
      : this.config.maxBufferLength / 2;
    
    this.bufferHealth = Math.min(1, buffer.ahead / targetBuffer);
    return this.bufferHealth;
  }

  recordDownloadSpeed(bytesLoaded: number, durationMs: number): void {
    if (durationMs > 0) {
      const speedBps = (bytesLoaded * 8 * 1000) / durationMs;
      this.downloadSpeeds.push(speedBps);
      
      if (this.downloadSpeeds.length > this.maxSpeedSamples) {
        this.downloadSpeeds.shift();
      }
    }
  }

  getAverageDownloadSpeed(): number {
    if (this.downloadSpeeds.length === 0) return 0;
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    this.downloadSpeeds.forEach((speed, index) => {
      const weight = index + 1;
      weightedSum += speed * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  getOptimalBitrate(): number {
    const avgSpeed = this.getAverageDownloadSpeed();
    return avgSpeed * 0.7;
  }

  clear(): void {
    this.downloadSpeeds = [];
    this.bufferHealth = 1;
  }
}

// =============================================================================
// QUALITY CONTROLLER
// =============================================================================

export class QualityController {
  private levels: QualityLevel[] = [];
  private currentLevel: number = -1;
  private autoMode: boolean = true;
  private bufferManager: BufferManager;
  private config: EngineConfig;
  private lastSwitch: number = 0;
  private minSwitchInterval: number = 5000;
  private video: HTMLVideoElement;

  constructor(
    video: HTMLVideoElement,
    bufferManager: BufferManager,
    config: EngineConfig
  ) {
    this.video = video;
    this.bufferManager = bufferManager;
    this.config = config;
    this.autoMode = config.autoQuality;
  }

  setLevels(levels: QualityLevel[]): void {
    this.levels = levels.sort((a, b) => a.bitrate - b.bitrate);
  }

  getLevels(): QualityLevel[] {
    return this.levels;
  }

  getCurrentLevel(): QualityLevel | null {
    if (this.currentLevel >= 0 && this.currentLevel < this.levels.length) {
      return this.levels[this.currentLevel];
    }
    return null;
  }

  setCurrentLevel(index: number): void {
    this.currentLevel = index;
  }

  setAutoMode(enabled: boolean): void {
    this.autoMode = enabled;
  }

  isAutoMode(): boolean {
    return this.autoMode;
  }

  selectLevel(index: number): number {
    if (index >= 0 && index < this.levels.length) {
      this.autoMode = false;
      this.currentLevel = index;
      return index;
    }
    return this.currentLevel;
  }

  getOptimalLevel(): number {
    if (this.levels.length === 0) return -1;
    if (!this.autoMode) return this.currentLevel;

    const now = Date.now();
    if (now - this.lastSwitch < this.minSwitchInterval) {
      return this.currentLevel;
    }

    const optimalBitrate = this.bufferManager.getOptimalBitrate();
    const bufferHealth = this.bufferManager.getBufferHealth();
    
    let maxWidth = Infinity;
    let maxHeight = Infinity;
    
    if (this.config.capLevelToPlayerSize) {
      const rect = this.video.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      maxWidth = rect.width * dpr * 1.2;
      maxHeight = rect.height * dpr * 1.2;
    }

    let bestLevel = 0;
    
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      
      if (level.width > maxWidth || level.height > maxHeight) {
        continue;
      }
      
      const adjustedBitrate = optimalBitrate * bufferHealth;
      if (level.bitrate <= adjustedBitrate) {
        bestLevel = i;
        break;
      }
    }

    if (this.currentLevel > 0 && bestLevel < this.currentLevel - 1) {
      bestLevel = this.currentLevel - 1;
    }

    if (bufferHealth < 0.5 && bestLevel > this.currentLevel) {
      bestLevel = this.currentLevel;
    }

    if (bestLevel !== this.currentLevel) {
      this.lastSwitch = now;
      this.currentLevel = bestLevel;
    }

    return this.currentLevel;
  }

  reset(): void {
    this.levels = [];
    this.currentLevel = -1;
    this.autoMode = this.config.autoQuality;
    this.lastSwitch = 0;
  }
}

// =============================================================================
// ERROR RECOVERY
// =============================================================================

interface RecoveryAction {
  action: 'retry' | 'seek' | 'reload' | 'switchQuality' | 'fatal';
  delay: number;
  details?: string;
}

export class ErrorRecovery {
  private config: EngineConfig;
  private errorCounts: Map<string, number> = new Map();
  private lastErrorTime: Map<string, number> = new Map();
  private recoveryAttempts: number = 0;
  private errorWindow: number = 30000;

  constructor(config: EngineConfig) {
    this.config = config;
  }

  analyzeError(error: EngineError): RecoveryAction {
    const now = Date.now();
    const errorKey = error.code;
    
    const lastTime = this.lastErrorTime.get(errorKey) || 0;
    if (now - lastTime > this.errorWindow) {
      this.errorCounts.set(errorKey, 0);
    }
    
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);
    this.lastErrorTime.set(errorKey, now);
    this.recoveryAttempts++;

    if (this.recoveryAttempts > this.config.maxRetries * 2) {
      return { action: 'fatal', delay: 0, details: 'Max recovery attempts exceeded' };
    }

    if (error.code.includes('NETWORK') || error.code.includes('TIMEOUT')) {
      if (count <= this.config.maxRetries) {
        const delay = Math.min(this.config.retryDelay * Math.pow(1.5, count - 1), 10000);
        return { action: 'retry', delay, details: `Network retry ${count}/${this.config.maxRetries}` };
      }
      return { action: 'reload', delay: 1000, details: 'Network error - full reload' };
    }

    if (error.code.includes('FRAG') || error.code.includes('SEGMENT')) {
      if (count <= 3) {
        return { action: 'retry', delay: this.config.fragmentRetryDelay, details: 'Fragment retry' };
      }
      if (count <= 6) {
        return { action: 'seek', delay: 100, details: 'Seek past bad fragment' };
      }
      return { action: 'switchQuality', delay: 500, details: 'Switch quality due to fragment errors' };
    }

    if (error.code.includes('LEVEL') || error.code.includes('MANIFEST')) {
      if (count <= this.config.levelLoadingMaxRetry) {
        return { action: 'retry', delay: this.config.retryDelay, details: 'Level/manifest retry' };
      }
      return { action: 'switchQuality', delay: 500, details: 'Switch quality due to level errors' };
    }

    if (error.code.includes('BUFFER')) {
      if (count <= 2) {
        return { action: 'seek', delay: 100, details: 'Seek to recover buffer' };
      }
      return { action: 'reload', delay: 500, details: 'Reload due to buffer errors' };
    }

    if (error.code.includes('DECODE') || error.code.includes('MEDIA')) {
      if (count <= 2) {
        return { action: 'seek', delay: 200, details: 'Seek past decode error' };
      }
      if (count <= 4) {
        return { action: 'switchQuality', delay: 300, details: 'Switch quality due to decode errors' };
      }
      return { action: 'reload', delay: 1000, details: 'Reload due to decode errors' };
    }

    if (count <= 3) {
      return { action: 'retry', delay: this.config.retryDelay, details: 'Generic retry' };
    }

    return { action: 'fatal', delay: 0, details: 'Unrecoverable error' };
  }

  reset(): void {
    this.errorCounts.clear();
    this.lastErrorTime.clear();
    this.recoveryAttempts = 0;
  }

  getRecoveryAttempts(): number {
    return this.recoveryAttempts;
  }
}

// =============================================================================
// HLS ADAPTER
// =============================================================================

interface HLSAdapterEvents {
  qualityLevelsLoaded: (levels: QualityLevel[]) => void;
  qualityChanged: (level: QualityLevel) => void;
  error: (error: EngineError) => void;
  fragmentLoaded: (stats: { bytes: number; duration: number }) => void;
  recovered: () => void;
}

export class HLSAdapter {
  private hls: Hls | null = null;
  private video: HTMLVideoElement;
  private config: EngineConfig;
  private events: HLSAdapterEvents;
  private levels: QualityLevel[] = [];
  private currentUrl: string = '';

  constructor(video: HTMLVideoElement, config: EngineConfig, events: HLSAdapterEvents) {
    this.video = video;
    this.config = config;
    this.events = events;
  }

  static isSupported(): boolean {
    return Hls.isSupported();
  }

  static canPlay(url: string): boolean {
    return /\.(m3u8|m3u)($|\?)/i.test(url) || url.includes('.m3u8') || url.includes('/hls/');
  }

  async load(url: string, startPosition?: number): Promise<void> {
    this.destroy();
    this.currentUrl = url;

    return new Promise((resolve, reject) => {
      this.hls = new Hls({
        maxBufferLength: this.config.maxBufferLength,
        maxMaxBufferLength: this.config.maxBufferLength * 2,
        maxBufferSize: this.config.maxBufferSize,
        maxBufferHole: 0.5,
        lowLatencyMode: this.config.lowLatencyMode,
        backBufferLength: this.config.lowLatencyMode ? 0 : 30,
        enableWorker: this.config.enableWorker,
        enableSoftwareAES: this.config.enableSoftwareAES,
        startLevel: this.config.startLevel,
        autoStartLoad: true,
        startPosition: startPosition || -1,
        fragLoadingMaxRetry: this.config.maxRetries,
        fragLoadingRetryDelay: this.config.fragmentRetryDelay,
        manifestLoadingMaxRetry: this.config.maxRetries,
        manifestLoadingRetryDelay: this.config.retryDelay,
        levelLoadingMaxRetry: this.config.levelLoadingMaxRetry,
        levelLoadingRetryDelay: this.config.retryDelay,
        debug: this.config.debug,
        xhrSetup: (xhr, url) => {
          xhr.timeout = 30000;
          xhr.withCredentials = false;
          // Set User-Agent that IPTV servers expect
          try {
            xhr.setRequestHeader('User-Agent', 'IPTV Smarters Pro');
          } catch (e) {
            // Browser may block User-Agent header modification
          }
          console.log('[HLS] Loading:', url);
        },
      });

      this.hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        this.levels = data.levels.map((level, index) => ({
          index,
          bitrate: level.bitrate,
          width: level.width,
          height: level.height,
          codec: level.videoCodec,
          name: `${level.height}p`,
        }));
        this.events.qualityLevelsLoaded(this.levels);
        resolve();
      });

      this.hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = this.levels[data.level];
        if (level) {
          this.events.qualityChanged(level);
        }
      });

      this.hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
        this.events.fragmentLoaded({
          bytes: data.frag.stats.total,
          duration: data.frag.stats.loading.end - data.frag.stats.loading.start,
        });
      });

      this.hls.on(Hls.Events.ERROR, (_event, data) => {
        const error: EngineError = {
          code: `HLS_${data.type}_${data.details}`,
          message: data.error?.message || data.details,
          fatal: data.fatal,
          details: data,
        };

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.hls?.recoverMediaError();
              break;
            default:
              reject(error);
              break;
          }
        }

        this.events.error(error);
      });

      this.hls.loadSource(url);
      this.hls.attachMedia(this.video);
    });
  }

  setQuality(level: number): void {
    if (this.hls) {
      this.hls.currentLevel = level;
    }
  }

  setAutoQuality(enabled: boolean): void {
    if (this.hls) {
      this.hls.currentLevel = enabled ? -1 : this.hls.currentLevel;
    }
  }

  getCurrentLevel(): number {
    return this.hls?.currentLevel ?? -1;
  }

  getLevels(): QualityLevel[] {
    return this.levels;
  }

  recoverError(): void {
    if (this.hls) {
      this.hls.recoverMediaError();
    }
  }

  reload(): void {
    if (this.hls && this.currentUrl) {
      this.hls.loadSource(this.currentUrl);
    }
  }

  destroy(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.levels = [];
  }

  getLatency(): number {
    if (this.hls?.latency !== undefined) {
      return this.hls.latency;
    }
    return 0;
  }
}

// =============================================================================
// DASH ADAPTER
// =============================================================================

interface DASHAdapterEvents {
  qualityLevelsLoaded: (levels: QualityLevel[]) => void;
  qualityChanged: (level: QualityLevel) => void;
  error: (error: EngineError) => void;
  fragmentLoaded: (stats: { bytes: number; duration: number }) => void;
  recovered: () => void;
}

export class DASHAdapter {
  private player: dashjs.MediaPlayerClass | null = null;
  private video: HTMLVideoElement;
  private config: EngineConfig;
  private events: DASHAdapterEvents;
  private levels: QualityLevel[] = [];
  private currentUrl: string = '';

  constructor(video: HTMLVideoElement, config: EngineConfig, events: DASHAdapterEvents) {
    this.video = video;
    this.config = config;
    this.events = events;
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'MediaSource' in window;
  }

  static canPlay(url: string): boolean {
    return /\.(mpd)($|\?)/i.test(url) || url.includes('.mpd');
  }

  async load(url: string, startPosition?: number): Promise<void> {
    this.destroy();
    this.currentUrl = url;

    return new Promise((resolve) => {
      this.player = dashjs.MediaPlayer().create();
      
      this.player.updateSettings({
        streaming: {
          buffer: {
            bufferTimeAtTopQuality: this.config.maxBufferLength,
            bufferTimeAtTopQualityLongForm: this.config.maxBufferLength,
            bufferToKeep: 30,
            bufferPruningInterval: 10,
          },
          abr: {
            autoSwitchBitrate: { video: this.config.autoQuality },
            limitBitrateByPortal: this.config.capLevelToPlayerSize,
          },
          retryAttempts: {
            MPD: this.config.maxRetries,
            MediaSegment: this.config.maxRetries,
            InitializationSegment: this.config.maxRetries,
          },
          retryIntervals: {
            MPD: this.config.retryDelay,
            MediaSegment: this.config.fragmentRetryDelay,
            InitializationSegment: this.config.retryDelay,
            BitstreamSwitchingSegment: this.config.retryDelay,
          },
        },
      });

      this.player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bitrateList = (this.player as any)?.getBitrateInfoListFor?.('video') || [];
        this.levels = bitrateList.map((info: { bitrate: number; width: number; height: number }, index: number) => ({
          index,
          bitrate: info.bitrate,
          width: info.width,
          height: info.height,
          name: `${info.height}p`,
        }));
        this.events.qualityLevelsLoaded(this.levels);
        resolve();
      });

      this.player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, (e: { mediaType: string; newQuality: number }) => {
        if (e.mediaType === 'video') {
          const level = this.levels[e.newQuality];
          if (level) {
            this.events.qualityChanged(level);
          }
        }
      });

      this.player.on(dashjs.MediaPlayer.events.ERROR, (e: { error: { code: number; message: string } }) => {
        const error: EngineError = {
          code: `DASH_ERROR_${e.error?.code || 'UNKNOWN'}`,
          message: e.error?.message || 'DASH playback error',
          fatal: true,
          details: e,
        };
        this.events.error(error);
      });

      this.player.initialize(this.video, url, false);
      
      if (startPosition && startPosition > 0) {
        this.player.seek(startPosition);
      }
    });
  }

  setQuality(level: number): void {
    if (this.player) {
      this.player.updateSettings({
        streaming: {
          abr: {
            autoSwitchBitrate: { video: false },
          },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.player as any).setQualityFor?.('video', level);
    }
  }

  setAutoQuality(enabled: boolean): void {
    if (this.player) {
      this.player.updateSettings({
        streaming: {
          abr: {
            autoSwitchBitrate: { video: enabled },
          },
        },
      });
    }
  }

  getCurrentLevel(): number {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.player as any)?.getQualityFor?.('video') ?? -1;
  }

  getLevels(): QualityLevel[] {
    return this.levels;
  }

  recoverError(): void {
    if (this.currentUrl) {
      this.load(this.currentUrl);
    }
  }

  destroy(): void {
    if (this.player) {
      this.player.reset();
      this.player = null;
    }
    this.levels = [];
  }

  getLatency(): number {
    return this.player?.getCurrentLiveLatency() || 0;
  }
}

// =============================================================================
// NATIVE ADAPTER
// =============================================================================

interface NativeAdapterEvents {
  qualityLevelsLoaded: (levels: QualityLevel[]) => void;
  qualityChanged: (level: QualityLevel) => void;
  error: (error: EngineError) => void;
  fragmentLoaded: (stats: { bytes: number; duration: number }) => void;
  recovered: () => void;
}

export class NativeAdapter {
  private video: HTMLVideoElement;
  private config: EngineConfig;
  private events: NativeAdapterEvents;
  private levels: QualityLevel[] = [];
  private currentUrl: string = '';

  constructor(video: HTMLVideoElement, config: EngineConfig, events: NativeAdapterEvents) {
    this.video = video;
    this.config = config;
    this.events = events;
  }

  static isSupported(): boolean {
    return true;
  }

  static canPlay(url: string): boolean {
    const nativeExtensions = /\.(mp4|webm|ogg|mov|mkv)($|\?)/i;
    const isNative = nativeExtensions.test(url);
    const isNotHLS = !url.includes('.m3u8') && !url.includes('.m3u');
    const isNotDASH = !url.includes('.mpd');
    return isNative || (isNotHLS && isNotDASH && !url.includes('/hls/'));
  }

  async load(url: string, startPosition?: number): Promise<void> {
    this.currentUrl = url;
    
    return new Promise((resolve, reject) => {
      const onLoadedMetadata = () => {
        this.video.removeEventListener('loadedmetadata', onLoadedMetadata);
        this.video.removeEventListener('error', onError);
        
        const level: QualityLevel = {
          index: 0,
          bitrate: 0,
          width: this.video.videoWidth,
          height: this.video.videoHeight,
          name: `${this.video.videoHeight}p`,
        };
        this.levels = [level];
        this.events.qualityLevelsLoaded(this.levels);
        this.events.qualityChanged(level);
        
        if (startPosition && startPosition > 0) {
          this.video.currentTime = startPosition;
        }
        
        resolve();
      };

      const onError = () => {
        this.video.removeEventListener('loadedmetadata', onLoadedMetadata);
        this.video.removeEventListener('error', onError);
        
        const error: EngineError = {
          code: 'NATIVE_LOAD_ERROR',
          message: 'Failed to load video',
          fatal: true,
        };
        this.events.error(error);
        reject(error);
      };

      this.video.addEventListener('loadedmetadata', onLoadedMetadata);
      this.video.addEventListener('error', onError);
      this.video.src = url;
      this.video.load();
    });
  }

  setQuality(_level: number): void {
    // Native doesn't support quality switching
  }

  setAutoQuality(_enabled: boolean): void {
    // Native doesn't support auto quality
  }

  getCurrentLevel(): number {
    return 0;
  }

  getLevels(): QualityLevel[] {
    return this.levels;
  }

  recoverError(): void {
    if (this.currentUrl) {
      this.video.src = this.currentUrl;
      this.video.load();
    }
  }

  reload(): void {
    if (this.currentUrl) {
      this.video.src = this.currentUrl;
      this.video.load();
    }
  }

  destroy(): void {
    this.video.src = '';
    this.levels = [];
  }

  getLatency(): number {
    return 0;
  }
}

// =============================================================================
// STREAMING ENGINE
// =============================================================================

type StreamAdapter = HLSAdapter | DASHAdapter | NativeAdapter;

export class StreamingEngine extends EventEmitter<EngineEvents> {
  private video: HTMLVideoElement;
  private config: EngineConfig;
  private adapter: StreamAdapter | null = null;
  private bufferManager: BufferManager;
  private qualityController: QualityController;
  private errorRecovery: ErrorRecovery;
  private state: PlaybackState = 'idle';
  private statsInterval: number | null = null;
  private currentStreamConfig: StreamConfig | null = null;
  private streamType: 'hls' | 'dash' | 'native' = 'native';

  constructor(video: HTMLVideoElement, config: Partial<EngineConfig> = {}) {
    super();
    this.video = video;
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.bufferManager = new BufferManager(video, this.config);
    this.qualityController = new QualityController(video, this.bufferManager, this.config);
    this.errorRecovery = new ErrorRecovery(this.config);
    this.setupVideoEvents();
  }

  private setupVideoEvents(): void {
    this.video.addEventListener('loadstart', () => this.setState('loading'));
    this.video.addEventListener('waiting', () => {
      if (this.state !== 'seeking') this.setState('buffering');
    });
    this.video.addEventListener('playing', () => this.setState('playing'));
    this.video.addEventListener('pause', () => {
      if (this.state !== 'seeking' && this.state !== 'buffering') {
        this.setState('paused');
      }
    });
    this.video.addEventListener('seeking', () => this.setState('seeking'));
    this.video.addEventListener('seeked', () => this.handleSeeked());
    this.video.addEventListener('ended', () => {
      this.setState('ended');
      this.emitNoArgs('ended');
    });
    
    this.video.addEventListener('timeupdate', () => {
      this.emit('timeUpdate', this.video.currentTime, this.video.duration);
    });

    this.video.addEventListener('progress', () => {
      this.emit('bufferUpdate', this.bufferManager.getBufferInfo());
    });

    this.video.addEventListener('error', () => {
      const mediaError = this.video.error;
      if (mediaError) {
        this.handleError({
          code: `MEDIA_ERROR_${mediaError.code}`,
          message: mediaError.message || 'Media playback error',
          fatal: true,
          details: mediaError,
        });
      }
    });
  }

  private handleSeeked(): void {
    if (this.video.paused) {
      this.setState('paused');
    } else {
      this.setState('playing');
    }
  }

  private setState(newState: PlaybackState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.emit('stateChange', newState);
    }
  }

  private detectStreamType(url: string): 'hls' | 'dash' | 'native' {
    if (HLSAdapter.canPlay(url)) return 'hls';
    if (DASHAdapter.canPlay(url)) return 'dash';
    return 'native';
  }

  private createAdapter(): StreamAdapter {
    const adapterEvents = {
      qualityLevelsLoaded: (levels: QualityLevel[]) => {
        this.qualityController.setLevels(levels);
        this.emit('qualityLevelsLoaded', levels);
      },
      qualityChanged: (level: QualityLevel) => {
        this.qualityController.setCurrentLevel(level.index);
        this.emit('qualityChange', level);
      },
      error: (error: EngineError) => {
        this.handleError(error);
      },
      fragmentLoaded: (stats: { bytes: number; duration: number }) => {
        this.bufferManager.recordDownloadSpeed(stats.bytes, stats.duration);
      },
      recovered: () => {
        this.emitNoArgs('recovered');
      },
    };

    switch (this.streamType) {
      case 'hls':
        if (!HLSAdapter.isSupported()) {
          throw new Error('HLS is not supported in this browser');
        }
        return new HLSAdapter(this.video, this.config, adapterEvents);
      case 'dash':
        if (!DASHAdapter.isSupported()) {
          throw new Error('DASH is not supported in this browser');
        }
        return new DASHAdapter(this.video, this.config, adapterEvents);
      default:
        return new NativeAdapter(this.video, this.config, adapterEvents);
    }
  }

  async load(streamConfig: StreamConfig): Promise<void> {
    try {
      this.unload();
      this.currentStreamConfig = streamConfig;
      
      if (streamConfig.lowLatencyMode !== undefined) {
        this.config.lowLatencyMode = streamConfig.lowLatencyMode;
      }

      this.streamType = streamConfig.type === 'auto' || !streamConfig.type
        ? this.detectStreamType(streamConfig.url)
        : streamConfig.type === 'direct' ? 'native' : streamConfig.type;

      this.adapter = this.createAdapter();
      await this.adapter.load(streamConfig.url, streamConfig.startPosition);
      
      this.startStatsCollection();
      this.errorRecovery.reset();
      
    } catch (error) {
      this.handleError({
        code: 'LOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to load stream',
        fatal: true,
        details: error,
      });
      throw error;
    }
  }

  private startStatsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    this.statsInterval = window.setInterval(() => {
      this.collectStats();
    }, 1000);
  }

  private collectStats(): void {
    const quality = this.qualityController.getCurrentLevel();
    
    let fps = 0;
    let droppedFrames = 0;
    
    if ('getVideoPlaybackQuality' in this.video) {
      const playbackQuality = (this.video as HTMLVideoElement & { 
        getVideoPlaybackQuality: () => { totalVideoFrames: number; droppedVideoFrames: number } 
      }).getVideoPlaybackQuality();
      fps = playbackQuality.totalVideoFrames;
      droppedFrames = playbackQuality.droppedVideoFrames;
    }

    const stats: EngineStats = {
      currentTime: this.video.currentTime,
      duration: this.video.duration || 0,
      buffered: this.bufferManager.getBufferInfo(),
      bitrate: quality?.bitrate || 0,
      fps,
      droppedFrames,
      latency: this.adapter?.getLatency() || 0,
      downloadSpeed: this.bufferManager.getAverageDownloadSpeed(),
      qualityLevel: quality,
      state: this.state,
    };

    this.emit('stats', stats);
  }

  private handleError(error: EngineError): void {
    this.emit('error', error);
    
    if (error.fatal) {
      this.setState('error');
      const recovery = this.errorRecovery.analyzeError(error);
      this.executeRecovery(recovery);
    }
  }

  private executeRecovery(recovery: { action: string; delay: number; details?: string }): void {
    if (this.config.debug) {
      console.log(`[StreamingEngine] Recovery: ${recovery.action} - ${recovery.details}`);
    }

    setTimeout(() => {
      switch (recovery.action) {
        case 'retry':
          this.adapter?.recoverError();
          break;
        case 'seek':
          this.video.currentTime += 1;
          break;
        case 'reload':
          if (this.currentStreamConfig) {
            this.load(this.currentStreamConfig);
          }
          break;
        case 'switchQuality':
          const levels = this.qualityController.getLevels();
          const currentLevel = this.qualityController.getCurrentLevel();
          if (currentLevel && currentLevel.index > 0) {
            this.setQuality(currentLevel.index - 1);
          } else if (levels.length > 0) {
            this.setQuality(0);
          }
          break;
        case 'fatal':
          console.error('[StreamingEngine] Fatal error - cannot recover');
          break;
      }
    }, recovery.delay);
  }

  // ==================== PUBLIC API ====================

  async play(): Promise<void> {
    try {
      await this.video.play();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.handleError({
          code: 'PLAY_ERROR',
          message: (error as Error).message,
          fatal: false,
          details: error,
        });
      }
    }
  }

  pause(): void {
    this.video.pause();
  }

  seek(time: number): void {
    if (isFinite(time) && time >= 0) {
      this.video.currentTime = Math.min(time, this.video.duration || time);
    }
  }

  setVolume(volume: number): void {
    this.video.volume = Math.max(0, Math.min(1, volume));
  }

  setMuted(muted: boolean): void {
    this.video.muted = muted;
  }

  setPlaybackRate(rate: number): void {
    this.video.playbackRate = Math.max(0.25, Math.min(4, rate));
  }

  setQuality(level: number): void {
    this.qualityController.selectLevel(level);
    this.adapter?.setQuality(level);
  }

  setAutoQuality(enabled: boolean): void {
    this.qualityController.setAutoMode(enabled);
    this.adapter?.setAutoQuality(enabled);
  }

  getCurrentTime(): number {
    return this.video.currentTime;
  }

  getDuration(): number {
    return this.video.duration || 0;
  }

  getBufferInfo(): BufferInfo {
    return this.bufferManager.getBufferInfo();
  }

  getState(): PlaybackState {
    return this.state;
  }

  getStats(): EngineStats {
    return {
      currentTime: this.video.currentTime,
      duration: this.video.duration || 0,
      buffered: this.bufferManager.getBufferInfo(),
      bitrate: this.qualityController.getCurrentLevel()?.bitrate || 0,
      fps: 0,
      droppedFrames: 0,
      latency: this.adapter?.getLatency() || 0,
      downloadSpeed: this.bufferManager.getAverageDownloadSpeed(),
      qualityLevel: this.qualityController.getCurrentLevel(),
      state: this.state,
    };
  }

  getQualityLevels(): QualityLevel[] {
    return this.qualityController.getLevels();
  }

  getCurrentQuality(): QualityLevel | null {
    return this.qualityController.getCurrentLevel();
  }

  isAutoQuality(): boolean {
    return this.qualityController.isAutoMode();
  }

  unload(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    
    this.adapter?.destroy();
    this.adapter = null;
    this.bufferManager.clear();
    this.qualityController.reset();
    this.errorRecovery.reset();
    this.currentStreamConfig = null;
    this.setState('idle');
  }

  destroy(): void {
    this.unload();
    this.removeAllListeners();
  }

  static isSupported(): { hls: boolean; dash: boolean; native: boolean } {
    return {
      hls: HLSAdapter.isSupported(),
      dash: DASHAdapter.isSupported(),
      native: true,
    };
  }
}

export default StreamingEngine;
