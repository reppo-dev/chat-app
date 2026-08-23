import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Bookmark,
  CalendarDays,
  Home,
  Plus,
  ShoppingBag,
  User,
  User2,
  Users,
  Video,
} from "lucide-react";

const sidebarValue = [
  { icon: <Home size={20} />, name: "Home", url: "/" },
  { icon: <User size={20} />, name: "Profile", url: "/profile" },
  { icon: <Video size={20} />, name: "Watch", url: "/watch" },
  { icon: <ShoppingBag size={20} />, name: "Marketplace", url: "/marketplace" },
  { icon: <Users size={20} />, name: "Groups", url: "/groups" },
  { icon: <Bookmark size={20} />, name: "Saved", url: "/saved" },
  { icon: <CalendarDays size={20} />, name: "Events", url: "/events" },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarTrigger className="absolute right-1 mt-2" />
      <SidebarHeader>
        <p className="font-bold">Social Media</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="gap-2">
          {sidebarValue.map((item) => (
            <SidebarMenuItem className="ml-4" key={item.name}>
              <SidebarMenuButton>
                {item.icon}
                {item.name}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <User2 /> Username
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
