import { Book } from "@/types/book"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import PosterPlaceholder from "@/assets/poster_placeholder.png"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening"
import { invoke } from "@tauri-apps/api/core"
import { Play, Pause, Clock, User, Mic, Trash2 } from "lucide-react"
import { useState } from "react"

type Props = {
    book: Book
    onRemove?: (bookId: number) => void
}

const BookCard = ({ book, onRemove }: Props) => {
  const {
    bookFileLocation,
    isPlaying,
    play,
    pause,
    setBook,
    setBookFileLocation,
    setDuration,
  } = useAudioPlayer()
  
  const clearPlayer = useCurrentlyListeningStore((s) => s.clearPlayer)
  const [showModal, setShowModal] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  const handleButtonClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const isCurrentBook = bookFileLocation === book.file_location
    
    if (isCurrentBook && isPlaying) {
      // Pause current book
      await pause()
    } else {
      // Play this book (set book info first, then play)
      setBook(book)
      setBookFileLocation(book.file_location)
      setDuration(book.duration)
      await play(book.id)
    }
  }

  const isCurrentBook = bookFileLocation === book.file_location

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <>
      <div className="group cursor-pointer" onClick={() => setShowModal(true)}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted mb-3 shadow-md">
        <img
          src={book.cover_image || PosterPlaceholder}
          alt={book.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-3 right-3">
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-xl bg-primary hover:bg-primary/90 hover:scale-105 transition-transform"
              onClick={handleButtonClick}
            >
              {isCurrentBook && isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 ml-0.5 fill-current" />
              )}
            </Button>
          </div>
        </div>
        {isCurrentBook && (
          <div className="absolute top-2 right-2">
            <div className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-1 rounded-full">
              {isPlaying ? "Playing" : "Paused"}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-1 px-1">
        <h3 className="font-medium text-sm leading-snug line-clamp-2">
          {book.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {book.author}
        </p>
      </div>
    </div>

    <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) setConfirmingRemove(false); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{book.name}</DialogTitle>
          <DialogDescription>
            <div className="flex gap-6 mt-6">
              <div className="flex-shrink-0">
                <img
                  src={book.cover_image || PosterPlaceholder}
                  alt={book.name}
                  className="w-40 h-60 object-cover rounded-md shadow-lg"
                />
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Author:</span>
                    <span>{book.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Narrator:</span>
                    <span>{book.narrator}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Duration:</span>
                    <span>{formatDuration(book.duration)}</span>
                  </div>
                </div>

                {book.description && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-sm text-foreground mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      handleButtonClick(e)
                      setShowModal(false)
                    }}
                  >
                    {isCurrentBook && isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  {confirmingRemove ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={async () => {
                        await invoke("remove_book", { bookId: book.id })
                        if (isCurrentBook) {
                          clearPlayer()
                        }
                        onRemove?.(book.id!)
                        setShowModal(false)
                        setConfirmingRemove(false)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Confirm Removal
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => setConfirmingRemove(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove from Library
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default BookCard