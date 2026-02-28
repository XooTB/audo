import { Button } from "@/components/ui/button";
import {
  Pause,
  Play,
  Volume2,
  SkipBack,
  SkipForward,
  VolumeX,
  ChevronUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { getCoverImageSrc } from "@/utils/coverImage";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useState } from "react";
import {
  Sheet,
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
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60 border-t border-border/40 z-50">
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
            <div className="flex items-center gap-3 py-3">
              <img
                src={getCoverImageSrc(book?.cover_image)}
                alt="Now playing"
                className="w-12 h-12 rounded-md object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{book?.name || "No book selected"}</div>
                <div className="text-xs text-muted-foreground truncate">{book?.author || ""}</div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handlePlayPause}
                  disabled={!bookFileLocation}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </Button>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
              </div>
            </div>

            <SheetContent side="bottom" className="h-[90vh] px-6">
              <div className="flex flex-col h-full py-8">
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto w-full">
                  <div className="relative w-full aspect-square max-w-[280px]">
                    <img
                      src={getCoverImageSrc(book?.cover_image)}
                      alt="Now playing"
                      className="w-full h-full rounded-2xl object-cover shadow-xl"
                    />
                  </div>
                  <div className="text-center space-y-1.5 w-full px-4">
                    <h2 className="text-lg font-semibold line-clamp-2">{book?.name || "No book selected"}</h2>
                    {book?.author && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
                    )}
                    {hasChapters && (
                      <Select
                        value={String(currentChapter.chapter_index)}
                        onValueChange={handleChapterSelect}
                      >
                        <SelectTrigger className="h-8 max-w-xs text-xs text-muted-foreground border-none bg-transparent mx-auto">
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
                  </div>
                </div>

                <div className="space-y-8 pb-6">
                  <div className="space-y-2">
                    <div className="cursor-pointer" onClick={handleProgressClick}>
                      <Progress value={displayProgress} className="h-1.5" />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                      <span>{formatTime(displayElapsed)}</span>
                      <span>{formatTime(displayDuration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-14 w-14"
                      onClick={handleSkipBackward}
                      disabled={true}
                      title="Skip backward not yet supported"
                    >
                      <SkipBack className="h-6 w-6" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-20 w-20 rounded-full shadow-lg"
                      onClick={handlePlayPause}
                      disabled={!bookFileLocation}
                    >
                      {isPlaying ? (
                        <Pause className="h-7 w-7" />
                      ) : (
                        <Play className="h-7 w-7 ml-0.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-14 w-14"
                      onClick={handleSkipForward}
                      disabled={true}
                      title="Skip forward not yet supported"
                    >
                      <SkipForward className="h-6 w-6" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    {volume === 0 ? (
                      <VolumeX className="h-5 w-5 text-muted-foreground shrink-0" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <Slider
                      value={[volume]}
                      onValueChange={(value) => setVolume(value[0])}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
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
