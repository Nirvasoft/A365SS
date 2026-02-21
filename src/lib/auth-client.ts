/* ═══════════════════════════════════════════════════════════
   Auth Client — Axios instance for IAM auth endpoints
   Base URL: https://iam.omnicloudapi.com/api/auth
   ═══════════════════════════════════════════════════════════ */

import axios from 'axios';
import { appConfig } from '../config/app-config';

/** Dedicated client for IAM auth calls (login, OTP, domain list) */
const authClient = axios.create({
    baseURL: appConfig.authUrl,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/** Dedicated client for IAM non-auth calls (e.g. domain list) */
export const iamClient = axios.create({
    baseURL: appConfig.iamUrl,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default authClient;
