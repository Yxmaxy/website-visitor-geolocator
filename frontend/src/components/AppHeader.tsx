import { SidebarTrigger } from "@/components/ui/sidebar";

function AppHeader() {
    return (
        <header className="py-2 bg-sidebar mb-4 sticky top-0 border-b border-border z-60 shadow-xs">
            <div className="mx-auto w-full max-w-4xl flex items-center gap-2 px-3">
                <SidebarTrigger />
                <h1 className="font-medium">Website Visitor Geolocator</h1>
            </div>
        </header>
    )
}

export default AppHeader;
