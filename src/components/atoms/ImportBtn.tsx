import { open } from "@tauri-apps/plugin-dialog";
import { Plus } from "lucide-react";

type Props = {}

const ImportBtn = ({ }: Props) => {
  const handleClick = async () => {
    const file = await open({
      multiple: false,
      directory: false,
    })

    console.log(file);
  }

  return (
    <button onClick={handleClick} className="text-[16px] border rounded-sm border-white px-2 py-1 flex items-center gap-2 hover:cursor-pointer">
      Import <Plus size={14} className="text-white" />
    </button>
  )
}

export default ImportBtn
