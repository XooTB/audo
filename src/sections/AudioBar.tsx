import { Button } from "@/components/ui/button";
import {
  PauseIcon,
  PlayIcon,
  Volume2Icon,
  SkipBackIcon,
  SkipForwardIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import placeholder from "@/assets/player_placeholder.png";
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening";
import { invoke } from "@tauri-apps/api/core";

type Props = {};

export default function AudioBar({}: Props) {
  const { book, bookFileLocation, isPlaying, setIsPlaying, currentTime, duration, audioRef } =
    useCurrentlyListeningStore();

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if(isPlaying) {
      invoke("pause").then(() => {
        console.log("Paused");
      });
    } else {
      if(!bookFileLocation) return;
      invoke("play", {bookId: book?.id}).then(() => {
        console.log("Played");
      });
    }
  };

  const handleSkipBackward = () => {
    if (audioRef?.current) {
      audioRef.current.currentTime = Math.max(
        0,
        audioRef.current.currentTime - 10
      );
    }
  };

  const handleSkipForward = () => {
    if (audioRef?.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + 30
      );
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef?.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      audioRef.current.currentTime = newTime;
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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background shadow-xs shadow-foreground/10 z-50">
      <div className="flex items-center justify-between p-2 border-t border-border rounded-t-lg">
        <img
          src={book?.cover_image || placeholder}
          alt="Audiobook Cover"
          className="w-10 h-10 rounded-full"
        />
        <div className="flex items-center gap-2 w-1/2 justify-start pl-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:cursor-pointer"
            onClick={handleSkipBackward}
          >
            <SkipBackIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:cursor-pointer"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <PauseIcon className="h-4 w-4" />
            ) : (
              <PlayIcon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:cursor-pointer"
            onClick={handleSkipForward}
          >
            <SkipForwardIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col items-center gap-1 w-1/2">
          <div className="w-full cursor-pointer" onClick={handleProgressClick}>
            <Progress value={progressPercent} />
          </div>
          <div className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hover:cursor-pointer">
            <Volume2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
