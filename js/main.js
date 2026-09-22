/* ══════════════════════════════════════════════════
   Farmer INT System — main.js
══════════════════════════════════════════════════ */

/* ── Mock data ── */
const MOCK_USER = {
  name: 'Ramesh Kumar',
  email: 'ramesh.kumar@example.com',
  initials: 'RK',
};

const MOCK_DOCS = [
  { id: 1, name: 'Aadhaar Card',            sub: 'XXXX XXXX 4521',          type: 'Identity',   date: '12 Aug 2026', status: 'verified' },
  { id: 2, name: 'Caste Certificate',        sub: 'SC Category',             type: 'Eligibility', date: '14 Aug 2026', status: 'verified' },
  { id: 3, name: 'Income Certificate',       sub: 'Annual income ₹2.4L',    type: 'Financial',  date: '18 Aug 2026', status: 'review'   },
  { id: 4, name: 'Bank Statement (6 months)', sub: 'Last 6 months required', type: 'Financial',  date: '—',           status: 'missing'  },
  { id: 5, name: 'Project Report',           sub: 'Business plan document',  type: 'Business',   date: '—',           status: 'missing'  },
];

const SEARCH_INDEX = [
  { icon: '🌾', name: 'NSFDC Micro Credit Finance', sub: 'Loans up to ₹1 lakh at 6% for SC/ST', category: 'Scheme', page: 'home' },
  { icon: '📋', name: 'Rajasthan SCA Term Loan',    sub: 'Up to ₹5 lakh for SC entrepreneurs',   category: 'Scheme', page: 'home' },
  { icon: '🏦', name: 'Stand-Up India',             sub: '₹10L–₹1Cr for SC/ST/Women',           category: 'Scheme', page: 'home' },
  { icon: '👤', name: 'My Profile',                 sub: 'View and edit personal information',   category: 'Page',   page: 'profile' },
  { icon: '📄', name: 'My Documents',               sub: 'Upload and manage your documents',     category: 'Page',   page: 'docs' },
  { icon: '🧮', name: 'Finance Calculator',         sub: 'Estimate EMI and loan repayment',      category: 'Page',   page: 'calc' },
  { icon: '📊', name: 'Impact Statistics',          sub: '40+ schemes, ₹10K Cr disbursed',       category: 'Info',   page: 'home' },
  { icon: '📋', name: 'Aadhaar Card',               sub: 'Identity document — Verified',          category: 'Document', page: 'docs' },
  { icon: '📋', name: 'Caste Certificate',          sub: 'Eligibility document — Verified',       category: 'Document', page: 'docs' },
  { icon: '📋', name: 'Income Certificate',         sub: 'Financial document — Under Review',     category: 'Document', page: 'docs' },
];


const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8000';

