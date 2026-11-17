/**
 * Dentis AI - Live Pricing & Stripe Checkout Engine (Abbonamenti + Crediti)
 * RM Studio Universal Engine
 */

const SUPABASE_S2_URL = 'https://jhijfulhntlhcytbhcly.supabase.co';
const SUPABASE_S2_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaWpmdWxobnRsaGN5dGJoY2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzcxODcsImV4cCI6MjA5ODMxMzE4N30.z062NW4ApClll-XWHH2ufmcCleBRNHUUdKO6FiLa0TQ';

// 1. Prezzi di Fallback Immediati (Zero Flicker)
const DENTIS_PRICES = {
    starter:   { id: 'starter',   name: 'Serena Starter (Fuori Orario)', price: 79,  mode: 'monthly' },
    pro:       { id: 'pro',       name: 'Serena PRO (H24 + WhatsApp)',  price: 149, mode: 'monthly' },
    elite:     { id: 'elite',     name: 'Clinic Elite (Multi-sede)',    price: 299, mode: 'monthly' },
    pack_100:  { id: 'pack_100',  name: 'Ricarica Base (100 min)',      price: 49,  mode: 'credits' },
    pack_450:  { id: 'pack_450',  name: 'Ricarica Pro (450 min)',       price: 179, mode: 'credits' },
    pack_1000: { id: 'pack_1000', name: 'Ricarica Max (1000 min)',      price: 349, mode: 'credits' }
};

// 2. Render Reattivo del DOM (Prezzi nelle schede e opzioni nel selettore)
function renderDentisPrices() {
    Object.keys(DENTIS_PRICES).forEach(planKey => {
        const plan = DENTIS_PRICES[planKey];
        if (!plan) return;

        const elPrice = document.querySelector(`[data-price-plan="${planKey}"]`);
        if (elPrice) elPrice.textContent = `€ ${plan.price}`;

        const elOption = document.querySelector(`option[data-plan-option="${planKey}"]`);
        if (elOption) {
            const suffix = plan.mode === 'credits' ? 'una tantum' : '/mese';
            elOption.textContent = `${plan.name} (${plan.price}€ ${suffix})`;
        }
    });
}

// 3. Switch Tab Abbonamento Mensile vs Ricarica Minuti (Senza Canone)
function setDentisPricingMode(mode) {
    const monthlyBox = document.getElementById('dentis-plans-monthly');
    const creditsBox = document.getElementById('dentis-plans-credits');
    const btnMonthly = document.getElementById('btn-mode-monthly');
    const btnCredits = document.getElementById('btn-mode-credits');
    if (!monthlyBox || !creditsBox || !btnMonthly || !btnCredits) return;

    const activeCls = 'px-6 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-brandCyan text-black shadow-lg transition-all cursor-pointer';
    const idleCls   = 'px-6 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-all cursor-pointer';

    if (mode === 'credits') {
        monthlyBox.classList.add('hidden');
        creditsBox.classList.remove('hidden');
        btnCredits.className = activeCls;
        btnMonthly.className = idleCls;
    } else {
        creditsBox.classList.add('hidden');
        monthlyBox.classList.remove('hidden');
        btnMonthly.className = activeCls;
        btnCredits.className = idleCls;
    }
}

// 4. Fetch Live da Supabase S2 (Tabella saas_pricing)
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

// 5. Avvio Checkout Stripe On-The-Fly via n8n
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
        success_url: `https://dentis-app.rmstudio.app/config.html?success=true&plan=${planKey}`,
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

document.addEventListener('DOMContentLoaded', () => {
    renderDentisPrices();
    fetchDentisLivePricing();
});
