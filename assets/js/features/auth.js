// Farm2Home authentication and authorization
"use strict";

const AUTH_ACCOUNTS_KEY = "farm2home_accounts";
const SESSION_KEY = "farm2home_session";
let modalReturnFocus = null;

const getAccounts = () => {
  const accounts = loadStorage(AUTH_ACCOUNTS_KEY, []);
  if (!Array.isArray(accounts)) return [];
  let migrated = false;
  const normalizedAccounts = accounts.map((account) => {
    const role = account.role === "farmer" ? "farmer" : "customer";
    if (account.role === role) return account;
    migrated = true;
    const normalizedAccount = { ...account, role };
    if (role !== "farmer") delete normalizedAccount.farmerId;
    return normalizedAccount;
  });
  if (migrated) saveAccounts(normalizedAccounts);
  return normalizedAccounts;
};
const saveAccounts = (accounts) => saveStorage(AUTH_ACCOUNTS_KEY, accounts);
getAccounts();

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();
const normalizeUserRole = (user) => {
  if (!user) return null;
  const role = user.role === "farmer" ? "farmer" : "customer";
  if (role === user.role && (role === "farmer" || !user.farmerId)) return user;
  const normalizedUser = { ...user, role };
  if (role !== "farmer") delete normalizedUser.farmerId;
  return normalizedUser;
};
currentUser = normalizeUserRole(currentUser);
if (currentUser) saveStorage(SESSION_KEY, currentUser);
const validMobile = (mobile) =>
  /^[6-9]\d{9}$/.test(String(mobile || "").trim());
const validPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

const randomSalt = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

function publicAccount(account) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    mobile: account.mobile,
    role: account.role === "farmer" ? "farmer" : "customer",
    joinedAt: account.joinedAt,
    farmerId: account.farmerId || null,
  };
}

function isAuthenticated() {
  return Boolean(currentUser && currentUser.id);
}

function getCurrentUser() {
  return isAuthenticated() ? currentUser : null;
}

function getCurrentRole() {
  return getCurrentUser()?.role || null;
}

function hasRole(...roles) {
  return Boolean(isAuthenticated() && roles.includes(getCurrentRole()));
}

function requireAuthentication(
  action = null,
  message = "Please login to continue.",
) {
  if (isAuthenticated()) return true;
  pendingLoginAction = action;
  showLoginRequired(message);
  return false;
}

function requireLogin(action = null, message = "Please login to continue.") {
  return requireAuthentication(action, message);
}

function requireRole(
  roles,
  message = "You are not authorized to perform this action.",
) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!requireAuthentication(null, "Please login to access this area."))
    return false;
  if (allowed.includes(getCurrentRole())) return true;
  showToast(message, "error");
  return false;
}

function isOwner(record, ownerFields = ["userId", "customerId", "farmerId"]) {
  if (!currentUser || !record) return false;
  return ownerFields.some(
    (field) => String(record[field] ?? "") === String(currentUser.id),
  );
}

function openModal(content) {
  const root = document.getElementById("modal-root");
  modalReturnFocus = document.activeElement;
  root.innerHTML = content;
  document.body.style.overflow = "hidden";
  const firstInput = root.querySelector("input, select, textarea, button");
  if (firstInput) window.setTimeout(() => firstInput.focus(), 40);
}
function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
  document.body.style.overflow = "";
  if (modalReturnFocus instanceof HTMLElement && modalReturnFocus.isConnected)
    modalReturnFocus.focus();
  modalReturnFocus = null;
}

function trapModalFocus(event) {
  if (event.key !== "Tab") return;
  const dialog = document.querySelector("#modal-root [role='dialog']");
  if (!dialog) return;
  const focusable = [
    ...dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      !dialog.contains(document.activeElement))
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (document.activeElement === last ||
      !dialog.contains(document.activeElement))
  ) {
    event.preventDefault();
    first.focus();
  }
}

function showLoginRequired(message) {
  openLoginModal(message);
}

