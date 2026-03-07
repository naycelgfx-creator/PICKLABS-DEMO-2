/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PickLabsAuthDB.ts
 * Direct port of the Flask/SQLite backend auth system.
 *
 * Python originals:
 *   init_db()           → initDB()
 *   VALID_UPGRADE_CODES → VALID_UPGRADE_CODES
 *   /signup POST        → signup()
 *   /upgrade POST       → applyVIPCode()
 *   /login POST         → login()
 *   /logout             → logout()
 *   /admin_action POST  → adminUpgrade/Downgrade/Delete()
 *   current_user        → getCurrentUser() / useCurrentUser hook
 *
 * Storage: browser localStorage (mirrors SQLite picklabs.db)
 * In production: swap localStorage calls for Supabase/Firebase API calls.
 */

import { adminDeleteUserBets } from './PickLabsBetsDB';
import speakeasy from 'speakeasy';
import bcrypt from 'bcryptjs';

const DB_KEY = 'picklabs_users_db';       // mirrors: picklabs.db
const SESSION_KEY = 'picklabs_session';   // mirrors: Flask-Login cookie
const SESSION_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days (mirrors remember=True)

// ─── VIP Code System ─────────────────────────────────────────────────────────
// Codes are stored in localStorage as a list of VIPCode records.
// Format: TIER-DURATION-XXXXXXXX  (e.g. PRO-YEAR-A1B2C3D4)
// Tier:     BASIC | PREMIUM | PRO
// Duration: MONTH | YEAR

export type TierKey = 'free' | 'free_trial' | 'basic' | 'premium' | 'premium_plus' | 'pro';
export type DurationKey = 'month' | 'year';

/** Mirror of Python TierEnum — labels, prices, colors used across checkout + pricing cards */
export const TIER_META: Record<TierKey, { label: string; monthlyPrice: number | null; yearlyPrice: number | null; color: string; emoji: string; description: string }> = {
    free: { label: 'Free', monthlyPrice: null, yearlyPrice: null, color: 'text-neutral-400', emoji: '🆓', description: 'Basic access, no cost' },
    free_trial: { label: 'Free Trial', monthlyPrice: null, yearlyPrice: null, color: 'text-sky-400', emoji: '🎁', description: '7-day full access trial' },
    basic: { label: 'Basic', monthlyPrice: 20, yearlyPrice: 200, color: 'text-white', emoji: '🔹', description: 'Entry level — great for beginners' },
    premium: { label: 'Premium', monthlyPrice: 19.99, yearlyPrice: null, color: 'text-purple-400', emoji: '💎', description: 'Core tools unlocked' },
    premium_plus: { label: 'Premium+', monthlyPrice: 29.99, yearlyPrice: null, color: 'text-fuchsia-400', emoji: '⭐', description: 'Premium with advanced analytics' },
    pro: { label: 'Pro', monthlyPrice: 79.99, yearlyPrice: null, color: 'text-primary', emoji: '⚡', description: 'Full access — all tools & AI' },
};

export interface VIPCode {
    codeString: string;           // e.g. "PRO-YEAR-A1B2C3D4"
    tier: TierKey;
    duration: DurationKey;
    isRedeemed: boolean;
    redeemedByEmail?: string;
    redeemedAt?: number;          // epoch ms
    createdByAdminId: string;
    createdAt: number;            // epoch ms
}

const VIP_CODES_KEY = 'picklabs_vip_codes';

