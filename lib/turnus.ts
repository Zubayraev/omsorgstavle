// 3-7-4-7 medleverturnus — 21-dagers syklus
// ON:  dag 0-2 (3 dager), dag 10-13 (4 dager)
// OFF: dag 3-9 (7 dager),  dag 14-20 (7 dager)
// Team 1: offset 0 | Team 2: offset 7 | Team 3: offset 14

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isOnShift(date: Date, team: number, startDate: Date): boolean {
  const offset = (team - 1) * 7;
  const daysSinceStart = Math.floor((date.getTime() - startDate.getTime()) / MS_PER_DAY);
  const cycleDay = ((daysSinceStart - offset) % 21 + 21) % 21;
  return cycleDay <= 2 || (cycleDay >= 10 && cycleDay <= 13);
}

export function getWeekDays(referenceDate: Date): Date[] {
  const day = referenceDate.getDay();
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const DAG_NAVN = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
