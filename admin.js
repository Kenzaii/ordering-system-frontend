//script for Popout Chat
const chatButton = document.getElementById('chatButton');
const chatContainer = document.getElementById('chatContainer');
const chatOverlay = document.getElementById('chatOverlay');
const closeButton = document.getElementById('closeButton');

function openChat() {
    chatOverlay.style.display = 'block';
    chatContainer.style.display = 'block';
    chatOverlay.classList.remove('fade-out');
    chatContainer.classList.remove('fade-out');
    chatOverlay.classList.add('fade-in');
    chatContainer.classList.add('fade-in');
}

function closeChat() {
    chatOverlay.classList.remove('fade-in');
    chatContainer.classList.remove('fade-in');
    chatOverlay.classList.add('fade-out');
    chatContainer.classList.add('fade-out');
    setTimeout(() => {
        chatOverlay.style.display = 'none';
        chatContainer.style.display = 'none';
    }, 300);
}

chatButton.addEventListener('click', openChat);
closeButton.addEventListener('click', closeChat);

// Close chat when clicking outside
chatOverlay.addEventListener('click', (e) => {
    if (e.target === chatOverlay) {
        closeChat();
    }
});

// Prevent closing when clicking inside the chat container
chatContainer.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Handle escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatContainer.style.display === 'block') {
        closeChat();
    }
});

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Fetch users from Airtable, specifically looking for admin
        const response = await fetchAirtable('Users');
        const users = response.records;
        
        // Look for admin user
        const adminUser = users.find(user => user.fields.Role === 'admin');
        
        if (adminUser) {
            console.log('Admin user found:', adminUser);
            // Initialize admin page
            fetchProducts();
            showSection('products'); // Show default section
        } else {
            console.log('No admin user found');
            // Optionally handle non-admin case
        }
        
    } catch (error) {
        console.error('Error checking admin user:', error);
    }
});

function removePlaceholders() {
    // Remove placeholders from all inputs
    document.querySelectorAll('input').forEach(input => {
        input.placeholder = '';
        input.removeAttribute('placeholder');
    });
}

function ensurePlaceholders() {
    // For add product form
    const addNameInput = document.getElementById('productName');
    const addPriceInput = document.getElementById('productPrice');
    const addImageInput = document.getElementById('productImage');

    if (addNameInput) {
        addNameInput.setAttribute('placeholder', 'Product Name *');
    }
    if (addPriceInput) {
        addPriceInput.setAttribute('placeholder', 'Price ($) *');
    }
    if (addImageInput) {
        addImageInput.setAttribute('placeholder', 'Image URL *');
    }

    // For edit product form
    const editNameInput = document.getElementById('productName');
    const editPriceInput = document.getElementById('productPrice');
    const editImageInput = document.getElementById('productImage');

    if (editNameInput) {
        editNameInput.setAttribute('placeholder', 'Product Name *');
    }
    if (editPriceInput) {
        editPriceInput.setAttribute('placeholder', 'Price ($) *');
    }
    if (editImageInput) {
        editImageInput.setAttribute('placeholder', 'Image URL *');
    }
}

function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Ensure placeholders are set after modal is added to DOM
    setTimeout(ensurePlaceholders, 0);
}

async function fetchCustomerIDs() {
    try {
        const response = await fetchAirtable('Users');
        return response.records.map(user => user.fields.CustomerID).filter(Boolean);
    } catch (error) {
        console.error('Error fetching customer IDs:', error);
        return [];
    }
}