function getAllVIPCodes(): VIPCode[] {
    const raw = localStorage.getItem(VIP_CODES_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveAllVIPCodes(codes: VIPCode[]): void {
    localStorage.setItem(VIP_CODES_KEY, JSON.stringify(codes));
}

/**
 * Generate a new VIP code and store it.
 * Called from the admin dashboard panel.
 * Returns the new code string (e.g. "PRO-YEAR-A1B2C3D4").
 */
export function generateVIPCode(adminId: string, tier: TierKey, duration: DurationKey): string {
    const suffix = Math.random().toString(36).slice(2, 10).toUpperCase();
    const codeString = `${tier.toUpperCase()}-${duration.toUpperCase()}-${suffix}`;
    const newCode: VIPCode = {
        codeString,
        tier,
        duration,
        isRedeemed: false,
        createdByAdminId: adminId,
        createdAt: Date.now(),
    };
    const codes = getAllVIPCodes();
    codes.push(newCode);
    saveAllVIPCodes(codes);
    return codeString;
}

// ─── Pending Payments ─────────────────────────────────────────────────────────
// Port of PendingPayment SQLAlchemy model + /api/checkout/submit endpoint.
//
// Flow:
//   1. User selects tier + duration in Account Portal, enters their $cashtag.
//   2. submitCashAppPayment() creates a "pending" record in localStorage.
//   3. Admin sees the queue in Admin Panel → clicks Approve or Reject.
//   4. approvePendingPayment() generates a VIP code and immediately redeems it
//      for the user (mirrors: generate_vip_code + redeem_vip_code in sequence).
//   5. rejectPendingPayment() sets status = "rejected".

export interface PendingPayment {
    id: string;                    // UUID-style unique ID
    userEmail: string;             // mirrors: user_id FK → denormalized for TS
    tier: TierKey;                 // What they're buying
    duration: DurationKey;
    cashappCashtag: string;        // e.g. "$JohnDoe"
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: number;           // epoch ms
    reviewedAt?: number;           // epoch ms (set on approve/reject)
    note?: string;                 // Optional admin note on rejection
}

// Global System Settings
export function getAdminMathWindow(): number {
    const val = localStorage.getItem('picklabs_admin_math_window');
    return val ? parseInt(val, 10) : 5; // Default is 5 games
}

export function setAdminMathWindow(window: number) {
    localStorage.setItem('picklabs_admin_math_window', window.toString());
}

const PENDING_PAYMENTS_KEY = 'picklabs_pending_payments';

export function getAllPendingPayments(): PendingPayment[] {
    const raw = localStorage.getItem(PENDING_PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
}

function savePendingPayments(payments: PendingPayment[]): void {
    localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(payments));
}

/**
 * Port of POST /api/checkout/submit
 * Creates a pending payment record for admin review.
 */
export function submitCashAppPayment(
    userEmail: string,
    tier: TierKey,
    duration: DurationKey,
    cashappCashtag: string
): { ok: boolean; message: string } {
    if (!cashappCashtag.trim()) {
        return { ok: false, message: '❌ Please enter your CashApp $cashtag.' };
    }
    const tag = cashappCashtag.trim().startsWith('$')
        ? cashappCashtag.trim()
        : `$${cashappCashtag.trim()}`;

    const payments = getAllPendingPayments();

    // Prevent duplicate pending submissions
    const alreadyPending = payments.some(
        p => p.userEmail.toLowerCase() === userEmail.toLowerCase() && p.status === 'pending'
    );
    if (alreadyPending) {
        return { ok: false, message: '⏳ You already have a payment pending review. We\'ll notify you once approved.' };
    }

    const newPayment: PendingPayment = {
        id: `pmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userEmail,
        tier,
        duration,
        cashappCashtag: tag,
        status: 'pending',
        submittedAt: Date.now(),
    };

    payments.push(newPayment);
    savePendingPayments(payments);

    return {
        ok: true,
        message: `✅ Payment submitted! Our team is verifying your transaction from ${tag}. You'll be upgraded once approved.`
    };
}

/**
 * Admin: Approve a pending payment.
 * Generates a VIP code and immediately redeems it for the user.
 */
export function approvePendingPayment(paymentId: string, adminId: string): { ok: boolean; message: string } {
    const payments = getAllPendingPayments();
    const idx = payments.findIndex(p => p.id === paymentId);
    if (idx === -1) return { ok: false, message: '❌ Payment record not found.' };

    const payment = payments[idx];
    if (payment.status !== 'pending') {
        return { ok: false, message: `❌ Payment is already ${payment.status}.` };
    }

    // Generate a unique code for this tier/duration
    const code = generateVIPCode(adminId, payment.tier, payment.duration);

    // Immediately redeem it for the user
    const redeemResult = applyVIPCode(payment.userEmail, code);
    if (!redeemResult.ok) {
        return { ok: false, message: `❌ Failed to apply code: ${redeemResult.message}` };
    }

    // Mark as approved
    payments[idx].status = 'approved';
    payments[idx].reviewedAt = Date.now();
    savePendingPayments(payments);

    return { ok: true, message: `✅ Approved! ${payment.userEmail} upgraded to ${payment.tier} (${payment.duration}).` };
}

/**
 * Admin: Reject a pending payment with an optional reason.
 */
export function rejectPendingPayment(paymentId: string, note?: string): { ok: boolean; message: string } {
    const payments = getAllPendingPayments();
    const idx = payments.findIndex(p => p.id === paymentId);
    if (idx === -1) return { ok: false, message: '❌ Payment record not found.' };

    payments[idx].status = 'rejected';
    payments[idx].reviewedAt = Date.now();
    if (note) payments[idx].note = note;
    savePendingPayments(payments);

    return { ok: true, message: '🗑 Payment rejected.' };
}



export interface DBUser {
    id: string;                // mirrors: INTEGER PRIMARY KEY AUTOINCREMENT
    email: string;             // mirrors: email TEXT UNIQUE NOT NULL
    passwordHash: string;      // mirrors: password TEXT NOT NULL (hashed)
    isPremium: boolean;        // mirrors: is_premium BOOLEAN NOT NULL DEFAULT 0
    tier?: '3_DAY' | '7_DAY' | '30_DAY' | 'LIFETIME'; // Added for Tier System
    premiumExpiresAt?: number; // epoch ms when VIP expires
    createdAt: number;         // epoch ms
    referralCode?: string;     // Added for referral loop
    referralsCount?: number;   // Added for referral loop
    otp?: string;              // For 2FA/Password Reset
    otpExpiry?: number;        // Epoch ms
    lastKnownIp?: string;      // Mocked IP for 2FA trigger
    dripDay1Sent?: boolean;    // Drip Email Flags
    dripDay2Sent?: boolean;
    dripDay3Sent?: boolean;
    phoneNumber?: string;      // SMS Alerts
    isActive?: boolean;        // Allow admin to deactivate user
    sessionDurationMs?: number; // Total time spent active on the app
    dailyBetsCount?: number;   // Number of bets placed today
    lastLoginAt?: number;      // Epoch ms when last logged in
    twoFactorSecret?: string;  // Speakeasy base32 secret
    faAttempts?: number;       // Number of failed 2FA attempts
    lockoutUntil?: number | null; // Epoch ms for lockout
    recoveryCodes?: string[];  // Hashed backup codes
}

export interface SessionData {
    userId: string;
    email: string;
    isPremium: boolean;
    expiry: number;            // Session TTL
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// We hash on the client side just so plain text passwords aren't sitting in localStorage.
// (In a real app, send plaintext over HTTPS and hash strictly on the backend via bcrypt)
async function hashPassword(msg: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(msg);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
    const pHash = await hashPassword(password);
    return pHash === hash;
}

// ─── Mock IP ──────────────────────────────────────────────────────────────────

function getMockClientIP(): string {
    let mockIp = sessionStorage.getItem('mockClientIp');
    if (!mockIp) {
        mockIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        sessionStorage.setItem('mockClientIp', mockIp);
    }
    return mockIp;
}

// ─── DB Operations ────────────────────────────────────────────────────────────

// The "database" is just a JSON array stored in localStorage
export function getAllUsers(): DBUser[] {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : [];
}

export function saveAllUsers(users: DBUser[]) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
}

// Deprecated findUserByEmail removed

function findUserById(id: string): DBUser | undefined {
    return getAllUsers().find(u => u.id === id);
}

// ─── Drip Campaigns ──────────────────────────────────────────────────────────

export function checkDripCampaigns(email: string) {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return;

    const user = users[idx];
    if (user.isPremium) return; // Drip is for Free users

    const daysActive = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));

    if (daysActive >= 1 && !user.dripDay1Sent) {
        console.log(`%c[DRIP CAMPAIGN SENT to ${user.email}]`, 'color: #10b981; font-weight: bold;', 'The math behind winning sports bets 📈');
        users[idx].dripDay1Sent = true;
    }
    if (daysActive >= 2 && !user.dripDay2Sent) {
        console.log(`%c[DRIP CAMPAIGN SENT to ${user.email}]`, 'color: #fbbf24; font-weight: bold;', 'How to exploit PrizePicks and Underdog 💸');
        users[idx].dripDay2Sent = true;
    }
    if (daysActive >= 3 && !user.dripDay3Sent) {
        console.log(`%c[DRIP CAMPAIGN SENT to ${user.email}]`, 'color: #ef4444; font-weight: bold;', "Unlock the sharp data (Here's a VIP Code) 🔓");
        users[idx].dripDay3Sent = true;
    }

    saveAllUsers(users);
}

