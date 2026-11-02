// Farm2Home page and component renderers
"use strict";
function showToast(message, type = "success") {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " error" : ""}`;
  toast.innerHTML = `${icon(type === "error" ? "close" : "check")}<span>${escapeHtml(message)}</span>`;
  region.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("toast-out");
    window.setTimeout(() => toast.remove(), 320);
  }, 3200);
}

function updateCartCount() {
  const count = document.getElementById("cart-count");
  if (count) count.textContent = itemCount();
}

function setTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  try {
    localStorage.setItem("theme", nextTheme);
  } catch (error) {
    console.warn("Theme preference could not be saved.", error);
  }
  const button = document.getElementById("theme-toggle");
  if (button) {
    button.innerHTML = icon(nextTheme === "dark" ? "sun" : "moon");
    button.setAttribute(
      "aria-label",
      nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
    button.title =
      nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  }
}

function productCard(product) {
  const isSaved = favorites.some((id) => String(id) === String(product.id));
  const status = statusFor(product);
  return `<article class="product-card reveal">
        <div class="product-photo">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
          <button class="icon-button photo-actions${isSaved ? " is-favorite" : ""}" type="button" data-action="toggle-favorite" data-id="${escapeHtml(product.id)}" aria-label="${isSaved ? "Remove" : "Add"} ${escapeHtml(product.name)} ${isSaved ? "from" : "to"} favorites" aria-pressed="${isSaved}">${icon("heart")}</button>
          <span class="stock-badge ${statusClass(status)}">${escapeHtml(status)}</span>
        </div>
        <div class="product-content">
          <div class="product-topline"><span>${escapeHtml(product.category)}</span><span class="product-rating">${icon("star")} ${Number(product.rating).toFixed(1)}</span></div>
          <a class="product-title" href="#/product/${encodeURIComponent(product.id)}" data-route title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</a>
          <p class="product-farmer">${icon("location")} ${escapeHtml(product.farmerName)} · ${escapeHtml(product.location)}</p>
          <p class="product-harvest">${icon("clock")} Harvested ${escapeHtml(formatDate(product.harvestDate))}</p>
          <div class="product-card-footer">
            <span class="product-price">${money(product.price)} <small>/ ${escapeHtml(product.unit)}</small></span>
            <div class="product-actions">
              <button class="button button-small" type="button" data-action="add-cart" data-id="${escapeHtml(product.id)}" ${status === "Out of Stock" ? 'disabled aria-disabled="true"' : ""}>Add to Cart</button>
            </div>
          </div>
          <a class="product-details-link" href="#/product/${encodeURIComponent(product.id)}" data-route>View Details</a>
        </div>
      </article>`;
}

function renderCategories() {
  document.getElementById("category-grid").innerHTML = categoryInfo
    .map(
      ([name, iconName]) =>
        `<button class="category-tile" type="button" data-action="category" data-category="${escapeHtml(name)}"><span class="category-art">${icon(iconName)}</span><span>${escapeHtml(name)}</span></button>`,
    )
    .join("");
}

function renderHome() {
  const featured = products
    .filter((product) => Number(product.availableQuantity) > 0)
    .slice()
    .sort((a, b) => Number(b.popularity || 0) - Number(a.popularity || 0))
    .slice(0, 8);
  document.getElementById("featured-products").innerHTML = featured
    .map(productCard)
    .join("");
  document.getElementById("benefit-grid").innerHTML = benefits
    .map(
      ([iconName, title, description]) =>
        `<article class="benefit"><span class="benefit-icon">${icon(iconName)}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div></article>`,
    )
    .join("");
  renderRecommendations();
  observeReveals();
}

function renderRecommendations() {
  const select = document.getElementById("recommendation-category");
  const results = document.getElementById("recommendation-results");
  if (!select || !results) return;
  const choice = select.value;
  const matches = products
    .filter((product) =>
      choice === "Organic Products"
        ? product.isOrganic
        : product.category === choice,
    )
    .filter((product) => Number(product.availableQuantity) > 0)
    .slice(0, 4);
  results.innerHTML = matches.length
    ? matches
        .slice(0, 2)
        .map(
          (product) =>
            `<a class="recommendation-item" href="#/product/${encodeURIComponent(product.id)}" data-route><img src="${escapeHtml(product.image)}" alt="" loading="lazy"><div><h3>${escapeHtml(product.name)}</h3><p>${money(product.price)} / ${escapeHtml(product.unit)} · ${escapeHtml(product.location)}</p></div></a>`,
        )
        .join("")
    : `<div class="empty-state"><p>No matching products right now. Try another category.</p></div>`;
}

function readFilters() {
  const search = (document.getElementById("product-search")?.value || "")
    .trim()
    .toLowerCase();
  const category = document.getElementById("filter-category")?.value || "all";
  const location = document.getElementById("filter-location")?.value || "all";
  const method = document.getElementById("filter-method")?.value || "all";
  const availability =
    document.getElementById("filter-availability")?.value || "all";
  const maxPrice = Number(
    document.getElementById("max-price")?.value || 999999,
  );
  const organicOnly = Boolean(document.getElementById("organic-only")?.checked);
  const sort = document.getElementById("product-sort")?.value || "popular";
  return {
    search,
    category,
    location,
    method,
    availability,
    maxPrice,
    organicOnly,
    sort,
  };
}

function updateProductList() {
  const {
    search,
    category,
    location,
    method,
    availability,
    maxPrice,
    organicOnly,
    sort,
  } = readFilters();
  const matches = products.filter((product) => {
    const productStatus = statusFor(product);
    const searchable =
      `${product.name} ${product.farmerName} ${product.location}`.toLowerCase();
    return (
      (!search || searchable.includes(search)) &&
      (category === "all" || product.category === category) &&
      (location === "all" || product.location === location) &&
      (method === "all" || product.farmingMethod === method) &&
      Number(product.price) <= maxPrice &&
      (!organicOnly || product.isOrganic) &&
      (availability === "all" ||
        (availability === "fresh" && productStatus === "Fresh") ||
        (availability === "limited" && productStatus === "Limited Stock") ||
        (availability === "out" && productStatus === "Out of Stock"))
    );
  });
  if (sort === "price-low") matches.sort((a, b) => a.price - b.price);
  if (sort === "price-high") matches.sort((a, b) => b.price - a.price);
  if (sort === "rating") matches.sort((a, b) => b.rating - a.rating);
  if (sort === "newest")
    matches.sort((a, b) => new Date(b.harvestDate) - new Date(a.harvestDate));
  if (sort === "popular")
    matches.sort(
      (a, b) => Number(b.popularity || 0) - Number(a.popularity || 0),
    );
  const list = document.getElementById("product-list");
  if (!list) return;
  document.getElementById("product-result-count").textContent =
    `${matches.length} ${matches.length === 1 ? "product" : "products"} found`;
  list.innerHTML = matches.length
    ? matches.map(productCard).join("")
    : `<div class="empty-state"><span class="empty-icon">${icon("search")}</span><h3>No harvest matched that search</h3><p>Try widening a filter or searching by a farmer's name or district.</p><button class="button button-soft button-small" type="button" data-action="reset-filters">Clear filters</button></div>`;
  observeReveals();
}

