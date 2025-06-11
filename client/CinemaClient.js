async function loadFilms() {
        try {
        const resp = await fetch('https://localhost:8443/cinema/films', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        const items = await resp.json();
        
        if (!items || items.length === 0) {
            document.getElementById('films').innerHTML = 
                '<div style="color: red; text-align: center; padding: 20px;">Nie można załadować listy filmów</div>';
            return false;
        }
        
        const ul = document.getElementById('films');
        ul.innerHTML = '';
        
        items.forEach((node, index) => {
            const t = node.title;
            const d = node.director;
            const desc = node.description;
            const imageName = node.imageName;
            const li = document.createElement('li');
            li.classList.add('film-item');
            const imageUrl = `https://localhost:8443/cinema/images/${imageName}`;
            
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