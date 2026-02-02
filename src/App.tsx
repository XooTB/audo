import "./index.css";
import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Header from "./sections/Header";
import Settings from "./pages/Settings";
import Library from "./pages/Library";
import AudioBar from "@/sections/AudioBar";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/library" element={<Library />} />
        </Routes>
      </main>
      <AudioBar />
      <Toaster />
    </div>
  );
}

export default App;
