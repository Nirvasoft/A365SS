/* ═══════════════════════════════════════════════════════════
   Main API Client — Axios instance for A365 main service
   Base URL: https://a365.omnicloudapi.com
   Used for: Teams, Attendance, Check-in, etc.
   ═══════════════════════════════════════════════════════════ */

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { appConfig } from '../config/app-config';
import { useAuthStore } from '../stores/auth-store';

const mainClient = axios.create({
    baseURL: appConfig.mainUrl,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request Interceptor ──
mainClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const { token, userId, domain } = useAuthStore.getState();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Inject userid & domain into POST body (same as Flutter ApiClient.post)
        if (config.method === 'post') {
            let body: Record<string, unknown> = {};

            if (config.data) {
                body = typeof config.data === 'string'
                    ? JSON.parse(config.data)
                    : config.data;
            }

            if (!body.userid && userId) body.userid = userId;
            if (!body.domain && domain) body.domain = domain;

            config.data = body;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default mainClient;
