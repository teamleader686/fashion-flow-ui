import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Edit, Save, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Page {
    id: string;
    slug: string;
    title: string;
    content: string;
    is_active: boolean;
    updated_at: string;
}

export default function AdminPages() {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPage, setEditingPage] = useState<Page | null>(null);

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from("pages").select("*");
            if (error) throw error;
            setPages(data || []);
        } catch (err) {
            toast.error("Failed to load pages");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("pages")
                .update({ is_active: !currentStatus })
                .eq("id", id);
            if (error) throw error;
            setPages(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
            toast.success("Page status updated");
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleSavePage = async () => {
        if (!editingPage) return;
        try {
            const { error } = await supabase
                .from("pages")
                .update({
                    title: editingPage.title,
                    content: editingPage.content,
                    updated_at: new Date()
                })
                .eq("id", editingPage.id);

            if (error) throw error;

            setPages(prev => prev.map(p => p.id === editingPage.id ? editingPage : p));
            setEditingPage(null);
            toast.success("Page updated successfully");
        } catch (err) {
            toast.error("Failed to save page");
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Manage Pages</h1>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pages.map((page) => (
                                    <TableRow key={page.id}>
                                        <TableCell>{page.title}</TableCell>
                                        <TableCell><code>/{page.slug}</code></TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={page.is_active}
                                                onCheckedChange={() => handleToggleActive(page.id, page.is_active)}
                                            />
                                        </TableCell>
                                        <TableCell>{new Date(page.updated_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingPage(page)}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Page: {page.title}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div>
                                                            <label className="text-sm font-medium mb-1 block">Title</label>
                                                            <Input
                                                                value={editingPage?.title || ""}
                                                                onChange={(e) => setEditingPage(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium mb-1 block">Content (HTML Supported)</label>
                                                            <Textarea
                                                                className="min-h-[300px] font-mono text-sm"
                                                                value={editingPage?.content || ""}
                                                                onChange={(e) => setEditingPage(prev => prev ? { ...prev, content: e.target.value } : null)}
                                                            />
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Supports HTML tags like &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, etc.
                                                            </p>
                                                        </div>
                                                        <Button onClick={handleSavePage} className="w-full">
                                                            Save Changes
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
