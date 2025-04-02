import type Book from "../../types/book.d.ts"

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  return (
    <div className="flex flex-col w-full">
      <img src="https://placehold.co/400x600.svg" className="border rounded-sm" />
      <p>{book.title}</p>
    </div>
  )
}


export default BookCard;