function openLoginModal(message = "") {
  const email = currentUser?.email || "";
  openModal(`<section class="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>
    <span class="eyebrow">Farm2Home account</span>
    <h2 id="auth-title">Welcome back</h2>
    ${message ? `<p class="auth-message">${escapeHtml(message)}</p>` : `<p>Sign in to manage your cart, orders, favorites, and account.</p>`}
    <form class="modal-form" id="login-form">
      <div class="form-field"><label for="login-email">Email address</label><input id="login-email" name="email" type="email" autocomplete="email" required value="${escapeHtml(email)}" placeholder="you@example.com"></div>
      <div class="form-field"><label for="login-password">Password</label><div class="password-field"><input id="login-password" name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="Enter your password"><button type="button" class="password-toggle" data-action="toggle-password" data-target="login-password">Show</button></div></div>
      <button class="button button-block" type="submit">Login</button>
      <div class="auth-links"><button class="text-link" type="button" data-action="open-register">Create account</button><button class="text-link" type="button" data-action="open-reset">Forgot password?</button></div>
    </form>
  </section>`);
}

function openRegisterModal() {
  openModal(`<section class="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>
    <span class="eyebrow">Join Farm2Home</span>
    <h2 id="auth-title">Create your account</h2>
    <p>Start as a customer. You can apply to become a farmer from your account.</p>
    <form class="modal-form" id="register-form">
      <div class="form-field"><label for="register-name">Full name</label><input id="register-name" name="name" maxlength="60" autocomplete="name" required placeholder="Your full name"></div>
      <div class="form-field"><label for="register-mobile">Mobile number</label><input id="register-mobile" name="mobile" type="tel" inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" required placeholder="10-digit mobile"></div>
      <div class="form-field"><label for="register-email">Email address</label><input id="register-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div>
      <div class="form-field"><label for="register-password">Password</label><div class="password-field"><input id="register-password" name="password" type="password" minlength="8" required placeholder="At least 8 characters + a number"><button type="button" class="password-toggle" data-action="toggle-password" data-target="register-password">Show</button></div></div>
      <div class="form-field"><label for="register-confirm">Confirm password</label><input id="register-confirm" name="confirmPassword" type="password" minlength="8" required placeholder="Re-enter your password"></div>
      <label class="check-row"><input type="checkbox" name="terms" required> I agree to the Farm2Home demo terms.</label>
      <button class="button button-block" type="submit">Create account</button>
      <button class="text-link auth-switch" type="button" data-action="open-login">Already have an account? Login</button>
    </form>
  </section>`);
}

function openResetModal() {
  openModal(`<section class="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>
    <span class="eyebrow">Account recovery</span>
    <h2 id="auth-title">Reset your password</h2>
    <p>This frontend demo updates the credential stored in this browser.</p>
    <form class="modal-form" id="reset-form">
      <div class="form-field"><label for="reset-email">Email address</label><input id="reset-email" name="email" type="email" required></div>
      <div class="form-field"><label for="reset-password">New password</label><input id="reset-password" name="password" type="password" minlength="8" required></div>
      <div class="form-field"><label for="reset-confirm">Confirm new password</label><input id="reset-confirm" name="confirmPassword" type="password" minlength="8" required></div>
      <button class="button button-block" type="submit">Update password</button>
      <button class="text-link auth-switch" type="button" data-action="open-login">Back to login</button>
    </form>
  </section>`);
}

