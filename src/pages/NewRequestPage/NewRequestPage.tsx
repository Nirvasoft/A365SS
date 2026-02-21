import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
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
} from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { Textarea } from '../../components/ui/Input/Input';
import Select from '../../components/ui/Select/Select';
import FileUpload from '../../components/ui/FileUpload/FileUpload';
import MemberPicker from '../../components/shared/MemberPicker/MemberPicker';
import type { MemberItem } from '../../components/shared/MemberPicker/MemberPicker';
import type { TypesModel } from '../../types/models';
import apiClient from '../../lib/api-client';
import {
    REQUEST_TYPES,
    SAVE_REQUEST,
    TRANSPORTATION_TYPES,
    CARS_LIST,
    DRIVERS_LIST,
    RESERVATION_TYPES,
    ROOM_TYPES,
    PRODUCT_LIST,
    PROJECT_LIST,
    TRAVEL_TYPE_LIST,
    VEHICLE_USE_LIST,
} from '../../config/api-routes';
import styles from './NewRequestPage.module.css';

/* ══════════════════════════════════════════════════════════════
   Request Type Definitions
   ══════════════════════════════════════════════════════════════ */

interface RequestTypeConfig {
    key: string;
    label: string;
    icon: React.FC<{ size?: number }>;
    color: string;
    bgColor: string;
}

const REQUEST_TYPE_CONFIGS: RequestTypeConfig[] = [
    { key: 'leave', label: 'Leave', icon: Palmtree, color: '#16a34a', bgColor: '#f0fdf4' },
    { key: 'overtime', label: 'Overtime', icon: Clock, color: '#d97706', bgColor: '#fef3c7' },
    { key: 'wfh', label: 'Work from Home', icon: Home, color: '#2563eb', bgColor: '#eff6ff' },
    { key: 'transportation', label: 'Transportation', icon: Car, color: '#9333ea', bgColor: '#faf5ff' },
    { key: 'reservation', label: 'Reservation', icon: Calendar, color: '#0891b2', bgColor: '#ecfeff' },
    { key: 'travel', label: 'Travel', icon: Plane, color: '#ea580c', bgColor: '#fff7ed' },
    { key: 'cashadvance', label: 'Cash Advance', icon: Banknote, color: '#dc2626', bgColor: '#fef2f2' },
    { key: 'other', label: 'Other', icon: FileText, color: '#64748b', bgColor: '#f1f5f9' },
];

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

