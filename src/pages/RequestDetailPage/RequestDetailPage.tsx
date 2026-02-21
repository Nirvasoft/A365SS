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
    Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge/Badge';
import { RequestStatus } from '../../types/models';
import type { RequestDetailModel } from '../../types/models';
import apiClient from '../../lib/api-client';
import { GET_REQUEST_DETAIL, DELETE_REQUEST } from '../../config/api-routes';
import styles from './RequestDetailPage.module.css';

function getTypeVisual(desc: string) {
    const d = desc?.toLowerCase() || '';
    if (d.includes('leave')) return { Icon: Palmtree, bg: '#f0fdf4', color: '#16a34a' };
    if (d.includes('overtime') || d.includes('ot')) return { Icon: Clock, bg: '#fef3c7', color: '#d97706' };
    if (d.includes('work from home') || d.includes('wfh')) return { Icon: Home, bg: '#eff6ff', color: '#2563eb' };
    if (d.includes('transport')) return { Icon: Car, bg: '#faf5ff', color: '#9333ea' };
    if (d.includes('reserv')) return { Icon: Calendar, bg: '#ecfeff', color: '#0891b2' };
    if (d.includes('travel')) return { Icon: Plane, bg: '#fff7ed', color: '#ea580c' };
    if (d.includes('claim') || d.includes('advance')) return { Icon: Banknote, bg: '#fef2f2', color: '#dc2626' };
    return { Icon: FileText, bg: '#f1f5f9', color: '#64748b' };
}

function Field({ label, value }: { label: string; value: string | number | undefined | null }) {
    return (
        <div className={styles['request-detail__field']}>
            <span className={styles['request-detail__field-label']}>{label}</span>
            <span className={`${styles['request-detail__field-value']} ${!value ? styles['request-detail__field-value--empty'] : ''}`}>
                {value || '—'}
            </span>
        </div>
    );
}