async function addProduct() {
    try {
        const customerIDs = await fetchCustomerIDs();
        
        const customerOptions = customerIDs.map(id => `
            <option value="${id}">${id}</option>
        `).join('');

        const modalContent = `
            <form id="addProductForm" class="admin-form">
                <div class="form-group">
                    <input type="text" 
                           id="productName" 
                           name="productName"
                           placeholder="Product Name *"
                           required>
                </div>
                <div class="form-group">
                    <input type="number" 
                           id="productPrice" 
                           name="productPrice"
                           placeholder="Price ($) *"
                           step="0.01" 
                           min="0" 
                           required>
                </div>
                <div class="form-group">
                    <input type="url" 
                           id="productImage" 
                           name="productImage"
                           placeholder="Image URL *"
                           required>
                    <div class="image-preview" id="imagePreview"></div>
                </div>
                <div class="form-group">
                    <select id="assignedCustomer" name="assignedCustomer" multiple>
                        ${customerOptions}
                    </select>
                    <small class="help-text">Hold Ctrl/Cmd to select multiple customers</small>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Product</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        `;

        showModal('Add New Product', modalContent);

        // Image preview handler
        document.getElementById('productImage').addEventListener('input', function() {
            const imageUrl = this.value;
            const previewDiv = document.getElementById('imagePreview');
            if (imageUrl) {
                previewDiv.innerHTML = `<img src="${imageUrl}" alt="Preview" onerror="this.src='placeholder.jpg'">`;
            } else {
                previewDiv.innerHTML = '';
            }
        });

        // Form submission handler
        document.getElementById('addProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const selectElement = document.getElementById('assignedCustomer');
            const selectedCustomers = Array.from(selectElement.selectedOptions)
                .map(option => option.value)
                .filter(Boolean);

            const productData = {
                fields: {
                    "Name": document.getElementById('productName').value.trim(),
                    "Price": parseFloat(document.getElementById('productPrice').value),
                    "ImageURL": document.getElementById('productImage').value.trim(),
                    "AssignedCustomerIDs": selectedCustomers
                }
            };

            console.log('Submitting product data:', productData);

            try {
                const result = await createAirtableRecord('Products', productData);
                console.log('Airtable response:', result);
                
                if (result && result.id) {
                    closeModal();
                    await fetchProducts();
                    showNotification('Product added successfully!', 'success');
                } else {
                    throw new Error('Invalid response from Airtable');
                }
            } catch (error) {
                console.error('Error adding product:', error);
                showNotification('Error adding product: ' + error.message, 'error');
            }
        });
    } catch (error) {
        console.error('Error setting up add product form:', error);
        showNotification('Error setting up form: ' + error.message, 'error');
    }
}

async function fetchProducts() {
    try {
        const response = await fetchAirtable('Products');
        const productsList = document.getElementById('products-list');
        
        if (!response.records || response.records.length === 0) {
            productsList.innerHTML = '<p class="empty-message">No products found</p>';
            return;
        }

        const productsHTML = response.records.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.fields.ImageURL || 'placeholder.jpg'}" 
                         alt="${product.fields.Name}"
                         onerror="this.src='placeholder.jpg'">
                </div>
                <div class="product-details">
                    <div class="product-header">
                        <h3>${product.fields.Name}</h3>
                        <span class="price">$${product.fields.Price}</span>
                    </div>
                    <div class="customer-info">
                        Assigned to: 
                        ${product.fields.AssignedCustomerIDs?.length ? 
                            product.fields.AssignedCustomerIDs.map(id => 
                                `<span class="customer-badge">${id}</span>`
                            ).join(' ') : 
                            '<span class="customer-badge unassigned">Unassigned</span>'
                        }
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-sm btn-secondary" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        productsList.innerHTML = productsHTML;
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('products-list').innerHTML = 
            '<p class="error-message">Error loading products: ' + error.message + '</p>';
    }
}

