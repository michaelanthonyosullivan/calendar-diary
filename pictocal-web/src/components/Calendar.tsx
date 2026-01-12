'use client';

import React from 'react';
import { CalendarEvent } from '../utils/csvParser';

interface CalendarProps {
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    eventsMap: Record<string, CalendarEvent>;
}

export default function Calendar({
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    eventsMap
}: CalendarProps) {

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const getDateKey = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${month}-${d}`;
    };

    // Navigate months
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };
    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    const nextYear = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
    };
    const prevYear = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
    };

    // Generate grid days
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        // 0 = Sun, 1 = Mon ... 6 = Sat
        // We want 0 = Mon ... 6 = Sun
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const startDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

    // Previous month filler
    const daysInPrevMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    const prevMonthDays = [];
    for (let i = 0; i < startDay; i++) {
        prevMonthDays.push(daysInPrevMonth - startDay + 1 + i);
    }

    // Current month days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
        currentMonthDays.push(i);
    }

    // Next month filler
    const totalSlots = 42; // 6 rows * 7 cols
    const nextMonthDaysCount = totalSlots - (prevMonthDays.length + currentMonthDays.length);
    const nextMonthDays = [];
    for (let i = 1; i <= nextMonthDaysCount; i++) {
        nextMonthDays.push(i);
    }

    const isSelected = (day: number) => {
        return day === selectedDate.getDate() &&
            currentMonth.getMonth() === selectedDate.getMonth() &&
            currentMonth.getFullYear() === selectedDate.getFullYear();
    };

    const isToday = (day: number) => {
        // Hardcoded "Today" for demo purposes or actual today
        // Screenshot has "Today is Jan 10, 2026"
        // User metadata says today is Jan 10, 2026.
        const today = new Date();
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
    };

    // Check if a day has events
    const hasEvent = (day: number) => {
        const key = getDateKey(day);
        return !!eventsMap[key];
    };


    return (
        <div className="flex flex-col h-full bg-[#aed9bc] select-none">
            {/* Header Month/Nav */}
            <div className="flex justify-between items-center bg-[#9ec5ee] p-1 border-b border-gray-400">
                <div className="flex space-x-4 ml-2">
                    <button onClick={prevYear} className="text-black font-bold hover:text-green-700">«</button>
                    <button onClick={prevMonth} className="text-black font-bold hover:text-green-700">◀</button>
                </div>
                <h2 className="text-[#006400] font-bold text-lg">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <div className="flex space-x-4 mr-2">
                    <button onClick={nextMonth} className="text-black font-bold hover:text-green-700">▶</button>
                    <button onClick={nextYear} className="text-black font-bold hover:text-green-700">»</button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center py-2 border-b border-gray-400">
                {daysOfWeek.map(d => (
                    <div key={d} className="font-bold text-black text-sm">{d}</div>
                ))}
            </div>

            {/* Date Grid - Fit to Pane */}
            {/* grid-rows-6 ensures equal distribution of height */}
            <div className="grid grid-cols-7 flex-1 text-center items-center grid-rows-6 overflow-hidden min-h-0">
                {/* Previous Month - Faded */}
                {prevMonthDays.map((d, i) => (
                    <div key={`prev-${i}`} className="text-[#8f8f00] opacity-50 text-sm font-medium h-full w-full flex items-center justify-center cursor-default">
                        {d}
                    </div>
                ))}

                {/* Current Month */}
                {currentMonthDays.map((d) => {
                    const selected = isSelected(d);
                    const today = isToday(d);
                    const event = hasEvent(d);

                    return (
                        <div
                            key={`curr-${d}`}
                            onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))}
                            className={`
                        h-full w-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors relative z-10 border border-gray-300 box-border
                        ${selected ? 'bg-cyan-300 text-black' : ''}
                        ${!selected && event ? 'text-[#008000] font-bold' : 'text-black'} 
                        ${today && !selected ? 'border border-blue-500' : ''}
                    `}
                        >
                            {/* Blue Dot for Events */}
                            {event && !selected && (
                                <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                            <span className="relative z-10 pointer-events-none" style={{ pointerEvents: 'none' }}>{d}</span>
                        </div>
                    );
                })}

                {/* Next Month - Faded */}
                {nextMonthDays.map((d, i) => (
                    <div key={`next-${i}`} className="text-[#8f8f00] opacity-50 text-sm font-medium h-full w-full flex items-center justify-center cursor-default">
                        {d}
                    </div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="bg-[#9ec5ee] p-1 text-center border-t border-gray-400 text-sm text-[#006400] font-bold flex justify-center items-center space-x-2 flex-none">
                <div className="w-4 h-4 border border-gray-500 bg-transparent"></div> {/* Checkbox style */}
                <span>Today is {new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
        </div>
    );
}
