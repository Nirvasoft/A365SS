import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
    Plus,
    ClipboardList,
    Palmtree,
    Clock,
    Home,
    Car,
    Calendar,
    Plane,
    Banknote,
    FileText,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge/Badge';
import { RequestStatus } from '../../types/models';
import type { RequestModel } from '../../types/models';
import apiClient from '../../lib/api-client';
import { GET_REQUEST_LIST } from '../../config/api-routes';
import '../../styles/pages.css';

const statusTabs = [
    { key: RequestStatus.All, label: 'status.all' },
    { key: RequestStatus.Pending, label: 'status.pending' },
    { key: RequestStatus.Approved, label: 'status.approved' },
    { key: RequestStatus.Rejected, label: 'status.rejected' },
];

function getRequestIcon(typedesc: string) {
    const lower = typedesc.toLowerCase();
    if (lower.includes('leave')) return { Icon: Palmtree, variant: 'leave' };
    if (lower.includes('overtime') || lower.includes('ot')) return { Icon: Clock, variant: 'overtime' };
    if (lower.includes('work from home') || lower.includes('wfh')) return { Icon: Home, variant: 'wfh' };
    if (lower.includes('transport')) return { Icon: Car, variant: 'transport' };
    if (lower.includes('reserv')) return { Icon: Calendar, variant: 'reservation' };
    if (lower.includes('travel')) return { Icon: Plane, variant: 'travel' };
    if (lower.includes('claim') || lower.includes('cash') || lower.includes('advance'))
        return { Icon: Banknote, variant: 'claim' };
    return { Icon: FileText, variant: 'default' };
}

export default function RequestListPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeStatus, setActiveStatus] = useState<RequestStatus>(RequestStatus.All);

    const { data: requests = [], isLoading } = useQuery<RequestModel[]>({
        queryKey: ['requests', activeStatus],
        queryFn: async () => {
            const body: Record<string, unknown> = {};
            if (activeStatus !== RequestStatus.All) {
                body.requeststatus = activeStatus;
            }
            const res = await apiClient.post(GET_REQUEST_LIST, body);
            return res.data?.datalist || [];
        },
    });

    return (
        <div>
            {/* ── Page Header ── */}
            <div className="page-header">
                <div className="page-header__row">
                    <div>
                        <h1 className="page-header__title">{t('request.title')}</h1>
                        <p className="page-header__subtitle">
                            {requests.length} {requests.length === 1 ? 'request' : 'requests'}
                        </p>
                    </div>
                    <Button onClick={() => navigate('/requests/new')}>
                        <Plus size={16} />
                        {t('request.newRequest')}
                    </Button>
                </div>
            </div>

            {/* ── Status Tabs ── */}
            <div className="status-tabs">
                {statusTabs.map(({ key, label }) => (
                    <button
                        key={key}
                        className={`status-tabs__btn ${activeStatus === key ? 'status-tabs__btn--active' : ''}`}
                        onClick={() => setActiveStatus(key)}
                    >
                        {t(label)}
                    </button>
                ))}
            </div>

            {/* ── Request List ── */}
            {isLoading ? (
                <div className="empty-state">
                    <p className="empty-state__desc">{t('common.loading')}</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="empty-state">
                    <ClipboardList size={64} className="empty-state__icon" />
                    <h3 className="empty-state__title">{t('request.noRequests')}</h3>
                    <p className="empty-state__desc">
                        Submit your first HR request to get started.
                    </p>
                    <Button onClick={() => navigate('/requests/new')}>
                        <Plus size={16} />
                        {t('request.newRequest')}
                    </Button>
                </div>
            ) : (
                <div className="request-list">
                    {requests.map((req, i) => {
                        const { Icon, variant } = getRequestIcon(req.requesttypedesc);
                        return (
                            <div
                                key={req.syskey || i}
                                className="request-card"
                                style={{ animationDelay: `${i * 40}ms` }}
                                onClick={() => navigate(`/requests/${req.syskey}`)}
                            >
                                <div className={`request-card__icon request-card__icon--${variant}`}>
                                    <Icon size={22} />
                                </div>
                                <div className="request-card__body">
                                    <div className="request-card__title">
                                        {req.requesttypedesc || req.requesttype}
                                        {req.requestsubtypedesc ? ` — ${req.requestsubtypedesc}` : ''}
                                    </div>
                                    <div className="request-card__meta">
                                        <span>{req.startdate || req.date}{req.enddate && req.enddate !== req.startdate ? ` → ${req.enddate}` : ''}</span>
                                        {req.duration && (
                                            <>
                                                <span className="request-card__meta-sep">·</span>
                                                <span>{req.duration}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="request-card__right">
                                    <StatusBadge status={req.requeststatus} />
                                    {req.refno > 0 && (
                                        <span className="request-card__ref">#{req.refno}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
