import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    is_active: boolean;
}

export default function AdminFAQ() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingFAQ, setEditingFAQ] = useState<Partial<FAQ>>({ question: "", answer: "" });
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            const { data } = await supabase.from("faqs").select("*").order("created_at", { ascending: true });
            setFaqs(data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleSave = async () => {
        try {
            if (editingFAQ.id) {
                await supabase.from("faqs").update({ ...editingFAQ, updated_at: new Date() }).eq("id", editingFAQ.id);
                toast.success("FAQ updated");
            } else {
                await supabase.from("faqs").insert([{ ...editingFAQ, is_active: true }]);
                toast.success("FAQ created");
            }
            setIsDialogOpen(false);
            fetchFaqs();
        } catch {
            toast.error("Failed to save");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this FAQ?")) return;
        await supabase.from("faqs").delete().eq("id", id);
        setFaqs(prev => prev.filter(f => f.id !== id));
        toast.success("Deleted");
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Manage FAQs</h1>
                    <Button onClick={() => { setEditingFAQ({}); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Question
                    </Button>
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Question</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {faqs.map((faq) => (
                                <TableRow key={faq.id}>
                                    <TableCell className="font-medium">{faq.question}</TableCell>
                                    <TableCell>{faq.category || "General"}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={faq.is_active}
                                            onCheckedChange={async () => {
                                                await supabase.from("faqs").update({ is_active: !faq.is_active }).eq("id", faq.id);
                                                setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_active: !faq.is_active } : f));
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => { setEditingFAQ(faq); setIsDialogOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(faq.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingFAQ.id ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="Question"
                                value={editingFAQ.question || ""}
                                onChange={e => setEditingFAQ(prev => ({ ...prev, question: e.target.value }))}
                            />
                            <Textarea
                                placeholder="Answer"
                                value={editingFAQ.answer || ""}
                                onChange={e => setEditingFAQ(prev => ({ ...prev, answer: e.target.value }))}
                            />
                            <Input
                                placeholder="Category (optional)"
                                value={editingFAQ.category || ""}
                                onChange={e => setEditingFAQ(prev => ({ ...prev, category: e.target.value }))}
                            />
                            <Button onClick={handleSave} className="w-full">Save</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
