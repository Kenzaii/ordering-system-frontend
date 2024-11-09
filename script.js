// Predefined username and password
const predefinedUsername = "AMNC";
const predefinedPassword = "password";

// Check if user is already logged in
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("isLoggedIn") === "true") {
        showOrderingSystem();
        showSection('product'); // Show product section immediately after login
    } else {
        showLoginPage();
    }

    // Add Enter key listener to login fields
    document.getElementById("username").addEventListener("keypress", handleEnterKey);
    document.getElementById("password").addEventListener("keypress", handleEnterKey);
});

// Function to handle Enter key for login
function handleEnterKey(event) {
    if (event.key === "Enter") {
        login();
    }
}

// Show login page
function showLoginPage() {
    document.getElementById("login-section").style.display = "block";
    document.getElementById("ordering-system").style.display = "none";
}

// Show ordering system after login
function showOrderingSystem() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("ordering-system").style.display = "block";
    showSection('product'); // Show product section immediately
    loadOrderHistory();
}

// Handle login
function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const loginError = document.getElementById("login-error");

    if (username === predefinedUsername && password === predefinedPassword) {
        localStorage.setItem("isLoggedIn", "true");
        showOrderingSystem();
    } else {
        loginError.textContent = "Invalid username or password!";
    }
}

// Handle logout
function logout() {
    localStorage.removeItem("isLoggedIn");
    showLoginPage();
}

// Add both products to the cart and display order summary
function addToCart() {
    const quantity1 = parseInt(document.getElementById("quantity1").value) || 0;
    const quantity2 = parseInt(document.getElementById("quantity2").value) || 0;

    const product1 = {
        productName: "Jinro Chamisul Fresh Soju",
        quantity: quantity1,
        price: 9.25,
        total: (quantity1 * 9.25).toFixed(2)
    };

    const product2 = {
        productName: "Jinro Gold",
        quantity: quantity2,
        price: 9.75,
        total: (quantity2 * 9.75).toFixed(2)
    };

    const cart = [product1, product2].filter(product => product.quantity > 0); // Only add if quantity > 0
    localStorage.setItem("cart", JSON.stringify(cart));

    // Automatically show the order summary after adding items to cart
    showOrderSummary();
}

// Display the order summary
function showOrderSummary() {
    showSection('order-summary'); // Automatically highlight Order Summary tab
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const summaryList = document.getElementById("summary-list");
    summaryList.innerHTML = cart.map(item => `
        <li>${item.productName}: Quantity ${item.quantity}, Total $${item.total}</li>
    `).join("");

    const totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2);
    document.getElementById("total-amount").textContent = totalAmount;
}

// Confirm the order and add it to order history
function confirmOrder() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) return alert("Your cart is empty!");

    const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
    orderHistory.push({
        date: new Date().toLocaleString(),
        items: cart,
        totalAmount: cart.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2)
    });
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

    alert("Order confirmed!");
    loadOrderHistory();
    showSection('order-history');
    localStorage.removeItem("cart"); // Clear cart after confirming order
}

// Load order history from local storage
function loadOrderHistory() {
    const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = orderHistory.map((order, index) =>
        `<li>Order #${index + 1} (${order.date}): Total $${order.totalAmount}</li>`
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

    // Update active tab in navigation menu
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => button.classList.remove('active'));
    document.querySelector(`button[data-section="${sectionId}"]`).classList.add('active');
}

function confirmOrder() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) return alert("Your cart is empty!");

    const orderSummary = cart.map(item => `${item.productName}: Quantity ${item.quantity}, Total $${item.total}`).join('\n');
    const totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2);

    // Add to order history in local storage
    const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
    orderHistory.push({
        date: new Date().toLocaleString(),
        items: cart,
        totalAmount
    });
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

    // Send order confirmation email
    fetch('http://localhost:3000/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to: "customer_email@example.com", // Replace with customer's email address
            orderSummary,
            totalAmount
        })
    })
    .then(response => {
        if (response.ok) {
            alert("Order confirmed! A confirmation email has been sent.");
        } else {
            alert("Order confirmed, but failed to send confirmation email.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Order confirmed, but there was an error sending the confirmation email.");
    });

    loadOrderHistory();
    showSection('order-history');
    localStorage.removeItem("cart"); // Clear cart after confirming order
}
