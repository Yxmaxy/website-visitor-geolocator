import { Link, useLocation } from "react-router";

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar.tsx"

import { GlobeIcon, GaugeIcon, SettingsIcon, BarChart3Icon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile"

function AppSidebar() {
    const location = useLocation();
    const isMobile = useIsMobile();
    const { toggleSidebar } = useSidebar();

    function handleLinkClick() {
        if (isMobile) {
            toggleSidebar();
        }
    }
    
    return (
        <Sidebar collapsible="icon" className="z-20">
            <SidebarContent>
                <SidebarMenu>
                    <SidebarHeader className="border-b border-border bg-sidebar-header/60 text-primary-foreground">
                        <div className="flex items-center gap-2 py-1">
                            <img src="/logo.svg" alt="Website Visitor Geolocator" className="w-3.5 h-3.5" />
                            <span className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap text-sidebar-header-foreground">Website Visitor Geolocator</span>
                        </div>
                    </SidebarHeader>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/dashboard"} onClick={handleLinkClick}>
                            <Link to="/dashboard">
                                <GaugeIcon className="mr-1" />
                                <span>Dashboard</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/domains"} onClick={handleLinkClick}>
                            <Link to="/domains">
                                <GlobeIcon className="mr-1" />
                                <span>My Domains</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/statistics"} onClick={handleLinkClick}>
                            <Link to="/statistics">
                                <BarChart3Icon className="mr-1" />
                                <span>Statistics</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/settings"} onClick={handleLinkClick}>
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
