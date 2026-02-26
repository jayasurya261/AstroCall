import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function getRedirectPath(role) {
    if (role === "astrologer") return "/astrologer-dashboard";
    if (role === "superadmin") return "/admin-dashboard";
    return "/user-dashboard";
}

export default function Login() {
    const [role, setRole] = useState("user");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Google Auth — two-step state
    const [needsGoogleRole, setNeedsGoogleRole] = useState(false);
    const [pendingGoogleUser, setPendingGoogleUser] = useState(null);

    const navigate = useNavigate();
    const { loginWithGoogle, completeGoogleLoginWithRole } = useAuth();
    const { t } = useTranslation();

    // ─── Google Sign-In ──────────────────────────────────────────────
    async function handleGoogleLogin() {
        setError("");
        setLoading(true);
        try {
            const result = await loginWithGoogle();

            if (result.requiresRole) {
                // New user — show role picker
                setPendingGoogleUser(result.user);
                setNeedsGoogleRole(true);
            } else {
                // Existing user — redirect based on stored role
                navigate(getRedirectPath(result.role));
            }
        } catch (err) {
            setError(err.message || t('login.authError'));
        }
        setLoading(false);
    }

    // ─── Complete Google Sign-In (after role is chosen) ──────────────
    async function handleCompleteGoogle() {
        if (!pendingGoogleUser) return;
        setLoading(true);
        setError("");
        try {
            await completeGoogleLoginWithRole(pendingGoogleUser, role);
            navigate(getRedirectPath(role));
        } catch (err) {
            setError(err.message || t('login.completeError'));
        }
        setLoading(false);
    }

    // ─── RENDER: Role Selection (Google new user) ────────────────────
    if (needsGoogleRole) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">{t('login.chooseRole')}</CardTitle>
                        <CardDescription className="text-center">
                            {t('login.chooseRoleDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-100/50 rounded-md border border-red-200">{error}</div>}
                        <div className="space-y-4">
                            <Label>{t('login.joinAs')}</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant={role === "user" ? "default" : "outline"}
                                    onClick={() => setRole("user")}
                                    className="h-20 flex-col gap-1"
                                >
                                    <span className="text-lg">👤</span>
                                    <span>{t('common.user')}</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant={role === "astrologer" ? "default" : "outline"}
                                    onClick={() => setRole("astrologer")}
                                    className="h-20 flex-col gap-1"
                                >
                                    <span className="text-lg">⭐</span>
                                    <span>{t('common.astrologer')}</span>
                                </Button>
                            </div>
                            <Button disabled={loading} className="w-full mt-4" onClick={handleCompleteGoogle}>
                                {loading ? t('login.settingUp') : t('login.completeSignIn')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── RENDER: Google Sign-In Only ─────────────────────────────────
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">{t('login.welcomeTitle')}</CardTitle>
                    <CardDescription className="text-center">
                        {t('login.welcomeDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-100/50 rounded-md border border-red-200">{error}</div>}

                    <Button
                        variant="outline"
                        type="button"
                        className="w-full flex items-center gap-2 h-12 text-base"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            className="w-5 h-5"
                        >
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {loading ? t('login.pleaseWait') : t('login.continueGoogle')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
