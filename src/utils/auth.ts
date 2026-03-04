// ─── Auth helpers — localStorage-based, 3-day expiry ─────────────────────────
const AUTH_KEY = 'picklabs_auth';
const SESSION_DAYS = 3;

export function isAuthValid(): boolean {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return false;
        const { expiry } = JSON.parse(raw) as { expiry: number };
        if (Date.now() > expiry) { localStorage.removeItem(AUTH_KEY); return false; }
        return true;
    } catch { return false; }
}

export function saveAuth(): void {
    const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(AUTH_KEY, JSON.stringify({ expiry }));
}

export function clearAuth(): void {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('picklabs_unlocked_games'); // clear free mode unlocked games
}