// ─── Init DB ──────────────────────────────────────────────────────────────────

// Seed the "database" with a default VIP and Free user for dev testing
export async function initDB() {
    if (localStorage.getItem(DB_KEY)) return;

    const adminPass = await hashPassword('AdminAccess2026');
    const freePass = await hashPassword('Welcome01!');

    const defaultUsers: DBUser[] = [
        {
            id: 'admin-master',
            email: 'master.admin@picklabs.bet',
            passwordHash: adminPass,
            isPremium: true,
            premiumExpiresAt: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
            createdAt: Date.now(),
            referralCode: 'admin_ref',
            referralsCount: 0,
            phoneNumber: '+15551234567', // Mock phone for SMS testing
        },
        {
            id: 'free-01',
            email: 'guest.user01@picklabs.bet',
            passwordHash: freePass,
            isPremium: false,
            createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago to trigger Drip
            referralCode: 'user_ref',
            referralsCount: 0,
            dripDay1Sent: false,
            dripDay2Sent: false,
            dripDay3Sent: false,
        }
    ];

    saveAllUsers(defaultUsers);
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function signup(email: string, password: string, referralCode?: string): Promise<{ ok: boolean; message: string }> {
    const users = getAllUsers();

    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { ok: false, message: '❌ User with that email already exists.' };
    }

    // Process Referral
    if (referralCode) {
        const referrerIdx = users.findIndex(u => u.referralCode === referralCode);
        if (referrerIdx !== -1) {
            users[referrerIdx].referralsCount = (users[referrerIdx].referralsCount || 0) + 1;

            // Auto upgrade to premium if they hit 5 referrals
            if (users[referrerIdx].referralsCount >= 5 && !users[referrerIdx].isPremium) {
                users[referrerIdx].isPremium = true;
                users[referrerIdx].premiumExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
                console.log(`[SYSTEM] ${users[referrerIdx].email} reached 5 referrals and was upgraded to VIP.`);
            }
        }
    }

    const newUser: DBUser = {
        id: crypto.randomUUID(),
        email,
        passwordHash: await hashPassword(password),
        isPremium: false,
        createdAt: Date.now(),
        referralCode: email.split('@')[0] + '_' + Math.floor(Math.random() * 10000),
        referralsCount: 0,
        dripDay1Sent: false,
        dripDay2Sent: false,
        dripDay3Sent: false,
    };

    users.push(newUser);
    saveAllUsers(users);

    return { ok: true, message: 'Account created successfully!' };
}

