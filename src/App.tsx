import "./index.css";
import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Header from "./sections/Header";
import Settings from "./pages/Settings";
import Library from "./pages/Library";
import AudioBar from "@/sections/AudioBar";
import Player from "@/components/Player";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/library" element={<Library />} />
      </Routes>
      <AudioBar />
      <Player />
    </>
  );
}

export default App;