/* ══════════════════════════════════════════════════
   1. AUTH
══════════════════════════════════════════════════ */
(function () {
  const overlay  = document.getElementById('auth-overlay');
  const app      = document.getElementById('app');
  const formSI   = document.getElementById('form-signin');
  const formSU   = document.getElementById('form-signup');
  const goSignup = document.getElementById('go-signup');
  const goSignin = document.getElementById('go-signin');
  const btnSI    = document.getElementById('btn-signin');
  const btnSU    = document.getElementById('btn-signup');

  function showForm(form) {
    if (!formSI || !formSU) return;
    formSI.classList.remove('active');
    formSU.classList.remove('active');
    form.classList.add('active');
    clearErrors();
  }

  goSignup && goSignup.addEventListener('click', (e) => { e.preventDefault(); showForm(formSU); });
  goSignin && goSignin.addEventListener('click', (e) => { e.preventDefault(); showForm(formSI); });

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; });
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
  }

  function setError(inputId, errId, msg) {
    const input = document.getElementById(inputId);
    const err   = document.getElementById(errId);
    if (input) input.classList.add('error');
    if (err) err.textContent = msg;
    return false;
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function launchApp(name, email) {
    if (!overlay || !app) return;
    overlay.style.display = 'none';
    app.classList.remove('hidden');

    const safeName = String(name || 'Farmer User').trim();
    const safeEmail = String(email || localStorage.getItem('user_email') || '').trim();
    const initials = safeName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'FU';
    const navAvatar = document.getElementById('nav-avatar');
    if (navAvatar) navAvatar.textContent = initials;

    localStorage.setItem('user_email', safeEmail);
    localStorage.setItem('user_name', safeName);

    MOCK_USER.name = safeName;
    MOCK_USER.email = safeEmail;
    MOCK_USER.initials = initials;

    updateProfileDisplay();
    renderDocs();
    calculateEMI();
  }

  async function checkExistingSession() {
    const savedName = localStorage.getItem('user_name');
    const savedEmail = localStorage.getItem('user_email');

    if (savedEmail) launchApp(savedName || 'Farmer User', savedEmail);
  }

  btnSI && btnSI.addEventListener('click', async () => {
    clearErrors();
    const email = document.getElementById('si-email').value.trim();
    const pw    = document.getElementById('si-password').value;

    let ok = true;
    if (!email) ok = setError('si-email', 'si-email-err', 'Email is required.') && ok;
    else if (!isEmail(email)) ok = setError('si-email', 'si-email-err', 'Enter a valid email.') && ok;
    if (!pw) ok = setError('si-password', 'si-pw-err', 'Password is required.') && ok;
    if (!ok) return;

    btnSI.textContent = 'Signing in...';
    btnSI.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw })
      });

      const data = await res.json();

      if (!res.ok) {
        setError('si-email', 'si-email-err', data.detail || 'Login failed');
        return;
      }

      const name = data.name || email.split('@')[0];
      launchApp(name, email);
    } catch (err) {
      setError('si-email', 'si-email-err', 'Cannot connect to server.');
    } finally {
      btnSI.textContent = 'Sign In';
      btnSI.disabled = false;
    }
  });

  btnSU && btnSU.addEventListener('click', async () => {
    clearErrors();
    const name    = document.getElementById('su-name').value.trim();
    const email   = document.getElementById('su-email').value.trim();
    const pw      = document.getElementById('su-password').value;
    const confirm = document.getElementById('su-confirm').value;
    const terms   = document.getElementById('su-terms').checked;

    let ok = true;
    if (!name) ok = setError('su-name', 'su-name-err', 'Full name is required.') && ok;
    if (!email) ok = setError('su-email', 'su-email-err', 'Email is required.') && ok;
    else if (!isEmail(email)) ok = setError('su-email', 'su-email-err', 'Enter a valid email.') && ok;
    if (!pw) ok = setError('su-password', 'su-pw-err', 'Password is required.') && ok;
    else if (pw.length < 6) ok = setError('su-password', 'su-pw-err', 'Password must be at least 6 chars.') && ok;
    if (!confirm) ok = setError('su-confirm', 'su-confirm-err', 'Please confirm password.') && ok;
    else if (pw !== confirm) ok = setError('su-confirm', 'su-confirm-err', 'Passwords do not match.') && ok;
    if (!terms) {
      const err = document.getElementById('su-terms-err');
      if (err) err.textContent = 'You must agree to the Terms.';
      ok = false;
    }
    if (!ok) return;

    btnSU.textContent = 'Creating account...';
    btnSU.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pw })
      });

      const data = await res.json();

      if (!res.ok) {
        setError('su-email', 'su-email-err', data.detail || 'Registration failed');
        return;
      }

      launchApp(name, email);
    } catch (err) {
      setError('su-email', 'su-email-err', 'Cannot connect to server.');
    } finally {
      btnSU.textContent = 'Create Account';
      btnSU.disabled = false;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (!overlay || overlay.style.display === 'none') return;
    if (formSI && formSI.classList.contains('active') && btnSI) btnSI.click();
    if (formSU && formSU.classList.contains('active') && btnSU) btnSU.click();
  });

  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.style.opacity = input.type === 'text' ? '1' : '.5';
    });
  });

  checkExistingSession();
})();


