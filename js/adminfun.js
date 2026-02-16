// ===================== SUPABASE =====================
const { createClient } = supabase;

const SUPABASE_URL = 'https://hwjbfrhbgeczukcjkmca.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3amJmcmhiZ2VjenVrY2prbWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDU5MjQsImV4cCI6MjA4NTAyMTkyNH0.BlgIov7kFq2EUW17hLs6o1YujL1i9elD7wILJP6h-lQ';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKET = 'buy-requests';
const SIGNED_URL_TTL = 60 * 10; // 10 min

// Aukce bucket
const AUC_BUCKET = 'auctions';

/*
===========================================================
NEWSLETTER TAB – MINIMUM HTML IDs (aby se to zobrazilo)
-----------------------------------------------------------
Přidej do adminu:
- button tab:     id="tabNews"
- pane wrapper:   id="newsPane"  (default hidden)
Uvnitř newsPane doporučuju:
- msg:            id="newsMsg"
- counts:         id="newsCountAll" (celkem v preview)
                  id="newsCountSubs" (subscribed count)
- filters:
    select: id="nlNoBuyDays" (values: "", "7","14","30","60","90")
    checkbox: id="nlNeverBought"
    select: id="nlOrdersBucket" (values: "", "1","2-4","5+")
    input number: id="nlTotalSpentMin"
    input number: id="nlAovMin"
    checkbox: id="nlVipTop10"
    checkbox: id="nlHasPending"
    checkbox: id="nlExcludeReturned" (default checked)
    select: id="nlPrefLang" (values: "", "JP","EN","MIX")
    select: id="nlPricePref" (values: "", "cheap","expensive") // podle avg_item_price
    checkbox: id="nlExcludeUnsub" (default checked)
- preview list container: id="nlPreviewList"
- buttons:
    id="nlRefreshBtn" (reload metrics)
    id="nlExportBtn" (export CSV emails)
    id="nlSaveCampaignBtn" (save draft)
- campaign fields:
    input: id="nlCampName"
    input: id="nlSubject"
    input: id="nlPreheader"
    textarea: id="nlHtml"
- campaigns list:
    tbody: id="nlCampsBody" (optional)
===========================================================
*/

// ===================== UI HELPERS =====================
const $ = (id) => document.getElementById(id);

const views = {
  login: $('loginView'),
  dash: $('dashView'),
  denied: $('deniedView'),
};

const els = {
  // login
  loginForm: $('loginForm'),
  loginEmail: $('loginEmail'),
  loginPassword: $('loginPassword'),
  loginBtn: $('loginBtn'),
  loginMsg: $('loginMsg'),

  // dash
  dashMsg: $('dashMsg'),
  whoami: $('whoami'),
  countAll: $('countAll'),
  countBuy: $('countBuy'),
  countAuc: $('countAuc'),
  refreshBtn: $('refreshBtn'),
  logoutBtn: $('logoutBtn'),
  deniedLogoutBtn: $('deniedLogoutBtn'),

  // tabs
  tabOrders: $('tabOrders'),
  tabBuy: $('tabBuy'),
  tabAuc: $('tabAuc'),
  tabNews: $('tabNews'), // ✅ NEW (optional)

  ordersPane: $('ordersPane'),
  buyPane: $('buyPane'),
  aucPane: $('aucPane'),
  newsPane: $('newsPane'), // ✅ NEW (optional)

  // orders filters
  searchInput: $('searchInput'),
  statusFilter: $('statusFilter'),
  paymentFilter: $('paymentFilter'),
  exportCsvBtn: $('exportCsvBtn'),

  // orders table
  ordersBody: $('ordersBody'),

  // buy filters
  buySearchInput: $('buySearchInput'),
  buyTypeFilter: $('buyTypeFilter'),
  buySort: $('buySort'),

  // buy table
  buyBody: $('buyBody'),

  // modal
  photoModal: $('photoModal'),
  photoGrid: $('photoGrid'),
  photoMeta: $('photoMeta'),
  closeModalBtn: $('closeModalBtn'),
  downloadZipBtn: $('downloadZipBtn'),
  modalMsg: $('modalMsg'),

  // auctions filters
  aucSearchInput: $('aucSearchInput'),
  aucPubFilter: $('aucPubFilter'),
  aucSort: $('aucSort'),
  aucNewBtn: $('aucNewBtn'),

  // auctions table
  aucBody: $('aucBody'),

  // auctions editor
  aucEditor: $('aucEditor'),
  aucClearBtn: $('aucClearBtn'),
  aucForm: $('aucForm'),
  aucTitle: $('aucTitle'),
  aucUrl: $('aucUrl'),
  aucDesc: $('aucDesc'),
  aucStarts: $('aucStarts'),
  aucEnds: $('aucEnds'),
  aucSortOrder: $('aucSortOrder'),
  aucPublished: $('aucPublished'),
  aucSaveBtn: $('aucSaveBtn'),
  aucMsg: $('aucMsg'),

  // auctions photos
  aucPhotos: $('aucPhotos'),
  aucUploadBtn: $('aucUploadBtn'),
  aucPhotoGrid: $('aucPhotoGrid'),

  // ===================== NEWSLETTER (optional) =====================
  newsMsg: $('newsMsg'),
  newsCountAll: $('newsCountAll'),
  newsCountSubs: $('newsCountSubs'),

  nlNoBuyDays: $('nlNoBuyDays'),
  nlNeverBought: $('nlNeverBought'),
  nlOrdersBucket: $('nlOrdersBucket'),
  nlTotalSpentMin: $('nlTotalSpentMin'),
  nlAovMin: $('nlAovMin'),
  nlVipTop10: $('nlVipTop10'),
  nlHasPending: $('nlHasPending'),
  nlExcludeReturned: $('nlExcludeReturned'),
  nlPrefLang: $('nlPrefLang'),
  nlPricePref: $('nlPricePref'),
  nlExcludeUnsub: $('nlExcludeUnsub'),

  nlPreviewList: $('nlPreviewList'),
  nlRefreshBtn: $('nlRefreshBtn'),
  nlExportBtn: $('nlExportBtn'),

  nlCampName: $('nlCampName'),
  nlSubject: $('nlSubject'),
  nlPreheader: $('nlPreheader'),
  nlHtml: $('nlHtml'),
  nlSaveCampaignBtn: $('nlSaveCampaignBtn'),

  nlCampsBody: $('nlCampsBody'),
};

function showView(which) {
  Object.values(views).forEach(v => v?.classList?.add('hidden'));
  views[which]?.classList?.remove('hidden');
}

function setMsg(el, type, text) {
  if (!el) return;
  el.className = 'msg ' + (type || '');
  el.textContent = text || '';
}

function fmtKc(n) {
  return `${Number(n || 0)} Kč`;
}

