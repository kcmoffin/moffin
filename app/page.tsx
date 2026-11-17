"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { setTokens, getCurrentUser, clearTokens, AuthUser } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { BackendStatusBadge } from "@/components/BackendStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  LogIn,
  UserPlus,
  ArrowRight,
  LogOut,
  CheckCircle2,
  Heart,
} from "lucide-react";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export default function WelcomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const data = await apiClient<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!data.accessToken) {
        throw new Error("No access token returned from backend.");
      }

      setTokens(data.accessToken, data.refreshToken);
      router.push(CONFIG.ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password,
          role: "user",
        }),
      });

      setSuccessMessage(`Account created for '${username}'! Signing you in...`);

      // Auto login after registration
      try {
        const loginData = await apiClient<LoginResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username: username.trim(), password }),
        });
        setTokens(loginData.accessToken, loginData.refreshToken);
        setTimeout(() => {
          router.push(CONFIG.ROUTES.DASHBOARD);
        }, 600);
      } catch {
        setActiveTab("login");
        setPassword("");
        setSuccessMessage("Account created! Please sign in with your password.");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Try a different username.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 via-background to-rose-50/30 text-foreground flex flex-col justify-between relative overflow-hidden">
      {/* Ambient pink glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-pink-200/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Minimalist Top Header */}
      <header className="border-b border-pink-100/80 bg-white/60 dark:bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-950/60 dark:text-pink-300 flex items-center justify-center font-semibold border border-pink-200/70 shadow-2xs">
              <Heart className="size-4 fill-pink-500/20 text-pink-500" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">
              moffin<span className="text-pink-500 font-bold">.</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <BackendStatusBadge />

            {currentUser && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => router.push(CONFIG.ROUTES.DASHBOARD)}
                  className="rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs px-3.5 shadow-xs"
                >
                  <Users className="size-3.5 mr-1" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="rounded-full text-xs text-muted-foreground hover:text-rose-600 hover:bg-pink-50/50"
                >
                  <LogOut className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Minimalist Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
        {currentUser ? (
          /* Logged In View */
          <div className="w-full max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-card rounded-3xl border border-pink-200/80 dark:border-pink-900/50 shadow-xl shadow-pink-100/40 p-8 text-center space-y-5">
              <div className="size-16 rounded-full bg-pink-100 text-pink-600 font-semibold text-2xl flex items-center justify-center mx-auto border-2 border-pink-200/60">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-pink-500">
                  Logged In
                </span>
                <h2 className="text-xl font-semibold text-foreground">
                  {currentUser.username}
                </h2>
              </div>

              <Button
                onClick={() => router.push(CONFIG.ROUTES.DASHBOARD)}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl py-2.5 shadow-md shadow-pink-200/50 font-medium gap-2 text-xs"
              >
                Go to Users Dashboard
                <ArrowRight className="size-4" />
              </Button>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-xs text-muted-foreground hover:text-rose-600 rounded-xl"
              >
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          /* Pure Minimalist Auth Card */
          <div className="w-full max-w-sm mx-auto space-y-5">
            <div className="bg-white dark:bg-card rounded-3xl border border-pink-100/90 dark:border-pink-900/50 shadow-xl shadow-pink-100/40 p-6 sm:p-7 space-y-5">
              {/* Segmented Switcher */}
              <div className="p-1 bg-pink-50/80 dark:bg-pink-950/40 rounded-2xl border border-pink-100/80 dark:border-pink-900/40 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setError("");
                    setSuccessMessage("");
                  }}
                  className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === "login"
                      ? "bg-white dark:bg-card text-pink-800 dark:text-pink-200 shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setError("");
                    setSuccessMessage("");
                  }}
                  className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === "register"
                      ? "bg-white dark:bg-card text-pink-800 dark:text-pink-200 shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Status Alerts */}
              {error && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 rounded-2xl">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 text-xs text-pink-700 bg-pink-50/80 dark:bg-pink-950/40 border border-pink-200/80 rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-pink-500 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form Content */}
              {activeTab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="login-username" className="text-xs font-medium text-foreground">
                      Username
                    </Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="e.g. khiana"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="rounded-xl border-pink-200/80 bg-pink-50/20 focus-visible:ring-pink-400 text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="login-password" className="text-xs font-medium text-foreground">
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="rounded-xl border-pink-200/80 bg-pink-50/20 focus-visible:ring-pink-400 text-xs h-9"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl py-2.5 font-medium text-xs shadow-md shadow-pink-200/40 mt-2"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="reg-username" className="text-xs font-medium text-foreground">
                      Username
                    </Label>
                    <Input
                      id="reg-username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="rounded-xl border-pink-200/80 bg-pink-50/20 focus-visible:ring-pink-400 text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-password" className="text-xs font-medium text-foreground">
                      Password
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="rounded-xl border-pink-200/80 bg-pink-50/20 focus-visible:ring-pink-400 text-xs h-9"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl py-2.5 font-medium text-xs shadow-md shadow-pink-200/40 mt-2"
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-pink-100/70 py-4 text-center text-[11px] text-muted-foreground">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-pink-400" />
            moffin
          </span>
          <span>MySQL Workbench &bull; Postman</span>
        </div>
      </footer>
    </div>
  );
}
