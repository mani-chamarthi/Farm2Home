function addToCart(id, quantity = 1) {
  if (
    !requireLogin(
      { type: "add-cart", id, quantity },
      "Please login before adding products to your cart.",
    )
  )
    return;
  const product = getProduct(id);
  if (!product || Number(product.availableQuantity) <= 0) {
    showToast("This product is currently out of stock.", "error");
    return;
  }
  const amount = Math.max(1, Math.floor(Number(quantity) || 1));
  const existing = cart.find((item) => String(item.id) === String(id));
  const currentQuantity = existing ? Number(existing.quantity) : 0;
  if (currentQuantity + amount > Number(product.availableQuantity)) {
    showToast(
      `Only ${product.availableQuantity} ${product.unit} available right now.`,
      "error",
    );
    return;
  }
  if (existing) existing.quantity = currentQuantity + amount;
  else cart.push({ id: product.id, quantity: amount });
  saveCart();
  showToast(`${product.name} added to cart.`);
  if (activeRoute === "cart") renderCart();
  if (activeRoute === "checkout") renderCheckoutSummary();
}

function changeCartQuantity(id, delta) {
  if (!requireLogin(null, "Please login to manage your cart.")) return;
  const item = cart.find((entry) => String(entry.id) === String(id));
  const product = getProduct(id);
  if (!item || !product) return;
  const next = Number(item.quantity) + Number(delta);
  if (next <= 0) cart = cart.filter((entry) => String(entry.id) !== String(id));
  else if (next > Number(product.availableQuantity))
    showToast(
      `Only ${product.availableQuantity} ${product.unit} available.`,
      "error",
    );
  else item.quantity = next;
  saveCart();
  if (activeRoute === "cart") renderCart();
  if (activeRoute === "checkout") renderCheckoutSummary();
}

function toggleFavorite(id) {
  if (!requireLogin(null, "Please login to save favorites.")) return;
  const saved = favorites.some(
    (favoriteId) => String(favoriteId) === String(id),
  );
  favorites = saved
    ? favorites.filter((favoriteId) => String(favoriteId) !== String(id))
    : [...favorites, Number(id) || id];
  saveFavorites();
  const product = getProduct(id);
  showToast(
    saved
      ? `${product?.name || "Product"} removed from favorites.`
      : `${product?.name || "Product"} added to favorites.`,
  );
  if (activeRoute === "favorites") renderFavorites();
  if (activeRoute === "home") renderHome();
  if (activeRoute === "products") updateProductList();
  if (activeRoute === "farmer") renderFarmerProfile(routeParam);
  if (activeRoute === "product") renderProductDetail(routeParam);
}

function applyCategory(category) {
  if (category === "Organic") category = "Organic Products";
  userPreferences.lastCategory = category;
  savePreferences();
  resetFilters();
  if (category === "Organic Products")
    document.getElementById("organic-only").checked = true;
  else document.getElementById("filter-category").value = category;
  updateProductList();
  if (window.location.hash !== "#/products")
    window.location.hash = "#/products";
}

function resetFilters() {
  document.getElementById("product-search").value = "";
  document.getElementById("filter-category").value = "all";
  document.getElementById("filter-location").value = "all";
  document.getElementById("filter-method").value = "all";
  document.getElementById("filter-availability").value = "all";
  document.getElementById("organic-only").checked = false;
  document.getElementById("max-price").value =
    document.getElementById("max-price").max;
  document.getElementById("product-sort").value = "popular";
  document.getElementById("max-price-label").textContent = money(
    document.getElementById("max-price").value,
  );
  updateProductList();
}

function closeMobileMenu() {
  const nav = document.getElementById("primary-nav");
  const toggle = document.getElementById("menu-toggle");
  if (nav) nav.classList.remove("nav-open");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  }
}

function openProductEditor(id = "") {
  if (
    !requireRole("farmer", "Only farmers can manage product listings.")
  )
    return;
  const requested = id ? getProduct(id) : null;
  if (requested && String(requested.farmerId) !== String(currentUser.farmerId)) {
    showToast("You can only edit your own farm listings.", "error");
    return;
  }
  const product = id ? getProduct(id) : null;
  const title = product ? "Edit product listing" : "Add a farm product";
  const categoryOptions = [
    "Vegetables",
    "Fruits",
    "Grains",
    "Pulses",
    "Spices",
    "Dairy",
    "Honey",
    "Millets",
  ]
    .map(
      (category) =>
        `<option ${product?.category === category ? "selected" : ""}>${category}</option>`,
    )
    .join("");
  const locationOptions = [
    "Visakhapatnam",
    "Vijayawada",
    "Nellore",
    "Tirupati",
    "Chittoor",
    "Kurnool",
  ]
    .map(
      (location) =>
        `<option ${product?.location === location ? "selected" : ""}>${location}</option>`,
    )
    .join("");
  const methodOptions = [
    "Organic Farming",
    "Natural Farming",
    "Conventional Farming",
  ]
    .map(
      (method) =>
        `<option ${product?.farmingMethod === method ? "selected" : ""}>${method}</option>`,
    )
    .join("");
  openModal(
    `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="product-editor-title"><button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button><span class="eyebrow">Farm dashboard</span><h2 id="product-editor-title">${title}</h2><p>Keep the listing clear and accurate for customers.</p><form class="modal-form" id="product-editor-form"><input type="hidden" name="id" value="${escapeHtml(product?.id || "")}"><div class="form-grid"><div class="form-field full"><label for="editor-name">Product name</label><input id="editor-name" name="name" required maxlength="70" value="${escapeHtml(product?.name || "")}" placeholder="e.g. Fresh okra"></div><div class="form-field"><label for="editor-category">Category</label><select id="editor-category" name="category" required>${categoryOptions}</select></div><div class="form-field"><label for="editor-price">Price (₹)</label><input id="editor-price" name="price" type="number" min="1" max="100000" required value="${escapeHtml(product?.price ?? "")}" placeholder="Price"></div><div class="form-field"><label for="editor-unit">Unit</label><input id="editor-unit" name="unit" required maxlength="18" value="${escapeHtml(product?.unit || "kg")}" placeholder="kg, bunch, litre"></div><div class="form-field"><label for="editor-quantity">Available quantity</label><input id="editor-quantity" name="quantity" type="number" min="0" max="100000" required value="${escapeHtml(product?.availableQuantity ?? "")}" placeholder="Quantity"></div><div class="form-field"><label for="editor-location">Location</label><select id="editor-location" name="location" required>${locationOptions}</select></div><div class="form-field"><label for="editor-method">Farming method</label><select id="editor-method" name="farmingMethod" required>${methodOptions}</select></div><div class="form-field full"><label for="editor-farmer">Farmer name</label><input id="editor-farmer" name="farmerName" required maxlength="70" value="${escapeHtml(product?.farmerName || "Ramesh Kumar")}"></div><div class="form-field full"><label for="editor-description">Description</label><textarea id="editor-description" name="description" required maxlength="240" placeholder="Describe your harvest">${escapeHtml(product?.description || "Freshly harvested from our family farm.")}</textarea></div><div class="form-field full"><label class="check-row"><input type="checkbox" name="isOrganic" ${product?.isOrganic ? "checked" : ""}> This product is grown using organic practices</label></div></div><button class="button button-block" type="submit">${product ? "Save changes" : "Add product"}</button></form></section>`,
  );
  const farmerNameInput = document.getElementById("editor-farmer");
  farmerNameInput.value = product?.farmerName || currentUser.name;
  farmerNameInput.readOnly = true;
}

