'use server';

import fs from 'fs';
import path from 'path';
import { CalendarEvent } from '../utils/csvParser';

export async function saveEvents(events: CalendarEvent[]) {
    const csvPath = path.join(process.cwd(), 'src', 'data', 'events.csv');

    // CSV structure: Date,Event,Memo,Image
    // We need to format the events back into this structure.
    // Note: We are ignoring Memo as per previous instructions, but preserving the column structure is generally safer.
    // We'll leave Memo empty.

    const header = 'Date,Event,Memo,Image';
    const rows = events.map(e => {
        const day = String(e.date.getDate()).padStart(2, '0');
        const month = String(e.date.getMonth() + 1).padStart(2, '0');
        const year = e.date.getFullYear();
        const dateStr = `${day}/${month}/${year}`;

        const escapeCsv = (text: string) => {
            if (!text) return '';
            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
        };

        const description = escapeCsv(e.description);
        const memo = ''; // Ignoring memo
        const imagePath = escapeCsv(e.imagePath);

        return `${dateStr},${description},${memo},${imagePath}`;
    });

    const content = [header, ...rows].join('\n');

    try {
        await fs.promises.writeFile(csvPath, content, 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Failed to save events:', error);
        return { success: false, error: 'Failed to save events' };
    }
}
