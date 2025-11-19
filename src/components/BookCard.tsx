import { Book } from "@/types/book"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PosterPlaceholder from "@/assets/poster_placeholder.png"
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening"

type Props = {
    book: Book
}

const BookCard = ({ book }: Props) => {
  const { setBook, setBookFileLocation, bookFileLocation } = useCurrentlyListeningStore()

  const handleButtonClick = () => {
    setBook(book)
    setBookFileLocation(book.file_location)
  }

  console.log(bookFileLocation)
  console.log(book.file_location)

  return (
    <Card key={book.id} className="overflow-hidden">
            <div className="aspect-2/3 relative">
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