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

async function loadFilms() {
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

    items.forEach((node, index) => {
        const t = node.getElementsByTagName('title')[0].textContent;
        const d = node.getElementsByTagName('director')[0].textContent;
        const desc = node.getElementsByTagName('description')[0].textContent;
        const imageName = node.getElementsByTagName('imageName')[0].textContent;
        const li = document.createElement('li');
        li.classList.add('film-item');
        
        li.innerHTML =
            `<div class="film-content">
                <img class="film-poster" src="http://localhost:9999/cinema/images/${imageName}" alt="${t}">
                <div class="film-details">
                    <h2 class="film-title">${t}</h2>
                    <p class="film-director"><strong>Director:</strong> ${d}</p>
                    <p class="film-description"><strong>Description:</strong> ${desc}</p>
                </div>
            </div>`;
        ul.append(li);
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            window.location.href = `film.html?filmIndex=${index}`;
        });
    });

    document.getElementById('load').textContent = 'Ukryj filmy';
    document.getElementById('load').dataset.state = 'shown';
}

function toggleFilms() {
    const loadButton = document.getElementById('load');
    const filmsContainer = document.getElementById('films');
    
    if (loadButton.dataset.state === 'shown') {
        filmsContainer.style.display = 'none';
        loadButton.textContent = 'Pokaż filmy';
        loadButton.dataset.state = 'hidden';
    }
    else {
        filmsContainer.style.display = 'grid';
        loadButton.textContent = 'Ukryj filmy';
        loadButton.dataset.state = 'shown';

        if (filmsContainer.children.length === 0) {
            loadFilms();
        }
    }
}

document.getElementById('load').addEventListener('click', toggleFilms);
document.addEventListener('DOMContentLoaded', async () => {
    await loadFilms();
});