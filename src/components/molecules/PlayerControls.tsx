import { Pause, Play, RedoDot, UndoDot } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import formatTimestamp from "../../lib/formatTimestamp";
import { invoke } from "@tauri-apps/api/core";

const PlayerControls = () => {
  const [paused, setPaused] = useState<boolean>(true);
  const [length, setLength] = useState<number>(600);
  const [current, setCurrent] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  const handlePlayerSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrent(parseInt(e.target.value));
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
    const x = await invoke("tests")
    console.log(x)
    setPaused((prev) => !prev);
  };

  return (
    <div className="w-2/4">
      <div className="w-full flex justify-center items-center gap-5 py-2">
        <span className="hover:bg-gray-50 px-1 py-1 rounded-lg hover:cursor-pointer">
          <UndoDot />
        </span>
        <span
          className="px-1 py-1 rounded-lg hover:cursor-pointer hover:bg-gray-100"
          onClick={togglePlayPause}
        >
          {paused ? <Play /> : <Pause />}
        </span>
        <span className="flex items-center hover:bg-gray-50 px-1 py-1 rounded-lg hover:cursor-pointer">
          <RedoDot />
        </span>
      </div>
      <div className="flex gap-4 items-center justify-center text-base">
        <span>{formatTimestamp(current)}</span>
        <input
          type="range"
          max={length}
          min={0}
          value={current}
          onChange={handlePlayerSeek}
          className="w-full"
        />
        <span>{formatTimestamp(length - current)}</span>
      </div>
    </div>
  );
};

export default PlayerControls;

