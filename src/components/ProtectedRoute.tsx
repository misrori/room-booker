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
                const { data: whitelistData, error: whitelistError } = await supabase
                    .from("email_whitelist")
                    .select("email")
                    .eq("email", session.user.email.toLowerCase())
                    .single();

                if (whitelistError || !whitelistData) {
                    console.error("Whitelist check failed or user not allowed:", whitelistError);
                    // Explicitly sign out to clear the session if they are not allowed
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
                if (isMounted) {
                    setAuthenticated(false);
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

        return () => {
            isMounted = false;
            subscription.unsubscribe();
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
