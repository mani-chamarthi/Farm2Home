# Farm2Home 🌾

Farm2Home is a **frontend-only agricultural marketplace** built with **HTML5, CSS3, and Vanilla JavaScript** for a Full Stack Web Development (FSD) lab project.

The platform connects local farmers with customers and provides role-based access for **Farmers and Customers**.

---

## 📌 Project Overview

Farm2Home is designed around two types of users:

| User Type | Main Purpose | Access Level |
| ----------- | ----------- | -------------- |
| 👨‍🌾 **Farmer** | Sell agricultural products | Own product/farmer management |
| 🛒 **Customer** | Discover and purchase products | Shopping and personal account |

The application uses **authentication and role-based authorization** to control access to protected areas.

> **Important:** This version is a frontend academic/demo project. Authentication data is stored in the browser using LocalStorage. A production system should use a backend API and database with server-side authorization.

The static-host entry point is `index.html`, which opens `project-showcase.html`. Select **Open Website** on the showcase to open the marketplace in `marketplace.html`. The original marketplace entry document has been retained there.

---

## ✨ Features

### 🛒 Customer Features

Customers can:

- Register an account
- Login and logout
- Reset their password
- Browse agricultural products
- Search products
- Filter products by category and other criteria
- Sort products
- View product details
- View farmer profiles
- Compare products
- View recently viewed products
- Add products to favorites
- Add products to cart
- Buy products using **Buy Now**
- Checkout
- View their orders
- Track their orders
- Manage their account
- Switch between light and dark themes

### Customer restrictions

Customers **cannot**:

- Add farmer products
- Modify farmer products
- Delete farmer products
- Access the Farmer Dashboard
- Change their own role
- Advance order tracking status
- Access another customer's orders

---

## 👨‍🌾 Farmer Features

Farmers can:

- Register as a Farm2Home customer first
- Apply to become a farmer
- Access the Farmer Dashboard after authorization
- Add new products
- Modify their own products
- Delete their own products
- Manage product quantity
- Update product price
- Update product descriptions
- Select product category
- Specify farming method
- Mark products as organic
- Manage farm/product information

### Farmer authorization

A farmer can manage **only their own product listings**.

```text
Farmer
   │
   ├── Add Product
   │
   ├── View Own Products
   │
   ├── Edit Own Products
   │
   └── Delete Own Products
```

A farmer must not be able to modify another farmer's products.

## 🔐 Authentication & Authorization

Farm2Home uses two separate concepts:

## Authentication

Authentication answers:

> **Who are you?**

The system supports:

- Registration
- Login
- Logout
- Password validation
- Password reset
- Session persistence
- Account information

## Authorization

Authorization answers:

> **What are you allowed to do?**

Farm2Home uses two roles:

```text
┌──────────────┐       ┌──────────────┐
│   FARMER     │       │  CUSTOMER    │
│ Sell/manage  │       │ Buy/compare  │
│ own products │       │ products     │
└──────────────┘       └──────────────┘
```

---

## 👥 Role Permission Matrix

| Feature                     | Customer | Farmer |
| --------------------------- | :------: | :----: |
| Register and login          |    ✅    |   ✅   |
| Browse and search products  |    ✅    |   ✅   |
| Compare products            |    ✅    |   ✅   |
| Favorites and cart          |    ✅    |   ✅   |
| Checkout and view own orders|    ✅    |   ✅   |
| View order tracking         |    ✅    |   ✅   |
| Become a farmer             |    ✅    |   —    |
| Farmer dashboard            |    ❌    |   ✅   |
| Add products                |    ❌    |   ✅   |
| Edit/delete own products    |    ❌    |   ✅   |
| Edit another farmer's items |    ❌    |   ❌   |

---

## 🛍️ Shopping Flow

A customer must be authenticated before performing shopping actions.

```text
Browse Product
      ↓
Add to Cart / Buy Now
      ↓
Is User Logged In?
      │
 ┌────┴────┐
 │         │
 NO       YES
 │         │
 ↓         ↓
Login    Continue
 │
 ↓
Register/Login
 │
 ↓
Continue Original Action
      ↓
     Cart
      ↓
   Checkout
      ↓
 Place Order
```

---

## 📦 Order Tracking Flow

The order tracking timeline is a simulated view of the delivery stages.

```text
Customer places order
        ↓
   Order Placed
        ↓
     Confirmed
        ↓
      Packed
        ↓
     Shipped
        ↓
 Out for Delivery
        ↓
     Delivered
```

