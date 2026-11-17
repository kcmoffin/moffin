"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { BackendStatusBadge } from "@/components/BackendStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus, Heart } from "lucide-react";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isChecking) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password,
          role,
        }),
      });

      // Auto login after registration
      try {
        const loginData = await apiClient<LoginResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username: username.trim(), password }),
        });
        setTokens(loginData.accessToken, loginData.refreshToken);
        router.push(CONFIG.ROUTES.DASHBOARD);
      } catch {
        router.push(CONFIG.ROUTES.LOGIN);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Username may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 via-background to-rose-50/20 text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-sm mb-4 flex items-center justify-between">
        <Link
          href={CONFIG.ROUTES.HOME}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-pink-600 transition"
        >
          <ArrowLeft className="size-3.5" />
          Welcome Page
        </Link>
        <BackendStatusBadge />
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-card rounded-3xl border border-pink-100/90 dark:border-pink-900/50 shadow-xl shadow-pink-100/30 p-6 sm:p-7 space-y-5">
        <div className="text-center space-y-1.5">
          <div className="size-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto border border-pink-200/70 shadow-2xs mb-2">
            <Heart className="size-5 fill-pink-500/20 text-pink-500" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Create Account
          </h2>
          <p className="text-xs text-muted-foreground">
            Sign up to add a new user to MySQL database.
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50/70 border border-rose-200 rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="username" className="text-xs font-medium">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="e.g. khiana"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="rounded-xl border-pink-200 bg-pink-50/20 focus-visible:ring-pink-400 text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border-pink-200 bg-pink-50/20 focus-visible:ring-pink-400 text-xs h-9"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl py-2.5 font-medium text-xs shadow-md shadow-pink-200/40 mt-1"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-1">
            Already have an account?{" "}
            <Link
              href={CONFIG.ROUTES.LOGIN}
              className="text-pink-600 font-medium hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
