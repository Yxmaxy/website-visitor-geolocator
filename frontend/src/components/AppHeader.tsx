import { SidebarTrigger } from "@/components/ui/sidebar";

function AppHeader() {
    return (
        <header className="px-4 py-2 bg-accent mb-4">
            <div className="mx-auto w-full max-w-4xl flex items-center justify-between">
                <SidebarTrigger />
                <h1>Website Visitor Geolocator</h1>
            </div>
        </header>
    )
}

export default AppHeader;
