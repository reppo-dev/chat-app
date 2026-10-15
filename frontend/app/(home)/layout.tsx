import { LefttHomeSidebar } from "@/features/home/components/home-sidebar-left";
import { RightHomeSidebar } from "@/features/home/components/home-sidebar-right";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between w-full min-h-[calc(100vh-4rem)]">
      <LefttHomeSidebar />
      <div className="bg-muted/20 dark:bg-background flex-1 min-h-[calc(100vh-4rem)] w-full">
        {children}
      </div>
      <RightHomeSidebar />
    </div>
  );
}
