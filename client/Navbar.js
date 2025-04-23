function setupNavbar() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';    
    const brand = document.createElement('a');
    brand.href = 'cinema.html';
    brand.className = 'navbar-brand';
    brand.textContent = 'Cinema SOAP';
    navbar.appendChild(brand);
    const authActions = document.createElement('div');
    authActions.className = 'navbar-auth';

    const reservationsBtn = document.createElement('button');
    reservationsBtn.id = 'navReservationsBtn';
    reservationsBtn.className = 'navbar-button';
    reservationsBtn.textContent = 'My Reservations';
    reservationsBtn.addEventListener('click', function() {
        window.location.href = 'reservations.html';
    });
    authActions.appendChild(reservationsBtn);

    const authBtn = document.createElement('button');
    authBtn.id = 'navAuthBtn';
    authBtn.className = 'navbar-button';
    const authToken = sessionStorage.getItem('authToken');
    
    if (authToken) {
        authBtn.textContent = 'Logout';

        authBtn.addEventListener('click', function() {
            sessionStorage.removeItem('authToken');
            window.location.reload();
        });
    }
    else {
        authBtn.textContent = 'Login';

        authBtn.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }
    
    authActions.appendChild(authBtn);
    navbar.appendChild(authActions);
    document.body.insertBefore(navbar, document.body.firstChild);
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'content-wrapper';
    
    while (document.body.childNodes.length > 1) {
        contentWrapper.appendChild(document.body.childNodes[1]);
    }
    
    document.body.appendChild(contentWrapper);    
    return navbar;
}

document.addEventListener('DOMContentLoaded', setupNavbar);