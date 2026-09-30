/* ══════════════════════════════════════════════════
   SchemeRoute — main.js
══════════════════════════════════════════════════ */

/* ── Mock data ── */
const MOCK_USER = {
  name: 'John Doe',
  email: 'johndoe@example.com',
  initials: 'JD',
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
  { icon: '📊', name: 'Impact Statistics',          sub: '80+ schemes, ₹10K Cr disbursed',       category: 'Info',   page: 'home' },
  { icon: '📋', name: 'Aadhaar Card',               sub: 'Identity document — Verified',          category: 'Document', page: 'docs' },
  { icon: '📋', name: 'Caste Certificate',          sub: 'Eligibility document — Verified',       category: 'Document', page: 'docs' },

  { icon: '📋', name: 'Income Certificate',         sub: 'Financial document — Under Review',     category: 'Document', page: 'docs' },
];

/* ══════════════════════════════════════════════════
   SCHEMES — loaded from schemes.json
══════════════════════════════════════════════════ */

// Derive a display score (0–100) from visits_30_days.
// Max observed visits used as ceiling so scores spread nicely.
function schemeScore(visits) {
  if (!visits || visits <= 0) return Math.floor(Math.random() * 20) + 10; // null → low random 10–30
  // Normalise against 100 as a soft ceiling (91 is the max in the dataset)
  return Math.min(100, Math.round((visits / 100) * 100));
}

function scoreTier(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'med';
  return 'low';
}

function schemeTypeTag(tags) {
  if (!tags || !tags.length) return { label: 'Scheme', cls: 'grant' };
  const t = tags.map(s => s.toLowerCase());
  if (t.some(x => x.includes('loan') || x.includes('credit') || x.includes('finance'))) return { label: 'Loan',    cls: 'loan'    };
  if (t.some(x => x.includes('subsid')))                                                  return { label: 'Subsidy', cls: 'subsidy' };
  if (t.some(x => x.includes('dbt') || x.includes('direct benefit')))                    return { label: 'DBT',     cls: 'subsidy' };
  if (t.some(x => x.includes('insur')))                                                   return { label: 'Insurance', cls: 'grant' };
  return { label: 'Grant', cls: 'grant' };
}

function renderSchemeCards(schemes) {
  const grid = document.getElementById('schemes-grid');
  if (!grid) return;

  // Also update SEARCH_INDEX with all scheme names so global search works
  schemes.forEach(s => {
    const exists = SEARCH_INDEX.some(idx => idx.name === s.name);
    if (!exists) {
      SEARCH_INDEX.push({
        icon: '🌾',
        name: s.name,
        sub: s.state_or_ministry || '',
        category: 'Scheme',
        page: 'home',
      });
    }
  });

  // Show top 6 on the home page; rest available via search
  const featured = schemes.slice(0, 6);

  grid.innerHTML = featured.map(s => {
    const score = schemeScore(s.visits_30_days);
    const tier  = scoreTier(score);
    const type  = schemeTypeTag(s.tags);
    const loc   = s.state_or_ministry
      ? (s.state_or_ministry.toLowerCase().startsWith('ministry') ? '🏛 National' : '📍 ' + s.state_or_ministry)
      : '🏛 India';
    const tagHtml = (s.tags || []).slice(0, 2).map(t => `<span class="scheme-tag">🏷 ${t}</span>`).join('');

    return `
      <div class="scheme-card reveal">
        <div class="scheme-card-head">
          <span class="match-badge ${tier}">${score}% Match</span>
          <span class="scheme-type-tag ${type.cls}">${type.label}</span>
        </div>
        <h3 class="scheme-name">${s.name}</h3>
        <p class="scheme-desc">${(s.description || '').slice(0, 120).trim()}${s.description && s.description.length > 120 ? '…' : ''}</p>
        <div class="scheme-tags">
          <span class="scheme-tag">${loc}</span>
          ${tagHtml}
        </div>
        <div class="scheme-card-actions">
          <button class="btn-card-primary">Apply Now</button>
          <button class="btn-card-ghost">Learn More</button>
        </div>
      </div>`;
  }).join('');

  // Re-observe reveal elements added dynamically
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    grid.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }
}

