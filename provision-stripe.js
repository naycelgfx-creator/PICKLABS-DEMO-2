/**
 * provision-stripe.js
 * Run once to create all PickLabs products + prices in your Stripe account.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_xxx node provision-stripe.js
 *
 * After running, copy the printed price IDs into src/data/stripeCheckout.ts
 */

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET) {
    console.error('❌ Missing STRIPE_SECRET_KEY. Run: STRIPE_SECRET_KEY=sk_test_xxx node provision-stripe.js');
    process.exit(1);
}

const plans = [
    {
        key: 'premium',
        name: 'PickLabs Premium',
        description: 'Core analytics suite — odds comparison, real-time alerts, EV+ indicators',
        monthly: 1999,   // $19.99
        yearly: 19999,  // $199.99
    },
    {
        key: 'premium_plus',
        name: 'PickLabs Premium+',
        description: 'Advanced analytics — odds movement charts, Sharp Book odds, Boost Index',
        monthly: 2999,   // $29.99
        yearly: 29999,  // $299.99
    },
    {
        key: 'pro',
        name: 'PickLabs Pro',
        description: 'Full access — arbitrage, middle betting, unlimited API, priority support',
        monthly: 7999,   // $79.99
        yearly: 35999,  // $359.99
    },
];

async function stripePost(endpoint, body) {
    const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${STRIPE_SECRET}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body).toString(),
    });
    const data = await res.json();
    if (data.error) throw new Error(`Stripe error: ${JSON.stringify(data.error)}`);
    return data;
}

async function main() {
    console.log('🔧 Creating PickLabs Stripe products & prices...\n');
    const results = {};

    for (const plan of plans) {
        console.log(`📦 Creating product: ${plan.name}`);

        // Create product
        const product = await stripePost('products', {
            name: plan.name,
            description: plan.description,
        });

        // Create monthly price
        const monthlyPrice = await stripePost('prices', {
            product: product.id,
            unit_amount: plan.monthly,
            currency: 'usd',
            'recurring[interval]': 'month',
            nickname: `${plan.key}_monthly`,
        });

        // Create yearly price
        const yearlyPrice = await stripePost('prices', {
            product: product.id,
            unit_amount: plan.yearly,
            currency: 'usd',
            'recurring[interval]': 'year',
            nickname: `${plan.key}_yearly`,
        });

        results[plan.key] = {
            monthly: monthlyPrice.id,
            yearly: yearlyPrice.id,
        };

        console.log(`  ✅ ${plan.key}.monthly → ${monthlyPrice.id}  ($${plan.monthly / 100}/mo)`);
        console.log(`  ✅ ${plan.key}.yearly  → ${yearlyPrice.id}  ($${plan.yearly / 100}/yr)\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All done! Copy this into src/data/stripeCheckout.ts:\n');
    console.log('export const STRIPE_PRICE_IDS = ' + JSON.stringify(results, null, 4) + ';');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
