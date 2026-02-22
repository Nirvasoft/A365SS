import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Hash } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../stores/auth-store';
import authClient from '../../lib/auth-client';
import { makeSignInPayload, APP_ID } from '../../lib/auth-token';
import styles from './LoginPage.module.css';

type AuthMode = 'password' | 'otp';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login, setUser } = useAuthStore();

    const [mode, setMode] = useState<AuthMode>('otp');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpSession, setOtpSession] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /* ══════════════════════════════════════════════════════════════
       Complete login flow — matches Flutter's signin_otp.dart:
       1. Sign-in → access_token, user_id, usersyskey, role
       2. /domain → domain list → pick first
       3. /get-menu → final access_token + refresh_token for HXM
       ══════════════════════════════════════════════════════════════ */
    const completeLogin = async (signInData: Record<string, any>) => {
        const nested = signInData.data as Record<string, any> | undefined;
        const iamToken = (nested?.access_token || signInData.token) as string;
        const userId = (nested?.user_id || email) as string;
        const usersyskey = (nested?.usersyskey || '') as string;
        const role = String(nested?.role || '');

        // ──────── Step 2: Fetch domain list ────────
        let domainId = '';
        let domainName = '';
        try {
            const domRes = await authClient.post('/domain',
                { user_id: userId, app_id: APP_ID },
                { headers: { Authorization: `Bearer ${iamToken}` } },
            );
            const domData = domRes.data;
            // Flutter: List<Map>.from(response['data']['domain'])
            const domainList: any[] =
                domData?.data?.domain ||
                domData?.datalist ||
                domData?.data ||
                [];
            if (Array.isArray(domainList) && domainList.length > 0) {
                domainId = String(domainList[0].id || domainList[0].domaincode || '');
                domainName = String(domainList[0].name || domainList[0].domainname || '');
            }
        } catch (err) {
            console.warn('Domain list fetch failed, proceeding with defaults', err);
        }

        // ──────── Step 3: /get-menu → exchange for final HXM token ────────
        let finalToken = iamToken;
        let finalRefresh = '';
        try {
            const menuRes = await authClient.post('/get-menu', {
                usersyskey,
                role,
                user_id: userId,
                app_id: APP_ID,
                domain: domainId,
                type: userId,
                domain_name: domainName,
            }, {
                headers: { Authorization: `Bearer ${iamToken}` },
            });
            const menuData = menuRes.data;
            // Flutter: response['access_token'], response['refresh_token']
            finalToken = menuData.access_token || menuData.data?.access_token || iamToken;
            finalRefresh = menuData.refresh_token || menuData.data?.refresh_token || '';
        } catch (err) {
            console.warn('get-menu failed, using IAM token directly', err);
        }

        // ──────── Store auth state and navigate ────────
        login({
            token: finalToken,
            refreshToken: finalRefresh || undefined,
            userId,
            domain: domainId,
        });

        // Store extra profile hints for display
        setUser({
            name: domainName ? `${userId}` : userId,
            domainName,
            usersyskey,
            role,
        } as any);

        // Profile fetch (non-blocking, to get full name)
        try {
            const { default: apiClient } = await import('../../lib/api-client');
            const profileRes = await apiClient.get('/api/employees/profile');
            const profile = profileRes.data?.datalist || profileRes.data?.data;
            if (profile) setUser(profile);
        } catch { /* non-blocking */ }

        navigate('/requests');
    };

    /* ════════════════════════════════════════════════════
       Password Login → /signin  req_type = 1
       ════════════════════════════════════════════════════ */
    const handlePasswordLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Flutter base64-encodes the password before sending
            const b64Password = btoa(password);
            const payload = await makeSignInPayload(email, 1, b64Password);
            const res = await authClient.post('/signin', payload);
            const data = res.data;

            if (data.status === 200 || res.status === 200) {
                await completeLogin(data);
            } else {
                setError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    /* ════════════════════════════════════════════════════
       OTP Request → /signin  req_type = 2
       ════════════════════════════════════════════════════ */
    const handleRequestOtp = async () => {
        setError('');
        setLoading(true);
        try {
            const payload = await makeSignInPayload(email, 2);
            const res = await authClient.post('/signin', payload);
            const data = res.data;

            if (data.status === 200 || res.status === 200) {
                // Flutter: response['data']['session_id']
                setOtpSession(data.data?.session_id || data.session_id || data.session || '');
                setOtpSent(true);
            } else {
                setError(data.message || 'Failed to send OTP.');
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    /* ════════════════════════════════════════════════════
       OTP Verify → /verify-otp
       ════════════════════════════════════════════════════ */
    const handleOtpLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Flutter: OtpVerifyReq { user_id, otp, session, app_id, sid }
            const res = await authClient.post('/verify-otp', {
                user_id: email,
                otp,
                session: otpSession,
                app_id: APP_ID,
                sid: '999',  // from a365.json S_Id
            });
            const data = res.data;

            if (data.status === 200 || res.status === 200) {
                await completeLogin(data);
            } else {
                setError(data.message || 'OTP verification failed.');
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'OTP verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.login}>
            {/* ── Hero Panel ── */}
            <div className={styles.login__hero}>
                <div className={styles['login__hero-content']}>
                    <div className={styles['login__hero-logo']}>A</div>
                    <h1 className={styles['login__hero-title']}>HR Self-Service Portal</h1>
                    <p className={styles['login__hero-subtitle']}>
                        Submit requests, manage approvals, and track your HR activities — all in one place.
                    </p>
                </div>
            </div>

            {/* ── Form Panel ── */}
            <div className={styles['login__form-panel']}>
                <div className={styles['login__form-container']}>
                    <div className={styles['login__form-header']}>
                        <h2 className={styles['login__form-title']}>{t('auth.signIn')}</h2>
                        <p className={styles['login__form-desc']}>{t('auth.loginSubtitle')}</p>
                    </div>

                    {/* Auth Mode Tabs */}
                    <div className={styles.login__tabs}>
                        <button
                            className={`${styles.login__tab} ${mode === 'otp' ? styles['login__tab--active'] : ''}`}
                            onClick={() => { setMode('otp'); setError(''); }}
                        >
                            {t('auth.otp')}
                        </button>
                        <button
                            className={`${styles.login__tab} ${mode === 'password' ? styles['login__tab--active'] : ''}`}
                            onClick={() => { setMode('password'); setOtpSent(false); setError(''); }}
                        >
                            {t('auth.password')}
                        </button>
                    </div>

                    {error && <div className={styles.login__error}>{error}</div>}

                    {mode === 'password' ? (
                        <form className={styles.login__form} onSubmit={handlePasswordLogin}>
                            <Input
                                id="email"
                                label={t('auth.email')}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@company.com"
                                icon={<Mail size={18} />}
                                required
                            />
                            <Input
                                id="password"
                                label={t('auth.password')}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                icon={<Lock size={18} />}
                                required
                            />
                            <Button type="submit" fullWidth loading={loading}>
                                {t('auth.signIn')}
                            </Button>
                        </form>
                    ) : (
                        <form className={styles.login__form} onSubmit={handleOtpLogin}>
                            <Input
                                id="otp-email"
                                label={t('auth.email')}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@company.com"
                                icon={<Mail size={18} />}
                                required
                            />
                            {!otpSent ? (
                                <Button type="button" fullWidth loading={loading} onClick={handleRequestOtp}>
                                    {t('auth.requestOtp')}
                                </Button>
                            ) : (
                                <>
                                    <div className={styles['login__otp-row']}>
                                        <Input
                                            id="otp-code"
                                            label={t('auth.otp')}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="Enter 6‑digit code"
                                            icon={<Hash size={18} />}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" fullWidth loading={loading}>
                                        {t('auth.verifyOtp')}
                                    </Button>
                                    <Button type="button" variant="ghost" fullWidth onClick={() => { setOtpSent(false); handleRequestOtp(); }}>
                                        Resend OTP
                                    </Button>
                                </>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
