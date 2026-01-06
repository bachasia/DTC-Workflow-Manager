import { getLarkClient } from './client.js';
import logger from '../../lib/logger.js';
import { DailyReport, User } from '@prisma/client';

/**
 * Create or update record in Lark Base
 */
export const syncReportToLarkBase = async (
    report: DailyReport & { user: User }
): Promise<boolean> => {
    try {
        const baseId = process.env.LARK_BASE_ID;
        const tableId = process.env.LARK_REPORT_TABLE_ID;

        if (!baseId || !tableId) {
            logger.warn('Lark Base credentials not configured');
            return false;
        }

        const client = getLarkClient();

        // Prepare record data
        const recordData = {
            fields: {
                'Date': report.date.toISOString().split('T')[0],
                'Staff Name': report.user.name,
                'Staff Email': report.user.email,
                'Role': report.user.role,
                'Report Content': report.content,
                'Completed Tasks': JSON.stringify(report.completedTasks),
                'Analytics': report.analytics ? JSON.stringify(report.analytics) : '',
                'Submitted At': report.createdAt.toISOString(),
            },
        };

        // Check if record already exists
        if (report.larkRecordId) {
            // Update existing record
            const updateRes = await client.bitable.appTableRecord.update({
                path: {
                    app_token: baseId,
                    table_id: tableId,
                    record_id: report.larkRecordId,
                },
                data: recordData,
            });

            if (updateRes.code === 0) {
                logger.info(`Lark Base record updated: ${report.larkRecordId}`);
                return true;
            } else {
                logger.error(`Failed to update Lark Base record: ${updateRes.msg}`);
                return false;
            }
        } else {
            // Create new record
            const createRes = await client.bitable.appTableRecord.create({
                path: {
                    app_token: baseId,
                    table_id: tableId,
                },
                data: recordData,
            });

            if (createRes.code === 0 && createRes.data?.record) {
                const recordId = createRes.data.record.record_id;
                logger.info(`Lark Base record created: ${recordId}`);

                // Update report with Lark record ID
                // This should be done in the calling function
                return true;
            } else {
                logger.error(`Failed to create Lark Base record: ${createRes.msg}`);
                return false;
            }
        }
    } catch (error) {
        logger.error('Sync to Lark Base error:', error);
        return false;
    }
};

/**
 * Batch sync multiple reports to Lark Base
 */
export const batchSyncReportsToLarkBase = async (
    reports: (DailyReport & { user: User })[]
): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const report of reports) {
        const result = await syncReportToLarkBase(report);
        if (result) {
            success++;
        } else {
            failed++;
        }
    }

    logger.info(`Batch sync completed: ${success} success, ${failed} failed`);
    return { success, failed };
};

/**
 * Get Lark Base table records
 */
export const getLarkBaseRecords = async (
    pageSize: number = 100
): Promise<any[]> => {
    try {
        const baseId = process.env.LARK_BASE_ID;
        const tableId = process.env.LARK_REPORT_TABLE_ID;

        if (!baseId || !tableId) {
            logger.warn('Lark Base credentials not configured');
            return [];
        }

        const client = getLarkClient();

        const listRes = await client.bitable.appTableRecord.list({
            path: {
                app_token: baseId,
                table_id: tableId,
            },
            params: {
                page_size: pageSize,
            },
        });

        if (listRes.code === 0 && listRes.data?.items) {
            return listRes.data.items;
        } else {
            logger.error(`Failed to get Lark Base records: ${listRes.msg}`);
            return [];
        }
    } catch (error) {
        logger.error('Get Lark Base records error:', error);
        return [];
    }
};
