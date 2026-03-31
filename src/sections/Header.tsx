import { Link, useLocation } from "react-router";
import { Menu, Moon, Sun, Home, BookOpen, Settings, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ImportBtn from "@/components/importBtn";
import { useTheme } from "@/components/theme-provider";

type Props = {};

const Header = ({}: Props) => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/library", icon: BookOpen, label: "Library" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                  <Menu className="h-[18px] w-[18px]" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 px-5 pt-5" showCloseButton={false}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">A</span>
                    </div>
                    <span className="text-lg font-semibold tracking-tight">Audo</span>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <span className="sr-only">Close</span>
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="text-lg font-semibold tracking-tight hidden sm:block">Audo</span>
            </Link>
          </div>

          {/* Center section - Navigation */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-1 min-w-[200px] justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                if (theme === "light") {
                  setTheme("dark");
                } else if (theme === "dark") {
                  setTheme("light");
                } else {
                  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  setTheme(isDark ? "light" : "dark");
                }
              }}
            >
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <ImportBtn />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
