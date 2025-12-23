import { Book } from "@/types/book"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PosterPlaceholder from "@/assets/poster_placeholder.png"
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening"
import { invoke } from "@tauri-apps/api/core"
import { TrashIcon } from "lucide-react"
import { toast } from "sonner"
import { useLibraryStore } from "@/store/LibraryStore"


type Props = {
    book: Book
}

const BookCard = ({ book }: Props) => {
  const { setBook, setBookFileLocation, bookFileLocation, isPlaying, setIsPlaying } = useCurrentlyListeningStore()
  const { deleteBook } = useLibraryStore()
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

  const handleDeleteClick = () => {
    invoke("delete_book", {bookId: book.id}).then(() => {
      toast.success("Book deleted")
      deleteBook(book.id)
    })
  }

  return (
    <Card key={book.id} className="overflow-hidden">
            <div className="aspect-2/3 relative">
            <Button variant="outline" className="absolute top-2 right-2" onClick={handleDeleteClick}>
              <TrashIcon className="w-4 h-4" />
            </Button>
              <img
                src={book.cover_image || PosterPlaceholder}
                alt="Audiobook Cover"
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base line-clamp-2">
                {book.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {book.author}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleButtonClick}
              >
               {bookFileLocation === book.file_location ? "Listening" : "Listen"}
              </Button>
            </CardFooter>
          </Card>
  )
}

export default BookCard