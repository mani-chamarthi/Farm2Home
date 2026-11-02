// Farm2Home checkout, orders and tracking
"use strict";
const ORDER_STAGES = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];
const orderDateLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
};

function createOrderId() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  let candidate;
  do {
    candidate = `F2H${stamp}${Math.floor(10000 + Math.random() * 90000)}`;
  } while (orders.some((order) => order.id === candidate));
  return candidate;
}

function placeOrder(form) {
  if (
    !requireLogin(
      { type: "checkout" },
      "Please login before placing your order.",
    )
  )
    return;
  if (!cart.length) {
    showToast("Add a product to your cart before checkout.", "error");
    return;
  }
  const hasUnavailableItems = cart.some((item) => {
    const product = getProduct(item.id);
    const quantity = Number(item.quantity);
    const availableQuantity = Number(product?.availableQuantity);
    return (
      !product ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      !Number.isFinite(availableQuantity) ||
      quantity > availableQuantity
    );
  });
  if (hasUnavailableItems) {
    showToast(
      "Some products are no longer available in the requested quantity. Review your cart before checkout.",
      "error",
    );
    window.location.hash = "#/cart";
    return;
  }
  const data = new FormData(form);
  const now = new Date();
  const deliveryDate = new Date(now);
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const order = {
    id: createOrderId(),
    userId: currentUser.id,
    customerName: data.get("name").trim(),
    mobile: data.get("mobile").trim(),
    email: data.get("email").trim(),
    address: `${data.get("address").trim()}, ${data.get("area").trim()}, ${data.get("city").trim()}, ${data.get("state")}, ${data.get("pincode").trim()}`,
    paymentMethod: data.get("payment"),
    items: cart.map((item) => {
      const product = getProduct(item.id);
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        unit: product.unit,
        image: product.image,
        farmerId: product.farmerId,
        quantity: Number(item.quantity),
        farmerName: product.farmerName,
      };
    }),
    subtotal: cartSubtotal(),
    delivery: deliveryFee,
    total: cartSubtotal() + deliveryFee,
    placedAt: now.toISOString(),
    expectedDelivery: new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(deliveryDate),
    stage: 0,
  };
  orders.unshift(order);
  saveOrders();
  cart.forEach((item) => {
    const product = getProduct(item.id);
    if (product)
      product.availableQuantity = Math.max(
        0,
        Number(product.availableQuantity) - Number(item.quantity),
      );
  });
  saveProducts();
  cart = [];
  saveCart();
  renderHome();
  showToast("Order placed successfully.");
  window.location.hash = `#/order/${encodeURIComponent(order.id)}`;
}

function renderConfirmation(id) {
  if (!requireLogin()) return;
  const order = orders.find(
    (item) =>
      String(item.id) === String(id) &&
      String(item.userId || currentUser.id) === String(currentUser.id),
  );
  const target = document.getElementById("confirmation-content");
  if (!order) {
    target.innerHTML = `<div class="empty-state"><span class="empty-icon">${icon("parcel")}</span><h3>No recent order to show</h3><p>Your order confirmation will appear here after checkout.</p><a class="button" href="#/products" data-route>Browse products</a></div>`;
    return;
  }
  target.innerHTML = `<div class="confirmation-head"><span class="success-mark">${icon("check")}</span><span class="eyebrow">Thanks for supporting local growers</span><h1>Order Placed Successfully</h1><p>Your demo order is in. We have saved the details in this browser.</p></div><div class="confirmation-sheet"><div class="confirmation-main"><h2>Items in your order</h2>${order.items.map((item) => `<div class="confirmation-item"><img src="${escapeHtml(item.image)}" alt=""><div><strong>${escapeHtml(item.name)}</strong><span>${Number(item.quantity)} ${escapeHtml(item.unit)} · ${escapeHtml(item.farmerName)}</span></div><b>${money(item.price * item.quantity)}</b></div>`).join("")}</div><aside class="confirmation-side"><h2>Delivery details</h2><div class="confirmation-meta"><span>Order ID</span><strong>${escapeHtml(order.id)}</strong></div><div class="confirmation-meta"><span>Customer</span><strong>${escapeHtml(order.customerName)}</strong></div><div class="confirmation-meta"><span>Delivering to</span><strong>${escapeHtml(order.address)}</strong></div><div class="confirmation-meta"><span>Payment method</span><strong>${escapeHtml(order.paymentMethod)}</strong></div><div class="confirmation-meta"><span>Expected delivery</span><strong>${escapeHtml(order.expectedDelivery)}</strong></div><div class="confirmation-total"><span>Total paid / due</span><span>${money(order.total)}</span></div></aside></div><div class="confirmation-actions"><a class="button" href="#/tracking/${encodeURIComponent(order.id)}" data-route>Track My Order ${icon("arrow")}</a><a class="button button-soft" href="#/products" data-route>Continue shopping</a></div>`;
}

