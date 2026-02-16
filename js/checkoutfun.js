// ===================== SUPABASE =====================
const { createClient } = supabase;

const SUPABASE_URL = 'https://hwjbfrhbgeczukcjkmca.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmJmcmhiZ2VjenVrY2prbWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDU5MjQsImV4cCI6MjA4NTAyMTkyNH0.BlgIov7kFq2EUW17hLs6o1YujL1i9elD7wILJP6h-lQ';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===================== PACKETA (Zásilkovna) =====================
const PACKETA_API_KEY = '4b32c40ade3173fb';

const PACKETA_OPTIONS = {
  language: 'cs',
  view: 'modal',
  vendors: [
    { country: 'cz' },
    { country: 'cz', group: 'zbox' },
  ],
};

const PICKUP_SS_KEY = 'checkout_pickup_packeta';

// ===================== CART HELPERS =====================
function readCart() {
  const raw = localStorage.getItem('cart');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function normalizeCartItems(cart) {
  const out = [];
  for (const it of cart) {
    const card_id = it?.card_id || it?.id || it?.cardId || it?.card?.id;
    const qty = Number(it?.qty ?? 1) || 1;
    if (!card_id) continue;
    out.push({ card_id, qty });
  }
  return out;
}

// ===================== UI =====================
const els = {};
function grabEls() {
  els.form = document.getElementById('checkoutForm');
  els.msg = document.getElementById('formMsg');
  els.btn = document.getElementById('submitOrder');

  els.firstName = document.getElementById('firstName');
  els.lastName = document.getElementById('lastName');
  els.email = document.getElementById('email');
  els.phone = document.getElementById('phone');
  els.street = document.getElementById('street');
  els.city = document.getElementById('city');
  els.zip = document.getElementById('zip');
  els.country = document.getElementById('country');
  els.note = document.getElementById('note');

  els.terms = document.getElementById('termsAccepted');
  els.gdpr = document.getElementById('gdprAccepted');

  // ✅ newsletter checkbox
  els.newsletterOptIn = document.getElementById('newsletterOptIn');

  els.cartMini = document.getElementById('cartMini');
  els.sumSubtotal = document.getElementById('sumSubtotal');
  els.sumShip = document.getElementById('sumShip');
  els.sumTotal = document.getElementById('sumTotal');
  els.reserveHint = document.getElementById('reserveHint');

  els.cartMiniInline = document.getElementById('cartMiniInline');
  els.sumSubtotalInline = document.getElementById('sumSubtotalInline');
  els.sumShipInline = document.getElementById('sumShipInline');
  els.sumTotalInline = document.getElementById('sumTotalInline');
  els.reserveHintInline = document.getElementById('reserveHintInline');

  els.pickBtn = document.getElementById('pickPacketa');
  els.pickSelected = document.getElementById('pickupSelected');
}

function setMsg(type, text) {
  if (!els.msg) return;
  els.msg.className = 'form-msg ' + (type || '');
  els.msg.textContent = text || '';
}

function getSelected(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

// ===================== FEES =====================
function calcFees(payment) {
  const ship = 89;
  const cod = payment === 'cod' ? 35 : 0;
  return { ship, cod, extra: ship + cod };
}

function formatKc(n) {
  return `${Number(n || 0)} Kč`;
}

// ===================== PICKUP =====================
function readPickup() {
  const raw = sessionStorage.getItem(PICKUP_SS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePickup(point) {
  sessionStorage.setItem(PICKUP_SS_KEY, JSON.stringify(point));
}

function clearPickup() {
  sessionStorage.removeItem(PICKUP_SS_KEY);
}

function renderPickup() {
  const p = readPickup();
  if (!els.pickSelected) return;

  if (!p) {
    els.pickSelected.innerHTML = `<span class="muted">Zatím nic vybráno.</span>`;
    return;
  }

  els.pickSelected.innerHTML = `
    <div class="pickup-line">
      <strong>${p.name}</strong><br>
      <span class="muted">${[p.street, p.city].filter(Boolean).join(', ')}</span>
    </div>
    <div class="pickup-meta muted">ID: ${p.id}</div>
  `;
}

function openPacketaWidget() {
  const onPick = (point) => {
    if (!point) return;
    savePickup(point);
    renderPickup();
    setMsg('ok', 'Výdejní místo vybráno ✅');
  };

  window.Packeta.Widget.pick(PACKETA_API_KEY, onPick, PACKETA_OPTIONS);
}

// ===================== SUMMARY =====================
function renderMiniSummary() {
  const cart = readCart();
  if (!cart.length) return;

  const payment = getSelected('payment') || 'bank';
  const fees = calcFees(payment);

  let subtotal = 0;
  cart.forEach(it => {
    subtotal += Number(it.price || 0) * (Number(it.qty) || 1);
  });

  els.sumSubtotal.textContent = formatKc(subtotal);
  els.sumShip.textContent = formatKc(fees.extra);
  els.sumTotal.textContent = formatKc(subtotal + fees.extra);
}

// ===================== VALIDATION =====================
function validateForm() {
  if (!els.email.value.trim()) return 'Chybí email.';
  if (!els.terms.checked) return 'Musíš souhlasit s podmínkami.';
  if (!els.gdpr.checked) return 'Musíš souhlasit s GDPR.';
  if (!readPickup()) return 'Vyber výdejní místo.';
  if (!normalizeCartItems(readCart()).length) return 'Košík je prázdný.';
  return null;
}

// ===================== ORDER =====================
async function createOrder(payload) {
  const { data, error } = await sb.rpc('create_order_and_reserve', { payload });
  if (error) throw error;
  return data;
}

// ===================== NEWSLETTER SUBSCRIBE (NEW) =====================
function tryNewsletterSubscribe(email) {
  const optIn = els.newsletterOptIn?.checked;
  if (!optIn) return;

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return;

  // fire-and-forget, nikdy neblokuje checkout
  sb.rpc('newsletter_subscribe', {
    p_email: cleanEmail,
    p_source: 'checkout'
  }).then(({ error }) => {
    if (error) console.warn("newsletter_subscribe:", error.message);
  });
}

// ===================== SUBMIT =====================
document.addEventListener('DOMContentLoaded', () => {
  grabEls();
  renderPickup();
  renderMiniSummary();

  els.pickBtn.addEventListener('click', openPacketaWidget);

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('', '');

    const err = validateForm();
    if (err) return setMsg('err', err);

    const payload = {
      email: els.email.value.trim(),
      phone: els.phone.value.trim() || null,
      first_name: els.firstName.value.trim(),
      last_name: els.lastName.value.trim(),
      street: els.street.value.trim(),
      city: els.city.value.trim(),
      zip: els.zip.value.trim(),

      delivery_method: 'zasilkovna',
      payment_method: getSelected('payment') || 'bank',

      note: els.note.value.trim() || null,
      items: normalizeCartItems(readCart())
    };

    try {
      els.btn.disabled = true;
      els.btn.textContent = "Vytvářím objednávku…";

      const resp = await createOrder(payload);

      if (!resp?.ok) throw new Error("Objednávku se nepodařilo vytvořit.");

      // ✅ newsletter subscribe hook
      tryNewsletterSubscribe(payload.email);

      // redirect
      localStorage.removeItem("cart");
      clearPickup();

      location.href = `dekuji.html?order_number=${resp.order_number}`;

    } catch (ex) {
      console.error(ex);
      setMsg('err', ex.message);
      els.btn.disabled = false;
      els.btn.textContent = "Objednat";
    }
  });
});
