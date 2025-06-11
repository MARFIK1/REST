let allReservations = [];
let uniqueDays = [];
let uniqueShowtimes = [];

async function loadReservations() {
    try {
        const resp = await fetch('https://localhost:8443/cinema/reservations', {
            method: 'GET',
            headers: {
                'Authorization': sessionStorage.getItem('basicAuth'),
                'Content-Type': 'application/json'
            }
        });
        if (!resp.ok) throw new Error(await resp.text());
        const reservations = await resp.json();
        allReservations = reservations;

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
        const filmTitle = reservation.filmTitle;
        const day = reservation.day;
        const showtime = reservation.showtime;
        const seats = Array.from(reservation.seats);

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
        const day = reservation.day;
        const showtime = reservation.showtime;

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
        const title = reservation.filmTitle.toLowerCase();
        const day = reservation.day;
        const showtime = reservation.showtime;
        
        const matchesTitle = title.includes(filmTitle);
        const matchesDay = selectedDay === '' || day === selectedDay;
        const matchesShowtime = selectedShowtime === '' || showtime === selectedShowtime;
        
        return matchesTitle && matchesDay && matchesShowtime;
    });

    displayReservations(filteredReservations);
}

async function cancelReservation(filmTitle, day, showtime, seats) {
    try {
        const reservationIndex = getReservationIndex(filmTitle, day, showtime, seats);
        if (reservationIndex === -1) {
            alert('Reservation not found.');
            return;
        }
        const resp = await fetch(`https://localhost:8443/cinema/reservation/${reservationIndex}`, {
            method: 'DELETE',
            headers: {
                'Authorization': sessionStorage.getItem('basicAuth')
            }
        });
        const responseText = await resp.text();
        if (resp.ok && responseText.includes('cancelled')) {
            alert('Reservation cancelled successfully!');
            await loadReservations();
        } else {
            alert(`Cancellation failed: ${responseText}`);
        }
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('An error occurred while cancelling the reservation. Please try again later.');
    }
}

function getReservationIndex(filmTitle, day, showtime, seats) {
    return allReservations.findIndex(r =>
        r.filmTitle === filmTitle &&
        r.day === day &&
        r.showtime === showtime &&
        arraysEqual(r.seats.sort(), seats.sort())
    );
}

async function generatePDF(filmTitle, day, showtime, seats) {
    try {
        const filmIndex = await getFilmIndexByTitle(filmTitle);
        if (filmIndex === -1) {
            alert('Film not found.');
            return;
        }
        const resp = await fetch('https://localhost:8443/cinema/generate-pdf', {
            method: 'POST',
            headers: {
                'Authorization': sessionStorage.getItem('basicAuth'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filmIndex,
                day,
                showtime,
                seats
            })
        });
        if (!resp.ok) {
            alert('Failed to generate PDF.');
            return;
        }
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reservation.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
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
    try {
        const resp = await fetch('https://localhost:8443/cinema/films', {
            method: 'GET',
        });
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        const films = await resp.json();
        
        for (let i = 0; i < films.length; i++) {
            if (films[i].title === title) {
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
    try {
        const resp = await fetch(`https://localhost:8443/cinema/films/${filmIndex}`, {
            method: 'GET',
        });
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        const film = await resp.json();
        return film.schedule[day] || [];
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
    try {
        const resp = await fetch(`https://localhost:8443/cinema/occupied-seats?filmIndex=${filmIndex}&day=${day}&showtime=${showtime}`, {
            method: 'GET',
            headers: {
                'Authorization': sessionStorage.getItem('basicAuth'),
                'Content-Type': 'application/json'
            }
        });
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        return await resp.json();
    } catch (error) {
        console.error('Error fetching occupied seats:', error);
        return [];
    }
}

async function updateReservation(filmTitle, originalDay, originalShowtime, originalSeats, newShowtime, newSeats) {
    const reservationIndex = getReservationIndex(filmTitle, originalDay, originalShowtime, originalSeats);
    if (reservationIndex === -1) {
        alert('Reservation not found.');
        return;
    }
    const filmIndex = await getFilmIndexByTitle(filmTitle);
    const resp = await fetch(`https://localhost:8443/cinema/reservation/${reservationIndex}`, {
        method: 'PUT',
        headers: {
            'Authorization': sessionStorage.getItem('basicAuth'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filmIndex,
            day: originalDay,
            showtime: newShowtime,
            seats: newSeats
        })
    });
    const text = await resp.text();
    if (resp.ok) {
        alert('Reservation updated successfully!');
        await loadReservations();
    } else {
        alert(`Update failed: ${text}`);
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
