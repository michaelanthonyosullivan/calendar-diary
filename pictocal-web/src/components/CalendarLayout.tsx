'use client';

import React, { useState, useMemo } from 'react';
import Calendar from './Calendar';
import EventList from './EventList';
import { CalendarEvent } from '../utils/csvParser';
import { saveEvents } from '../app/actions';
import { Panel, Group, Separator } from 'react-resizable-panels';

interface SerializableCalendarEvent {
    date: string;
    description: string;
    imagePath: string;
}

interface CalendarLayoutProps {
    initialEvents: SerializableCalendarEvent[];
}

export default function CalendarLayout({ initialEvents }: CalendarLayoutProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date(2025, 9, 28)); // October 28, 2025
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2025, 9, 1)); // October 2025
    const [mainImage, setMainImage] = useState<string>("/placeholder-image.jpg");
    const [isDragging, setIsDragging] = useState(false);

    // Local state for events
    const [eventsMap, setEventsMap] = useState<Record<string, CalendarEvent>>({});

    // Initialize local state from props
    useMemo(() => {
        const map: Record<string, CalendarEvent> = {};
        initialEvents.forEach(e => {
            const d = new Date(e.date);
            // Normalize key: YYYY-MM-DD
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const key = `${year}-${month}-${day}`;
            map[key] = {
                ...e,
                date: d
            };
        });
        setEventsMap(map);
    }, [initialEvents]);

    const getDateKey = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleEventChange = (description: string) => {
        const key = getDateKey(selectedDate);
        setEventsMap(prev => ({
            ...prev,
            [key]: {
                date: selectedDate,
                description,
                imagePath: prev[key]?.imagePath || ''
            }
        }));
    };

    const handleAdd = () => {
        const key = getDateKey(selectedDate);
        if (!eventsMap[key]) {
            setEventsMap(prev => ({
                ...prev,
                [key]: {
                    date: selectedDate,
                    description: '',
                    imagePath: ''
                }
            }));
        }
    };

    const handleDelete = () => {
        const key = getDateKey(selectedDate);
        if (eventsMap[key]) {
            setEventsMap(prev => {
                const newMap = { ...prev };
                delete newMap[key];
                return newMap;
            });
        }
    };

    const handleConfirm = async () => {
        const events = Object.values(eventsMap);
        const result = await saveEvents(events);
        if (result.success) {
            alert('Events saved successfully!');
        } else {
            alert('Failed to save events.');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);

        if (files.length > 0 && files[0].type.startsWith('image/')) {
            const file = files[0];
            const imageUrl = URL.createObjectURL(file);
            setMainImage(imageUrl);
        }
    };

    // Derived state for selected event
    const getSelectedEvent = () => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;
        return eventsMap[key];
    };

    const selectedEvent = getSelectedEvent();

    // Helper for Week Number
    const getWeekNumber = (d: Date) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };
    const weekNo = getWeekNumber(selectedDate);
    const formattedDate = selectedDate.toLocaleDateString('en-GB');

    return (
        /* 1. VIEWPORT: Dark Grey background for contrast */
        <div className="h-screen w-screen overflow-auto bg-gray-800 flex items-center justify-center p-8">

            /* 2. APP CANVAS: Locked Size, Blue Background (The "Frame") */
            <div className="min-w-[1200px] min-h-[800px] w-full h-full bg-[#2b6cb0] shadow-2xl relative flex flex-col rounded-lg overflow-hidden border-4 border-[#2b6cb0]">

                {/* HEADER: Blue Navigation Bar */}
                <div className="h-10 bg-[#2b6cb0] w-full flex-none flex items-center justify-center shadow-sm z-10">
                    <div className="bg-white px-4 py-1 rounded-t-lg text-sm font-bold text-gray-700 shadow-sm mx-1">Calendar Page</div>
                    <div className="bg-[#4299e1] px-4 py-1 rounded-t-lg text-sm font-bold text-white shadow-sm mx-1 opacity-75">Data Page</div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 w-full h-full relative bg-[#2b6cb0]">
                    <Group orientation="horizontal" className="h-full w-full">

                        {/* LEFT PANEL: IMAGE + FOOTER */}
                        <Panel defaultSize={45} minSize={25} collapsible={false} className="bg-[#2b6cb0]">
                            <div className="h-full w-full flex flex-col">
                                {/* Image Area (fills space) */}
                                <div className="flex-1 w-full bg-[#3182ce] p-0.5 overflow-hidden flex flex-col"> {/* Thin blue border effect */}
                                    <div className="w-full h-full bg-white relative overflow-hidden flex-1">
                                        <div
                                            className={`w-full h-full relative transition-all duration-200 overflow-hidden ${isDragging ? 'border-4 border-yellow-400 opacity-90' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            <img
                                                src={mainImage}
                                                alt="Scenic View"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/pictocal/800/600';
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Buttons (Left) */}
                                <div className="h-12 w-full flex items-center justify-between px-2 bg-[#2b6cb0] flex-none">
                                    <button className="bg-white hover:bg-gray-100 text-black text-xs font-semibold py-1 px-3 rounded shadow-md border border-gray-300">
                                        Make PDF
                                    </button>
                                    <button className="bg-[#1a202c] hover:bg-gray-800 text-white text-xs font-semibold py-1 px-3 rounded shadow-md border border-gray-500">
                                        BBC Home Page
                                    </button>
                                </div>
                            </div>
                        </Panel>

                        {/* SPLITTER: Blue Background (Invisible, just spacing) */}
                        <Separator className="w-1 bg-[#2b6cb0] hover:bg-blue-400 transition-colors cursor-col-resize z-50" />

                        {/* RIGHT PANEL: CALENDAR/DATA + FOOTER */}
                        <Panel minSize={30} collapsible={false} className="bg-[#2b6cb0]">
                            <div className="h-full w-full flex flex-col">
                                {/* Upper Right Group */}
                                <div className="flex-1 w-full flex flex-col overflow-hidden">
                                    <Group orientation="vertical">

                                        {/* CALENDAR */}
                                        <Panel defaultSize={60} minSize={40} collapsible={false} className="bg-[#2b6cb0]">
                                            <div className="h-full w-full flex flex-col">
                                                <div className="flex-1 w-full bg-[#e2e8f0] relative overflow-hidden">
                                                    {/* Calendar Background is Light Grey/Green */}
                                                    <div className="h-full w-full overflow-auto p-1">
                                                        <Calendar
                                                            currentMonth={currentMonth}
                                                            setCurrentMonth={setCurrentMonth}
                                                            selectedDate={selectedDate}
                                                            setSelectedDate={setSelectedDate}
                                                            eventsMap={eventsMap}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Panel>

                                        {/* SPLITTER */}
                                        <Separator className="h-1 bg-[#2b6cb0] hover:bg-blue-400 transition-colors cursor-row-resize z-50" />

                                        {/* DATA ENTRY */}
                                        <Panel minSize={20} collapsible={false} className="bg-[#2b6cb0]">
                                            <div className="h-full w-full flex flex-col">
                                                {/* Data Entry Header Bar */}
                                                <div className="h-8 bg-[#2c5282] w-full flex items-center justify-between px-2 flex-none">
                                                    <div className="text-white text-xs font-bold cursor-pointer hover:text-blue-200">◀</div>
                                                    <div className="bg-[#4299e1] text-white text-xs px-4 py-0.5 rounded shadow-inner font-bold">Week No {weekNo}</div>
                                                    <div className="text-white text-xs font-bold cursor-pointer hover:text-blue-200">▶</div>
                                                    <div className="bg-white text-black text-xs px-2 py-0.5 rounded shadow-sm">{formattedDate}</div>
                                                </div>

                                                {/* Text Area - Light Blue Background */}
                                                <div className="flex-1 w-full bg-[#ebf8ff] p-2 relative overflow-hidden text-sm text-gray-800 font-sans border-t border-gray-300">
                                                    <EventList
                                                        selectedDate={selectedDate}
                                                        event={selectedEvent}
                                                        showHeader={false}
                                                        onEventChange={handleEventChange}
                                                    />
                                                </div>
                                            </div>
                                        </Panel>

                                    </Group>
                                </div>

                                {/* Footer Buttons (Right) */}
                                <div className="h-12 w-full flex items-center justify-end space-x-2 px-2 bg-[#2b6cb0] flex-none">
                                    <button
                                        onClick={handleDelete}
                                        className="bg-white hover:bg-gray-100 text-black text-xs font-semibold py-1 px-4 rounded shadow-md border border-gray-300"
                                    >
                                        Delete
                                    </button>
                                    <div className="flex-1"></div> {/* Spacer */}
                                    <button
                                        onClick={handleAdd}
                                        className="bg-[#4299e1] hover:bg-[#3182ce] text-white text-xs font-semibold py-1 px-4 rounded shadow-md border border-blue-400"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="bg-[#48bb78] hover:bg-[#38a169] text-white text-xs font-semibold py-1 px-4 rounded shadow-md border border-green-600"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </Panel>

                    </Group>
                </div>
            </div>
        </div>
    );
}
