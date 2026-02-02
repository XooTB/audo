import { useCurrentlyListeningStore } from "@/store/CurrentlyListening";
import { useRef, useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";

export default function Player() {
  const { book, setAudioRef } = useCurrentlyListeningStore();
  const [audioUrl, setAudioUrl] = useState<string>("");

  const localAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setAudioRef(localAudioRef);
  }, [setAudioRef, book]);

  useEffect(() => {
    const loadAudioFile = async () => {
      if (book?.file_location) {
        const url = await convertFileSrc(book.file_location);
        setAudioUrl(url);
      }
    };

    loadAudioFile();
  }, [book]);

  return (
    <audio
      ref={localAudioRef}
      src={audioUrl}
      className="hidden"
    />
  );
}
