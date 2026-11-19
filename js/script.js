/* =========================================================
   IronPulse Fitness — Interactions
   Vanilla JS · no dependencies
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js");

  /* ---------- Theme toggle (light / dark) ---------- */
  const root = document.documentElement;
  const themeToggle = $("#theme-toggle");
  const themeMeta = $('meta[name="theme-color"]');
  const THEME_KEY = "ironpulse-theme";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#f6f7f4" : "#0a0a0a");
    if (themeToggle) {
      const next = theme === "light" ? "dark" : "light";
      themeToggle.setAttribute("aria-label", `Switch to ${next} mode`);
      themeToggle.setAttribute("title", `Switch to ${next} mode`);
    }
  }
  applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      if (!prefersReducedMotion) {
        root.classList.add("theme-switching");
        setTimeout(() => root.classList.remove("theme-switching"), 400);
      }
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage blocked */ }
    });
  }

  // Follow OS changes unless the visitor picked a theme themselves
  const lightQuery = window.matchMedia("(prefers-color-scheme: light)");
  const onSystemChange = (e) => {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) { /* ignore */ }
    if (!saved) applyTheme(e.matches ? "light" : "dark");
  };
  if (lightQuery.addEventListener) lightQuery.addEventListener("change", onSystemChange);

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Image fallback (offline / blocked images) ---------- */
  document.addEventListener(
    "error",
    (e) => {
      const el = e.target;
      if (el.tagName !== "IMG") return;
      const media = el.closest(".media");
      if (media) media.classList.add("is-broken");
      else el.style.visibility = "hidden";
    },
    true
  );

  /* ---------- Toast ---------- */
  const toast = $("#toast");
  const toastText = $("#toast-text");
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toastText.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  /* ---------- Navbar: scroll effect + back-to-top ---------- */
  const navbar = $("#navbar");
  const toTop = $("#to-top");

  function onScroll() {
    const y = window.scrollY;
    navbar.classList.toggle("is-scrolled", y > 20);
    toTop.classList.toggle("is-visible", y > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  /* ---------- Mobile navigation ---------- */
  const hamburger = $("#hamburger");
  const nav = $("#primary-nav");
  const desktopMQ = window.matchMedia("(min-width: 1000px)");

  function setMenu(open) {
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("no-scroll", open);
    if (open) navbar.classList.add("is-scrolled");
    else onScroll();
  }

  hamburger.addEventListener("click", () => {
    setMenu(hamburger.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      hamburger.focus();
    }
  });

  desktopMQ.addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Smooth scrolling for in-page links ---------- */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = document.getElementById(id.slice(1));
      if (!target) return;

      e.preventDefault();
      if (nav.classList.contains("is-open")) setMenu(false);

      const top = target.getBoundingClientRect().top + window.scrollY - (navbar.offsetHeight - 1);
      window.scrollTo({ top: id === "#home" ? 0 : top, behavior: prefersReducedMotion ? "auto" : "smooth" });

      history.replaceState(null, "", id);
      // Move focus for keyboard / screen-reader users without jumping the page
      if (id !== "#home") {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });

  /* ---------- Active link on scroll (scroll spy) ---------- */
  const navLinks = $$(".nav__link");
  const spySections = navLinks
    .map((l) => document.getElementById(l.getAttribute("href").slice(1)))
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach((l) => {
      const active = l.getAttribute("href") === "#" + id;
      l.classList.toggle("is-active", active);
      if (active) l.setAttribute("aria-current", "true");
      else l.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    spySections.forEach((s) => spy.observe(s));
  }

  /* ---------- Scroll reveal (with stagger inside grids) ---------- */
  const revealEls = $$(".reveal");

  // Stagger siblings that share a parent
  const groups = new Map();
  revealEls.forEach((el) => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });
  groups.forEach((items) => {
    items.forEach((el, i) => el.style.setProperty("--delay", `${Math.min(i * 0.08, 0.4)}s`));
  });

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Hero counters ---------- */
  function animateCounter(el) {
    const target = Number(el.dataset.target) || 0;
    if (prefersReducedMotion) { el.textContent = target; return; }
    const duration = 1600;
    const start = performance.now();
    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = "0";
    requestAnimationFrame(frame);
  }
  setTimeout(() => $$(".counter").forEach(animateCounter), 400);

  /* ---------- Contact form helpers (used by pricing + programs) ---------- */
  const interestSelect = $("#c-interest");
  const messageInput = $("#c-message");

  function setInterest(value) {
    if (!interestSelect) return;
    const exists = Array.from(interestSelect.options).some((o) => o.value === value);
    interestSelect.value = exists ? value : "";
  }

  /* ---------- Program "Explore" links ---------- */
  $$("[data-program]").forEach((link) => {
    link.addEventListener("click", () => {
      const program = link.dataset.program;
      setInterest(program);
      if (messageInput && !messageInput.value.trim()) {
        messageInput.value =
          program === "Free Trial Pass"
            ? "Hi! I'd like to claim my free 1-day pass and fitness assessment."
            : `Hi! I'd like to know more about the ${program} program — schedule, pricing and how to get started.`;
      }
    });
  });

  /* ---------- Pricing: billing toggle ---------- */
  const formatINR = (n) => "₹" + n.toLocaleString("en-IN");
  const billingBtns = $$(".billing-toggle__btn");
  const priceCards = $$(".price-card");

  function setBilling(mode) {
    billingBtns.forEach((b) => {
      const active = b.dataset.billing === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    priceCards.forEach((card) => {
      const amountEl = $(".price-card__amount", card);
      const noteEl = $(".price-card__note", card);
      const monthly = Number(amountEl.dataset.monthly);
      const perMonth = mode === "yearly" ? Math.round(monthly * 0.8) : monthly;

      amountEl.classList.add("is-changing");
      setTimeout(() => {
        amountEl.textContent = formatINR(perMonth);
        noteEl.textContent =
          mode === "yearly"
            ? `Billed yearly · ${formatINR(perMonth * 12)} (save ${formatINR((monthly - perMonth) * 12)})`
            : "Billed monthly";
        amountEl.classList.remove("is-changing");
      }, 180);
    });
  }
  billingBtns.forEach((b) => b.addEventListener("click", () => setBilling(b.dataset.billing)));

  /* ---------- Pricing: plan selection ---------- */
  $$(".plan-btn").forEach((btn) => {
    const card = btn.closest(".price-card");
    const plan = card.dataset.plan;
    btn.dataset.label = btn.textContent;

    btn.addEventListener("click", () => {
      priceCards.forEach((c) => {
        c.classList.remove("is-selected");
        const b = $(".plan-btn", c);
        b.textContent = b.dataset.label;
        b.setAttribute("aria-pressed", "false");
      });

      card.classList.add("is-selected");
      btn.textContent = "✓ Selected — Continue";
      btn.setAttribute("aria-pressed", "true");

      const billing = $(".billing-toggle__btn.is-active").dataset.billing;
      setInterest(`${plan} Plan`);
      messageInput.value = `Hi! I'd like to join the ${plan} plan (${billing} billing). Please share the next steps.`;

      showToast(`${plan} plan selected — complete the form to join.`);

      setTimeout(() => {
        const contact = $("#contact");
        const top = contact.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight;
        window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
        setTimeout(() => $("#c-name").focus({ preventScroll: true }), prefersReducedMotion ? 0 : 700);
      }, 600);
    });
  });

  /* ---------- Generic field error helpers ---------- */
  function setFieldState(input, message) {
    const field = input.closest(".field");
    const errorEl = $(".field__error", field);
    if (message) {
      field.classList.add("has-error");
      field.classList.remove("is-valid");
      input.setAttribute("aria-invalid", "true");
      errorEl.textContent = message;
    } else {
      field.classList.remove("has-error");
      field.classList.add("is-valid");
      input.removeAttribute("aria-invalid");
      errorEl.textContent = "";
    }
    return !message;
  }
  function clearFieldState(input) {
    const field = input.closest(".field");
    field.classList.remove("has-error", "is-valid");
    input.removeAttribute("aria-invalid");
    const errorEl = $(".field__error", field);
    if (errorEl) errorEl.textContent = "";
  }

  /* ---------- BMI calculator ---------- */
  const bmiForm = $("#bmi-form");
  const heightInput = $("#bmi-height");
  const weightInput = $("#bmi-weight");
  const bmiResult = $("#bmi-result");
  const bmiValueBox = $(".bmi-result__value", bmiResult);
  const bmiNumber = $("#bmi-number");
  const bmiCategory = $("#bmi-category");
  const bmiMarker = $("#bmi-marker");
  const bmiTip = $("#bmi-tip");
  const bmiRows = $$(".bmi-table tbody tr");

  const BMI_CATEGORIES = [
    { key: "underweight", max: 18.5, label: "Underweight", color: "var(--info)",
      tip: "You're below the healthy range. A strength program with a calorie-surplus nutrition plan can help you build healthy mass." },
    { key: "normal", max: 25, label: "Normal Weight", color: "var(--accent)",
      tip: "Great work — you're in the healthy range. Keep it up with consistent strength and cardio training." },
    { key: "overweight", max: 30, label: "Overweight", color: "var(--warning)",
      tip: "You're slightly above the healthy range. Our Weight Loss and Cardio programs are a great place to start." },
    { key: "obese", max: Infinity, label: "Obese", color: "var(--danger)",
      tip: "Talk to one of our coaches about a safe, personalised plan combining training and nutrition guidance." }
  ];

  function validateNumber(input, { min, max, label, unit }) {
    const raw = input.value.trim();
    if (raw === "") return setFieldState(input, `Please enter your ${label}.`);
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return setFieldState(input, `${label[0].toUpperCase() + label.slice(1)} must be a positive number.`);
    if (n < min || n > max) return setFieldState(input, `Enter a value between ${min} and ${max} ${unit}.`);
    return setFieldState(input, "");
  }

  const heightRules = { min: 50, max: 272, label: "height", unit: "cm" };
  const weightRules = { min: 10, max: 350, label: "weight", unit: "kg" };

  bmiForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const hOk = validateNumber(heightInput, heightRules);
    const wOk = validateNumber(weightInput, weightRules);
    if (!hOk || !wOk) {
      (hOk ? weightInput : heightInput).focus();
      return;
    }

    const h = Number(heightInput.value) / 100;
    const w = Number(weightInput.value);
    const bmi = w / (h * h);
    const cat = BMI_CATEGORIES.find((c) => bmi < c.max);

    bmiResult.classList.add("has-value");
    bmiResult.style.setProperty("--cat-color", cat.color);
    // restart pop animation
    bmiValueBox.hidden = true;
    void bmiValueBox.offsetWidth;
    bmiValueBox.hidden = false;

    bmiNumber.textContent = bmi.toFixed(1);
    bmiCategory.textContent = cat.label;
    bmiTip.textContent = cat.tip;

    const pct = Math.max(0, Math.min(100, ((bmi - 15) / (40 - 15)) * 100));
    bmiMarker.style.left = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => (bmiMarker.style.left = pct + "%")));

    bmiRows.forEach((r) => r.classList.toggle("is-active", r.dataset.cat === cat.key));
  });

  [heightInput, weightInput].forEach((input) => {
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("has-error")) {
        validateNumber(input, input === heightInput ? heightRules : weightRules);
      }
    });
  });

  bmiForm.addEventListener("reset", () => {
    [heightInput, weightInput].forEach(clearFieldState);
    bmiResult.classList.remove("has-value");
    bmiValueBox.hidden = true;
    bmiRows.forEach((r) => r.classList.remove("is-active"));
  });

  /* ---------- Contact form validation + submit ---------- */
  const contactForm = $("#contact-form");
  const submitBtn = $("#contact-submit");
  const successBox = $("#form-success");
  const successText = $("#form-success-text");
  const formTitle = $(".contact__form-title");

  const validators = {
    name(v) {
      if (!v) return "Please enter your name.";
      if (v.length < 2) return "Name must be at least 2 characters.";
      if (!/^[A-Za-zÀ-ɏऀ-ॿ .'-]+$/.test(v)) return "Name can only contain letters, spaces, . ' and -";
      return "";
    },
    email(v) {
      if (!v) return "Please enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Please enter a valid email (e.g. you@example.com).";
      return "";
    },
    phone(v) {
      if (!v) return "Please enter your phone number.";
      if (!/^[+\d][\d\s()-]*$/.test(v)) return "Phone can only contain digits, spaces, +, - and ().";
      const digits = v.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 13) return "Please enter a valid 10-digit phone number.";
      return "";
    },
    message(v) {
      if (!v) return "Please enter a message.";
      if (v.length < 10) return "Message should be at least 10 characters.";
      return "";
    }
  };

  const contactFields = {
    name: $("#c-name"),
    email: $("#c-email"),
    phone: $("#c-phone"),
    message: $("#c-message")
  };

  function validateContactField(key) {
    const input = contactFields[key];
    return setFieldState(input, validators[key](input.value.trim()));
  }

  Object.keys(contactFields).forEach((key) => {
    const input = contactFields[key];
    input.addEventListener("blur", () => {
      if (input.value.trim() !== "") validateContactField(key);
    });
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("has-error")) validateContactField(key);
    });
  });

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    const results = Object.keys(contactFields).map((k) => [k, validateContactField(k)]);
    const firstInvalid = results.find(([, ok]) => !ok);
    if (firstInvalid) {
      contactFields[firstInvalid[0]].focus();
      showToast("Please fix the highlighted fields.");
      return;
    }

    // Loading state (simulated request — nothing is actually sent)
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    submitBtn.setAttribute("aria-busy", "true");
    $(".btn__label", submitBtn).textContent = "Sending…";

    setTimeout(() => {
      const firstName = contactFields.name.value.trim().split(/\s+/)[0];
      successText.textContent = `Thanks, ${firstName}! A member of our team will get back to you at ${contactFields.email.value.trim()} within 24 hours.`;

      contactForm.hidden = true;
      formTitle.hidden = true;
      successBox.hidden = false;
      successBox.setAttribute("tabindex", "-1");
      successBox.focus({ preventScroll: true });
      showToast("Message sent successfully!");

      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.removeAttribute("aria-busy");
      $(".btn__label", submitBtn).textContent = "Send Message";
    }, 1400);
  });

  $("#form-reset").addEventListener("click", () => {
    contactForm.reset();
    Object.values(contactFields).forEach(clearFieldState);
    priceCards.forEach((c) => {
      c.classList.remove("is-selected");
      const b = $(".plan-btn", c);
      b.textContent = b.dataset.label;
      b.setAttribute("aria-pressed", "false");
    });
    successBox.hidden = true;
    contactForm.hidden = false;
    formTitle.hidden = false;
    contactFields.name.focus();
  });
})();
