import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Palmtree,
    Clock,
    Home,
    Car,
    Calendar,
    Plane,
    Banknote,
    FileText,
    CheckCircle,
    XCircle,
    Forward,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { Textarea } from '../../components/ui/Input/Input';
import { StatusBadge } from '../../components/ui/Badge/Badge';
import MemberPicker from '../../components/shared/MemberPicker/MemberPicker';
import type { MemberItem } from '../../components/shared/MemberPicker/MemberPicker';
import type { ApprovalDetailModel } from '../../types/models';
import apiClient from '../../lib/api-client';
import { APPROVAL_DETAIL, SAVE_APPROVAL } from '../../config/api-routes';
import styles from './ApprovalDetailPage.module.css';

/** Convert "yyyymmdd" → "dd/mm/yyyy" for display */
function displayDate(raw?: string | unknown): string {
    const s = String(raw || '');
    if (s.length < 8 || s === 'undefined') return s;
    return `${s.slice(6, 8)}/${s.slice(4, 6)}/${s.slice(0, 4)}`;
}

/* ══════════════════════════════════════════════════════════════ */

function getTypeVisual(data: Record<string, unknown>) {
    const desc = String(data?.requesttypedesc || data?.requesttype || '').toLowerCase();
    if (desc.includes('leave')) return { Icon: Palmtree, bg: '#f0fdf4', color: '#16a34a' };
    if (desc.includes('overtime') || desc.includes('ot')) return { Icon: Clock, bg: '#fef3c7', color: '#d97706' };
    if (desc.includes('work from home') || desc.includes('wfh')) return { Icon: Home, bg: '#eff6ff', color: '#2563eb' };
    if (desc.includes('transport')) return { Icon: Car, bg: '#faf5ff', color: '#9333ea' };
    if (desc.includes('reserv')) return { Icon: Calendar, bg: '#ecfeff', color: '#0891b2' };
    if (desc.includes('travel')) return { Icon: Plane, bg: '#fff7ed', color: '#ea580c' };
    if (desc.includes('claim') || desc.includes('advance')) return { Icon: Banknote, bg: '#fef2f2', color: '#dc2626' };
    return { Icon: FileText, bg: '#f1f5f9', color: '#64748b' };
}