async function editProduct(productId) {
    try {
        const [product, customerIDs] = await Promise.all([
            fetchAirtableRecord('Products', productId),
            fetchCustomerIDs()
        ]);
        
        const customerOptions = customerIDs.map(id => `
            <option value="${id}" 
                ${product.fields.AssignedCustomerIDs?.includes(id) ? 'selected' : ''}>
                ${id}
            </option>
        `).join('');

        const modalContent = `
            <form id="editProductForm" class="admin-form">
                <div class="form-group">
                    <input type="text" 
                           id="productName" 
                           name="productName"
                           value="${product.fields.Name || ''}" 
                           placeholder="Product Name *"
                           required>
                </div>
                <div class="form-group">
                    <input type="number" 
                           id="productPrice" 
                           name="productPrice"
                   value="${product.fields.Price || ''}" 
                   placeholder="Price ($) *"
                   step="0.01" 
                   min="0" 
                   required>
                </div>
                <div class="form-group">
                    <input type="url" 
                           id="productImage" 
                           name="productImage"
                   value="${product.fields.ImageURL || ''}" 
                   placeholder="Image URL *"
                   required>
                    <div class="image-preview" id="imagePreview">
                        ${product.fields.ImageURL ? `<img src="${product.fields.ImageURL}" alt="Preview">` : ''}
                    </div>
                </div>
                <div class="form-group">
                    <select id="assignedCustomer" name="assignedCustomer" multiple>
                        ${customerOptions}
                    </select>
                    <small class="help-text">Hold Ctrl/Cmd to select multiple customers</small>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Update Product</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        `;

        showModal('Edit Product', modalContent);
        ensurePlaceholders();
        
        // Set up image preview
        document.getElementById('productImage').addEventListener('input', function() {
            const imageUrl = this.value;
            const previewDiv = document.getElementById('imagePreview');
            if (imageUrl) {
                previewDiv.innerHTML = `<img src="${imageUrl}" alt="Preview" onerror="this.src='placeholder.jpg'">`;
            } else {
                previewDiv.innerHTML = '';
            }
        });

        // Form submission handler
        document.getElementById('editProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const selectElement = document.getElementById('assignedCustomer');
            const selectedCustomers = Array.from(selectElement.selectedOptions)
                .map(option => option.value);
            
            const productData = {
                Name: document.getElementById('productName').value,
                Price: parseFloat(document.getElementById('productPrice').value),
                ImageURL: document.getElementById('productImage').value,
                AssignedCustomerIDs: selectedCustomers
            };

            console.log('Updating product with data:', productData); // Debug log

            try {
                await updateAirtableRecord('Products', productId, productData);
                closeModal();
                fetchProducts();
                showNotification('Product updated successfully!', 'success');
            } catch (error) {
                console.error('Error updating product:', error);
                showNotification('Error updating product: ' + error.message, 'error');
            }
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        showNotification('Error loading product details: ' + error.message, 'error');
    }
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteAirtableRecord('Products', productId);
            fetchProducts();
            showNotification('Product deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification('Error deleting product: ' + error.message, 'error');
        }
    }
}

function showSection(sectionName) {
    // Hide all sections
    const sections = ['products-section', 'orders-section', 'accounts-section'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });

    // Show selected section
    const selectedSection = document.getElementById(`${sectionName}-section`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    // Load section data
    switch(sectionName) {
        case 'accounts':
            fetchAccounts();
            break;
        case 'orders':
            fetchOrders();
            break;
        case 'products':
            fetchProducts();
            break;
    }
}

function addOrderFilters() {
    const filtersHTML = `
        <div class="filters-section">
            <div class="filter-group">
                <input type="text" id="customerIdFilter" placeholder="Search Customer ID" class="filter-input">
                <button onclick="clearFilters()" class="btn-secondary">Clear</button>
            </div>
        </div>
    `;

    const ordersSection = document.getElementById('orders-section');
    const existingFilters = ordersSection.querySelector('.filters-section');
    
    if (!existingFilters) {
        ordersSection.insertAdjacentHTML('afterbegin', filtersHTML);
    }

    // Add event listener to filter
    document.getElementById('customerIdFilter').addEventListener('input', applyFilters);
}

