const expand = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-arrows-angle-expand" viewBox="0 0 20 20"> <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707m4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707"/> </svg>'
const contract = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-arrows-angle-contract" viewBox="0 0 20 20"> <path fill-rule="evenodd" d="M.172 15.828a.5.5 0 0 0 .707 0l4.096-4.096V14.5a.5.5 0 1 0 1 0v-3.975a.5.5 0 0 0-.5-.5H1.5a.5.5 0 0 0 0 1h2.768L.172 15.121a.5.5 0 0 0 0 .707M15.828.172a.5.5 0 0 0-.707 0l-4.096 4.096V1.5a.5.5 0 1 0-1 0v3.975a.5.5 0 0 0 .5.5H14.5a.5.5 0 0 0 0-1h-2.768L15.828.879a.5.5 0 0 0 0-.707"/> </svg>'

// setInterval(() => {
//     fetch('/app/check-session')
//         .then(res => res.json())
//         .then(data => {
//             if (!data.valid) {
//                 Swal.fire({
//                     title: 'Sessione scaduta',
//                     text: data.message,
//                     icon: 'warning',
//                     confirmButtonText: 'Ok!'
//                 })
//                 setInterval(() => {
//                     window.location.href = data.redirectTo;
//                 }, 2000);
//             }
//         });
// }, 20000);

async function caricaMusiche() {
    const trackListSelect = document.getElementById('trackList');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValueDisplay = document.getElementById('volumeValueDisplay');
    const copertinaCanzone = document.getElementById('copertinaCanzone');
    const progressBar = document.getElementById('progressBar');
    const currentTimeDisplay = document.getElementById('currentTime');
    const totalDurationDisplay = document.getElementById('totalDuration');

    let isSeeking = false;

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updateProgress() {
        // Aggiorna la barra SOLO se l'utente NON sta interagendo (isSeeking è false)
        if (audioPlayer.duration && !isSeeking) {
            const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            // Controlla se progressPercent è un numero valido prima di assegnarlo
             if (isFinite(progressPercent)) {
                progressBar.value = progressPercent;
             }
        }
        // Aggiorna sempre il tempo corrente mostrato
        if (!isNaN(audioPlayer.currentTime)) {
            currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
        }
    }

    let responseTracce = await fetch('/app/data/elencoMusiche');
    let tracce = await responseTracce.json();

    console.log(tracce)

    tracce.musiche.forEach(traccia => {
        const option = document.createElement('option');
        option.value = traccia.source;
        option.textContent = traccia.titolo;
        trackListSelect.appendChild(option);
    })

    trackListSelect.addEventListener('change', async function () {
        const selectedTrackSrc = this.value;
        let titolo = trackListSelect.options[trackListSelect.selectedIndex].text;

        console.log(titolo)

        if (titolo === "") {
            titolo = "noMusic";
        }

        let imgResponse = await fetch(`/img/musiche/${titolo}.png`);
        let blob = await imgResponse.blob();
        let imgUrl = URL.createObjectURL(blob);
        copertinaCanzone.src = imgUrl;

        if (selectedTrackSrc) {
            audioPlayer.src = selectedTrackSrc;
            audioPlayer.load();
            audioPlayer.volume = volumeSlider.value;

            audioPlayer.play();
        } else {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            audioPlayer.currentTime = 0;
        }
    })

    volumeSlider.addEventListener('input', function () {
        const volume = this.value;
        audioPlayer.volume = volume;

        if (volumeValueDisplay) {
            volumeValueDisplay.textContent = `${Math.round(volume * 100)}%`;
        }
    })

    audioPlayer.addEventListener('timeupdate', updateProgress); // Aggiorna progresso mentre suona

    audioPlayer.addEventListener('loadedmetadata', () => { // Quando i dati (durata) sono pronti
        if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
            totalDurationDisplay.textContent = formatTime(audioPlayer.duration);
            progressBar.max = 100; // Assicura che max sia 100
        } else {
            console.warn("Durata non valida ricevuta da loadedmetadata.");
            totalDurationDisplay.textContent = "N/D"; // Mostra 'Non Disponibile'
            progressBar.max = 0; // O 100, ma segnala un problema
        }
    });

    progressBar.addEventListener('input', () => {
        isSeeking = true; // Indica che l'utente sta interagendo
        // Mostra il tempo corrispondente alla posizione dello slider
        // senza cambiare la riproduzione audio reale
        if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
            const seekTime = (progressBar.value / 100) * audioPlayer.duration;
            currentTimeDisplay.textContent = formatTime(seekTime);
        } else {
             // Se non c'è durata, mostra 0:00 o il valore dello slider grezzo
             currentTimeDisplay.textContent = formatTime(0);
        }
    });
    // Evento 'change' per applicare il seek quando si rilascia il mouse/dito
    progressBar.addEventListener('change', () => {
        if (audioPlayer.duration && isFinite(audioPlayer.duration)) {
            const newTime = (progressBar.value / 100) * audioPlayer.duration;
            // Imposta il tempo effettivo dell'audio player
            audioPlayer.currentTime = newTime;
        }
        // IMPORTANTE: Indica che l'utente ha finito di interagire
        isSeeking = false;
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    let utenteSessione;
    let response = await fetch('/app/data/utente');
    let data = await response.json();

    utenteSessione = data.message.username;

    document.getElementById('benvenuto').innerHTML += " " + utenteSessione.toUpperCase();
    caricaMusiche();
})

