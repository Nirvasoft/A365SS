import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
} from 'lucide-react';
import { Button } from '../../components/ui';
import apiClient from '../../lib/api-client';
import { ROOM_REQUEST_LIST } from '../../config/api-routes';
import { useNavigate } from 'react-router-dom';
import styles from './ReservationsPage.module.css';
import '../../styles/pages.css';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

interface RoomBooking {
    name: string;
    roomdesc: string;
    starttime: string;
    endtime: string;
    startdate?: string;
}

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

const COLORS = [
    '#4CAF50', // green
    '#F44336', // red
    '#2196F3', // blue
    '#FF9800', // orange
    '#9C27B0', // purple
    '#009688', // teal
    '#E91E63', // pink
    '#212121', // black
];

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Format a Date to yyyyMMdd for the API */
function toApiDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${dd}`;
}

/** Get the week (Sun-Sat) containing a date */
function getWeekDays(date: Date): Date[] {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const sun = new Date(d);
    sun.setDate(d.getDate() - day);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const dd = new Date(sun);
        dd.setDate(sun.getDate() + i);
        days.push(dd);
    }
    return days;
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatMonthYear(d: Date) {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

export default function ReservationsPage() {
    const navigate = useNavigate();
    const today = new Date();

    const [selectedDate, setSelectedDate] = useState<Date>(today);

    const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

    const prevWeek = useCallback(() => {
        setSelectedDate((d) => {
            const nd = new Date(d);
            nd.setDate(d.getDate() - 7);
            return nd;
        });
    }, []);

    const nextWeek = useCallback(() => {
        setSelectedDate((d) => {
            const nd = new Date(d);
            nd.setDate(d.getDate() + 7);
            return nd;
        });
    }, []);

    // ── Fetch all room bookings for the selected day ──
    const apiDate = toApiDate(selectedDate);
    const { data: bookings = [], isLoading } = useQuery<RoomBooking[]>({
        queryKey: ['roomBookings', apiDate],
        queryFn: async () => {
            const res = await apiClient.post(ROOM_REQUEST_LIST, {
                date: apiDate,
                reservationtype: '',
            });
            return (res.data?.datalist || []) as RoomBooking[];
        },
    });

    // ── Assign a cycling color per unique booking ──
    const coloredBookings = useMemo(() => {
        let idx = 0;
        const cache = new Map<string, string>();
        return bookings.map((b) => {
            const key = `${b.name}_${b.roomdesc}_${b.starttime}_${b.endtime}`;
            if (!cache.has(key)) {
                cache.set(key, COLORS[idx % COLORS.length]);
                idx++;
            }
            return { ...b, color: cache.get(key)! };
        });
    }, [bookings]);

    /* ═══════════════════════════ Render ═══════════════════════ */

    return (
        <div className={styles['reservations-page']}>
            {/* ── Page header ── */}
            <div className={styles['reservations-page__header-row']}>
                <h1 className={styles['reservations-page__title']}>Reservations</h1>
                <Button
                    variant="primary"
                    leftIcon={<Plus size={18} />}
                    onClick={() => navigate('/requests/new?type=reservation')}
                >
                    New Reservation
                </Button>
            </div>

            {/* ── Month / Year header with week nav ── */}
            <div className={styles['week-header']}>
                <button className={styles['week-header__nav']} onClick={prevWeek}>
                    <ChevronLeft size={20} />
                </button>
                <span className={styles['week-header__title']}>
                    {formatMonthYear(selectedDate)}
                </span>
                <button className={styles['week-header__nav']} onClick={nextWeek}>
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* ── Week day strip ── */}
            <div className={styles['week-strip']}>
                {weekDays.map((day, i) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, today);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                        <button
                            key={i}
                            className={[
                                styles['week-strip__day'],
                                isSelected ? styles['week-strip__day--selected'] : '',
                                isToday && !isSelected ? styles['week-strip__day--today'] : '',
                                isWeekend && !isSelected ? styles['week-strip__day--weekend'] : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            onClick={() => setSelectedDate(new Date(day))}
                        >
                            <span className={styles['week-strip__date']}>
                                {day.getDate()}
                            </span>
                            <span className={styles['week-strip__label']}>
                                {WEEKDAY_SHORT[day.getDay()]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── Loading bar ── */}
            {isLoading && <div className={styles['loading-bar']} />}

            {/* ── Reservation list ── */}
            <div className={styles['booking-list']}>
                {!isLoading && coloredBookings.length === 0 ? (
                    <div className={styles['booking-list__empty']}>
                        No Room Booking
                    </div>
                ) : (
                    coloredBookings.map((b, i) => (
                        <div key={i} className={styles['booking-item']}>
                            {/* Time column */}
                            <div className={styles['booking-item__time']}>
                                <span>{b.starttime}</span>
                                <span>{b.endtime}</span>
                            </div>

                            {/* Colored bar */}
                            <div
                                className={styles['booking-item__bar']}
                                style={{ backgroundColor: b.color }}
                            />

                            {/* Room + Person */}
                            <div className={styles['booking-item__info']}>
                                <span className={styles['booking-item__room']}>
                                    {b.roomdesc}
                                </span>
                                <span className={styles['booking-item__person']}>
                                    {b.name}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
