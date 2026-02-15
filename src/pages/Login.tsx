import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lock } from "lucide-react";


export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isRegistering) {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }

                // First check if email is whitelisted
                const { data: whitelistData, error: whitelistError } = await supabase
                    .from("email_whitelist")
                    .select("email")
                    .eq("email", email.toLowerCase())
                    .single();

                if (whitelistError || !whitelistData) {
                    throw new Error("This email is not whitelisted. Access denied.");
                }

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });

                if (error) throw error;

                toast({
                    title: "Success!",
                    description: "Registration successful. You can now log in.",
                });
                setIsRegistering(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                // After successful sign in, verify whitelist
                const { data: whitelistData, error: whitelistError } = await supabase
                    .from("email_whitelist")
                    .select("email")
                    .eq("email", email.toLowerCase())
                    .single();

                if (whitelistError || !whitelistData) {
                    await supabase.auth.signOut();
                    throw new Error("This email is not whitelisted. Access denied.");
                }

                toast({
                    title: "Welcome back!",
                    description: "Successfully logged in.",
                });
                navigate("/");
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Operation failed",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center gap-4">
                    <img src={`${import.meta.env.BASE_URL}pao_logo.png`} alt="Logo" className="h-24 w-auto" />
                    <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">
                        Room Booker
                    </h1>
                    <p className="text-muted-foreground text-center">
                        {isRegistering ? "Create your account" : "Log in with your Supabase account"}
                    </p>
                </div>

                <Card className="border-border shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            {isRegistering ? "Register" : "Login"}
                        </CardTitle>
                        <CardDescription>
                            {isRegistering
                                ? "Fill in the details below to create your account."
                                : "Enter your credentials to manage meeting rooms."}
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {isRegistering && (
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            {isRegistering && (
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isRegistering ? "Registering..." : "Logging in..."}
                                    </>
                                ) : (
                                    isRegistering ? "Register" : "Login"
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="link"
                                className="w-full"
                                onClick={() => setIsRegistering(!isRegistering)}
                                disabled={loading}
                            >
                                {isRegistering
                                    ? "Already have an account? Login"
                                    : "Don't have an account? Register"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
