async function callSoap(body) {
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
        alert('You must be logged in to view your reservations.');
        window.location.href = 'login.html';
        return;
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(body, 'text/xml');
    const envelope = xmlDoc.documentElement;
    let header = xmlDoc.getElementsByTagNameNS(envelope.namespaceURI, 'Header')[0];

    if (!header) {
        header = xmlDoc.createElementNS(envelope.namespaceURI, 'soapenv:Header');
        envelope.insertBefore(header, envelope.firstChild);
    }

    const auth = xmlDoc.createElementNS('http://service.cinema.rsi/auth', 'auth:Authorization');
    auth.textContent = authToken;
    header.appendChild(auth);

    const serializer = new XMLSerializer();
    const modifiedBody = serializer.serializeToString(xmlDoc);

    const resp = await fetch('http://localhost:9999/cinema', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': '""'
        },
        body: modifiedBody
    });

    if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
    }

    const text = await resp.text();
    return new DOMParser().parseFromString(text, 'application/xml');
}

let allReservations = [];

async function loadReservations() {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:getUserReservations>
                <authToken>${sessionStorage.getItem('authToken')}</authToken>
            </ser:getUserReservations>
        </soapenv:Body>
    </soapenv:Envelope>`;

    try {
        const xml = await callSoap(envelope);
        allReservations = Array.from(xml.getElementsByTagName('return')); // Zapisz wszystkie rezerwacje

        displayReservations(allReservations);
    } catch (error) {
        console.error('Error loading reservations:', error);
        document.getElementById('reservations-container').innerHTML = `
            <p style="color: red;">Failed to load reservations. Please try again later.</p>
        `;
    }
}

function displayReservations(reservations) {
    const container = document.getElementById('reservations-container');
    container.innerHTML = '';

    if (reservations.length === 0) {
        container.innerHTML = '<p>You have no reservations.</p>';
        return;
    }

    reservations.forEach(reservation => {
        const filmTitle = reservation.getElementsByTagName('filmTitle')[0].textContent;
        const showtime = reservation.getElementsByTagName('showtime')[0].textContent;
        const seats = Array.from(reservation.getElementsByTagName('seat')).map(seat => seat.textContent);

        const reservationDiv = document.createElement('div');
        reservationDiv.classList.add('reservation-item');
        reservationDiv.innerHTML = `
            <h2>${filmTitle}</h2>
            <p><strong>Showtime:</strong> ${showtime}</p>
            <p><strong>Seats:</strong> ${seats.join(', ')}</p>
            <button class="generate-pdf-btn">Generate PDF</button>
            <button class="cancel-reservation-btn">Cancel</button>
        `;

        reservationDiv.querySelector('.generate-pdf-btn').addEventListener('click', () => {
            generatePDF(filmTitle, showtime, seats);
        });

        reservationDiv.querySelector('.cancel-reservation-btn').addEventListener('click', () => {
            cancelReservation(filmTitle, showtime, seats);
        });

        container.appendChild(reservationDiv);
    });
}

function filterReservations() {
    const filterText = document.getElementById('filter-input').value.toLowerCase();

    const filteredReservations = allReservations.filter(reservation => {
        const filmTitle = reservation.getElementsByTagName('filmTitle')[0].textContent.toLowerCase();
        const showtime = reservation.getElementsByTagName('showtime')[0].textContent.toLowerCase();

        return filmTitle.includes(filterText) || showtime.includes(filterText);
    });

    displayReservations(filteredReservations);
}

async function cancelReservation(filmTitle, showtime, seats) {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:cancelReservation>
                <filmTitle>${filmTitle}</filmTitle>
                <showtime>${showtime}</showtime>
                ${seats.map(seat => `<seats>${seat}</seats>`).join('')}
            </ser:cancelReservation>
        </soapenv:Body>
    </soapenv:Envelope>`;

    try {
        const xml = await callSoap(envelope);
        const response = xml.getElementsByTagName('return')[0]?.textContent;

        if (response && response.includes('cancelled')) {
            alert('Reservation cancelled successfully!');
            await loadReservations();
        } else {
            alert(`Cancellation failed: ${response}`);
        }
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('An error occurred while cancelling the reservation. Please try again later.');
    }
}

async function generatePDF(filmTitle, showtime, seats) {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:generatePDF>
                <filmTitle>${filmTitle}</filmTitle>
                <showtime>${showtime}</showtime>
                ${seats.map(seat => `<seats>${seat}</seats>`).join('')}
            </ser:generatePDF>
        </soapenv:Body>
    </soapenv:Envelope>`;

    try {
        const xml = await callSoap(envelope);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('An error occurred while generating the PDF.');
    }
}
 
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('filter-button').addEventListener('click', filterReservations);

    loadReservations();
});