export default function RequestDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: detail, isLoading } = useQuery<RequestDetailModel>({
        queryKey: ['requestDetail', id],
        queryFn: async () => {
            const res = await apiClient.post(GET_REQUEST_DETAIL, { syskey: id });
            return res.data?.datalist;
        },
        enabled: !!id,
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post(DELETE_REQUEST, { syskey: id });
        },
        onSuccess: () => {
            toast.success('Request deleted');
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            navigate('/requests');
        },
        onError: () => toast.error('Failed to delete request'),
    });

    if (isLoading) {
        return (
            <div className={styles['request-detail']}>
                <div className={styles['request-detail__card']}>
                    <div className={styles['request-detail__body']}>
                        <div className={styles['request-detail__skeleton']}>
                            <div className={styles['request-detail__skeleton-bar']} style={{ width: '60%' }} />
                            <div className={styles['request-detail__skeleton-bar']} style={{ width: '80%' }} />
                            <div className={styles['request-detail__skeleton-bar']} style={{ width: '40%' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className={styles['request-detail']}>
                <button className={styles['request-detail__back']} onClick={() => navigate('/requests')}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="empty-state">
                    <FileText size={48} className="empty-state__icon" />
                    <h3 className="empty-state__title">Request not found</h3>
                </div>
            </div>
        );
    }

    const { Icon, bg, color } = getTypeVisual(detail.requesttypedesc);
    const isPending = String(detail.requeststatus) === RequestStatus.Pending;

    return (
        <div className={styles['request-detail']}>
            <button className={styles['request-detail__back']} onClick={() => navigate('/requests')}>
                <ArrowLeft size={16} />
                {t('common.back')}
            </button>

            <div className={styles['request-detail__card']}>
                {/* ── Header ── */}
                <div className={styles['request-detail__header']}>
                    <div className={styles['request-detail__header-left']}>
                        <div className={styles['request-detail__icon']} style={{ background: bg, color }}>
                            <Icon size={24} />
                        </div>
                        <div className={styles['request-detail__title-group']}>
                            <h2>{detail.requesttypedesc}{detail.requestsubtypedesc ? ` — ${detail.requestsubtypedesc}` : ''}</h2>
                            <span>
                                {detail.refno ? `Ref #${detail.refno}` : ''}
                                {detail.eid ? ` · ${detail.eid}` : ''}
                            </span>
                        </div>
                    </div>
                    <StatusBadge status={String(detail.requeststatus)} />
                </div>

                {/* ── Body ── */}
                <div className={styles['request-detail__body']}>
                    {/* Core dates */}
                    <div className={styles['request-detail__section']}>
                        <h4 className={styles['request-detail__section-title']}>Date & Time</h4>
                        <div className={styles['request-detail__grid']}>
                            <Field label="Start Date" value={detail.startdate || detail.date} />
                            <Field label="End Date" value={detail.enddate} />
                            <Field label="Start Time" value={detail.starttime || detail.time} />
                            <Field label="End Time" value={detail.endtime} />
                            <Field label="Duration" value={detail.duration} />
                            <Field label="Select Day" value={detail.selectday} />
                        </div>
                    </div>

                    {/* Transportation fields */}
                    {(detail.pickupplace || detail.dropoffplace) && (
                        <div className={styles['request-detail__section']}>
                            <h4 className={styles['request-detail__section-title']}>Transportation</h4>
                            <div className={styles['request-detail__grid']}>
                                <Field label="Pick-up Place" value={detail.pickupplace} />
                                <Field label="Drop-off Place" value={detail.dropoffplace} />
                                <Field label="Leave Time" value={detail.userleavetime} />
                                <Field label="Arrival Time" value={detail.arrivaltime} />
                                {detail.isreturn && <Field label="Return Time" value={detail.returntime} />}
                                <Field label="Car" value={detail.car} />
                                <Field label="Driver" value={detail.driver} />
                            </div>
                        </div>
                    )}

                    {/* Travel fields */}
                    {(detail.fromplace || detail.toplace) && (
                        <div className={styles['request-detail__section']}>
                            <h4 className={styles['request-detail__section-title']}>Travel</h4>
                            <div className={styles['request-detail__grid']}>
                                <Field label="From" value={detail.fromplace} />
                                <Field label="To" value={detail.toplace} />
                                <Field label="Departure Date" value={detail.departuredate} />
                                <Field label="Arrival Date" value={detail.arrivaldate} />
                                <Field label="Mode of Travel" value={detail.modeoftravel?.join(', ')} />
                                <Field label="Product" value={detail.product} />
                                <Field label="Project" value={detail.project} />
                                <Field label="Estimated Budget" value={detail.estimatedbudget ? String(detail.estimatedbudget) : undefined} />
                            </div>
                        </div>
                    )}

                    {/* Reservation fields */}
                    {(detail.rooms || detail.roomsdesc) && (
                        <div className={styles['request-detail__section']}>
                            <h4 className={styles['request-detail__section-title']}>Reservation</h4>
                            <div className={styles['request-detail__grid']}>
                                <Field label="Room" value={detail.roomsdesc || detail.rooms} />
                                <Field label="Max People" value={detail.maxpeople ? String(detail.maxpeople) : undefined} />
                            </div>
                        </div>
                    )}

                    {/* Overtime */}
                    {(detail.otday || detail.hour) && (
                        <div className={styles['request-detail__section']}>
                            <h4 className={styles['request-detail__section-title']}>Overtime</h4>
                            <div className={styles['request-detail__grid']}>
                                <Field label="OT Day" value={detail.otday} />
                                <Field label="Hours" value={detail.hour} />
                            </div>
                        </div>
                    )}

                    {/* Financial */}
                    {(detail.amount > 0) && (
                        <div className={styles['request-detail__section']}>
                            <h4 className={styles['request-detail__section-title']}>Financial</h4>
                            <div className={styles['request-detail__grid']}>
                                <Field label="Amount" value={String(detail.amount)} />
                                <Field label="Currency" value={detail.currencytype} />
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    {detail.locationname && (
                        <div className={styles['request-detail__section']}>
                            <h4 className={styles['request-detail__section-title']}>Location</h4>
                            <div className={styles['request-detail__grid']}>
                                <Field label="Location" value={detail.locationname} />
                            </div>
                        </div>
                    )}

                    {/* Remarks */}
                    {(detail.remark || detail.comment) && (
                        <div className={styles['request-detail__section']}>
                            <h4 className={styles['request-detail__section-title']}>Remarks</h4>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)', lineHeight: 'var(--leading-relaxed)' }}>
                                {detail.remark || detail.comment}
                            </p>
                        </div>
                    )}

                    {/* Approvers */}
                    {detail.selectedApprovers && detail.selectedApprovers.length > 0 && (
                        <div className={styles['request-detail__section']}>
                            <h4 className={styles['request-detail__section-title']}>Approvers</h4>
                            <div className={styles['request-detail__approver-list']}>
                                {detail.selectedApprovers.map((a) => (
                                    <span key={a.syskey} className={styles['request-detail__approver-chip']}>
                                        <span className={styles['request-detail__approver-avatar']}>
                                            {a.name?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                        {a.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Accompanying Persons */}
                    {detail.selectedAcconpanyPersons && detail.selectedAcconpanyPersons.length > 0 && (
                        <div className={styles['request-detail__section']}>
                            <h4 className={styles['request-detail__section-title']}>Accompanying Persons</h4>
                            <div className={styles['request-detail__approver-list']}>
                                {detail.selectedAcconpanyPersons.map((p) => (
                                    <span key={p.syskey} className={styles['request-detail__approver-chip']}>
                                        <span className={styles['request-detail__approver-avatar']}>
                                            {p.name?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                        {p.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Actions ── */}
                {isPending && (
                    <div className={styles['request-detail__actions']}>
                        <Button
                            variant="danger"
                            size="sm"
                            loading={deleteMutation.isPending}
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this request?')) {
                                    deleteMutation.mutate();
                                }
                            }}
                        >
                            <Trash2 size={14} />
                            Delete
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
