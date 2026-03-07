/**
 * stripeCheckout.ts
 * Redirects users to Stripe-hosted checkout pages via Payment Links.
 *
 * Products & Prices provisioned via provision-stripe.js:
 *   premium.monthly  → price_1T86e04dDcpT2n1MASk715M8  ($19.99/mo)
 *   premium.yearly   → price_1T86e04dDcpT2n1MCR1CTLHT  ($199.99/yr)
 *   premium_plus.mo  → price_1T86e14dDcpT2n1MYepv2Uu3  ($29.99/mo)
 *   premium_plus.yr  → price_1T86e14dDcpT2n1MAEfrzVpm  ($299.99/yr)
 *   pro.monthly      → price_1T86e24dDcpT2n1M6WeRNFnY  ($79.99/mo)
 *   pro.yearly       → price_1T86e24dDcpT2n1Mj6vDOO4n  ($359.99/yr)
 */

const PAYMENT_LINKS: Record<string, Record<'monthly' | 'yearly', string>> = {
    premium: {
        monthly: 'https://buy.stripe.com/test_14AaEQdfR7gf9OP08Q9bO05',  // Box 1 ($19.99/mo)
        yearly: 'https://buy.stripe.com/test_8x2dR25NpeIH1ij08Q9bO03',  // Box 2 ($199.99/yr)
    },
    premium_plus: {
        monthly: 'https://buy.stripe.com/test_7sYeV6ejV2ZZ3qr08Q9bO02',  // Box 3 ($29.99/mo)
        yearly: 'https://buy.stripe.com/test_cNieV65Np443aSTcVC9bO06',  // Box 4 ($299.99/yr)
    },
    pro: {
        monthly: 'https://buy.stripe.com/test_cNibIUdfR7gf4uvbRy9bO04',  // Box 5 ($79.99/mo)
        yearly: 'https://buy.stripe.com/test_6oU5kwdfR5877GHaNu9bO01',  // Box 6 ($359.99/yr)
    },
};

/**
 * Redirect the user to the Stripe-hosted checkout for their selected plan.
 * @param planKey  'premium' | 'premium_plus' | 'pro'
 * @param isYearly Whether the user selected the yearly billing toggle
 */
export function redirectToStripeCheckout(
    planKey: 'premium' | 'premium_plus' | 'pro',
    isYearly: boolean
): void {
    const period = isYearly ? 'yearly' : 'monthly';
    const url = PAYMENT_LINKS[planKey]?.[period];

    if (!url) {
        console.error(`[Stripe] No payment link found for ${planKey} (${period})`);
        return;
    }

    window.location.href = url;
}
