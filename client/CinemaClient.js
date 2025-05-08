async function callSoap(body) {
    try {
        const resp = await fetch('https://localhost:9999/cinema', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': '""'
            },
            body: body
        });
        
        if (!resp.ok) {
            throw new Error(`HTTP error! status: ${resp.status}`);
        }
        
        const text = await resp.text();
        return new DOMParser().parseFromString(text, 'application/xml');
    } catch (error) {
        console.error('SOAP request failed:', error);
        throw error;
    }
}

async function loadFilms() {
    const envelope = `<?xml version="1.0"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.cinema.rsi/">
        <soapenv:Body>
            <ser:getFilmList/>
        </soapenv:Body>
    </soapenv:Envelope>`;
    
    try {
        const xml = await callSoap(envelope);
        const fault = xml.getElementsByTagName('Fault')[0];

        if (fault) {
            const faultString = fault.getElementsByTagName('faultstring')[0]?.textContent;
            throw new Error(`SOAP Fault: ${faultString}`);
        }
        
        const items = Array.from(xml.getElementsByTagName('return'));
        
        if (!items || items.length === 0) {
            document.getElementById('films').innerHTML = 
                '<div style="color: red; text-align: center; padding: 20px;">Nie można załadować listy filmów</div>';
            return false;
        }
        
        const ul = document.getElementById('films');
        ul.innerHTML = '';
        
        items.forEach((node, index) => {
            const t = node.getElementsByTagName('title')[0].textContent;
            const d = node.getElementsByTagName('director')[0].textContent;
            const desc = node.getElementsByTagName('description')[0].textContent;
            const imageName = node.getElementsByTagName('imageName')[0].textContent;
            const li = document.createElement('li');
            li.classList.add('film-item');
            const imageUrl = `https://localhost:9999/cinema/images/${imageName}`;
            
            li.innerHTML =
                `<div class="film-content">
                    <img class="film-poster" src="${imageUrl}" alt="${t}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22150%22><rect fill=%22%23ddd%22 width=%22100%22 height=%22150%22/><text fill=%22%23555%22 x=%2250%22 y=%2275%22 text-anchor=%22middle%22>Brak obrazu</text></svg>'">
                    <div class="film-details">
                        <h2 class="film-title">${t}</h2>
                        <p class="film-director"><strong>Director:</strong> ${d}</p>
                        <p class="film-description">${desc}</p>
                    </div>
                </div>`;
            ul.append(li);
            li.style.cursor = 'pointer';

            li.addEventListener('click', () => {
                window.location.href = `film.html?filmIndex=${index}`;
            });
        });

        document.getElementById('films').style.display = 'grid';
        return true;
    } catch (error) {
        console.error('Error loading films:', error);
        
        document.getElementById('films').innerHTML = 
            `<div style="color: red; text-align: center; padding: 20px;">
                Błąd podczas wczytywania filmów: ${error.message}
                <br>Sprawdź czy serwer jest uruchomiony lub spróbuj ponownie później.
            </div>`;
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const filmsContainer = document.getElementById('films');
    filmsContainer.style.display = 'grid';
    loadFilms();
});