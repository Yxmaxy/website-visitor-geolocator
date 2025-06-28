import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { Toaster } from "sonner"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx"

import AppSidebar from "@/components/AppSidebar.tsx"
import AppHeader from "@/components/AppHeader.tsx"

import Dashboard from "@/components/pages/Dashboard.tsx"
import Domains from "@/components/pages/Domains.tsx"
import Statistics from "@/components/pages/Statistics.tsx"
import Settings from "@/components/pages/Settings.tsx"

import "./styles/index.css"


createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <SidebarProvider>
            <BrowserRouter>
                <AppSidebar />
                <SidebarInset>
                    <AppHeader />
                    <div className="mx-auto w-full max-w-4xl px-4">
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/domains" element={<Domains />} />
                            <Route path="/statistics" element={<Statistics />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </div>
                </SidebarInset>
                <Toaster />
            </BrowserRouter>
        </SidebarProvider>
    </StrictMode>,
)
