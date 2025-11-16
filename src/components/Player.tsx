import { useCurrentlyListeningStore } from "@/store/CurrentlyListening";
import { useRef, useEffect } from "react";
import { readFile } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";

export default function Player() {
  const { book, fileUrl, setAudioRef, setFileUrl } =
    useCurrentlyListeningStore();

  const localAudioRef = useRef<HTMLAudioElement>(null);

  // Set the audio ref in the store when component mounts
  useEffect(() => {
    setAudioRef(localAudioRef);
  }, [setAudioRef, book]);

  useEffect(() => {
    const loadAudioFile = async () => {
      if (book?.file_location) {
        const audioUrl = await convertFileSrc(book.file_location);
        setFileUrl(audioUrl);
        console.log("file location:", book.file_location);
        console.log("Audio URL:", audioUrl);
      }
    };

    loadAudioFile();
  }, [book]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background shadow-xs shadow-foreground/10 z-50"></div>
  );
}
