import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Plus, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge/Badge';
import { RequestStatus } from '../../types/models';
import type { RequestModel } from '../../types/models';
import apiClient from '../../lib/api-client';
import { APPROVAL_LIST } from '../../config/api-routes';
import '../../styles/pages.css';

const statusTabs = [
    { key: RequestStatus.All, label: 'status.all' },
    { key: RequestStatus.Pending, label: 'status.pending' },
    { key: RequestStatus.Approved, label: 'status.approved' },
    { key: RequestStatus.Rejected, label: 'status.rejected' },
];

/* ── Date helpers ── */
function formatYYYYMMDD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
}

/** Convert "yyyymmdd" → "dd/mm/yyyy" for display */
function displayDate(raw?: string): string {
    if (!raw || raw.length < 8) return raw || '';
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
}

/** Convert "yyyymmdd" → "yyyy-mm-dd" for date input value */
function toInputDate(yyyymmdd: string): string {
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

/** Convert "yyyy-mm-dd" → "yyyymmdd" for API */
function fromInputDate(inputVal: string): string {
    return inputVal.replace(/-/g, '');
}

function defaultFromDate(): string {
    const now = new Date();
    return formatYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1));
}

function defaultToDate(): string {
    const now = new Date();
    // Last day of current month
    return formatYYYYMMDD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

export default function ApprovalListPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeStatus, setActiveStatus] = useState<RequestStatus>(RequestStatus.Pending);
    const [showFilter, setShowFilter] = useState(false);
    const [fromDate, setFromDate] = useState(defaultFromDate);
    const [toDate, setToDate] = useState(defaultToDate);

    const { data: approvals = [], isLoading } = useQuery<RequestModel[]>({
        queryKey: ['approvals', activeStatus, fromDate, toDate],
        queryFn: async () => {
            // Pass the actual status code to the API for each tab.
            // The backend filters server-side: '1'=Pending, '2'=Approved,
            // '3'=Rejected, '4'=All.
            const body: Record<string, unknown> = {
                fromdate: fromDate,
                todate: toDate,
                type: '',
                status: activeStatus,
            };
            const res = await apiClient.post(APPROVAL_LIST, body);
            return res.data?.datalist || [];
        },
    });

    return (
        <div>
            <div className="page-header">
                <div className="page-header__row">
                    <div>
                        <h1 className="page-header__title">{t('approval.title')}</h1>
                        <p className="page-header__subtitle">
                            {approvals.length} {approvals.length === 1 ? 'approval' : 'approvals'}
                        </p>
                    </div>
                    <button
                        className="filter-toggle-btn"
                        onClick={() => setShowFilter(!showFilter)}
                        title="Filter by date"
                    >
                        <Filter size={18} />
                        <span>Filter</span>
                        {showFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {showFilter && (
                <div className="date-filter-panel">
                    <div className="date-filter-row">
                        <div className="date-filter-field">
                            <label className="date-filter-label">Start Date</label>
                            <input
                                type="date"
                                className="date-filter-input"
                                value={toInputDate(fromDate)}
                                onChange={(e) => {
                                    if (e.target.value) setFromDate(fromInputDate(e.target.value));
                                }}
                            />
                        </div>
                        <div className="date-filter-field">
                            <label className="date-filter-label">End Date</label>
                            <input
                                type="date"
                                className="date-filter-input"
                                value={toInputDate(toDate)}
                                onChange={(e) => {
                                    if (e.target.value) setToDate(fromInputDate(e.target.value));
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

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

            {isLoading ? (
                <div className="empty-state">
                    <p className="empty-state__desc">{t('common.loading')}</p>
                </div>
            ) : approvals.length === 0 ? (
                <div className="empty-state">
                    <CheckSquare size={64} className="empty-state__icon" />
                    <h3 className="empty-state__title">{t('approval.pendingApprovals')}</h3>
                    <p className="empty-state__desc">
                        No approval requests at this time.
                    </p>
                </div>
            ) : (
                <div className="request-list">
                    {approvals.map((req, i) => (
                        <div
                            key={req.syskey || i}
                            className="request-card"
                            style={{ animationDelay: `${i * 40}ms` }}
                            onClick={() => navigate(`/approvals/${req.syskey}`)}
                        >
                            <div className="request-card__icon request-card__icon--default">
                                <Plus size={22} />
                            </div>
                            <div className="request-card__body">
                                <div className="request-card__title">
                                    {req.name || req.eid} — {req.requesttypedesc}
                                </div>
                                <div className="request-card__meta">
                                    <span>{displayDate(req.startdate || req.date)}</span>
                                </div>
                            </div>
                            <div className="request-card__right">
                                <StatusBadge status={req.requeststatus} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
