import { useCurrentlyListeningStore } from "@/store/CurrentlyListening";
import { useRef, useEffect } from "react";

export default function Player() {
  const {
    book,
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setAudioRef,
  } = useCurrentlyListeningStore();

  const localAudioRef = useRef<HTMLAudioElement>(null);

  // Set the audio ref in the store when component mounts
  useEffect(() => {
    setAudioRef(localAudioRef);
  }, [setAudioRef]);

  // Sync isPlaying state with actual audio playback
  useEffect(() => {
    if (localAudioRef.current) {
      if (isPlaying) {
        localAudioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      } else {
        localAudioRef.current.pause();
      }
    }
  }, [isPlaying, setIsPlaying]);

  const handleTimeUpdate = () => {
    if (localAudioRef?.current && book) {
      setCurrentTime(localAudioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (localAudioRef?.current) {
      setDuration(localAudioRef.current.duration);
      setCurrentTime(localAudioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <audio
      ref={localAudioRef}
      src={book?.file_location || "/home/XooT/audiobooks/audiobook_1.m4b"}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
    />
  );
}
