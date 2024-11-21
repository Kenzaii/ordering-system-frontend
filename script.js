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


document.getElementById('toggle-button').addEventListener('click', function() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
});

document.getElementById('close-button').addEventListener('click', function() {
    document.getElementById('overlay').style.display = 'none';
});

