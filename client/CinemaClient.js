document.getElementById('btn').addEventListener('click', async () => {
    const name = document.getElementById('name').value || 'nieznajomy';
    const soap = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://server.cinema.rsi/">
    <soapenv:Header/>
    <soapenv:Body>
        <ser:getHello>
            <name>${name}</name>
        </ser:getHello>
    </soapenv:Body>
    </soapenv:Envelope>`;

    try {
        const resp = await fetch('http://localhost:9999/cinema/hello', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': '""'
            },
            body: soap
        });
        const text = await resp.text();
        const xml  = new DOMParser().parseFromString(text, 'application/xml');
        const reply = xml.getElementsByTagName('return')[0].textContent;
        document.getElementById('result').textContent = reply;
    } catch (e) {
        document.getElementById('result').textContent = 'Błąd: ' + e;
    }
});