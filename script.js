'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initSkillBars();
  initMetricCounters();
  initTracker();
  initContactForm();
  setFooterYear();
});

/* ── 1. NAVBAR ── */
function initNavbar() {
  const header    = document.getElementById('siteHeader');
  const navList   = document.getElementById('navList');
  const navToggle = document.getElementById('navToggle');
  const navItems  = navList.querySelectorAll('.nav-item');

  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const linkMap = new Map();
  navItems.forEach(link => linkMap.set(link.getAttribute('href').slice(1), link));

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const link = linkMap.get(entry.target.id);
        if (!link) return;
        navItems.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    },
    { rootMargin: `-${header.offsetHeight}px 0px -55% 0px`, threshold: 0 }
  );

  document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

  navToggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navItems.forEach(item => item.addEventListener('click', closeMenu));

  document.addEventListener('click', (e) => {
    if (!header.contains(e.target) && navList.classList.contains('is-open')) closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navList.classList.contains('is-open')) {
      closeMenu();
      navToggle.focus();
    }
  });

  function closeMenu() {
    navList.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
  }
}

/* ── 2. SCROLL REVEAL ── */
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal, .reveal-children');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const siblings = [...entry.target.parentElement.children].filter(
          c => c.classList.contains('reveal') || c.classList.contains('reveal-children')
        );
        const delay = siblings.indexOf(entry.target) * 80;
        setTimeout(() => entry.target.classList.add('in-view'), delay);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
}

/* ── 3. SKILL BARS ── */
function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill[data-width]');
  if (!fills.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        setTimeout(() => { entry.target.style.width = entry.target.dataset.width + '%'; }, 200);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  fills.forEach(f => observer.observe(f));
}