/**
 * Funzione che si occupa di caricare in modo dinamico tutti i server salvati all'interno del sito
 */
async function loadServer() {
    // Riferimento al contenitore della lista dei server
    let elencoServerContainer = document.getElementById('elenco-server');
    elencoServerContainer.innerHTML = '';

    // Get references to the overlay elements
    const imageOverlay = document.getElementById('imageOverlay');
    const enlargedImage = document.getElementById('enlargedImage');
    const closeOverlay = document.getElementById('closeOverlay');

    // Function to show the overlay
    function showOverlay(imageSrc) {
        enlargedImage.src = imageSrc;
        imageOverlay.style.display = 'flex'; // Use flex to center the image
    }

    // Function to hide the overlay
    function hideOverlay() {
        document.getElementsByClassName('barra')[0].classList.remove('d-none');
        imageOverlay.style.display = 'none';
        enlargedImage.src = '';
    }

    try {
        let response = await fetch('/app/dati/serverSalvati');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let elencoServer = await response.json();
        let servers = elencoServer.server;

        if (!servers || servers.length === 0) {
            elencoServerContainer.innerHTML = '<p class="text-light text-center">Nessun server trovato.</p>';
            return;
        }

        servers.forEach(async (server, index) => {
            const serverItem = document.createElement('div');
            serverItem.classList.add('server-item', 'mb-3', 'rounded-3', 'd-flex', 'align-items-center');

            const imgElement = document.createElement('img');

            // Contenuto dell'elemento della lista
            let contentHtml = `
                <div class="d-flex row">
                    <h5 class="mb-1 server-nome col-sm-8">${server.nome ? server.nome.toUpperCase() : 'NOME NON DISPONIBILE'}</h5>
                    <small class="text-muted server-versione col-sm-4">Versione: ${server.versione || 'Non specificata'}</small>
                </div>
                <p class="mb-1 server-descrizione">${server.descrizione || 'Nessuna descrizione.'}</p>
                <small class="text-muted server-indirizzo">Indirizzo: ${server.indirizzo || 'Non disponibile'}</small><br>
                <small class="text-muted server-partecipanti">Partecipanti: ${server.partecipanti && server.partecipanti !== '[]' ? server.partecipanti : 'Non specificati'}</small>
            `;
            try {
                let imgResponse = await fetch(`/img/${server.nome}.png`);
                if (imgResponse.ok) {
                    let blob = await imgResponse.blob();
                    let imgUrl = URL.createObjectURL(blob);
                    imgElement.src = imgUrl;
                    imgElement.alt = `Logo ${server.nome}`;
                    imgElement.classList.add('server-logo', 'me-3', 'rounded', 'float-start');

                    imgElement.addEventListener('click', (event) => {
                        document.getElementsByClassName('barra')[0].classList.add('d-none');
                        event.stopPropagation();
                        event.preventDefault();
                        showOverlay(imgElement.src);
                    });
                }
            } catch (imgError) {
                console.warn(`Immagine per server ${server.nome} non trovata o errore nel caricamento:`, imgError);
            }

            const listItem = document.createElement('a');

            let nomeServer = server.nome.toLowerCase();
            nomeServer = nomeServer.replace(" ", "_");
            let serverRes = await fetch(`/${nomeServer}`);
            let redirect = await serverRes.json();

            listItem.href = redirect.redirectTo;
            listItem.classList.add('list-group-item', 'list-group-item-action', 'server-list-item', 'p-3', 'flex-fill');

            listItem.innerHTML = contentHtml;

            serverItem.appendChild(imgElement);
            serverItem.appendChild(listItem);

            elencoServerContainer.appendChild(serverItem);
        });

        closeOverlay.addEventListener('click', hideOverlay);
        imageOverlay.addEventListener('click', (event) => {
            if (event.target === imageOverlay) {
                hideOverlay();
            }
        });
        enlargedImage.addEventListener('click', (event) => {
            event.stopPropagation();
        });


    } catch (error) {
        console.error("Errore nel caricamento dei server:", error);
        elencoServerContainer.innerHTML = '<p class="text-danger text-center">Errore nel caricamento dell\'elenco dei server.</p>';
    }
}

function logout() {
    fetch('/logout')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirectTo;
            } else {
                Swal.fire({
                    title: 'Esito logout',
                    text: data.message,
                    icon: 'error',
                    confirmButtonText: 'Ok!'
                });
            }
        })
}

function login() {
    fetch('/accedi')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirectTo;
            }
        })
}

function cambiaPagina(nomeServer) {
    nomeServer = nomeServer.toLowerCase().replace(" ", "_");

    fetch(`/${nomeServer}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            console.log(data); // Debug
            if (data.success && data.redirectTo) {
                window.location.href = data.redirectTo;
            } else {
                Swal.fire({
                    title: 'Errore',
                    text: data.message || 'Impossibile accedere alla pagina del server.',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                });
            }
        })
        .catch(error => {
            console.error('Errore nella fetch per cambiaPagina:', error);
            Swal.fire({
                title: 'Errore di Rete',
                text: 'Impossibile comunicare con il server.',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        });
}
