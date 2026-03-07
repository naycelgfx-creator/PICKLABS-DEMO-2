const secret = "YOUR_STRIPE_SECRET_KEY";

async function listPrices() {
    const response = await fetch("https://api.stripe.com/v1/prices?active=true&limit=100", {
        headers: {
            "Authorization": `Bearer ${secret}`
        }
    });
    const data = await response.json();
    data.data.forEach(p => {
        console.log(p.id, p.nickname, (p.unit_amount / 100) + ' ' + p.currency);
    });
}
listPrices();
