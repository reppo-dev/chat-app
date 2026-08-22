import { Bell, Search } from "lucide-react";
import { Input } from "./ui/input";
import { SidebarTrigger } from "./ui/sidebar";
import ProfileAvatar from "./avatar";

const Header = () => {
  return (
    <header className="h-16 w-full flex justify-center items-center">
      <div className="mx-6 sm:mx-10 w-full lg:w-6xl flex justify-between items-center">
        <div className="hidden sm:flex gap-4 items-center">
          <p className="font-bold">Social Media</p>
          <div className="flex items-center justify-center border-2 rounded-md">
            <Search className="ml-2" />
            <Input className="border-none focus:shadow-none focus:border-none focus:ring-0 focus-visible:ring-0" />
          </div>
        </div>
        <div className="block sm:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex mr-0 gap-4 items-center">
          <Bell />
          <ProfileAvatar />
        </div>
      </div>
    </header>
  );
};

export default Header;