function renderProductDetail(id) {
  const product = getProduct(id);
  const target = document.getElementById("product-detail-content");
  if (!product) {
    target.innerHTML = `<div class="empty-state page-inline-spacer"><span class="empty-icon">${icon("basket")}</span><h3>We could not find that product</h3><p>It may have been removed from the demo catalogue.</p><a class="button" href="#/products" data-route>Browse products</a></div>`;
    return;
  }
  const farmer = getFarmer(product.farmerId);
  const status = statusFor(product);
  const retailPrice = Math.round((product.price * 1.375) / 5) * 5;
  const isSaved = favorites.some(
    (favoriteId) => String(favoriteId) === String(product.id),
  );
  selectedDetailQuantity = 1;
  target.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/home" data-route>Home</a>${icon("arrow")}<a href="#/products" data-route>Products</a>${icon("arrow")}<span>${escapeHtml(product.name)}</span></nav>
        <div class="detail-grid">
          <div class="detail-image"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></div>
          <div class="detail-copy">
            <span class="detail-category">${escapeHtml(product.category)} · from ${escapeHtml(product.location)}</span>
            <h1>${escapeHtml(product.name)}</h1>
            <div class="detail-rating"><span class="product-rating">${icon("star")} ${Number(product.rating).toFixed(1)}</span><span>Customer rating</span>${product.isVerifiedFarmer ? `<span class="verified-badge">${icon("verified")} Verified farmer</span>` : ""}</div>
            <div class="detail-price">${money(product.price)} <small>/ ${escapeHtml(product.unit)}</small></div>
            <p class="detail-description">${escapeHtml(product.description)}</p>
            <div class="detail-tags"><span class="stock-badge ${statusClass(status)}">${escapeHtml(status)}</span>${product.isOrganic ? `<span class="organic-badge">${icon("organic")} Organic</span>` : ""}<span class="organic-badge">${icon("leaf")} ${escapeHtml(product.farmingMethod)}</span></div>
            <div class="detail-meta">
              <div class="meta-item"><span>Harvested</span><strong>${escapeHtml(formatDate(product.harvestDate))}</strong></div>
              <div class="meta-item"><span>Available quantity</span><strong>${Number(product.availableQuantity)} ${escapeHtml(product.unit)}${Number(product.availableQuantity) === 1 ? "" : "s"}</strong></div>
              <div class="meta-item"><span>Farmer location</span><strong>${escapeHtml(product.location)}, ${escapeHtml(product.state)}</strong></div>
              <div class="meta-item"><span>Freshness</span><strong>${escapeHtml(status === "Out of Stock" ? "Currently unavailable" : status)}</strong></div>
            </div>
            <div class="detail-cta">
              <div class="quantity-input"><button type="button" data-action="detail-quantity" data-delta="-1" aria-label="Decrease quantity">−</button><span id="detail-quantity">1</span><button type="button" data-action="detail-quantity" data-delta="1" aria-label="Increase quantity">+</button></div>
              <button class="button" type="button" data-action="add-cart-detail" data-id="${escapeHtml(product.id)}" ${status === "Out of Stock" ? "disabled" : ""}>${icon("basket")} Add to Cart</button>
              <button class="button button-orange" type="button" data-action="buy-now" data-id="${escapeHtml(product.id)}" ${status === "Out of Stock" ? "disabled" : ""}>Buy Now ${icon("arrow")}</button>
              <button class="button button-soft" type="button" data-action="toggle-favorite" data-id="${escapeHtml(product.id)}" aria-pressed="${isSaved}">${icon("heart")} ${isSaved ? "Saved" : "Favorite"}</button>
            </div>
            <div class="price-transparency"><h3>Price transparency</h3><div class="price-line"><span>Farm price</span><strong>${money(product.price)} / ${escapeHtml(product.unit)}</strong></div><div class="price-line"><span>Estimated retail price</span><strong>${money(retailPrice)} / ${escapeHtml(product.unit)}</strong></div><div class="price-line"><span>Your estimated difference</span><strong>${money(Math.max(0, retailPrice - product.price))} / ${escapeHtml(product.unit)}</strong></div><small>Retail price is an estimated demo value for this academic project, not a live market quote.</small></div>
            ${farmer ? `<a class="farmer-snippet" href="#/farmer/${encodeURIComponent(farmer.id)}" data-route><img src="${escapeHtml(farmer.image)}" alt=""><div><strong>${escapeHtml(product.farmerName)}</strong><span>${escapeHtml(farmer.farmName)} · ${escapeHtml(product.location)}</span></div><span class="text-link">View farmer ${icon("arrow")}</span></a>` : ""}
          </div>
        </div>`;
}

function renderFarmers() {
  const farmers = allFarmers();
  document.getElementById("farmer-result-count").textContent =
    `${farmers.length} local growers`;
  document.getElementById("farmers-grid").innerHTML = farmers
    .map((farmer) => {
      const count = getFarmerProducts(farmer.id).length;
      const name = farmer.name || farmer.farmerName || "Local Farmer";
      return `<article class="farmer-card reveal"><div class="farmer-cover"><img src="${escapeHtml(farmer.image || image(33950397))}" alt="${escapeHtml(name)} at work on the farm" loading="lazy">${farmer.verified ? `<span class="verified-badge">${icon("verified")} Verified farmer</span>` : `<span class="verified-badge">New listing</span>`}</div><div class="farmer-card-body"><h2>${escapeHtml(name)}</h2><div class="farmer-location">${icon("location")} ${escapeHtml(farmer.location)}, ${escapeHtml(farmer.state || "Andhra Pradesh")}</div><div class="farmer-facts"><div><span>Farm</span><strong>${escapeHtml(farmer.farmName || "Family farm")}</strong></div><div><span>Experience</span><strong>${escapeHtml(farmer.experience || "New member")}</strong></div><div><span>Growing method</span><strong>${escapeHtml(farmer.farmingMethod || "Natural Farming")}</strong></div><div><span>Products · Rating</span><strong>${count} · ${Number(farmer.rating || 5).toFixed(1)} / 5</strong></div></div><div class="farmer-card-bottom"><span class="product-rating">${icon("star")} ${Number(farmer.rating || 5).toFixed(1)}</span><a class="button button-soft button-small" href="#/farmer/${encodeURIComponent(farmer.id)}" data-route>View profile</a></div></div></article>`;
    })
    .join("");
  observeReveals();
}

function renderFarmerProfile(id) {
  const farmer = getFarmer(id);
  const target = document.getElementById("farmer-profile-content");
  if (!farmer) {
    target.innerHTML = `<div class="empty-state page-inline-spacer"><span class="empty-icon">${icon("user")}</span><h3>Farmer profile not found</h3><p>Return to the farmers page to explore local growers.</p><a class="button" href="#/farmers" data-route>Meet the farmers</a></div>`;
    return;
  }
  const name = farmer.name || farmer.farmerName || "Local Farmer";
  const farmerProducts = getFarmerProducts(farmer.id);
  target.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/home" data-route>Home</a>${icon("arrow")}<a href="#/farmers" data-route>Farmers</a>${icon("arrow")}<span>${escapeHtml(name)}</span></nav>
        <div class="farmer-profile-hero"><div class="farmer-profile-photo"><img src="${escapeHtml(farmer.image || image(33950397))}" alt="${escapeHtml(name)} on the farm"></div><div class="farmer-profile-copy"><span class="eyebrow">${escapeHtml(farmer.farmName || "Local family farm")}</span><h1>${escapeHtml(name)}</h1><div class="farmer-location">${icon("location")} ${escapeHtml(farmer.location)}, ${escapeHtml(farmer.state || "Andhra Pradesh")} ${farmer.verified ? `<span class="verified-badge">${icon("verified")} Verified farmer</span>` : ""}</div><p>${escapeHtml(farmer.about || `${name} is a local farmer sharing their produce and growing practices with the Farm2Home community.`)}</p><div class="farmer-profile-stats"><div><strong>${escapeHtml(farmer.experience || "New")}</strong><span>Farming experience</span></div><div><strong>${Number(farmer.rating || 5).toFixed(1)} / 5</strong><span>Farmer rating</span></div><div><strong>${farmerProducts.length}</strong><span>Listed products</span></div></div><div class="farm-info"><div><span>Farm name</span><strong>${escapeHtml(farmer.farmName || "Family farm")}</strong></div><div><span>Farm size</span><strong>${escapeHtml(farmer.farmSize || "Shared on request")}</strong></div><div><span>Farming method</span><strong>${escapeHtml(farmer.farmingMethod || "Natural Farming")}</strong></div></div></div></div>
        <div class="section-head-row"><div class="section-heading"><span class="eyebrow">Straight from this farm</span><h2>Available products</h2><p>Explore the current listings from ${escapeHtml(name)}.</p></div><a class="text-link" href="#/farmers" data-route>All farmers ${icon("arrow")}</a></div>
        <div class="product-grid">${farmerProducts.length ? farmerProducts.map(productCard).join("") : `<div class="empty-state"><h3>No products listed yet</h3><p>This farmer's new listings will appear here.</p></div>`}</div>`;
  observeReveals();
}

