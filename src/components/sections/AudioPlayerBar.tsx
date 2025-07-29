import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart } from "lucide-react";
import formatTimestamp from "../../lib/formatTimestamp";
import { invoke } from "@tauri-apps/api/core";

export interface AudioplayerBarProps { }

const AudioPlayerBar = ({ }: AudioplayerBarProps) => {
  const [paused, setPaused] = useState<boolean>(true);
  const [length] = useState<number>(600);
  const [current, setCurrent] = useState<number>(0);
  const [volume, setVolume] = useState<number>(80);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  const handlePlayerSeek = (value: number[]) => {
    setCurrent(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  useEffect(() => {
    if (!paused) {
      intervalRef.current = window.setInterval(() => {
        setCurrent((prev) => (prev < length ? prev + 1 : length));
      }, 1000);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [paused]);

  const togglePlayPause = async () => {
    try {
      const x = await invoke("tests");
      console.log(x);
    } catch (error) {
      console.error("Error calling tests:", error);
    }
    setPaused((prev) => !prev);
  };

  return (
    <Card className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/95 shadow-lg rounded-none">
      <div className="px-6 py-4">
        {/* Progress bar at the top */}
        <div className="mb-4">
          <Slider
            value={[current]}
            max={length}
            step={1}
            onValueChange={handlePlayerSeek}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{formatTimestamp(current)}</span>
            <span>{formatTimestamp(length)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Book Info Section */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="w-12 h-12 relative overflow-hidden rounded-md shadow-sm">
              <img
                src="https://placehold.co/48x48.svg"
                alt="Book Cover"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-slate-900 truncate text-sm">
                Dungeon Crawler Carl
              </h4>
              <p className="text-xs text-slate-600 truncate">
                by Matt Dinniman
              </p>
              <Badge variant="secondary" className="text-xs mt-1">
                Chapter 3 of 12
              </Badge>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              onClick={togglePlayPause}
              size="sm"
              className="h-10 w-10 rounded-full"
            >
              {paused ? (
                <Play className="h-4 w-4 ml-0.5" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Right Section - Volume & Actions */}
          <div className="flex items-center space-x-4 min-w-0 flex-1 justify-end">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsFavorited(!isFavorited)}
              >
                <Heart
                  className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
                />
              </Button>

              <div className="flex items-center space-x-2 w-24">
                <Volume2 className="h-4 w-4 text-slate-600" />
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="flex-1 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AudioPlayerBar;