async function registerAccount(form) {
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const mobile = String(data.get("mobile") || "").trim();
  const email = normalizeEmail(data.get("email"));
  const password = String(data.get("password") || "");
  const confirm = String(data.get("confirmPassword") || "");
  if (name.length < 2) return showToast("Enter your full name.", "error");
  if (!validMobile(mobile))
    return showToast("Enter a valid 10-digit Indian mobile number.", "error");
  if (!validPassword(password))
    return showToast(
      "Password must be at least 8 characters and include a number.",
      "error",
    );
  if (password !== confirm)
    return showToast("Passwords do not match.", "error");
  const accounts = getAccounts();
  if (accounts.some((account) => account.email === email))
    return showToast("An account with this email already exists.", "error");
  const salt = randomSalt();
  const account = {
    id: `USR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    mobile,
    email,
    role: "customer",
    joinedAt: new Date().toISOString(),
    salt,
    passwordHash: await hashPassword(password, salt),
  };
  accounts.push(account);
  saveAccounts(accounts);
  await startSession(account);
  const nextAction = pendingLoginAction;
  pendingLoginAction = null;
  closeModal();
  showToast(`Welcome to Farm2Home, ${name}.`);
  continuePendingAction(nextAction);
}

async function loginAccount(form) {
  const data = new FormData(form);
  const email = normalizeEmail(data.get("email"));
  const password = String(data.get("password") || "");
  const account = getAccounts().find((item) => item.email === email);
  if (!account)
    return showToast("No Farm2Home account was found for that email.", "error");
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.passwordHash)
    return showToast("Incorrect email or password.", "error");
  await startSession(account);
  const nextAction = pendingLoginAction;
  pendingLoginAction = null;
  closeModal();
  updateAuthUI();
  showToast(`Welcome back, ${account.name}.`);
  continuePendingAction(nextAction);
}

async function startSession(account) {
  currentUser = publicAccount(account);
  saveStorage(SESSION_KEY, currentUser);
  reloadUserState();
  updateAuthUI();
  updateCartCount();
}

async function resetPassword(form) {
  const data = new FormData(form);
  const email = normalizeEmail(data.get("email"));
  const password = String(data.get("password") || "");
  const confirm = String(data.get("confirmPassword") || "");
  if (!validPassword(password))
    return showToast(
      "Password must be at least 8 characters and include a number.",
      "error",
    );
  if (password !== confirm)
    return showToast("Passwords do not match.", "error");
  const accounts = getAccounts();
  const account = accounts.find((item) => item.email === email);
  if (!account)
    return showToast("No Farm2Home account was found for that email.", "error");
  account.salt = randomSalt();
  account.passwordHash = await hashPassword(password, account.salt);
  saveAccounts(accounts);
  closeModal();
  openLoginModal();
  showToast("Password updated. Login with your new password.");
}

function logout() {
  currentUser = null;
  cart = [];
  favorites = [];
  orders = [];
  userPreferences = {};
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
  updateAuthUI();
  closeModal();
  if (["checkout", "dashboard", "order", "tracking"].includes(activeRoute))
    window.location.hash = "#/home";
  else renderRoute();
  showToast("You have been logged out.");
}

function updateAuthUI() {
  const button = document.querySelector(".header-login");
  if (!button) return;
  if (!currentUser) {
    button.textContent = "Login";
    button.dataset.action = "login";
    button.removeAttribute("aria-expanded");
    button.removeAttribute("aria-label");
    button.removeAttribute("title");
    return;
  }
  button.innerHTML = `${escapeHtml(currentUser.name.split(" ")[0])}<span class="header-login-role"> · ${escapeHtml(currentUser.role)}</span>`;
  button.dataset.action = "account-menu";
  button.setAttribute("aria-label", `Open account menu for ${currentUser.name}`);
  button.title = `Open account menu for ${currentUser.name}`;
}

function continuePendingAction(action) {
  if (!action) return;
  if (action.type === "add-cart") addToCart(action.id, action.quantity);
  if (action.type === "buy-now") {
    addToCart(action.id, action.quantity);
    window.location.hash = "#/checkout";
  }
  if (action.type === "checkout") window.location.hash = "#/checkout";
}

function openAccountMenu() {
  const roleLabel = currentUser.role === "farmer" ? "Farmer" : "Customer";
  openModal(`<section class="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="account-title">
    <button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>
    <span class="eyebrow">Your account</span>
    <h2 id="account-title">${escapeHtml(currentUser.name)}</h2>
    <p>${escapeHtml(currentUser.email)} · ${roleLabel}</p>
    <div class="account-actions">
      ${currentUser.role === "farmer" ? `<a class="button button-block" href="#/dashboard" data-route>Farmer dashboard</a>` : `<a class="button button-block" href="#/become-farmer" data-route>Become a Farmer</a>`}
      <a class="button button-soft button-block" href="#/orders" data-route>My Orders</a>
      <button class="button button-soft button-block" type="button" data-action="logout">Logout</button>
    </div>
  </section>`);
}
