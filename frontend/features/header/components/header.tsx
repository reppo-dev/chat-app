import { Bell } from "lucide-react";
import { SidebarTrigger } from "../../../components/ui/sidebar";
import ProfileAvatar from "../../../components/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import SearchBox from "@/components/search";

const Header = () => {
  return (
    <header className="h-16 dark:bg-zinc-800/50 shadow-[0_2px_2px_rgba(0,0,0,0.2)] w-full flex justify-center items-center z-50">
      <div className="mx-6 sm:mx-10 w-full flex justify-between items-center">
        <div className="hidden sm:flex gap-4 items-center">
          <p className="font-bold ">Social Media</p>
          <SearchBox />
        </div>
        <div className="block sm:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex mr-0  gap-4 items-center">
          <ModeToggle />
          <Bell />
          <ProfileAvatar />
        </div>
      </div>
    </header>
  );
};

export default Header;
