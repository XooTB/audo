import { PlusIcon } from "lucide-react";
import { Button } from "./ui/button";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useLibraryStore } from "@/store/LibraryStore";
import { toast } from "sonner";
import { Book } from "@/types/book";

type Props = {};

export default function importBtn({}: Props) {
  const { addBook } = useLibraryStore();

  const handleImport = async () => {
    const filePath = await open({
      multiple: false,
      filters: [
        {
          name: "Audio",
          extensions: [
            "mp3",
            "mp4",
            "m4a",
            "m4b",
            "m4p",
            "m4v",
            "m4b",
            "m4p",
            "m4v",
            "m4b",
            "m4p",
            "m4v",
          ],
        },
      ],
    });

    if (!filePath) {
      console.error("No file selected");
    } else {
      // Add the book to the database
      const book: Book = (await invoke("add_book", {
        filePath,
      })) as unknown as Book;
      // Add the book the library store
      addBook(book);
      // Show a success toast
      toast.success("Book added");
    }
  };

  return (
    <Button onClick={handleImport}>
      <PlusIcon className="mr-2 h-4 w-4" />
      Import
    </Button>
  );
}
