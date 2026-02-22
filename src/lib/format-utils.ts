/* ═══════════════════════════════════════════════════════════
   Format Utilities — Number formatting helpers
   ═══════════════════════════════════════════════════════════ */

/**
 * Format a number string with thousand separators.
 * "1234567" → "1,234,567"
 * "1234567.89" → "1,234,567.89"
 * Allows typing decimals (trailing dot is preserved).
 */
export function formatAmount(value: string): string {
    if (!value) return '';
    // Strip everything except digits and dot
    const clean = value.replace(/[^0-9.]/g, '');
    if (!clean) return '';

    const parts = clean.split('.');
    // Format integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

/**
 * Strip thousand separators to get the raw numeric string.
 * "1,234,567.89" → "1234567.89"
 */
export function unformatAmount(formatted: string): string {
    return formatted.replace(/,/g, '');
}
