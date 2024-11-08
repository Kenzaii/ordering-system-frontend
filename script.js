const backendUrl = 'https://your-backend-url.up.railway.app'; // Replace with your actual backend URL

// Add product to cart and store order in backend
async function addToCart() {
    const quantity = parseInt(document.getElementById("quantity").value);
    const price = 25.00;
    const productName = "Super Widget";
    const total = (price * quantity).toFixed(2);

    const order = { productName, quantity, total };

    try {
        // Send order to the backend
        const response = await fetch(`${backendUrl}/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        
        if (response.ok) {
            alert('Order placed and stored in database!');
            updateOrderSummary(order);
            loadOrderHistory(); // Reload history after placing order
        } else {
            alert('Failed to place order. Please try again.');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Error placing order. Please try again.');
    }
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

// Show specific section (order page, summary, or history)
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}

// Fetch order history from the backend and display it
async function loadOrderHistory() {
    try {
        const response = await fetch(`${backendUrl}/orders`);
        if (!response.ok) throw new Error('Failed to fetch order history');
        
        const orders = await response.json();
        const historyList = document.getElementById("history-list");
        historyList.innerHTML = orders.map((order, index) =>
            `<li>Order #${index + 1}: ${order.product_name}, Quantity: ${order.quantity}, Total: $${order.total}</li>`
        ).join("");
    } catch (error) {
        console.error('Error fetching order history:', error);
    }
}

// Load order history on page load
document.addEventListener('DOMContentLoaded', loadOrderHistory);
