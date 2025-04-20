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
        const li = document.createElement('li');
        li.classList.add('film-item');
        
        li.innerHTML =
            `<h2 class="film-title">${t}</h2>
            <p><strong>Director:</strong> ${d}</p>
            <p><strong>Actors:</strong></p>
            <ul>
                ${actors.map(a => `<li>${a}</li>`).join('')}
            </ul>
            <p><strong>Description:</strong> ${desc}</p>`;
        ul.append(li);
    });    
});