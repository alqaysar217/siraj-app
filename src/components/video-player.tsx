
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, Lock, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
  videoId: string | null | undefined;
  onComplete?: () => void;
  canSeek?: boolean;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function VideoPlayer({ videoId: initialVideoId, onComplete, canSeek = false }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completionTriggeredRef = useRef(false);
  
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false); 
  const [isPortrait, setIsPortrait] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setMounted(true);
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', checkOrientation);
    checkOrientation();
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const extractId = (input: string | null | undefined) => {
    if (!input) return null;
    const cleanInput = input.trim();
    if (cleanInput.length === 11 && !cleanInput.includes('/')) return cleanInput;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = cleanInput.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const videoId = extractId(initialVideoId);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 4000);
  }, []);

  const initPlayer = useCallback(() => {
    if (!videoId || !window.YT || !window.YT.Player || playerRef.current) return;
    
    playerRef.current = new window.YT.Player('youtube-player-element', {
      height: "100%",
      width: "100%",
      videoId: videoId,
      playerVars: {
        controls: 0,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
        autoplay: 1,
        loop: 0
      },
      events: {
        onReady: (event: any) => {
          setIsReady(true);
          setDuration(event.target.getDuration());
          event.target.setPlaybackRate(playbackRate);
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
          else if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
          else if (event.data === window.YT.PlayerState.ENDED) {
            if (onCompleteRef.current && !completionTriggeredRef.current) {
              completionTriggeredRef.current = true;
              onCompleteRef.current();
            }
          }
          showControls();
        }
      },
    });
  }, [videoId, playbackRate, showControls]);

  useEffect(() => {
    if (!videoId || !mounted) return;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 500);

    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs && !isPseudoFullscreen) {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock().catch(() => {});
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, mounted, initPlayer, isPseudoFullscreen]);

  const toggleFullScreen = async () => {
    if (!containerRef.current) return;

    // حالة الخروج
    if (document.fullscreenElement || isPseudoFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      setIsPseudoFullscreen(false);
      document.body.style.overflow = "";
      return;
    }

    // محاولة التكبير الرسمي (أندرويد / حاسوب)
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) throw new Error("ios_detected");

      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        await (containerRef.current as any).webkitRequestFullscreen();
      } else {
        throw new Error("unsupported");
      }

      // محاولة قفل الاتجاه عرضياً (للأندرويد)
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch (err) {
      // حل بديل للآيفون (التدوير البرمجي)
      setIsPseudoFullscreen(true);
      document.body.style.overflow = "hidden";
    }
  };

  const handleSeek = (values: number[]) => {
    if (!canSeek || !playerRef.current) return;
    playerRef.current.seekTo(values[0], true);
    setCurrentTime(values[0]);
  };

  const toggleSpeed = (e: any) => {
    e.stopPropagation();
    const nextRate = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
    setPlaybackRate(nextRate);
    if (playerRef.current?.setPlaybackRate) playerRef.current.setPlaybackRate(nextRate);
  };

  if (!mounted) return <div className="w-full aspect-video rounded-2xl bg-black" />;
  if (!videoId) return <div className="w-full aspect-video rounded-2xl bg-muted flex flex-col items-center justify-center gap-4"><AlertCircle className="w-12 h-12 opacity-20" /><p className="text-xs font-bold opacity-50">رابط الفيديو غير مدعوم</p></div>;

  // دوران المحتوى للآيفون فقط في الوضع الطولي عند تفعيل التكبير البديل
  const isIOS = mounted && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const forceLandscape = isPseudoFullscreen && isPortrait && isIOS;

  return (
    <div 
      ref={containerRef}
      onMouseMove={showControls}
      className={cn(
        "relative aspect-video rounded-2xl overflow-hidden bg-black transition-all duration-300",
        isFullscreen && "rounded-none border-none",
        isPseudoFullscreen && "fixed inset-0 z-[9999] w-full h-full bg-black flex items-center justify-center"
      )}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      )}

      <div 
        className={cn(
          "relative transition-all duration-500 bg-black overflow-hidden flex items-center justify-center",
          forceLandscape ? "fixed top-1/2 left-1/2 w-[100vh] h-[100vw] -translate-x-1/2 -translate-y-1/2 rotate-90" : "w-full h-full"
        )}
      >
        <div id="youtube-player-element" className="w-full h-full pointer-events-none" />
        
        <div 
          className="absolute inset-0 z-[50] cursor-pointer" 
          onClick={() => {
            if (!playerRef.current) return;
            playerRef.current.getPlayerState() === 1 ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
          }} 
        />

        <div 
          className={cn(
            "absolute z-[300] bottom-0 left-0 right-0 p-4 md:p-6 transition-all duration-500 bg-gradient-to-t from-black via-black/40 to-transparent",
            controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          <div className="space-y-4 max-w-4xl mx-auto w-full px-2">
            <div className="flex items-center gap-3">
               <Slider value={[currentTime]} max={duration || 100} step={1} onValueChange={handleSeek} disabled={!canSeek} className={cn("flex-1", !canSeek && "opacity-50")} />
               {!canSeek && <Lock className="w-3 h-3 text-white/40" />}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="text-white active:scale-90 transition-transform" onClick={() => playerRef.current?.getPlayerState() === 1 ? playerRef.current.pauseVideo() : playerRef.current.playVideo()}>
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                </button>
                <div className="text-[11px] font-mono text-white/90" dir="ltr">
                  <span className="text-secondary font-bold">{formatTime(currentTime)}</span>
                  <span className="opacity-30 px-1">/</span>
                  <span className="opacity-70">{formatTime(duration)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={toggleSpeed} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/5 active:scale-95">
                  <Gauge className="w-4 h-4 text-secondary" />
                  <span className="text-[10px] font-black">{playbackRate === 1 ? '1x' : playbackRate + 'x'}</span>
                </button>
                <button className="text-white p-1" onClick={() => isMuted ? (playerRef.current?.unMute(), setIsMuted(false)) : (playerRef.current?.mute(), setIsMuted(true))}>
                  {isMuted ? <VolumeX className="w-5 h-5 text-destructive" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button className="text-white p-1" onClick={toggleFullScreen}>
                  {(isFullscreen || isPseudoFullscreen) ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