export function generateOTP(email: string): string {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return '';

    // Generate 6 digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    users[idx].otp = otp;
    users[idx].otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    saveAllUsers(users);

    // In a real app we'd trigger an email send here. Since we're client-side,
    // we'll "leak" it via console for demo purposes, or return it to be auto-filled by UI.
    console.log(`[SIMULATED EMAIL TO ${email}] Your OTP is: ${otp}`);
    return otp;
}

export function downgradeUser(userEmail: string, adminEmail: string): boolean {
    const users = getAllUsers();
    // Verify Admin First
    const adminIdx = users.findIndex(u => u.email.toLowerCase() === adminEmail.toLowerCase() && u.isPremium);
    if (adminIdx === -1) return false;
    // Assuming simple check for mock logic, in production check password hash
    // We skip robust admin auth here for brevity, matching simple mock flow.

    const targetIdx = users.findIndex(u => u.email.toLowerCase() === userEmail.toLowerCase());
    if (targetIdx === -1) return false;

    users[targetIdx].isPremium = false;
    saveAllUsers(users);
    return true;
}

// ─── Analytics Helpers ────────────────────────────────────────────────────────

export function incrementUserDailyBets(userId: string) {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
        users[idx].dailyBetsCount = (users[idx].dailyBetsCount || 0) + 1;
        saveAllUsers(users);
    }
}

export function recordUserSessionLogout(userId: string) {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1 && users[idx].lastLoginAt) {
        const sessionTime = Date.now() - users[idx].lastLoginAt;
        users[idx].sessionDurationMs = (users[idx].sessionDurationMs || 0) + sessionTime;
        saveAllUsers(users);
    }
}

export function verifyOTP(email: string, otp: string): boolean {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;

    const user = users[idx];
    if (user.otp === otp && user.otpExpiry && Date.now() < user.otpExpiry) {
        // Clear OTP on success
        users[idx].otp = undefined;
        users[idx].otpExpiry = undefined;

        // If they verified an OTP, we can assume the device is trusted now
        // so let's update their "IP" to the current mocked device
        users[idx].lastKnownIp = getMockClientIP();

        saveAllUsers(users);
        return true;
    }
    return false;
}

