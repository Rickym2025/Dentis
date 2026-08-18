/**
 * Dentis AI - Live Pricing & Stripe Checkout Engine
 * RM Studio Universal Engine
 */

const SUPABASE_S2_URL = 'https://jhijfulhntlhcytbhcly.supabase.co';
const SUPABASE_S2_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaWpmdWxobnRsaGN5dGJoY2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzcxODcsImV4cCI6MjA5ODMxMzE4N30.z062NW4ApClll-XWHH2ufmcCleBRNHUUdKO6FiLa0TQ';

// 1. Prezzi di Fallback Immediati (Zero Flicker)
const DENTIS_PRICES = {
    starter: { id: 'starter', name: 'Serena Starter (Fuori Orario)', price: 79, desc: 'Fuori Orario' },
    pro:     { id: 'pro',     name: 'Serena PRO (H24 + WhatsApp)',  price: 149, desc: 'H24 + WhatsApp Reminders' },
    elite:   { id: 'elite',   name: 'Clinic Elite (Multi-sede)',    price: 299, desc: 'Multi-sede + Supporto' }
};

// 2. Render Reattivo del DOM (Prezzi nelle schede e opzioni nel selettore)
function renderDentisPrices() {
    ['starter', 'pro', 'elite'].forEach(planKey => {
        const plan = DENTIS_PRICES[planKey];
        if (!plan) return;

        // Aggiorna il testo del prezzo nella scheda
        const elPrice = document.querySelector(`[data-price-plan="${planKey}"]`);
        if (elPrice) elPrice.textContent = `€ ${plan.price}`;

        // Aggiorna l'opzione nel dropdown del form di registrazione
        const elOption = document.querySelector(`option[data-plan-option="${planKey}"]`);
        if (elOption) {
            elOption.textContent = `${plan.name} (${plan.price}€/mese)`;
        }
    });
}

// 3. Fetch Live da Supabase S2 (Tabella saas_pricing)
async function fetchDentisLivePricing() {
    try {
        const res = await fetch(`${SUPABASE_S2_URL}/rest/v1/saas_pricing?saas=eq.dentis&select=*`, {
            headers: {
                'apikey': SUPABASE_S2_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_S2_ANON_KEY}`
            },
            cache: 'no-store'
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const rows = await res.json();

        if (Array.isArray(rows) && rows.length > 0) {
            rows.forEach(row => {
                const pid = (row.plan_id || '').toLowerCase();
                if (DENTIS_PRICES[pid]) {
                    DENTIS_PRICES[pid].price = Number(row.price);
                    if (row.name) DENTIS_PRICES[pid].name = row.name;
                }
            });
            renderDentisPrices();
        }
    } catch (err) {
        console.warn('Caricamento listino Dentis da S2 non riuscito, utilizzo prezzi fallback:', err);
    }
}

// 4. Avvio Checkout Stripe On-The-Fly via n8n
async function avviaCheckoutDentis(planKey, email = '', nome = '') {
    const plan = DENTIS_PRICES[planKey];
    if (!plan) return;

    const payload = {
        progetto: "Dentis",
        portal_type: "dentis",
        title: `Dentis AI • ${plan.name}`,
        price: plan.price,
        ricarica_tipo: planKey,
        email: email || undefined,
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
        console.error("Errore checkout Stripe Dentis:", err);
        window.location.hash = '#registrazione-sezione';
    }
}

// Avvio all'evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    renderDentisPrices();
    fetchDentisLivePricing();
});