function renderTracking(id) {
  if (!requireLogin()) return;
  const order = orders.find(
    (item) =>
      String(item.id) === String(id) &&
      String(item.userId || currentUser.id) === String(currentUser.id),
  );
  const target = document.getElementById("tracking-content");
  if (!order) {
    target.innerHTML = `<div class="empty-state"><span class="empty-icon">${icon("truck")}</span><h3>No order to track yet</h3><p>Place a demo order and its delivery timeline will be available here.</p><a class="button" href="#/products" data-route>Shop the harvest</a></div>`;
    return;
  }
  const stage = Math.max(0, Math.min(5, Number(order.stage ?? 0)));
  const steps = ORDER_STAGES.map((title) => [title, {
    "Order Placed": "Your basket is confirmed",
    Confirmed: "The farm is preparing it",
    Packed: "Packed for the journey",
    Shipped: "Your order has left the farm",
    "Out for Delivery": "On its way to you",
    Delivered: "Delivered to your home",
  }[title]]);
  target.innerHTML = `<div class="tracking-card"><div class="tracking-order-line"><div><span>Order reference</span><strong>${escapeHtml(order.id)}</strong></div><div><span>Expected delivery</span><strong>${escapeHtml(order.expectedDelivery)}</strong></div><div><span>Order total</span><strong>${money(order.total)}</strong></div></div><div class="timeline" aria-label="Order delivery progress">${steps.map(([title, description], index) => `<div class="timeline-step ${index < stage ? "complete" : ""} ${index === stage ? "current" : ""}"><span class="timeline-dot">${index < stage ? icon("check") : index === stage ? icon("truck") : icon("clock")}</span><strong>${title}</strong><span>${description}</span></div>`).join("")}</div><div class="tracking-actions"><p>${stage < 5 ? `Current status: <strong>${steps[stage][0]}</strong>. This delivery timeline is simulated.` : "This demo order has been marked as delivered."}</p>${stage >= 5 ? `<a class="button button-soft button-small" href="#/products" data-route>Shop again</a>` : ""}</div></div>`;
}

function renderOrders() {
  const target = document.getElementById("orders-content");
  if (!target || !currentUser) return;
  if (!orders.length) {
    target.innerHTML = `<div class="empty-state"><h3>No orders yet</h3><p>Your completed orders will appear here.</p><a class="button" href="#/products" data-route>Shop products</a></div>`;
    return;
  }
  target.innerHTML = `<div class="order-history-grid">${orders.map((order) => `<article class="order-history-card"><div><span class="eyebrow">Order</span><strong>${escapeHtml(order.id)}</strong><small>${escapeHtml(order.expectedDelivery)}</small></div><div><b>${money(order.total)}</b><span>${order.items.length} item(s)</span></div><a class="button button-small" href="#/tracking/${encodeURIComponent(order.id)}" data-route>Track order</a></article>`).join("")}</div>`;
}

