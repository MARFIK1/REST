async function callSoap(body) {
    const resp = await fetch('http://localhost:9999/cinema', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': '""'
        },
        body
    });
    const text = await resp.text();
    return new DOMParser().parseFromString(text, 'application/xml');
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const filmIndex = params.get('filmIndex');

    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:getFilmList/>
        </soapenv:Body>
    </soapenv:Envelope>`;

    const xml = await callSoap(envelope);
    const films = Array.from(xml.getElementsByTagName('return'));
    const film = films[filmIndex];

    if (film) {
        displayFilmDetails(film, filmIndex);
    }
});

function displayFilmDetails(film, filmIndex) {
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
    reserveButton.textContent = 'Zarezerwuj';
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
    cancelButton.textContent = 'Anuluj rezerwację';
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
    detailsContainer.appendChild(posterColumn);
    detailsContainer.appendChild(infoColumn);
    detailsContainer.appendChild(bookingColumn);
    const filmDetailsElement = document.getElementById('film-details');
    filmDetailsElement.innerHTML = '';
    filmDetailsElement.appendChild(detailsContainer);
    
    document.querySelectorAll('.showtime-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.showtime-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
        });
    });
}

async function makeReservation(filmIndex, seats, showtime) {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:makeReservation>
                <filmIndex>${filmIndex}</filmIndex>
                <showtime>${showtime}</showtime>
                ${seats.map(seat => `<seats>${seat}</seats>`).join('')}
            </ser:makeReservation>
        </soapenv:Body>
    </soapenv:Envelope>`;
    const xml = await callSoap(envelope);
    const response = xml.getElementsByTagName('return')[0]?.textContent;
    alert(response || 'Reservation failed.');
}

async function cancelReservation(filmIndex, seats, showtime) {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:cancelReservation>
                <filmIndex>${filmIndex}</filmIndex>
                <showtime>${showtime}</showtime>
                ${seats.map(seat => `<seats>${seat}</seats>`).join('')}
            </ser:cancelReservation>
        </soapenv:Body>
    </soapenv:Envelope>`;
    const xml = await callSoap(envelope);
    const response = xml.getElementsByTagName('return')[0]?.textContent;
    alert(response || 'Cancellation failed.');
}