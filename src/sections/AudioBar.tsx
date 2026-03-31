import { Button } from "@/components/ui/button";
import {
  Pause,
  Play,
  Volume2,
  SkipBack,
  SkipForward,
  VolumeX,
  ChevronDown,
  ListMusic,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { getCoverImageSrc } from "@/utils/coverImage";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {};

export default function AudioBar({}: Props) {
  const {
    book,
    bookFileLocation,
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    pause,
    setVolume,
    skipBackward,
    skipForward,
    seek,
    chapters,
    currentChapter,
    seekToChapter,
  } = useAudioPlayer();
  
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePlayPause = async () => {
    if (!book) return;
    
    if (isPlaying) {
      await pause();
    } else {
      await play(book.id);
    }
  };

  const handleSkipBackward = () => {
    skipBackward(10);
  };

  const handleSkipForward = () => {
    skipForward(30);
  };

  const handleChapterSelect = (value: string) => {
    seekToChapter(parseInt(value, 10));
  };

  const hasChapters = chapters.length > 0 && currentChapter !== null;

  const displayProgress = hasChapters
    ? ((currentTime - currentChapter.start_time) / (currentChapter.end_time - currentChapter.start_time)) * 100
    : duration > 0 ? (currentTime / duration) * 100 : 0;

  const displayElapsed = hasChapters ? currentTime - currentChapter.start_time : currentTime;
  const displayDuration = hasChapters ? currentChapter.end_time - currentChapter.start_time : duration;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    if (hasChapters) {
      const newTime = currentChapter.start_time + percent * (currentChapter.end_time - currentChapter.start_time);
      seek(newTime);
    } else if (duration) {
      const newTime = percent * duration;
      seek(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:bg-background/80 md:backdrop-blur-xl md:supports-backdrop-filter:bg-background/60 md:border-border/40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop View */}
        <div className="hidden md:block py-3">
          <div className="flex items-center gap-6">
            {/* Book Info */}
            <div className="flex items-center gap-3 min-w-[200px] max-w-[280px]">
              <img
                src={getCoverImageSrc(book?.cover_image)}
                alt="Now playing"
                className="w-14 h-14 rounded-md object-cover shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{book?.name || "No book selected"}</div>
                <div className="text-xs text-muted-foreground truncate">{book?.author || ""}</div>
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex-1 flex flex-col gap-2 max-w-2xl mx-auto">
              {hasChapters && (
                <Select
                  value={String(currentChapter.chapter_index)}
                  onValueChange={handleChapterSelect}
                >
                  <SelectTrigger className="h-7 max-w-xs text-xs text-muted-foreground border-none bg-transparent mx-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="top" className="max-h-[480px] overflow-y-auto">
                    {chapters.map((ch) => (
                      <SelectItem key={ch.id} value={String(ch.chapter_index)}>
                        {ch.title || `Chapter ${ch.chapter_index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleSkipBackward}
                  disabled={!bookFileLocation}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={handlePlayPause}
                  disabled={!bookFileLocation}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleSkipForward}
                  disabled={!bookFileLocation}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums min-w-12 text-right">
                  {formatTime(displayElapsed)}
                </span>
                <div className="flex-1 cursor-pointer group" onClick={handleProgressClick}>
                  <Progress value={displayProgress} className="h-1.5 group-hover:h-2 transition-all" />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums min-w-12">
                  {formatTime(displayDuration)}
                </span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 min-w-[140px] justify-end">
              {volume === 0 ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              )}
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
            <div>
              <div className="cursor-pointer" onClick={handleProgressClick}>
                <Progress value={displayProgress} className="h-1 rounded-none" />
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <SheetTrigger asChild>
                  <img
                    src={getCoverImageSrc(book?.cover_image)}
                    alt="Now playing"
                    className="w-12 h-12 rounded-md object-cover shrink-0 cursor-pointer"
                  />
                </SheetTrigger>
                <SheetTrigger asChild>
                  <div className="flex-1 min-w-0 cursor-pointer">
                    <div className="text-sm font-medium truncate">{book?.name || "No book selected"}</div>
                    <div className="text-xs text-muted-foreground truncate">{book?.author || ""}</div>
                  </div>
                </SheetTrigger>

                <div className="flex items-center shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 active:scale-90 transition-transform"
                    onClick={() => { handleSkipBackward(); setIsExpanded(true); }}
                    disabled={!bookFileLocation}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 active:scale-90 transition-transform"
                    onClick={handlePlayPause}
                    disabled={!bookFileLocation}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 active:scale-90 transition-transform"
                    onClick={() => { handleSkipForward(); setIsExpanded(true); }}
                    disabled={!bookFileLocation}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <SheetContent side="bottom" className="h-dvh rounded-none border-none p-0" showCloseButton={false}>
              <div className="flex flex-col h-full">
                {/* Top bar — back button + title/author */}
                <SheetClose asChild>
                  <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-3 pb-12 bg-gradient-to-b from-black/95 via-black/70 to-transparent cursor-pointer">
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-white hover:bg-white/20" tabIndex={-1}>
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-white">{book?.name || "No book selected"}</p>
                      {book?.author && (
                        <p className="text-xs text-white/70 truncate">{book.author}</p>
                      )}
                    </div>
                  </div>
                </SheetClose>

                {/* Cover image — fills top portion */}
                <div className="flex-1 relative min-h-0">
                  <img
                    src={getCoverImageSrc(book?.cover_image)}
                    alt="Now playing"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>

                {/* Bottom gradient overlay bleeding into cover */}
                <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-background from-30% via-background/85 via-60% to-transparent pointer-events-none z-[1]" />
                {/* Controls section — compact bottom area */}
                <div className="px-6 pt-3 pb-6 space-y-3 relative z-[2]">
                  <div className="space-y-1.5">
                    <Slider
                      value={[displayProgress]}
                      onValueChange={(value) => {
                        const percent = value[0] / 100;
                        if (hasChapters) {
                          seek(currentChapter.start_time + percent * (currentChapter.end_time - currentChapter.start_time));
                        } else if (duration) {
                          seek(percent * duration);
                        }
                      }}
                      max={100}
                      step={0.1}
                      className="w-full [&_[data-slot=slider-thumb]]:h-5 [&_[data-slot=slider-thumb]]:w-5"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                      <span>{formatTime(displayElapsed)}</span>
                      <span>{formatTime(displayDuration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 relative">
                    {hasChapters && (
                      <Select
                        value={String(currentChapter.chapter_index)}
                        onValueChange={handleChapterSelect}
                      >
                        <SelectTrigger className="h-10 absolute left-0 text-xs border-none bg-transparent px-3 gap-1.5 max-w-[180px] [&>svg:last-child]:hidden">
                          <ListMusic className="h-4 w-4 shrink-0" />
                          <span className="truncate">{currentChapter.title || `Ch. ${currentChapter.chapter_index + 1}`}</span>
                        </SelectTrigger>
                        <SelectContent position="popper" side="top" className="max-h-[480px] overflow-y-auto">
                          {chapters.map((ch) => (
                            <SelectItem key={ch.id} value={String(ch.chapter_index)}>
                              {ch.title || `Chapter ${ch.chapter_index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 active:scale-90 transition-transform"
                      onClick={handleSkipBackward}
                      disabled={!bookFileLocation}
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-16 w-16 rounded-full shadow-lg active:scale-90 transition-transform"
                      onClick={handlePlayPause}
                      disabled={!bookFileLocation}
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6 ml-0.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 active:scale-90 transition-transform"
                      onClick={handleSkipForward}
                      disabled={!bookFileLocation}
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 absolute right-0 active:scale-90 transition-transform">
                          {volume === 0 ? (
                            <VolumeX className="h-5 w-5" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" align="end" sideOffset={8} className="w-10 p-0 py-3 flex items-center justify-center">
                        <Slider
                          orientation="vertical"
                          value={[volume]}
                          onValueChange={(value) => setVolume(value[0])}
                          max={100}
                          step={1}
                          className="!min-h-0 !h-32"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