// Fetch and render schemes — called once on DOMContentLoaded
function loadSchemes() {
  fetch('./schemes.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(schemes => {
      // Sort: highest visits first (null → end)
      schemes.sort((a, b) => (b.visits_30_days || 0) - (a.visits_30_days || 0));
      renderSchemeCards(schemes);
    })
    .catch(err => {
      console.warn('Could not load schemes.json:', err);
      // Graceful fallback: leave grid with a message
      const grid = document.getElementById('schemes-grid');
      if (grid && !grid.children.length) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#6B7280;padding:2rem">Schemes unavailable. Please refresh or check your connection.</p>';
      }
    });
}

const API_BASE_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:8000'
  : '/api';

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

    // Restore any previously-saved profile data
    const savedName  = localStorage.getItem('user_name');
    const savedEmail = localStorage.getItem('user_email');

    const safeName  = String(savedName || name || 'John Doe').trim();
    const safeEmail = String(savedEmail || email || '').trim();
    const initials  = safeName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'FU';
    const navAvatar = document.getElementById('nav-avatar');
    if (navAvatar) navAvatar.textContent = initials;

    localStorage.setItem('user_email', safeEmail);
    localStorage.setItem('user_name', safeName);

    MOCK_USER.name    = safeName;
    MOCK_USER.email   = safeEmail;
    MOCK_USER.initials = initials;

    // Pre-fill profile inputs from saved data
    const pName  = document.getElementById('p-name');
    const pEmail = document.getElementById('p-email');
    if (pName)  pName.value  = safeName;
    if (pEmail) pEmail.value = safeEmail;

    // Restore saved eligibility fields
    ['p-phone','p-location','p-dob','p-gender','p-category','p-income','p-biz','p-stage','p-aadhaar','p-pan'].forEach(id => {
      const saved = localStorage.getItem('profile_' + id);
      const el = document.getElementById(id);
      if (saved && el) el.value = saved;
    });

    updateProfileDisplay();
    renderDocs();
    calculateEMI();
  }

  btnSI && btnSI.addEventListener('click', () => {
    clearErrors();
    const email = document.getElementById('si-email').value.trim();
    const pw    = document.getElementById('si-password').value;

    let ok = true;
    if (!email) ok = setError('si-email', 'si-email-err', 'Email is required.') && ok;
    if (!pw) ok = setError('si-password', 'si-pw-err', 'Password is required.') && ok;
    if (!ok) return;

    launchApp('John Doe', email);
  });

  btnSU && btnSU.addEventListener('click', () => {
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

    launchApp(name, email);
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

})();