function saveProductFromForm(form) {
  if (
    !requireRole("farmer", "Only farmers can manage product listings.")
  )
    return;
  const data = new FormData(form);
  const id = data.get("id");
  const existing = id ? getProduct(id) : null;
  if (existing && String(existing.farmerId) !== String(currentUser.farmerId)) {
    showToast("You can only edit your own farm listings.", "error");
    return;
  }
  const farmer = allFarmers().find(
    (item) => String(item.id) === String(currentUser.farmerId),
  );
  if (!farmer) {
    showToast(
      "Farmer profile is missing. Please complete farmer registration first.",
      "error",
    );
    return;
  }
  const nextProduct = {
    ...(existing || {}),
    id: existing ? existing.id : Date.now(),
    name: data.get("name").trim(),
    category: data.get("category"),
    price: Number(data.get("price")),
    unit: data.get("unit").trim(),
    image: existing?.image || image(5425794),
    farmerId: existing?.farmerId || farmer.id,
    farmerName: farmer.name,
    location: data.get("location"),
    state: "Andhra Pradesh",
    availableQuantity: Number(data.get("quantity")),
    rating: existing?.rating || 4.7,
    farmingMethod: data.get("farmingMethod"),
    harvestDate: new Date().toISOString().slice(0, 10),
    description: data.get("description").trim(),
    isOrganic: data.get("isOrganic") === "on",
    isVerifiedFarmer: existing?.isVerifiedFarmer ?? true,
    popularity: existing?.popularity || 5,
  };
  if (existing)
    products = products.map((product) =>
      String(product.id) === String(existing.id) ? nextProduct : product,
    );
  else products.unshift(nextProduct);
  saveProducts();
  closeModal();
  renderDashboard();
  renderHome();
  if (activeRoute === "products") updateProductList();
  showToast(
    existing ? "Product listing updated." : "Product added to your catalogue.",
  );
}

function registerFarmer(form) {
  if (!requireLogin(null, "Please login before applying as a farmer.")) return;
  const data = new FormData(form);
  if (currentUser.role === "farmer") {
    showToast("Your account is already authorized as a farmer.", "error");
    return;
  }
  const farmerEmail = String(data.get("email") || "")
    .trim()
    .toLowerCase();
  if (farmerEmail !== currentUser.email) {
    showToast("Use the email address from your Farm2Home account.", "error");
    return;
  }
  const farmer = {
    id: Date.now(),
    ownerUserId: currentUser.id,
    name: data.get("name").trim(),
    mobile: data.get("mobile").trim(),
    email: farmerEmail,
    village: data.get("village").trim(),
    location: data.get("district"),
    state: data.get("state"),
    farmName: data.get("farmName").trim(),
    farmSize: data.get("farmSize").trim(),
    productsGrown: data.get("productsGrown").trim(),
    farmingMethod: data.get("farmingMethod"),
    experience: "New member",
    rating: 5,
    image: image(20527467),
    verified: false,
    about: `${data.get("name").trim()} grows ${data.get("productsGrown").trim()} near ${data.get("village").trim()}, ${data.get("district")}. This local farmer registration was submitted through the Farm2Home demo.`,
  };
  registeredFarmers = registeredFarmers.filter(
    (item) => String(item.ownerUserId) !== String(currentUser.id),
  );
  registeredFarmers.unshift(farmer);
  saveStorage("farm2home_farmers", registeredFarmers);
  const accounts = getAccounts();
  const account = accounts.find(
    (item) => String(item.id) === String(currentUser.id),
  );
  if (account) {
    account.role = "farmer";
    account.farmerId = farmer.id;
    saveAccounts(accounts);
    currentUser = publicAccount(account);
    saveStorage(SESSION_KEY, currentUser);
    reloadUserState();
  }
  form.reset();
  document.getElementById("farmer-success").classList.remove("checkout-hidden");
  showToast("Farmer application approved for this demo account.");
  updateAuthUI();
  renderFarmers();
}
