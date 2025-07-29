import { Link, useLocation } from "react-router";
import ImportBtn from "../atoms/ImportBtn";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

export default function NavBar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
              Audo
            </Link>
            
            <NavigationMenu>
              <NavigationMenuList className="space-x-1">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link 
                      to="/"
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive("/") 
                          ? "bg-slate-100 text-slate-900" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      Home
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link 
                      to="/library"
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive("/library") 
                          ? "bg-slate-100 text-slate-900" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      Library
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link 
                      to="/now-playing"
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive("/now-playing") 
                          ? "bg-slate-100 text-slate-900" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      Now Playing
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link 
                      to="/favorites"
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive("/favorites") 
                          ? "bg-slate-100 text-slate-900" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      Favorites
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          <ImportBtn /> 
        </div>
      </div>
    </header>
  );
}
