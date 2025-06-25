import { SidebarTrigger } from "@/components/ui/sidebar";

function AppHeader() {
    return (
        <header className="flex items-center justify-between">
            <SidebarTrigger />
            <h1>Website Visitor Geolocator</h1>
        </header>
    )
}

export default AppHeader;
