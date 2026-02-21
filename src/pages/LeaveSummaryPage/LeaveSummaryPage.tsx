import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Palmtree, Stethoscope, Baby, HeartPulse, GraduationCap, Briefcase } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge/Badge';
import type { LeaveType, RequestModel } from '../../types/models';
import apiClient from '../../lib/api-client';
import { LEAVE_TYPES, LEAVE_LIST } from '../../config/api-routes';
import styles from './LeaveSummaryPage.module.css';
import '../../styles/pages.css';

/* ══════════════════════════════════════════════════════════════ */

const CARD_COLORS = [
    { accent: '#16a34a', bg: '#f0fdf4', fill: '#16a34a', Icon: Palmtree },
    { accent: '#2563eb', bg: '#eff6ff', fill: '#2563eb', Icon: Stethoscope },
    { accent: '#d97706', bg: '#fef3c7', fill: '#d97706', Icon: Baby },
    { accent: '#9333ea', bg: '#faf5ff', fill: '#9333ea', Icon: HeartPulse },
    { accent: '#0891b2', bg: '#ecfeff', fill: '#0891b2', Icon: GraduationCap },
    { accent: '#ea580c', bg: '#fff7ed', fill: '#ea580c', Icon: Briefcase },
];

function getCardStyle(index: number) {
    return CARD_COLORS[index % CARD_COLORS.length];
}

/* ══════════════════════════════════════════════════════════════ */

export default function LeaveSummaryPage() {
    const { t } = useTranslation();

    // ── Leave balance types ──
    const { data: leaveTypes = [], isLoading: loadingTypes } = useQuery<LeaveType[]>({
        queryKey: ['leaveTypes'],
        queryFn: async () => {
            const res = await apiClient.post(LEAVE_TYPES, {});
            return res.data?.datalist || [];
        },
    });

    // ── Leave history ──
    const { data: leaveHistory = [], isLoading: loadingHistory } = useQuery<RequestModel[]>({
        queryKey: ['leaveHistory'],
        queryFn: async () => {
            const res = await apiClient.post(LEAVE_LIST, {});
            return res.data?.datalist || [];
        },
    });

    /* ═══════════════════════════ Render ═══════════════════════ */

    return (
        <div className={styles['leave-summary']}>
            {/* ── Header ── */}
            <div className="page-header">
                <div className="page-header__row">
                    <div>
                        <h1 className="page-header__title">{t('leave.summary')}</h1>
                        <p className="page-header__subtitle">
                            Track your leave balance and history
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Balance cards ── */}
            {loadingTypes ? (
                <div className={styles['leave-skeleton']}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={styles['leave-skeleton__card']} />
                    ))}
                </div>
            ) : leaveTypes.length === 0 ? (
                <div className="empty-state">
                    <Palmtree size={64} className="empty-state__icon" />
                    <h3 className="empty-state__title">No Leave Types</h3>
                    <p className="empty-state__desc">Leave balance information is not available yet.</p>
                </div>
            ) : (
                <div className={styles['leave-cards']}>
                    {leaveTypes.map((lt, i) => {
                        const style = getCardStyle(i);
                        const total = (lt.used || 0) + (lt.remaining || 0);
                        const usedPct = total > 0 ? ((lt.used || 0) / total) * 100 : 0;

                        return (
                            <div key={lt.syskey} className={styles['leave-card']}>
                                <div className={styles['leave-card__accent']} style={{ background: style.accent }} />
                                <div className={styles['leave-card__header']}>
                                    <div className={styles['leave-card__icon']} style={{ background: style.bg, color: style.accent }}>
                                        <style.Icon size={20} />
                                    </div>
                                    <span className={styles['leave-card__name']}>{lt.description}</span>
                                </div>

                                <div className={styles['leave-card__progress']}>
                                    <div
                                        className={styles['leave-card__progress-fill']}
                                        style={{ width: `${Math.min(usedPct, 100)}%`, background: style.fill }}
                                    />
                                </div>

                                <div className={styles['leave-card__stats']}>
                                    <div className={styles['leave-card__stat']}>
                                        <span className={styles['leave-card__stat-value']}>{lt.balance ?? total}</span>
                                        <span className={styles['leave-card__stat-label']}>{t('leave.balance')}</span>
                                    </div>
                                    <div className={styles['leave-card__stat']}>
                                        <span className={styles['leave-card__stat-value']}>{lt.used ?? 0}</span>
                                        <span className={styles['leave-card__stat-label']}>{t('leave.used')}</span>
                                    </div>
                                    <div className={styles['leave-card__stat']}>
                                        <span className={styles['leave-card__stat-value']}>{lt.remaining ?? 0}</span>
                                        <span className={styles['leave-card__stat-label']}>{t('leave.remaining')}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Leave history ── */}
            <div className={styles['leave-history']}>
                <div className={styles['leave-history__header']}>
                    <h3 className={styles['leave-history__title']}>Leave History</h3>
                </div>

                {loadingHistory ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                        <p className="empty-state__desc">{t('common.loading')}</p>
                    </div>
                ) : leaveHistory.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                        <Palmtree size={40} className="empty-state__icon" />
                        <h3 className="empty-state__title">No leave records</h3>
                        <p className="empty-state__desc">Your leave history will appear here.</p>
                    </div>
                ) : (
                    leaveHistory.map((req, i) => {
                        const dotColor =
                            req.requeststatus === '2' ? 'var(--color-success-400)' :
                                req.requeststatus === '3' ? 'var(--color-danger-400)' :
                                    'var(--color-warning-400)';

                        return (
                            <div key={req.syskey || i} className={styles['leave-history__item']}>
                                <div className={styles['leave-history__item-dot']} style={{ background: dotColor }} />
                                <div className={styles['leave-history__item-body']}>
                                    <div className={styles['leave-history__item-type']}>{req.requesttypedesc || req.requesttype}</div>
                                    <div className={styles['leave-history__item-dates']}>
                                        {req.startdate || req.date}
                                        {req.enddate ? ` → ${req.enddate}` : ''}
                                    </div>
                                </div>
                                <div className={styles['leave-history__item-right']}>
                                    <StatusBadge status={req.requeststatus} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