/* ══════════════════════════════════════════════════
   2. APP ROUTING (page switching)
══════════════════════════════════════════════════ */
(function () {
  window.navigateTo = function (pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
      p.style.display = '';
    });
    // Show target
    const target = document.getElementById('page-' + pageName);
    if (target) { target.classList.add('active'); target.style.display = ''; }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageName);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile nav if open
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.remove('open');
  };

  // Nav link clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (!link || !document.getElementById('app') || document.getElementById('app').classList.contains('hidden')) return;
    const page = link.dataset.page;
    if (!page) return;
    e.preventDefault();
    navigateTo(page);
  });

  // Button page-go shortcuts
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page-go]');
    if (!btn) return;
    e.preventDefault();
    navigateTo(btn.dataset.pageGo);
  });
})();


/* ══════════════════════════════════════════════════
   3. MOBILE NAV TOGGLE
══════════════════════════════════════════════════ */
(function () {
  const mobileBtn = document.getElementById('nav-mobile-btn');
  const navLinks  = document.getElementById('nav-links');
  if (!mobileBtn || !navLinks) return;

  mobileBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    mobileBtn.setAttribute('aria-expanded', open);
    const spans = mobileBtn.querySelectorAll('span');
    spans.forEach((s, i) => {
      s.style.transform = open
        ? (i === 0 ? 'translateY(7px) rotate(45deg)' : i === 1 ? 'scaleX(0)' : 'translateY(-7px) rotate(-45deg)')
        : '';
      s.style.opacity = (open && i === 1) ? '0' : '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !mobileBtn.contains(e.target)) {
      navLinks.classList.remove('open');
      mobileBtn.setAttribute('aria-expanded', 'false');
      mobileBtn.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
})();


/* ══════════════════════════════════════════════════
   4. SCROLL REVEAL
══════════════════════════════════════════════════ */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
})();


/* ══════════════════════════════════════════════════
   5. PROFILE PAGE
══════════════════════════════════════════════════ */
function updateProfileDisplay() {
  const nameEl   = document.getElementById('profile-display-name');
  const emailEl  = document.getElementById('profile-display-email');
  const avatarEl = document.getElementById('profile-avatar-display');
  const navAv    = document.getElementById('nav-avatar');

  const nameVal  = document.getElementById('p-name')  ? document.getElementById('p-name').value : MOCK_USER.name;
  const emailVal = document.getElementById('p-email') ? document.getElementById('p-email').value : MOCK_USER.email;
  const initials = nameVal.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (nameEl)   nameEl.textContent  = nameVal;
  if (emailEl)  emailEl.textContent = emailVal;
  if (avatarEl) avatarEl.textContent = initials;
  if (navAv)    navAv.textContent    = initials;
}

(function () {
  const editBtn    = document.getElementById('profile-edit-btn');
  const saveBtn    = document.getElementById('profile-save-btn');
  const cancelBtn  = document.getElementById('profile-cancel-btn');
  const saveRow    = document.getElementById('profile-save-row');
  const allInputs  = () => document.querySelectorAll('#page-profile .field-input');

  let originalValues = {};

  function setEditable(on) {
    allInputs().forEach(inp => { inp.disabled = !on; });
    if (saveRow) saveRow.classList.toggle('hidden', !on);
    if (editBtn) editBtn.style.display = on ? 'none' : '';
  }

  editBtn && editBtn.addEventListener('click', () => {
    // Snapshot current values
    allInputs().forEach(inp => { originalValues[inp.id] = inp.value; });
    setEditable(true);
  });

  cancelBtn && cancelBtn.addEventListener('click', () => {
    // Restore snapshots
    allInputs().forEach(inp => {
      if (originalValues[inp.id] !== undefined) inp.value = originalValues[inp.id];
    });
    setEditable(false);
  });

  saveBtn && saveBtn.addEventListener('click', async () => {
const name = document.getElementById('p-name').value;
const email = document.getElementById('p-email').value;
const phone = document.getElementById('p-phone').value;

try {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, email, phone })
  });

  if (response.ok) {
    updateProfileDisplay();
    setEditable(false);

    const old = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved';
    saveBtn.style.background = '#16A34A';
    setTimeout(() => { saveBtn.textContent = old; saveBtn.style.background = ''; }, 2000);
  }
} catch (err) {
  alert('Failed to save profile');
}
});
})();


