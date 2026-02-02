import { Book } from "@/types/book"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PosterPlaceholder from "@/assets/poster_placeholder.png"
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening"
import { invoke } from "@tauri-apps/api/core"
import { Play, Pause } from "lucide-react"

type Props = {
    book: Book
}

const BookCard = ({ book }: Props) => {
  const { setBook, setBookFileLocation, bookFileLocation, isPlaying, setIsPlaying } = useCurrentlyListeningStore()

  const handleButtonClick = () => {
    setBook(book)
    setBookFileLocation(book.file_location)
    if(isPlaying) {
      invoke("pause").then(() => {
        setIsPlaying(false)
      })
    } else {
      invoke("play", {bookId: book.id}).then(() => {
        setIsPlaying(true)
      })
    }
  }

  const isCurrentBook = bookFileLocation === book.file_location

  return (
    <Card key={book.id} className="group overflow-hidden border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={book.cover_image || PosterPlaceholder}
          alt={book.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <Button
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-12 w-12 rounded-full shadow-lg"
            onClick={handleButtonClick}
          >
            {isCurrentBook && isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {book.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {book.author}
        </p>
      </div>
    </Card>
  )
}

export default BookCard