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
// }, 5000);

async function loadPagine() {
    // Riferimento al contenitore della lista dei server
    let elencoScelteContainer = document.getElementById('elenco-scelte');
    elencoScelteContainer.innerHTML = '';

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
        let response = await fetch('/app/dati/selettoriPagine');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let elencoScelte = await response.json();
        let scelte = elencoScelte.selettori;

        if (!scelte || scelte.length === 0) {
            elencoScelteContainer.innerHTML = '<p class="text-light text-center">Nessuna scelta trovata.</p>';
            return;
        }

        scelte.forEach(async (scelta, index) => {
            const sceltaItem = document.createElement('div');
            sceltaItem.classList.add('scelta-item', 'mb-3', 'rounded-3', 'd-flex', 'align-items-center');

            const imgElement = document.createElement('img');

            // Contenuto dell'elemento della lista
            let contentHtml = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1 scelta-nome">${scelta.nome ? scelta.nome.toUpperCase() : 'NOME NON DISPONIBILE'}</h5>
                </div>
                <p class="mb-1 scelta-descrizione">${scelta.descrizione || 'Nessuna descrizione.'}</p>
            `;
            try {
                let imgResponse = await fetch(`/img/${scelta.nome}.png`);
                if (imgResponse.ok) {
                    let blob = await imgResponse.blob();
                    let imgUrl = URL.createObjectURL(blob);
                    imgElement.src = imgUrl;
                    imgElement.alt = `Logo ${scelta.nome}`;
                    imgElement.classList.add('scelta-logo', 'me-3', 'rounded', 'float-start');

                    imgElement.addEventListener('click', (event) => {
                        document.getElementsByClassName('barra')[0].classList.add('d-none');
                        event.stopPropagation();
                        event.preventDefault();
                        showOverlay(imgElement.src);
                    });
                }
            } catch (imgError) {
                console.warn(`Immagine per scelta ${scelta.nome} non trovata o errore nel caricamento:`, imgError);
            }

            const listItem = document.createElement('a');

            let nomeScelta = scelta.nome.toLowerCase();
            let serverRes = await fetch(`/factions/${nomeScelta}`);
            let redirect = await serverRes.json();

            listItem.href = redirect.redirectTo;
            listItem.classList.add('list-group-item', 'list-group-item-action', 'server-list-item', 'p-3', 'flex-fill');

            listItem.innerHTML = contentHtml;

            sceltaItem.appendChild(imgElement);
            sceltaItem.appendChild(listItem);

            elencoScelteContainer.appendChild(sceltaItem);
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
        console.error("Errore nel caricamento delle scelte:", error);
        elencoScelteContainer.innerHTML = '<p class="text-danger text-center">Errore nel caricamento dell\'elenco delle scelte.</p>';
    }
}