function renderDashboard() {
  const target = document.getElementById("dashboard-content");
  if (
    !requireRole("farmer", "Farmer authorization is required for this dashboard.")
  )
    return;
  const visibleProducts = products.filter(
    (product) => String(product.farmerId) === String(currentUser.farmerId),
  );
  const orderCount = orders.length;
  const salesValue = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0,
  );
  const tableRows = visibleProducts
    .map((product) => {
      const status = statusFor(product);
      const statusModifier =
        status === "Fresh"
          ? ""
          : status === "Limited Stock"
            ? " limited"
            : " out";
      return `<tr><td><div class="table-product"><img src="${escapeHtml(product.image)}" alt=""><div><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.category)} · ${escapeHtml(product.location)}</span></div></div></td><td>${money(product.price)} / ${escapeHtml(product.unit)}</td><td>${Number(product.availableQuantity)} ${escapeHtml(product.unit)}</td><td><span class="status-label${statusModifier}">${escapeHtml(status)}</span></td><td><div class="table-actions"><button type="button" data-action="edit-product" data-id="${escapeHtml(product.id)}" aria-label="Edit ${escapeHtml(product.name)}">${icon("edit")}</button><button class="delete" type="button" data-action="delete-product" data-id="${escapeHtml(product.id)}" aria-label="Delete ${escapeHtml(product.name)}">${icon("trash")}</button></div></td></tr>`;
    })
    .join("");
  target.innerHTML = `<div class="dashboard-top"><div><h2>Good morning, ${escapeHtml(currentUser.name)}</h2><p>Keep your farm listings current and easy to discover.</p></div><button class="button" type="button" data-action="add-product">${icon("plus")} Add product</button></div><div class="metric-grid"><article class="metric"><span>Products listed</span><strong>${visibleProducts.length}</strong><small>Your active listings</small></article><article class="metric"><span>Orders placed</span><strong>${orderCount}</strong><small>Orders from this account</small></article><article class="metric"><span>Listings</span><strong>${visibleProducts.filter((product) => Number(product.availableQuantity) > 0).length}</strong><small>Currently available</small></article><article class="metric"><span>Sales</span><strong>${money(salesValue)}</strong><small>Illustrative dashboard total</small></article></div><section class="table-panel"><div class="table-header"><h3>Product management</h3><span class="result-count">Changes are saved in this browser</span></div><div class="table-scroll"><table class="product-table"><thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Status</th><th>Actions</th></tr></thead><tbody>${tableRows || `<tr><td colspan="5">No products listed. Add a product to begin.</td></tr>`}</tbody></table></div></section>`;
  if (currentUser.role === "farmer") {
    const relevantOrders = loadAllOrders()
      .map((order) => ({
        ...order,
        relevantItems: (order.items || []).filter((item) => {
          const product = getProduct(item.id);
          return String(item.farmerId ?? product?.farmerId ?? "") === String(currentUser.farmerId);
        }),
      }))
      .filter((order) => order.relevantItems.length);
    const rows = relevantOrders.map((order) => `<tr><td>${escapeHtml(order.id)}</td><td>${escapeHtml(orderDateLabel(order.placedAt))}</td><td>${order.relevantItems.map((item) => `${escapeHtml(item.name)} × ${Number(item.quantity)}`).join("<br>")}</td><td>${escapeHtml(ORDER_STAGES[Math.max(0, Math.min(ORDER_STAGES.length - 1, Number(order.stage) || 0))])}</td></tr>`).join("");
    target.insertAdjacentHTML("beforeend", `<section class="table-panel farmer-orders-panel"><div class="table-header"><h3>Orders for your products</h3><span class="result-count">Customer contact and address details are not shown</span></div><div class="table-scroll"><table class="product-table"><thead><tr><th>Order</th><th>Placed</th><th>Your products</th><th>Status</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No orders include your listings yet.</td></tr>`}</tbody></table></div></section>`);
  }
}
