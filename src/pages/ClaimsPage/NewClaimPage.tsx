import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { Textarea } from '../../components/ui/Input/Input';
import Select from '../../components/ui/Select/Select';
import FileUpload from '../../components/ui/FileUpload/FileUpload';
import MemberPicker from '../../components/shared/MemberPicker/MemberPicker';
import type { MemberItem } from '../../components/shared/MemberPicker/MemberPicker';
import type { TypesModel } from '../../types/models';
import apiClient from '../../lib/api-client';
import { SAVE_CLAIM, CLAIM_TYPES, CURRENCY_TYPES } from '../../config/api-routes';
import styles from './ClaimsPage.module.css';

export default function NewClaimPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [claimType, setClaimType] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('');
    const [fromPlace, setFromPlace] = useState('');
    const [toPlace, setToPlace] = useState('');
    const [date, setDate] = useState('');
    const [remark, setRemark] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [approvers, setApprovers] = useState<MemberItem[]>([]);

    // ── Lookups ──
    const { data: claimTypes = [] } = useQuery<TypesModel[]>({
        queryKey: ['claimTypes'],
        queryFn: async () => {
            const res = await apiClient.post(CLAIM_TYPES, {});
            return res.data?.datalist || [];
        },
    });

    const { data: currencies = [] } = useQuery<TypesModel[]>({
        queryKey: ['currencyTypes'],
        queryFn: async () => {
            const res = await apiClient.post(CURRENCY_TYPES, {});
            return res.data?.datalist || [];
        },
    });

    // ── Submit ──
    const submitMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                claimtype: claimType,
                amount: Number(amount) || 0,
                currencytype: currency,
                fromPlace,
                toPlace,
                date,
                remark,
                selectedApprovers: approvers.map((a) => ({ syskey: a.syskey, name: a.name })),
            };
            const res = await apiClient.post(SAVE_CLAIM, payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Claim submitted successfully');
            navigate('/claims');
        },
        onError: () => toast.error(t('common.error')),
    });

    const handleSubmit = () => {
        if (!claimType) { toast.error('Please select a claim type'); return; }
        if (!amount) { toast.error('Please enter an amount'); return; }
        submitMutation.mutate();
    };

    return (
        <div className={styles['new-claim']}>
            <button className={styles['new-claim__back']} onClick={() => navigate('/claims')}>
                <ArrowLeft size={16} />
                {t('common.back')}
            </button>

            <div className={styles['new-claim__card']}>
                <div className={styles['new-claim__header']}>
                    <h2 className={styles['new-claim__title']}>{t('claim.newClaim')}</h2>
                </div>

                <div className={styles['new-claim__body']}>
                    {/* Row 1: Claim Type + Currency */}
                    <div className={styles['new-claim__grid']}>
                        <Select
                            id="claimType"
                            label={t('claim.claimType')}
                            value={claimType}
                            onChange={(e) => setClaimType(e.target.value)}
                            required
                            options={claimTypes.map((ct) => ({ value: ct.syskey, label: ct.description }))}
                        />
                        <Select
                            id="currency"
                            label={t('claim.currency')}
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            options={currencies.map((c) => ({ value: c.syskey, label: c.description }))}
                        />
                    </div>

                    {/* Row 2: Amount + Date */}
                    <div className={styles['new-claim__grid']} style={{ marginTop: 'var(--space-4)' }}>
                        <Input
                            id="amount"
                            label={t('claim.amount')}
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            placeholder="0.00"
                        />
                        <Input
                            id="date"
                            label={t('common.date')}
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {/* Row 3: From / To */}
                    <div className={styles['new-claim__grid']} style={{ marginTop: 'var(--space-4)' }}>
                        <Input
                            id="fromPlace"
                            label={t('claim.from')}
                            value={fromPlace}
                            onChange={(e) => setFromPlace(e.target.value)}
                            placeholder="Origin"
                        />
                        <Input
                            id="toPlace"
                            label={t('claim.to')}
                            value={toPlace}
                            onChange={(e) => setToPlace(e.target.value)}
                            placeholder="Destination"
                        />
                    </div>

                    <div className={styles['new-claim__row']}>
                        <Textarea
                            id="remark"
                            label={t('request.remark')}
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="Add details about this expense..."
                            rows={3}
                        />

                        <FileUpload
                            label={t('request.attachments')}
                            files={files}
                            onChange={setFiles}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />

                        <MemberPicker
                            label={t('request.selectApprover')}
                            members={approvers}
                            onChange={setApprovers}
                            required
                        />
                    </div>
                </div>

                <div className={styles['new-claim__footer']}>
                    <Button onClick={handleSubmit} loading={submitMutation.isPending}>
                        {t('request.submit')}
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/claims')}>
                        {t('common.cancel')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
