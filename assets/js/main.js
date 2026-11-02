// Farm2Home application bootstrap
"use strict";
function initialize() {
  let storedTheme = "light";
  try {
    storedTheme = localStorage.getItem("theme") || "light";
  } catch (error) {
    console.warn("Theme preference could not be loaded.", error);
  }
  setTheme(storedTheme);
  updateAuthUI();
  updateCartCount();
  renderCategories();
  const priceControl = document.getElementById("max-price");
  const priceCeiling = Math.max(
    400,
    Math.ceil(
      Math.max(...products.map((product) => Number(product.price) || 0)) / 50,
    ) * 50,
  );
  priceControl.max = priceCeiling;
  priceControl.value = priceCeiling;
  document.getElementById("max-price-label").textContent = money(priceCeiling);
  renderHome();
  [
    "filter-category",
    "filter-location",
    "filter-method",
    "product-sort",
  ].forEach((id) => {
    if (userPreferences[id])
      document.getElementById(id).value = userPreferences[id];
  });
  if (window.location.hash) renderRoute();
  else {
    window.location.hash = "#/home";
    renderRoute();
  }
}

async function loadTemplates() {
  const components = ["header", "footer", "ui-overlays"];
  const pages = [
    "home",
    "catalog",
    "community",
    "shopping",
    "account",
    "about",
  ];
  const load = async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.text();
  };
  const [header, footer, ...rest] = await Promise.all([
    ...components.map((name) => load(`components/${name}.html`)),
    ...pages.map((name) => load(`pages/${name}.html`)),
  ]);
  document.getElementById("site-header").innerHTML = header;
  document.getElementById("site-footer").innerHTML = footer;
  const overlays = document.getElementById("site-overlays");
  overlays.innerHTML = rest[0];
  document.getElementById("page-root").innerHTML = rest.slice(1).join("\n");
}

async function bootstrap() {
  try {
    await loadTemplates();
    setupEvents();
    initialize();
  } catch (error) {
    console.error(error);
    document.getElementById("page-root").innerHTML =
      `<section class="container page-heading"><h1>Farm2Home could not load</h1><p>Please run the project with VS Code Live Server or another local web server.</p></section>`;
  }
}

bootstrap();
