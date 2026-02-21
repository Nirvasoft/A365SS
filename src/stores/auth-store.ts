import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authClient from '../lib/auth-client';
import { RENEW_TOKEN } from '../config/api-routes';
import type { UserProfile } from '../types/models';

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    userId: string | null;
    domain: string | null;
    user: UserProfile | null;
    isAuthenticated: boolean;

    // Actions
    login: (data: { token: string; refreshToken?: string; userId: string; domain: string }) => void;
    setUser: (user: UserProfile) => void;
    setDomain: (domain: string) => void;
    renewToken: () => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            refreshToken: null,
            userId: null,
            domain: null,
            user: null,
            isAuthenticated: false,

            login: (data) => {
                set({
                    token: data.token,
                    refreshToken: data.refreshToken || null,
                    userId: data.userId,
                    domain: data.domain,
                    isAuthenticated: true,
                });
            },

            setUser: (user) => set({ user }),

            setDomain: (domain) => set({ domain }),

            renewToken: async () => {
                const { token } = get();
                try {
                    const res = await authClient.post(RENEW_TOKEN, {}, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const newToken = res.data?.token || res.data?.datalist?.token;
                    if (newToken) {
                        set({ token: newToken });
                    }
                } catch {
                    get().logout();
                }
            },

            logout: () => {
                set({
                    token: null,
                    refreshToken: null,
                    userId: null,
                    domain: null,
                    user: null,
                    isAuthenticated: false,
                });
            },
        }),
        {
            name: 'a365-auth',
            partialize: (state) => ({
                token: state.token,
                refreshToken: state.refreshToken,
                userId: state.userId,
                domain: state.domain,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
