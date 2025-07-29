import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-slate-900 mb-6">
            Audo
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Your personal audiobook companion. Immerse yourself in stories, expand your knowledge, and discover new worlds through the power of narration.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link to="/library">Browse Library</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link to="/now-playing">Continue Listening</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Rich Library</h3>
              <p className="text-slate-600 text-sm">
                Organize and manage your audiobook collection with ease
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Smart Playback</h3>
              <p className="text-slate-600 text-sm">
                Resume where you left off with intelligent bookmark tracking
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Favorites</h3>
              <p className="text-slate-600 text-sm">
                Keep track of your most beloved stories and narrators
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to dive in?
          </h2>
          <p className="text-slate-600 mb-8">
            Start building your audiobook collection today
          </p>
          <Button size="lg" className="px-8">
            Import Your First Book
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
