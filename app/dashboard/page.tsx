"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { clearTokens, getCurrentUser, AuthUser } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { BackendStatusBadge } from "@/components/BackendStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Trash2,
  Edit2,
  Shield,
  UserCheck,
  LogOut,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  Code,
  ArrowLeft,
  Calendar,
  Heart,
  Sparkles,
} from "lucide-react";

export interface UserRecord {
  id: number;
  username: string;
  role: string;
  created_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("user");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete Confirmation State
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Show Postman / MySQL guide
  const [showTechGuide, setShowTechGuide] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setError("");
    setRefreshing(true);
    try {
      const data = await apiClient<UserRecord[]>("/users", {
        method: "GET",
        requiresAuth: true,
      });

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load users from MySQL backend");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.HOME);
  };

  // Add User handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);

    try {
      await apiClient("/users", {
        method: "POST",
        body: JSON.stringify({
          username: addUsername.trim(),
          password: addPassword,
          role: addRole,
        }),
      });

      setSuccessMessage(`User '${addUsername}' saved to MySQL!`);
      setShowAddModal(false);
      setAddUsername("");
      setAddPassword("");
      setAddRole("user");
      await fetchUsers();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setAddError(err.message || "Failed to create user.");
    } finally {
      setAddLoading(false);
    }
  };

  // Open Edit User
  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditRole(u.role || "user");
    setEditPassword("");
    setEditError("");
  };

  // Save Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError("");
    setEditLoading(true);

    try {
      const payload: Record<string, string> = {
        username: editUsername.trim(),
        role: editRole,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      await apiClient(`/users/${editingUser.id}`, {
        method: "PUT",
        requiresAuth: true,
        body: JSON.stringify(payload),
      });

      setSuccessMessage(`User #${editingUser.id} updated successfully!`);
      setEditingUser(null);
      await fetchUsers();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setEditError(err.message || "Failed to update user.");
    } finally {
      setEditLoading(false);
    }
  };

  // Confirm Delete User
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteError("");
    setDeleteLoading(true);

    try {
      await apiClient(`/users/${deletingUser.id}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      setSuccessMessage(`User '${deletingUser.username}' deleted.`);
      setDeletingUser(null);
      await fetchUsers();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete user.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(u.id).includes(searchQuery) ||
        (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        roleFilter === "all" ||
        (u.role && u.role.toLowerCase() === roleFilter.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Metric stats
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role?.toLowerCase() === "admin").length;
  const standardCount = totalUsers - adminCount;

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="size-6 animate-spin text-pink-500" />
          <p className="text-xs text-muted-foreground font-medium">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-background to-rose-50/20 text-foreground flex flex-col relative overflow-hidden">
      {/* Delicate background ambient glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-rose-200/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Minimalist Top Header */}
      <header className="border-b border-pink-100/80 bg-white/70 dark:bg-card/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={CONFIG.ROUTES.HOME}
              className="size-8 rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-950/60 dark:text-pink-300 flex items-center justify-center border border-pink-200/70 hover:opacity-90 transition shadow-2xs"
              title="Return to Welcome Page"
            >
              <Heart className="size-4 fill-pink-500/20 text-pink-500" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-semibold text-sm tracking-tight">
                  User Dashboard
                </h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-100/80 text-pink-700 font-medium border border-pink-200/50 hidden sm:inline-block">
                  MySQL
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Live database user management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BackendStatusBadge />

            {currentUser && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50/70 border border-pink-200/60 text-xs">
                <div className="size-5 rounded-full bg-pink-200 text-pink-800 font-bold flex items-center justify-center text-[10px]">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-pink-900 text-xs">{currentUser.username}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-white text-pink-600 border border-pink-200/60 font-semibold">
                  {currentUser.role}
                </span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(CONFIG.ROUTES.HOME)}
              className="rounded-full text-xs hover:bg-pink-50 text-muted-foreground hidden sm:inline-flex"
            >
              <ArrowLeft className="size-3.5 mr-1" />
              Welcome
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="rounded-full text-xs text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="size-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Banner Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl border border-rose-200/80 bg-rose-50/80 text-rose-800 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={fetchUsers}
              className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-100/50"
            >
              <RefreshCw className="size-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl border border-pink-200/80 bg-pink-50/80 text-pink-800 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-pink-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-pink-400 hover:text-pink-700 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Minimalist Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/90 dark:bg-card rounded-3xl border border-pink-100/80 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Total Users
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {loading ? "..." : totalUsers}
              </span>
            </div>
            <div className="size-10 rounded-2xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </div>

          <div className="bg-white/90 dark:bg-card rounded-3xl border border-pink-100/80 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Administrators
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {loading ? "..." : adminCount}
              </span>
            </div>
            <div className="size-10 rounded-2xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
              <Shield className="size-5" />
            </div>
          </div>

          <div className="bg-white/90 dark:bg-card rounded-3xl border border-pink-100/80 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Standard Users
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {loading ? "..." : standardCount}
              </span>
            </div>
            <div className="size-10 rounded-2xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
              <UserCheck className="size-5" />
            </div>
          </div>

          <div className="bg-white/90 dark:bg-card rounded-3xl border border-pink-100/80 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Database
              </span>
              <span className="text-sm font-semibold text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-pink-500 animate-pulse" />
                defaultdb
              </span>
            </div>
            <div className="size-10 rounded-2xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
              <Database className="size-5" />
            </div>
          </div>
        </div>

        {/* Minimalist Users Card */}
        <div className="bg-white dark:bg-card rounded-3xl border border-pink-100/90 dark:border-pink-900/40 shadow-sm shadow-pink-100/30 overflow-hidden">
          {/* Action Bar */}
          <div className="p-5 border-b border-pink-100/80 dark:border-pink-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
                Users Directory
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100/70 text-pink-700 font-medium">
                  {filteredUsers.length} records
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Stored in MySQL Workbench <code>users</code> table
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTechGuide(!showTechGuide)}
                className="rounded-2xl text-xs hover:bg-pink-50 text-pink-700 border border-pink-200/60"
              >
                <Code className="size-3.5 mr-1 text-pink-500" />
                {showTechGuide ? "Hide Guide" : "Postman Info"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={fetchUsers}
                disabled={refreshing}
                className="rounded-2xl text-xs hover:bg-pink-50 text-pink-700 border border-pink-200/60"
              >
                <RefreshCw className={`size-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs px-3.5 shadow-sm shadow-pink-200/50"
              >
                <UserPlus className="size-3.5 mr-1.5" />
                Add User
              </Button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="px-5 py-3.5 bg-pink-50/20 border-b border-pink-100/60 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="size-3.5 absolute left-3.5 top-3 text-pink-400" />
              <Input
                type="text"
                placeholder="Search username, role, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-2xl border-pink-200/70 bg-white/80 focus-visible:ring-pink-400"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 w-full rounded-2xl border border-pink-200/70 bg-white/80 px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-pink-400 text-foreground"
              >
                <option value="all">All Roles ({totalUsers})</option>
                <option value="admin">Administrators ({adminCount})</option>
                <option value="user">Standard Users ({standardCount})</option>
              </select>
            </div>
          </div>

          {/* Postman & MySQL Cheatsheet */}
          {showTechGuide && (
            <div className="p-4 bg-pink-50/40 border-b border-pink-100 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-pink-900 font-semibold text-xs">
                <span className="flex items-center gap-1.5">
                  <Database className="size-3.5 text-pink-500" />
                  Postman API Reference
                </span>
                <span className="text-[10px] text-pink-500 font-mono">
                  Base URL: http://localhost:5000
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-white border border-pink-200/70 space-y-1">
                  <div><span className="text-pink-600 font-bold">GET</span> <code>/users</code> - List all users</div>
                  <div><span className="text-pink-600 font-bold">POST</span> <code>/auth/login</code> - Get accessToken</div>
                  <div><span className="text-pink-600 font-bold">POST</span> <code>/auth/register</code> - Create account</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-pink-200/70 space-y-1">
                  <div className="text-muted-foreground font-sans text-[10px]">MySQL Workbench Query:</div>
                  <code className="text-pink-800 block">SELECT user_id, username, role, created_at FROM users;</code>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          {loading ? (
            <div className="p-12 text-center space-y-2">
              <RefreshCw className="size-6 animate-spin mx-auto text-pink-500" />
              <p className="text-xs text-muted-foreground">
                Loading users from MySQL database...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="size-10 mx-auto text-pink-300" />
              <h3 className="font-semibold text-sm">No Users Found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {searchQuery || roleFilter !== "all"
                  ? "No users match your search criteria."
                  : "No users exist in the MySQL database yet. Add one above!"}
              </p>
              {searchQuery || roleFilter !== "all" ? (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                  }}
                  className="rounded-full border-pink-200 text-xs"
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs"
                >
                  Add First User
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-pink-50/50 hover:bg-pink-50/50 border-pink-100/80">
                  <TableHead className="w-16 text-pink-900/70 font-semibold text-[11px] pl-6">ID</TableHead>
                  <TableHead className="text-pink-900/70 font-semibold text-[11px]">User</TableHead>
                  <TableHead className="text-pink-900/70 font-semibold text-[11px]">Role</TableHead>
                  <TableHead className="text-pink-900/70 font-semibold text-[11px]">Created</TableHead>
                  <TableHead className="text-right text-pink-900/70 font-semibold text-[11px] pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isSelf = !!currentUser && currentUser.id === user.id;
                  return (
                    <TableRow
                      key={user.id}
                      className="hover:bg-pink-50/30 transition-colors border-pink-100/60"
                    >
                      <TableCell className="font-mono text-xs text-pink-400 pl-6 font-medium">
                        #{user.id}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-full bg-pink-100 text-pink-700 font-semibold flex items-center justify-center text-xs border border-pink-200/50">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-xs text-foreground">
                              {user.username}
                            </span>
                            {isSelf && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-100 text-pink-600 font-medium">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={user.role?.toLowerCase() === "admin" ? "default" : "secondary"}
                          className="capitalize text-[11px] py-0"
                        >
                          {user.role?.toLowerCase() === "admin" && (
                            <Shield className="size-2.5 mr-1 text-pink-500" />
                          )}
                          {user.role || "user"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {user.created_at ? (
                          <span className="text-[11px]">
                            {new Date(user.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-[11px] italic text-muted-foreground/60">&mdash;</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEditModal(user)}
                            className="hover:bg-pink-100/60 text-pink-600 rounded-xl size-7"
                            title="Edit User"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              setDeleteError("");
                              setDeletingUser(user);
                            }}
                            className="hover:bg-rose-100/50 text-rose-500 rounded-xl size-7"
                            title="Delete User"
                            disabled={isSelf}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {/* Minimalist MODAL 1: Add User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-card rounded-3xl border border-pink-200/80 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-pink-100">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-pink-900">
                <UserPlus className="size-4 text-pink-500" />
                Add New User
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5">
              {addError && (
                <div className="p-2.5 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
                  {addError}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="add-username" className="text-xs font-medium">Username</Label>
                <Input
                  id="add-username"
                  type="text"
                  placeholder="e.g. johndoe"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  required
                  className="rounded-xl border-pink-200 bg-pink-50/20 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="add-password" className="text-xs font-medium">Password</Label>
                <Input
                  id="add-password"
                  type="password"
                  placeholder="Set password"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  required
                  className="rounded-xl border-pink-200 bg-pink-50/20 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="add-role" className="text-xs font-medium">Role</Label>
                <select
                  id="add-role"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="h-9 w-full rounded-xl border border-pink-200 bg-pink-50/20 px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                >
                  <option value="user">Standard User (user)</option>
                  <option value="admin">Administrator (admin)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addLoading}
                  className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs px-4"
                >
                  {addLoading ? "Saving..." : "Save User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minimalist MODAL 2: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-card rounded-3xl border border-pink-200/80 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-pink-100">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-pink-900">
                <Edit2 className="size-4 text-pink-500" />
                Edit User #{editingUser.id}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {editError && (
                <div className="p-2.5 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
                  {editError}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="edit-username" className="text-xs font-medium">Username</Label>
                <Input
                  id="edit-username"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  className="rounded-xl border-pink-200 bg-pink-50/20 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-password" className="text-xs font-medium">New Password (optional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="rounded-xl border-pink-200 bg-pink-50/20 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-role" className="text-xs font-medium">Role</Label>
                <select
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="h-9 w-full rounded-xl border border-pink-200 bg-pink-50/20 px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={editLoading}
                  className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs px-4"
                >
                  {editLoading ? "Saving..." : "Update"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minimalist MODAL 3: Delete Confirmation */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-card rounded-3xl border border-rose-200 p-6 shadow-2xl space-y-4 text-center">
            <div className="size-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="size-5" />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-foreground">Delete Account?</h3>
              <p className="text-xs text-muted-foreground">
                Remove <strong>"{deletingUser.username}"</strong> (ID: #{deletingUser.id}) from MySQL database?
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200 text-left">
                {deleteError}
              </div>
            )}

            <div className="pt-2 flex justify-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeletingUser(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deleteLoading}
                onClick={handleDeleteUser}
                className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs px-4"
              >
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