function fmtDt(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('cs-CZ', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function normalizeHttpUrl(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

async function isAdmin() {
  const { data, error } = await sb.rpc('is_admin');
  if (error) throw error;
  return !!data;
}

// ===================== TABS =====================
let ACTIVE_TAB = 'orders';

function setTab(which) {
  ACTIVE_TAB = which;

  els.tabOrders?.classList?.toggle('active', which === 'orders');
  els.tabBuy?.classList?.toggle('active', which === 'buy');
  els.tabAuc?.classList?.toggle('active', which === 'auc');
  els.tabNews?.classList?.toggle('active', which === 'news'); // ✅

  els.ordersPane?.classList?.toggle('hidden', which !== 'orders');
  els.buyPane?.classList?.toggle('hidden', which !== 'buy');
  els.aucPane?.classList?.toggle('hidden', which !== 'auc');
  els.newsPane?.classList?.toggle('hidden', which !== 'news'); // ✅

  setMsg(els.dashMsg, '', '');
  setMsg(els.newsMsg, '', '');
}

// ===================== DATA =====================
let ORDERS = [];
let BUY = [];
let AUCTIONS = [];

// Newsletter data
let NL_METRICS = [];       // rows from admin_newsletter_customer_metrics()
let NL_SUBSCRIBERS = [];   // newsletter_subscribers
let NL_CAMPAIGNS = [];     // newsletter_campaigns

// ---------- Orders ----------
async function loadOrders() {
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) throw error;
  ORDERS = data || [];
  if (els.countAll) els.countAll.textContent = String(ORDERS.length);
}

function getFilteredOrders() {
  const q = String(els.searchInput?.value || '').trim().toLowerCase();
  const st = els.statusFilter?.value || 'all';
  const pay = els.paymentFilter?.value || 'all';

  return ORDERS.filter(o => {
    if (st !== 'all' && o.status !== st) return false;
    if (pay !== 'all' && o.payment_method !== pay) return false;

    if (!q) return true;

    const hay = [
      o.order_number,
      o.email,
      o.first_name,
      o.last_name,
      o.delivery_point_name,
      o.delivery_point_id,
    ].filter(Boolean).join(' ').toLowerCase();

    return hay.includes(q);
  });
}

function isDone21Days(order) {
  if (!order.shipped_at) return false;
  const shipped = new Date(order.shipped_at);
  const diff = Date.now() - shipped.getTime();
  return diff >= 21 * 24 * 60 * 60 * 1000;
}

function getRowClass(order) {
  const pm = order.payment_method;
  const st = order.status;

  if (st === 'awaiting_payment') return 'is-red';

  if (pm === 'bank') {
    if (st === 'paid') return 'is-blue';
    if (st === 'shipped') return 'is-green';
  }

  if (pm === 'cod') {
    if (st === 'new') return 'is-red';
    if (st === 'shipped') return 'is-yellow';
    if (st === 'paid') return 'is-green';
  }

  return '';
}

function getActions(order) {
  const pm = order.payment_method;
  const st = order.status;

  if (st === 'shipped' && isDone21Days(order)) {
    return { done: true, actions: [] };
  }

  if (pm === 'bank') {
    if (st === 'awaiting_payment') return { done:false, actions:['paid','cancel'] };
    if (st === 'paid') return { done:false, actions:['shipped','cancel'] };
    if (st === 'shipped') return { done:false, actions:['returned','cancel'] };
  }

  if (pm === 'cod') {
    if (st === 'new') return { done:false, actions:['shipped','cancel'] };
    if (st === 'shipped') return { done:false, actions:['paid','returned','cancel'] };
    if (st === 'paid') return { done:false, actions:['returned','cancel'] };
  }

  return { done:false, actions:[] };
}

function actionButtons(order) {
  const { done, actions } = getActions(order);
  if (done) return `<span class="done-label">HOTOVO ✅</span>`;

  return `
    <div class="actions">
      ${actions.includes('paid') ? `<button class="btn-small" data-act="paid" data-id="${order.id}">Zaplaceno</button>` : ''}
      ${actions.includes('shipped') ? `<button class="btn-small" data-act="shipped" data-id="${order.id}">Odesláno</button>` : ''}
      ${actions.includes('returned') ? `<button class="btn-small" data-act="returned" data-id="${order.id}">Vráceno</button>` : ''}
      ${actions.includes('cancel') ? `<button class="btn-small danger" data-act="cancel" data-id="${order.id}">Zrušit</button>` : ''}
    </div>
  `;
}

function renderOrdersTable() {
  if (!els.ordersBody) return;

  const rows = getFilteredOrders();
  if (!rows.length) {
    els.ordersBody.innerHTML = `<tr><td colspan="11" class="muted">Nic tu není.</td></tr>`;
    return;
  }

  els.ordersBody.innerHTML = rows.map(o => {
    const rowClass = getRowClass(o);

    return `
      <tr class="${rowClass}">
        <td><input type="checkbox" class="pickbox" data-pick="${o.id}"></td>
        <td><strong>${escapeHtml(o.order_number || '—')}</strong></td>
        <td>${escapeHtml(o.status || '—')}</td>
        <td>${escapeHtml(o.payment_method || '—')}</td>
        <td><strong>${fmtKc(o.total)}</strong><br><span class="muted">ship: ${fmtKc(o.shipping_price)}</span></td>
        <td>${escapeHtml(o.first_name || '')} ${escapeHtml(o.last_name || '')}<br><span class="muted">${escapeHtml(o.email || '')}</span></td>
        <td>${escapeHtml(o.street || '')}<br>${escapeHtml(o.zip || '')} ${escapeHtml(o.city || '')}</td>
        <td>${escapeHtml(o.delivery_point_name || '—')}<br><span class="muted">${escapeHtml(o.delivery_point_id || '')}</span></td>
        <td>${fmtDt(o.created_at)}</td>
        <td>${o.payment_method === 'bank' ? fmtDt(o.reserved_until) : '—'}</td>
        <td>${actionButtons(o)}</td>
      </tr>
    `;
  }).join('');
}

async function doOrderAction(act, orderId) {
  let fn = null;
  if (act === 'paid') fn = 'admin_mark_paid';
  if (act === 'shipped') fn = 'admin_mark_shipped';
  if (act === 'returned') fn = 'admin_mark_returned';
  if (act === 'cancel') fn = 'admin_cancel_order';
  if (!fn) return;

  if (act === 'cancel') {
    if (!confirm('Fakt zrušit objednávku?')) return;
  }

  const { error } = await sb.rpc(fn, { p_order_id: orderId });
  if (error) throw error;

  await loadOrders();
  renderOrdersTable();
}

// ---------- CSV export ----------
function parseStreet(street) {
  if (!street) return { streetName:'', house:'' };
  const match = street.match(/^(.*?)(\d+\w*)$/);
  if (!match) return { streetName: street, house:'' };
  return { streetName: match[1].trim(), house: match[2].trim() };
}

function exportCsv() {
  const picked = Array.from(document.querySelectorAll("[data-pick]:checked"))
    .map(x => x.getAttribute("data-pick"));

  if (!picked.length) {
    alert("Nejdřív označ objednávky checkboxem.");
    return;
  }

  const selectedOrders = ORDERS.filter(o => picked.includes(o.id));

  const headers = [
    "order_number","first_name","last_name","email","phone",
    "cod","value","currency","weight_grams",
    "pickup_point_id","street","house_number","city","note"
  ];

  let csv = "\uFEFF" + headers.join(";") + "\n";

  selectedOrders.forEach(o => {
    const isCod = o.payment_method === "cod";
    const { streetName, house } = parseStreet(o.street);

    const row = [
      o.order_number,
      o.first_name,
      o.last_name,
      o.email,
      o.phone || "",
      isCod ? "1" : "0",
      o.total,
      "CZK",
      o.weight_grams || 0,
      o.delivery_point_id || "",
      streetName,
      house,
      o.city,
      o.note || ""
    ];

    csv += row.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(";") + "\n";
  });

  const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "zasilkovna_export.csv";
  a.click();
}

// ---------- Buy requests ----------
async function loadBuyRequests() {
  const { data, error } = await sb
    .from('buy_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) throw error;
  BUY = data || [];
  if (els.countBuy) els.countBuy.textContent = String(BUY.length);
}

function getFilteredBuy() {
  const q = String(els.buySearchInput?.value || '').trim().toLowerCase();
  const t = els.buyTypeFilter?.value || 'all';
  const sort = els.buySort?.value || 'newest';

  let rows = [...BUY];

  if (t !== 'all') rows = rows.filter(r => r.type === t);

  if (q) {
    rows = rows.filter(r => {
      const hay = [
        r.email,
        r.type,
        r.message,
        JSON.stringify(r.items || {}),
        JSON.stringify(r.bulk || {})
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  rows.sort((a,b) => {
    const A = new Date(a.created_at).getTime();
    const B = new Date(b.created_at).getTime();
    return sort === 'oldest' ? (A - B) : (B - A);
  });

  return rows;
}

function pillType(t) {
  if (t === 'singles') return `<span class="pill singles">Kusové</span>`;
  if (t === 'bulk') return `<span class="pill bulk">Bulk</span>`;
  return `<span class="pill">${escapeHtml(t || '—')}</span>`;
}

function buyContentSummary(r) {
  if (r.type === 'bulk') {
    const desc = r.bulk?.description || r.message || '';
    const count = r.bulk?.count || 0;
    return `${escapeHtml(String(desc).slice(0, 90))}${desc.length > 90 ? '…' : ''}<br><span class="muted">Počet: ${escapeHtml(String(count))}</span>`;
  }

  const items = Array.isArray(r.items) ? r.items : [];
  const names = items.slice(0, 3).map(x => x?.name).filter(Boolean);
  const more = items.length > 3 ? ` +${items.length - 3}` : '';
  return `${escapeHtml(names.join(', ') || '—')}${more}<br><span class="muted">Karet: ${items.length}</span>`;
}

function buyPhotoCount(r) {
  const p = r.photo_paths || [];
  return Array.isArray(p) ? p.length : 0;
}

function renderBuyTable() {
  if (!els.buyBody) return;

  const rows = getFilteredBuy();
  if (!rows.length) {
    els.buyBody.innerHTML = `<tr><td colspan="6" class="muted">Nic tu není.</td></tr>`;
    return;
  }

  els.buyBody.innerHTML = rows.map(r => {
    const photos = buyPhotoCount(r);
    return `
      <tr>
        <td>${fmtDt(r.created_at)}</td>
        <td>${pillType(r.type)}</td>
        <td><strong>${escapeHtml(r.email || '—')}</strong><br><span class="muted">${escapeHtml((r.message || '').slice(0, 60))}${(r.message||'').length>60?'…':''}</span></td>
        <td>${buyContentSummary(r)}</td>
        <td><strong>${photos}</strong></td>
        <td>
          <div class="actions">
            <button class="btn-small" data-buy-act="photos" data-buy-id="${r.id}">Otevřít fotky</button>
            <button class="btn-small" data-buy-act="zip" data-buy-id="${r.id}">Stáhnout vše</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ---------- Signed URLs + downloads ----------
async function signedUrl(path) {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) throw error;
  return data?.signedUrl;
}

function baseNameFromPath(path) {
  const s = String(path || '');
  const parts = s.split('/');
  return parts[parts.length - 1] || 'photo.jpg';
}

async function fetchAsBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download fail (${res.status})`);
  return await res.blob();
}

// ---------- Modal ----------
let MODAL_REQ = null;
let MODAL_URLS = [];

function openModal() {
  els.photoModal?.classList?.remove('hidden');
}
function closeModal() {
  els.photoModal?.classList?.add('hidden');
  if (els.photoGrid) els.photoGrid.innerHTML = '';
  setMsg(els.modalMsg, '', '');
  MODAL_REQ = null;
  MODAL_URLS = [];
}

async function showPhotosForRequest(reqId) {
  setMsg(els.modalMsg, '', '');
  const req = BUY.find(x => x.id === reqId);
  if (!req) return;

  const paths = Array.isArray(req.photo_paths) ? req.photo_paths : [];
  if (!paths.length) {
    if (els.photoMeta) els.photoMeta.textContent = `${req.email} • ${fmtDt(req.created_at)} • bez fotek`;
    if (els.photoGrid) els.photoGrid.innerHTML = `<div class="muted">Žádné fotky.</div>`;
    MODAL_REQ = req;
    MODAL_URLS = [];
    openModal();
    return;
  }

  if (els.photoMeta) els.photoMeta.textContent = `${req.email} • ${fmtDt(req.created_at)} • fotek: ${paths.length}`;
  if (els.photoGrid) els.photoGrid.innerHTML = `<div class="muted">Načítám fotky…</div>`;
  openModal();

  try {
    const out = [];
    for (const p of paths) {
      const url = await signedUrl(p);
      out.push({ path: p, url });
    }
    MODAL_REQ = req;
    MODAL_URLS = out;

    if (els.photoGrid) {
      els.photoGrid.innerHTML = out.map(x => {
        const name = baseNameFromPath(x.path);
        return `
          <div class="photo-card">
            <a href="${x.url}" target="_blank" rel="noopener">
              <img src="${x.url}" alt="">
            </a>
            <div class="cap">
              <div class="name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
              <a class="btn-small" href="${x.url}" download="${escapeHtml(name)}">Download</a>
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (e) {
    console.error(e);
    setMsg(els.modalMsg, 'err', `Nešlo načíst fotky: ${e?.message || e}`);
    if (els.photoGrid) els.photoGrid.innerHTML = '';
  }
}

async function downloadZipCurrent() {
  if (!MODAL_REQ) return;
  if (!window.JSZip) {
    setMsg(els.modalMsg, 'err', 'Chybí JSZip (knihovna pro ZIP).');
    return;
  }
  if (!MODAL_URLS.length) {
    setMsg(els.modalMsg, 'err', 'Žádné fotky k zabalení.');
    return;
  }

  setMsg(els.modalMsg, '', '');
  if (els.downloadZipBtn) {
    els.downloadZipBtn.disabled = true;
    els.downloadZipBtn.textContent = 'Baluju ZIP…';
  }

  try {
    const zip = new JSZip();

    for (let i = 0; i < MODAL_URLS.length; i++) {
      const { path, url } = MODAL_URLS[i];
      const name = baseNameFromPath(path) || `photo-${i+1}.jpg`;

      const blob = await fetchAsBlob(url);
      zip.file(name, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);

    const a = document.createElement('a');
    a.href = url;
    a.download = `vykup-${MODAL_REQ.email || 'request'}-${String(MODAL_REQ.id).slice(0,8)}.zip`;
    a.click();

    setMsg(els.modalMsg, 'ok', 'ZIP stažen ✅');

  } catch (e) {
    console.error(e);
    setMsg(els.modalMsg, 'err', `ZIP fail: ${e?.message || e}`);
  } finally {
    if (els.downloadZipBtn) {
      els.downloadZipBtn.disabled = false;
      els.downloadZipBtn.textContent = 'Stáhnout vše (ZIP)';
    }
  }
}

/* ===================== AUKCE (FIXED) ===================== */

let AUC_EDIT_ID = null;

function toDatetimeLocalValue(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDatetimeLocalValue(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function aucState(a) {
  const now = new Date();
  const starts = a.starts_at ? new Date(a.starts_at) : null;
  const ends = a.ends_at ? new Date(a.ends_at) : null;

  if (!ends || Number.isNaN(ends.getTime())) return 'ended';
  if (ends <= now) return 'ended';
  if (starts && !Number.isNaN(starts.getTime()) && starts > now) return 'scheduled';
  return 'live';
}

function aucBadgeHtml(a) {
  const st = aucState(a);
  if (st === 'live') return `<span class="auc-badge live">LIVE</span>`;
  if (st === 'scheduled') return `<span class="auc-badge scheduled">Plán</span>`;
  return `<span class="auc-badge ended">Hotovo</span>`;
}

function publicAucImgUrl(path) {
  if (!path) return '';
  return `${SUPABASE_URL}/storage/v1/object/public/${AUC_BUCKET}/${encodeURIComponent(path).replaceAll('%2F','/')}`;
}

async function loadAuctions() {
  const { data, error } = await sb
    .from('auctions')
    .select(`
      id, created_at, title, description, fb_url, starts_at, ends_at, published,
      auction_images:auction_images ( id, path, sort_order )
    `)
    .order('ends_at', { ascending: false })
    .limit(300);

  if (error) throw error;

  (data || []).forEach(a => {
    if (!Array.isArray(a.auction_images)) a.auction_images = [];
    a.auction_images.sort((x,y) => (x.sort_order ?? 0) - (y.sort_order ?? 0));
  });

  AUCTIONS = data || [];
  if (els.countAuc) els.countAuc.textContent = String(AUCTIONS.length);
}

function getFilteredAuctions() {
  const q = String(els.aucSearchInput?.value || '').trim().toLowerCase();
  const pub = els.aucPubFilter?.value || 'all';
  const sort = els.aucSort?.value || 'ends_desc';

  let rows = [...AUCTIONS];

  if (pub === 'pub') rows = rows.filter(a => !!a.published);
  if (pub === 'unpub') rows = rows.filter(a => !a.published);

  if (q) {
    rows = rows.filter(a => {
      const hay = [a.title, a.description, a.fb_url].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  rows.sort((a,b) => {
    const Aend = new Date(a.ends_at || 0).getTime();
    const Bend = new Date(b.ends_at || 0).getTime();
    const Acrt = new Date(a.created_at || 0).getTime();
    const Bcrt = new Date(b.created_at || 0).getTime();

    if (sort === 'ends_asc') return Aend - Bend;
    if (sort === 'newest') return Bcrt - Acrt;
    if (sort === 'oldest') return Acrt - Bcrt;
    return Bend - Aend;
  });

  return rows;
}

function renderAuctionsTable() {
  if (!els.aucBody) return;

  const rows = getFilteredAuctions();
  if (!rows.length) {
    els.aucBody.innerHTML = `<tr><td colspan="7" class="muted">Nic tu není.</td></tr>`;
    return;
  }

  els.aucBody.innerHTML = rows.map(a => {
    const imgCount = Array.isArray(a.auction_images) ? a.auction_images.length : 0;
    const fb = normalizeHttpUrl(a.fb_url || '');
    return `
      <tr>
        <td><strong>${escapeHtml(a.title || '—')}</strong><br><span class="muted">${escapeHtml((a.description || '').slice(0, 70))}${(a.description||'').length>70?'…':''}</span></td>
        <td>${aucBadgeHtml(a)}</td>
        <td>${fmtDt(a.starts_at)}</td>
        <td><strong>${fmtDt(a.ends_at)}</strong></td>
        <td><strong>${a.published ? 'ANO' : 'NE'}</strong></td>
        <td><strong>${imgCount}</strong></td>
        <td>
          <div class="actions">
            <button class="btn-small" data-auc-act="edit" data-auc-id="${a.id}">Upravit</button>
            <button class="btn-small" data-auc-act="toggle" data-auc-id="${a.id}">${a.published ? 'Skrýt' : 'Publikovat'}</button>
            ${fb ? `<a class="btn-small" href="${fb}" target="_blank" rel="noopener">FB</a>` : ''}
            <button class="btn-small danger" data-auc-act="delete" data-auc-id="${a.id}">Smazat</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function clearAucEditor() {
  AUC_EDIT_ID = null;
  if (els.aucTitle) els.aucTitle.value = '';
  if (els.aucUrl) els.aucUrl.value = '';
  if (els.aucDesc) els.aucDesc.value = '';
  if (els.aucStarts) els.aucStarts.value = '';
  if (els.aucEnds) els.aucEnds.value = '';
  if (els.aucSortOrder) els.aucSortOrder.value = '';
  if (els.aucPublished) els.aucPublished.checked = false;
  if (els.aucPhotoGrid) els.aucPhotoGrid.innerHTML = '';
  if (els.aucPhotos) els.aucPhotos.value = '';
  setMsg(els.aucMsg, '', '');
}

function fillAucEditor(a) {
  AUC_EDIT_ID = a?.id || null;
  if (els.aucTitle) els.aucTitle.value = a?.title || '';
  if (els.aucUrl) els.aucUrl.value = a?.fb_url || '';
  if (els.aucDesc) els.aucDesc.value = a?.description || '';
  if (els.aucStarts) els.aucStarts.value = toDatetimeLocalValue(a?.starts_at);
  if (els.aucEnds) els.aucEnds.value = toDatetimeLocalValue(a?.ends_at);
  if (els.aucSortOrder) els.aucSortOrder.value = String(a?.sort_order ?? '');
  if (els.aucPublished) els.aucPublished.checked = !!a?.published;

  renderAucPhotoGrid(a);
  setMsg(els.aucMsg, '', '');
}

function renderAucPhotoGrid(a) {
  if (!els.aucPhotoGrid) return;

  const imgs = Array.isArray(a?.auction_images) ? a.auction_images : [];
  if (!imgs.length) {
    els.aucPhotoGrid.innerHTML = `<div class="muted">Zatím žádné fotky. Nahraj je nahoře.</div>`;
    return;
  }

  els.aucPhotoGrid.innerHTML = imgs.map(im => {
    const url = publicAucImgUrl(im.path);
    const name = baseNameFromPath(im.path);
    return `
      <div class="auc-photo">
        <a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt=""></a>
        <div class="cap">
          <div class="name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
          <button class="btn-small danger" data-aucimg-act="delete" data-aucimg-id="${im.id}" data-aucimg-path="${escapeHtml(im.path)}">Smazat</button>
        </div>
      </div>
    `;
  }).join('');
}

async function saveAuction() {
  setMsg(els.aucMsg, '', '');

  const title = String(els.aucTitle?.value || '').trim();
  let fb_url = String(els.aucUrl?.value || '').trim();
  const description = String(els.aucDesc?.value || '').trim();

  const starts_at = fromDatetimeLocalValue(els.aucStarts?.value);
  const ends_at = fromDatetimeLocalValue(els.aucEnds?.value);

  const published = !!els.aucPublished?.checked;

  const sort_order_raw = String(els.aucSortOrder?.value || '').trim();
  const sort_order = sort_order_raw === '' ? null : Number(sort_order_raw);
  if (sort_order_raw !== '' && !Number.isFinite(sort_order)) {
    setMsg(els.aucMsg, 'err', 'Řazení musí být číslo.');
    return;
  }

  if (!title || !fb_url || !ends_at) {
    setMsg(els.aucMsg, 'err', 'Vyplň Název + FB URL + Konec.');
    return;
  }

  fb_url = normalizeHttpUrl(fb_url);

  const payload = {
    title,
    fb_url,
    description: description || null,
    starts_at: starts_at || null,
    ends_at,
    published,
    sort_order: sort_order ?? 0
  };

  if (!AUC_EDIT_ID) {
    const { data: newId, error } = await sb.rpc('admin_create_auction', { payload });
    if (error) throw error;

    await loadAuctions();
    renderAuctionsTable();

    const created = AUCTIONS.find(x => x.id === newId);
    if (created) fillAucEditor(created);

    setMsg(els.aucMsg, 'ok', 'Aukce vytvořená ✅');
    return;
  }

  const { error } = await sb.rpc('admin_update_auction', { p_id: AUC_EDIT_ID, payload });
  if (error) throw error;

  await loadAuctions();
  renderAuctionsTable();

  const updated = AUCTIONS.find(x => x.id === AUC_EDIT_ID);
  if (updated) fillAucEditor(updated);

  setMsg(els.aucMsg, 'ok', 'Uloženo ✅');
}

async function toggleAuctionPublish(id) {
  const a = AUCTIONS.find(x => x.id === id);
  if (!a) return;

  const { error } = await sb
    .from('auctions')
    .update({ published: !a.published })
    .eq('id', id);

  if (error) throw error;

  await loadAuctions();
  renderAuctionsTable();

  if (AUC_EDIT_ID === id) {
    const updated = AUCTIONS.find(x => x.id === id);
    if (updated) fillAucEditor(updated);
  }
}

async function deleteAuction(id) {
  const a = AUCTIONS.find(x => x.id === id);
  if (!a) return;

  const ok = confirm(`Fakt smazat aukci "${a.title}"? (smaže i záznamy fotek v DB)`);
  if (!ok) return;

  const { error } = await sb.from('auctions').delete().eq('id', id);
  if (error) throw error;

  if (AUC_EDIT_ID === id) clearAucEditor();

  await loadAuctions();
  renderAuctionsTable();
}

async function editAuction(id) {
  const a = AUCTIONS.find(x => x.id === id);
  if (!a) return;
  fillAucEditor(a);
}

async function uploadAuctionPhotos() {
  setMsg(els.aucMsg, '', '');

  if (!AUC_EDIT_ID) {
    setMsg(els.aucMsg, 'err', 'Nejdřív ulož aukci (aby měla ID), pak nahraj fotky.');
    return;
  }

  const files = Array.from(els.aucPhotos?.files || []);
  if (!files.length) {
    setMsg(els.aucMsg, 'err', 'Vyber fotky.');
    return;
  }

  if (els.aucUploadBtn) {
    els.aucUploadBtn.disabled = true;
    els.aucUploadBtn.textContent = 'Nahrávám…';
  }

  try {
    const cur = AUCTIONS.find(x => x.id === AUC_EDIT_ID);
    const base = (cur?.auction_images?.length || 0);

    const rows = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const safeName = String(f.name || `photo-${i+1}.jpg`).replaceAll(' ', '_');
      const path = `${AUC_EDIT_ID}/${Date.now()}-${i+1}-${safeName}`;

      const { error: upErr } = await sb.storage.from(AUC_BUCKET).upload(path, f, {
        cacheControl: '3600',
        upsert: false,
        contentType: f.type || 'image/jpeg'
      });
      if (upErr) throw upErr;

      rows.push({
        auction_id: AUC_EDIT_ID,
        path,
        sort_order: base + i
      });
    }

    const { error: insErr } = await sb.rpc('admin_add_auction_images', { p_rows: rows });
    if (insErr) throw insErr;

    await loadAuctions();
    renderAuctionsTable();

    const updated = AUCTIONS.find(x => x.id === AUC_EDIT_ID);
    if (updated) fillAucEditor(updated);

    if (els.aucPhotos) els.aucPhotos.value = '';
    setMsg(els.aucMsg, 'ok', `Nahráno: ${files.length} ✅`);

  } catch (e) {
    console.error(e);
    setMsg(els.aucMsg, 'err', `Upload fail: ${e?.message || e}`);
  } finally {
    if (els.aucUploadBtn) {
      els.aucUploadBtn.disabled = false;
      els.aucUploadBtn.textContent = 'Nahrát fotky';
    }
  }
}

async function deleteAuctionImage(imgId, path) {
  const ok = confirm('Smazat fotku? (smaže z DB, a pokusí se smazat i ze Storage)');
  if (!ok) return;

  const { error: delErr } = await sb.rpc('admin_delete_auction_image', { p_image_id: imgId });
  if (delErr) throw delErr;

  try {
    await sb.storage.from(AUC_BUCKET).remove([path]);
  } catch (e) {
    console.warn('Storage remove failed (ignored):', e);
  }

  await loadAuctions();
  renderAuctionsTable();
  const updated = AUCTIONS.find(x => x.id === AUC_EDIT_ID);
  if (updated) fillAucEditor(updated);
}

/* ===================== NEWSLETTER (ADMIN) ===================== */

function nlHasUI() {
  return !!(els.tabNews && els.newsPane);
}

function nlSegmentFromUI() {
  const noBuyDays = Number(els.nlNoBuyDays?.value || 0) || null;
  const neverBought = !!els.nlNeverBought?.checked;
  const ordersBucket = String(els.nlOrdersBucket?.value || '').trim() || null;

  const totalSpentMin = Number(els.nlTotalSpentMin?.value || 0) || null;
  const aovMin = Number(els.nlAovMin?.value || 0) || null;

  const vipTop10 = !!els.nlVipTop10?.checked;
  const hasPending = !!els.nlHasPending?.checked;
  const excludeReturned = els.nlExcludeReturned ? !!els.nlExcludeReturned.checked : true;

  const prefersLanguage = String(els.nlPrefLang?.value || '').trim() || null; // JP/EN/MIX
  const pricePref = String(els.nlPricePref?.value || '').trim() || null; // cheap/expensive

  const excludeUnsub = els.nlExcludeUnsub ? !!els.nlExcludeUnsub.checked : true;

  return {
    noBuyDays,
    neverBought,
    ordersBucket,
    totalSpentMin,
    aovMin,
    vipTop10,
    hasPending,
    excludeReturned,
    prefersLanguage,
    pricePref,
    excludeUnsub
  };
}

function daysSince(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

function nlOrderBucketMatch(count, bucket) {
  const c = Number(count || 0);
  if (!bucket) return true;
  if (bucket === '1') return c === 1;
  if (bucket === '2-4') return c >= 2 && c <= 4;
  if (bucket === '5+') return c >= 5;
  return true;
}

function nlPricePrefMatch(avgItemPrice, pref) {
  if (!pref) return true;
  const p = Number(avgItemPrice || 0);
  // 🔧 prah můžeš kdykoliv změnit, je to jen “levný vs dražší”
  const TH = 120; // Kč
  if (pref === 'cheap') return p > 0 && p < TH;
  if (pref === 'expensive') return p >= TH;
  return true;
}

function nlBuildPreviewList() {
  const seg = nlSegmentFromUI();

  const subsMap = new Map();
  for (const s of NL_SUBSCRIBERS) {
    const email = String(s.email || '').toLowerCase().trim();
    if (!email) continue;
    subsMap.set(email, s);
  }

  let rows = [...NL_METRICS];

  // exclude unsubscribed (default ON)
  if (seg.excludeUnsub) {
    rows = rows.filter(m => {
      const s = subsMap.get(String(m.email || '').toLowerCase().trim());
      // pokud subscriber neexistuje, necháme to projít (protože může být customer bez subscribe),
      // ale ty pak stejně budeš posílat jen subscribed – to uděláme v dalším kroku.
      if (!s) return true;
      return !s.is_unsubscribed;
    });
  }

  // never bought
  if (seg.neverBought) {
    rows = rows.filter(m => Number(m.orders_count || 0) === 0);
  }

  // no buy X days (počítáme z last_order_at, fallback last_any_order_at)
  if (seg.noBuyDays) {
    rows = rows.filter(m => {
      const last = m.last_order_at || m.last_any_order_at;
      const d = daysSince(last);
      if (d === null) return true; // nikdy? tak projde
      return d >= seg.noBuyDays;
    });
  }

  // orders bucket
  if (seg.ordersBucket) {
    rows = rows.filter(m => nlOrderBucketMatch(m.orders_count, seg.ordersBucket));
  }

  // total spent min
  if (seg.totalSpentMin !== null) {
    rows = rows.filter(m => Number(m.total_spent || 0) >= seg.totalSpentMin);
  }

  // AOV min
  if (seg.aovMin !== null) {
    rows = rows.filter(m => Number(m.aov || 0) >= seg.aovMin);
  }

  // vip
  if (seg.vipTop10) {
    rows = rows.filter(m => !!m.is_vip_top10);
  }

  // has pending
  if (seg.hasPending) {
    rows = rows.filter(m => !!m.has_pending);
  }

  // exclude returned
  if (seg.excludeReturned) {
    rows = rows.filter(m => !m.has_returned);
  }

  // prefers language
  if (seg.prefersLanguage) {
    rows = rows.filter(m => String(m.prefers_language || '').toUpperCase() === seg.prefersLanguage.toUpperCase());
  }

  // cheap/expensive preference by avg_item_price
  if (seg.pricePref) {
    rows = rows.filter(m => nlPricePrefMatch(m.avg_item_price, seg.pricePref));
  }

  // řazení: nejvíc spent desc, pak nejnovější order desc
  rows.sort((a,b) => {
    const A = Number(a.total_spent || 0);
    const B = Number(b.total_spent || 0);
    if (B !== A) return B - A;
    const at = new Date(a.last_order_at || a.last_any_order_at || 0).getTime();
    const bt = new Date(b.last_order_at || b.last_any_order_at || 0).getTime();
    return bt - at;
  });

  return { seg, rows, subsMap };
}

function nlRenderPreview() {
  if (!nlHasUI()) return;

  const { rows, subsMap } = nlBuildPreviewList();

  // count
  if (els.newsCountAll) els.newsCountAll.textContent = String(rows.length);

  // “subscribed count” odhad (kolik z preview je reálně v newsletter_subscribers a není unsub)
  if (els.newsCountSubs) {
    const subs = rows.filter(r => {
      const s = subsMap.get(String(r.email || '').toLowerCase().trim());
      return s && !s.is_unsubscribed;
    }).length;
    els.newsCountSubs.textContent = String(subs);
  }

  if (!els.nlPreviewList) return;

  if (!rows.length) {
    els.nlPreviewList.innerHTML = `<div class="muted">Nic neodpovídá filtrům.</div>`;
    return;
  }

  // show max 200 v UI (aby se to nezadusilo), export může dát všechny
  const show = rows.slice(0, 200);

  els.nlPreviewList.innerHTML = `
    <div class="muted" style="margin-bottom:10px;">
      Zobrazuju ${show.length}${rows.length > show.length ? ` z ${rows.length}` : ''}.
    </div>
    <div class="nl-list">
      ${show.map(m => {
        const email = escapeHtml(m.email || '');
        const oc = Number(m.orders_count || 0);
        const spent = fmtKc(m.total_spent || 0);
        const aov = fmtKc(m.aov || 0);
        const last = fmtDt(m.last_order_at || m.last_any_order_at);
        const vip = m.is_vip_top10 ? '⭐ VIP' : '';
        const pend = m.has_pending ? '⏳ pending' : '';
        const ret = m.has_returned ? '⚠ returned' : '';
        const lang = m.prefers_language ? `🌐 ${escapeHtml(m.prefers_language)}` : '';
        const avgp = m.avg_item_price ? `💸 avg item ${fmtKc(m.avg_item_price)}` : '';
        return `
          <div class="nl-row">
            <div class="nl-email"><strong>${email}</strong></div>
            <div class="nl-meta muted">
              ${vip} ${pend} ${ret} ${lang} ${avgp}<br>
              orders: <strong>${oc}</strong> • spent: <strong>${spent}</strong> • AOV: <strong>${aov}</strong> • last: ${last}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function nlLoadMetrics() {
  // ✅ IMPORTANT: metrics jdou přes RPC (protože view je revoke a/nebo security definer)
  const { data, error } = await sb.rpc('admin_newsletter_customer_metrics');
  if (error) throw error;
  NL_METRICS = Array.isArray(data) ? data : [];
}

async function nlLoadSubscribers() {
  const { data, error } = await sb
    .from('newsletter_subscribers')
    .select('id,email,is_unsubscribed,unsubscribed_at,subscribed_at,source')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) throw error;
  NL_SUBSCRIBERS = data || [];
}

async function nlLoadCampaigns() {
  const { data, error } = await sb
    .from('newsletter_campaigns')
    .select('id,created_at,name,subject,preheader,status,scheduled_for,sent_at,segment_json')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  NL_CAMPAIGNS = data || [];
}

function nlRenderCampaignsTable() {
  if (!els.nlCampsBody) return;

  if (!NL_CAMPAIGNS.length) {
    els.nlCampsBody.innerHTML = `<tr><td colspan="6" class="muted">Zatím žádné kampaně.</td></tr>`;
    return;
  }

  els.nlCampsBody.innerHTML = NL_CAMPAIGNS.map(c => {
    return `
      <tr>
        <td><strong>${escapeHtml(c.name || '—')}</strong><br><span class="muted">${fmtDt(c.created_at)}</span></td>
        <td>${escapeHtml(c.subject || '')}</td>
        <td>${escapeHtml(c.status || 'draft')}</td>
        <td>${c.scheduled_for ? fmtDt(c.scheduled_for) : '—'}</td>
        <td>${c.sent_at ? fmtDt(c.sent_at) : '—'}</td>
        <td>
          <button class="btn-small" data-nl-camp="load" data-nl-id="${c.id}">Načíst</button>
        </td>
      </tr>
    `;
  }).join('');
}

function nlFillCampaignEditor(c) {
  if (!c) return;
  if (els.nlCampName) els.nlCampName.value = c.name || '';
  if (els.nlSubject) els.nlSubject.value = c.subject || '';
  if (els.nlPreheader) els.nlPreheader.value = c.preheader || '';
  // html nečteme v listu (šetří), načteme při load detail (viz níž)
}

async function nlLoadCampaignDetail(id) {
  const { data, error } = await sb
    .from('newsletter_campaigns')
    .select('id,name,subject,preheader,html,status,segment_json,created_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

function nlEmailsFromPreview({ onlySubscribed = false } = {}) {
  const { rows, subsMap } = nlBuildPreviewList();

  let emails = rows.map(r => String(r.email || '').toLowerCase().trim()).filter(Boolean);

  // dedupe
  emails = Array.from(new Set(emails));

  if (onlySubscribed) {
    emails = emails.filter(e => {
      const s = subsMap.get(e);
      return s && !s.is_unsubscribed;
    });
  }

  return emails;
}

function nlExportEmailsCsv() {
  if (!nlHasUI()) return;

  // ⚡ default: export jen subscribed & not unsubscribed (protože newsletter reálně)
  const emails = nlEmailsFromPreview({ onlySubscribed: true });

  if (!emails.length) {
    alert('Nic k exportu (po odfiltrování unsubscribed).');
    return;
  }

  const csv = "\uFEFFemail\n" + emails.map(e => `"${e.replaceAll('"','""')}"`).join("\n");
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `newsletter_recipients_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

async function nlSaveCampaignDraft() {
  if (!nlHasUI()) return;

  const name = String(els.nlCampName?.value || '').trim();
  const subject = String(els.nlSubject?.value || '').trim();
  const preheader = String(els.nlPreheader?.value || '').trim();
  const html = String(els.nlHtml?.value || '').trim();

  if (!subject || !html) {
    setMsg(els.newsMsg, 'err', 'Chybí subject nebo HTML.');
    return;
  }

  const segment_json = nlSegmentFromUI();

  const payload = {
    name: name || '',
    subject,
    preheader: preheader || '',
    html,
    status: 'draft',
    segment_json
  };

  const { error } = await sb.from('newsletter_campaigns').insert(payload);
  if (error) throw error;

  await nlLoadCampaigns();
  nlRenderCampaignsTable();
  setMsg(els.newsMsg, 'ok', 'Draft uložen ✅');
}

async function nlReloadAll() {
  if (!nlHasUI()) return;

  setMsg(els.newsMsg, '', 'Načítám newsletter data…');

  try {
    await Promise.all([nlLoadMetrics(), nlLoadSubscribers(), nlLoadCampaigns()]);
    nlRenderPreview();
    nlRenderCampaignsTable();
    setMsg(els.newsMsg, 'ok', 'Newsletter ready ✅');
    setTimeout(() => setMsg(els.newsMsg, '', ''), 900);
  } catch (e) {
    console.error(e);
    setMsg(els.newsMsg, 'err', e?.message || String(e));
  }
}

/* ===================== AUTH FLOW ===================== */
async function refreshAuthUI() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    showView("login");
    setMsg(els.loginMsg, '', '');
    return;
  }

  if (els.whoami) els.whoami.textContent = session.user?.email || session.user?.id || '—';

  try {
    const ok = await isAdmin();
    if (!ok) {
      showView("denied");
      return;
    }

    showView("dash");

    // load all datasets
    await Promise.all([loadOrders(), loadBuyRequests(), loadAuctions()]);
    renderOrdersTable();
    renderBuyTable();
    renderAuctionsTable();

    // newsletter (optional)
    if (nlHasUI()) {
      await nlReloadAll();
    }

  } catch (e) {
    console.error(e);
    showView("login");
    setMsg(els.loginMsg, 'err', `Auth chyba: ${e?.message || e}`);
  }
}

/* ===================== EVENTS ===================== */
document.addEventListener("DOMContentLoaded", async () => {
  // Tabs
  els.tabOrders?.addEventListener('click', () => setTab('orders'));
  els.tabBuy?.addEventListener('click', () => setTab('buy'));
  els.tabAuc?.addEventListener('click', () => setTab('auc'));
  els.tabNews?.addEventListener('click', () => {
    setTab('news');
    // render preview “just in case”
    if (nlHasUI()) nlRenderPreview();
  });

  // Login
  els.loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(els.loginMsg, '', '');

    const email = String(els.loginEmail?.value || '').trim();
    const password = String(els.loginPassword?.value || '');

    if (!email || !password) {
      setMsg(els.loginMsg, 'err', 'Vyplň email i heslo.');
      return;
    }

    if (els.loginBtn) {
      els.loginBtn.disabled = true;
      els.loginBtn.textContent = 'Přihlašuji…';
    }

    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMsg(els.loginMsg, 'ok', 'Přihlášeno ✅');
      await refreshAuthUI();
    } catch (err) {
      console.error(err);
      setMsg(els.loginMsg, 'err', `Nešlo přihlásit: ${err?.message || err}`);
    } finally {
      if (els.loginBtn) {
        els.loginBtn.disabled = false;
        els.loginBtn.textContent = 'Přihlásit';
      }
    }
  });

  // Logout
  async function logout() {
    await sb.auth.signOut();
    showView("login");
  }
  els.logoutBtn?.addEventListener("click", logout);
  els.deniedLogoutBtn?.addEventListener("click", logout);

  // Reload
  els.refreshBtn?.addEventListener("click", async () => {
    try {
      setMsg(els.dashMsg, '', '');
      await Promise.all([loadOrders(), loadBuyRequests(), loadAuctions()]);
      renderOrdersTable();
      renderBuyTable();
      renderAuctionsTable();

      if (nlHasUI()) await nlReloadAll();

      setMsg(els.dashMsg, 'ok', 'Reload ✅');
      setTimeout(() => setMsg(els.dashMsg, '', ''), 900);

      if (AUC_EDIT_ID) {
        const updated = AUCTIONS.find(x => x.id === AUC_EDIT_ID);
        if (updated) fillAucEditor(updated);
      }
    } catch (e) {
      console.error(e);
      setMsg(els.dashMsg, 'err', e?.message || String(e));
    }
  });

  // Orders filters
  els.searchInput?.addEventListener('input', renderOrdersTable);
  els.statusFilter?.addEventListener('change', renderOrdersTable);
  els.paymentFilter?.addEventListener('change', renderOrdersTable);

  // CSV
  els.exportCsvBtn?.addEventListener('click', exportCsv);

  // Orders action buttons
  els.ordersBody?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;

    const act = btn.dataset.act;
    const id = btn.dataset.id;

    try {
      await doOrderAction(act, id);
    } catch (err) {
      console.error(err);
      alert("Chyba: " + (err?.message || err));
    }
  });

  // Buy filters
  els.buySearchInput?.addEventListener('input', renderBuyTable);
  els.buyTypeFilter?.addEventListener('change', renderBuyTable);
  els.buySort?.addEventListener('change', renderBuyTable);

  // Buy actions
  els.buyBody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-buy-act]');
    if (!btn) return;
    const act = btn.getAttribute('data-buy-act');
    const id = btn.getAttribute('data-buy-id');
    if (!act || !id) return;

    try {
      if (act === 'photos') await showPhotosForRequest(id);
      if (act === 'zip') {
        await showPhotosForRequest(id);
        await downloadZipCurrent();
      }
    } catch (err) {
      console.error(err);
      alert('Chyba: ' + (err?.message || err));
    }
  });

  // Modal events
  els.closeModalBtn?.addEventListener('click', closeModal);
  els.photoModal?.addEventListener('click', (e) => {
    if (e.target === els.photoModal) closeModal();
  });
  els.downloadZipBtn?.addEventListener('click', downloadZipCurrent);

  // ===================== AUKCE EVENTS =====================
  els.aucSearchInput?.addEventListener('input', renderAuctionsTable);
  els.aucPubFilter?.addEventListener('change', renderAuctionsTable);
  els.aucSort?.addEventListener('change', renderAuctionsTable);

  els.aucNewBtn?.addEventListener('click', () => {
    clearAucEditor();
    setTab('auc');
    setMsg(els.aucMsg, '', '');
  });

  els.aucClearBtn?.addEventListener('click', () => {
    clearAucEditor();
    setMsg(els.aucMsg, '', '');
  });

  els.aucForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await saveAuction();
    } catch (err) {
      console.error(err);
      setMsg(els.aucMsg, 'err', err?.message || String(err));
    }
  });

  els.aucUploadBtn?.addEventListener('click', async () => {
    try {
      await uploadAuctionPhotos();
    } catch (err) {
      console.error(err);
      setMsg(els.aucMsg, 'err', err?.message || String(err));
    }
  });

  els.aucBody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-auc-act]');
    if (!btn) return;

    const act = btn.getAttribute('data-auc-act');
    const id = btn.getAttribute('data-auc-id');
    if (!act || !id) return;

    try {
      if (act === 'edit') await editAuction(id);
      if (act === 'toggle') await toggleAuctionPublish(id);
      if (act === 'delete') await deleteAuction(id);
    } catch (err) {
      console.error(err);
      alert('Chyba: ' + (err?.message || err));
    }
  });

  els.aucPhotoGrid?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-aucimg-act]');
    if (!btn) return;

    const act = btn.getAttribute('data-aucimg-act');
    const imgId = btn.getAttribute('data-aucimg-id');
    const path = btn.getAttribute('data-aucimg-path');

    try {
      if (act === 'delete') await deleteAuctionImage(imgId, path);
    } catch (err) {
      console.error(err);
      alert('Chyba: ' + (err?.message || err));
    }
  });

  // ===================== NEWSLETTER EVENTS =====================
  if (nlHasUI()) {
    const rerender = () => nlRenderPreview();

    els.nlNoBuyDays?.addEventListener('change', rerender);
    els.nlNeverBought?.addEventListener('change', rerender);
    els.nlOrdersBucket?.addEventListener('change', rerender);
    els.nlTotalSpentMin?.addEventListener('input', rerender);
    els.nlAovMin?.addEventListener('input', rerender);
    els.nlVipTop10?.addEventListener('change', rerender);
    els.nlHasPending?.addEventListener('change', rerender);
    els.nlExcludeReturned?.addEventListener('change', rerender);
    els.nlPrefLang?.addEventListener('change', rerender);
    els.nlPricePref?.addEventListener('change', rerender);
    els.nlExcludeUnsub?.addEventListener('change', rerender);

    els.nlRefreshBtn?.addEventListener('click', nlReloadAll);
    els.nlExportBtn?.addEventListener('click', nlExportEmailsCsv);

    els.nlSaveCampaignBtn?.addEventListener('click', async () => {
      try {
        setMsg(els.newsMsg, '', '');
        await nlSaveCampaignDraft();
      } catch (e) {
        console.error(e);
        setMsg(els.newsMsg, 'err', e?.message || String(e));
      }
    });

    els.nlCampsBody?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-nl-camp="load"]');
      if (!btn) return;
      const id = btn.getAttribute('data-nl-id');
      if (!id) return;

      try {
        const c = await nlLoadCampaignDetail(id);
        nlFillCampaignEditor(c);
        if (els.nlHtml) els.nlHtml.value = c.html || '';
        // volitelně: můžeš i nacpat segment_json do UI (zatím neřeším auto-apply, je to pain)
        setMsg(els.newsMsg, 'ok', 'Kampaň načtena ✅');
        setTimeout(() => setMsg(els.newsMsg, '', ''), 900);
      } catch (err) {
        console.error(err);
        setMsg(els.newsMsg, 'err', err?.message || String(err));
      }
    });
  }

  // keep UI updated if session changes
  sb.auth.onAuthStateChange(() => {
    refreshAuthUI();
  });

  // init
  setTab('orders');
  clearAucEditor();
  await refreshAuthUI();
});
