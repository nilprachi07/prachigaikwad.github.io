/**
 * ════════════════════════════════════════════════════════════
 * PRACHI GAIKWAD — PORTFOLIO SCRIPT v3
 * Production-grade vanilla JavaScript — zero dependencies.
 *
 * Modules:
 *   1.  Navbar (sticky state, active link, mobile menu)
 *   2.  Scroll Reveal (IntersectionObserver)
 *   3.  Skill Bar Animation (IntersectionObserver)
 *   4.  Hero Metric Counters (animated on scroll)
 *   5.  Interview Tracker (CRUD + LocalStorage)
 *   6.  Contact Form Validation
 *   7.  Footer Year
 * ════════════════════════════════════════════════════════════
 */

'use strict';

/* ────────────────────────────────────────────────────────
   ENTRY POINT
──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initSkillBars();
  initMetricCounters();
  initTracker();
  initContactForm();
  setFooterYear();
});

/* ════════════════════════════════════════════════════════
   1. NAVBAR
   - Adds `.scrolled` class when page scrolls past threshold
   - Highlights active section link via IntersectionObserver
   - Mobile: toggles `.is-open` on nav list
════════════════════════════════════════════════════════ */
function initNavbar() {
  const header    = document.getElementById('siteHeader');
  const navList   = document.getElementById('navList');
  const navToggle = document.getElementById('navToggle');
  const navItems  = navList.querySelectorAll('.nav-item');
  const sections  = document.querySelectorAll('section[id], div[id]');

  // ── Scroll state ──────────────────────────────────────
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initialise on load

  // ── Active link via IntersectionObserver ─────────────
  const linkMap = new Map();
  navItems.forEach(link => {
    const id = link.getAttribute('href').slice(1);
    linkMap.set(id, link);
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id   = entry.target.getAttribute('id');
        const link = linkMap.get(id);
        if (!link) return;

        navItems.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    },
    {
      rootMargin: `-${header.offsetHeight}px 0px -55% 0px`,
      threshold: 0,
    }
  );

  document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

  // ── Mobile menu ───────────────────────────────────────
  navToggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on nav link click
  navItems.forEach(item => {
    item.addEventListener('click', closeMenu);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target) && navList.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // Close on Escape key
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

/* ════════════════════════════════════════════════════════
   2. SCROLL REVEAL
   Adds `.in-view` to elements with `.reveal` or `.reveal-children`
   when they enter the viewport, triggering CSS transitions.
════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal, .reveal-children');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;

        // Stagger siblings inside the same grid/flex parent
        const siblings = [...entry.target.parentElement.children].filter(
          c => c.classList.contains('reveal') || c.classList.contains('reveal-children')
        );
        const siblingIndex = siblings.indexOf(entry.target);
        const delay = siblingIndex * 80; // 80ms stagger

        setTimeout(() => {
          entry.target.classList.add('in-view');
        }, delay);

        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  targets.forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════════════════════
   3. SKILL BARS
   Animates progress bars to their data-width value
   when they scroll into view.
════════════════════════════════════════════════════════ */
function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill[data-width]');
  if (!fills.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const fill = entry.target;
        const target = fill.dataset.width + '%';

        // Small delay so card reveal animation completes first
        setTimeout(() => {
          fill.style.width = target;
        }, 200);

        observer.unobserve(fill);
      });
    },
    { threshold: 0.5 }
  );

  fills.forEach(f => observer.observe(f));
}