The demo currently displays the order's saved stage; it does not provide controls to advance delivery status.

---

## 🧱 Project Architecture

```text
Farm2Home/
│
├── index.html                 # Static-host launcher to the project showcase
├── project-showcase.html      # Project introduction and entry to the marketplace
├── marketplace.html           # Main marketplace application shell
├── README.md
│
├── components/
│   ├── header.html
│   ├── footer.html
│   └── ui-overlays.html
│
├── pages/
│   ├── home.html
│   ├── catalog.html
│   ├── community.html
│   ├── shopping.html
│   ├── account.html
│   └── about.html
│
└── assets/
    ├── css/
    │   ├── base.css
    │   ├── catalog.css
    │   ├── checkout.css
    │   ├── community.css
    │   ├── components.css
    │   ├── dashboard.css
    │   ├── home.css
    │   ├── navigation.css
    │   ├── product.css
    │   ├── responsive.css
    │   └── pages/
    │       └── project-showcase.css
    │
    └── js/
        ├── main.js
        ├── data/
        │   └── catalog.js
        ├── core/
        │   ├── events.js
        │   ├── router.js
        │   └── storage.js
        ├── features/
        │   ├── auth-cart.js
        │   ├── auth.js
        │   ├── commerce-enhancements.js
        │   └── orders.js
        ├── ui/
        │   └── renderers.js
        └── pages/
            └── project-showcase.js
```

---

## 📂 JavaScript Responsibilities

### `main.js`

Application entry point.

Responsible for initializing the application and connecting the major modules.

### `data/catalog.js`

Contains seed application data such as:

- Products
- Farmers
- Categories
- Icons and supporting data

### `core/storage.js`

Handles browser storage and shared application state.

### `core/router.js`

Handles hash-based navigation.

Example:

```text
#/home
#/products
#/product/101
#/cart
#/checkout
#/orders
#/tracking/1001
#/dashboard
```

### `core/events.js`

Handles delegated UI and form events.

### `ui/renderers.js`

Responsible for dynamically rendering:

- Products
- Farmers
- Cart
- Favorites
- Dashboard information
- Other UI sections

### `features/auth.js`

Responsible for:

- Registration
- Login
- Logout
- Password validation
- Password reset
- Session management
- Role checks
- Authorization helpers

### `features/auth-cart.js`

Handles shopping-related actions such as:

- Cart
- Favorites
- Product actions
- Login-required shopping actions

### `features/orders.js`

Handles:

- Checkout
- Order creation
- Order history
- Order tracking
- Farmer dashboard order information

### `features/commerce-enhancements.js`

Handles:

- Product comparison
- Recently viewed products
- Other enhanced shopping functionality

---

## 💾 Data Storage

This project uses browser `localStorage` because it is designed as a frontend-only FSD lab project.
It does not use `sessionStorage`. Account/session, cart, favorites, orders, preferences, catalogue changes, and theme settings are stored in this browser.

Typical application data includes:

```text
farm2home_accounts
farm2home_session
farm2home_cart_<user>
farm2home_favorites_<user>
farm2home_orders_<user>
farm2home_preferences_<user>
farm2home_products
```

User-specific data is separated so that one account does not normally display another account's:

- Cart
- Favorites
- Orders
- Preferences

---

## 🔒 Security Note

This project demonstrates authentication and authorization concepts in a browser.

It is **not production-grade security**.

Because JavaScript and LocalStorage are controlled by the browser, a technically capable user can inspect or modify client-side data.

**Frontend-only limitation:** LocalStorage-based role and session data can be manipulated by the user. Client-side RBAC helps demonstrate expected UI behavior but is not a trusted authorization boundary. Production deployment requires backend authentication and server-side authorization for users, products, orders, role changes, farmer/product ownership, order ownership, and order status transitions.

The current registration flow stores a salted SHA-256 password hash in LocalStorage, not a plaintext password. This browser-side hash is still accessible and alterable, and SHA-256 is not a suitable password-storage scheme for a real service. The demo password-reset flow does not verify the user's identity. Do not use real personal information or credentials with this prototype.

Checkout, payment choices, delivery dates, and order tracking are simulations; there is no payment gateway, delivery service, or server-side database. LocalStorage data is limited to one browser profile and does not synchronize across users or devices. The account menu displays basic account details, but there is no separate customer profile-editing page. Product and farmer images are loaded from Pexels, so those images require an internet connection.

For a real Farm2Home deployment, the recommended architecture is:

```text
Frontend
HTML + CSS + JavaScript
          ↓
       REST API
          ↓
Flask / Django / Node.js
          ↓
      Database
          ↓
Server-side Authentication
          ↓
Server-side RBAC
          ↓
Secure Order Management
```

Production authentication should include:

- Server-side password hashing
- Secure sessions or access tokens
- HTTPS
- Database-backed accounts
- Server-side role checks
- Server-side ownership checks
- Input validation
- CSRF protection where applicable
- Rate limiting
- Email verification
- Secure password reset

---

## 🚀 How to Run

Because the application loads HTML components/pages using JavaScript `fetch()`, do **not** open `index.html` directly using:

```text
file://
```

Use a local HTTP server.

### Option 1 — VS Code Live Server

1. Open the `Farm2Home` folder in VS Code.
2. Install the **Live Server** extension.
3. Start Live Server from the project root (for example, right-click `index.html` and select **Open with Live Server**).
4. Open the root URL; it will show the project showcase first.
5. Select **Open Website** to enter the marketplace.

### Option 2 — Python HTTP Server

From the Farm2Home directory:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

The root URL and `/index.html` open the showcase. You can also open `/project-showcase.html` directly, or visit `/marketplace.html` to access the marketplace without going through the showcase. Do not open the marketplace HTML using `file://`; the app fetches its page and component templates over HTTP.

### Static deployment

Publish the contents of this folder without changing their relative paths. Configure static hosting to serve the root `index.html` as its default document; it redirects to the showcase using a relative URL. The showcase button links to `marketplace.html`, and the marketplace footer links back to `project-showcase.html`. These relative paths also work when the project is served from a subdirectory.

Do not replace the `index.html` launcher with the marketplace file if the showcase is required as the first page.

---

## 🧪 Recommended Testing

There is no package manager, build step, or automated test suite in this static project. Run it through a local HTTP server and use disposable data when testing. The following checks cover the current UI:

### Customer Test

```text
Register
   ↓
Login
   ↓
Browse Products
   ↓
Compare Products
   ↓
Add to Cart
   ↓
Checkout
   ↓
Place Order
   ↓
View Order
   ↓
View Tracking
```

Verify that the customer cannot:

```text
Open Farmer Dashboard
Advance Order Status
Manage Other Users
Modify Other Farmers' Products
```

### Farmer Test

```text
Customer Account
      ↓
Become a Farmer
      ↓
Farmer Authorization
      ↓
Dashboard
      ↓
Add Product
      ↓
Edit Product
      ↓
Delete Product
```

Verify that a farmer cannot modify another farmer's product.

For a JavaScript syntax check, run `node --check` on the files in `assets/js/`. Check the browser console and network panel for errors or missing assets. Test responsive layouts at 320px, 375px, 425px, 768px, 1024px, 1366px, 1440px, and 1920px.

---

## 🎓 FSD Lab Learning Outcomes

This project demonstrates:

- HTML5 semantic structure
- CSS3 responsive design
- Vanilla JavaScript
- SPA-style hash routing
- DOM manipulation
- Event delegation
- LocalStorage
- Form validation
- Authentication concepts
- Authorization concepts
- Role-Based Access Control (RBAC)
- Ownership-based authorization
- E-commerce cart management
- Product comparison
- Order management
- Order tracking
- Responsive UI design
- Modular frontend architecture

---

## 🔮 Future Enhancements

Possible next versions:

1. **Backend Authentication**
   - Flask/Django REST API
   - Database accounts
   - Server-side authorization

2. **Payment Integration**
   - Payment gateway
   - Payment verification
   - Transaction history

3. **Notifications**
   - Order updates
   - Farmer notifications
   - Customer notifications

4. **Advanced Search**
   - Location-based search
   - Price range
   - Organic-only filter
   - Availability filter

5. **Database**
   - MySQL/PostgreSQL
   - Products
   - Users
   - Farmers
   - Orders
   - Reviews

---

## 👨‍💻 Project Type

**Project:** Farm2Home  
**Category:** Agricultural E-Commerce Marketplace  
**Technology:** HTML5 + CSS3 + Vanilla JavaScript  
**Architecture:** Modular Frontend SPA  
**Authentication:** Browser-based demo authentication  
**Authorization:** Role-Based Access Control (RBAC)  
**Roles:** Customer, Farmer  
**Target:** Full Stack Web Development Lab / Academic Project

---

## 📜 License

This project is intended for educational and academic demonstration purposes.
