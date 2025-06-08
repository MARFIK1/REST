let authToken = sessionStorage.getItem('authToken');
let isRegistrationMode = false;

document.addEventListener('DOMContentLoaded', function() {
    if (authToken) {
        window.location.href = 'cinema.html';
        return;
    }

    document.getElementById('backBtn').addEventListener('click', function() {
        window.location.href = 'cinema.html';
    });

    const form = document.querySelector('.auth-container');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
    });

    updateFormMode(isRegistrationMode);

    document.getElementById('switchModeBtn').addEventListener('click', function() {
        isRegistrationMode = !isRegistrationMode;
        updateFormMode(isRegistrationMode);
    });
    
    document.getElementById('submitBtn').addEventListener('click', function() {
        if (isRegistrationMode) {
            register();
        }
        else {
            login();
        }
    });

    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isRegistrationMode) {
                register();
            }
            else {
                login();
            }
        }
    });
});

function updateFormMode(isRegistrationMode) {
    const formTitle = document.getElementById('form-title');
    const switchModeBtn = document.getElementById('switchModeBtn');
    
    if (isRegistrationMode) {
        formTitle.textContent = 'Cinema Register';
        switchModeBtn.textContent = 'Login';
    }
    else {
        formTitle.textContent = 'Cinema Login';
        switchModeBtn.textContent = 'Register';
    }
    
    const messageElement = document.getElementById('message');
    messageElement.style.display = 'none';
}

function displayMessage(message, isError = false) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.style.display = 'block';
    messageElement.style.color = isError ? 'red' : 'green';
    messageElement.style.backgroundColor = isError ? '#ffeeee' : '#eeffee';
    messageElement.style.padding = '10px';
    messageElement.style.marginTop = '15px';
    messageElement.style.borderRadius = '5px';
}

// async function callSoap(body) {
//     try {
//         const resp = await fetch('https://localhost:9999/cinema', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'text/xml; charset=utf-8',
//                 'SOAPAction': '""'
//             },
//             body
//         });
//         const text = await resp.text();
//         return new DOMParser().parseFromString(text, 'application/xml');
//     } catch (error) {
//         console.error('SOAP request failed:', error);
//         displayMessage('Server connection error. Please try again later.', true);
//         throw error;
//     }
// }

async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        displayMessage('Please enter both username and password', true);
        return;
    }
    
    // const envelope = `<?xml version="1.0"?>
    // <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    //                   xmlns:ser="http://service.cinema.rsi/">
    //     <soapenv:Body>
    //         <ser:loginUser>
    //             <username>${username}</username>
    //             <password>${password}</password>
    //         </ser:loginUser>
    //     </soapenv:Body>
    // </soapenv:Envelope>`;
    
    try {
        // const xml = await callSoap(envelope);
        // const response = xml.getElementsByTagName('return')[0]?.textContent;
        
        // if (response && response !== 'null' && !response.includes('Invalid')) {
        //     sessionStorage.setItem('authToken', response);
        //     displayMessage('Login successful! Redirecting...');
        //     setTimeout(() => window.location.href = 'cinema.html', 1500);
        // }
        // else {
        //     displayMessage('Invalid username or password', true);
        // }
        const resp = await fetch('http://localhost:8080/cinema/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!resp.ok) throw new Error(await resp.text());
        sessionStorage.setItem('authToken', await resp.text());
        displayMessage('Login successful! Redirecting...');
        setTimeout(() => window.location.href = 'cinema.html', 1500);
    } catch (error) {
        console.error('Login error:', error);
        displayMessage('Error during login. Please try again.', true);
    }
}

async function register() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        displayMessage('Please enter both username and password', true);
        return;
    }
    
    if (password.length < 4) {
        displayMessage('Password must be at least 4 characters long', true);
        return;
    }
    
    // const envelope = `<?xml version="1.0"?>
    // <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    //                   xmlns:ser="http://service.cinema.rsi/">
    //     <soapenv:Body>
    //         <ser:registerUser>
    //             <username>${username}</username>
    //             <password>${password}</password>
    //         </ser:registerUser>
    //     </soapenv:Body>
    // </soapenv:Envelope>`;
    
    try {
        // const xml = await callSoap(envelope);
        // const response = xml.getElementsByTagName('return')[0]?.textContent;
        
        // if (response && response.includes("registered successfully")) {
        //     displayMessage('Registration successful! You can now login.');

        //     setTimeout(() => {
        //         isRegistrationMode = false;
        //         updateFormMode(isRegistrationMode);
        //     }, 1500);
        // }
        // else {
        //     displayMessage('Registration failed: ' + response, true);
        // }
        const resp = await fetch('http://localhost:8080/cinema/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!resp.ok) { 
            displayMessage('Registration failed: ' + await resp.text(), true);
            throw new Error(await resp.text());
        }
        displayMessage('Registration successful! You can now login.');
            setTimeout(() => {
                isRegistrationMode = false;
                updateFormMode(isRegistrationMode);
            }, 1500);
    } catch (error) {
        console.error('Registration error:', error);
        displayMessage('Error during registration. Please try again.', true);
    }
}