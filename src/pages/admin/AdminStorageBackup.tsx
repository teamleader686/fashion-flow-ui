import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useStorageStats } from '@/hooks/useStorageStats';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    HardDrive, Download, Database, CloudUpload, Trash2,
    History, AlertTriangle, ShieldAlert, CheckCircle2,
    RefreshCw, Mail, Save, ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS (no OAuth needed):
//  1. Admin enters their email once — saved in Supabase admin_settings
//  2. On backup: data exported → Excel file uploaded to Supabase Storage bucket
//  3. Public download URL stored in database_backups table
//  4. Admin can download anytime from Backup History
// ─────────────────────────────────────────────────────────────────────────────

const SETTING_ADMIN_EMAIL = 'backup_admin_email';
const BACKUP_BUCKET = 'backups'; // create this bucket in Supabase Storage

interface BackupRecord {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    status: string;
    tables_included: string[];
    created_at: string;
}

// ─── Supabase admin_settings helpers ─────────────────────────────────────────

async function getSetting(key: string): Promise<string | null> {
    try {
        const { data } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();
        return data?.value ?? null;
    } catch {
        return null;
    }
}

async function setSetting(key: string, value: string) {
    await supabase.from('admin_settings').upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
    );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function AdminStorageBackup() {
    const { stats, loading: storageLoading } = useStorageStats();
    const [backups, setBackups] = useState<BackupRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [bucketReady, setBucketReady] = useState<boolean | null>(null); // null = checking

    // Email settings
    const [adminEmail, setAdminEmail] = useState('');
    const [savedEmail, setSavedEmail] = useState('');
    const [savingEmail, setSavingEmail] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // ── On mount ──────────────────────────────────────────────────────────────
    const checkBucket = async () => {
        try {
            const { error } = await supabase.storage.from('backups').list('', { limit: 1 });
            setBucketReady(!error);
            return !error;
        } catch {
            setBucketReady(false);
            return false;
        }
    };

    useEffect(() => {
        const init = async () => {
            const email = await getSetting(SETTING_ADMIN_EMAIL);
            if (email) {
                setAdminEmail(email);
                setSavedEmail(email);
            }
            setSettingsLoaded(true);
            await checkBucket();
            await fetchBackups();
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Save admin email ──────────────────────────────────────────────────────

    const saveAdminEmail = async () => {
        if (!adminEmail.trim()) {
            toast.error('Please enter a valid email address.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(adminEmail.trim())) {
            toast.error('Please enter a valid email address.');
            return;
        }
        try {
            setSavingEmail(true);
            await setSetting(SETTING_ADMIN_EMAIL, adminEmail.trim());
            setSavedEmail(adminEmail.trim());
            toast.success('✅ Email saved! Backups will be linked to this email.');
        } catch (err: any) {
            toast.error('Failed to save email: ' + err.message);
        } finally {
            setSavingEmail(false);
        }
    };

    // ── Fetch backup records ──────────────────────────────────────────────────

    const fetchBackups = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('database_backups')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    console.warn('database_backups table missing — run storage_backup_migration.sql');
                    return;
                }
                throw error;
            }
            setBackups(data || []);
        } catch (err) {
            console.error('fetchBackups error:', err);
        }
    }, []);

    // ── Export all tables ─────────────────────────────────────────────────────

    const exportData = async () => {
        const tables = ['products', 'categories', 'orders', 'user_profiles', 'coupons', 'offers', 'order_items'];
        const data: Record<string, any[]> = {};
        await Promise.all(
            tables.map(async (t) => {
                const { data: rows, error } = await supabase.from(t).select('*');
                if (!error && rows) data[t] = rows;
            })
        );
        return data;
    };

    // ── Upload file to Supabase Storage ──────────────────────────────────────

    const uploadToSupabaseStorage = async (file: File, fileName: string): Promise<string> => {
        // Try to upload
        const { error: uploadError } = await supabase.storage
            .from(BACKUP_BUCKET)
            .upload(fileName, file, { contentType: file.type, upsert: true });

        if (uploadError) {
            // Bucket might not exist — surface a clear error
            if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
                throw new Error(
                    `Supabase Storage bucket "${BACKUP_BUCKET}" not found.\n` +
                    `Create it in: Supabase Dashboard → Storage → New Bucket → name: "backups" → Public`
                );
            }
            throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from(BACKUP_BUCKET).getPublicUrl(fileName);
        return urlData?.publicUrl ?? '';
    };

    // ── Main backup handler ───────────────────────────────────────────────────

    const handleBackup = async () => {
        try {
            setLoading(true);
            toast.info('📦 Exporting database...');

            // 1. Fetch all data
            const data = await exportData();
            if (Object.keys(data).length === 0) {
                toast.error('No data found to backup.');
                return;
            }

            // 2. Build Excel workbook
            const wb = XLSX.utils.book_new();
            Object.entries(data).forEach(([table, rows]) => {
                const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
                XLSX.utils.book_append_sheet(wb, ws, table);
            });

            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const fileName = `backup-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.xlsx`;
            const file = new File([blob], fileName, { type: blob.type });

            // 3. Upload to Supabase Storage
            toast.info('☁️ Uploading to cloud storage...');
            let fileUrl = 'local_download';
            let uploadedToCloud = false;

            try {
                fileUrl = await uploadToSupabaseStorage(file, fileName);
                uploadedToCloud = true;
                toast.success('✅ Backup uploaded to Supabase Storage!');
            } catch (storageErr: any) {
                // Fallback: download locally
                console.warn('Storage upload failed, downloading locally:', storageErr.message);
                XLSX.writeFile(wb, fileName);
                toast.warning(`⚠️ Cloud upload failed — file downloaded locally.\n${storageErr.message}`);
            }

            // 4. Record in database_backups
            const { error: dbError } = await supabase.from('database_backups').insert({
                file_name: fileName,
                file_url: fileUrl,
                file_size: file.size,
                status: 'success',
                tables_included: Object.keys(data),
            });

            if (dbError && dbError.code !== '42P01') {
                console.error('Could not save backup record:', dbError.message);
            }

            if (uploadedToCloud) {
                toast.success('🎉 Backup complete! Download link saved in history.');
            }

            await fetchBackups();
        } catch (err: any) {
            console.error('Backup error:', err);
            toast.error(err.message || 'Backup failed');

            try {
                await supabase.from('database_backups').insert({
                    file_name: `failed-backup-${Date.now()}`,
                    file_url: '',
                    file_size: 0,
                    status: 'failed',
                    tables_included: [],
                });
                await fetchBackups();
            } catch { }
        } finally {
            setLoading(false);
        }
    };

    // ── Smart multi-table cleanup ──────────────────────────────────────────────

    const clearOldData = async () => {
        try {
            setLoading(true);
            toast.info('🔍 Calculating data to clean...');

            const now = new Date().toISOString();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const cutoff = sixMonthsAgo.toISOString();

            // 1. Count what will be deleted (preview)
            const [
                { count: orderCount },
                { count: couponCount },
                { count: offerCount },
            ] = await Promise.all([
                supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .lt('created_at', cutoff)
                    .in('status', ['delivered', 'cancelled']),
                supabase
                    .from('coupons')
                    .select('*', { count: 'exact', head: true })
                    .lt('expiry_date', now),
                supabase
                    .from('offers')
                    .select('*', { count: 'exact', head: true })
                    .lt('end_datetime', now),
            ]);

            setLoading(false);

            // 2. Show summary to admin before proceeding
            const summary = [
                `🗂️  Old orders (>6 months, delivered/cancelled): ${orderCount ?? 0}`,
                `📦  Their order items (linked): auto-removed`,
                `🎟️  Expired coupons: ${couponCount ?? 0}`,
                `🏷️  Expired offers: ${offerCount ?? 0}`,
            ].join('\n');

            const total = (orderCount ?? 0) + (couponCount ?? 0) + (offerCount ?? 0);

            if (total === 0) {
                toast.success('✅ Nothing to clean — database is already tidy!');
                return;
            }

            const confirmed = window.confirm(
                `🗑️ DATA CLEANUP SUMMARY\n\nThe following will be permanently deleted:\n\n${summary}\n\n` +
                `Total: ${total} records\n\nThis CANNOT be undone. Proceed?`
            );
            if (!confirmed) return;

            setLoading(true);
            toast.info('🗑️ Cleaning database...');

            const results: string[] = [];

            // 3a. Get old order IDs first (to delete order_items)
            const { data: oldOrders } = await supabase
                .from('orders')
                .select('id')
                .lt('created_at', cutoff)
                .in('status', ['delivered', 'cancelled']);

            const oldOrderIds = (oldOrders ?? []).map(o => o.id);

            // 3b. Delete order_items for those orders
            if (oldOrderIds.length > 0) {
                const { count: itemCount } = await supabase
                    .from('order_items')
                    .delete({ count: 'exact' })
                    .in('order_id', oldOrderIds);
                results.push(`${itemCount ?? 0} order items`);
            }

            // 3c. Delete the orders themselves
            const { count: deletedOrders } = await supabase
                .from('orders')
                .delete({ count: 'exact' })
                .lt('created_at', cutoff)
                .in('status', ['delivered', 'cancelled']);
            results.push(`${deletedOrders ?? 0} old orders`);

            // 3d. Delete expired coupons
            const { count: deletedCoupons } = await supabase
                .from('coupons')
                .delete({ count: 'exact' })
                .lt('expiry_date', now);
            results.push(`${deletedCoupons ?? 0} expired coupons`);

            // 3e. Delete expired offers
            const { count: deletedOffers } = await supabase
                .from('offers')
                .delete({ count: 'exact' })
                .lt('end_datetime', now);
            results.push(`${deletedOffers ?? 0} expired offers`);

            toast.success(`✅ Cleanup done! Deleted: ${results.join(', ')}.`);
        } catch (err: any) {
            console.error('Cleanup error:', err);
            toast.error(err.message || 'Cleanup failed');
        } finally {
            setLoading(false);
        }
    };

    // ── Restore ───────────────────────────────────────────────────────────────

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!window.confirm(`⚠️ Restore from "${file.name}"? This will inject data into the database.`)) return;

        try {
            setLoading(true);
            toast.info('🔄 Analyzing file...');
            let parsed: Record<string, any[]> = {};

            if (file.name.endsWith('.json')) {
                parsed = JSON.parse(await file.text());
            } else if (file.name.endsWith('.xlsx')) {
                const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
                wb.SheetNames.forEach(name => {
                    parsed[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]);
                });
            } else {
                throw new Error('Unsupported format. Use .json or .xlsx');
            }

            let count = 0;
            for (const table in parsed) {
                if (parsed[table]?.length > 0) {
                    await supabase.from(table).upsert(parsed[table]);
                    count++;
                }
            }
            toast.success(`✅ Restored ${count} tables successfully!`);
        } catch (err: any) {
            toast.error('Restore failed: ' + err.message);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    // ─── RENDER ───────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-5xl mx-auto">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Database className="h-8 w-8 text-primary" />
                        Storage & Backup System
                    </h1>
                    <p className="text-muted-foreground">
                        Export database → auto-save to Supabase Cloud → download anytime from history.
                    </p>
                </div>

                {/* ── Bucket Setup Banner ── */}
                {bucketReady === false && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 flex gap-3">
                        <span className="text-amber-500 text-2xl shrink-0">⚠️</span>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-amber-900">Supabase Storage Bucket Missing</h3>
                            <p className="text-sm text-amber-800 mt-1">
                                The <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">backups</code> bucket
                                doesn't exist yet. Run the SQL below in Supabase SQL Editor to create it automatically.
                            </p>
                            <details className="mt-3">
                                <summary className="cursor-pointer text-sm font-semibold text-amber-900 hover:text-amber-700">
                                    ▶ Show SQL to copy &amp; run
                                </summary>
                                <pre className="mt-2 bg-amber-100 border border-amber-300 rounded-lg p-3 text-xs overflow-x-auto text-amber-900 leading-relaxed whitespace-pre-wrap select-all">{`INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'backups', 'backups', true, 52428800,
  ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/json', 'application/octet-stream']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow auth users to upload backups"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'backups');

CREATE POLICY "Allow public to read backups"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'backups');`}</pre>
                            </details>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <a
                                    href="https://supabase.com/dashboard/project/_/sql/new"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 font-medium"
                                >
                                    <ExternalLink size={12} /> Open Supabase SQL Editor
                                </a>
                                <button
                                    onClick={async () => {
                                        const ok = await checkBucket();
                                        if (ok) toast.success('✅ Bucket found! Ready to backup.');
                                        else toast.error('Bucket still not found. Please run the SQL first.');
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs border border-amber-400 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-medium"
                                >
                                    <RefreshCw size={12} /> Check Again
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {bucketReady === true && (
                    <div className="bg-green-50 border border-green-300 rounded-xl p-3 flex items-center gap-2 text-sm text-green-800">
                        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                        <span>Supabase Storage bucket <strong>backups</strong> is ready — cloud upload enabled.</span>
                    </div>
                )}

                {/* ── Email Configuration Panel ── */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Mail className="text-primary" size={20} />
                                Backup Destination
                                {savedEmail && (
                                    <Badge className="bg-green-500 hover:bg-green-600 ml-1">
                                        <CheckCircle2 size={11} className="mr-1" /> Configured
                                    </Badge>
                                )}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Enter admin email once. Backups are saved to <strong>Supabase Cloud Storage</strong> and linked to this email.
                                No Google OAuth needed — just enter your email and click Save.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <Label htmlFor="admin-email" className="mb-1.5 block text-sm">
                                Admin Email Address
                            </Label>
                            <Input
                                id="admin-email"
                                type="email"
                                placeholder="yourname@gmail.com"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveAdminEmail()}
                                className={savedEmail && adminEmail === savedEmail ? 'border-green-400 focus:border-green-500' : ''}
                            />
                        </div>
                        <Button onClick={saveAdminEmail} disabled={savingEmail || !settingsLoaded} className="gap-2 shrink-0">
                            {savingEmail
                                ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                : <Save size={15} />
                            }
                            {savedEmail ? 'Update Email' : 'Save Email'}
                        </Button>
                    </div>

                    {savedEmail && (
                        <p className="mt-3 text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle2 size={15} />
                            Backups for <strong>{savedEmail}</strong> are saved in Supabase Storage.
                        </p>
                    )}

                    {/* How it works note */}
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                        <p className="font-semibold">ℹ️ How backup storage works:</p>
                        <ol className="list-decimal list-inside space-y-0.5">
                            <li>Click "Export & Backup Now" → all tables exported to Excel</li>
                            <li>File auto-uploads to Supabase Storage (free 1GB included)</li>
                            <li>Download link saved in Backup History — available anytime</li>
                            <li>One-time setup: create a public bucket named <code className="bg-blue-100 px-1 rounded">backups</code> in Supabase Dashboard → Storage</li>
                        </ol>
                    </div>
                </div>

                {/* ── Storage Status ── */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <HardDrive className="text-primary" />
                            Supabase Storage Status
                        </h2>
                        {stats.usagePercentage >= 90
                            ? <Badge variant="destructive" className="animate-pulse">🔴 Critical</Badge>
                            : stats.usagePercentage >= 80
                                ? <Badge className="bg-orange-500 animate-pulse">🟠 High Usage</Badge>
                                : null
                        }
                    </div>

                    {storageLoading ? (
                        <div className="h-14 flex items-center justify-center">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${stats.usagePercentage >= 90 ? 'bg-red-500' :
                                        stats.usagePercentage >= 80 ? 'bg-orange-500' : 'bg-primary'
                                        }`}
                                    style={{ width: `${Math.min(100, stats.usagePercentage)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">Used</p>
                                    <p className="font-bold">{stats.usedStorage.toFixed(2)} MB</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-muted-foreground text-xs">Usage</p>
                                    <p className={`font-bold ${stats.usagePercentage >= 80 ? 'text-red-500' : 'text-green-600'}`}>
                                        {stats.usagePercentage.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground text-xs">Capacity</p>
                                    <p className="font-bold">{stats.totalStorage} MB</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {stats.usagePercentage > 80 && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-xs flex gap-2 items-start">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            Storage is above 80%. Run a backup and consider cleaning old data.
                        </div>
                    )}
                </div>

                {/* ── Action Buttons ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                        className="h-20 text-base flex gap-3 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                        onClick={handleBackup}
                        disabled={loading}
                    >
                        {loading
                            ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            : <Download size={22} />
                        }
                        <span className="text-left">
                            Export & Backup Now
                            <span className="block text-xs opacity-80 font-normal">→ Saves to Supabase Cloud</span>
                        </span>
                    </Button>

                    <Button
                        variant="destructive"
                        className="h-20 text-base flex gap-3 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                        onClick={clearOldData}
                        disabled={loading}
                    >
                        <Trash2 size={22} />
                        <span className="text-left">
                            Clean Old Data
                            <span className="block text-xs opacity-80 font-normal">Deletes orders &gt; 6 months old</span>
                        </span>
                    </Button>

                    <label className="h-20 shadow-md rounded-xl border-2 border-dashed border-primary/50 flex items-center justify-center p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                        <input type="file" accept=".json,.xlsx" className="hidden" onChange={handleRestore} />
                        <div className="flex flex-col items-center gap-1 text-primary">
                            <CloudUpload size={22} />
                            <span className="font-semibold text-sm">Restore from Backup</span>
                            <span className="text-xs text-muted-foreground">(.json or .xlsx)</span>
                        </div>
                    </label>
                </div>

                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="shrink-0 mt-0.5" size={18} />
                    <div className="text-sm">
                        <h4 className="font-bold">⚠️ Delete Warning</h4>
                        <p className="mt-0.5 text-red-700">
                            "Clean Old Data" permanently deletes <strong>orders older than 6 months</strong>.
                            A confirmation popup will appear first. <strong>This cannot be undone</strong> — please take a backup before cleaning.
                        </p>
                    </div>
                </div>

                {/* ── Backup History ── */}
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <History className="text-primary" size={20} />
                            Backup History
                            <Badge variant="secondary">{backups.length}</Badge>
                        </h2>
                        <Button variant="ghost" size="sm" onClick={fetchBackups}>
                            <RefreshCw size={13} className="mr-2" /> Refresh
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/40">
                                <tr>
                                    <th className="px-5 py-3">Date & Time</th>
                                    <th className="px-5 py-3">Filename</th>
                                    <th className="px-5 py-3">Size</th>
                                    <th className="px-5 py-3">Tables</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Download</th>
                                </tr>
                            </thead>
                            <tbody>
                                {backups.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                                            No backups yet — run your first backup above!
                                        </td>
                                    </tr>
                                ) : (
                                    backups.map((b) => (
                                        <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-3 font-medium whitespace-nowrap text-xs">
                                                {format(new Date(b.created_at), 'dd MMM yyyy, hh:mm a')}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-xs text-primary max-w-[180px] truncate">
                                                {b.file_name}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-xs">
                                                {b.file_size > 0 ? `${(b.file_size / 1024).toFixed(1)} KB` : '—'}
                                            </td>
                                            <td className="px-5 py-3 text-xs text-muted-foreground">
                                                {b.tables_included?.length > 0 ? `${b.tables_included.length} tables` : '—'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <Badge
                                                    variant={b.status === 'success' ? 'default' : b.status === 'pending' ? 'secondary' : 'destructive'}
                                                    className={b.status === 'success' ? 'bg-green-500 hover:bg-green-600 text-xs' : 'text-xs'}
                                                >
                                                    {b.status}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {b.file_url && b.file_url !== 'local_download' ? (
                                                    <a
                                                        href={b.file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        download
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                                    >
                                                        <ExternalLink size={12} />
                                                        Download
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Local only</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
