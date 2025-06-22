import { useState, useEffect } from "react";

import { ApiService } from "@/services/api";

import NotificationToggle from "@/components/NotificationToggle";


function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        const result = await ApiService.get("/user/");

        if (result.success) {
            setIsAuthenticated(true);
            setUser(result.user);
        }

        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated && !isLoading) {
        return (
            <div>
                <h1>Website Visitor Geolocator</h1>
                <p>Log into the Django admin site and go back to this page...</p>
                <p>Make sure you are on <code>localhost</code> instead of <code>127.0.0.1</code>!</p>
                <p><a href="http://localhost:8000/admin/">Django admin site</a></p>
            </div>
        );
    }

    return (
        <div>
            <header>
                <div>
                    <h1>Website Visitor Geolocator</h1>
                    {user && (
                        <div>
                            <span>Welcome, {user}!</span>
                        </div>
                    )}
                </div>
            </header>
            
            <main>
                <NotificationToggle />
            </main>
        </div>
    );
}

export default App;
