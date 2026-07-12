
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, Lock, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [playbackRate, setPlaybackRate] = useState("1");
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

  useEffect(() => {
    if (!videoId) return;

    const loadScript = () => {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    };

    const initPlayer = () => {
      if (playerRef.current || !videoId || !window.YT || !window.YT.Player) return;
      
      try {
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
              // تطبيق السرعة المختارة عند الجاهزية
              event.target.setPlaybackRate(parseFloat(playbackRate));
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                if (onCompleteRef.current && !completionTriggeredRef.current) {
                  completionTriggeredRef.current = true;
                  onCompleteRef.current();
                }
              }
              showControls();
            },
            onError: () => {
              setIsReady(true);
            }
          },
        });
      } catch (err) {
        console.error("YT Player Init Error:", err);
      }
    };

    loadScript();

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        
        const total = playerRef.current.getDuration();
        if (total > 0) {
          setDuration(total);
        }
      }
    }, 500);

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("fullscreenchange", handleFsChange);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, showControls]);

  const handleTogglePlay = (e?: any) => {
    e?.stopPropagation();
    if (!playerRef.current || !isReady) return;
    const state = playerRef.current.getPlayerState();
    if (state === window.YT.PlayerState.PLAYING) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleToggleMute = (e?: any) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const toggleFullScreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        try {
          if (window.screen?.orientation?.lock) {
            await (window.screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch (e) {}
      } else {
        await document.exitFullscreen();
        try {
          if (window.screen?.orientation?.unlock) {
            window.screen.orientation.unlock();
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error("Fullscreen logic error:", err);
    }
  };

  const handleSeek = (values: number[]) => {
    if (!canSeek || !playerRef.current) return;
    const time = values[0];
    playerRef.current.seekTo(time, true);
    setCurrentTime(time);
  };

  const handleRateChange = (rate: string) => {
    setPlaybackRate(rate);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(parseFloat(rate));
    }
  };

  if (!videoId) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-muted flex flex-col items-center justify-center gap-4 border-2 border-dashed border-primary/20">
        <AlertCircle className="w-12 h-12 text-muted-foreground/50" />
        <p className="text-muted-foreground font-bold text-center px-4">يرجى إضافة رابط يوتيوب صحيح للدرس</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        onMouseMove={showControls}
        className={cn(
          "relative aspect-video rounded-2xl overflow-hidden bg-black luxury-shadow border border-border select-none transition-all duration-300",
          isFullscreen && "rounded-none border-none fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center"
        )}
      >
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center z-[100] bg-background/50 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          </div>
        )}

        <div className="w-full h-full">
          <div id="youtube-player-element" className="w-full h-full" />
          <div 
            className="absolute inset-0 z-[50] cursor-pointer" 
            onClick={handleTogglePlay}
          />
        </div>

        <div 
          className={cn(
            "absolute z-[300] bottom-0 left-0 right-0 p-4 md:p-6 transition-all duration-500 bg-gradient-to-t from-black/90 via-black/40 to-transparent",
            controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 group/seek">
               <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  disabled={!canSeek}
                  className={cn(
                    "flex-1 transition-all",
                    !canSeek ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  )}
               />
               {!canSeek && (
                 <div className="p-1 bg-white/10 rounded-lg text-white/50" title="يجب إكمال الفيديو أولاً لتتمكن من التقديم">
                   <Lock className="w-3 h-3" />
                 </div>
               )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="text-white hover:text-secondary transition-transform active:scale-90" onClick={handleTogglePlay}>
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                </button>

                <div className="flex items-center gap-2 text-[11px] md:text-sm font-mono text-white/90" dir="ltr">
                  <span className="text-secondary font-bold">{formatTime(currentTime)}</span>
                  <span className="opacity-30">/</span>
                  <span className="opacity-70">{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                {/* زر سرعة التشغيل الجديد */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                      <Gauge className="w-4 h-4" />
                      <span className="text-[10px] md:text-xs font-black">{playbackRate}x</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-primary/10 rounded-xl min-w-[100px]">
                    <DropdownMenuRadioGroup value={playbackRate} onValueChange={handleRateChange}>
                      <DropdownMenuRadioItem value="0.5" className="text-xs font-bold py-2">0.5x (بطيء)</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="1" className="text-xs font-bold py-2">1x (عادي)</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="1.5" className="text-xs font-bold py-2">1.5x (سريع)</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="2" className="text-xs font-bold py-2">2x (سريع جداً)</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button className="text-white hover:text-secondary p-1" onClick={handleToggleMute}>
                  {isMuted || currentTime === 0 ? <VolumeX className="w-5 h-5 text-destructive" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button className="text-white hover:text-secondary p-1" onClick={toggleFullScreen}>
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
