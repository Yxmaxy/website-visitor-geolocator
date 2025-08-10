import { StrictMode, Suspense, lazy } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Loader2 } from "lucide-react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx"

import AppSidebar from "@/components/AppSidebar.tsx"
import AppHeader from "@/components/AppHeader.tsx"

const Dashboard = lazy(() => import("@/components/pages/Dashboard.tsx"))
const Domains = lazy(() => import("@/components/pages/Domains.tsx"))
const Statistics = lazy(() => import("@/components/pages/Statistics.tsx"))
const Settings = lazy(() => import("@/components/pages/Settings.tsx"))

import "./styles/index.css"

const PageLoading = () => (
    <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
        <Loader2 className="animate-spin" />
        <span>Loading page ...</span>
    </div>
)

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SidebarProvider>
                <BrowserRouter>
                    <AppSidebar />
                    <SidebarInset>
                        <AppHeader />
                        <div className="mx-auto w-full max-w-4xl px-4 mb-8">
                            <Suspense fallback={<PageLoading />}>
                                <Routes>
                                    <Route path="/" element={<Navigate to="/dashboard" />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/domains" element={<Domains />} />
                                    <Route path="/statistics" element={<Statistics />} />
                                    <Route path="/settings" element={<Settings />} />
                                </Routes>
                            </Suspense>
                        </div>
                    </SidebarInset>
                    <Toaster />
                </BrowserRouter>
            </SidebarProvider>
        </ThemeProvider>
    </StrictMode>,
)
