/* Farm2Home UX enhancements inspired by modern e-commerce patterns. */
(function () {
  "use strict";

  const STORAGE = {
    compare: "farm2home_compare",
    recentlyViewed: "farm2home_recently_viewed",
    coupon: "farm2home_coupon",
  };
  const MAX_COMPARE = 3;
  let compare = read(STORAGE.compare, []);

  function read(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }
  function moneySafe(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }
  function productById(id) {
    return typeof products !== "undefined"
      ? products.find((p) => String(p.id) === String(id))
      : null;
  }
  function toast(message) {
    if (typeof showToast === "function") showToast(message);
  }

  function updateCompareBar() {
    const bar = document.getElementById("compare-bar");
    const count = document.getElementById("compare-count");
    if (!bar || !count) return;
    bar.hidden = compare.length === 0;
    count.textContent = `${compare.length} / ${MAX_COMPARE} selected`;
  }

  function addCompareButton(card) {
    if (card.querySelector("[data-enhance='compare-add']")) return;
    const id = card.querySelector("[data-action='add-cart']")?.dataset.id;
    if (!id) return;
    const wrap = card.querySelector(".product-actions");
    if (!wrap) return;
    const btn = document.createElement("button");
    btn.className = "button button-small button-soft compare-add";
    btn.type = "button";
    btn.dataset.enhance = "compare-add";
    btn.dataset.id = id;
    btn.textContent = compare.includes(String(id)) ? "Compared" : "Compare";
    wrap.prepend(btn);
  }

  function decorateCards() {
    document.querySelectorAll(".product-card").forEach(addCompareButton);
    updateCompareBar();
  }

  function openCompare() {
    if (!compare.length)
      return toast("Select at least one product to compare.");
    const rows = compare.map((id) => productById(id)).filter(Boolean);
    const html = `
      <div class="compare-modal">
        <div class="compare-modal-head"><div><span class="eyebrow">Smart comparison</span><h2>Compare farm products</h2><p>Check price, rating, farming method and availability side by side.</p></div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button></div>
        <div class="compare-grid">${rows
          .map(
            (p) => `
          <article class="compare-card"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}"><h3>${escapeHtml(p.name)}</h3><div><span>Price</span><strong>${moneySafe(p.price)} / ${escapeHtml(p.unit)}</strong></div><div><span>Rating</span><strong>★ ${Number(p.rating || 0).toFixed(1)}</strong></div><div><span>Farmer</span><strong>${escapeHtml(p.farmerName || "Local farmer")}</strong></div><div><span>Method</span><strong>${escapeHtml(p.farmingMethod || "Farm grown")}</strong></div><div><span>Availability</span><strong>${Number(p.availableQuantity || 0)} ${escapeHtml(p.unit || "units")}</strong></div></article>`,
          )
          .join("")}</div>
      </div>`;
    if (typeof openModal === "function") openModal(html);
  }

  function addCompare(id) {
    id = String(id);
    if (compare.includes(id)) {
      compare = compare.filter((x) => x !== id);
      toast("Product removed from comparison.");
    } else {
      if (compare.length >= MAX_COMPARE)
        return toast("You can compare up to 3 products at a time.", "error");
      compare.push(id);
      toast("Product added to comparison.");
    }
    write(STORAGE.compare, compare);
    decorateCards();
  }

  function clearCompare() {
    compare = [];
    write(STORAGE.compare, compare);
    decorateCards();
    toast("Comparison cleared.");
  }

  function rememberProduct(id) {
    const list = read(STORAGE.recentlyViewed, [])
      .map(String)
      .filter((x) => x !== String(id));
    list.unshift(String(id));
    write(STORAGE.recentlyViewed, list.slice(0, 6));
  }

  function rememberCurrentProduct() {
    const match = location.hash.match(/^#\/product\/(.+)$/);
    if (!match) return;
    try {
      rememberProduct(decodeURIComponent(match[1]));
    } catch {
      return;
    }
  }

  function renderRecentlyViewed() {
    const ids = read(STORAGE.recentlyViewed, []);
    const items = ids.map(productById).filter(Boolean);
    if (!items.length) return;
    const target =
      document.querySelector("#page-home .container:last-of-type") ||
      document.querySelector("#page-home");
    if (!target || document.getElementById("recently-viewed-section")) return;
    const section = document.createElement("section");
    section.id = "recently-viewed-section";
    section.className = "section-tight recent-enhancement";
    section.innerHTML = `<div class="container"><div class="section-head-row"><div class="section-heading"><span class="eyebrow">Pick up where you left off</span><h2>Recently viewed</h2><p>Your latest product discoveries, saved in this browser.</p></div></div><div class="recent-grid">${items.map((p) => `<a class="recent-card" href="#/product/${encodeURIComponent(p.id)}" data-route><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}"><div><strong>${escapeHtml(p.name)}</strong><span>${moneySafe(p.price)} / ${escapeHtml(p.unit)}</span></div></a>`).join("")}</div></div>`;
    target.appendChild(section);
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("[data-enhance]");
    if (!target) return;
    const action = target.dataset.enhance;
    if (action === "compare-add") addCompare(target.dataset.id);
    if (action === "compare-open") openCompare();
    if (action === "compare-clear") clearCompare();
  });

  window.addEventListener("hashchange", function () {
    if (/^#\/product\//.test(location.hash)) {
      rememberCurrentProduct();
      setTimeout(renderRecentlyViewed, 80);
    }
    setTimeout(decorateCards, 120);
  });

  const observer = new MutationObserver(() => setTimeout(decorateCards, 0));
  observer.observe(document.body, { childList: true, subtree: true });

  rememberCurrentProduct();
  setTimeout(() => {
    decorateCards();
    renderRecentlyViewed();
  }, 300);
})();
