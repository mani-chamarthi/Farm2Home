// Farm2Home storage, state and shared helpers
"use strict";
const icon = (name, className = "icon") =>
  `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.leaf}</svg>`;
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&#60;",
        ">": "&#62;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
const loadStorage = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch (error) {
    console.warn(`Could not read ${key} from LocalStorage.`, error);
    return fallback;
  }
};
const saveStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${key} to LocalStorage.`, error);
    showToast("Browser storage is unavailable in this session.", "error");
  }
};
const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
const formatDate = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? dateValue
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
};

let products = loadStorage("farm2home_products", seedProducts);
if (!Array.isArray(products)) products = seedProducts.slice();

let activeRoute = "home";
let routeParam = "";
let selectedDetailQuantity = 1;
let currentUser = loadStorage("farm2home_session", null);
let pendingLoginAction = null;
const deliveryFee = 50;

if (!currentUser || typeof currentUser !== "object" || !currentUser.id)
  currentUser = null;

let cart = currentUser
  ? loadStorage(`farm2home_cart_${currentUser.id}`, [])
  : [];
let favorites = currentUser
  ? loadStorage(`farm2home_favorites_${currentUser.id}`, [])
  : [];
let orders = currentUser
  ? loadStorage(`farm2home_orders_${currentUser.id}`, [])
  : [];
let registeredFarmers = loadStorage("farm2home_farmers", []);
let userPreferences = currentUser
  ? loadStorage(`farm2home_preferences_${currentUser.id}`, {})
  : {};

if (!Array.isArray(cart)) cart = [];
if (!Array.isArray(favorites)) favorites = [];
if (!Array.isArray(orders)) orders = [];
if (!Array.isArray(registeredFarmers)) registeredFarmers = [];
if (!userPreferences || typeof userPreferences !== "object")
  userPreferences = {};

const userStorageKey = (prefix) =>
  currentUser ? `farm2home_${prefix}_${currentUser.id}` : null;
const reloadUserState = () => {
  cart = currentUser ? loadStorage(userStorageKey("cart"), []) : [];
  favorites = currentUser ? loadStorage(userStorageKey("favorites"), []) : [];
  orders = currentUser ? loadStorage(userStorageKey("orders"), []) : [];
  userPreferences = currentUser
    ? loadStorage(userStorageKey("preferences"), {})
    : {};
  if (!Array.isArray(cart)) cart = [];
  if (!Array.isArray(favorites)) favorites = [];
  if (!Array.isArray(orders)) orders = [];
  if (!userPreferences || typeof userPreferences !== "object")
    userPreferences = {};
};

const categoryIcons = Object.fromEntries(categoryInfo);
const statusFor = (product) =>
  Number(product.availableQuantity) <= 0
    ? "Out of Stock"
    : Number(product.availableQuantity) < 15
      ? "Limited Stock"
      : "Fresh";
const statusClass = (status) =>
  status === "Out of Stock"
    ? "stock-out"
    : status === "Limited Stock"
      ? "stock-limited"
      : "stock-fresh";
const getProduct = (id) =>
  products.find((product) => String(product.id) === String(id));
const allFarmers = () => [...seedFarmers, ...registeredFarmers];
const getFarmer = (id) =>
  allFarmers().find((farmer) => String(farmer.id) === String(id));
const getFarmerProducts = (farmerId) =>
  products.filter((product) => String(product.farmerId) === String(farmerId));
const itemCount = () =>
  cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
const cartSubtotal = () =>
  cart.reduce((total, item) => {
    const product = getProduct(item.id);
    return total + (product ? product.price * Number(item.quantity || 0) : 0);
  }, 0);
const saveProducts = () => saveStorage("farm2home_products", products);
const loadAllOrders = () => {
  const allOrders = [];
  const seen = new Set();
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith("farm2home_orders_")) continue;
    const ownerId = key.slice("farm2home_orders_".length);
    const storedOrders = loadStorage(key, []);
    if (!Array.isArray(storedOrders)) continue;
    storedOrders.forEach((order) => {
      if (!order || order.id == null) return;
      const uniqueKey = `${ownerId}:${order.id}`;
      if (seen.has(uniqueKey)) return;
      seen.add(uniqueKey);
      allOrders.push({ ...order, userId: ownerId, _storageKey: key });
    });
  }
  return allOrders;
};
const saveCart = () => {
  if (!currentUser) return;
  saveStorage(userStorageKey("cart"), cart);
  updateCartCount();
};
const saveFavorites = () => {
  if (currentUser) saveStorage(userStorageKey("favorites"), favorites);
};
const saveOrders = () => {
  if (currentUser) saveStorage(userStorageKey("orders"), orders);
};
const savePreferences = () => {
  if (currentUser) saveStorage(userStorageKey("preferences"), userPreferences);
};
