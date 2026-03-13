import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const handleAuth = async (session: any) => {
            console.log("Checking auth for:", session?.user?.email);
            if (!session?.user?.email) {
                if (isMounted) {
                    console.log("No session, setting authenticated to false");
                    setAuthenticated(false);
                    setLoading(false);
                }
                return;
            }

            try {
                const { data: whitelistData, error: whitelistError } = await (supabase as any)
                    .from("email_whitelist")
                    .select("email")
                    .eq("email", session.user.email.toLowerCase())
                    .single();

                if (whitelistError) {
                    // Check if it's a network error (Supabase-js often returns error details or status 0)
                    const isNetworkError = 
                        whitelistError.message?.includes("fetch") || 
                        whitelistError.message?.includes("NetworkError") ||
                        (whitelistError as any).status === 0;

                    if (isNetworkError) {
                        console.warn("Network error during whitelist check, preserving session state");
                        if (isMounted) {
                            // If we were already authenticated, keep it that way. 
                            // If it's the first load, we might need to retry or just wait.
                            // For now, we assume if session exists, they are likely allowed.
                            setAuthenticated(true);
                        }
                    } else {
                        console.error("Whitelist check failed (access denied):", whitelistError);
                        // Only sign out if it's a legitimate "not found" or other auth failure
                        await supabase.auth.signOut();
                        if (isMounted) {
                            setAuthenticated(false);
                        }
                    }
                } else if (!whitelistData) {
                    console.error("User not in whitelist");
                    await supabase.auth.signOut();
                    if (isMounted) {
                        setAuthenticated(false);
                    }
                } else {
                    console.log("User allowed by whitelist");
                    if (isMounted) {
                        setAuthenticated(true);
                    }
                }
            } catch (err) {
                console.error("ProtectedRoute Error:", err);
                // On unexpected errors, we err on the side of caution but try to avoid logout if possible
                if (isMounted) {
                    // If we have a session, let's try to stay authenticated
                    setAuthenticated(!!session);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuth(session);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("Auth state change event:", _event);
            handleAuth(session);
        });

        // Proactive session refresh when app becomes visible (e.g. tablet wake up)
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                console.log("App became visible, refreshing session...");
                const { data: { session }, error } = await supabase.auth.refreshSession();
                if (error) {
                    console.error("Error refreshing session on visibility change:", error);
                    // Don't force logout here if it's a network error
                    if (error.message?.includes("fetch") || (error as any).status === 0) return;
                }
                if (session) {
                    handleAuth(session);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
