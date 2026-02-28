import { PlusIcon } from "lucide-react";
import { Button } from "./ui/button";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "@/hooks/use-toast";
import { useBooksStore } from "@/store/books";

type Props = {};

export default function importBtn({}: Props) {
  const { toast } = useToast();
  const fetchBooks = useBooksStore((s) => s.fetchBooks);

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
      try {
        await invoke("add_book", { filePath });
        await fetchBooks();
        toast({
          title: "Book imported",
          description: "The book has been added to your library.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: String(error),
        });
      }
    }
  };

  return (
    <Button onClick={handleImport}>
      <PlusIcon className="mr-2 h-4 w-4" />
      Import
    </Button>
  );
}