function renderFavorites() {
  const saved = favorites.map((id) => getProduct(id)).filter(Boolean);
  const grid = document.getElementById("favorites-grid");
  grid.innerHTML = saved.length
    ? saved.map(productCard).join("")
    : `<div class="empty-state"><span class="empty-icon">${icon("heart")}</span><h3>Your favorites list is empty</h3><p>Tap the heart on any product to save it here. Your list stays in this browser.</p><a class="button" href="#/products" data-route>Find something fresh</a></div>`;
  observeReveals();
}

function renderCart() {
  cart = cart.filter(
    (item) => getProduct(item.id) && Number(item.quantity) > 0,
  );
  saveCart();
  const target = document.getElementById("cart-content");
  if (!cart.length) {
    target.innerHTML = `<div class="empty-state"><span class="empty-icon">${icon("basket")}</span><h3>Your cart is ready for a harvest</h3><p>Browse fresh products and add a few farm favourites to get started.</p><a class="button" href="#/products" data-route>Shop products</a></div>`;
    return;
  }
  const subtotal = cartSubtotal();
  const delivery = deliveryFee;
  target.innerHTML = `<div class="cart-list"><div class="cart-head"><span>Product</span><span>Price</span><span>Quantity</span><span>Subtotal</span><span></span></div>${cart
    .map((item) => {
      const product = getProduct(item.id);
      return `<div class="cart-row"><div class="cart-product"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"><div><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.location)} · / ${escapeHtml(product.unit)}</span></div></div><span class="cart-unit-price">${money(product.price)} / ${escapeHtml(product.unit)}</span><div class="cart-qty"><button type="button" data-action="cart-quantity" data-id="${escapeHtml(product.id)}" data-delta="-1" aria-label="Decrease ${escapeHtml(product.name)} quantity">−</button><span>${Number(item.quantity)}</span><button type="button" data-action="cart-quantity" data-id="${escapeHtml(product.id)}" data-delta="1" aria-label="Increase ${escapeHtml(product.name)} quantity">+</button></div><strong class="cart-line-total">${money(product.price * item.quantity)}</strong><button class="remove-button" type="button" data-action="remove-cart" data-id="${escapeHtml(product.id)}" aria-label="Remove ${escapeHtml(product.name)}">${icon("trash")}</button></div>`;
    })
    .join(
      "",
    )}<div class="cart-list-footer"><button type="button" data-action="clear-cart">Clear cart</button></div></div>
        <aside class="order-summary"><h2>Order summary</h2><div class="summary-line"><span>Subtotal (${itemCount()} items)</span><strong>${money(subtotal)}</strong></div><div class="summary-line"><span>Delivery</span><strong>${money(delivery)}</strong></div><div class="summary-line total"><span>Total</span><strong>${money(subtotal + delivery)}</strong></div><p class="summary-note">Delivery is a flat demo fee. Final prices and payments are simulated for this project.</p><a class="button button-block" href="#/checkout" data-route>Continue to checkout ${icon("arrow")}</a><a class="text-link cart-continue" href="#/products" data-route>Continue shopping ${icon("arrow")}</a></aside>`;
}

function renderCheckoutSummary() {
  const summary = document.getElementById("checkout-summary");
  const form = document.getElementById("checkout-form");
  if (!summary || !form) return;
  const hasItems = cart.length > 0;
  form.classList.toggle("checkout-hidden", !hasItems);
  if (!hasItems) {
    summary.innerHTML = `<h2>Your order</h2><div class="empty-state"><p>Your cart is empty.</p><a class="button button-small" href="#/products" data-route>Shop products</a></div>`;
    return;
  }
  const subtotal = cartSubtotal();
  summary.innerHTML = `<h2>Your order</h2><div class="checkout-summary-items">${cart
    .map((item) => {
      const product = getProduct(item.id);
      return `<div class="checkout-summary-item"><img src="${escapeHtml(product.image)}" alt=""><div><strong>${escapeHtml(product.name)}</strong><span>${Number(item.quantity)} × ${money(product.price)} / ${escapeHtml(product.unit)}</span></div><b>${money(product.price * item.quantity)}</b></div>`;
    })
    .join(
      "",
    )}</div><div class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="summary-line"><span>Delivery</span><strong>${money(deliveryFee)}</strong></div><div class="summary-line total"><span>Total</span><strong>${money(subtotal + deliveryFee)}</strong></div><p class="summary-note">No payment details are collected. Select any demo method to continue.</p>`;
}
