import type { Metadata } from "next";
// import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import { createClient } from "@/lib/supabase/server";

// const defaultUrl = process.env.VERCEL_URL
//   ? `https://${process.env.VERCEL_URL}`
//   : "http://localhost:3000";

export const metadata: Metadata = {
  title: "Reimbursement Tracker",
};

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   display: "swap",
//   subsets: ["latin"],
// });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const hasEnvVars = true;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let role: string | null = null;

  if (session?.user.id) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    role = userData?.role ?? null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <AppSidebar role={role} />
        </Sidebar>

        <SidebarInset className="flex flex-col min-w-0">
          <div className="flex-1 flex flex-col">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <main className="flex-1 p-4">
                <div className="mb-4">
                  <SidebarTrigger />
                </div>

              
                {children}
              </main>
            </ThemeProvider>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
