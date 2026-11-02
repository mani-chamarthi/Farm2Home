function setupEvents() {
  // Farm2Home DOM event delegation and form handlers
  "use strict";
  document.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    const routeLink = event.target.closest("a[data-route]");
    const categoryLink = event.target.closest("[data-category-link]");
    if (routeLink) closeMobileMenu();
    if (categoryLink) {
      event.preventDefault();
      applyCategory(categoryLink.dataset.categoryLink);
      return;
    }
    if (!actionTarget) return;
    const { action, id } = actionTarget.dataset;
    if (action === "toggle-theme")
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "light" : "dark",
      );
    if (action === "login") openLoginModal();
    if (action === "open-login") openLoginModal();
    if (action === "open-register") openRegisterModal();
    if (action === "open-reset") openResetModal();
    if (action === "account-menu") openAccountMenu();
    if (action === "logout") logout();
    if (action === "toggle-password") {
      const target = document.getElementById(actionTarget.dataset.target);
      if (target) {
        target.type = target.type === "password" ? "text" : "password";
        actionTarget.textContent = target.type === "password" ? "Show" : "Hide";
      }
    }
    if (action === "toggle-favorite") toggleFavorite(id);
    if (action === "add-cart") addToCart(id);
    if (action === "add-cart-detail") addToCart(id, selectedDetailQuantity);
    if (action === "buy-now") {
      if (
        requireLogin(
          { type: "buy-now", id, quantity: selectedDetailQuantity },
          "Please login before buying this product.",
        )
      ) {
        addToCart(id, selectedDetailQuantity);
        window.location.hash = "#/checkout";
      }
    }
    if (action === "cart-quantity")
      changeCartQuantity(id, actionTarget.dataset.delta);
    if (action === "remove-cart") {
      cart = cart.filter((item) => String(item.id) !== String(id));
      saveCart();
      renderCart();
      showToast("Product removed from your cart.");
    }
    if (action === "clear-cart") {
      cart = [];
      saveCart();
      renderCart();
      showToast("Your cart has been cleared.");
    }
    if (action === "category") applyCategory(actionTarget.dataset.category);
    if (action === "recommend") renderRecommendations();
    if (action === "reset-filters") resetFilters();
    if (action === "detail-quantity") {
      const product = getProduct(routeParam);
      const next = selectedDetailQuantity + Number(actionTarget.dataset.delta);
      selectedDetailQuantity = Math.max(
        1,
        Math.min(Number(product?.availableQuantity || 1), next),
      );
      const output = document.getElementById("detail-quantity");
      if (output) output.textContent = selectedDetailQuantity;
    }
    if (action === "add-product") openProductEditor();
    if (action === "edit-product") openProductEditor(id);
    if (action === "delete-product") {
      if (!requireRole("farmer", "Only farmers can manage product listings."))
        return;
      const product = getProduct(id);
      if (!product) return;
      if (String(product.farmerId) !== String(currentUser.farmerId)) {
        showToast("You can only delete your own farm listings.", "error");
        return;
      }
      if (window.confirm(`Delete ${product.name} from the demo catalogue?`)) {
        products = products.filter((item) => String(item.id) !== String(id));
        cart = cart.filter((item) => String(item.id) !== String(id));
        favorites = favorites.filter(
          (favoriteId) => String(favoriteId) !== String(id),
        );
        saveProducts();
        saveCart();
        saveFavorites();
        renderDashboard();
        renderHome();
        showToast("Product removed from the catalogue.");
      }
    }
    if (action === "close-modal") closeModal();
    if (action === "toggle-menu") {
      const nav = document.getElementById("primary-nav");
      const toggle = document.getElementById("menu-toggle");
      const isOpen = nav.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation",
      );
    }
  });

  document.getElementById("menu-toggle").addEventListener("click", () => {
    const nav = document.getElementById("primary-nav");
    const toggle = document.getElementById("menu-toggle");
    const isOpen = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation",
    );
  });

  document.getElementById("modal-root").addEventListener("click", (event) => {
    if (event.target.id === "modal-root") closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
    else trapModalFocus(event);
  });

  [
    "product-search",
    "filter-category",
    "filter-location",
    "filter-method",
    "filter-availability",
    "max-price",
    "organic-only",
    "product-sort",
  ].forEach((id) => {
    const element = document.getElementById(id);
    element.addEventListener(
      id === "product-search" || id === "max-price" ? "input" : "change",
      () => {
        if (id === "max-price")
          document.getElementById("max-price-label").textContent = money(
            element.value,
          );
        if (
          [
            "filter-category",
            "filter-location",
            "filter-method",
            "product-sort",
          ].includes(id)
        ) {
          userPreferences[id] = element.value;
          savePreferences();
        }
        updateProductList();
      },
    );
  });

  document
    .getElementById("recommendation-category")
    .addEventListener("change", renderRecommendations);

  document.addEventListener("submit", (event) => {
    const form = event.target;
    const formId = form.getAttribute("id");
    if (formId === "checkout-form") {
      event.preventDefault();
      if (!form.reportValidity()) return;
      placeOrder(form);
    }
    if (formId === "farmer-registration-form") {
      event.preventDefault();
      if (!form.reportValidity()) return;
      registerFarmer(form);
    }
    if (formId === "product-editor-form") {
      event.preventDefault();
      if (!form.reportValidity()) return;
      saveProductFromForm(form);
    }
    if (formId === "login-form") {
      event.preventDefault();
      if (!form.reportValidity()) return;
      loginAccount(form);
    }
    if (formId === "register-form") {
      event.preventDefault();
      if (!form.reportValidity()) return;
      registerAccount(form);
    }
    if (formId === "reset-form") {
      event.preventDefault();
      if (!form.reportValidity()) return;
      resetPassword(form);
    }
  });

  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("storage", (event) => {
    if (event.key === "farm2home_session") {
      currentUser = normalizeUserRole(loadStorage("farm2home_session", null));
      if (currentUser) saveStorage("farm2home_session", currentUser);
      reloadUserState();
      updateAuthUI();
      updateCartCount();
      renderRoute();
      return;
    }
    if (event.key === "farm2home_products")
      products = loadStorage("farm2home_products", seedProducts);
    if (event.key === "farm2home_farmers")
      registeredFarmers = loadStorage("farm2home_farmers", []);
    updateCartCount();
    if (activeRoute === "cart") renderCart();
    if (activeRoute === "favorites") renderFavorites();
    if (activeRoute === "products") updateProductList();
  });
}