export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;

    users[idx].passwordHash = await hashPassword(newPassword);
    saveAllUsers(users);
    return true;
}

export async function login(email: string, password: string): Promise<{ ok: boolean; message: string; requires2FA?: boolean; user?: DBUser }> {
    // --- Hardcoded Accounts Bypass ---
    const hardcodedAccounts: Record<string, { password: string, isPremium: boolean, tier?: string, id: string }> = {
        // Admin
        'master.admin@picklabs.bet': { password: 'AdminAccess2026', isPremium: true, tier: 'LIFETIME', id: 'admin-master' },

        // Premium Plus
        'plus.member01@picklabs.bet': { password: 'PlusPass01!', isPremium: true, tier: 'LIFETIME', id: 'plus-01' },
        'plus.member02@picklabs.bet': { password: 'PlusPass02!', isPremium: true, tier: 'LIFETIME', id: 'plus-02' },
        'plus.member03@picklabs.bet': { password: 'PlusPass03!', isPremium: true, tier: 'LIFETIME', id: 'plus-03' },
        'plus.member04@picklabs.bet': { password: 'PlusPass04!', isPremium: true, tier: 'LIFETIME', id: 'plus-04' },
        'plus.member05@picklabs.bet': { password: 'PlusPass05!', isPremium: true, tier: 'LIFETIME', id: 'plus-05' },

        // Premium
        'premium.user01@picklabs.bet': { password: 'GoldTier01', isPremium: true, tier: '30_DAY', id: 'premium-01' },
        'premium.user02@picklabs.bet': { password: 'GoldTier02', isPremium: true, tier: '30_DAY', id: 'premium-02' },
        'premium.user03@picklabs.bet': { password: 'GoldTier03', isPremium: true, tier: '30_DAY', id: 'premium-03' },
        'premium.user04@picklabs.bet': { password: 'GoldTier04', isPremium: true, tier: '30_DAY', id: 'premium-04' },
        'premium.user05@picklabs.bet': { password: 'GoldTier05', isPremium: true, tier: '30_DAY', id: 'premium-05' },

        // Pro
        'pro.analyst01@picklabs.bet': { password: 'ProLevel26a', isPremium: true, tier: '7_DAY', id: 'pro-01' },
        'pro.analyst02@picklabs.bet': { password: 'ProLevel26b', isPremium: true, tier: '7_DAY', id: 'pro-02' },
        'pro.analyst03@picklabs.bet': { password: 'ProLevel26c', isPremium: true, tier: '7_DAY', id: 'pro-03' },
        'pro.analyst04@picklabs.bet': { password: 'ProLevel26d', isPremium: true, tier: '7_DAY', id: 'pro-04' },
        'pro.analyst05@picklabs.bet': { password: 'ProLevel26e', isPremium: true, tier: '7_DAY', id: 'pro-05' },

        // Free
        'guest.user01@picklabs.bet': { password: 'Welcome01!', isPremium: false, id: 'free-01' },
        'guest.user02@picklabs.bet': { password: 'Welcome02!', isPremium: false, id: 'free-02' },
        'guest.user03@picklabs.bet': { password: 'Welcome03!', isPremium: false, id: 'free-03' },
        'guest.user04@picklabs.bet': { password: 'Welcome04!', isPremium: false, id: 'free-04' },
        'guest.user05@picklabs.bet': { password: 'Welcome05!', isPremium: false, id: 'free-05' },
    };

    const targetAccount = hardcodedAccounts[email.toLowerCase()];
    if (targetAccount && password === targetAccount.password) {
        const config = targetAccount;

        // Find existing sample user to check if deactivated
        const currentUsers = getAllUsers();
        let sampleUser = currentUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!sampleUser) {
            sampleUser = {
                id: config.id,
                email: email.toLowerCase(),
                passwordHash: 'bypassed',
                isPremium: config.isPremium,
                tier: config.tier as any,
                createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
                referralCode: config.id + '_ref',
                referralsCount: 0,
                isActive: true
            };
            currentUsers.push(sampleUser);
            saveAllUsers(currentUsers);
        }

        if (sampleUser.isActive === false) {
            return { ok: false, message: '❌ Account has been deactivated by admin.' };
        }

        if (sampleUser.twoFactorSecret && sampleUser.email !== 'master.admin@picklabs.bet') {
            return { ok: true, message: '2FA Required', requires2FA: true, user: sampleUser };
        }

        const session: SessionData = {
            userId: sampleUser.id,
            email: sampleUser.email,
            isPremium: sampleUser.isPremium || isAdminEmail(sampleUser.email),
            expiry: Date.now() + SESSION_TTL_MS,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        return { ok: true, message: `Access Granted.`, user: sampleUser };
    }
    // ------------------------------

    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return { ok: false, message: '❌ Invalid email or password.' };

    const user = users[idx];
    // Skip hash check if it's the bypassed admin user from DB
    let valid = false;
    if (user.id === 'root-admin') {
        valid = (password === 'admin12345');
    } else {
        valid = await checkPasswordHash(password, user.passwordHash);
    }

    if (!valid) return { ok: false, message: '❌ Invalid email or password.' };

    if (user.isActive === false) {
        return { ok: false, message: '❌ Account has been deactivated by admin.' };
    }

    // 2FA IP Check
    const currentIp = getMockClientIP();
    if (user.lastKnownIp && user.lastKnownIp !== currentIp) {
        // IP mismatch -> trigger 2FA
        generateOTP(user.email);
        return { ok: false, message: '⚠️ New device detected. OTP required.', requires2FA: true, user };
    }

    // Check Premium Expiry
    if (user.premiumExpiresAt && Date.now() > user.premiumExpiresAt) {
        users[idx].isPremium = false;
        user.isPremium = false;
    }

    // Update known IP and login time on normal successful login
    users[idx].lastKnownIp = currentIp;
    users[idx].lastLoginAt = Date.now();
    saveAllUsers(users);

    if (user.twoFactorSecret) {
        return { ok: true, message: '2FA Required', requires2FA: true, user };
    }

    // Create the session cookie equivalent (mirrors: login_user(user, remember=True))
    const session: SessionData = {
        userId: user.id,
        email: user.email,
        isPremium: user.isPremium || isAdminEmail(user.email),
        expiry: Date.now() + SESSION_TTL_MS,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { ok: true, message: 'Welcome back!', user };
}

export function logout(): void {
    localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): SessionData | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw) as SessionData;
        if (Date.now() > session.expiry) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        const user = findUserById(session.userId);
        if (user) {
            session.isPremium = user.isPremium || isAdminEmail(user.email);
        }
        return session;
    } catch {
        return null;
    }
}

