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
let uniqueDays = [];
let uniqueShowtimes = [];

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
        allReservations = Array.from(xml.getElementsByTagName('return'));

        extractUniqueValues();
        updateFilterPanel();
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
        const day = reservation.getElementsByTagName('day')[0].textContent;
        const showtime = reservation.getElementsByTagName('showtime')[0].textContent;
        const seats = Array.from(reservation.getElementsByTagName('seat')).map(seat => seat.textContent);

        const reservationDiv = document.createElement('div');
        reservationDiv.classList.add('reservation-item');
        reservationDiv.innerHTML = `
            <h2>${filmTitle}</h2>
            <p><strong>Day:</strong> ${day}</p>
            <p><strong>Showtime:</strong> ${showtime}</p>
            <p><strong>Seats:</strong> ${seats.join(', ')}</p>
            <div class="reservation-buttons-container">
                <button class="cancel-reservation-btn">Cancel</button>
                <button class="edit-reservation-btn">Edit</button>
                <button class="generate-pdf-btn">Generate PDF</button>
            </div>
        `;

        reservationDiv.querySelector('.edit-reservation-btn').addEventListener('click', () => {
            showEditReservationModal(filmTitle, day, showtime, seats);
        });

        reservationDiv.querySelector('.generate-pdf-btn').addEventListener('click', () => {
            generatePDF(filmTitle, day, showtime, seats);
        });

        reservationDiv.querySelector('.cancel-reservation-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel this reservation?')) {
                cancelReservation(filmTitle, day, showtime, seats);
            }
        });

        container.appendChild(reservationDiv);
    });
}

function extractUniqueValues() {
    const daysSet = new Set();
    const showtimesSet = new Set();

    allReservations.forEach(reservation => {
        const day = reservation.getElementsByTagName('day')[0].textContent;
        const showtime = reservation.getElementsByTagName('showtime')[0].textContent;

        daysSet.add(day);
        showtimesSet.add(showtime);
    });

    uniqueDays = [...daysSet].sort();
    uniqueShowtimes = [...showtimesSet].sort();
}

function updateFilterPanel() {
    const daySelect = document.getElementById('day-select');
    const showtimeSelect = document.getElementById('showtime-select');

    uniqueDays.forEach(day => {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    });

    uniqueShowtimes.forEach(showtime => {
        const option = document.createElement('option');
        option.value = showtime;
        option.textContent = showtime;
        showtimeSelect.appendChild(option);
    });
}

function filterReservations() {
    const filmTitle = document.getElementById('film-filter').value.toLowerCase();
    const selectedDay = document.getElementById('day-select').value;
    const selectedShowtime = document.getElementById('showtime-select').value;

    const filteredReservations = allReservations.filter(reservation => {
        const title = reservation.getElementsByTagName('filmTitle')[0].textContent.toLowerCase();
        const day = reservation.getElementsByTagName('day')[0].textContent;
        const showtime = reservation.getElementsByTagName('showtime')[0].textContent;
        
        const matchesTitle = title.includes(filmTitle);
        const matchesDay = selectedDay === '' || day === selectedDay;
        const matchesShowtime = selectedShowtime === '' || showtime === selectedShowtime;
        
        return matchesTitle && matchesDay && matchesShowtime;
    });

    displayReservations(filteredReservations);
}

