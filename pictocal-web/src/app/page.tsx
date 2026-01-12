"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// --- MOCK DATA ---
const MOCK_DB = {
  "9-9-2025": "My games:\nhttps://memorizepairsgame.netlify.app/\nhttps://cdmos.vercel.app/",
  "28-9-2025": "Fix kitchen clock - OK done\nCancelled playshopper.com & pictocal.com\nRefund due on playshopper.com",
  "11-9-2025": "Doctor appointment at 2pm",
};

// --- HELPER FUNCTIONS ---
const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

const formatDate = (d, m, y) => {
  return `${d.toString().padStart(2, '0')}/${(m + 1).toString().padStart(2, '0')}/${y}`;
};

const getDateKey = (d, m, y) => `${d}-${m}-${y}`;

const getWeekNumber = (d) => {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return Math.ceil(day / 7);
};

// --- MAIN COMPONENT ---
export default function PictocalApp() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1));
  const [selectedDay, setSelectedDay] = useState(28);
  const [noteText, setNoteText] = useState("");
  const [imageSrc, setImageSrc] = useState("https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80");
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const emptySlots = Array.from({ length: firstDay });
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    const key = getDateKey(selectedDay, currentMonth, currentYear);
    const text = MOCK_DB[key] || "";
    setNoteText(text);
  }, [selectedDay, currentMonth, currentYear]);

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
    setSelectedDay(1);
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const handleTextChange = (e) => {
    setNoteText(e.target.value);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDraggingFile(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            setImageSrc(event.target.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please drop an image file (JPG, PNG, etc).");
      }
    }
  }, []);

  return (
    <div className="h-screen w-full bg-[#1a365d] flex flex-col p-2 overflow-hidden font-sans box-border">

      {/* HEADER TABS */}
      <div className="h-8 flex-none w-full flex items-end justify-center space-x-1 pl-4 mb-0 z-10">
        <div className="bg-white px-6 py-1 rounded-t-lg text-sm font-bold text-gray-800 shadow-sm cursor-pointer border-t border-l border-r border-gray-400 relative top-[1px]">
          Calendar Page
        </div>
        <div className="bg-[#2c5282] px-6 py-1 rounded-t-lg text-sm font-bold text-white shadow-sm cursor-pointer opacity-80 hover:opacity-100">
          Data Page
        </div>
      </div>

      {/* APP FRAME */}
      <div className="flex-1 w-full min-w-0 min-h-0 bg-[#1a365d] border-4 border-[#1a365d] rounded-lg overflow-hidden shadow-2xl flex flex-col relative">

        <PanelGroup direction="horizontal" className="h-full w-full">

          {/* --- LEFT PANEL: IMAGE DROP ZONE --- */}
          <Panel defaultSize={55} minSize={30} collapsible={false} className="bg-white flex flex-col min-w-0">
            <div
              className={`flex-1 w-full relative overflow-hidden bg-black flex items-center justify-center transition-colors ${isDraggingFile ? 'bg-gray-700' : 'bg-black'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <img
                src={imageSrc}
                alt="Landscape"
                className="w-full h-full object-contain select-none block"
              />

              {isDraggingFile && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 border-4 border-blue-400 border-dashed z-50">
                  <span className="text-white font-bold text-xl bg-black/50 px-4 py-2 rounded">Drop Image Here</span>
                </div>
              )}
            </div>

            <div className="h-10 flex-none bg-[#1a365d] flex items-center justify-between px-2">
              <button className="bg-white text-black text-xs font-bold px-3 py-1 rounded shadow hover:bg-gray-200">
                Make PDF
              </button>
              <button className="bg-[#2d3748] text-white text-xs font-bold px-3 py-1 rounded border border-gray-500 hover:bg-gray-700">
                BBC Home Page
              </button>
            </div>
          </Panel>

          {/* --- VERTICAL SPLITTER (UPDATED) --- */}
          {/* We remove the background from the main handle so it's transparent at the bottom */}
          <PanelResizeHandle className="w-3 flex flex-col justify-start z-50 relative focus:outline-none">
            {/* Inner Visual Bar: Stops 2.5rem (h-10) short of the bottom to avoid overlapping the footer */}
            <div className="w-full bg-[#1a365d] hover:bg-[#2c5282] transition-colors flex items-center justify-center relative" style={{ height: 'calc(100% - 2.5rem)' }}>
              {/* Grip */}
              <div className="h-8 w-1 bg-blue-400/30 rounded"></div>
            </div>
          </PanelResizeHandle>

          {/* --- RIGHT PANEL --- */}
          <Panel minSize={30} collapsible={false} className="flex flex-col min-w-0">
            <PanelGroup direction="vertical" className="h-full">

              {/* TOP RIGHT: CALENDAR */}
              <Panel defaultSize={60} minSize={30} collapsible={false} className="flex flex-col min-h-0">

                <div className="bg-[#a7f3d0] h-8 flex-none flex items-center justify-between px-2 border-b border-green-600 select-none">
                  <div className="flex space-x-2">
                    <button onClick={() => changeMonth(-12)} className="text-green-900 font-bold hover:text-green-700 tracking-[-6px]">◀◀</button>
                    <button onClick={() => changeMonth(-1)} className="text-green-900 font-bold hover:text-green-700">◀</button>
                  </div>
                  <span className="font-bold text-green-900 truncate px-2">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <div className="flex space-x-2">
                    <button onClick={() => changeMonth(1)} className="text-green-900 font-bold hover:text-green-700">▶</button>
                    <button onClick={() => changeMonth(12)} className="text-green-900 font-bold hover:text-green-700 tracking-[-3px]">▶▶</button>
                  </div>
                </div>

                <div className="flex-1 w-full bg-[#d1fae5] p-2 flex flex-col min-h-0 select-none overflow-hidden">
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-green-900 mb-1 flex-none">
                    {daysOfWeek.map(d => <div key={d}>{d}</div>)}
                  </div>

                  <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 text-center text-sm text-green-800 min-h-0">
                    {emptySlots.map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}

                    {daysArray.map(day => {
                      const hasData = MOCK_DB[getDateKey(day, currentMonth, currentYear)];
                      const isSelected = selectedDay === day;

                      return (
                        <div
                          key={day}
                          onClick={() => handleDayClick(day)}
                          className={`
                              relative flex items-center justify-center cursor-pointer rounded border transition-colors
                              ${isSelected
                              ? 'bg-cyan-400 text-black font-bold border-cyan-600 shadow-sm'
                              : 'hover:bg-green-200 border-transparent'}
                            `}
                        >
                          <span className="z-10 relative">{day}</span>
                          {hasData && !isSelected && (
                            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="h-6 flex-none bg-[#bfdbfe] flex items-center justify-center text-xs text-gray-700 font-bold border-t border-blue-300">
                  Today is {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </Panel>

              {/* --- HORIZONTAL SPLITTER --- */}
              <PanelResizeHandle className="h-3 bg-[#1a365d] flex items-center justify-center cursor-row-resize hover:bg-[#2c5282] transition-colors z-50 relative focus:outline-none">
                <div className="w-8 h-1 bg-blue-400/30 rounded"></div>
              </PanelResizeHandle>

              {/* BOTTOM RIGHT: DATA ENTRY */}
              <Panel minSize={20} collapsible={false} className="flex flex-col bg-[#bfdbfe] min-h-0">

                <div className="bg-[#1a365d] h-8 flex-none grid grid-cols-[1fr_auto_1fr] items-center px-2">
                  <div></div>
                  <div className="flex items-center justify-center space-x-1">
                    <button className="text-white font-bold hover:text-blue-300 px-2">◀</button>
                    <span className="bg-[#3182ce] text-white text-xs px-4 py-0.5 rounded border border-blue-400 text-center min-w-[90px] shadow-inner">
                      Week No {getWeekNumber(new Date(currentYear, currentMonth, selectedDay))}
                    </span>
                    <button className="text-white font-bold hover:text-blue-300 px-2">▶</button>
                  </div>

                  <div className="flex justify-end">
                    <span className="bg-white text-black text-xs px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                      {formatDate(selectedDay, currentMonth, currentYear)}
                    </span>
                  </div>
                </div>

                <textarea
                  value={noteText}
                  onChange={handleTextChange}
                  className="flex-1 w-full bg-[#bfdbfe] p-2 text-sm text-gray-900 resize-none outline-none font-medium min-h-0 placeholder-gray-500/50"
                  placeholder="No notes for this day..."
                />
              </Panel>

            </PanelGroup>

            <div className="h-10 flex-none bg-[#1a365d] flex items-center justify-end px-2 space-x-2">
              <button className="bg-white text-black text-xs font-bold px-3 py-1 rounded hover:bg-gray-200">
                Delete
              </button>
              <div className="flex-1"></div>
              <button className="bg-gray-400 text-gray-700 text-xs font-bold px-3 py-1 rounded cursor-not-allowed">Add</button>
              <button className="bg-gray-400 text-gray-700 text-xs font-bold px-3 py-1 rounded cursor-not-allowed">Confirm</button>
            </div>

          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}