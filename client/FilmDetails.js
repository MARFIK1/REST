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
            `<div class="error-message">
                Error loading film details: ${error.message}
                <br>Please check if the server is running or try again later.
            </div>`;
    }
});

async function displayFilmDetails(film, filmIndex, authToken) {
    const title = film.getElementsByTagName('title')[0].textContent;
    const director = film.getElementsByTagName('director')[0].textContent;
    const description = film.getElementsByTagName('description')[0].textContent;
    const actors = Array.from(film.getElementsByTagName('actor')).map(el => el.textContent);
    const imageName = film.getElementsByTagName('imageName')[0].textContent;
    const scheduleEntries = Array.from(film.getElementsByTagName('entry'));
    const schedule = {};
    
    scheduleEntries.forEach(entry => {
        const day = entry.getElementsByTagName('key')[0].textContent;
        const valueElements = entry.getElementsByTagName('value');
        let showtimes = [];

        if (valueElements && valueElements.length > 0) {
            for (let i = 0; i < valueElements.length; i++) {
                const valueText = valueElements[i].textContent.trim();
                if (valueText) {
                    showtimes.push(valueText);
                }
            }
        }

        schedule[day] = showtimes;
    });

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('details-container');

    const posterColumn = createPosterColumn(imageName, title);

    const infoColumn = createInfoColumn(title, director, description, actors);

    const bookingColumn = document.createElement('div');
    bookingColumn.classList.add('booking-column');

    if (authToken) {
        const daysSection = createDaysSection(schedule, filmIndex);
        const showtimesSection = createShowtimesSection();
        const seatsSection = createSeatsSection();

        bookingColumn.appendChild(daysSection);
        bookingColumn.appendChild(showtimesSection);
        bookingColumn.appendChild(seatsSection);
    } else {
        bookingColumn.innerHTML = `
            <div class="login-prompt">
                <h3>Want to book tickets?</h3>
                <p>Please log in to book seats for this screening.</p>
                <button id="login-button" class="navbar-button login-button">Login</button>
            </div>
        `;
    }

    detailsContainer.appendChild(posterColumn);
    detailsContainer.appendChild(infoColumn);
    detailsContainer.appendChild(bookingColumn);

    const filmDetailsElement = document.getElementById('film-details');
    filmDetailsElement.innerHTML = '';
    filmDetailsElement.appendChild(detailsContainer);

    if (!authToken) {
        document.getElementById('login-button')?.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
}

function createPosterColumn(imageName, title) {
    const posterColumn = document.createElement('div');
    posterColumn.classList.add('poster-column');
    posterColumn.innerHTML = `
        <img class="film-poster-large" src="http://localhost:9999/cinema/images/${imageName}" alt="${title}">
    `;
    return posterColumn;
}

function createInfoColumn(title, director, description, actors) {
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
    return infoColumn;
}

function createDaysSection(schedule, filmIndex) {
    const daysSection = document.createElement('div');
    daysSection.classList.add('days-area');
    daysSection.innerHTML = `
        <h2>Select Day:</h2>
        <div class="day-buttons">
            ${Object.keys(schedule).map(day => `<button class="day-btn" data-day="${day}">${day}</button>`).join('')}
        </div>
    `;

    daysSection.querySelectorAll('.day-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            document.querySelectorAll('.day-btn').forEach(btn => btn.classList.remove('selected'));
            document.querySelector('.showtime-area').innerHTML = '<h2>Select Showtime:</h2>';
            document.querySelector('.seat-table').innerHTML = '';
            e.target.classList.add('selected');
            const selectedDay = e.target.dataset.day;
            updateShowtimeButtons(schedule[selectedDay], filmIndex, selectedDay);
        });
    });

    return daysSection;
}

function createShowtimesSection() {
    const showtimesSection = document.createElement('div');
    showtimesSection.classList.add('showtime-area');
    showtimesSection.innerHTML = `<h2>Select Showtime:</h2>`;
    return showtimesSection;
}

