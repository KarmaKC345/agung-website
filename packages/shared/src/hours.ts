import type { DayKey, OpeningHours, WeeklyHours } from './types';

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const DAY_LABEL: Record<DayKey, string> = {
  mon: 'Senin',
  tue: 'Selasa',
  wed: 'Rabu',
  thu: 'Kamis',
  fri: 'Jumat',
  sat: 'Sabtu',
  sun: 'Minggu',
};

export const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** "05:00" → "05.00" (format jam Indonesia) */
export function formatTime(hhmm: string): string {
  return hhmm.replace(':', '.');
}

function zonedNow(now: Date, timeZone: string): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const day = get('weekday').toLowerCase().slice(0, 3) as DayKey;
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** Jam buka hari ini menurut zona waktu toko, atau null bila tutup */
export function hoursToday(hours: WeeklyHours, timeZone: string, now: Date = new Date()): OpeningHours | null {
  return hours[zonedNow(now, timeZone).day] ?? null;
}

export interface OpenStatus {
  isOpen: boolean;
  /** "Buka · hingga 22.00" / "Tutup · buka pukul 05.00" / "Tutup · buka besok pukul 05.00" */
  label: string;
}

export function getOpenStatus(hours: WeeklyHours, timeZone: string, now: Date = new Date()): OpenStatus {
  const { day, minutes } = zonedNow(now, timeZone);
  const today = hours[day];

  if (today && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return { isOpen: true, label: `Buka · hingga ${formatTime(today.close)}` };
  }
  if (today && minutes < toMinutes(today.open)) {
    return { isOpen: false, label: `Tutup · buka pukul ${formatTime(today.open)}` };
  }
  const startIdx = DAY_KEYS.indexOf(day);
  for (let i = 1; i <= 7; i++) {
    const key = DAY_KEYS[(startIdx + i) % 7]!;
    const h = hours[key];
    if (h) {
      const when = i === 1 ? 'besok ' : `${DAY_LABEL[key]} `;
      return { isOpen: false, label: `Tutup · buka ${when}pukul ${formatTime(h.open)}` };
    }
  }
  return { isOpen: false, label: 'Tutup' };
}

/** Ringkas jam buka: "Setiap hari, 05.00–22.00" bila semua hari sama */
export function summarizeHours(hours: WeeklyHours): string | null {
  const values = DAY_ORDER.map((d) => hours[d]);
  const first = values[0];
  if (first && values.every((v) => v && v.open === first.open && v.close === first.close)) {
    return `Setiap hari, ${formatTime(first.open)}-${formatTime(first.close)}`;
  }
  return null;
}
