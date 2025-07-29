import { BrowserRouter as Router, Routes, Route } from "react-router";
import "./App.css";
import "./styles/globals.css";
import NavBar from "./components/sections/NavBar";
import Library from "./components/pages/Library";
import CurrentlyListening from "./components/pages/CurrentlyListening";
import Favorites from "./components/pages/Favorites";
import AudioPlayerBar from "./components/sections/AudioPlayerBar"
import Home from "@/components/pages/Home"

function App() {
  return (
    <Router>
      <div className="text-xl">
        <NavBar />
        <main className="px-2 pb-36">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/now-playing" element={<CurrentlyListening />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </main>
        <AudioPlayerBar />
      </div>
    </Router>
  );
}

export default App;