function updateShowtimeButtons(showtimes, filmIndex, selectedDay) {
    const showtimesArray = Array.isArray(showtimes) ? showtimes : [];
    const showtimesSection = document.querySelector('.showtime-area');
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('showtime-buttons');
    
    if (!showtimesArray || showtimesArray.length === 0) {
        const noShowtimesMsg = document.createElement('p');
        noShowtimesMsg.textContent = 'No showtimes available for this day.';
        noShowtimesMsg.classList.add('no-showtimes-message');
        buttonContainer.appendChild(noShowtimesMsg);
    } else {
        showtimesArray.forEach(time => {
            const button = document.createElement('button');
            button.classList.add('showtime-btn');
            button.dataset.time = time;
            button.textContent = time;

            button.addEventListener('click', async (e) => {
                document.querySelectorAll('.showtime-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                const selectedTime = e.target.dataset.time;
                const occupiedSeats = await getOccupiedSeats(filmIndex, selectedDay, selectedTime);
                updateSeatsTable(occupiedSeats);
            });

            buttonContainer.appendChild(button);
        });
    }
    
    const existingButtonContainer = showtimesSection.querySelector('.showtime-buttons');

    if (existingButtonContainer) {
        existingButtonContainer.remove();
    }
    
    showtimesSection.appendChild(buttonContainer);
}

function createSeatsSection() {
    const seatsSection = document.createElement('div');
    seatsSection.classList.add('seats-area');
    seatsSection.innerHTML = `<h2>Select Your Seats:</h2>`;

    const table = document.createElement('table');
    table.classList.add('seat-table');
    seatsSection.appendChild(table);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('reservation-buttons');

    const reserveButton = document.createElement('button');
    reserveButton.textContent = 'Book now';
    reserveButton.classList.add('reserve-button');
    reserveButton.addEventListener('click', handleReservation);

    buttonsContainer.append(reserveButton);
    seatsSection.appendChild(buttonsContainer);

    return seatsSection;
}

function generateTheaterLayout() {
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const seatsPerRow = 5;
    const seats = [];

    for (const row of rows) {
        for (let i = 1; i <= seatsPerRow; i++) {
            seats.push(`${row}${i}`);
        }
    }
    
    return seats;
}

function updateSeatsTable(occupiedSeats) {
    const table = document.querySelector('.seat-table');
    table.innerHTML = '';
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const seatsPerRow = 5;
    const screenRow = document.createElement('tr');
    const screenCell = document.createElement('td');
    screenCell.colSpan = seatsPerRow;
    screenCell.className = 'screen';
    screenCell.textContent = 'SCREEN';
    screenRow.appendChild(screenCell);
    table.appendChild(screenRow);
    const spacerRow = document.createElement('tr');
    const spacerCell = document.createElement('td');
    spacerCell.colSpan = seatsPerRow;
    spacerCell.className = 'seat-table-spacer';
    spacerRow.appendChild(spacerCell);
    table.appendChild(spacerRow);

    for (let i = 0; i < rows.length; i++) {
        const row = document.createElement('tr');

        for (let j = 1; j <= seatsPerRow; j++) {
            const seatId = `${rows[i]}${j}`;
            const cell = document.createElement('td');
            const seatButton = document.createElement('button');
            seatButton.textContent = seatId;
            seatButton.classList.add('seat');

            if (occupiedSeats.includes(seatId)) {
                seatButton.disabled = true;
                seatButton.classList.add('occupied');
            } else {
                seatButton.addEventListener('click', () => {
                    seatButton.classList.toggle('selected');
                });
            }

            cell.appendChild(seatButton);
            row.appendChild(cell);
        }
        
        table.appendChild(row);
    }
}

function handleReservation() {
    const selectedDay = document.querySelector('.day-btn.selected')?.dataset.day;
    const selectedTime = document.querySelector('.showtime-btn.selected')?.dataset.time;

    if (!selectedDay) {
        alert('Please select a day first.');
        return;
    }

    if (!selectedTime) {
        alert('Please select a showtime.');
        return;
    }

    const selectedSeats = Array.from(document.querySelectorAll('.seat.selected')).map(btn => btn.textContent);

    if (selectedSeats.length === 0) {
        alert('Please select at least one seat.');
        return;
    }

    const filmIndex = new URLSearchParams(window.location.search).get('filmIndex');

    makeReservation(filmIndex, selectedSeats, selectedDay, selectedTime);
}

async function getOccupiedSeats(filmIndex, day, showtime) {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:getOccupiedSeats>
                <filmIndex>${filmIndex}</filmIndex>
                <day>${day}</day>
                <showtime>${showtime}</showtime>
            </ser:getOccupiedSeats>
        </soapenv:Body>
    </soapenv:Envelope>`;

    try {
        const xml = await callSoap(envelope);
        return Array.from(xml.getElementsByTagName('return')).map(seat => seat.textContent);
    } catch (error) {
        console.error('Error fetching occupied seats:', error);
        return [];
    }
}

async function makeReservation(filmIndex, selectedSeats, selectedDay, selectedTime) {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:makeReservation>
                <filmIndex>${filmIndex}</filmIndex>
                <day>${selectedDay}</day>
                <showtime>${selectedTime}</showtime>
                ${selectedSeats.map(seat => `<seats>${seat}</seats>`).join('')}
            </ser:makeReservation>
        </soapenv:Body>
    </soapenv:Envelope>`;

    try {
        const xml = await callSoap(envelope);
        const response = xml.getElementsByTagName('return')[0]?.textContent;

        if (response && response.includes('successful')) {
            alert('Reservation successful!');
            const occupiedSeats = await getOccupiedSeats(filmIndex, selectedDay, selectedTime);
            updateSeatsTable(occupiedSeats);
        } else {
            alert(`Reservation failed: ${response}`);
        }
    } catch (error) {
        console.error('Error making reservation:', error);
        alert('An error occurred while making the reservation. Please try again later.');
    }
}
