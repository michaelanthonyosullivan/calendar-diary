'use client';

import React from 'react';
import { CalendarEvent } from '../utils/csvParser';

interface EventListProps {
    selectedDate: Date;
    event?: CalendarEvent;
    showHeader?: boolean;
    onEventChange?: (description: string) => void;
}

export default function EventList({ selectedDate, event, showHeader = true, onEventChange }: EventListProps) {
    // Format the date for display (e.g. 28/10/2025)
    // The screenshot/user request implies standard GB format
    const formattedDate = selectedDate.toLocaleDateString('en-GB');

    // Determine Week No (Rough calc or library, let's do rough for now)
    const getWeekNumber = (d: Date) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };
    const weekNo = getWeekNumber(selectedDate);

    return (
        <div className="flex flex-col h-full">
            {/* Navigation Bar */}
            {showHeader && (
                <div className="relative flex items-center justify-end w-full mb-1 bg-[#2c5d94] px-2 py-1 text-white h-9">
                    {/* STRICTLY CENTERED NAVIGATION GROUP */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                        <button className="text-lime-300 hover:text-white">◀</button>
                        <span className="w-40 text-center text-black text-sm font-bold border border-white bg-[#4a7eb5] text-white">
                            Week No {weekNo}
                        </span>
                        <button className="text-lime-300 hover:text-white">▶</button>
                    </div>

                    {/* Right Side: Date - Pushed to end via justify-end parent */}
                    <div className="bg-white text-black px-2 py-0.5 text-sm font-mono whitespace-nowrap z-10">
                        {formattedDate}
                    </div>
                </div>
            )}

            {/* Event Form Area */}
            <div className="flex-1 bg-[#9ec5ee] p-2 text-black text-sm font-medium leading-relaxed overflow-hidden flex flex-col border border-gray-600 shadow-inner">
                {/* Event Input */}
                <div className="flex flex-col flex-1">
                    <label className="text-[#006400] font-bold text-xs mb-0.5">Event</label>
                    <textarea
                        className="flex-1 w-full bg-white border border-gray-400 p-1 resize-none focus:outline-none focus:border-blue-500"
                        value={event?.description || ''}
                        onChange={(e) => onEventChange?.(e.target.value)}
                        readOnly={!onEventChange}
                    />
                </div>
            </div>
        </div>
    );
}
