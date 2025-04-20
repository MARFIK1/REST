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

document.getElementById('load').addEventListener('click', async () => {
  const envelope = `<?xml version="1.0"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:ser="http://service.cinema.rsi/">
      <soapenv:Body>
          <ser:getFilmList/>
      </soapenv:Body>
  </soapenv:Envelope>`;
  const xml = await callSoap(envelope);
  const items = Array.from(xml.getElementsByTagName('return'));
  const ul = document.getElementById('films');
  ul.innerHTML = '';
  
  items.forEach(node => {
      const t = node.getElementsByTagName('title')[0].textContent;
      const d = node.getElementsByTagName('director')[0].textContent;
      const desc = node.getElementsByTagName('description')[0].textContent;
      const actors = Array.from(node.getElementsByTagName('actor')).map(el => el.textContent);
      const imageName = node.getElementsByTagName('imageName')[0].textContent;
      const li = document.createElement('li');
      li.classList.add('film-item');
      
      li.innerHTML =
          `<div class="film-content">
              <img class="film-poster" src="http://localhost:9999/cinema/images/${imageName}" alt="${t}">
              <div class="film-details">
                  <h2 class="film-title">${t}</h2>
                  <p><strong>Director:</strong> ${d}</p>
                  <p><strong>Actors:</strong></p>
                  <ul>
                      ${actors.map(a => `<li>${a}</li>`).join('')}
                  </ul>
                  <p><strong>Description:</strong> ${desc}</p>
                  <button class="select-film">Rezerwacja</button>
              </div>
          </div>`;
      ul.append(li);
  });

  document.querySelectorAll('.select-film').forEach(button => {
      button.addEventListener('click', (e) => {
          const filmIndex = e.target.closest('li').dataset.index;
          showSeatSelection(filmIndex);
      });
  });
});

function showSeatSelection(filmIndex) {
  const seatContainer = document.getElementById('seats');
  seatContainer.innerHTML = '';

  const seats = [
      "A1", "A2", "A3", "A4", "A5",
      "B1", "B2", "B3", "B4", "B5",
      "C1", "C2", "C3", "C4", "C5",
      "D1", "D2", "D3", "D4", "D5",
      "E1", "E2", "E3", "E4", "E5"
  ];

  // Tworzenie tabeli
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

  seatContainer.append(table);

  // Dodanie przycisku rezerwacji
  const reserveButton = document.createElement('button');
  reserveButton.textContent = 'Zarezerwuj';
  reserveButton.classList.add('reserve-button');
  reserveButton.addEventListener('click', () => {
      const selectedSeats = Array.from(document.querySelectorAll('.seat.selected')).map(btn => btn.textContent);
      if (selectedSeats.length === 0) {
          alert('Please select at least one seat.');
          return;
      }
      makeReservation(filmIndex, selectedSeats);
  });
  seatContainer.append(reserveButton);
}

async function makeReservation(filmIndex, seats) {
  const envelope = `<?xml version="1.0"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:ser="http://service.cinema.rsi/">
      <soapenv:Body>
          <ser:makeReservation>
              <filmIndex>${filmIndex}</filmIndex>
              ${seats.map(seat => `<seats>${seat}</seats>`).join('')}
          </ser:makeReservation>
      </soapenv:Body>
  </soapenv:Envelope>`;
  const xml = await callSoap(envelope);
  const response = xml.getElementsByTagName('return')[0]?.textContent;
  alert(response || 'Reservation failed.');
}
