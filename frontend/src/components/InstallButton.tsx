import { useState, useEffect } from "react";

import { cn } from "@/services/lib/shadcn-utils";

import { Button } from "@/components/ui/button";

import { Download, Loader2 } from "lucide-react";


let deferredInstallPrompt: any = null;

const InstallButton = ({ className }: { className?: string }) => {
    const [isPWA, setIsPWA] = useState(false);
    const [showInstallButton, setShowInstallButton] = useState(false);

    useEffect(() => {
        const checkIfPWA = () => {
            return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
        };

        const checkInstallability = async () => {
            setIsPWA(checkIfPWA());
            
            if ("serviceWorker" in navigator && "BeforeInstallPromptEvent" in window) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration && registration.active) {
                    try {
                        const isInstallable = await checkInstallabilityCriteria();
                        if (isInstallable && !checkIfPWA()) {
                            setShowInstallButton(true);
                        }
                    } catch (error) {
                        console.log("App not installable:", error);
                    }
                }
            }
        };

        const checkInstallabilityCriteria = async (): Promise<boolean> => {
            if (!("serviceWorker" in navigator)) return false;
            
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration || !registration.active) return false;

            if (location.protocol !== "https:" && location.hostname !== "localhost") return false;

            return true;
        };

        const handleInstallPrompt = (event: Event) => {
            event.preventDefault();
            deferredInstallPrompt = event;
            if (!checkIfPWA()) {
                setShowInstallButton(true);
            }
        };

        checkInstallability();

        window.addEventListener("beforeinstallprompt", handleInstallPrompt);

        const interval = setInterval(() => {
            if (!showInstallButton && !isPWA) {
                checkInstallability();
                console.log("Checking installability");
            }
        }, 5000);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
            clearInterval(interval);
        };
    }, [showInstallButton, isPWA]);

    const installPWA = async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt = null;
            setShowInstallButton(false);
        }
    };

    if (isPWA) {
        return (
            <Button 
                disabled
                variant="outline"
                size="sm"
                className={cn("gap-2", className)}
            >
                <Download className="h-4 w-4" />
                App already installed
            </Button>
        );
    }
    if (!showInstallButton) {
        return <Button 
                disabled
                variant="outline"
                size="sm"
                className={cn("gap-2", className)}
            >
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking installability...
            </Button>;
    }

    return (
        <Button 
            onClick={installPWA} 
            variant="outline"
            size="sm"
            className={cn("gap-2", className)}
        >
            <Download className="h-4 w-4" />
            Install App
        </Button>
    );
};

export default InstallButton;
