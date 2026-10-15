import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/features/header/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import ReduxProvider from "@/lib/redux/provider";
import ReactQueryProvider from "@/lib/tanstack/provider";
import { WebSocketProvider } from "@/lib/websocket/WebSocketProvider";
import { AuthGuard } from "@/components/auth-guard";
import { FloatingChatDock } from "@/features/chat/components/floating-chat-dock";
import { EditPostDialog } from "@/features/feed/components/edit-post-dialog";
import { EditProfileModal } from "@/features/profile/components/edit-profile-modal";
import { FriendRequestsModal } from "@/features/friends/components/friend-requests-modal";
import { UserSearchDialog } from "@/features/friends/components/user-search-dialog";
import { NewConversationDialog } from "@/features/chat/components/new-conversation-dialog";

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EchoNet - Real-time Social Media",
  description:
    "Real-time social media application built with Next.js, Redux Toolkit, TanStack Query, and WebSockets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        geist.variable,
        figtreeHeading.variable
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ReduxProvider>
          <ReactQueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AuthGuard>
                <WebSocketProvider>
                  <SidebarProvider defaultOpen={false}>
                    <AppSidebar />
                    <SidebarInset className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1 flex flex-col">{children}</main>
                    </SidebarInset>
                  </SidebarProvider>

                  {/* Global Modals & Floating Chat Dock */}
                  <FloatingChatDock />
                  <EditPostDialog />
                  <EditProfileModal />
                  <FriendRequestsModal />
                  <UserSearchDialog />
                  <NewConversationDialog />
                </WebSocketProvider>
              </AuthGuard>
            </ThemeProvider>
          </ReactQueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
