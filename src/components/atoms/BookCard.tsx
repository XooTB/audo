import type { LibBook } from "../../types/book.d.ts";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface BookCardProps {
  book: LibBook,
}

const BookCard = ({ book }: BookCardProps) => {
  const handleClick = () => {
    invoke("start", { bookId: book.id })
  }

  const getButtonText = () => {
    switch (book.status) {
      case 'reading':
        return 'Continue Reading'
      case 'completed':
        return 'Read Again'
      default:
        return 'Start Reading'
    }
  }

  return (
    <Card className="w-full max-w-sm group cursor-pointer border-none shadow-none gap-1 justify-start py-0 pb-2">
      {/* Image Section - Takes up most of the card */}
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-md h-72">
          <img
            src="https://placehold.co/600x800.svg"
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300"
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-start p-4 text-white">
            <div className="space-y-3 flex flex-col justify-between h-full pt-7">
              {book.description && (
                <p className="text-xs line-clamp-7 leading-relaxed">
                  {book.description}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {book.author && (
                    <Badge variant="secondary" className="text-xs">
                      {book.author}
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={handleClick}
                  variant="default"
                  size="sm"
                  className="w-full mt-2 hover:cursor-pointer hover:bg-gray-200 hover:text-black"
                >
                  {getButtonText()}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      {/* Title Section - Small bottom area */}
      <CardContent className="justify-start p-2">
        <h3 className="font-medium text-base line-clamp-2 leading-tight">
          {book.title}
        </h3>
      </CardContent>
    </Card>
  )
}
export default BookCard;
