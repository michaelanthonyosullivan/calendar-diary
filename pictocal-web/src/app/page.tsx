"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- CONFIGURATION ---

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DEFAULT_IMAGES = [
  "/Jan.jpg", "/Feb.jpg", "/Mar.jpg", "/Apr.jpg",
  "/May.jpg", "/Jun.jpg", "/Jul.jpg", "/Aug.jpg",
  "/Sep.jpg", "/Oct.jpg", "/Nov.jpg", "/Dec.jpg"
];

// --- HELPER FUNCTIONS (STRICT TYPES ADDED) ---

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

const formatDate = (d: number, m: number, y: number) => {
  return `${d.toString().padStart(2, '0')}/${(m + 1).toString().padStart(2, '0')}/${y}`;
};

const getDateKey = (d: number, m: number, y: number) => {
  return `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
};

const getWeekNumber = (d: Date) => {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// --- MAIN COMPONENT ---

export default function PictocalApp() {
  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const [noteText, setNoteText] = useState("");
  const [db, setDb] = useState<Record<string, string>>({});
  const [recordFound, setRecordFound] = useState(false);

  const [imageSrc, setImageSrc] = useState("/Jan.jpg");
  const [customImages, setCustomImages] = useState<Record<number, string>>({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [fileHandle, setFileHandle] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Values
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfMonth(currentYear, currentMonth);

  // --- GRID LOGIC ---
  interface CalendarCell {
    day: number;
    type: 'prev' | 'current' | 'next';
    key: string;
  }

  const calendarCells: CalendarCell[] = [];
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({
      day: prevMonthDays - firstDayOfWeek + 1 + i,
      type: 'prev',
      key: `prev-${i}`
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      type: 'current',
      key: `curr-${i}`
    });
  }
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      type: 'next',
      key: `next-${i}`
    });
  }

  // --- INITIALIZATION ---
  useEffect(() => {
    document.title = "Pictocal Calendar & Diary";

    const savedData = localStorage.getItem('pictocal_data');
    if (savedData) setDb(JSON.parse(savedData));

    const savedImages = localStorage.getItem('pictocal_custom_images');
    let loadedCustomImages = {};
    if (savedImages) {
      try {
        loadedCustomImages = JSON.parse(savedImages);
        setCustomImages(loadedCustomImages);
      } catch (e) {
        console.error("Failed to load images", e);
      }
    }

    const startMonth = new Date().getMonth();
    // @ts-ignore
    const startImage = loadedCustomImages[startMonth] || DEFAULT_IMAGES[startMonth];
    setImageSrc(startImage);

    setIsDirty(false);
    setHasLoaded(false);

  }, []);

  // --- LOGIC: Switch Image ---
  useEffect(() => {
    const customImg = customImages[currentMonth];
    if (customImg) {
      setImageSrc(customImg);
    } else {
      setImageSrc(DEFAULT_IMAGES[currentMonth]);
    }
  }, [currentMonth, customImages]);

  // --- LOGIC: Load Data ---
  useEffect(() => {
    const key = getDateKey(selectedDay, currentMonth, currentYear);
    const existingNote = db[key];

    if (existingNote) {
      setRecordFound(true);
      setNoteText(existingNote);
    } else {
      setRecordFound(false);
      setNoteText("");
    }
  }, [selectedDay, currentMonth, currentYear, db]);

  // --- HANDLERS ---

  const saveToStorage = (newDb: Record<string, string>) => {
    setDb(newDb);
    try {
      localStorage.setItem('pictocal_data', JSON.stringify(newDb));
      setIsDirty(true);
    } catch (e) {
      alert("Storage full! Could not save note.");
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
    setSelectedDay(1);
  };

  const changeWeek = (offset: number) => {
    const currentSelectedDate = new Date(currentYear, currentMonth, selectedDay);
    currentSelectedDate.setDate(currentSelectedDate.getDate() + (offset * 7));
    setCurrentDate(currentSelectedDate);
    setSelectedDay(currentSelectedDate.getDate());
  };

  const handleDayClick = (day: number, type: string) => {
    if (type === 'current') {
      setSelectedDay(day);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteText(e.target.value);
    setIsDirty(true);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  // --- FEATURE: SMART BACKUP (SAVE) ---
  const handleExportBackup = async () => {
    const backupData = {
      db: db,
      customImages: customImages,
      exportDate: new Date().toISOString()
    };
    const jsonString = JSON.stringify(backupData, null, 2);

    if (fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        alert("Diary Saved!");
        setIsDirty(false);
        return;
      } catch (err) { }
    }

    if ('showSaveFilePicker' in window) {
      try {
        // @ts-ignore 
        const handle = await window.showSaveFilePicker({
          suggestedName: 'pictocal_data.json',
          types: [{ description: 'Pictocal Data File', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();

        setFileHandle(handle);
        setIsDirty(false);
        alert("Diary Saved!");
      } catch (err: any) { if (err.name === 'AbortError') return; }
    } else {
      try {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "pictocal_data.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDirty(false);
      } catch (e) {
        alert("Failed to save diary file.");
      }
    }
  };

  // --- FEATURE: SMART LOAD (OPEN) ---
  const handleImportClick = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        // @ts-ignore
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Pictocal Data File', accept: { 'application/json': ['.json'] } }],
          multiple: false
        });

        const file = await handle.getFile();
        const text = await file.text();
        processLoadedData(text);

        setFileHandle(handle);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    fileInputRef.current?.click();
  };

  const processLoadedData = (jsonString: string) => {
    try {
      const json = JSON.parse(jsonString);
      if (json.db) {
        const loadedImages = json.customImages || {};
        if (window.confirm(`Load diary from ${new Date(json.exportDate).toLocaleDateString()}?\nThis will overwrite current data.`)) {
          setDb(json.db);
          setCustomImages(loadedImages);
          localStorage.setItem('pictocal_data', JSON.stringify(json.db));
          localStorage.setItem('pictocal_custom_images', JSON.stringify(loadedImages));
          const currentMonthIdx = currentDate.getMonth();
          const img = loadedImages[currentMonthIdx] || DEFAULT_IMAGES[currentMonthIdx];
          setImageSrc(img);
          alert("Diary loaded!");
          setIsDirty(false);
          setHasLoaded(true);
        }
      } else { alert("Invalid diary file."); }
    } catch (err) { alert("Error reading file."); }
  };

  const handleFallbackFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) processLoadedData(e.target.result as string);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // --- FEATURE: MAKE PDF ---
  const handleMakePDF = async () => {
    const element = document.getElementById('capture-target');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Pictocal-${monthNames[currentMonth]}-${currentYear}.pdf`);
    } catch (error) { alert("Failed to generate PDF."); }
  };

  // --- BUTTON LOGIC ---
  const handleAdd = () => {
    if (noteText.trim() !== "") {
      const key = getDateKey(selectedDay, currentMonth, currentYear);
      const newDb = { ...db, [key]: noteText };
      saveToStorage(newDb);
    }
  };

  const handleConfirm = () => {
    const key = getDateKey(selectedDay, currentMonth, currentYear);
    if (noteText.trim() !== "") {
      const newDb = { ...db, [key]: noteText };
      saveToStorage(newDb);
    } else { handleDelete(); }
  };

  const handleDelete = () => {
    if (window.confirm("Delete Record? Are you sure?")) {
      const key = getDateKey(selectedDay, currentMonth, currentYear);
      const newDb = { ...db };
      delete newDb[key];
      saveToStorage(newDb);
      setNoteText("");
    }
  };

  // --- DRAG & DROP ---
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingFile(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingFile(false); };
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          if (readerEvent.target?.result) {
            const img = new Image();
            img.src = readerEvent.target.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const MAX_WIDTH = 1024;
              let width = img.width;
              let height = img.height;
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
              canvas.width = width;
              canvas.height = height;
              ctx?.drawImage(img, 0, 0, width, height);
              const compressedData = canvas.toDataURL('image/jpeg', 0.7);
              setImageSrc(compressedData);
              setCustomImages(prev => {
                const updated = { ...prev, [currentMonth]: compressedData };
                try {
                  localStorage.setItem('pictocal_custom_images', JSON.stringify(updated));
                  setIsDirty(true);
                } catch (err) { alert("Warning: Browser storage is full."); }
                return updated;
              });
            };
          }
        };
        reader.readAsDataURL(file);
      } else { alert("Please drop an image file."); }
    }
  }, [currentMonth]);

  const savedText = db[getDateKey(selectedDay, currentMonth, currentYear)] || "";
  const isAddEnabled = !recordFound && noteText.trim().length > 0;
  const isConfirmEnabled = recordFound && noteText.trim().length > 0 && noteText !== savedText;
  const isDeleteEnabled = recordFound;

  const loadSaveBtnClass = (active: boolean, color: string) => `
    text-[10px] px-2 py-1 rounded font-bold shadow-md border transition-colors
    ${active
      ? `${color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-500 border-yellow-700' : 'bg-green-600 hover:bg-green-500 border-green-700'} text-white cursor-pointer`
      : 'bg-gray-400 text-gray-200 border-gray-500 cursor-not-allowed'}
  `;

  return (
    <div className="h-screen w-full bg-[#1a365d] flex flex-col p-2 overflow-hidden font-sans box-border">

      {/* HEADER TABS & BACKUP CONTROLS */}
      <div className="h-8 flex-none w-full flex items-end justify-between px-4 mb-0 z-10">
        <div className="flex items-end space-x-1">
          <div className="bg-white px-6 py-1 rounded-t-lg text-sm font-bold text-gray-800 shadow-sm cursor-pointer border-t border-l border-r border-gray-400 relative top-[1px]">
            Calendar Page
          </div>
          <div className="bg-[#2c5282] px-6 py-1 rounded-t-lg text-sm font-bold text-white shadow-sm cursor-pointer opacity-80 hover:opacity-100">
            Data Page
          </div>
        </div>
        <div className="flex space-x-2 pb-1">
          <input type="file" ref={fileInputRef} onChange={handleFallbackFileLoad} className="hidden" accept=".json" />

          <button
            onClick={handleImportClick}
            disabled={hasLoaded && !isDirty}
            className={loadSaveBtnClass(!hasLoaded || isDirty, 'yellow')}
          >
            Load Diary
          </button>

          <button
            onClick={handleExportBackup}
            disabled={!isDirty}
            className={loadSaveBtnClass(isDirty, 'green')}
          >
            Save Diary
          </button>
        </div>
      </div>

      {/* APP FRAME */}
      <div id="capture-target" className="flex-1 w-full min-w-0 min-h-0 bg-[#1a365d] border-4 border-[#1a365d] rounded-lg overflow-hidden shadow-2xl flex flex-col relative">
        <PanelGroup direction="horizontal" className="h-full w-full">

          {/* --- LEFT PANEL --- */}
          <Panel defaultSize={55} minSize={30} collapsible={false} className="bg-white flex flex-col min-w-0">
            <div
              className={`flex-1 w-full relative overflow-hidden bg-black flex items-center justify-center transition-colors ${isDraggingFile ? 'bg-gray-700' : 'bg-black'}`}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
              <img src={imageSrc} alt="Landscape" className="w-full h-full object-contain select-none block" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x600?text=Image+Not+Found"; }} />
              {isDraggingFile && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 border-4 border-blue-400 border-dashed z-50">
                  <span className="text-white font-bold text-xl bg-black/50 px-4 py-2 rounded">Drop Image Here</span>
                </div>
              )}
            </div>

            <div className="h-10 flex-none bg-[#1a365d] flex items-center justify-between px-2" data-html2canvas-ignore="true">
              <button onClick={handleMakePDF} className="bg-white text-black text-xs font-bold px-3 py-1 rounded shadow hover:bg-gray-200">
                Make PDF
              </button>
              <button onClick={() => window.open('https://www.bbc.co.uk/', '_blank')} className="bg-[#2d3748] text-white text-xs font-bold px-3 py-1 rounded border border-gray-500 hover:bg-gray-700">
                BBC Home Page
              </button>
            </div>
          </Panel>

          {/* SPLITTER */}
          <PanelResizeHandle className="w-3 flex flex-col justify-start z-50 relative focus:outline-none">
            <div className="w-full bg-[#1a365d] hover:bg-[#2c5282] transition-colors flex items-center justify-center relative" style={{ height: 'calc(100% - 2.5rem)' }}>
              <div className="h-8 w-1 bg-blue-400/30 rounded"></div>
            </div>
          </PanelResizeHandle>

          {/* --- RIGHT PANEL --- */}
          <Panel minSize={30} collapsible={false} className="flex flex-col min-w-0">
            <PanelGroup direction="vertical" className="h-full">

              {/* CALENDAR */}
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

                  <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 text-center text-sm min-h-0">
                    {calendarCells.map((cell) => {
                      let hasData = false;
                      if (cell.type === 'current') {
                        hasData = !!db[getDateKey(cell.day, currentMonth, currentYear)];
                      }
                      const isSelected = cell.type === 'current' && selectedDay === cell.day;

                      let textColor = 'text-green-800';
                      if (cell.type !== 'current') textColor = 'text-[#7da993]';

                      let cursor = 'cursor-default';
                      if (cell.type === 'current') cursor = 'cursor-pointer hover:bg-green-200';

                      let bgClass = 'border-transparent';
                      if (isSelected) {
                        bgClass = 'bg-cyan-400 text-black font-bold border-cyan-600 shadow-sm';
                        textColor = 'text-black';
                      }

                      return (
                        <div
                          key={cell.key}
                          onClick={() => handleDayClick(cell.day, cell.type)}
                          className={`
                              relative flex items-center justify-center rounded border transition-colors
                              ${bgClass} ${cursor} ${textColor}
                            `}
                        >
                          <span className="z-10 relative">{cell.day}</span>
                          {hasData && !isSelected && (
                            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div onClick={goToToday} className="h-6 flex-none bg-[#bfdbfe] flex items-center justify-center text-xs text-gray-700 font-bold border-t border-blue-300 cursor-pointer hover:bg-blue-300 hover:text-blue-900 transition-colors" title="Click to go to Today">
                  Today is {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </Panel>

              {/* SPLITTER */}
              <PanelResizeHandle className="h-3 bg-[#1a365d] flex items-center justify-center cursor-row-resize hover:bg-[#2c5282] transition-colors z-50 relative focus:outline-none">
                <div className="w-8 h-1 bg-blue-400/30 rounded"></div>
              </PanelResizeHandle>

              {/* DATA ENTRY */}
              <Panel minSize={20} collapsible={false} className="flex flex-col bg-[#bfdbfe] min-h-0">
                <div className="bg-[#1a365d] h-8 flex-none grid grid-cols-[1fr_auto_1fr] items-center px-2">
                  <div></div>
                  <div className="flex items-center justify-center space-x-1">
                    <button onClick={() => changeWeek(-1)} className="text-white font-bold hover:text-blue-300 px-2">◀</button>
                    <span className="bg-[#3182ce] text-white text-xs px-4 py-0.5 rounded border border-blue-400 text-center min-w-[90px] shadow-inner">
                      Week No {getWeekNumber(new Date(currentYear, currentMonth, selectedDay))}
                    </span>
                    <button onClick={() => changeWeek(1)} className="text-white font-bold hover:text-blue-300 px-2">▶</button>
                  </div>
                  <div className="flex justify-end">
                    <span className="bg-white text-black text-xs px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                      {formatDate(selectedDay, currentMonth, currentYear)}
                    </span>
                  </div>
                </div>

                <textarea value={noteText} onChange={handleTextChange} className="flex-1 w-full bg-[#bfdbfe] p-2 text-sm text-gray-900 resize-none outline-none font-medium min-h-0 placeholder-gray-500/50" placeholder="No notes for this day..." />
              </Panel>

            </PanelGroup>

            <div className="h-10 flex-none bg-[#1a365d] flex items-center justify-end px-2 space-x-2" data-html2canvas-ignore="true">
              <button onClick={handleDelete} disabled={!isDeleteEnabled} className={`text-xs font-bold px-3 py-1 rounded shadow border ${isDeleteEnabled ? 'bg-white text-black hover:bg-gray-100 border-gray-400 cursor-pointer' : 'bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed'}`}>Delete</button>
              <div className="flex-1"></div>
              <button onClick={handleAdd} disabled={!isAddEnabled} className={`text-xs font-bold px-3 py-1 rounded shadow border ${isAddEnabled ? 'bg-white text-black hover:bg-gray-100 border-gray-400 cursor-pointer' : 'bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed'}`}>Add</button>
              <button onClick={handleConfirm} disabled={!isConfirmEnabled} className={`text-xs font-bold px-3 py-1 rounded shadow border ${isConfirmEnabled ? 'bg-white text-black hover:bg-gray-100 border-gray-400 cursor-pointer' : 'bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed'}`}>Confirm</button>
            </div>

          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}