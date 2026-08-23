import { LefttHomeSidebar } from "@/features/home/components/home-sidebar-left";
import { RightHomeSidebar } from "@/features/home/components/home-sidebar-right";

export default function HomeLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex items-center justify-start w-full h-full">
      <LefttHomeSidebar />
      <div className="bg-gray-400 dark:bg-primary w-full h-full">
        {children}
      </div>
      <RightHomeSidebar />
    </div>
  );
}