export function isAdminEmail(email: string): boolean {
    if (!email) return false;
    const e = email.toLowerCase();
    return e === 'master.admin@picklabs.bet';
}

// ─── VIP Code Redemption ─────────────────────────────────────────────────────

/**
 * Port of redeem_vip_code() from Python backend.
 *
 * Parses code format: TIER-DURATION-XXXXXXXX
 *   - Tier:     BASIC | PREMIUM | PRO
 *   - Duration: MONTH (30 days) | YEAR (365 days)
 *
 * Mirrors Python logic:
 *   - Validates code exists and hasn't been redeemed.
 *   - Stacks duration on top of existing sub if still active.
 *   - Sets user.subscription_tier from the code.
 *   - Burns the code (is_redeemed = true).
 *
 * daysOverride is kept for admin panel backwards-compat (manual upgrade).
 */
export function applyVIPCode(
    email: string,
    code: string,
    daysOverride?: number
): { ok: boolean; message: string } {
    const cleanCode = code.trim().toUpperCase();

    // ── Admin manual override (no code lookup) ──────────────────────────────
    if (daysOverride !== undefined && daysOverride > 0) {
        const users = getAllUsers();
        const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (idx === -1) return { ok: false, message: '❌ No account found for that email.' };
        const now = Date.now();
        const msToAdd = daysOverride * 24 * 60 * 60 * 1000;
        users[idx].isPremium = true;
        users[idx].tier = daysOverride >= 365 ? 'LIFETIME' : daysOverride >= 30 ? '30_DAY' : daysOverride >= 7 ? '7_DAY' : '3_DAY';
        users[idx].premiumExpiresAt = (users[idx].premiumExpiresAt && users[idx].premiumExpiresAt! > now)
            ? users[idx].premiumExpiresAt! + msToAdd
            : now + msToAdd;
        saveAllUsers(users);
        const session = getCurrentUser();
        if (session && session.email.toLowerCase() === email.toLowerCase()) {
            session.isPremium = true;
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
        return { ok: true, message: `✅ Admin override: ${email} upgraded for ${daysOverride} days.` };
    }

    // ── Parse code format: TIER-DURATION-SUFFIX ─────────────────────────────
    const parts = cleanCode.split('-');
    const VALID_TIERS: TierKey[] = ['BASIC', 'PREMIUM', 'PRO'] as unknown as TierKey[];
    const VALID_DURATIONS: DurationKey[] = ['MONTH', 'YEAR'] as unknown as DurationKey[];

    if (parts.length < 3
        || !VALID_TIERS.includes(parts[0] as unknown as TierKey)
        || !VALID_DURATIONS.includes(parts[1] as unknown as DurationKey)) {
        return { ok: false, message: '❌ Invalid code format. Expected: TIER-DURATION-XXXXXXXX (e.g. PRO-YEAR-A1B2C3D4)' };
    }

    const tier = parts[0].toLowerCase() as TierKey;
    const duration = parts[1].toLowerCase() as DurationKey;

    // ── Validate against stored VIP codes ───────────────────────────────────
    const allCodes = getAllVIPCodes();
    const codeIdx = allCodes.findIndex(c => c.codeString === cleanCode && !c.isRedeemed);
    if (codeIdx === -1) {
        return { ok: false, message: '❌ Invalid or already redeemed code.' };
    }

    // ── Look up user ─────────────────────────────────────────────────────────
    const users = getAllUsers();
    const userIdx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIdx === -1) return { ok: false, message: '❌ No account found for that email.' };

    // ── Calculate new expiration (stack if still active) ─────────────────────
    const now = Date.now();
    const msToAdd = duration === 'year'
        ? 365 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

    const base = (users[userIdx].premiumExpiresAt && users[userIdx].premiumExpiresAt! > now)
        ? users[userIdx].premiumExpiresAt!
        : now;

    users[userIdx].isPremium = true;
    users[userIdx].premiumExpiresAt = base + msToAdd;

    // Map tier to legacy tier label (for admin panel display)
    if (tier === 'pro') users[userIdx].tier = 'LIFETIME';
    else if (tier === 'premium') users[userIdx].tier = '30_DAY';
    else users[userIdx].tier = '7_DAY';

    saveAllUsers(users);

    // ── Burn the code ────────────────────────────────────────────────────────
    allCodes[codeIdx].isRedeemed = true;
    allCodes[codeIdx].redeemedByEmail = email;
    allCodes[codeIdx].redeemedAt = now;
    saveAllVIPCodes(allCodes);

    // ── Update live session ──────────────────────────────────────────────────
    const session = getCurrentUser();
    if (session && session.email.toLowerCase() === email.toLowerCase()) {
        session.isPremium = true;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
    const durationLabel = duration === 'year' ? '1 Year' : '1 Month';
    return {
        ok: true,
        message: `🎉 Success! ${tierLabel} plan activated for ${durationLabel}!`
    };
}

// ─── Admin manual CashApp Upgrade ────────────────────────────────────────────
export function applyCashAppUpgrade(userEmail: string, tierDays: 3 | 7 | 30): { ok: boolean; message: string } {
    return applyVIPCode(userEmail, 'CASHAPP_MANUAL', tierDays);
}

// ─── Admin actions (/admin_action) ───────────────────────────────────────────

export function adminUpgrade(userId: string): void {
    const users = getAllUsers();
    const u = users.find(u => u.id === userId);
    if (u) { u.isPremium = true; saveAllUsers(users); }
}

export function adminDowngrade(userId: string): void {
    const users = getAllUsers();
    const u = users.find(u => u.id === userId);
    if (u) { u.isPremium = false; saveAllUsers(users); }
}

export function adminToggleActive(userId: string): void {
    const users = getAllUsers();
    const u = users.find(u => u.id === userId);
    if (u) {
        u.isActive = u.isActive === false ? true : false;
        saveAllUsers(users);
    }
}

// ─── 2FA (Speakeasy) ──────────────────────────────────────────────────────────

export function generate2FASecret(email: string) {
    return speakeasy.generateSecret({
        name: email,
        issuer: "PickLabs.bet"
    });
}

export async function enable2FA(email: string): Promise<{ secret: string, qrCodeUrl: string, recoveryCodes: string[] } | null> {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return null;

    const secret = speakeasy.generateSecret({
        name: email,
        issuer: "PickLabs.bet"
    });

    const recoveryCodes: string[] = [];
    const hashedCodes: string[] = [];

    // Generate 4 backup codes (per user request UI showing 4)
    for (let i = 0; i < 4; i++) {
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `${part1}-${part2}`;
        recoveryCodes.push(code);
        hashedCodes.push(await bcrypt.hash(code, 10));
    }

    users[idx].twoFactorSecret = secret.base32;
    users[idx].recoveryCodes = hashedCodes;
    saveAllUsers(users);

    return {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url || '',
        recoveryCodes
    };
}

export function disable2FA(email: string): boolean {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;

    users[idx].twoFactorSecret = undefined;
    users[idx].recoveryCodes = undefined;
    saveAllUsers(users);
    return true;
}

export function hasRecoveryCodesEnabled(email: string): boolean {
    const users = getAllUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? (user.recoveryCodes !== undefined && user.recoveryCodes.length > 0) : false;
}

export async function enableRecoveryCodes(email: string): Promise<string[] | null> {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return null;

    const recoveryCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < 4; i++) {
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `${part1}-${part2}`;
        recoveryCodes.push(code);
        hashedCodes.push(await bcrypt.hash(code, 10));
    }

    users[idx].recoveryCodes = hashedCodes;
    saveAllUsers(users);

    return recoveryCodes;
}

