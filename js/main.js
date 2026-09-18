/* ── SchemeRoute — main.js ── */

/* Mobile nav toggle */
(function () {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.querySelectorAll('span').forEach((s, i) => {
      s.style.transform = open
        ? (i === 0 ? 'translateY(7px) rotate(45deg)'
          : i === 1 ? 'scaleX(0)' : 'translateY(-7px) rotate(-45deg)')
        : '';
      s.style.opacity = (open && i === 1) ? '0' : '';
    });
  });

  /* Close on link click */
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelectorAll('span').forEach(s => {
        s.style.transform = '';
        s.style.opacity   = '';
      });
    });
  });
})();

/* Scroll-reveal */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
})();

/* Animate gap bars when section scrolls in */
(function () {
  const fills = document.querySelectorAll('.gap-fill[data-width]');
  if (!fills.length) return;

  fills.forEach(f => { f.style.width = '0%'; });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.gap-fill[data-width]').forEach(f => {
          requestAnimationFrame(() => { f.style.width = f.dataset.width; });
        });
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  const section = document.querySelector('.gap-vis');
  if (section) io.observe(section);
})();

/* Active nav highlight on scroll */
(function () {
  const sections = document.querySelectorAll('section[id], div[id]');
  const links    = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active-link'));
        const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (active) active.classList.add('active-link');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => io.observe(s));
})();

/* ── CHATBOT ── */
(function () {
  const btn    = document.getElementById('chatbot-btn');
  const panel  = document.getElementById('chatbot-panel');
  const input  = document.getElementById('chatbot-input');
  const send   = document.getElementById('chatbot-send');
  const msgs   = document.getElementById('chatbot-messages');
  if (!btn || !panel) return;

  /* Canned responses for the demo */
  const responses = [
    "I can check your eligibility across 40+ Central and state-level schemes. Could you tell me your state and business sector?",
    "Based on your profile, you may qualify for NSFDC Micro Credit Finance — loans up to ₹1 lakh at 6% interest for SC/ST entrepreneurs. Want me to run a full eligibility check?",
    "For a tailoring business in Rajasthan, the Rajasthan SCA Term Loan is also a strong option — up to ₹5 lakh at 8% interest. Shall I calculate your EMI for both schemes?",
    "Your estimated monthly EMI would be around ₹1,100–₹1,600 depending on the tenure you choose (3–5 years). I can generate a full financial summary if you'd like.",
    "To apply for NSFDC Micro Credit Finance you'll need: Aadhaar, caste certificate, income proof, and a basic project report. I can generate your document checklist right now.",
    "Great! I've prepared your personalized document checklist. Head to the Documents section in your dashboard to see the full list with direct links to official sources."
  ];
  let responseIndex = 0;

  function scrollToBottom () {
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addMessage (text, who) {
    const msg  = document.createElement('div');
    msg.className = `chat-msg ${who}`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = text;

    const time = document.createElement('div');
    time.className = 'chat-time';
    time.textContent = 'Just now';

    msg.appendChild(bubble);
    msg.appendChild(time);
    msgs.appendChild(msg);
    scrollToBottom();
  }

  function showTyping () {
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot';
    typing.id = 'typing-indicator';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-typing';
    bubble.innerHTML = '<span></span><span></span><span></span>';

    typing.appendChild(bubble);
    msgs.appendChild(typing);
    scrollToBottom();
    return typing;
  }

  function sendMessage () {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    const typing = showTyping();

    setTimeout(() => {
      typing.remove();
      const reply = responses[responseIndex % responses.length];
      responseIndex++;
      addMessage(reply, 'bot');
    }, 900 + Math.random() * 400);
  }

  /* Toggle panel */
  function toggleChat () {
    const open = panel.classList.toggle('open');
    btn.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', !open);
    if (open) {
      scrollToBottom();
      setTimeout(() => input.focus(), 220);
    }
  }

  btn.addEventListener('click', toggleChat);
  btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') toggleChat(); });

  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  /* Close when clicking outside */
  document.addEventListener('click', e => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && !btn.contains(e.target)) {
      panel.classList.remove('open');
      btn.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
  });
})();

