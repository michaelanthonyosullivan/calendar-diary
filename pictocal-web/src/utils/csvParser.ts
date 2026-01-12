export interface CalendarEvent {
  date: Date;
  description: string;
  imagePath: string;
}

export const parseEvents = (csvContent: string): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  // Custom line splitting to handle newlines inside quotes
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    }

    if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, respecting quotes
    const parts: string[] = [];
    let currentPart = '';
    let partInQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        partInQuotes = !partInQuotes;
      } else if (char === ',' && !partInQuotes) {
        parts.push(currentPart);
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart);

    if (parts.length >= 2) {
      const dateStr = parts[0].trim(); // dd/mm/yyyy
      let description = parts[1] ? parts[1].trim() : '';
      // parts[2] was memo, parts[3] was imagePath. 
      // User said ignore memo. CSV structure might still have it? 
      // If CSV still has 4 columns, we need to skip col 2 (0-indexed).
      // parts[0]=date, parts[1]=event, parts[2]=memo, parts[3]=image

      let imagePath = parts[3] ? parts[3].trim() : '';
      // If they removed the column from CSV, then adjust. 
      // User said "Update the data loader to ONLY populate the "Event" field. Ignore any "Memo" or "Classification" data from the CSV."
      // Implies CSV might still have it or we just ignore it. 
      // Let's assume CSV structure remains but we ignore the value.

      const cleanText = (text: string) => {
        if (text.startsWith('"') && text.endsWith('"')) {
          return text.slice(1, -1).replace(/""/g, '"');
        }
        return text;
      };

      description = cleanText(description);
      imagePath = cleanText(imagePath);

      const [day, month, year] = dateStr.split('/').map(Number);

      // Basic validation
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        events.push({
          date: new Date(year, month - 1, day),
          description,
          imagePath
        });
      }
    }
  }

  return events;
};

export const parseEventsToMap = (csvContent: string): Record<string, CalendarEvent> => {
  const events = parseEvents(csvContent);
  const map: Record<string, CalendarEvent> = {};

  events.forEach(e => {
    // Normalize date key: YYYY-MM-DD
    // Ensure single digit months/days are padded if needed, or consistent with getDateKey in components
    // Calendar.tsx uses: `${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}` which is strict but maybe not padded.
    // Let's use a standard padded YYYY-MM-DD for the data layer.
    const year = e.date.getFullYear();
    const month = String(e.date.getMonth() + 1).padStart(2, '0'); // 01-12
    const day = String(e.date.getDate()).padStart(2, '0'); // 01-31
    const key = `${year}-${month}-${day}`;
    map[key] = e;
  });

  return map;
};