export function disableRecoveryCodes(email: string): boolean {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;

    users[idx].recoveryCodes = undefined;
    saveAllUsers(users);
    return true;
}

export function has2FAEnabled(email: string): boolean {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;
    return !!users[idx].twoFactorSecret;
}

// Log admin logic
export async function logActivity(userEmail: string, status: string, ipAddress: string) {
    const timestamp = new Date().toLocaleString();
    console.log(`[Admin Log] ${timestamp} - ${userEmail} - ${status} (IP: ${ipAddress})`);
}

// Check with lockout
export async function verifyWithLockout(user: DBUser, submittedToken: string): Promise<{ success: boolean; message?: string; lockedOut?: boolean }> {
    const now = Date.now();

    if (user.lockoutUntil && now < user.lockoutUntil) {
        return { success: false, message: "Too many attempts. Try again later.", lockedOut: true };
    }

    if (!user.twoFactorSecret) {
        return { success: true }; // No 2FA enabled
    }

    // 1. Check if it's a 6-digit Speakeasy code
    const is6Digit = /^\d{6}$/.test(submittedToken);

    let isCorrect = false;

    if (is6Digit) {
        isCorrect = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: submittedToken,
            window: 1 // Allow 30s grace period
        });
    }

    // 2. Check Recovery Codes if NOT 6 digits
    if (!isCorrect && user.recoveryCodes && user.recoveryCodes.length > 0) {
        for (let i = 0; i < user.recoveryCodes.length; i++) {
            const hashedCode = user.recoveryCodes[i];
            const match = await bcrypt.compare(submittedToken, hashedCode);
            if (match) {
                // Delete this code so it can't be used again
                user.recoveryCodes.splice(i, 1);
                isCorrect = true;
                break;
            }
        }
    }

    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return { success: false, message: "User not found" };

    if (isCorrect) {
        // SUCCESS: Reset attempts
        users[idx].faAttempts = 0;
        users[idx].lockoutUntil = null;
        users[idx].recoveryCodes = user.recoveryCodes; // in case we used one
        saveAllUsers(users);
        logActivity(user.email, '2FA Success', getMockClientIP());
        return { success: true };
    } else {
        // FAILURE: Increase attempt count
        const newAttempts = (users[idx].faAttempts || 0) + 1;
        let lockoutTime = null;

        if (newAttempts >= 3) {
            // Lock them out for 15 minutes
            lockoutTime = now + 15 * 60000;
        }

        users[idx].faAttempts = newAttempts;
        users[idx].lockoutUntil = lockoutTime;
        saveAllUsers(users);

        logActivity(user.email, '2FA Failed', getMockClientIP());
        return { success: false, message: "Invalid code.", lockedOut: lockoutTime !== null };
    }
}

export function complete2FALogin(user: DBUser) {
    const session: SessionData = {
        userId: user.id,
        email: user.email,
        isPremium: user.isPremium || isAdminEmail(user.email),
        expiry: Date.now() + SESSION_TTL_MS,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function adminDelete(userId: string): void {
    const all = getAllUsers();
    const target = all.find(u => u.id === userId);
    if (target) {
        adminDeleteUserBets(target.email);
    }
    const users = all.filter(u => u.id !== userId);
    saveAllUsers(users);
}
