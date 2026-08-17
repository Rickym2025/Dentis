/**
 * Dentis AI - Live Pricing & Stripe Checkout Engine
 * RM Studio Universal Engine
 */
const DENTIS_PRICES = {
    starter: { id: 'starter', name: 'Serena Starter (Fuori Orario)', price: 79 },
    pro:     { id: 'pro',     name: 'Serena PRO (H24 + WhatsApp)',  price: 149 },
    elite:   { id: 'elite',   name: 'Clinic Elite (Multi-sede)',    price: 299 }
};

// Avvio Checkout Stripe On-The-Fly via n8n
async function avviaCheckoutDentis(planKey, email = '', nome = '') {
    const plan = DENTIS_PRICES[planKey];
    if (!plan) return;

    const payload = {
        progetto: "Dentis",
        portal_type: "dentis",
        title: `Dentis AI • ${plan.name}`,
        price: plan.price,
        ricarica_tipo: planKey,
        agency_id: email ? `lead_${email}` : "checkout_diretto",
        project_id: email ? `lead_${email}` : "checkout_diretto",
        origin: window.location.origin,
        success_url: `${window.location.origin}/config?success=true&plan=${planKey}`,
        cancel_url: `${window.location.origin}/#prezzi`
    };

    try {
        const res = await fetch('https://n8n.rmstudio.app/webhook/crea-sessione-stripe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Errore creazione sessione Stripe");
        const data = await res.json();
        const redirectUrl = data.url || data.checkout_url || data.session_url;
        
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            throw new Error("URL Stripe mancante");
        }
    } catch (err) {
        console.error("Errore checkout Stripe:", err);
        window.location.hash = '#registrazione-sezione';
    }
}