export default function NewRequestPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const presetType = searchParams.get('type') || '';

    // ── Request type / subtype ──
    const [selectedType, setSelectedType] = useState(presetType);
    const [subType, setSubType] = useState('');

    // ── Core fields ──
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [remark, setRemark] = useState('');

    // ── Transportation-specific ──
    const [pickupPlace, setPickupPlace] = useState('');
    const [dropoffPlace, setDropoffPlace] = useState('');
    const [isGoing, setIsGoing] = useState(true);
    const [isReturn, setIsReturn] = useState(false);
    const [userLeaveTime, setUserLeaveTime] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [returnTime, setReturnTime] = useState('');
    const [car, setCar] = useState('');
    const [driver, setDriver] = useState('');

    // ── Reservation-specific ──
    const [room, setRoom] = useState('');
    const [maxPeople, setMaxPeople] = useState('');

    // ── Travel-specific ──
    const [fromPlace, setFromPlace] = useState('');
    const [toPlace, setToPlace] = useState('');
    const [modeOfTravel, setModeOfTravel] = useState('');
    const [vehicleUse, setVehicleUse] = useState('');
    const [product, setProduct] = useState('');
    const [project, setProject] = useState('');
    const [estimatedBudget, setEstimatedBudget] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');

    // ── Overtime-specific ──
    const [otDay, setOtDay] = useState('');
    const [hour, setHour] = useState('');

    // ── Cash Advance-specific ──
    const [amount, setAmount] = useState('');
    const [currencyType, setCurrencyType] = useState('');

    // ── Location (WFH) ──
    const [locationName, setLocationName] = useState('');

    // ── Shared ──
    const [approvers, setApprovers] = useState<MemberItem[]>([]);
    const [accompanyPersons, setAccompanyPersons] = useState<MemberItem[]>([]);
    const [handovers, setHandovers] = useState<MemberItem[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    // ── API Queries for lookups ──
    const { data: requestTypes = [] } = useQuery<TypesModel[]>({
        queryKey: ['requestTypes'],
        queryFn: async () => {
            const res = await apiClient.post(REQUEST_TYPES, {});
            return res.data?.datalist || [];
        },
    });

    const { data: transportTypes = [] } = useQuery<TypesModel[]>({
        queryKey: ['transportTypes'],
        queryFn: async () => {
            const res = await apiClient.post(TRANSPORTATION_TYPES, {});
            return res.data?.datalist || [];
        },
        enabled: selectedType === 'transportation',
    });

    const { data: carsList = [] } = useQuery<TypesModel[]>({
        queryKey: ['carsList'],
        queryFn: async () => {
            const res = await apiClient.post(CARS_LIST, {});
            return res.data?.datalist || [];
        },
        enabled: selectedType === 'transportation',
    });

    const { data: driversList = [] } = useQuery<TypesModel[]>({
        queryKey: ['driversList'],
        queryFn: async () => {
            const res = await apiClient.post(DRIVERS_LIST, {});
            return res.data?.datalist || [];
        },
        enabled: selectedType === 'transportation',
    });

    const { data: reservationTypes = [] } = useQuery<TypesModel[]>({
        queryKey: ['reservationTypes'],
        queryFn: async () => {
            const res = await apiClient.post(RESERVATION_TYPES, {});
            return res.data?.datalist || [];
        },
        enabled: selectedType === 'reservation',
    });

    const { data: roomTypes = [] } = useQuery<TypesModel[]>({
        queryKey: ['roomTypes'],
        queryFn: async () => {
            const res = await apiClient.post(ROOM_TYPES, {});
            return res.data?.datalist || [];
        },
        enabled: selectedType === 'reservation',
    });

    const { data: productList = [] } = useQuery<TypesModel[]>({
        queryKey: ['productList'],
        queryFn: async () => {
            const res = await apiClient.post(PRODUCT_LIST, {});
            return res.data?.datalist || [];
        },
        enabled: selectedType === 'travel',
    });

    const { data: projectList = [] } = useQuery<TypesModel[]>({
        queryKey: ['projectList'],
        queryFn: async () => {
            const res = await apiClient.post(PROJECT_LIST, {});
            return res.data?.datalist || [];
        },
        enabled: selectedType === 'travel',
    });

    const { data: travelTypes = [] } = useQuery<TypesModel[]>({
        queryKey: ['modeOfTravel'],
        queryFn: async () => {
            const res = await apiClient.post(TRAVEL_TYPE_LIST, {});
            return res.data?.datalist || [];
        },
        enabled: selectedType === 'travel',
    });

    const { data: vehicleUseList = [] } = useQuery<TypesModel[]>({
        queryKey: ['vehicleUseList'],
        queryFn: async () => {
            const res = await apiClient.post(VEHICLE_USE_LIST, {});
            return res.data?.datalist || [];
        },
        enabled: selectedType === 'travel',
    });

    // Reset sub-fields when type changes
    useEffect(() => {
        setSubType('');
    }, [selectedType]);

    // ── Submit mutation ──
    const submitMutation = useMutation({
        mutationFn: async () => {
            // Build payload based on selected type
            const payload: Record<string, unknown> = {
                requesttype: selectedType,
                requestsubtype: subType,
                startdate: startDate,
                enddate: endDate || startDate,
                starttime: startTime,
                endtime: endTime,
                remark,
                selectedApprovers: approvers.map((a) => ({ syskey: a.syskey, name: a.name })),
            };

            // Type-specific fields
            if (selectedType === 'leave') {
                payload.selectedHandovers = handovers.map((h) => ({ syskey: h.syskey, name: h.name }));
            }

            if (selectedType === 'transportation') {
                Object.assign(payload, {
                    pickupplace: pickupPlace,
                    dropoffplace: dropoffPlace,
                    isgoing: isGoing,
                    isreturn: isReturn,
                    userleavetime: userLeaveTime,
                    arrivaltime: arrivalTime,
                    returntime: returnTime,
                    car,
                    driver,
                });
            }

            if (selectedType === 'reservation') {
                Object.assign(payload, {
                    rooms: room,
                    maxpeople: Number(maxPeople) || 0,
                    selectedMembers: accompanyPersons.map((p) => ({ syskey: p.syskey, name: p.name })),
                });
            }

            if (selectedType === 'travel') {
                Object.assign(payload, {
                    fromplace: fromPlace,
                    toplace: toPlace,
                    departuredate: departureDate,
                    arrivaldate: arrivalDate,
                    modeoftravel: modeOfTravel ? [modeOfTravel] : [],
                    vehicleuse: vehicleUse ? [vehicleUse] : [],
                    product,
                    project,
                    estimatedbudget: Number(estimatedBudget) || 0,
                    selectedAcconpanyPersons: accompanyPersons.map((p) => ({ syskey: p.syskey, name: p.name })),
                });
            }

            if (selectedType === 'overtime') {
                payload.otday = otDay;
                payload.hour = hour;
            }

            if (selectedType === 'wfh') {
                payload.locationname = locationName;
            }

            if (selectedType === 'cashadvance') {
                payload.amount = Number(amount) || 0;
                payload.currencytype = currencyType;
            }

            const res = await apiClient.post(SAVE_REQUEST, payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success(t('request.submitSuccess'));
            navigate('/requests');
        },
        onError: () => {
            toast.error(t('common.error'));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType) {
            toast.error('Please select a request type');
            return;
        }
        submitMutation.mutate();
    };

    /* ═══════════════════════════════ Render ═════════════════════════ */

    return (
        <div className={styles['new-request']}>
            <button className={styles['new-request__back']} onClick={() => navigate(presetType === 'reservation' ? '/reservations' : '/requests')}>
                <ArrowLeft size={16} />
                {t('common.back')}
            </button>

            <div className="page-header">
                <h1 className="page-header__title">{presetType === 'reservation' ? 'New Reservation' : t('request.newRequest')}</h1>
                <p className="page-header__subtitle">
                    {presetType ? 'Fill in the details below' : 'Select a type and fill in the details below'}
                </p>
            </div>

            <form className={styles['new-request__card']} onSubmit={handleSubmit}>
                {/* ═════ 1. Request Type Selector (hidden when pre-selected) ═════ */}
                {!presetType && (
                    <div className={styles['new-request__section']}>
                        <h3 className={styles['new-request__section-title']}>Request Type</h3>
                        <div className={styles['new-request__type-grid']}>
                            {REQUEST_TYPE_CONFIGS.map(({ key, label, icon: Icon, color, bgColor }) => (
                                <div
                                    key={key}
                                    className={`${styles['new-request__type-card']} ${selectedType === key ? styles['new-request__type-card--active'] : ''}`}
                                    onClick={() => setSelectedType(key)}
                                >
                                    <div
                                        className={styles['new-request__type-card-icon']}
                                        style={{ background: bgColor, color }}
                                    >
                                        <Icon size={22} />
                                    </div>
                                    <span className={styles['new-request__type-card-label']}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedType && (
                    <>
                        {/* ═════ 2. Sub-type selector (if API has types) ═════ */}
                        {requestTypes.length > 0 && (
                            <div className={styles['new-request__section']}>
                                <div className={styles['new-request__grid']}>
                                    <Select
                                        id="subType"
                                        label="Sub-type"
                                        placeholder="Select sub-type…"
                                        value={subType}
                                        onChange={(e) => setSubType(e.target.value)}
                                        options={requestTypes.map((t) => ({ value: t.syskey, label: t.description }))}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ═════ 3. Date & Time (common) ═════ */}
                        <div className={styles['new-request__section']}>
                            <h3 className={styles['new-request__section-title']}>Date & Time</h3>
                            <div className={styles['new-request__grid']}>
                                {selectedType === 'travel' ? (
                                    <>
                                        <Input id="departureDate" label="Departure Date" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} required />
                                        <Input id="arrivalDate" label="Arrival Date" type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} required />
                                    </>
                                ) : selectedType === 'overtime' ? (
                                    <>
                                        <Input id="otDay" label="OT Day" type="date" value={otDay} onChange={(e) => setOtDay(e.target.value)} required />
                                        <Input id="hour" label="Hours" type="number" value={hour} onChange={(e) => setHour(e.target.value)} placeholder="e.g. 2" required />
                                    </>
                                ) : (
                                    <>
                                        <Input id="startDate" label={t('request.startDate')} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                                        <Input id="endDate" label={t('request.endDate')} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                        <Input id="startTime" label={t('request.startTime')} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                        <Input id="endTime" label={t('request.endTime')} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ═════ 4. Type-specific fields ═════ */}

                        {/* ── Transportation ── */}
                        {selectedType === 'transportation' && (
                            <div className={styles['new-request__section']}>
                                <h3 className={styles['new-request__section-title']}>Transportation Details</h3>
                                <div className={styles['new-request__grid']}>
                                    {transportTypes.length > 0 && (
                                        <Select
                                            id="transportSubType"
                                            label="Transport Type"
                                            value={subType}
                                            onChange={(e) => setSubType(e.target.value)}
                                            options={transportTypes.map((t) => ({ value: t.syskey, label: t.description }))}
                                            placeholder="Select…"
                                        />
                                    )}
                                    <Input id="pickup" label="Pick-up Place" value={pickupPlace} onChange={(e) => setPickupPlace(e.target.value)} placeholder="Building / Location" />
                                    <Input id="dropoff" label="Drop-off Place" value={dropoffPlace} onChange={(e) => setDropoffPlace(e.target.value)} placeholder="Destination" />
                                    <Input id="leaveTime" label="Leave Time" type="time" value={userLeaveTime} onChange={(e) => setUserLeaveTime(e.target.value)} />
                                    <Input id="arrivalTimeInput" label="Arrival Time" type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />

                                    <div className={`${styles['new-request__full']} ${styles['new-request__grid']}`} style={{ gap: 'var(--space-4)' }}>
                                        <label className={styles['new-request__checkbox-row']}>
                                            <input type="checkbox" checked={isGoing} onChange={(e) => setIsGoing(e.target.checked)} /> Going
                                        </label>
                                        <label className={styles['new-request__checkbox-row']}>
                                            <input type="checkbox" checked={isReturn} onChange={(e) => setIsReturn(e.target.checked)} /> Return trip
                                        </label>
                                    </div>

                                    {isReturn && (
                                        <Input id="returnTimeInput" label="Return Time" type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
                                    )}

                                    {carsList.length > 0 && (
                                        <Select id="car" label="Car" value={car} onChange={(e) => setCar(e.target.value)} options={carsList.map((c) => ({ value: c.syskey, label: c.description }))} placeholder="Select car…" />
                                    )}
                                    {driversList.length > 0 && (
                                        <Select id="driver" label="Driver" value={driver} onChange={(e) => setDriver(e.target.value)} options={driversList.map((d) => ({ value: d.syskey, label: d.description }))} placeholder="Select driver…" />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Reservation ── */}
                        {selectedType === 'reservation' && (
                            <div className={styles['new-request__section']}>
                                <h3 className={styles['new-request__section-title']}>Reservation Details</h3>
                                <div className={styles['new-request__grid']}>
                                    {reservationTypes.length > 0 && (
                                        <Select id="reservationType" label="Reservation Type" value={subType} onChange={(e) => setSubType(e.target.value)} options={reservationTypes.map((r) => ({ value: r.syskey, label: r.description }))} placeholder="Select type…" />
                                    )}
                                    {roomTypes.length > 0 && (
                                        <Select id="room" label="Room" value={room} onChange={(e) => setRoom(e.target.value)} options={roomTypes.map((r) => ({ value: r.syskey, label: r.description }))} placeholder="Select room…" />
                                    )}
                                    <Input id="maxPeople" label="Max People" type="number" value={maxPeople} onChange={(e) => setMaxPeople(e.target.value)} placeholder="e.g. 10" />
                                </div>
                                <div style={{ marginTop: 'var(--space-4)' }}>
                                    <MemberPicker label="Meeting Participants" members={accompanyPersons} onChange={setAccompanyPersons} />
                                </div>
                            </div>
                        )}

                        {/* ── Travel ── */}
                        {selectedType === 'travel' && (
                            <div className={styles['new-request__section']}>
                                <h3 className={styles['new-request__section-title']}>Travel Details</h3>
                                <div className={styles['new-request__grid']}>
                                    <Input id="fromPlace" label="From" value={fromPlace} onChange={(e) => setFromPlace(e.target.value)} placeholder="Origin" required />
                                    <Input id="toPlace" label="To" value={toPlace} onChange={(e) => setToPlace(e.target.value)} placeholder="Destination" required />
                                    {travelTypes.length > 0 && (
                                        <Select id="modeOfTravel" label="Mode of Travel" value={modeOfTravel} onChange={(e) => setModeOfTravel(e.target.value)} options={travelTypes.map((t) => ({ value: t.syskey, label: t.description }))} placeholder="Select…" />
                                    )}
                                    {vehicleUseList.length > 0 && (
                                        <Select id="vehicleUse" label="Vehicle Use" value={vehicleUse} onChange={(e) => setVehicleUse(e.target.value)} options={vehicleUseList.map((v) => ({ value: v.syskey, label: v.description }))} placeholder="Select…" />
                                    )}
                                    {productList.length > 0 && (
                                        <Select id="product" label="Product" value={product} onChange={(e) => setProduct(e.target.value)} options={productList.map((p) => ({ value: p.syskey, label: p.description }))} placeholder="Select…" />
                                    )}
                                    {projectList.length > 0 && (
                                        <Select id="project" label="Project" value={project} onChange={(e) => setProject(e.target.value)} options={projectList.map((p) => ({ value: p.syskey, label: p.description }))} placeholder="Select…" />
                                    )}
                                    <Input id="budget" label="Estimated Budget" type="number" value={estimatedBudget} onChange={(e) => setEstimatedBudget(e.target.value)} placeholder="0.00" />
                                </div>
                                <div style={{ marginTop: 'var(--space-4)' }}>
                                    <MemberPicker label="Accompanying Persons" members={accompanyPersons} onChange={setAccompanyPersons} />
                                </div>
                            </div>
                        )}

                        {/* ── WFH ── */}
                        {selectedType === 'wfh' && (
                            <div className={styles['new-request__section']}>
                                <h3 className={styles['new-request__section-title']}>Work From Home</h3>
                                <div className={styles['new-request__grid']}>
                                    <div className={styles['new-request__full']}>
                                        <Input id="locationName" label="Location" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Where you'll be working from" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Cash Advance ── */}
                        {selectedType === 'cashadvance' && (
                            <div className={styles['new-request__section']}>
                                <h3 className={styles['new-request__section-title']}>Cash Advance</h3>
                                <div className={styles['new-request__grid']}>
                                    <Input id="amount" label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                                    <Input id="currency" label="Currency" value={currencyType} onChange={(e) => setCurrencyType(e.target.value)} placeholder="e.g. MMK, USD" />
                                </div>
                            </div>
                        )}

                        {/* ═════ 5. Remarks ═════ */}
                        <div className={styles['new-request__section']}>
                            <h3 className={styles['new-request__section-title']}>Additional Info</h3>
                            <Textarea
                                id="remark"
                                label={t('request.remark')}
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="Any additional notes or comments…"
                            />
                        </div>

                        {/* ═════ 6. Attachments (hidden for reservations) ═════ */}
                        {selectedType !== 'reservation' && (
                            <div className={styles['new-request__section']}>
                                <FileUpload
                                    label="Attachments"
                                    files={files}
                                    onChange={setFiles}
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                />
                            </div>
                        )}

                        {/* ═════ 7. Approvers ═════ */}
                        <div className={styles['new-request__section']}>
                            <MemberPicker
                                label="Approvers"
                                members={approvers}
                                onChange={setApprovers}
                                required
                            />
                        </div>

                        {/* ── Leave-specific handover ── */}
                        {selectedType === 'leave' && (
                            <div className={styles['new-request__section']}>
                                <MemberPicker
                                    label="Handover Persons"
                                    members={handovers}
                                    onChange={setHandovers}
                                />
                            </div>
                        )}

                        {/* ═════ 8. Submit ═════ */}
                        <div className={styles['new-request__footer']}>
                            <Button type="button" variant="secondary" onClick={() => navigate(presetType === 'reservation' ? '/reservations' : '/requests')}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" loading={submitMutation.isPending}>
                                {t('request.submit')}
                            </Button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
