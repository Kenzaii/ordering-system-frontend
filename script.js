// Load order history on page load
document.addEventListener('DOMContentLoaded', loadOrderHistory);

// Add product to cart and store order temporarily
function addToCart() {
    const quantity = parseInt(document.getElementById("quantity").value);
    const price = 25.00;
    const productName = "Super Widget";
    const total = (price * quantity).toFixed(2);

    // Store temporary order details for summary
    const order = { productName, quantity, total };
    localStorage.setItem("currentOrder", JSON.stringify(order));
    
    updateOrderSummary(order);
}

// Update order summary
function updateOrderSummary(order) {
    showSection('order-summary');
    const summaryList = document.getElementById("summary-list");
    summaryList.innerHTML = `
        <li>Product: ${order.productName}</li>
        <li>Quantity: ${order.quantity}</li>
        <li>Total: $${order.total}</li>
    `;
}

// Confirm the order and add it to order history
function confirmOrder() {
    const order = JSON.parse(localStorage.getItem("currentOrder"));
    if (!order) return alert("No order to confirm.");

    // Retrieve existing order history or create a new array
    const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
    
    // Add current order to history
    orderHistory.push(order);
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));
    
    alert("Order confirmed!");
    loadOrderHistory();
    showSection('order-history');
    localStorage.removeItem("currentOrder"); // Clear current order
}

// Load order history from local storage
function loadOrderHistory() {
    const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = orderHistory.map((order, index) =>
        `<li>Order #${index + 1}: ${order.productName}, Quantity: ${order.quantity}, Total: $${order.total}</li>`
    ).join("");
}

// Clear the order history
function clearOrderHistory() {
    if (confirm("Are you sure you want to clear the order history?")) {
        localStorage.removeItem("orderHistory");
        loadOrderHistory();
    }
}

// Show specific section (order page, summary, or history)
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}