/* ══════════════════════════════════════════════════
   6. MY DOCS PAGE
══════════════════════════════════════════════════ */
let docs = MOCK_DOCS.map(d => ({ ...d }));

function updateDocStats() {
  const total    = docs.length;
  const verified = docs.filter(d => d.status === 'verified').length;
  const review   = docs.filter(d => d.status === 'review').length;
  const missing  = docs.filter(d => d.status === 'missing').length;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-total', total);
  set('stat-verified', verified);
  set('stat-review', review);
  set('stat-missing', missing);
}

function renderDocs() {
  const tbody = document.getElementById('docs-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  docs.forEach(doc => {
    const row = document.createElement('div');
    row.className = 'doc-row';
    row.dataset.id = doc.id;

    const statusLabel = { verified: '✓ Verified', review: '⏳ Under Review', missing: '⚠ Missing' }[doc.status];

    row.innerHTML = `
      <div>
        <div class="doc-name">${doc.name}</div>
        <div class="doc-name-sub">${doc.sub}</div>
      </div>
      <div class="doc-type">${doc.type}</div>
      <div class="doc-date">${doc.date}</div>
      <div><span class="doc-status-badge ${doc.status}">${statusLabel}</span></div>
      <div class="doc-actions">
        <button class="doc-action-btn" data-action="view" data-id="${doc.id}" title="View" aria-label="View ${doc.name}">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2-4.5 6-4.5S13 7 13 7s-2 4.5-6 4.5S1 7 1 7z" stroke="currentColor" stroke-width="1.3"/><circle cx="7" cy="7" r="1.75" stroke="currentColor" stroke-width="1.3"/></svg>
        </button>
        <button class="doc-action-btn" data-action="download" data-id="${doc.id}" title="Download" aria-label="Download ${doc.name}">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 11h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
        <button class="doc-action-btn delete" data-action="delete" data-id="${doc.id}" title="Delete" aria-label="Delete ${doc.name}">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5h6.6L11 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `;
    tbody.appendChild(row);
  });

  updateDocStats();

  // Action handlers
  tbody.querySelectorAll('.doc-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id     = parseInt(btn.dataset.id);
      const doc    = docs.find(d => d.id === id);
      if (!doc) return;

      if (action === 'view') {
        alert(`Viewing: ${doc.name}\nType: ${doc.type}\nStatus: ${doc.status}\nUploaded: ${doc.date}`);
      } else if (action === 'download') {
        if (doc.status === 'missing') {
          alert('This document has not been uploaded yet.');
        } else {
          alert(`Downloading: ${doc.name}\n(In a real app this would trigger a file download)`);
        }
      } else if (action === 'delete') {
        if (confirm(`Delete "${doc.name}"? This cannot be undone.`)) {
          docs = docs.filter(d => d.id !== id);
          renderDocs();
        }
      }
    });
  });
}

(function () {
  const uploadBtn   = document.getElementById('upload-doc-btn');
  const uploadZone  = document.getElementById('upload-zone');
  const zoneClose   = document.getElementById('upload-zone-close');
  const fileInput   = document.getElementById('file-input');

  uploadBtn && uploadBtn.addEventListener('click', () => {
    uploadZone && uploadZone.classList.toggle('hidden');
  });
  zoneClose && zoneClose.addEventListener('click', () => {
    uploadZone && uploadZone.classList.add('hidden');
  });

  /* Drag and drop */
  uploadZone && uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '#EA580C';
  });
  uploadZone && uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = '';
  });
  uploadZone && uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '';
    handleFiles(e.dataTransfer.files);
  });

  fileInput && fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });

  function handleFiles(files) {
    if (!files || !files.length) return;
    Array.from(files).forEach(file => {
      const newDoc = {
        id:     Date.now() + Math.random(),
        name:   file.name.replace(/\.[^.]+$/, ''),
        sub:    `${(file.size / 1024).toFixed(0)} KB`,
        type:   'Uploaded',
        date:   new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
        status: 'review',
      };
      docs.push(newDoc);
    });
    renderDocs();
    uploadZone && uploadZone.classList.add('hidden');
  }
})();