/* ── 4. HERO METRIC COUNTERS ── */
function initMetricCounters() {
  const counters = document.querySelectorAll('.metric-val[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el       = entry.target;
        const target   = parseFloat(el.dataset.count);
        const suffix   = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const duration = 1400;
        const startTime = performance.now();
        const unitEl   = el.querySelector('.metric-unit');
        const unitHTML = unitEl ? unitEl.outerHTML : '';

        function tick(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = (eased * target).toFixed(decimals) + suffix;
          if (unitHTML) el.insertAdjacentHTML('beforeend', unitHTML);
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach(c => observer.observe(c));
}

/* ── 5. INTERVIEW TRACKER ── */
function initTracker() {
  const STORAGE_KEY = 'pg_tracker_v3';

  const form       = document.getElementById('trackerForm');
  const coInput    = document.getElementById('tCompany');
  const roleInput  = document.getElementById('tRole');
  const statusSel  = document.getElementById('tStatus');
  const coErrEl    = document.getElementById('tCompany-err');
  const listEl     = document.getElementById('trackerList');
  const emptyEl    = document.getElementById('trackerEmpty');
  const summaryEl  = document.getElementById('trackerSummary');
  const filterBtns = document.querySelectorAll('.filter-tab');

  let activeFilter = 'All';

  function loadEntries() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveEntries(entries) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }
    catch (err) { console.warn('LocalStorage write failed:', err); }
  }

  function escapeHTML(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  function render() {
    const all      = loadEntries();
    const filtered = activeFilter === 'All' ? all : all.filter(e => e.status === activeFilter);

    renderSummary(all);
    listEl.innerHTML = '';

    if (!filtered.length) {
      listEl.setAttribute('aria-hidden', 'true');
      emptyEl.removeAttribute('hidden');
      return;
    }

    emptyEl.setAttribute('hidden', '');
    listEl.removeAttribute('aria-hidden');
    filtered.forEach(entry => listEl.appendChild(buildEntryEl(entry)));
  }

  function renderSummary(entries) {
    if (!entries.length) { summaryEl.innerHTML = ''; return; }

    const counts = { Applied: 0, Interviewed: 0, Rejected: 0, Accepted: 0 };
    entries.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });

    summaryEl.innerHTML = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([status, n]) =>
        `<span class="summary-pill summary-pill--${status.toLowerCase()}" aria-label="${n} ${status}">${n} ${status}</span>`
      ).join('');
  }

  function buildEntryEl(entry) {
    const el = document.createElement('div');
    el.className = 'tracker-entry';
    el.setAttribute('role', 'listitem');
    el.dataset.id = entry.id;

    el.innerHTML = `
      <div class="entry-main">
        <p class="entry-company">${escapeHTML(entry.company)}</p>
        ${entry.role ? `<p class="entry-role">${escapeHTML(entry.role)}</p>` : ''}
      </div>
      <time class="entry-date" datetime="${entry.date}" title="${new Date(entry.date).toLocaleDateString()}">
        ${formatDate(entry.date)}
      </time>
      <span class="entry-status entry-status--${entry.status.toLowerCase()}">${entry.status}</span>
      <button class="entry-delete" aria-label="Remove ${escapeHTML(entry.company)} from tracker" data-id="${entry.id}" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    el.querySelector('.entry-delete').addEventListener('click', () => removeEntry(entry.id, el));
    return el;
  }

  function addEntry(company, role, status) {
    const entries = loadEntries();
    entries.unshift({ id: Date.now().toString(), company: company.trim(), role: role.trim(), status, date: new Date().toISOString() });
    saveEntries(entries);
    render();
  }

  function removeEntry(id, el) {
    el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(16px)';
    setTimeout(() => { saveEntries(loadEntries().filter(e => e.id !== id)); render(); }, 220);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const company = coInput.value.trim();
    if (!company) { showFieldError(coInput, coErrEl, 'Company name is required.'); coInput.focus(); return; }
    clearFieldError(coInput, coErrEl);
    addEntry(company, roleInput.value, statusSel.value);
    form.reset();
    coInput.focus();
  });

  coInput.addEventListener('input', () => { if (coInput.value.trim()) clearFieldError(coInput, coErrEl); });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  render();
}

/* ── 6. CONTACT FORM ── */
function initContactForm() {
  const form      = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('cfSubmit');
  const btnLabel  = document.getElementById('cfBtnLabel');
  const successEl = document.getElementById('cfSuccess');

  // Replace YOUR_SCRIPT_ID with your deployed Google Apps Script Web App ID.
  // In your GAS doPost(e), read data via: const data = JSON.parse(e.postData.contents);
  const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyOB2y5oNud6H_fb5wKUkEMTEan1TBYIfENj9e8d1zuzfX80S07bT1FYQrt9Kmj5FZb3A/exec';
  
  const fields = [
    {
      input: document.getElementById('cfName'),
      error: document.getElementById('cfName-err'),
      validate: v => {
        if (!v) return 'Full name is required.';
        if (v.length < 2) return 'Please enter at least 2 characters.';
        return '';
      },
    },
    {
      input: document.getElementById('cfEmail'),
      error: document.getElementById('cfEmail-err'),
      validate: v => {
        if (!v) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Please enter a valid email address.';
        return '';
      },
    },
    {
      input: document.getElementById('cfSubject'),
      error: document.getElementById('cfSubject-err'),
      validate: v => {
        if (!v) return 'Subject is required.';
        if (v.length < 5) return 'Subject must be at least 5 characters.';
        return '';
      },
    },
    {
      input: document.getElementById('cfMessage'),
      error: document.getElementById('cfMessage-err'),
      validate: v => {
        if (!v) return 'Message is required.';
        if (v.length < 20) return 'Message must be at least 20 characters.';
        return '';
      },
    },
  ];

  // Live validation
  fields.forEach(field => {
    field.input.addEventListener('blur', () => validateField(field));
    field.input.addEventListener('input', () => {
      if (field.input.classList.contains('is-invalid')) validateField(field);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successEl.hidden = true;
    successEl.textContent = 'Message received — I\'ll reply within 24 hours. Thank you.';

    const isValid = fields.map(f => validateField(f)).every(Boolean);
    if (!isValid) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const payload = {
      name:      document.getElementById('cfName').value.trim(),
      email:     document.getElementById('cfEmail').value.trim(),
      subject:   document.getElementById('cfSubject').value.trim(),
      message:   document.getElementById('cfMessage').value.trim(),
      timestamp: new Date().toISOString(),
    };

    submitBtn.disabled = true;
    btnLabel.textContent = 'Sending…';

    try {
      // POST to Google Apps Script Web App.
      // mode: 'no-cors' avoids CORS preflight — response will be opaque (status unreadable).
      // If your GAS script sets Access-Control-Allow-Origin headers, remove mode:'no-cors'
      // and add headers: { 'Content-Type': 'application/json' }.
      await fetch(GAS_ENDPOINT, {
        method: 'POST',
        mode:   'no-cors',
        body:   JSON.stringify(payload),
      });

      form.reset();
      successEl.hidden = false;
      successEl.focus();
      setTimeout(() => { successEl.hidden = true; }, 8000);

    } catch (err) {
      console.error('Contact form error:', err);
      successEl.textContent = 'Something went wrong — please email me directly at Prachi07gaikwad@gmail.com.';
      successEl.hidden = false;
      successEl.focus();
    } finally {
      submitBtn.disabled = false;
      btnLabel.textContent = 'Send Message';
    }
  });

  function validateField({ input, error, validate }) {
    const message = validate(input.value.trim());
    if (message) { showFieldError(input, error, message); return false; }
    clearFieldError(input, error);
    return true;
  }
}

/* ── SHARED FORM HELPERS ── */
function showFieldError(input, errEl, message) {
  input.classList.add('is-invalid');
  input.setAttribute('aria-invalid', 'true');
  errEl.textContent = message;
}

function clearFieldError(input, errEl) {
  input.classList.remove('is-invalid');
  input.removeAttribute('aria-invalid');
  errEl.textContent = '';
}

/* ── 7. FOOTER YEAR ── */
function setFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}
