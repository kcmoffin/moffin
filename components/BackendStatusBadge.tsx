"use client";

import { useEffect, useState } from "react";
import { checkBackendHealth, getEffectiveApiBaseUrl, setCustomApiBaseUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Server, RefreshCw, Settings2, CheckCircle2 } from "lucide-react";

export function BackendStatusBadge() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [backendUrl, setBackendUrl] = useState("");
  const [message, setMessage] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const verifyConnection = async (urlToTest?: string) => {
    setStatus("checking");
    const activeUrl = urlToTest || getEffectiveApiBaseUrl();
    setBackendUrl(activeUrl);
    const result = await checkBackendHealth(activeUrl);
    if (result.ok) {
      setStatus("online");
      setMessage(result.message || "Connected to MySQL Backend");
    } else {
      setStatus("offline");
      setMessage(result.error || "Cannot reach backend");
    }
  };

  useEffect(() => {
    const current = getEffectiveApiBaseUrl();
    setBackendUrl(current);
    setCustomInput(current);
    verifyConnection(current);
  }, []);

  const handleSaveCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      setCustomApiBaseUrl(customInput.trim());
      setBackendUrl(customInput.trim());
      setShowConfig(false);
      verifyConnection(customInput.trim());
    }
  };

  const handleResetDefault = () => {
    setCustomApiBaseUrl(null);
    const def = getEffectiveApiBaseUrl();
    setCustomInput(def);
    setBackendUrl(def);
    setShowConfig(false);
    verifyConnection(def);
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border border-pink-200/80 bg-white/90 hover:bg-pink-50/60 dark:bg-card dark:border-pink-900/50 dark:hover:bg-pink-950/40 transition shadow-xs cursor-pointer"
          title="Click to configure backend URL or test connection"
        >
          {status === "checking" && (
            <>
              <RefreshCw className="size-3 animate-spin text-pink-500" />
              <span className="text-muted-foreground text-[11px]">Connecting...</span>
            </>
          )}

          {status === "online" && (
            <>
              <span className="size-2 rounded-full bg-pink-500 ring-2 ring-pink-200 animate-pulse" />
              <span className="text-pink-800 dark:text-pink-300 font-medium text-[11px]">
                MySQL Live
              </span>
              <span className="text-pink-400 text-[10px] hidden sm:inline">
                ({backendUrl ? (backendUrl.includes(":") ? `:${backendUrl.split(":").pop()?.replace(/\D/g, "")}` : backendUrl) : "5000"})
              </span>
            </>
          )}

          {status === "offline" && (
            <>
              <span className="size-2 rounded-full bg-rose-400 ring-2 ring-rose-100" />
              <span className="text-rose-700 dark:text-rose-400 font-medium text-[11px]">
                Offline
              </span>
              <Settings2 className="size-3 text-pink-400 ml-0.5" />
            </>
          )}
        </button>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => verifyConnection()}
          className="hover:bg-pink-100/50 text-pink-500 rounded-full size-7"
          title="Refresh backend ping"
        >
          <RefreshCw className="size-3" />
        </Button>
      </div>

      {showConfig && (
        <div className="absolute right-0 mt-2 w-80 p-4 bg-white dark:bg-card border border-pink-200/80 dark:border-pink-900/60 rounded-2xl shadow-xl shadow-pink-100/50 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-pink-100 dark:border-pink-900/40">
            <h4 className="font-semibold text-xs flex items-center gap-1.5 text-pink-900 dark:text-pink-200">
              <Server className="size-3.5 text-pink-500" />
              Backend Connection
            </h4>
            <Badge
              variant={status === "online" ? "default" : "destructive"}
              className="text-[10px] px-2 py-0"
            >
              {status.toUpperCase()}
            </Badge>
          </div>

          <p className="text-[11px] text-muted-foreground mb-3">
            {message}
          </p>

          <form onSubmit={handleSaveCustomUrl} className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-foreground block mb-1">
                API Base URL (Postman target):
              </label>
              <Input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="http://localhost:5000"
                className="text-xs h-8 border-pink-200 focus-visible:ring-pink-400 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="xs"
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-xs"
              >
                Save & Test
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleResetDefault}
                className="rounded-xl border-pink-200 hover:bg-pink-50"
              >
                Reset
              </Button>
            </div>
          </form>

          <div className="mt-3 pt-2 border-t border-pink-100 dark:border-pink-900/40 text-[10px] text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Target URL:</span>
              <code className="text-pink-700 dark:text-pink-300 font-mono">
                {backendUrl || "http://localhost:5000"}
              </code>
            </div>
            <div className="flex justify-between">
              <span>MySQL Database:</span>
              <code className="text-pink-700 dark:text-pink-300 font-mono">defaultdb</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