async function applyFilters() {
    try {
        const customerIdFilter = document.getElementById('customerIdFilter').value.toLowerCase();

        const response = await fetchAirtable('Orders');
        let filteredOrders = response.records;

        // Apply filter
        filteredOrders = filteredOrders.filter(order => {
            const matchCustomerId = order.fields['Customer ID']?.toLowerCase().includes(customerIdFilter);
            return matchCustomerId;
        });

        // Display filtered orders
        displayOrders(filteredOrders);
    } catch (error) {
        console.error('Error applying filters:', error);
        showToast('Error filtering orders', 'error');
    }
}

function clearFilters() {
    document.getElementById('customerIdFilter').value = '';
    fetchOrders();
}

// Helper function to display orders
function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    if (orders.length === 0) {
        ordersList.innerHTML = '<p class="empty-message">No orders found matching the filter</p>';
        return;
    }

    const ordersHTML = orders.map(order => `
        <div class="order-card">
            <div class="info-section">
                <div class="order-detail">
                    <strong>Order ID:</strong> ${order.fields['Order ID'] || 'N/A'}
                </div>
                <div class="order-detail">
                    <strong>Customer ID:</strong> ${order.fields['Customer ID'] || 'N/A'}
                </div>
                <div class="order-detail">
                    <strong>Products Ordered:</strong> ${order.fields['Products Ordered'] || 'N/A'}
                </div>
                <div class="order-detail">
                    <strong>Total Price:</strong> $${order.fields['Total Price'] || '0.00'}
                </div>
            </div>
        </div>
    `).join('');

    ordersList.innerHTML = ordersHTML;
}

