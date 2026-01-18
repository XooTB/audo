import { Book } from "@/types/book"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PosterPlaceholder from "@/assets/poster_placeholder.png"
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening"
import { invoke } from "@tauri-apps/api/core"
import { TrashIcon, InfoIcon } from "lucide-react"
import { toast } from "sonner"
import { useLibraryStore } from "@/store/LibraryStore"

type Props = {
  book: Book
}

const BookCard = ({ book }: Props) => {
  const {
    setBook,
    setBookFileLocation,
    bookFileLocation,
    isPlaying,
    setIsPlaying,
  } = useCurrentlyListeningStore()
  const { deleteBook } = useLibraryStore()
  const handleButtonClick = () => {
    setBook(book)
    setBookFileLocation(book.file_location)
    if (isPlaying) {
      invoke("pause").then(() => {
        setIsPlaying(false)
      })
    } else {
      invoke("play", { bookId: book.id }).then(() => {
        setIsPlaying(true)
      })
    }
  }

  const handleDeleteClick = () => {
    invoke("delete_book", { bookId: book.id }).then(() => {
      toast.success("Book deleted")
      deleteBook(book.id)
    })
  }

  const handleCodecCheck = async () => {
    try {
      const codecInfo: any = await invoke("get_audio_codec_info", {
        filePath: book.file_location,
      })
      const infoText =
        `Codec: ${codecInfo.codec_name} (${codecInfo.codec_long_name})\n` +
        `Tag: ${codecInfo.codec_tag_string}\n` +
        `Profile: ${codecInfo.profile || "N/A"}\n` +
        `Format: ${codecInfo.format_name || "N/A"}\n` +
        `Sample Rate: ${codecInfo.sample_rate}Hz\n` +
        `Channels: ${codecInfo.channels}\n` +
        `Bit Rate: ${codecInfo.bit_rate || "N/A"}`

      toast.info(infoText, { duration: 15000 })
      console.log("Codec Info:", codecInfo)
      console.log(infoText)
    } catch (error) {
      toast.error(`Failed to get codec info: ${error}`)
    }
  }

  return (
    <Card key={book.id} className="overflow-hidden">
      <div className="aspect-2/3 relative">
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 left-2"
          onClick={handleCodecCheck}
        >
          <InfoIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleDeleteClick}
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
        <img
          src={book.cover_image || PosterPlaceholder}
          alt="Audiobook Cover"
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-base line-clamp-2">{book.name}</CardTitle>
        <CardDescription className="text-sm">{book.author}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-0">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleButtonClick}
          disabled={false}
        >
          {bookFileLocation === book.file_location ? "Listening" : "Listen"}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default BookCard