/* ── SCHEMEROUTE DASHBOARD INTERACTIVE LOGIC ── */
(function () {
  /* 1. Dashboard Tab Navigation */
  const navItems = document.querySelectorAll('.ui-nav-item[data-tab]');
  const panels = document.querySelectorAll('.ui-tab-panel');

  function switchTab(tabId) {
    navItems.forEach(item => {
      const isMatch = item.dataset.tab === tabId;
      item.classList.toggle('active', isMatch);
      item.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.tab) {
        switchTab(item.dataset.tab);
      }
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (item.dataset.tab) switchTab(item.dataset.tab);
      }
    });
  });

  /* 2. My Profile: View & Edit Interactions */
  const profileForm = document.getElementById('profile-form');
  const profileEditToggle = document.getElementById('profile-edit-toggle');
  const profileEditBtnText = document.getElementById('profile-edit-btn-text');
  const profileCancelBtn = document.getElementById('profile-cancel-btn');
  const profileAlert = document.getElementById('profile-alert');
  const viewProfileName = document.getElementById('view-profile-name');

  if (profileEditToggle && profileForm) {
    function setEditMode(isEdit) {
      if (isEdit) {
        profileForm.classList.remove('profile-view-mode');
        profileForm.classList.add('profile-edit-mode');
        if (profileEditBtnText) profileEditBtnText.textContent = 'Cancel Edit';
      } else {
        profileForm.classList.add('profile-view-mode');
        profileForm.classList.remove('profile-edit-mode');
        if (profileEditBtnText) profileEditBtnText.textContent = 'Edit Profile';
      }
    }

    profileEditToggle.addEventListener('click', () => {
      const isCurrentlyEdit = profileForm.classList.contains('profile-edit-mode');
      setEditMode(!isCurrentlyEdit);
    });

    if (profileCancelBtn) {
      profileCancelBtn.addEventListener('click', () => {
        setEditMode(false);
      });
    }

    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);

      // Update bound elements
      formData.forEach((val, key) => {
        const boundEl = profileForm.querySelector(`[data-bind="${key}"]`);
        if (boundEl) {
          if (key === 'phone') {
            boundEl.innerHTML = `${val} <span class="badge-mini-verified">Verified</span>`;
          } else {
            boundEl.textContent = val;
          }
        }
      });

      const fullName = formData.get('fullname');
      if (fullName && viewProfileName) {
        viewProfileName.textContent = fullName;
        const avatar = document.querySelector('.profile-avatar');
        if (avatar) {
          const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
          if (initials) avatar.textContent = initials;
        }
      }

      setEditMode(false);

      if (profileAlert) {
        profileAlert.style.display = 'flex';
        setTimeout(() => {
          profileAlert.style.display = 'none';
        }, 4000);
      }
    });
  }

  /* 3. Financial Calculator: Interactive EMI & Breakdown */
  const calcAmount = document.getElementById('calc-amount');
  const calcTenure = document.getElementById('calc-tenure');
  const calcRate = document.getElementById('calc-rate');
  const calcMargin = document.getElementById('calc-margin');

  const calcAmountDisplay = document.getElementById('calc-amount-display');
  const calcTenureDisplay = document.getElementById('calc-tenure-display');
  const calcRateDisplay = document.getElementById('calc-rate-display');
  const calcMarginDisplay = document.getElementById('calc-margin-display');

  const calcResEmi = document.getElementById('calc-res-emi');
  const calcResTotalCost = document.getElementById('calc-res-total-cost');
  const calcResDownpayment = document.getElementById('calc-res-downpayment');
  const calcResPrincipal = document.getElementById('calc-res-principal');
  const calcResInterest = document.getElementById('calc-res-interest');
  const calcResTotalRepay = document.getElementById('calc-res-total-repay');
  const calcResMinprofit = document.getElementById('calc-res-minprofit');

  const pills = document.querySelectorAll('.calc-pill');

  function formatInr(val) {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  }

  function updateCalculator() {
    if (!calcAmount || !calcTenure || !calcRate || !calcMargin) return;

    const totalCost = parseFloat(calcAmount.value) || 100000;
    const years = parseFloat(calcTenure.value) || 3;
    const rateAnnual = parseFloat(calcRate.value) || 6;
    const marginPercent = parseFloat(calcMargin.value) || 10;

    const downpayment = (totalCost * marginPercent) / 100;
    const principal = Math.max(0, totalCost - downpayment);

    // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const n = years * 12;
    const r = rateAnnual / (12 * 100);

    let emi = 0;
    if (r === 0) {
      emi = principal / n;
    } else {
      emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalRepay = emi * n;
    const totalInterest = Math.max(0, totalRepay - principal);
    const minProfit = emi * 2;

    // Update displays
    if (calcAmountDisplay) calcAmountDisplay.textContent = formatInr(totalCost);
    if (calcTenureDisplay) calcTenureDisplay.textContent = `${years} Year${years > 1 ? 's' : ''} (${n} mos)`;
    if (calcRateDisplay) calcRateDisplay.textContent = `${rateAnnual.toFixed(1)}% p.a.`;
    if (calcMarginDisplay) calcMarginDisplay.textContent = `${marginPercent}% (${formatInr(downpayment)})`;

    if (calcResEmi) calcResEmi.textContent = formatInr(emi);
    if (calcResTotalCost) calcResTotalCost.textContent = formatInr(totalCost);
    if (calcResDownpayment) calcResDownpayment.textContent = formatInr(downpayment);
    if (calcResPrincipal) calcResPrincipal.textContent = formatInr(principal);
    if (calcResInterest) calcResInterest.textContent = formatInr(totalInterest);
    if (calcResTotalRepay) calcResTotalRepay.textContent = formatInr(totalRepay);
    if (calcResMinprofit) calcResMinprofit.textContent = Math.round(minProfit).toLocaleString('en-IN');
  }

  if (calcAmount && calcTenure && calcRate && calcMargin) {
    [calcAmount, calcTenure, calcRate, calcMargin].forEach(input => {
      input.addEventListener('input', () => {
        if (input === calcAmount) {
          pills.forEach(p => {
            p.classList.toggle('active', parseInt(p.dataset.amount, 10) === parseInt(calcAmount.value, 10));
          });
        }
        updateCalculator();
      });
    });

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        calcAmount.value = pill.dataset.amount;
        updateCalculator();
      });
    });

    updateCalculator();
  }

  /* 4. Documents: Management, Upload & Preview Modal */
  const docModalOverlay = document.getElementById('doc-modal-overlay');
  const docModalClose = document.getElementById('doc-modal-close');
  const docModalCloseBtn = document.getElementById('doc-modal-close-btn');
  const docModalDocname = document.getElementById('doc-modal-docname');
  const docModalFilename = document.getElementById('doc-modal-filename');
  const docModalFilesize = document.getElementById('doc-modal-filesize');
  const docModalFiledate = document.getElementById('doc-modal-filedate');
  const docModalFilestatus = document.getElementById('doc-modal-filestatus');

  function openDocModal(name, filename, size, date, status) {
    if (!docModalOverlay) return;
    if (docModalDocname) docModalDocname.textContent = name || 'Document';
    if (docModalFilename) docModalFilename.textContent = filename || 'file.pdf';
    if (docModalFilesize) docModalFilesize.textContent = size || '-';
    if (docModalFiledate) docModalFiledate.textContent = date || '-';
    if (docModalFilestatus) {
      const isVerified = (status || '').toLowerCase().includes('verified');
      docModalFilestatus.innerHTML = `<span class="doc-badge ${isVerified ? 'verified' : 'review'}">${status}</span>`;
    }
    docModalOverlay.style.display = 'flex';
    docModalOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeDocModal() {
    if (!docModalOverlay) return;
    docModalOverlay.style.display = 'none';
    docModalOverlay.setAttribute('aria-hidden', 'true');
  }

  if (docModalClose) docModalClose.addEventListener('click', closeDocModal);
  if (docModalCloseBtn) docModalCloseBtn.addEventListener('click', closeDocModal);
  if (docModalOverlay) {
    docModalOverlay.addEventListener('click', (e) => {
      if (e.target === docModalOverlay) closeDocModal();
    });
  }

  // Bind view buttons
  function bindDocViewButtons() {
    document.querySelectorAll('.doc-btn-view').forEach(btn => {
      btn.onclick = () => {
        openDocModal(
          btn.dataset.name,
          btn.dataset.file,
          btn.dataset.size,
          btn.dataset.date,
          btn.dataset.status
        );
      };
    });
  }
  bindDocViewButtons();

  // Document Upload Handling
  const docFileInput = document.getElementById('doc-file-input');
  const uploadDocSelect = document.getElementById('upload-doc-select');
  const docFeedback = document.getElementById('doc-upload-feedback');
  const docsUploadedCount = document.getElementById('docs-uploaded-count');
  const docsMissingCount = document.getElementById('docs-missing-count');
  const docsProgFill = document.getElementById('docs-prog-fill');
  const dropzone = document.getElementById('docs-dropzone');

  function handleFileUpload(fileName, docType) {
    const type = docType || (uploadDocSelect ? uploadDocSelect.value : 'Document');
    const cleanName = fileName || `${type.toLowerCase().replace(/[^a-z0-9]/g, '_')}_file.pdf`;

    // Locate matching item in list
    let targetItem = null;
    if (type.includes('Bank')) targetItem = document.querySelector('[data-id="doc-bank"]');
    else if (type.includes('Business')) targetItem = document.querySelector('[data-id="doc-biz"]');
    else if (type.includes('Aadhaar')) targetItem = document.querySelector('[data-id="doc-aadhaar"]');
    else if (type.includes('Caste')) targetItem = document.querySelector('[data-id="doc-caste"]');
    else if (type.includes('Income')) targetItem = document.querySelector('[data-id="doc-income"]');

    if (targetItem) {
      targetItem.classList.remove('missing-item');
      const iconWrap = targetItem.querySelector('.doc-icon-wrap');
      if (iconWrap) {
        iconWrap.className = 'doc-icon-wrap review';
        iconWrap.innerHTML = `<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>`;
      }
      const details = targetItem.querySelector('.doc-details');
      if (details) {
        details.textContent = `File: ${cleanName} · 1.4 MB · Uploaded on Just now`;
      }
      const statusCol = targetItem.querySelector('.doc-status-col');
      if (statusCol) {
        statusCol.innerHTML = `<span class="doc-badge review">Under Review</span>`;
      }
      const actionsCol = targetItem.querySelector('.doc-actions-col');
      if (actionsCol) {
        actionsCol.innerHTML = `<button type="button" class="doc-btn-view" data-name="${type}" data-file="${cleanName}" data-size="1.4 MB" data-date="Today" data-status="Under Review">View</button>`;
      }
      bindDocViewButtons();
    }

    // Update missing count & progress
    const remainingMissing = document.querySelectorAll('.doc-item.missing-item').length;
    const totalDocs = 5;
    const uploaded = totalDocs - remainingMissing;

    if (docsUploadedCount) docsUploadedCount.textContent = uploaded;
    if (docsMissingCount) {
      if (remainingMissing > 0) {
        docsMissingCount.textContent = `${remainingMissing} Missing Document${remainingMissing > 1 ? 's' : ''}`;
      } else {
        docsMissingCount.textContent = `All Documents Uploaded`;
        docsMissingCount.style.background = 'rgba(26,107,58,.12)';
        docsMissingCount.style.color = '#1a6b3a';
      }
    }
    if (docsProgFill) {
      docsProgFill.style.width = `${(uploaded / totalDocs) * 100}%`;
    }

    if (docFeedback) {
      docFeedback.className = 'doc-upload-feedback success';
      docFeedback.style.display = 'block';
      docFeedback.innerHTML = `✓ <strong>${cleanName}</strong> uploaded successfully for <em>${type}</em>. Status updated to Under Review.`;
      setTimeout(() => {
        docFeedback.style.display = 'none';
      }, 5000);
    }
  }

  if (docFileInput) {
    docFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileUpload(e.target.files[0].name, uploadDocSelect ? uploadDocSelect.value : null);
        docFileInput.value = '';
      }
    });
  }

  // Upload button triggers inside items
  document.querySelectorAll('.doc-btn-upload-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const targetDoc = trigger.dataset.target;
      if (uploadDocSelect && targetDoc) {
        uploadDocSelect.value = targetDoc;
      }
      if (docFileInput) docFileInput.click();
    });
  });

  // Drag and Drop
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });
    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0].name, uploadDocSelect ? uploadDocSelect.value : null);
      }
    });
  }

  /* 5. AI Advisor: Interactive Conversations */
  const advisorWindow = document.getElementById('advisor-chat-window');
  const advisorInput = document.getElementById('dash-advisor-input');
  const advisorSend = document.getElementById('dash-advisor-send');
  const promptChips = document.querySelectorAll('.prompt-chip');

  const advisorKnowledgeBase = [
    {
      keywords: ['document', 'prepare', 'paperwork', 'need'],
      reply: 'Generally, small business loan applications require 4 core documents: <strong>1) Aadhaar card</strong> for ID & location, <strong>2) Caste Certificate</strong> (for SC/ST concession/eligibility), <strong>3) Income Certificate</strong> or basic self-declaration, and <strong>4) Bank Passbook / statement</strong> (last 6 months). A trade permit or electricity bill for your shop is also helpful.'
    },
    {
      keywords: ['emi', 'interest', 'calculate', 'tenure'],
      reply: 'EMI is calculated using a reducing-balance formula based on three factors: loan principal, annual interest rate, and repayment duration (tenure). Lower interest rates and longer tenures keep your monthly installment smaller and easier to service from regular business earnings.'
    },
    {
      keywords: ['caste', 'sc', 'st', 'certificate'],
      reply: 'SC/ST certificates should be issued by an authorized state authority (such as a Tehsildar or Sub-Divisional Magistrate). Ensure the name on your caste certificate matches your Aadhaar and bank records exactly to avoid loan processing delays.'
    },
    {
      keywords: ['income', 'certificate', 'how to get'],
      reply: 'An income certificate can be obtained from your local revenue office (e-Mitra in Rajasthan, Tehsil office, or your state citizen services portal). For micro-enterprises with informal accounts, a sworn affidavit or self-declaration of annual household income is accepted for several schemes.'
    },
    {
      keywords: ['subsidy', 'margin', 'contribution'],
      reply: 'Margin money or own contribution is the portion you invest yourself (typically 5%–10% of total project cost). Certain social welfare schemes offer capital subsidies that reduce the principal loan amount, lowering your overall repayment burden.'
    }
  ];

  function getAdvisorResponse(query) {
    const q = query.toLowerCase();
    for (const item of advisorKnowledgeBase) {
      if (item.keywords.some(k => q.includes(k))) {
        return item.reply;
      }
    }
    return 'That is an important question. For small businesses, eligibility depends primarily on your social category, residential location, and verifiable enterprise activity. You can prepare your basic documents in the Documents tab or simulate installments in Financial Calc to stay application-ready!';
  }

  function appendAdvisorMessage(text, role) {
    if (!advisorWindow) return;
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = text;

    const time = document.createElement('div');
    time.className = 'chat-time';
    time.textContent = 'Just now';

    msg.appendChild(bubble);
    msg.appendChild(time);
    advisorWindow.appendChild(msg);
    advisorWindow.scrollTop = advisorWindow.scrollHeight;
    return msg;
  }

  function sendAdvisorMessage(text) {
    const q = (text || (advisorInput ? advisorInput.value : '')).trim();
    if (!q) return;

    appendAdvisorMessage(q, 'user');
    if (advisorInput) advisorInput.value = '';

    // Show typing
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot';
    typing.innerHTML = '<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>';
    advisorWindow.appendChild(typing);
    advisorWindow.scrollTop = advisorWindow.scrollHeight;

    setTimeout(() => {
      typing.remove();
      const reply = getAdvisorResponse(q);
      appendAdvisorMessage(reply, 'bot');
    }, 700 + Math.random() * 300);
  }

  if (advisorSend && advisorInput) {
    advisorSend.addEventListener('click', () => sendAdvisorMessage());
    advisorInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendAdvisorMessage();
    });
  }

  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      sendAdvisorMessage(chip.dataset.prompt);
    });
  });
})();
