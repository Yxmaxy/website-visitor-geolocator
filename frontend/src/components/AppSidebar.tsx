import { Link } from "react-router";

import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar.tsx"

import { ChartBarIcon, GlobeIcon, GaugeIcon, SettingsIcon } from "lucide-react";

function AppSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link to="/dashboard">
                                <GaugeIcon className="mr-1" />
                                <span>Dashboard</span>
                            </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                            <Link to="/domains">
                                <GlobeIcon className="mr-1" />
                                <span>My Domains</span>
                            </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                            <Link to="/statistics">
                                <ChartBarIcon className="mr-1" />
                                <span>Statistics</span>
                            </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
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
