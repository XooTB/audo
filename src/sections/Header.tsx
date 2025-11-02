import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Link } from "react-router";
import ImportBtn from "@/components/importBtn";

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
        <ImportBtn />
      </div>
    </div>
  );
};

export default Header;
