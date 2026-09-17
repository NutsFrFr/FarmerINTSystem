/* ── SchemeRoute — main.js ── */

/* ── Mobile nav ── */
(function () {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.querySelectorAll('span').forEach((s, i) => {
      s.style.transform = open
        ? (i === 0 ? 'translateY(7px) rotate(45deg)' : i === 1 ? 'scaleX(0)' : 'translateY(-7px) rotate(-45deg)')
        : '';
      s.style.opacity = (open && i === 1) ? '0' : '';
    });
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });
})();

/* ── Filtering ── */
(function () {
  const searchInput   = document.getElementById('search-input');
  const stageFilter   = document.getElementById('filter-stage');
  const sectorFilter  = document.getElementById('filter-sector');
  const stateFilter   = document.getElementById('filter-state');
  const typeFilter    = document.getElementById('filter-type');
  const eligFilter    = document.getElementById('filter-eligibility');
  const fundingFilter = document.getElementById('filter-funding');
  const resetBtn      = document.getElementById('reset-btn');
  const cards         = document.querySelectorAll('.scheme-card');
  const matchCount    = document.getElementById('match-count');

  function getCardText(card) {
    return card.textContent.toLowerCase();
  }

  function applyFilters() {
    const q         = (searchInput.value || '').toLowerCase().trim();
    const type      = typeFilter.value;
    const sector    = sectorFilter.value;
    const state     = stateFilter.value;
    const elig      = eligFilter.value;
    const funding   = fundingFilter.value;

    let visible = 0;
    cards.forEach(card => {
      const text      = getCardText(card);
      const cardType  = card.dataset.type    || '';
      const cardSec   = card.dataset.sector  || '';
      const cardState = card.dataset.state   || '';
      const cardElig  = card.dataset.eligibility || '';
      const cardFund  = card.dataset.funding || '';

      const matchQ    = !q      || text.includes(q);
      const matchType = !type   || cardType   === type;
      const matchSec  = !sector || cardSec    === sector;
      const matchState= !state  || cardState  === state || state === '';
      const matchElig = !elig   || cardElig   === elig;
      const matchFund = !funding|| cardFund   === funding;

      // For state filter: "All India" shows all
      const stateOk = stateFilter.value === '' || cardState === stateFilter.value;

      const show = matchQ && matchType && matchSec && stateOk && matchElig && matchFund;
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });

    matchCount.textContent = `${visible} illustrative scheme match${visible === 1 ? '' : 'es'}`;
  }

  [searchInput, stageFilter, sectorFilter, stateFilter, typeFilter, eligFilter, fundingFilter]
    .forEach(el => el && el.addEventListener('input', applyFilters));

  resetBtn && resetBtn.addEventListener('click', () => {
    [searchInput, stageFilter, sectorFilter, stateFilter, typeFilter, eligFilter, fundingFilter]
      .forEach(el => { if (el) el.value = ''; });
    applyFilters();
  });
})();

/* ── Floating Assistant ── */
(function () {
  const btn    = document.getElementById('ask-btn');
  const panel  = document.getElementById('ask-panel');
  const input  = document.getElementById('ask-input');
  const send   = document.getElementById('ask-send');
  const close  = document.getElementById('ask-close');
  const msgs   = document.getElementById('ask-messages');
  if (!btn || !panel) return;

  const responses = [
    "I can check your eligibility across 40+ Central and state-level schemes. Could you tell me your state and business sector?",
    "Based on your profile, you may qualify for <strong>NSFDC Micro Credit Finance</strong> — loans up to ₹1 lakh at 6% interest for SC/ST entrepreneurs. Want me to run a full eligibility check?",
    "For a tailoring business in Rajasthan, the <strong>Rajasthan SCA Term Loan</strong> is also a strong option — up to ₹5 lakh at 8% interest. Shall I calculate your EMI for both schemes?",
    "Your estimated monthly EMI would be around <strong>₹1,100–₹1,600</strong> depending on the tenure you choose (3–5 years). I can generate a full financial summary if you'd like.",
    "To apply you'll need: Aadhaar, caste certificate, income proof, and a basic project report. I can generate your document checklist right now.",
    "I've prepared your personalized checklist. Head to the Documents section in your dashboard to see the full list with links to official sources."
  ];
  let idx = 0;

  function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }

  function addMsg(text, who) {
    const wrap   = document.createElement('div');
    wrap.className = `ask-msg ${who}`;
    const bubble = document.createElement('div');
    bubble.className = 'ask-bubble';
    bubble.innerHTML = text;
    const time   = document.createElement('div');
    time.className = 'ask-time';
    time.textContent = 'Just now';
    wrap.appendChild(bubble);
    wrap.appendChild(time);
    msgs.appendChild(wrap);
    scrollBottom();
  }

  function showTyping() {
    const wrap   = document.createElement('div');
    wrap.className = 'ask-msg bot ask-typing';
    wrap.id = 'typing';
    const bubble = document.createElement('div');
    bubble.className = 'ask-bubble';
    bubble.innerHTML = '<span></span><span></span><span></span>';
    wrap.appendChild(bubble);
    msgs.appendChild(wrap);
    scrollBottom();
    return wrap;
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    const typing = showTyping();
    setTimeout(() => {
      typing.remove();
      addMsg(responses[idx % responses.length], 'bot');
      idx++;
    }, 900 + Math.random() * 400);
  }

  function togglePanel() {
    const open = panel.classList.toggle('open');
    panel.setAttribute('aria-hidden', !open);
    if (open) { scrollBottom(); setTimeout(() => input.focus(), 220); }
  }

  btn.addEventListener('click', togglePanel);
  close && close.addEventListener('click', togglePanel);
  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  document.addEventListener('click', e => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && !btn.contains(e.target)) {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
  });
})();
