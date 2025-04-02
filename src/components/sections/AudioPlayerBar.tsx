import PlayerControls from "../molecules/PlayerControls";

export interface AudioplayerBarProps {

}

const AudioPlayerBar = ({ }: AudioplayerBarProps) => {
  return (
    <div className="fixed bottom-0 bg-gray-200 w-full min-h-[9vh] flex items-center">
      <div className="px-5 py-2 flex items-center w-1/4">
        <img src="https://placehold.co/50x50.svg" className="border rounded-sm" />
        <div className="flex flex-col items-start justify-center px-2">
          <p className="text-base">Dungeon Crawler Carl</p>
          <p className="text-sm">Matt Dinniman</p>
        </div>
      </div>
      <PlayerControls />
      <div className="w-1/4"></div>
    </div>

  )
}

export default AudioPlayerBar;
