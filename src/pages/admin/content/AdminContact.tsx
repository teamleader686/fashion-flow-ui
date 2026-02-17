import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    mobile: string;
    message: string;
    status: string;
    created_at: string;
}

export default function AdminContact() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
            setMessages(data || []);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase.from("contact_messages").update({ status: newStatus }).eq("id", id);
            if (error) throw error;
            setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
            toast.success("Status updated");
        } catch {
            toast.error("Failed to update status");
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Contact Messages</h1>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.map((msg) => (
                                    <TableRow key={msg.id}>
                                        <TableCell className="text-sm whitespace-nowrap">
                                            {new Date(msg.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{msg.name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{msg.email}</div>
                                            <div className="text-xs text-muted-foreground">{msg.mobile}</div>
                                        </TableCell>
                                        <TableCell className="max-w-md truncate" title={msg.message}>
                                            {msg.message}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={msg.status === 'replied' ? 'default' : msg.status === 'read' ? 'secondary' : 'destructive'}
                                                className="cursor-pointer"
                                                onClick={() => handleStatusChange(msg.id, msg.status === 'new' ? 'read' : msg.status === 'read' ? 'replied' : 'new')}
                                            >
                                                {msg.status}
                                            </Badge>
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
