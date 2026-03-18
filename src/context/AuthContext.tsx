import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { LoginResponse } from '../utils/interfaces/login.interface';
import { Enviroment } from '../utils/env/enviroment';

interface AuthContextType {
    token: string | null;
    user: LoginResponse | null;
    login: (loginData: LoginResponse) => void;
    logout: () => void;
    refreshAccessToken: () => Promise<string | null>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<LoginResponse | null>(null);
    const tokenRef = useRef<string | null>(null);
    const userRef = useRef<LoginResponse | null>(null);
    const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
    const nativeFetchRef = useRef<typeof window.fetch | null>(null);

    const clearSession = useCallback(() => {
        setToken(null);
        setUser(null);
        tokenRef.current = null;
        userRef.current = null;
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
    }, []);

    const decodeJwtPayload = (jwt: string): Record<string, unknown> | null => {
        try {
            const [, payload] = jwt.split('.');
            if (!payload) return null;
            const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(
                atob(normalized)
                    .split('')
                    .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
                    .join(''),
            );
            return JSON.parse(json) as Record<string, unknown>;
        } catch {
            return null;
        }
    };

    const updateAccessTokenInSession = useCallback((newAccessToken: string) => {
        setToken(newAccessToken);
        tokenRef.current = newAccessToken;
        sessionStorage.setItem('access_token', newAccessToken);

        setUser((prevUser) => {
            const payload = decodeJwtPayload(newAccessToken);
            const parsedSub = Number(payload?.sub ?? 0);
            const nextUser: LoginResponse = {
                access_token: newAccessToken,
                refresh_token: prevUser?.refresh_token,
                token_type: prevUser?.token_type ?? 'Bearer',
                user_id: prevUser?.user_id ?? (Number.isFinite(parsedSub) ? parsedSub : 0),
                email: prevUser?.email ?? String(payload?.email ?? ''),
            };

            userRef.current = nextUser;
            sessionStorage.setItem('user', JSON.stringify(nextUser));
            return nextUser;
        });
    }, []);

    const refreshAccessToken = useCallback(async (): Promise<string | null> => {
        if (refreshPromiseRef.current) {
            return refreshPromiseRef.current;
        }

        const fetchClient = nativeFetchRef.current ?? window.fetch.bind(window);

        refreshPromiseRef.current = (async () => {
            try {
                const response = await fetchClient(`${Enviroment.API_URL}/auth/refresh-token`, {
                    method: 'POST',
                    headers: {
                    Authorization: `Bearer ${token}`,
                    },
                    credentials: 'include',
                });

                if (!response.ok) {
                    clearSession();
                    return null;
                }

                const result = await response.json() as { access_token?: string };
                if (!result.access_token) {
                    clearSession();
                    return null;
                }

                updateAccessTokenInSession(result.access_token);
                return result.access_token;
            } catch {
                clearSession();
                return null;
            } finally {
                refreshPromiseRef.current = null;
            }
        })();

        return refreshPromiseRef.current;
    }, [clearSession, updateAccessTokenInSession]);

    useEffect(() => {
        const savedToken = sessionStorage.getItem('access_token')
        const savedUser = sessionStorage.getItem('user')

        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser) as Partial<LoginResponse>;
                if (parsedUser?.email && parsedUser?.access_token) {
                    setToken(savedToken);
                    setUser(parsedUser as LoginResponse);
                    tokenRef.current = savedToken;
                    userRef.current = parsedUser as LoginResponse;
                    return;
                }
            } catch {
                // Legacy/corrupt session data is ignored and reset below.
            }

            clearSession();
            return;
        }

        const publicPaths = ['/login', '/landing', '/'];
        if (!publicPaths.includes(window.location.pathname)) {
            void refreshAccessToken();
        }

    }, [clearSession, refreshAccessToken]);

    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        const nativeFetch = window.fetch.bind(window);
        nativeFetchRef.current = nativeFetch;

        const isApiUrl = (url: string) => url.startsWith(Enviroment.API_URL);
        const isRefreshEndpoint = (url: string) => url.includes('/auth/refresh-token');
        const isPublicAuthEndpoint = (url: string) =>
            url.includes('/auth/login') ||
            url.includes('/auth/register') ||
            url.includes('/auth/google');

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const requestUrl = typeof input === 'string'
                ? input
                : input instanceof URL
                    ? input.toString()
                    : input.url;

            if (isPublicAuthEndpoint(requestUrl) || !isApiUrl(requestUrl)) {
                return nativeFetch(input, init);
            }

            const headers = new Headers(
                init?.headers ?? (input instanceof Request ? input.headers : undefined),
            );

            const requestInit: RequestInit = {
                ...init,
                headers,
            };

            requestInit.credentials = init?.credentials ?? 'include';

            if (
                tokenRef.current &&
                !headers.get('Authorization') &&
                !isRefreshEndpoint(requestUrl)
            ) {
                headers.set('Authorization', `Bearer ${tokenRef.current}`);
            }

            let response = await nativeFetch(input, requestInit);

            if (
                !isApiUrl(requestUrl) ||
                response.status !== 401 ||
                isRefreshEndpoint(requestUrl) ||
                isPublicAuthEndpoint(requestUrl)
            ) {
                return response;
            }

            const refreshedToken = await refreshAccessToken();
            if (!refreshedToken) {
                return response;
            }

            const retryHeaders = new Headers(requestInit.headers);
            retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);

            response = await nativeFetch(input, {
                ...requestInit,
                credentials: 'include',
                headers: retryHeaders,
            });

            return response;
        };

        return () => {
            window.fetch = nativeFetch;
        };
    }, [refreshAccessToken]);

    const login = (loginData: LoginResponse) => {
        setToken(loginData.access_token);
        setUser(loginData);
        tokenRef.current = loginData.access_token;
        userRef.current = loginData;
        sessionStorage.setItem('access_token', loginData.access_token);
        sessionStorage.setItem('user', JSON.stringify(loginData));
    };

    const logout = () => {
        const currentToken = tokenRef.current;
        const fetchClient = nativeFetchRef.current ?? window.fetch.bind(window);

        if (currentToken) {
            void fetchClient(`${Enviroment.API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                },
            });
        }

        clearSession();
    }

    const isAuthenticated = !!token;
    const value = {
        token,
        user,
        login,
        logout,
        refreshAccessToken,
        isAuthenticated
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )

}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('Debes usar el AuthProvider')
    }
    return context;
}