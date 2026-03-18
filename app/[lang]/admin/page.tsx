"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert, Users, Settings2, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Assuming api needs to be imported this way if it wasn't exported directly from _generated/api
const api = require("@/convex/_generated/api").api;

export default function AdminPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    
    const email = user?.primaryEmailAddress?.emailAddress;
    const isAdmin = useQuery(api.admin.isAdmin, email ? { email } : "skip");

    useEffect(() => {
        if (isLoaded && isAdmin === false) {
            router.push("/");
        }
    }, [isLoaded, isAdmin, router]);

    if (!isLoaded || isAdmin === undefined) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-r-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse">Verifying credentials...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!isAdmin) return null; // Will redirect

    return (
        <DashboardLayout>
            <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    </div>
                    <p className="text-muted-foreground">Manage platform settings, verify system health, and oversee administrative access.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-card hover:shadow-md transition-all duration-300 border-border/50 group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Platform Status</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">Operational</div>
                            <p className="text-xs text-muted-foreground mt-1">All systems responding normally</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card hover:shadow-md transition-all duration-300 border-border/50 group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Administrators</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Manual Access</div>
                            <p className="text-xs text-muted-foreground mt-1">Managed via Convex Dashboard</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card hover:shadow-md transition-all duration-300 border-border/50 group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Security Level</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Protected</div>
                            <p className="text-xs text-muted-foreground mt-1">Role-based access enforced</p>
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="border-border/50 shadow-sm mt-8 overflow-hidden relative">
                    {/* Decorative background element for aesthetic */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-primary" />
                            System Configuration
                        </CardTitle>
                        <CardDescription>
                            Administrative controls and global platform settings will be implemented here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center border-t border-border/50 bg-muted/10 relative z-10">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <div className="p-4 bg-background rounded-full border border-border/50 shadow-sm">
                                <ShieldAlert className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground/70">Restricted Area</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
