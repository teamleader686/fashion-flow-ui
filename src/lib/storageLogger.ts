import { supabase } from '@/lib/supabase';

/**
 * Storage Logger — Centralized utility to log all CRUD and file operations
 * for the Storage Monitoring System.
 *
 * Usage:
 *   storageLogger.logCreate('products', recordId, 2);
 *   storageLogger.logFileUpload('product_images', 'product-images', filePath, fileSizeKB, userId);
 */

export type StorageModule =
    | 'products'
    | 'product_images'
    | 'category_images'
    | 'avatars'
    | 'orders'
    | 'order_items'
    | 'users'
    | 'user_profiles'
    | 'categories'
    | 'coupons'
    | 'offers'
    | 'sliders'
    | 'website_assets'
    | 'affiliates'
    | 'campaigns'
    | 'reviews'
    | 'wishlist'
    | 'notifications'
    | 'loyalty'
    | 'shipments'
    | 'other';

export type StorageAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'upload'
    | 'remove'
    | 'bulk_create'
    | 'bulk_delete';

interface LogOptions {
    module: StorageModule;
    action: StorageAction;
    tableName?: string;
    recordId?: string;
    bucketName?: string;
    filePath?: string;
    sizeKB: number;
    userId?: string;
    metadata?: Record<string, any>;
}

/**
 * Internal function: Inserts a log entry into storage_logs.
 * Runs silently — never throws errors to avoid breaking main operations.
 */
async function insertLog(options: LogOptions): Promise<void> {
    try {
        await supabase.from('storage_logs').insert({
            module: options.module,
            action: options.action,
            table_name: options.tableName || null,
            record_id: options.recordId || null,
            bucket_name: options.bucketName || null,
            file_path: options.filePath || null,
            size_kb: options.sizeKB,
            user_id: options.userId || null,
            metadata: options.metadata || {},
        });
    } catch (err) {
        // Silent fail — storage logging should never break the app
        console.warn('[StorageLogger] Failed to log:', err);
    }
}

/**
 * Update user_storage_usage table for per-user tracking
 */
async function updateUserStorage(userId: string, sizeKB: number): Promise<void> {
    if (!userId) return;
    try {
        // Try to upsert
        const { data: existing } = await supabase
            .from('user_storage_usage')
            .select('total_kb, upload_count')
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            await supabase
                .from('user_storage_usage')
                .update({
                    total_kb: Math.max(0, (existing.total_kb || 0) + sizeKB),
                    upload_count: sizeKB > 0
                        ? (existing.upload_count || 0) + 1
                        : existing.upload_count || 0,
                    last_upload_at: sizeKB > 0 ? new Date().toISOString() : undefined,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);
        } else {
            await supabase.from('user_storage_usage').insert({
                user_id: userId,
                total_kb: Math.max(0, sizeKB),
                upload_count: sizeKB > 0 ? 1 : 0,
                last_upload_at: sizeKB > 0 ? new Date().toISOString() : null,
            });
        }
    } catch (err) {
        console.warn('[StorageLogger] Failed to update user storage:', err);
    }
}

// ============================================
// PUBLIC API
// ============================================

export const storageLogger = {
    /**
     * Log a database CREATE operation
     * @param module - Which module (products, orders, etc.)
     * @param recordId - ID of the created record
     * @param estimatedSizeKB - Estimated row size in KB
     * @param userId - Optional user who performed the action
     */
    logCreate: (
        module: StorageModule,
        recordId?: string,
        estimatedSizeKB: number = 1,
        userId?: string
    ) => {
        insertLog({
            module,
            action: 'create',
            tableName: module,
            recordId,
            sizeKB: estimatedSizeKB,
            userId,
        });
    },

    /**
     * Log a database UPDATE operation
     */
    logUpdate: (
        module: StorageModule,
        recordId?: string,
        sizeChangeKB: number = 0,
        userId?: string
    ) => {
        if (sizeChangeKB !== 0) {
            insertLog({
                module,
                action: 'update',
                tableName: module,
                recordId,
                sizeKB: sizeChangeKB,
                userId,
            });
        }
    },

    /**
     * Log a database DELETE operation (negative size)
     */
    logDelete: (
        module: StorageModule,
        recordId?: string,
        estimatedSizeKB: number = 1,
        userId?: string
    ) => {
        insertLog({
            module,
            action: 'delete',
            tableName: module,
            recordId,
            sizeKB: -Math.abs(estimatedSizeKB),
            userId,
        });
    },

    /**
     * Log a file UPLOAD (images, documents, etc.)
     * @param module - Which module (product_images, avatars, etc.)
     * @param bucketName - Supabase storage bucket name
     * @param filePath - Path in bucket
     * @param fileSizeKB - File size in KB
     * @param userId - User who uploaded
     */
    logFileUpload: (
        module: StorageModule,
        bucketName: string,
        filePath: string,
        fileSizeKB: number,
        userId?: string
    ) => {
        insertLog({
            module,
            action: 'upload',
            bucketName,
            filePath,
            sizeKB: fileSizeKB,
            userId,
        });
        if (userId) {
            updateUserStorage(userId, fileSizeKB);
        }
    },

    /**
     * Log a file DELETION
     */
    logFileDelete: (
        module: StorageModule,
        bucketName: string,
        filePath: string,
        fileSizeKB: number,
        userId?: string
    ) => {
        insertLog({
            module,
            action: 'remove',
            bucketName,
            filePath,
            sizeKB: -Math.abs(fileSizeKB),
            userId,
        });
        if (userId) {
            updateUserStorage(userId, -Math.abs(fileSizeKB));
        }
    },

    /**
     * Log bulk operations
     */
    logBulkCreate: (
        module: StorageModule,
        count: number,
        estimatedSizePerItemKB: number = 1,
        userId?: string
    ) => {
        insertLog({
            module,
            action: 'bulk_create',
            tableName: module,
            sizeKB: count * estimatedSizePerItemKB,
            userId,
            metadata: { count },
        });
    },

    /**
     * Get file size in KB from a File object
     */
    getFileSizeKB: (file: File): number => {
        return file.size / 1024;
    },
};

export default storageLogger;
