import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { PlusIcon } from "lucide-react";
import { Link } from "react-router";

type Props = {};

const Header = ({}: Props) => {
  return (
    <div className="flex items-center justify-between shadow-xs shadow-foreground/10 px-5 py-2">
      <div className="flex items-center justify-center md:justify-start gap-2 w-1/3">
        <Menubar className="border-none shadow-none">
          <MenubarMenu>
            <MenubarTrigger className="hover:cursor-pointer hover:bg-accent hover:text-accent-foreground">
              File
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Link to="/">Recents</Link>
              </MenubarItem>
              <MenubarItem>
                <Link to="/">Recents</Link>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="hover:cursor-pointer hover:bg-accent hover:text-accent-foreground">
              Settings
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Link to="/settings">Settings</Link>
              </MenubarItem>
              <MenubarItem>
                <Link to="/settings">Profile</Link>
              </MenubarItem>
              <MenubarItem>
                <Link to="/settings">Audio</Link>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="hover:cursor-pointer hover:bg-accent hover:text-accent-foreground">
              Library
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Link to="/library">Library</Link>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
      <div className="w-1/3 text-center">
        <h1 className="text-2xl font-bold uppercase">Audo</h1>
      </div>
      <div className="w-1/3 text-right">
        <Button className="gap-2 text-sm hover:bg-accent hover:text-accent-foreground hover:border-accent hover:cursor-pointer">
          Import <PlusIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default Header;
