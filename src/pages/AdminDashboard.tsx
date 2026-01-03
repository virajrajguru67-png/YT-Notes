
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Users, FileText, Activity, Lock, Unlock, Clock, AlertTriangle, Search, Eye, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsData {
    date: string;
    count: number;
}

interface DashboardStats {
    users: number;
    notes: number;
    analytics?: {
        users: AnalyticsData[];
        notes: AnalyticsData[];
    };
}

export default function AdminDashboard() {
    const { token, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({ users: 0, notes: 0 });
    const [users, setUsers] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userSearch, setUserSearch] = useState("");
    const [noteSearch, setNoteSearch] = useState("");
    const [viewNote, setViewNote] = useState<any | null>(null);

    useEffect(() => {
        if (!isAdmin) {
            toast.error("Access Denied: Admins only.");
            navigate("/");
            return;
        }
        fetchData();
    }, [isAdmin, navigate]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const fetchWithAuth = async (url: string) => {
                const res = await fetch(url, { headers });
                if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
                return res.json();
            };

            const [statsData, usersData, notesData] = await Promise.all([
                fetchWithAuth("/api/admin/stats"),
                fetchWithAuth("/api/admin/users"),
                fetchWithAuth("/api/admin/notes")
            ]);

            setStats(statsData);
            setUsers(usersData);
            setNotes(notesData);
        } catch (error) {
            console.error("Admin Dashboard Error:", error);
            toast.error("Failed to load admin data");
        } finally {
            setIsLoading(false);
        }
    };

    const suspendUser = async (id: number, duration: string) => {
        try {
            const res = await fetch(`/api/admin/users/${id}/suspend`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ duration })
            });
            if (res.ok) {
                toast.success(`User suspended for ${duration}`);
                fetchData();
            } else {
                toast.error("Failed to suspend user");
            }
        } catch (error) {
            toast.error("Error suspending user");
        }
    };

    const unsuspendUser = async (id: number) => {
        try {
            const res = await fetch(`/api/admin/users/${id}/unsuspend`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("User unsuspended");
                fetchData();
            } else {
                toast.error("Failed to unsuspend user");
            }
        } catch (error) {
            toast.error("Error unsuspending user");
        }
    };

    const deleteUser = async (id: number) => {
        if (!confirm("Delete this user? This cannot be undone.")) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("User deleted");
                fetchData();
            } else {
                toast.error("Failed to delete user");
            }
        } catch (error) {
            toast.error("Error deleting user");
        }
    };

    const deleteNote = async (id: number) => {
        if (!confirm("Delete this note?")) return;
        try {
            const res = await fetch(`/api/admin/notes/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Note deleted");
                fetchData();
            } else {
                toast.error("Failed to delete note");
            }
        } catch (error) {
            toast.error("Error deleting note");
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
        n.video_id.toLowerCase().includes(noteSearch.toLowerCase()) ||
        n.username.toLowerCase().includes(noteSearch.toLowerCase())
    );

    if (!isAdmin) return null;

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">Platform management and analytics overview.</p>
                </div>
                <Button onClick={fetchData} variant="outline" className="gap-2">
                    <Activity className="h-4 w-4" /> Refresh Data
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="notes">Content</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.users}</div>
                                <p className="text-xs text-muted-foreground">+ from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.notes}</div>
                                <p className="text-xs text-muted-foreground">Generated guides</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* CHARTS */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-primary" /> User Growth (Last 7 Days)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats.analytics?.users || []}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })} />
                                        <YAxis fontSize={12} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                            labelStyle={{ color: 'var(--muted-foreground)' }}
                                        />
                                        <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" /> Content Generation (Last 7 Days)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.analytics?.notes || []}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })} />
                                        <YAxis fontSize={12} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                            labelStyle={{ color: 'var(--muted-foreground)' }}
                                            cursor={{ fill: 'var(--accent)' }}
                                        />
                                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* USERS TAB */}
                <TabsContent value="users" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name or email..."
                                className="pl-9"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{u.username}</span>
                                                <span className="text-xs text-muted-foreground">{u.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={u.role === 'admin' ? "border-primary/50 text-primary bg-primary/10" : ""}>
                                                    {u.role}
                                                </Badge>
                                                {u.suspended_until && new Date(u.suspended_until) > new Date() && (
                                                    <Badge variant="destructive">
                                                        <Lock className="w-3 h-3 mr-1" /> Suspended
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {u.role !== 'admin' && (
                                                <div className="flex justify-end gap-1">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/20">
                                                                <AlertTriangle className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Suspend Access</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {u.suspended_until && new Date(u.suspended_until) > new Date() ? (
                                                                <DropdownMenuItem onClick={() => unsuspendUser(u.id)} className="text-green-600 dark:text-green-400 cursor-pointer">
                                                                    <Unlock className="w-4 h-4 mr-2" /> Unsuspend
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <>
                                                                    {['day', 'week', 'month', 'year'].map(period => (
                                                                        <DropdownMenuItem key={period} onClick={() => suspendUser(u.id, period)} className="cursor-pointer capitalize">
                                                                            <Clock className="w-4 h-4 mr-2" /> 1 {period}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => suspendUser(u.id, 'permanent')} className="text-destructive cursor-pointer">
                                                                        <Lock className="w-4 h-4 mr-2" /> Permanent
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* CONTENT TAB */}
                <TabsContent value="notes" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search notes by title, owner, or video..."
                                className="pl-9"
                                value={noteSearch}
                                onChange={(e) => setNoteSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Note Info</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredNotes.map((n) => (
                                    <TableRow key={n.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium truncate max-w-[300px]">{n.title}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{n.video_id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{n.username}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => setViewNote(n)} className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteNote(n.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* VIEW NOTE DIALOG */}
            <Dialog open={!!viewNote} onOpenChange={() => setViewNote(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{viewNote?.title}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] mt-4 rounded-md border p-4">
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-muted-foreground italic">
                                Note Content Preview:
                                <br />
                                {viewNote?.content || "Content not loaded in list view. Implement fetch for full details."}
                            </p>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
