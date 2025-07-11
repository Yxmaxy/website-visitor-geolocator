import { Link, useLocation } from "react-router";

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar.tsx"

import { GlobeIcon, GaugeIcon, SettingsIcon, BarChart3Icon } from "lucide-react";

function AppSidebar() {
    const location = useLocation();
    
    return (
        <Sidebar collapsible="icon" className="z-20">
            <SidebarContent>
                <SidebarMenu>
                    <SidebarHeader className="border-b border-border bg-primary/60 text-primary-foreground">
                        <div className="flex items-center gap-2 py-1">
                            <img src="/logo.svg" alt="Website Visitor Geolocator" className="w-3.5 h-3.5" />
                            <span className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap">Website Visitor Geolocator</span>
                        </div>
                    </SidebarHeader>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/dashboard"}>
                            <Link to="/dashboard">
                                <GaugeIcon className="mr-1" />
                                <span>Dashboard</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/domains"}>
                            <Link to="/domains">
                                <GlobeIcon className="mr-1" />
                                <span>My Domains</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/statistics"}>
                            <Link to="/statistics">
                                <BarChart3Icon className="mr-1" />
                                <span>Statistics</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/settings"}>
                            <Link to="/settings">
                                <SettingsIcon className="mr-1" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    )
}

export default AppSidebar;
