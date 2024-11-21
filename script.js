async function fetchAirtable(table) {
    try {
        console.log('Fetching from Airtable...', table);
        const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${table}`;
        console.log('URL:', url);
        console.log('API Key:', AIRTABLE_CONFIG.API_KEY.substring(0, 5) + '...');

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            console.error('Airtable Error Response:', errorData);
            console.error('Response Status:', response.status);
            console.error('Response Headers:', Object.fromEntries(response.headers));
            throw new Error(errorData.error?.message || 'Network response was not ok');
        }
        
        const data = await response.json();
        console.log('Airtable Response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching from Airtable:', error);
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        throw error;
    }
}

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const button = document.querySelector('.login-btn');

    if (!username || !password) {
        showError("Please fill in all fields");
        return;
    }

    try {
        if (button) {
            button.textContent = 'Signing in...';
            button.disabled = true;
        }

        console.log('Attempting to fetch users...');
        const response = await fetchAirtable(AIRTABLE_CONFIG.TABLE_NAME);
        console.log('Users data:', response);

        const users = response.records;
        const user = users.find(u => 
            u.fields.Username === username && 
            u.fields.Password === password
        );

        if (user) {
            console.log('User found:', user.fields.Role);
            sessionStorage.setItem('user', JSON.stringify(user));
            
            if (user.fields.Role === "admin") {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'customer.html';
            }
        } else {
            showError("Invalid username or password");
            resetButton(button);
        }
    } catch (error) {
        console.error("Login error:", error);
        showError("An error occurred. Please try again.");
        resetButton(button);
    }
}

function resetButton(button) {
    if (button) {
        button.textContent = 'Sign In';
        button.disabled = false;
    }
}

function showError(message) {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;

    loginForm.insertBefore(errorDiv, loginForm.firstChild);

    setTimeout(() => {
        const errorToRemove = document.querySelector('.error-message');
        if (errorToRemove) {
            errorToRemove.remove();
        }
    }, 5000);
}

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