async function cancelReservation(filmTitle, day, showtime, seats) {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:cancelReservation>
                <filmTitle>${filmTitle}</filmTitle>
                <day>${day}</day>
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

async function generatePDF(filmTitle, day, showtime, seats) {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:generatePDF>
                <filmTitle>${filmTitle}</filmTitle>
                <day>${day}</day>
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

async function showEditReservationModal(filmTitle, day, showtime, seats) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'edit-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'edit-modal-content';
    
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = 'Edit Reservation';
    modalContent.appendChild(modalTitle);

    const filmInfo = document.createElement('div');
    filmInfo.innerHTML = `
        <div class="form-group">
            <label><strong>Film Title:</strong> ${filmTitle}</label>
        </div>
        <div class="form-group">
            <label><strong>Day:</strong> ${day}</label>
        </div>
    `;
    modalContent.appendChild(filmInfo);

    const filmIndex = await getFilmIndexByTitle(filmTitle);
    
    if (filmIndex === -1) {
        modalContent.innerHTML += '<p class="error-message">Error: Film not found.</p>';
        const closeButton = createButton('Close', 'cancel-button');
        closeButton.addEventListener('click', () => document.body.removeChild(modalOverlay));
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        return;
    }

    const availableShowtimes = await getShowtimesForFilmDay(filmIndex, day);
    const showtimeSelector = document.createElement('div');
    showtimeSelector.className = 'form-group';
    showtimeSelector.innerHTML = `<label><strong>Showtime:</strong></label>`;
    const showtimeButtons = document.createElement('div');
    showtimeButtons.className = 'showtime-buttons';

    let currentSelectedShowtime = showtime;
    
    availableShowtimes.forEach(time => {
        const button = document.createElement('button');
        button.textContent = time;
        button.className = 'showtime-btn';

        if (time === showtime) {
            button.classList.add('selected');
        }

        button.addEventListener('click', async () => {
            showtimeButtons.querySelectorAll('.showtime-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            currentSelectedShowtime = time;
            
            if (time !== showtime) {
                await updateSeatsForEdit(seatsContainer, filmIndex, day, time, []);
            } else {
                await updateSeatsForEdit(seatsContainer, filmIndex, day, time, seats);
            }
        });

        showtimeButtons.appendChild(button);
    });
    
    showtimeSelector.appendChild(showtimeButtons);
    modalContent.appendChild(showtimeSelector);

    const seatsContainer = document.createElement('div');
    seatsContainer.className = 'seats-area edit-seats';
    seatsContainer.innerHTML = `<h3>Select Your Seats:</h3>`;
    
    const seatsTable = document.createElement('table');
    seatsTable.className = 'seat-table';
    seatsContainer.appendChild(seatsTable);
    
    modalContent.appendChild(seatsContainer);
    
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'modal-actions';

    const cancelButton = createButton('Cancel', 'cancel-button');
    cancelButton.addEventListener('click', () => document.body.removeChild(modalOverlay));
    
    const saveButton = createButton('Edit Reservation', 'save-button');

    saveButton.addEventListener('click', async () => {
        const selectedShowtime = showtimeButtons.querySelector('.showtime-btn.selected')?.textContent;

        if (!selectedShowtime) {
            alert('Please select a showtime.');
            return;
        }
        
        const selectedSeats = Array.from(seatsContainer.querySelectorAll('.seat.selected')).map(btn => btn.textContent);

        if (selectedSeats.length === 0) {
            alert('Please select at least one seat.');
            return;
        }
        
        showConfirmationModal(
            filmTitle, 
            day, 
            showtime, 
            selectedShowtime, 
            seats, 
            selectedSeats, 
            () => {
                updateReservation(filmTitle, day, showtime, seats, selectedShowtime, selectedSeats);
                document.body.removeChild(modalOverlay);
            },
            () => { }
        );
    });
    
    actionsContainer.appendChild(cancelButton);
    actionsContainer.appendChild(saveButton);
    modalContent.appendChild(actionsContainer);

    await updateSeatsForEdit(seatsContainer, filmIndex, day, showtime, seats);

    modal.appendChild(modalContent);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
}

function showConfirmationModal(filmTitle, day, originalShowtime, newShowtime, originalSeats, newSeats, onConfirm, onCancel) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';

    const title = document.createElement('h3');
    title.textContent = 'Confirm Reservation Changes';
    modal.appendChild(title);

    const content = document.createElement('div');
    content.className = 'confirmation-content';
    
    let confirmationHTML = `
        <p><strong>Film:</strong> ${filmTitle}</p>
        <p><strong>Day:</strong> ${day}</p>
    `;
    
    if (originalShowtime !== newShowtime) {
        confirmationHTML += `<p><strong>Showtime:</strong> ${originalShowtime} → ${newShowtime}</p>`;
    } else {
        confirmationHTML += `<p><strong>Showtime:</strong> ${originalShowtime}</p>`;
    }
    
    const areSeatsChanged = !arraysEqual(originalSeats.sort(), newSeats.sort());

    if (areSeatsChanged) {
        confirmationHTML += `<p><strong>Seats:</strong> ${originalSeats.join(', ')} → ${newSeats.join(', ')}</p>`;
    } else {
        confirmationHTML += `<p><strong>Seats:</strong> ${originalSeats.join(', ')}</p>`;
    }
    
    content.innerHTML = confirmationHTML;
    modal.appendChild(content);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'confirmation-buttons';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'cancel-button';

    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        if (onCancel) onCancel();
    });

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.className = 'save-button';

    confirmButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        if (onConfirm) onConfirm();
    });

    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(confirmButton);
    modal.appendChild(buttonsContainer);

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }

    return true;
}

