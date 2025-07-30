import { Pause, Play, RedoDot, UndoDot } from "lucide-react";
import React, { useEffect, useState } from "react";
import formatTimestamp from "../../lib/formatTimestamp";
import { invoke } from "@tauri-apps/api/core";

const PlayerControls = () => {
  const [paused, setPaused] = useState<boolean>(true);
  const [length] = useState<number>(600);
  const [actualPosition, setActualPosition] = useState<number>(0);
  const [, setPlaybackState] = useState<any>(null);

  const handlePlayerSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(e.target.value);
    setActualPosition(newPosition);
    try {
      await invoke("seek_to_position", { positionSeconds: newPosition });
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  // Fetch playback state periodically
  useEffect(() => {
    const fetchPlaybackState = async () => {
      try {
        const state = await invoke("get_playback_state");
        setPlaybackState(state);
        setPaused(!(state as any)?.is_playing);
        if ((state as any)?.current_position_seconds !== undefined) {
          setActualPosition(Math.floor((state as any).current_position_seconds));
        }
      } catch (error) {
        console.error("Error fetching playback state:", error);
      }
    };

    fetchPlaybackState();
    const stateInterval = setInterval(fetchPlaybackState, 1000);

    return () => clearInterval(stateInterval);
  }, []);

  // Position is now tracked via backend polling, no need for local timer

  const togglePlayPause = async () => {
    try {
      if (paused) {
        await invoke("play");
        setPaused(false);
        console.log("Started playback");
      } else {
        await invoke("pause");
        setPaused(true);
        console.log("Paused playback");
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  return (
    <div className="w-2/4">
      <div className="w-full flex justify-center items-center gap-5 py-2">
        <span 
          className="hover:bg-gray-50 px-1 py-1 rounded-lg hover:cursor-pointer"
          onClick={async () => {
            try {
              await invoke("skip_backward", { seconds: 15 });
            } catch (error) {
              console.error("Error skipping backward:", error);
            }
          }}
        >
          <UndoDot />
        </span>
        <span
          className="px-1 py-1 rounded-lg hover:cursor-pointer hover:bg-gray-100"
          onClick={togglePlayPause}
        >
          {paused ? <Play /> : <Pause />}
        </span>
        <span 
          className="flex items-center hover:bg-gray-50 px-1 py-1 rounded-lg hover:cursor-pointer"
          onClick={async () => {
            try {
              await invoke("skip_forward", { seconds: 15 });
            } catch (error) {
              console.error("Error skipping forward:", error);
            }
          }}
        >
          <RedoDot />
        </span>
      </div>
      <div className="flex gap-4 items-center justify-center text-base">
        <span>{formatTimestamp(actualPosition)}</span>
        <input
          type="range"
          max={length}
          min={0}
          value={actualPosition}
          onChange={handlePlayerSeek}
          className="w-full"
        />
        <span>{formatTimestamp(length - actualPosition)}</span>
      </div>
    </div>
  );
};

export default PlayerControls;

