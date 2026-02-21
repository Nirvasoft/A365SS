/* ═══════════════════════════════════════════════════════════
   Date Utilities — Shared date formatting helpers
   ═══════════════════════════════════════════════════════════ */

/**
 * Format a yyyyMMdd date string to dd/mm/yyyy for display.
 * Handles both "20260221" and null/undefined gracefully.
 */
export function displayDate(raw?: string | unknown): string {
    const s = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
    if (!s || s.length < 8) return '—';
    // yyyyMMdd → dd/mm/yyyy
    const yyyy = s.substring(0, 4);
    const mm = s.substring(4, 6);
    const dd = s.substring(6, 8);
    return `${dd}/${mm}/${yyyy}`;
}
