// Farm2Home hash router and reveal effects
"use strict";
function renderRoute() {
  const route = (window.location.hash || "#/home").replace(/^#\/?/, "");
  const [path, ...rest] = route.split("/");
  activeRoute = path || "home";
  routeParam = decodeURIComponent(rest.join("/") || "");

  const protectedRoutes = [
    "cart",
    "favorites",
    "checkout",
    "order",
    "tracking",
    "dashboard",
    "orders",
  ];
  if (protectedRoutes.includes(activeRoute) && !currentUser) {
    pendingLoginAction = {
      type: activeRoute === "checkout" ? "checkout" : null,
    };
    showLoginRequired("Please login to access your account area.");
    activeRoute = "home";
    routeParam = "";
    window.location.hash = "#/home";
    return;
  }
  if (activeRoute === "dashboard" && !hasRole("farmer")) {
    showToast("Farmer authorization is required for the dashboard.", "error");
    window.location.hash = "#/become-farmer";
    return;
  }
  if (activeRoute === "checkout" && !currentUser) {
    pendingLoginAction = { type: "checkout" };
    showLoginRequired("Please login before you continue to checkout.");
    activeRoute = "cart";
    routeParam = "";
    window.location.hash = "#/cart";
    return;
  }
  const pageMap = {
    home: "home",
    products: "products",
    farmers: "farmers",
    favorites: "favorites",
    cart: "cart",
    about: "about",
    checkout: "checkout",
    order: "confirmation",
    tracking: "tracking",
    orders: "orders",
    farmer: "farmer-profile",
    product: "details",
    "become-farmer": "become-farmer",
    dashboard: "dashboard",
  };
  const page = pageMap[activeRoute] || "home";
  document
    .querySelectorAll(".page-view")
    .forEach((view) =>
      view.classList.toggle("active", view.dataset.page === page),
    );
  document
    .querySelectorAll("[data-nav]")
    .forEach((link) =>
      link.classList.toggle(
        "active",
        link.dataset.nav === activeRoute ||
          (activeRoute === "product" && link.dataset.nav === "products") ||
          (activeRoute === "farmer" && link.dataset.nav === "farmers") ||
          (activeRoute === "order" && link.dataset.nav === "cart") ||
          (activeRoute === "tracking" && link.dataset.nav === "cart"),
      ),
    );
  closeMobileMenu();
  if (page === "products") updateProductList();
  if (page === "farmers") renderFarmers();
  if (page === "details") renderProductDetail(routeParam);
  if (page === "farmer-profile") renderFarmerProfile(routeParam);
  if (page === "cart") renderCart();
  if (page === "favorites") renderFavorites();
  if (page === "checkout") renderCheckoutSummary();
  if (page === "confirmation") renderConfirmation(routeParam);
  if (page === "tracking") renderTracking(routeParam);
  if (page === "dashboard") renderDashboard();
  if (page === "orders") renderOrders();
  if (page === "become-farmer") {
    document.getElementById("farmer-success").classList.add("checkout-hidden");
    const name = document.getElementById("farmer-name");
    const mobile = document.getElementById("farmer-mobile");
    const email = document.getElementById("farmer-email");
    if (currentUser) {
      if (name) {
        name.value = currentUser.name;
        name.readOnly = true;
      }
      if (mobile) {
        mobile.value = currentUser.mobile || "";
        mobile.readOnly = true;
      }
      if (email) {
        email.value = currentUser.email;
        email.readOnly = true;
      }
    }
  }
  updateAuthUI();
  observeReveals();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function observeReveals() {
  const items = document.querySelectorAll(
    ".page-view.active .reveal:not(.revealed)",
  );
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("revealed"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  items.forEach((item) => observer.observe(item));
}
