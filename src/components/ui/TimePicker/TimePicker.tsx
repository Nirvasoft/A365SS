import { useMemo, useCallback } from 'react';
import styles from './TimePicker.module.css';

interface TimePickerProps {
    id?: string;
    label?: string;
    /** Value in 24-hour "HH:mm" format, e.g. "14:30" */
    value: string;
    /** Fires with 24-hour "HH:mm" string */
    onChange: (value: string) => void;
    required?: boolean;
    error?: string;
}

/** Parse "HH:mm" (24h) → { hour12, minute, period } */
function parse24h(v: string): { hour12: number; minute: number; period: 'AM' | 'PM' } {
    const [hStr, mStr] = (v || '12:00').split(':');
    let h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return { hour12, minute: m, period };
}

/** Compose 12h parts → "HH:mm" (24h) */
function to24h(hour12: number, minute: number, period: 'AM' | 'PM'): string {
    let h = hour12 % 12;
    if (period === 'PM') h += 12;
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);   // 0..59

export default function TimePicker({ id, label, value, onChange, required, error }: TimePickerProps) {
    const { hour12, minute, period } = useMemo(() => parse24h(value), [value]);

    const handleHourChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            onChange(to24h(Number(e.target.value), minute, period));
        },
        [minute, period, onChange]
    );

    const handleMinuteChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            onChange(to24h(hour12, Number(e.target.value), period));
        },
        [hour12, period, onChange]
    );

    const handlePeriodToggle = useCallback(
        (p: 'AM' | 'PM') => {
            onChange(to24h(hour12, minute, p));
        },
        [hour12, minute, onChange]
    );

    return (
        <div className={styles['time-picker']}>
            {label && (
                <label className={styles['time-picker__label']} htmlFor={id}>
                    {label}
                    {required && <span className={styles['time-picker__required']}>*</span>}
                </label>
            )}

            <div className={styles['time-picker__row']}>
                {/* Hour */}
                <select
                    id={id}
                    className={`${styles['time-picker__select']} ${styles['time-picker__select--hour']}`}
                    value={hour12}
                    onChange={handleHourChange}
                >
                    {HOURS.map((h) => (
                        <option key={h} value={h}>
                            {String(h).padStart(2, '0')}
                        </option>
                    ))}
                </select>

                <span className={styles['time-picker__separator']}>:</span>

                {/* Minute */}
                <select
                    className={`${styles['time-picker__select']} ${styles['time-picker__select--minute']}`}
                    value={minute}
                    onChange={handleMinuteChange}
                >
                    {MINUTES.map((m) => (
                        <option key={m} value={m}>
                            {String(m).padStart(2, '0')}
                        </option>
                    ))}
                </select>

                {/* AM / PM toggle */}
                <div className={styles['time-picker__period']}>
                    <button
                        type="button"
                        className={`${styles['time-picker__period-btn']} ${period === 'AM' ? styles['time-picker__period-btn--active'] : ''}`}
                        onClick={() => handlePeriodToggle('AM')}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        className={`${styles['time-picker__period-btn']} ${period === 'PM' ? styles['time-picker__period-btn--active'] : ''}`}
                        onClick={() => handlePeriodToggle('PM')}
                    >
                        PM
                    </button>
                </div>
            </div>

            {error && <span className={styles['time-picker__error']}>{error}</span>}
        </div>
    );
}