function createButton(text, className) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    return button;
}

async function getFilmIndexByTitle(title) {
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
        
        for (let i = 0; i < films.length; i++) {
            const filmTitle = films[i].getElementsByTagName('title')[0].textContent;
            if (filmTitle === title) {
                return i;
            }
        }

        return -1;
    } catch (error) {
        console.error('Error fetching film index:', error);
        return -1;
    }
}

async function getShowtimesForFilmDay(filmIndex, day) {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:getFilmList/>
        </soapenv:Body>
    </soapenv:Envelope>`;

    try {
        const xml = await callSoap(envelope);
        const film = xml.getElementsByTagName('return')[filmIndex];
        
        if (!film) {
            return [];
        }
        
        const scheduleEntries = Array.from(film.getElementsByTagName('entry'));
        
        for (const entry of scheduleEntries) {
            const entryDay = entry.getElementsByTagName('key')[0].textContent;

            if (entryDay === day) {
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
                
                return showtimes;
            }
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching showtimes:', error);
        return [];
    }
}

async function updateSeatsForEdit(seatsContainer, filmIndex, day, showtime, currentSeats) {
    const occupiedSeats = await getOccupiedSeats(filmIndex, day, showtime);
    
    const reallyOccupiedSeats = occupiedSeats.filter(seat => !currentSeats.includes(seat));
    
    const table = seatsContainer.querySelector('.seat-table');
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

            if (reallyOccupiedSeats.includes(seatId)) {
                seatButton.disabled = true;
                seatButton.classList.add('occupied');
            } 
            else if (currentSeats.includes(seatId)) {
                seatButton.classList.add('selected');
            }
            
            seatButton.addEventListener('click', () => {
                if (!seatButton.disabled) {
                    seatButton.classList.toggle('selected');
                }
            });

            cell.appendChild(seatButton);
            row.appendChild(cell);
        }
        
        table.appendChild(row);
    }
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

async function updateReservation(filmTitle, originalDay, originalShowtime, originalSeats, newShowtime, newSeats) {
    try {
        const cancelEnvelope = `<?xml version="1.0"?>
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                          xmlns:ser="http://service.cinema.rsi/">
            <soapenv:Body>
                <ser:cancelReservation>
                    <filmTitle>${filmTitle}</filmTitle>
                    <day>${originalDay}</day>
                    <showtime>${originalShowtime}</showtime>
                    ${originalSeats.map(seat => `<seats>${seat}</seats>`).join('')}
                </ser:cancelReservation>
            </soapenv:Body>
        </soapenv:Envelope>`;

        await callSoap(cancelEnvelope);

        const filmIndex = await getFilmIndexByTitle(filmTitle);
        
        const makeReservationEnvelope = `<?xml version="1.0"?>
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                          xmlns:ser="http://service.cinema.rsi/">
            <soapenv:Body>
                <ser:makeReservation>
                    <filmIndex>${filmIndex}</filmIndex>
                    <day>${originalDay}</day>
                    <showtime>${newShowtime}</showtime>
                    ${newSeats.map(seat => `<seats>${seat}</seats>`).join('')}
                </ser:makeReservation>
            </soapenv:Body>
        </soapenv:Envelope>`;

        const xml = await callSoap(makeReservationEnvelope);
        const response = xml.getElementsByTagName('return')[0]?.textContent;

        if (response && response.includes('successful')) {
            alert('Reservation updated successfully!');
            await loadReservations();
        } else {
            alert(`Update failed: ${response}`);
        }
    } catch (error) {
        console.error('Error updating reservation:', error);
        alert('An error occurred while updating the reservation. Please try again later.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('reset-filter-btn').addEventListener('click', () => {
        document.getElementById('film-filter').value = '';
        document.getElementById('day-select').value = '';
        document.getElementById('showtime-select').value = '';
        displayReservations(allReservations);
    });

    document.getElementById('film-filter').addEventListener('input', filterReservations);
    document.getElementById('day-select').addEventListener('change', filterReservations);
    document.getElementById('showtime-select').addEventListener('change', filterReservations);

    loadReservations();
});