/* ══════════════════════════════════════════════════
   2. APP ROUTING (page switching)
══════════════════════════════════════════════════ */
(function () {
  window.navigateTo = function (pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
      p.style.display = 'none';
    });
    // Show target
    const target = document.getElementById('page-' + pageName);
    if (target) { target.classList.remove('hidden'); target.classList.add('active'); target.style.display = 'block'; }

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
    if (!link) return;
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

function updateProfileChips() {
  const loc      = document.getElementById('p-location');
  const category = document.getElementById('p-category');
  const chips    = document.querySelector('.profile-chips');
  if (!chips) return;
  const locVal  = loc      ? loc.value.trim()                                    : 'India';
  const catVal  = category ? category.options[category.selectedIndex].text       : '';
  // Update location chip (index 1) and category chip (index 2) if they exist
  const allChips = chips.querySelectorAll('.profile-chip');
  if (allChips[1]) allChips[1].textContent = '📍 ' + (locVal || 'India');
  if (allChips[2] && catVal) allChips[2].textContent = '🏷 ' + catVal;
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

  saveBtn && saveBtn.addEventListener('click', () => {
    const name  = document.getElementById('p-name').value.trim()  || MOCK_USER.name;
    const email = document.getElementById('p-email').value.trim() || MOCK_USER.email;

    MOCK_USER.name  = name;
    MOCK_USER.email = email;
    localStorage.setItem('user_name',  name);
    localStorage.setItem('user_email', email);

    // Persist all eligibility fields
    ['p-phone','p-location','p-dob','p-gender','p-category','p-income','p-biz','p-stage','p-aadhaar','p-pan'].forEach(id => {
      const el = document.getElementById(id);
      if (el) localStorage.setItem('profile_' + id, el.value);
    });

    updateProfileDisplay();
    updateProfileChips();
    setEditable(false);
    showToast('Profile saved successfully', 'success');
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
        showDocModal(doc);
      } else if (action === 'download') {
        if (doc.status === 'missing') {
          showToast('This document hasn\'t been uploaded yet.', 'warn');
        } else {
          showToast(`Downloading "${doc.name}"…`, 'info');
          // In a real app this would trigger a signed URL download
        }
      } else if (action === 'delete') {
        showConfirmModal(
          `Delete "${doc.name}"?`,
          'This action cannot be undone.',
          () => {
            docs = docs.filter(d => d.id !== id);
            renderDocs();
            showToast(`"${doc.name}" deleted.`, 'success');
          }
        );
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
// Keep the authentication screen visible until login succeeds.
document.addEventListener('DOMContentLoaded', () => {
  // Clear legacy stored name/email so John Doe defaults always apply
  const storedName = localStorage.getItem('user_name');
  if (storedName && storedName !== 'John Doe') {
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
  }
  document.getElementById('auth-overlay')?.style.removeProperty('display');
  document.getElementById('app')?.classList.add('hidden');

  document.querySelectorAll('.page').forEach(p => {
    if (p.id !== 'page-home') p.classList.remove('active');
  });
  const home = document.getElementById('page-home');
  if (home) home.classList.add('active');

  // Load scheme cards from JSON
  loadSchemes();
});

function logout() {
  document.getElementById('app')?.classList.add('hidden');
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.style.removeProperty('display');
  document.getElementById('form-signin')?.classList.add('active');
  document.getElementById('form-signup')?.classList.remove('active');
}

document.getElementById('nav-avatar')?.addEventListener('click', () => {
  if (confirm('Logout?')) logout();
});

/* ══════════════════════════════════════════════════
   UTILITIES — Toast, Doc Modal, Confirm Modal
══════════════════════════════════════════════════ */

/* ── Toast ── */
function showToast(message, type = 'info') {
  // Remove any existing toast
  document.querySelectorAll('.fi-toast').forEach(t => t.remove());

  const icons = { success: '✅', warn: '⚠️', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `fi-toast fi-toast-${type}`;
  toast.innerHTML = `<span class="fi-toast-icon">${icons[type] || icons.info}</span><span class="fi-toast-msg">${message}</span>`;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => toast.classList.add('fi-toast-show'));

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.remove('fi-toast-show');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

/* ── Doc viewer modal ── */
function showDocModal(doc) {
  closeModal();
  const statusLabel = { verified: '✓ Verified', review: '⏳ Under Review', missing: '⚠ Missing' }[doc.status] || doc.status;
  const statusCls   = doc.status;

  const modal = document.createElement('div');
  modal.id = 'fi-modal';
  modal.className = 'fi-modal-overlay';
  modal.innerHTML = `
    <div class="fi-modal-box" role="dialog" aria-modal="true" aria-label="Document details">
      <div class="fi-modal-header">
        <h3 class="fi-modal-title">${doc.name}</h3>
        <button class="fi-modal-close" aria-label="Close" id="fi-modal-close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="fi-modal-body">
        <div class="fi-doc-preview-icon">📄</div>
        <table class="fi-doc-table">
          <tr><td>Document</td><td><strong>${doc.name}</strong></td></tr>
          <tr><td>Details</td><td>${doc.sub}</td></tr>
          <tr><td>Type</td><td>${doc.type}</td></tr>
          <tr><td>Uploaded</td><td>${doc.date}</td></tr>
          <tr><td>Status</td><td><span class="doc-status-badge ${statusCls}">${statusLabel}</span></td></tr>
        </table>
      </div>
      <div class="fi-modal-footer">
        ${doc.status !== 'missing' ? `<button class="btn-primary" id="fi-modal-dl">Download</button>` : ''}
        <button class="btn-outline-sm" id="fi-modal-cancel">Close</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('fi-modal-show'));

  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.getElementById('fi-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('fi-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('fi-modal-dl')?.addEventListener('click', () => {
    showToast(`Downloading "${doc.name}"…`, 'info');
    closeModal();
  });
  document.addEventListener('keydown', escModal);
}

/* ── Confirm modal ── */
function showConfirmModal(title, subtitle, onConfirm) {
  closeModal();
  const modal = document.createElement('div');
  modal.id = 'fi-modal';
  modal.className = 'fi-modal-overlay';
  modal.innerHTML = `
    <div class="fi-modal-box fi-modal-sm" role="dialog" aria-modal="true">
      <div class="fi-modal-header">
        <h3 class="fi-modal-title">${title}</h3>
        <button class="fi-modal-close" id="fi-modal-close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="fi-modal-body">
        <p class="fi-confirm-sub">${subtitle}</p>
      </div>
      <div class="fi-modal-footer">
        <button class="btn-primary fi-btn-danger" id="fi-modal-confirm">Delete</button>
        <button class="btn-outline-sm" id="fi-modal-cancel">Cancel</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('fi-modal-show'));

  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.getElementById('fi-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('fi-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('fi-modal-confirm')?.addEventListener('click', () => {
    closeModal();
    onConfirm && onConfirm();
  });
  document.addEventListener('keydown', escModal);
}

function escModal(e) { if (e.key === 'Escape') closeModal(); }
function closeModal() {
  const m = document.getElementById('fi-modal');
  if (!m) return;
  m.classList.remove('fi-modal-show');
  document.removeEventListener('keydown', escModal);
  setTimeout(() => m.remove(), 280);
}

/* ── Slider track fill (progress tint behind thumb) ── */
function updateSliderFill(slider) {
  if (!slider) return;
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 100;
  const val = parseFloat(slider.value) || 0;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--orange) ${pct}%, var(--gray-200) ${pct}%)`;
}

(function () {
  ['c-amount','c-down','c-rate','c-tenure','c-income'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    updateSliderFill(el);
    el.addEventListener('input', () => updateSliderFill(el));
  });
})();

/* ── Docs filter tabs ── */
(function () {
  const filterBar = document.querySelector('.docs-table-card');
  if (!filterBar) return;

  const tabsHtml = `<div class="docs-filter-tabs" id="docs-filter-tabs">
    <button class="docs-tab active" data-filter="all">All</button>
    <button class="docs-tab" data-filter="verified">Verified</button>
    <button class="docs-tab" data-filter="review">Under Review</button>
    <button class="docs-tab" data-filter="missing">Missing</button>
  </div>`;
  filterBar.insertAdjacentHTML('beforebegin', tabsHtml);

  let currentFilter = 'all';

  document.getElementById('docs-filter-tabs')?.addEventListener('click', e => {
    const tab = e.target.closest('.docs-tab');
    if (!tab) return;
    document.querySelectorAll('.docs-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    applyDocFilter();
  });

  window.__applyDocFilter = function () {
    const rows = document.querySelectorAll('.doc-row');
    rows.forEach(row => {
      const id  = parseInt(row.dataset.id);
      const doc = docs.find(d => d.id === id || String(d.id) === String(row.dataset.id));
      if (!doc) return;
      const show = currentFilter === 'all' || doc.status === currentFilter;
      row.style.display = show ? '' : 'none';
    });
  };

  function applyDocFilter() { window.__applyDocFilter && window.__applyDocFilter(); }

  // Patch renderDocs to call filter after each render
  const _origRenderDocs = window.renderDocs;
  // (renderDocs is called after insert; filter applied after render via MutationObserver)
  const obs = new MutationObserver(() => applyDocFilter());
  const body = document.getElementById('docs-table-body');
  if (body) obs.observe(body, { childList: true });
})();


/* ══════════════════════════════════════════════════
   AI CHATBOT WIDGET
══════════════════════════════════════════════════ */
(function () {
  const fab      = document.getElementById('chatbot-fab');
  const panel    = document.getElementById('chatbot-panel');
  const closeBtn = document.getElementById('chatbot-close');
  const messages = document.getElementById('cb-messages');
  const input    = document.getElementById('cb-input');
  const sendBtn  = document.getElementById('cb-send');
  const chips    = document.querySelectorAll('.cb-chip');
  const suggestionsEl = document.getElementById('cb-suggestions');

  if (!fab || !panel) return;

  // Hide chatbot if app is not yet launched (auth screen showing)
  const appEl = document.getElementById('app');
  function syncFabVisibility() {
    if (appEl && appEl.classList.contains('hidden')) {
      fab.classList.add('hidden');
    } else {
      fab.classList.remove('hidden');
    }
  }
  syncFabVisibility();
  // Watch for app becoming visible after login
  const visObs = new MutationObserver(syncFabVisibility);
  if (appEl) visObs.observe(appEl, { attributes: true, attributeFilter: ['class'] });

  // Toggle panel
  fab.addEventListener('click', () => {
    const isOpen = panel.classList.contains('cb-open');
    panel.classList.toggle('cb-open', !isOpen);
    panel.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    if (!isOpen) { setTimeout(() => input.focus(), 220); }
  });
  closeBtn.addEventListener('click', () => {
    panel.classList.remove('cb-open');
    panel.setAttribute('aria-hidden', 'true');
  });

  // Suggestion chips
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.textContent.trim();
      addMessage(text, 'user');
      suggestionsEl.style.display = 'none';
      respond(text);
    });
  });

  // Send on Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });
  sendBtn.addEventListener('click', handleSend);

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    suggestionsEl.style.display = 'none';
    addMessage(text, 'user');
    respond(text);
  }

  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = 'cb-msg cb-msg--' + role;
    const bubble = document.createElement('div');
    bubble.className = 'cb-bubble';
    bubble.textContent = text;
    div.appendChild(bubble);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'cb-msg cb-msg--bot cb-typing';
    div.id = 'cb-typing-indicator';
    const bubble = document.createElement('div');
    bubble.className = 'cb-bubble';
    bubble.textContent = 'SchemeRoute AI is typing…';
    div.appendChild(bubble);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('cb-typing-indicator');
    if (t) t.remove();
  }

  function addBotMessage(text) {
    removeTyping();
    const div = document.createElement('div');
    div.className = 'cb-msg cb-msg--bot';
    const bubble = document.createElement('div');
    bubble.className = 'cb-bubble';
    bubble.innerHTML = text;
    div.appendChild(bubble);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  // ── Scheme-aware response engine ──
  let schemesData = [];
  // Grab schemes after they load
  setTimeout(() => {
    fetch('./schemes.json').then(r => r.json()).then(d => { schemesData = d; }).catch(() => {});
  }, 800);

  function findSchemes(query) {
    if (!schemesData.length) return [];
    const q = query.toLowerCase();
    return schemesData.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(q))) ||
      (s.state_or_ministry && s.state_or_ministry.toLowerCase().includes(q))
    ).slice(0, 3);
  }

  function schemeListHtml(schemes) {
    return schemes.map(s =>
      `<b>${s.name}</b> — ${(s.description || '').slice(0, 80)}…`
    ).join('<br><br>');
  }

  const KB = [
    {
      keys: ['pm-kisan', 'pm kisan', 'kisan samman', 'kisan'],
      reply: `<b>PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)</b> gives ₹6,000/year (₹2,000 every 4 months) directly to small and marginal farmers' bank accounts.<br><br>✅ <b>Eligibility:</b> Land-holding farmers with cultivable land<br>📄 <b>Apply at:</b> pmkisan.gov.in or nearest CSC centre<br>📌 Aadhaar + bank account + land records required.`
    },
    {
      keys: ['solar', 'pump', 'kusum', 'pm kusum'],
      reply: `<b>PM-KUSUM (Solar Pump Scheme)</b> provides up to 60% subsidy for solar-powered irrigation pumps.<br><br>✅ Individual farmers and FPOs are eligible<br>💡 Capacity: 2HP to 10HP solar pumps<br>📄 Apply through your state agriculture department portal.`
    },
    {
      keys: ['crop insurance', 'fasal bima', 'pmfby', 'insurance'],
      reply: `<b>PMFBY (Pradhan Mantri Fasal Bima Yojana)</b> provides affordable crop insurance.<br><br>💰 Farmer pays only 2% premium for Kharif, 1.5% for Rabi crops<br>✅ Covers natural calamities, pests, diseases<br>📄 Apply through your bank, CSC, or pmfby.gov.in before the cut-off date.`
    },
    {
      keys: ['loan', 'credit', 'kcc', 'kisan credit card'],
      reply: `<b>Kisan Credit Card (KCC)</b> provides flexible, low-interest crop loans up to ₹3 lakh at ~4% interest p.a. (with interest subvention).<br><br>✅ All farmers, share-croppers, and tenant farmers eligible<br>📄 Apply at any nationalized bank, cooperative bank, or NABARD-linked branch.`
    },
    {
      keys: ['subsidy', 'equipment', 'machinery', 'tractor', 'mechanisation'],
      reply: `Several schemes offer machinery subsidies:<br><br>🚜 <b>SMAM</b> — Sub-Mission on Agricultural Mechanisation gives 40-50% subsidy on tractors, harvesters, and implements.<br>💧 <b>PMKSY</b> — Pradhan Mantri Krishi Sinchayee Yojana provides drip/sprinkler irrigation subsidy of up to 55%.<br><br>Apply through your state agriculture department.`
    },
    {
      keys: ['organic', 'paramparagat', 'natural farming'],
      reply: `<b>Paramparagat Krishi Vikas Yojana (PKVY)</b> promotes organic farming with ₹50,000/hectare support over 3 years.<br><br>✅ Groups of 50 farmers forming clusters are eligible<br>🌿 Covers certification, inputs, and marketing assistance<br>📄 Apply through your state agriculture department.`
    },
    {
      keys: ['eligib', 'eligible', 'qualify', 'who can apply', 'am i'],
      reply: `Eligibility varies by scheme, but common factors include:<br><br>👤 Land ownership or tenancy proof<br>📇 Valid Aadhaar linked to bank account<br>🏘 SC/ST/OBC/General category (affects priority in some schemes)<br>🌾 Type of farming (crop, horticulture, animal husbandry, fisheries)<br><br>Try searching a specific scheme above, or ask me about a particular one!`
    },
    {
      keys: ['apply', 'application', 'how to', 'process', 'documents'],
      reply: `<b>How to apply for most government schemes:</b><br><br>1️⃣ Visit the official portal or nearest CSC (Common Service Centre)<br>2️⃣ Keep ready: Aadhaar, bank passbook, land records, caste certificate (if applicable)<br>3️⃣ Fill the application form online or at the CSC<br>4️⃣ Track status on the scheme's official portal<br><br>Which specific scheme would you like to apply for?`
    },
    {
      keys: ['hello', 'hi', 'hey', 'namaste', 'help'],
      reply: `👋 Hello! I'm your SchemeRoute AI assistant.<br><br>I can help you with:<br>• Finding government schemes for farmers<br>• Eligibility criteria for specific schemes<br>• Application process and documents needed<br>• Subsidies for equipment, solar, irrigation<br>• Crop loans and insurance<br><br>What would you like to know?`
    },
    {
      keys: ['thank', 'thanks', 'thx', 'great', 'awesome', 'helpful'],
      reply: `You're welcome! 😊 Feel free to ask anything else about government schemes or farmer support programmes. I'm here to help!`
    },
  ];

  function getReply(query) {
    const q = query.toLowerCase();

    // Check knowledge base first
    for (const entry of KB) {
      if (entry.keys.some(k => q.includes(k))) {
        return entry.reply;
      }
    }

    // Scheme search from loaded JSON
    const found = findSchemes(q);
    if (found.length) {
      return `Here are some matching schemes I found:<br><br>${schemeListHtml(found)}<br><br>Would you like more details on any of these?`;
    }

    // Fallback
    return `I'm not sure about that specific query, but I can help you with:<br><br>• PM-KISAN, PMFBY, KCC, PM-KUSUM<br>• Crop loans, insurance, and subsidies<br>• Organic farming and equipment support<br>• Eligibility and application process<br><br>Try rephrasing your question or pick one of the suggestions above!`;
  }

  function respond(query) {
    sendBtn.disabled = true;
    addTyping();
    setTimeout(() => {
      const reply = getReply(query);
      addBotMessage(reply);
      sendBtn.disabled = false;
      input.focus();
    }, 650 + Math.random() * 400);
  }
})();
