import { useState, useEffect } from "react";

import { cn } from "@/services/lib/shadcn-utils";

import { Button } from "@/components/ui/button";

import { Download, Loader2, X } from "lucide-react";


let deferredInstallPrompt: any = null;

const InstallButton = ({ className }: { className?: string }) => {
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);
    const [checkingInstallable, setCheckingInstallable] = useState(false);

    const checkIsInstalled = () => {
        return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    }

    const installPWA = async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt = null;
            setCheckingInstallable(false);
        }
    };

    useEffect(() => {
        const handleInstallPrompt = (event: Event) => {
            deferredInstallPrompt = event;
        }

        window.addEventListener("beforeinstallprompt", handleInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
        }
    }, []);

    useEffect(() => {
        setIsInstalled(checkIsInstalled());
        if (isInstalled) {
            return;
        }

        const checkInstallability = async (triesLeft: number) => {
            setCheckingInstallable(true);
            try {
                if ("serviceWorker" in navigator && "BeforeInstallPromptEvent" in window) {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration && registration.active) {
                        if (!("serviceWorker" in navigator)) {
                            throw new Error("Service worker not found");
                        }
                        const registration = await navigator.serviceWorker.getRegistration();
                        if (!registration || !registration.active) {
                            throw new Error("Service worker not active");
                        }
                        if (location.protocol !== "https:" && location.hostname !== "localhost") {
                            throw new Error("Not on https or localhost");
                        }
                        setIsInstallable(true);
                        setCheckingInstallable(false);
                        return;
                    }
                } else {
                    throw new Error("Service worker and BeforeInstallPromptEvent not found");
                }
            } catch (error) {
                setIsInstallable(false);
            }

            if (triesLeft > 0) {
                setTimeout(() => {
                    checkInstallability(triesLeft - 1);
                }, 1000);
            } else {
                setCheckingInstallable(false);
            }
        }
        checkInstallability(5);
    }, []);

    if (isInstalled) {
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
    if (checkingInstallable) {
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
    if (!isInstallable) {
        return <>
            <Button
                disabled
                variant="outline"
                size="sm"
                className={cn("gap-2", className)}
            >
                <X className="h-4 w-4" />
                App not installable
            </Button>
            <div className="text-xs text-muted-foreground mt-3">
                You can try <a href="https://web.dev/learn/pwa/installation" target="_blank" rel="noopener noreferrer" className="text-primary underline">installing the app manually</a> from your browser.
            </div>
        </>;
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