async function fetchAccounts() {
    try {
        const response = await fetchAirtable('Users');
        console.log('Accounts response:', response);
        const accountsList = document.getElementById('accounts-list');
        
        if (!response.records || response.records.length === 0) {
            accountsList.innerHTML = '<p class="empty-message">No accounts found</p>';
            return;
        }

        const accountsHTML = response.records.map(account => `
            <div class="account-card">
                <div class="account-header">
                    <div class="account-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <h3>${account.fields.Username}</h3>
                </div>
                <div class="account-details">
                    <div class="role-badge ${account.fields.Role}">
                        ${account.fields.Role.charAt(0).toUpperCase() + account.fields.Role.slice(1)}
                    </div>
                    ${account.fields.Role === 'customer' ? 
                        `<div class="customer-id">ID: ${account.fields.CustomerID || 'N/A'}</div>` : 
                        ''}
                </div>
                <div class="account-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editAccount('${account.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAccount('${account.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

        accountsList.innerHTML = accountsHTML;
    } catch (error) {
        console.error('Error fetching accounts:', error);
        accountsList.innerHTML = '<p class="error-message">Error loading accounts: ' + error.message + '</p>';
    }
}

async function addAccount() {
    try {
        const modalContent = `
            <form id="addAccountForm" class="admin-form">
                <div class="form-group">
                    <input type="text" 
                           id="username" 
                           name="username"
                           placeholder="Username *"
                           required>
                </div>
                <div class="form-group">
                    <input type="password" 
                           id="password" 
                           name="password"
                           placeholder="Password *"
                           required>
                </div>
                <div class="form-group">
                    <select id="role" name="role" required>
                        <option value="">Select Role *</option>
                        <option value="admin">Admin</option>
                        <option value="customer">Customer</option>
                    </select>
                </div>
                <div class="form-group" id="customerIdGroup" style="display: none;">
                    <input type="text" 
                           id="customerId" 
                           name="customerId"
                           placeholder="Customer ID">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Account</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        `;

        showModal('Add New Account', modalContent);

        // Show/hide Customer ID field based on role selection
        document.getElementById('role').addEventListener('change', function() {
            const customerIdGroup = document.getElementById('customerIdGroup');
            customerIdGroup.style.display = this.value === 'customer' ? 'block' : 'none';
            const customerIdInput = document.getElementById('customerId');
            customerIdInput.required = this.value === 'customer';
        });

        // Form submission handler
        document.getElementById('addAccountForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const role = document.getElementById('role').value;
            const accountData = {
                fields: {
                    "Username": document.getElementById('username').value.trim(),
                    "Password": document.getElementById('password').value,
                    "Role": role,
                    "CustomerID": role === 'customer' ? document.getElementById('customerId').value.trim() : ''
                }
            };

            console.log('Submitting account data:', accountData);

            try {
                const result = await createAirtableRecord('Users', accountData);
                console.log('Airtable response:', result);
                
                if (result && result.id) {
                    closeModal();
                    await fetchAccounts();
                    showNotification('Account added successfully!', 'success');
                } else {
                    throw new Error('Invalid response from Airtable');
                }
            } catch (error) {
                console.error('Error adding account:', error);
                showNotification('Error adding account: ' + error.message, 'error');
            }
        });
    } catch (error) {
        console.error('Error setting up add account form:', error);
        showNotification('Error adding account: ' + error.message, 'error');
    }
}

async function editAccount(accountId) {
    try {
        const account = await fetchAirtableRecord('Users', accountId);
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Edit Account</h2>
                <form id="edit-account-form">
                    <div class="form-group">
                        <input type="text" id="edit-username" placeholder="Username" 
                            value="${account.fields.Username || ''}" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="edit-password" 
                            placeholder="Leave blank to keep current password">
                    </div>
                    <div class="form-group">
                        <select id="edit-role" required>
                            <option value="admin" ${account.fields.Role === 'admin' ? 'selected' : ''}>admin</option>
                            <option value="customer" ${account.fields.Role === 'customer' ? 'selected' : ''}>customer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <input type="text" id="edit-customerID" placeholder="Customer ID" 
                            value="${account.fields.CustomerID || ''}" required>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn-secondary">Save Changes</button>
                        <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('edit-account-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateAccount(accountId);
        });
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showToast('Error loading account details', 'error');
    }
}

async function updateAccount(accountId) {
    try {
        const data = {
            Username: document.getElementById('edit-username').value,
            Role: document.getElementById('edit-role').value,
            CustomerID: document.getElementById('edit-customerID').value
        };

        // Only include password if it was changed
        const password = document.getElementById('edit-password').value;
        if (password) {
            data.Password = password;
        }

        await updateAirtableRecord('Users', accountId, data);
        closeModal();
        fetchAccounts(); // Refresh the list
        showToast('Account updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating account:', error);
        showToast('Error updating account', 'error');
    }
}

async function deleteAccount(accountId) {
    if (confirm('Are you sure you want to delete this account?')) {
        try {
            await deleteAirtableRecord('Users', accountId);
            fetchAccounts(); // Refresh the list
            showToast('Account deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting account:', error);
            showToast('Error deleting account', 'error');
        }
    }
}

// Helper function to close modal
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Helper function to show toast messages
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Add styles for toast if not already present
    const toastStyles = `
        .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }
        
        .toast-success { background: #4CAF50; }
        .toast-error { background: #f44336; }
        .toast-info { background: #2196F3; }
        
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
    `;
    
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = toastStyles;
        document.head.appendChild(style);
    }

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.fields.Role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    // Show products section by default
    showSection('products');
});

// Add this function to handle placeholder removal
function setupPlaceholderHandling(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[placeholder]');
    
    inputs.forEach(input => {
        // Initial check
        if (input.value) {
            input.removeAttribute('placeholder');
        }
        
        // Handle input changes
        input.addEventListener('input', function() {
            if (this.value) {
                this.removeAttribute('placeholder');
            } else {
                this.setAttribute('placeholder', this.dataset.placeholder || '');
            }
        });
    });
}

// Update the CSS styles
const newStyles = `
    .order-filters {
        margin-bottom: 20px;
        padding: 15px;
        background: var(--surface-card);
        border-radius: 6px;
        box-shadow: var(--card-shadow);
    }

    .filter-group {
        display: flex;
        gap: 10px;
        align-items: center;
        background: #FFFFFF;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid var(--surface-border);
    }

    .filter-input {
        padding: 12px;
        border: 1px solid var(--surface-border);
        border-radius: 6px;
        flex: 1;
        max-width: 300px;
        font-size: 1rem;
        color: var(--text-color);
        background: var(--surface-ground);
        transition: border-color 0.2s, box-shadow 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .filter-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 1px var(--primary-color);
    }

    .filter-input::placeholder {
        color: var(--text-color-secondary);
        opacity: 0.8;
    }

    .btn-secondary {
        background: #2196F3;
        border: none;
        color: #FFFFFF;
        padding: 12px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: background-color 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .btn-secondary:hover {
        background: #1976D2;
    }

    .order-date {
        font-size: 0.9em;
        color: var(--text-color-secondary);
    }

    .customer-id {
        font-weight: 500;
        color: var(--text-color);
    }
`;

// Append new styles
document.head.appendChild(document.createElement('style')).textContent += newStyles;

// Add this CSS to your existing styles
const signOutStyles = `
    button.sign-out-btn {
        background: #f5f5f5 !important;
        color: #333 !important;
        border: 1px solid #ddd !important;
        padding: 8px 16px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        font-weight: 500 !important;
        font-size: 0.9rem !important;
        transition: all 0.2s !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }

    button.sign-out-btn:hover {
        background: #e9e9e9 !important;
        color: #d32f2f !important;  /* Subtle red on hover */
    }

    button.sign-out-btn i {
        font-size: 0.9rem !important;
    }
`;

// Append the new styles
document.head.appendChild(document.createElement('style')).textContent += signOutStyles;

const updatedStyles = `
    /* Base styles */
    .menu-toggle {
        display: none;
    }

    .nav-menu {
        display: flex;
        gap: 10px;
    }

    /* Mobile styles */
    @media screen and (max-width: 768px) {
        /* Hamburger button */
        .menu-toggle {
            display: block;
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1001;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #333;
        }

        /* Sidebar */
        .nav-menu {
            position: fixed;
            top: 0;
            left: -100%;
            width: 250px;
            height: 100%;
            background-color: #fff;
            padding-top: 80px;
            z-index: 1000;
            transition: 0.3s;
            display: flex;
            flex-direction: column;
            gap: 5px;
            box-shadow: 2px 0 5px rgba(0,0,0,0.1);
        }

        /* Show sidebar when active */
        .nav-menu.active {
            left: 0;
        }

        /* Menu buttons */
        .nav-menu .btn-text {
            width: 100%;
            padding: 15px 20px;
            text-align: left;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .nav-menu .btn-text:hover {
            background-color: #f5f5f5;
        }

        /* Adjust main content */
        .dashboard-container {
            padding-left: 60px;
        }

        /* Logo adjustment */
        .logo {
            margin-left: 50px;
        }
    }
`;

// Add toggle function
function toggleMenu() {
    console.log('Toggle menu clicked'); // Debug log
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('active');
        console.log('Menu toggled, active:', navMenu.classList.contains('active')); // Debug log
    } else {
        console.log('Nav menu not found'); // Debug log
    }
}

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = updatedStyles;
document.head.appendChild(styleSheet);

// Add event listener for outside clicks
document.addEventListener('click', function(event) {
    const navMenu = document.querySelector('.nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (navMenu && menuToggle && 
        !navMenu.contains(event.target) && 
        !menuToggle.contains(event.target)) {
        navMenu.classList.remove('active');
    }
});

// Make sure the toggle button exists
document.addEventListener('DOMContentLoaded', function() {
    // Check if toggle button already exists
    if (!document.querySelector('.menu-toggle')) {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'menu-toggle';
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        toggleButton.onclick = toggleMenu;
        document.body.insertBefore(toggleButton, document.body.firstChild);
    }
});

// First, remove any existing styles that might conflict
const existingListStyles = document.querySelector('#list-styles');
if (existingListStyles) {
    existingListStyles.remove();
}

// Create new styles with a unique ID
const verticalListStyles = `
    /* Force vertical layout */
    #products-grid,
    #orders-list,
    #accounts-grid {
        display: flex !important;
        flex-direction: column !important;
        gap: 15px !important;
        grid-template-columns: unset !important;
        width: 100% !important;
    }

    /* Reset any grid items */
    #products-grid > div,
    #orders-list > div,
    #accounts-grid > div {
        width: 100% !important;
        margin: 0 !important;
        grid-column: unset !important;
    }

    /* Card styles */
    .product-card,
    .order-card,
    .account-card {
        background: white !important;
        border-radius: 8px !important;
        padding: 20px !important;
        margin-bottom: 15px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        width: 100% !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
    }

    /* Container padding */
    .dashboard-container {
        padding: 20px !important;
    }

    /* Info section */
    .info-section {
        flex-grow: 1 !important;
    }

    /* Actions section */
    .actions-section {
        display: flex !important;
        gap: 10px !important;
    }

    @media screen and (max-width: 768px) {
        .actions-section {
            flex-direction: column !important;
        }
    }
`;

// Create and append new style element with ID
const newStyleSheet = document.createElement('style');
newStyleSheet.id = 'list-styles';
newStyleSheet.textContent = verticalListStyles;
document.head.appendChild(newStyleSheet);

const accountStyles = `
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section-header h2 {
        margin: 0;
        color: #333;
    }

    .account-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        padding: 30px;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
    }

    .form-group {
        margin-bottom: 15px;
    }

    .form-group input,
    .form-group select {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
    }

    .form-group select {
        background: white;
    }

    .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
    }

    .btn-secondary {
        background: #2196F3;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
    }

    .btn-secondary:hover {
        background: #1976D2;
    }

    .btn-delete {
        background: #dc3545;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
    }

    .btn-delete:hover {
        background: #c82333;
    }

    .btn-cancel {
        background: #6c757d;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
    }

    .btn-cancel:hover {
        background: #5a6268;
    }

    .actions-section {
        display: flex;
        gap: 10px;
    }
`;

// Add the styles (updated implementation)
(function addAccountStyles() {
    // Remove existing styles if they exist
    const existingStyles = document.querySelector('#account-styles');
    if (existingStyles) {
        existingStyles.remove();
    }
    
    // Add new styles
    const newStyleSheet = document.createElement('style');
    newStyleSheet.id = 'account-styles';
    newStyleSheet.textContent = accountStyles;
    document.head.appendChild(newStyleSheet);
})();

const orderStyles = `
    .order-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .order-detail {
        margin: 10px 0;
        font-size: 14px;
        display: flex;
        align-items: flex-start;
    }

    .order-detail strong {
        display: inline-block;
        width: 140px;
        color: #374151;
        flex-shrink: 0;
    }

    .empty-message {
        text-align: center;
        padding: 20px;
        color: #6b7280;
        background: white;
        border-radius: 8px;
        margin-top: 20px;
    }

    .error-message {
        text-align: center;
        padding: 20px;
        color: #ef4444;
        background: #fee2e2;
        border-radius: 8px;
        margin-top: 20px;
    }

    .retry-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
    }

    .retry-btn:hover {
        background: #2563eb;
    }
`;

// Add the order styles
(function addOrderStyles() {
    const existingStyles = document.querySelector('#order-styles');
    if (existingStyles) {
        existingStyles.remove();
    }
    const newStyleSheet = document.createElement('style');
    newStyleSheet.id = 'order-styles';
    newStyleSheet.textContent = orderStyles;
    document.head.appendChild(newStyleSheet);
})();

async function fetchOrders() {
    try {
        const response = await fetchAirtable('Orders');
        
        // Add filters if they don't exist
        addOrderFilters();
        
        // Display orders
        displayOrders(response.records);
    } catch (error) {
        console.error('Error fetching orders:', error);
        const ordersList = document.getElementById('orders-list');
        ordersList.innerHTML = `
            <p class="error-message">Error loading orders: ${error.message}</p>
        `;
    }
}
  