/* ══════════════════════════════════════════════════
   7. FINANCE CALCULATOR
══════════════════════════════════════════════════ */
function formatINR(n) {
  if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + 'Cr';
  if (n >= 100000)   return '₹' + (n/100000).toFixed(1) + 'L';
  if (n >= 1000)     return '₹' + (n/1000).toFixed(0) + 'K';
  return '₹' + n.toLocaleString('en-IN');
}
function formatINRFull(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function calculateEMI() {
  const amountSlider = document.getElementById('c-amount');
  const downSlider   = document.getElementById('c-down');
  const rateSlider   = document.getElementById('c-rate');
  const tenureSlider = document.getElementById('c-tenure');
  const incomeSlider = document.getElementById('c-income');
  if (!amountSlider) return;

  const amount  = parseFloat(amountSlider.value);
  const down    = parseFloat(downSlider.value);
  const rate    = parseFloat(rateSlider.value);
  const tenure  = parseFloat(tenureSlider.value);
  const income  = parseFloat(incomeSlider.value);

  const principal   = Math.max(0, amount - down);
  const monthlyRate = rate / 100 / 12;
  const months      = tenure * 12;

  let emi = 0;
  if (monthlyRate === 0) {
    emi = principal / months;
  } else {
    emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  }
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;
  const emiPct = income > 0 ? (emi / income) * 100 : 0;

  // Display updates
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('c-amount-disp',  formatINRFull(amount));
  set('c-down-disp',    formatINRFull(down));
  set('c-rate-disp',    rate.toFixed(1) + '%');
  set('c-tenure-disp',  tenure + ' year' + (tenure > 1 ? 's' : ''));
  set('c-income-disp',  formatINRFull(income));

  set('calc-emi',    formatINRFull(emi));
  set('r-loan',      formatINRFull(amount));
  set('r-down',      formatINRFull(down));
  set('r-principal', formatINRFull(principal));
  set('r-rate',      rate.toFixed(1) + '% p.a.');
  set('r-tenure',    tenure + ' year' + (tenure > 1 ? 's' : '') + ' (' + months + ' months)');
  set('r-interest',  formatINRFull(totalInterest));
  set('r-total',     formatINRFull(totalPayment));

  // EMI note
  const emiNote = document.querySelector('.emi-hero-note');
  if (emiNote) emiNote.textContent = `Based on ${formatINRFull(principal)} principal over ${tenure} year${tenure > 1 ? 's' : ''}`;

  // Affordability
  const affordPct  = document.getElementById('afford-pct');
  const affordFill = document.getElementById('afford-fill');
  const affordNote = document.getElementById('afford-note');
  if (affordPct)  affordPct.textContent  = emiPct.toFixed(1) + '%';
  if (affordFill) {
    affordFill.style.width = Math.min(emiPct, 100) + '%';
    affordFill.className   = 'afford-fill' + (emiPct > 50 ? ' danger' : emiPct > 40 ? ' warn' : '');
  }
  if (affordNote) {
    if (income === 0) {
      affordNote.textContent = '— Set a monthly income to see affordability.';
    } else if (emiPct <= 40) {
      affordNote.textContent = `✅ EMI is ${emiPct.toFixed(1)}% of monthly income — this loan appears manageable.`;
    } else if (emiPct <= 60) {
      affordNote.textContent = `⚠️ EMI is ${emiPct.toFixed(1)}% of monthly income — this may strain your budget.`;
    } else {
      affordNote.textContent = `❌ EMI is ${emiPct.toFixed(1)}% of monthly income — consider a smaller loan or longer tenure.`;
    }
  }
}

(function () {
  const sliders = ['c-amount', 'c-down', 'c-rate', 'c-tenure', 'c-income'];
  sliders.forEach(id => {
    const el = document.getElementById(id);
    el && el.addEventListener('input', calculateEMI);
  });

  // Preset pills
  document.querySelectorAll('.preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const s = (id, val) => { const el = document.getElementById(id); if (el) { el.value = val; } };
      s('c-amount', pill.dataset.amount || 100000);
      s('c-rate',   pill.dataset.rate   || 6);
      s('c-tenure', pill.dataset.tenure || 3);
      s('c-down',   pill.dataset.down   || 10000);
      calculateEMI();
    });
  });

  // Track manual changes to clear preset active state
  sliders.forEach(id => {
    const el = document.getElementById(id);
    el && el.addEventListener('input', () => {
      // Don't clear active on every input — only clear if values mismatch
    });
  });
})();


