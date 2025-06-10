"use client"

import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  Briefcase,
  BarChart3,
  Users,
  User,
  LogOut,
  Settings,
  UserCog,
  FileBarChart
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "./ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Submit Expenses",
    url: "/expenses",
    icon: FilePlus2,
  },
  {
    title: "My Requests",
    url: "/requests",
    icon: ListChecks,
  },
  {
    title: "Approvals",
    url: "/manager",
    icon: Briefcase,
  },
  {
    title: "Monthly Report",
    url: "/monthly_report",
    icon: FileBarChart,
  },
]

export function AppSidebar({ role }: { role: string | null }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activePath, setActivePath] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    fetchUser()
    setActivePath(window.location.pathname)
  }, [])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-medium">
            Reimbursements
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items
                .filter((item) => {
                  const hiddenForFinance = ["Approvals", "My Requests", "Submit Expenses"];
                  const hiddenForAdmin = ["My Requests", "Submit Expenses"];
                  const hiddenForEmployee = ["Approvals"];

                  if (role === "Finance" && hiddenForFinance.includes(item.title)) return false;
                  if (role === "Admin" && hiddenForAdmin.includes(item.title)) return false;
                  if (role === "Employee" && hiddenForEmployee.includes(item.title)) return false;

                  return true;
                })
                .map((item) => (

                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className="hover:bg-accent/50 data-[active=true]:bg-accent data-[active=true]:font-medium"
                      isActive={activePath.startsWith(item.url)}
                    >
                      <a href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto">
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>

              {role === "Admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Users"
                    className="hover:bg-accent/50 data-[active=true]:bg-accent"
                    isActive={activePath === "/users"}
                  >
                    <a href="/users">
                      <UserCog className="size-4" />
                      <span>Users</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-[100px]" />
                        <Skeleton className="h-2.5 w-[80px]" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-medium text-accent-foreground">
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user?.user_metadata?.full_name || user?.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                      <Tooltip>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100/50"
                            onClick={logout}
                          >
                            <LogOut className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Logout</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
