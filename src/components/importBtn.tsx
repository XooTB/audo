import { PlusIcon } from "lucide-react";
import { Button } from "./ui/button";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

type Props = {};

export default function importBtn({}: Props) {
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
      console.log("Selected file path:", filePath);
      // You can now use the file path with your Tauri backend
      invoke("add_book", { filePath });
    }
  };

  return (
    <Button onClick={handleImport}>
      <PlusIcon className="mr-2 h-4 w-4" />
      Import
    </Button>
  );
}
