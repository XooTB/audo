import { useCurrentlyListeningStore } from "@/store/CurrentlyListening";
import { useRef, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";

export default function Player() {
  const {
    book,
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setAudioRef,
    setFileUrl,
    fileUrl,
  } = useCurrentlyListeningStore();

  const localAudioRef = useRef<HTMLAudioElement>(null);

  // Set the audio ref in the store when component mounts
  useEffect(() => {
    setAudioRef(localAudioRef);
  }, [setAudioRef, book]);

  // Convert file path to Tauri-compatible URL
  useEffect(() => {
    if (book?.file_location) {
      const url = convertFileSrc(book.file_location);
      setFileUrl(url);
      console.log("Converted file path:", book.file_location, "to URL:", url);
    } else {
      setFileUrl(null);
    }
  }, [book?.file_location, setFileUrl]);

  // Sync isPlaying state with actual audio playback
  useEffect(() => {
    console.log(book?.file_location);
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

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    console.error("Audio error:", {
      error: audio.error,
      code: audio.error?.code,
      message: audio.error?.message,
      src: audio.src,
      networkState: audio.networkState,
      readyState: audio.readyState,
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background shadow-xs shadow-foreground/10 z-50">
      <audio
        controls
        src={"http://asset.localhost/home/XooT/audiobooks/audiobook_1.m4b"}
      />
    </div>
  );
}