function Field({ label, value }: { label: string; value: string | number | undefined | null }) {
    return (
        <div className={styles['approval-detail__field']}>
            <span className={styles['approval-detail__field-label']}>{label}</span>
            <span className={`${styles['approval-detail__field-value']} ${!value ? styles['approval-detail__field-value--empty'] : ''}`}>
                {value || '—'}
            </span>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════ */

export default function ApprovalDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [comment, setComment] = useState('');
    const [forwardApprovers, setForwardApprovers] = useState<MemberItem[]>([]);
    const [showForward, setShowForward] = useState(false);

    // ── Fetch detail ──
    const { data: detail, isLoading } = useQuery<ApprovalDetailModel>({
        queryKey: ['approvalDetail', id],
        queryFn: async () => {
            const res = await apiClient.post(APPROVAL_DETAIL, { syskey: id });
            return res.data;
        },
        enabled: !!id,
    });

    const data = detail?.datalist || ({} as Record<string, unknown>);
    const approverList = (data as Record<string, unknown>)?.selectedApprovers as Array<{ syskey: string; name: string }> | undefined;

    // ── Approve / Reject mutation ──
    const actionMutation = useMutation({
        mutationFn: async (status: 'approve' | 'reject') => {
            const payload = {
                syskey: id,
                status: status === 'approve' ? '2' : '3',
                comment,
                selectedApprovers:
                    showForward && forwardApprovers.length > 0
                        ? forwardApprovers.map((a) => ({ syskey: a.syskey, name: a.name }))
                        : [],
            };
            const res = await apiClient.post(SAVE_APPROVAL, payload);
            return res.data;
        },
        onSuccess: (_data, status) => {
            toast.success(status === 'approve' ? 'Request approved' : 'Request rejected');
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['approvalDetail', id] });
            navigate('/approvals');
        },
        onError: () => toast.error(t('common.error')),
    });

    const handleAction = (status: 'approve' | 'reject') => {
        if (status === 'reject' && !comment.trim()) {
            toast.error('Please add a comment before rejecting');
            return;
        }
        actionMutation.mutate(status);
    };

    /* ═══════════════════════ Loading / Empty ═══════════════════ */

    if (isLoading) {
        return (
            <div className={styles['approval-detail']}>
                <div className={styles['approval-detail__card']}>
                    <div className={styles['approval-detail__skeleton']}>
                        <div className={styles['approval-detail__skeleton-bar']} style={{ width: '60%' }} />
                        <div className={styles['approval-detail__skeleton-bar']} style={{ width: '80%' }} />
                        <div className={styles['approval-detail__skeleton-bar']} style={{ width: '40%' }} />
                    </div>
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className={styles['approval-detail']}>
                <button className={styles['approval-detail__back']} onClick={() => navigate('/approvals')}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="empty-state">
                    <FileText size={48} className="empty-state__icon" />
                    <h3 className="empty-state__title">Approval not found</h3>
                </div>
            </div>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = data as Record<string, any>;
    const { Icon, bg, color } = getTypeVisual(d);
    const reqName = String(d.name || d.eid || 'Employee');
    const isPending = String(d.requeststatus) === '1';

    /* ═══════════════════════════ Render ═════════════════════════ */

    return (
        <div className={styles['approval-detail']}>
            <button className={styles['approval-detail__back']} onClick={() => navigate('/approvals')}>
                <ArrowLeft size={16} />
                {t('common.back')}
            </button>

            <div className={styles['approval-detail__card']}>
                {/* ── Header ── */}
                <div className={styles['approval-detail__header']}>
                    <div className={styles['approval-detail__header-left']}>
                        <div className={styles['approval-detail__icon']} style={{ background: bg, color }}>
                            <Icon size={24} />
                        </div>
                        <div className={styles['approval-detail__title-group']}>
                            <h2>
                                {String(d.requesttypedesc || 'Request')}
                                {d.requestsubtypedesc ? ` — ${String(d.requestsubtypedesc)}` : ''}
                            </h2>
                            <span>
                                {d.refno ? `Ref #${d.refno}` : ''}
                                {d.eid ? ` · ${d.eid}` : ''}
                            </span>
                        </div>
                    </div>
                    <StatusBadge status={String(d.requeststatus || '1')} />
                </div>

                {/* ── Body ── */}
                <div className={styles['approval-detail__body']}>
                    {/* Requester */}
                    <div className={styles['approval-detail__section']}>
                        <h4 className={styles['approval-detail__section-title']}>Requested By</h4>
                        <div className={styles['approval-detail__requester']}>
                            <div className={styles['approval-detail__requester-avatar']}>
                                {reqName.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles['approval-detail__requester-info']}>
                                <div className={styles['approval-detail__requester-name']}>{reqName}</div>
                                <div className={styles['approval-detail__requester-meta']}>
                                    {String(d.eid || '')}
                                    {d.department ? ` · ${String(d.department)}` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className={styles['approval-detail__section']}>
                        <h4 className={styles['approval-detail__section-title']}>Date & Time</h4>
                        <div className={styles['approval-detail__grid']}>
                            <Field label="Start Date" value={displayDate(d.startdate || d.date)} />
                            <Field label="End Date" value={displayDate(d.enddate)} />
                            <Field label="Start Time" value={String(d.starttime || d.time || '')} />
                            <Field label="End Time" value={String(d.endtime || '')} />
                            <Field label="Duration" value={String(d.duration || '')} />
                        </div>
                    </div>

                    {/* Transportation fields */}
                    {(d.pickupplace || d.dropoffplace) && (
                        <div className={styles['approval-detail__section']}>
                            <h4 className={styles['approval-detail__section-title']}>Transportation</h4>
                            <div className={styles['approval-detail__grid']}>
                                <Field label="Pick-up Place" value={String(d.pickupplace || '')} />
                                <Field label="Drop-off Place" value={String(d.dropoffplace || '')} />
                                <Field label="Car" value={String(d.car || '')} />
                                <Field label="Driver" value={String(d.driver || '')} />
                            </div>
                        </div>
                    )}

                    {/* Travel fields */}
                    {(d.fromplace || d.toplace) && (
                        <div className={styles['approval-detail__section']}>
                            <h4 className={styles['approval-detail__section-title']}>Travel</h4>
                            <div className={styles['approval-detail__grid']}>
                                <Field label="From" value={String(d.fromplace || '')} />
                                <Field label="To" value={String(d.toplace || '')} />
                                <Field label="Departure Date" value={displayDate(d.departuredate)} />
                                <Field label="Arrival Date" value={displayDate(d.arrivaldate)} />
                                <Field label="Product" value={String(d.product || '')} />
                                <Field label="Project" value={String(d.project || '')} />
                                <Field label="Est. Budget" value={d.estimatedbudget ? String(d.estimatedbudget) : undefined} />
                            </div>
                        </div>
                    )}

                    {/* Reservation */}
                    {(d.rooms || d.roomsdesc) && (
                        <div className={styles['approval-detail__section']}>
                            <h4 className={styles['approval-detail__section-title']}>Reservation</h4>
                            <div className={styles['approval-detail__grid']}>
                                <Field label="Room" value={String(d.roomsdesc || d.rooms || '')} />
                                <Field label="Max People" value={d.maxpeople ? String(d.maxpeople) : undefined} />
                            </div>
                        </div>
                    )}

                    {/* Overtime */}
                    {(d.otday || d.hour) && (
                        <div className={styles['approval-detail__section']}>
                            <h4 className={styles['approval-detail__section-title']}>Overtime</h4>
                            <div className={styles['approval-detail__grid']}>
                                <Field label="OT Day" value={displayDate(d.otday)} />
                                <Field label="Hours" value={String(d.hour || '')} />
                            </div>
                        </div>
                    )}

                    {/* Remarks */}
                    {(d.remark || d.comment) && (
                        <div className={styles['approval-detail__section']}>
                            <h4 className={styles['approval-detail__section-title']}>Remarks</h4>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', lineHeight: 'var(--leading-relaxed)' }}>
                                {String(d.remark || d.comment)}
                            </p>
                        </div>
                    )}

                    {/* Approvers */}
                    {approverList && approverList.length > 0 && (
                        <div className={styles['approval-detail__section']}>
                            <h4 className={styles['approval-detail__section-title']}>Approval Chain</h4>
                            <div className={styles['approval-detail__approver-list']}>
                                {approverList.map((a) => (
                                    <span key={a.syskey} className={styles['approval-detail__approver-chip']}>
                                        <span className={styles['approval-detail__approver-dot']}>
                                            {a.name?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                        {a.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Accompany / Members */}
                    {detail.accompanyPersonList && detail.accompanyPersonList.length > 0 && (
                        <div className={styles['approval-detail__section']}>
                            <h4 className={styles['approval-detail__section-title']}>Accompanying Persons</h4>
                            <div className={styles['approval-detail__approver-list']}>
                                {detail.accompanyPersonList.map((p) => (
                                    <span key={p.syskey} className={styles['approval-detail__approver-chip']}>
                                        <span className={styles['approval-detail__approver-dot']}>
                                            {p.name?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                        {p.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Action Bar ── */}
                {isPending && (
                    <div className={styles['approval-detail__actions']}>
                        <div className={styles['approval-detail__comment-box']}>
                            <Textarea
                                id="approvalComment"
                                label={t('approval.comment')}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add your comment (required for rejection)…"
                                rows={3}
                            />
                        </div>

                        <div className={styles['approval-detail__action-row']}>
                            <Button
                                variant="success"
                                onClick={() => handleAction('approve')}
                                loading={actionMutation.isPending}
                            >
                                <CheckCircle size={16} />
                                {t('request.approve')}
                            </Button>

                            <Button
                                variant="danger"
                                onClick={() => handleAction('reject')}
                                loading={actionMutation.isPending}
                            >
                                <XCircle size={16} />
                                {t('request.reject')}
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => setShowForward(!showForward)}
                            >
                                <Forward size={16} />
                                Forward
                            </Button>
                        </div>

                        {/* Forward-to-next-approver */}
                        {showForward && (
                            <div className={styles['approval-detail__forward-section']}>
                                <div className={styles['approval-detail__forward-label']}>
                                    Forward to next approver
                                </div>
                                <MemberPicker
                                    label="Next Approver"
                                    members={forwardApprovers}
                                    onChange={setForwardApprovers}
                                    multiple={false}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