/* ══════════════════════════════════════════════════
   8. SEARCH
══════════════════════════════════════════════════ */
(function () {
  const searchBtn     = document.getElementById('nav-search-btn');
  const overlay       = document.getElementById('search-overlay');
  const overlayBg     = document.getElementById('search-bg');
  const closeBtn      = document.getElementById('search-close-btn');
  const input         = document.getElementById('search-input');
  const resultsEl     = document.getElementById('search-results');
  if (!searchBtn || !overlay) return;

  function openSearch() {
    overlay.classList.remove('hidden');
    setTimeout(() => input && input.focus(), 50);
  }
  function closeSearch() {
    overlay.classList.add('hidden');
    if (input) input.value = '';
    if (resultsEl) resultsEl.innerHTML = '<p class="search-empty-state">Start typing to search…</p>';
  }

  searchBtn.addEventListener('click', openSearch);
  closeBtn && closeBtn.addEventListener('click', closeSearch);
  overlayBg && overlayBg.addEventListener('click', closeSearch);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeSearch();
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.contains('hidden') ? openSearch() : closeSearch();
    }
  });

  input && input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      resultsEl.innerHTML = '<p class="search-empty-state">Start typing to search…</p>';
      return;
    }
    const matches = SEARCH_INDEX.filter(item =>
      item.name.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
    if (!matches.length) {
      resultsEl.innerHTML = '<p class="search-no-results">No results found for "<strong>' + q + '</strong>"</p>';
      return;
    }
    resultsEl.innerHTML = matches.map(m => `
      <div class="search-result-item" data-page="${m.page}">
        <div class="search-result-icon">${m.icon}</div>
        <div class="search-result-text">
          <div class="search-result-name">${m.name}</div>
          <div class="search-result-sub">${m.sub}</div>
        </div>
        <span class="search-result-category">${m.category}</span>
      </div>
    `).join('');

    resultsEl.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) navigateTo(page);
        closeSearch();
      });
    });
  });
})();


/* ══════════════════════════════════════════════════
   9. ACTIVE NAV HIGHLIGHT
══════════════════════════════════════════════════ */
// Handled by navigateTo() — no extra scroll listener needed for SPA.


/* ══════════════════════════════════════════════════
   10. INITIAL STATE
══════════════════════════════════════════════════ */
// Set page-home as the default active page on load (kept hidden until login)
document.addEventListener('DOMContentLoaded', () => {
  // All pages except home start hidden
  document.querySelectorAll('.page').forEach(p => {
    if (p.id !== 'page-home') p.classList.remove('active');
  });
  const home = document.getElementById('page-home');
  if (home) home.classList.add('active');
});
document.addEventListener('DOMContentLoaded', () => {
checkExistingSession();
// ... rest of your code
});

function logout() {
localStorage.removeItem('token');
localStorage.removeItem('username');
window.location.reload();
}

// Add to nav avatar click
document.getElementById('nav-avatar')?.addEventListener('click', () => {
if (confirm('Logout?')) {
  logout();
}
});