/* ════════════════════════════════════════════════════════
   4. HERO METRIC COUNTERS
   Counts up from 0 to data-count with ease-out easing.
════════════════════════════════════════════════════════ */
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
        const duration = 1400; // ms
        const startTime = performance.now();

        // Preserve any inner elements (like .metric-unit)
        const unitEl = el.querySelector('.metric-unit');
        const unitHTML = unitEl ? unitEl.outerHTML : '';

        function tick(now) {
          const elapsed  = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = (eased * target).toFixed(decimals);

          el.textContent = value + suffix;
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

/* ════════════════════════════════════════════════════════
   5. INTERVIEW TRACKER
   Persists entries in localStorage with full CRUD.
════════════════════════════════════════════════════════ */
function initTracker() {
  const STORAGE_KEY = 'pg_tracker_v3';

  // ── Element references ────────────────────────────────
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

  // ── Helpers ───────────────────────────────────────────
  function loadEntries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveEntries(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
      console.warn('LocalStorage write failed:', err);
    }
  }

  function escapeHTML(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  // ── Render ─────────────────────────────────────────────
  function render() {
    const all      = loadEntries();
    const filtered = activeFilter === 'All'
      ? all
      : all.filter(e => e.status === activeFilter);

    renderSummary(all);

    listEl.innerHTML = '';

    if (!filtered.length) {
      listEl.setAttribute('aria-hidden', 'true');
      emptyEl.removeAttribute('hidden');
      return;
    }

    emptyEl.setAttribute('hidden', '');
    listEl.removeAttribute('aria-hidden');

    filtered.forEach(entry => {
      listEl.appendChild(buildEntryEl(entry));
    });
  }

  function renderSummary(entries) {
    if (!entries.length) {
      summaryEl.innerHTML = '';
      return;
    }

    const counts = {
      Applied: 0,
      Interviewed: 0,
      Rejected: 0,
      Accepted: 0,
    };

    entries.forEach(e => {
      if (counts[e.status] !== undefined) counts[e.status]++;
    });

    summaryEl.innerHTML = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([status, n]) => {
        const cls = status.toLowerCase();
        return `<span class="summary-pill summary-pill--${cls}" aria-label="${n} ${status}">${n} ${status}</span>`;
      })
      .join('');
  }

  function buildEntryEl(entry) {
    const el = document.createElement('div');
    el.className = 'tracker-entry';
    el.setAttribute('role', 'listitem');
    el.dataset.id = entry.id;

    const statusCls = `entry-status--${entry.status.toLowerCase()}`;

    el.innerHTML = `
      <div class="entry-main">
        <p class="entry-company">${escapeHTML(entry.company)}</p>
        ${entry.role ? `<p class="entry-role">${escapeHTML(entry.role)}</p>` : ''}
      </div>
      <time class="entry-date" datetime="${entry.date}" title="${new Date(entry.date).toLocaleDateString()}">
        ${formatDate(entry.date)}
      </time>
      <span class="entry-status ${statusCls}">${entry.status}</span>
      <button
        class="entry-delete"
        aria-label="Remove ${escapeHTML(entry.company)} from tracker"
        data-id="${entry.id}"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    // Delete handler
    el.querySelector('.entry-delete').addEventListener('click', () => {
      removeEntry(entry.id, el);
    });

    return el;
  }

  // ── CRUD ──────────────────────────────────────────────
  function addEntry(company, role, status) {
    const entries = loadEntries();
    const newEntry = {
      id:      Date.now().toString(),
      company: company.trim(),
      role:    role.trim(),
      status,
      date:    new Date().toISOString(),
    };
    entries.unshift(newEntry);
    saveEntries(entries);
    render();
  }

  function removeEntry(id, el) {
    // Animate out
    el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(16px)';

    setTimeout(() => {
      saveEntries(loadEntries().filter(e => e.id !== id));
      render();
    }, 220);
  }

  // ── Form ──────────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const company = coInput.value.trim();

    if (!company) {
      showFieldError(coInput, coErrEl, 'Company name is required.');
      coInput.focus();
      return;
    }

    clearFieldError(coInput, coErrEl);
    addEntry(company, roleInput.value, statusSel.value);
    form.reset();
    coInput.focus();
  });

  coInput.addEventListener('input', () => {
    if (coInput.value.trim()) clearFieldError(coInput, coErrEl);
  });

  // ── Filters ───────────────────────────────────────────
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  // ── Initial render ────────────────────────────────────
  render();
}

/* ════════════════════════════════════════════════════════
   6. CONTACT FORM VALIDATION
   All validation is performed client-side before simulating
   a form submission (no actual endpoint in this demo).
════════════════════════════════════════════════════════ */
function initContactForm() {
  const form       = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn  = document.getElementById('cfSubmit');
  const btnLabel   = document.getElementById('cfBtnLabel');
  const successEl  = document.getElementById('cfSuccess');

  // Field configuration — element, error element, validation rule
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
        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!EMAIL_RE.test(v)) return 'Please enter a valid email address.';
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

  // ── Live validation (validate on blur, re-validate on input if invalid) ──
  fields.forEach(field => {
    field.input.addEventListener('blur', () => validateField(field));
    field.input.addEventListener('input', () => {
      if (field.input.classList.contains('is-invalid')) {
        validateField(field);
      }
    });
  });

  // ── Submit ─────────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    successEl.hidden = true;

    // Validate all fields
    const results = fields.map(f => validateField(f));
    const isValid = results.every(Boolean);

    if (!isValid) {
      // Focus first invalid field
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Simulate async submission
    submitBtn.disabled = true;
    btnLabel.textContent = 'Sending…';

    setTimeout(() => {
      submitBtn.disabled = false;
      btnLabel.textContent = 'Send Message';
      form.reset();

      // Show success message
      successEl.hidden = false;
      successEl.focus();

      // Auto-hide after 8 seconds
      setTimeout(() => {
        successEl.hidden = true;
      }, 8000);
    }, 1200);
  });

  // ── Helpers ───────────────────────────────────────────
  function validateField({ input, error, validate }) {
    const message = validate(input.value.trim());

    if (message) {
      showFieldError(input, error, message);
      return false;
    } else {
      clearFieldError(input, error);
      return true;
    }
  }
}

/* ════════════════════════════════════════════════════════
   SHARED FORM HELPERS
════════════════════════════════════════════════════════ */

/**
 * Mark a form input as invalid and display an error message.
 * @param {HTMLElement} input  - The input element
 * @param {HTMLElement} errEl  - The error message element
 * @param {string}      message - The error text to display
 */
function showFieldError(input, errEl, message) {
  input.classList.add('is-invalid');
  input.setAttribute('aria-invalid', 'true');
  errEl.textContent = message;
}

/**
 * Clear the invalid state from a form field.
 * @param {HTMLElement} input - The input element
 * @param {HTMLElement} errEl - The error message element
 */
function clearFieldError(input, errEl) {
  input.classList.remove('is-invalid');
  input.removeAttribute('aria-invalid');
  errEl.textContent = '';
}

/* ════════════════════════════════════════════════════════
   7. FOOTER YEAR
════════════════════════════════════════════════════════ */
function setFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}