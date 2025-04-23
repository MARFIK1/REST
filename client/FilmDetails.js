async function callSoap(body) {
    const authToken = sessionStorage.getItem('authToken');    
    let modifiedBody = body;
    
    if (authToken) {
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
        modifiedBody = serializer.serializeToString(xmlDoc);
    }
    
    const resp = await fetch('http://localhost:9999/cinema', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': '""'
        },
        body: modifiedBody
    }).catch(error => {
        console.error('SOAP request failed:', error);
        throw error;
    });
    const text = await resp.text();
    return new DOMParser().parseFromString(text, 'application/xml');
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const filmIndex = params.get('filmIndex');
    const authToken = sessionStorage.getItem('authToken');

    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = 'cinema.html';
    });

    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:getFilmList/>
        </soapenv:Body>
    </soapenv:Envelope>`;

    try {
        const xml = await callSoap(envelope);
        const films = Array.from(xml.getElementsByTagName('return'));
        const film = films[filmIndex];

        if (film) {
            displayFilmDetails(film, filmIndex, authToken);
        }
        else {
            throw new Error("Film not found");
        }
    } catch (error) {
        console.error("Error loading film details:", error);
        document.getElementById('film-details').innerHTML = 
            `<div style="color: red; text-align: center; padding: 20px;">
                Błąd podczas wczytywania szczegółów filmu: ${error.message}
                <br>Sprawdź czy serwer jest uruchomiony lub spróbuj ponownie później.
            </div>`;
    }
});

function displayFilmDetails(film, filmIndex, authToken) {
    const title = film.getElementsByTagName('title')[0].textContent;
    const director = film.getElementsByTagName('director')[0].textContent;
    const description = film.getElementsByTagName('description')[0].textContent;
    const actors = Array.from(film.getElementsByTagName('actor')).map(el => el.textContent);
    const imageName = film.getElementsByTagName('imageName')[0].textContent;
    const showtimes = Array.from(film.getElementsByTagName('showtime')).map(el => el.textContent);
    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('details-container');
    const posterColumn = document.createElement('div');
    posterColumn.classList.add('poster-column');

    posterColumn.innerHTML = `
        <img class="film-poster-large" src="http://localhost:9999/cinema/images/${imageName}" alt="${title}">
    `;

    const infoColumn = document.createElement('div');
    infoColumn.classList.add('info-column');

    infoColumn.innerHTML = `
        <h1 class="film-title-large">${title}</h1>
        <p class="film-director-large"><strong>Director:</strong> ${director}</p>
        <p class="film-description-large">${description}</p>
        <p class="actors-heading"><strong>Actors:</strong></p>
        <ul class="actors-list">
            ${actors.map(actor => `<li>${actor}</li>`).join('')}
        </ul>
    `;

    const bookingColumn = document.createElement('div');
    bookingColumn.classList.add('booking-column');
    
    if (authToken) {
        const showtimesSection = document.createElement('div');
        showtimesSection.classList.add('showtime-area');

        showtimesSection.innerHTML = `
            <h2>Available Showtimes:</h2>
            <div class="showtime-buttons">
                ${showtimes.map(time => `
                    <button class="showtime-btn" data-time="${time}">${time}</button>
                `).join('')}
            </div>
        `;

        const seatsSection = document.createElement('div');
        seatsSection.classList.add('seats-area');
        seatsSection.innerHTML = `<h2>Select Your Seats:</h2>`;

        const seats = [
            "A1", "A2", "A3", "A4", "A5",
            "B1", "B2", "B3", "B4", "B5",
            "C1", "C2", "C3", "C4", "C5",
            "D1", "D2", "D3", "D4", "D5",
            "E1", "E2", "E3", "E4", "E5"
        ];

        const table = document.createElement('table');
        table.classList.add('seat-table');

        for (let i = 0; i < seats.length; i += 5) {
            const row = document.createElement('tr');

            for (let j = i; j < i + 5; j++) {
                const cell = document.createElement('td');
                const seatButton = document.createElement('button');
                seatButton.textContent = seats[j];
                seatButton.classList.add('seat');
                seatButton.addEventListener('click', () => {
                    seatButton.classList.toggle('selected');
                });
                cell.append(seatButton);
                row.append(cell);
            }

            table.append(row);
        }
        seatsSection.append(table);
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('reservation-buttons');
        const reserveButton = document.createElement('button');
        reserveButton.textContent = 'Book now';
        reserveButton.classList.add('reserve-button');

        reserveButton.addEventListener('click', () => {
            const selectedTime = document.querySelector('.showtime-btn.selected')?.dataset.time;

            if (!selectedTime) {
                alert('Please select a showtime first.');
                return;
            }

            const selectedSeats = Array.from(document.querySelectorAll('.seat.selected')).map(btn => btn.textContent);

            if (selectedSeats.length === 0) {
                alert('Please select at least one seat.');
                return;
            }

            makeReservation(filmIndex, selectedSeats, selectedTime);
        });

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel reservation';
        cancelButton.classList.add('cancel-button');

        cancelButton.addEventListener('click', () => {
            const selectedTime = document.querySelector('.showtime-btn.selected')?.dataset.time;

            if (!selectedTime) {
                alert('Please select a showtime first.');
                return;
            }

            const selectedSeats = Array.from(document.querySelectorAll('.seat.selected')).map(btn => btn.textContent);

            if (selectedSeats.length === 0) {
                alert('Please select at least one seat to cancel.');
                return;
            }

            cancelReservation(filmIndex, selectedSeats, selectedTime);
        });

        buttonsContainer.append(cancelButton, reserveButton);
        seatsSection.append(buttonsContainer);
        bookingColumn.appendChild(showtimesSection);
        bookingColumn.appendChild(seatsSection);
    }
    else {
        bookingColumn.innerHTML = `
            <div class="login-prompt" style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                <h3 style="margin-bottom: 15px;">Want to book tickets?</h3>
                <p style="margin-bottom: 20px;">Please log in to book seats for this screening.</p>
                <button id="login-button" class="navbar-button" style="padding: 10px 20px; font-size: 16px;">Login</button>
            </div>
        `;
    }

    detailsContainer.appendChild(posterColumn);
    detailsContainer.appendChild(infoColumn);
    detailsContainer.appendChild(bookingColumn);
    const filmDetailsElement = document.getElementById('film-details');
    filmDetailsElement.innerHTML = '';
    filmDetailsElement.appendChild(detailsContainer);
    
    if (authToken) {
        document.querySelectorAll('.showtime-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.showtime-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });
    }
    else {
        document.getElementById('login-button')?.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
}