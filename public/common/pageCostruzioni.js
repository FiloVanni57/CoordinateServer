setInterval(() => {
    fetch('/app/check-session')
        .then(res => res.json())
        .then(data => {
            if (!data.valid) {
                Swal.fire({
                    title: 'Sessione scaduta',
                    text: data.message,
                    icon: 'warning',
                    confirmButtonText: 'Ok!'
                })
                setInterval(() => {
                    window.location.href = data.redirectTo;
                }, 2000);
            }
        });
}, 20000);

let utenteSessione;

document.addEventListener('DOMContentLoaded', async () => {
    let response = await fetch('/app/data/utente');
    let data = await response.json();

    utenteSessione = data.message.username;
});

async function loadCostruzioni(NOME_SERVER) {
    var modelloBody = document.getElementById('modello-body');
    var modello = document.getElementById('modello');

    modelloBody.innerHTML = "";
    modelloBody.append(modello);

    fetch(`/app/dati/costruzioniSalvate?server=${encodeURIComponent(NOME_SERVER)}`)
        .then(ris => ris.json())
        .then(data => {
            for (var i = 0; i < data.length; i++) {
                var clone = modello.cloneNode(true);
                let dataCostruzioni = data[i];

                if ((dataCostruzioni.privato === true && dataCostruzioni.utente === utenteSessione) || dataCostruzioni.privato === false) {
                    clone.getElementsByClassName('titolo')[0].innerHTML = dataCostruzioni.nome.toUpperCase();

                    let img = clone.getElementsByClassName('immagine')[0];
                    img.src = dataCostruzioni.immagine;

                    clone.getElementsByClassName('coordinate')[0].innerHTML += "Coordinate: [" + dataCostruzioni.posizione + "]";

                    let fnd = clone.getElementsByClassName('creatore')[0];
                    fnd.innerHTML += "Creata da: " + dataCostruzioni.utente;

                    let dt = clone.getElementsByClassName('data-scoperta')[0];
                    dt.innerHTML += "Data scoperta: " + dataCostruzioni.data;

                    let desc = clone.getElementsByClassName('descrizione')[0];
                    desc.innerHTML += dataCostruzioni.descrizione;

                    clone.classList.remove('d-none');
                    modello.before(clone);
                }
            }
            modello.remove();
            modelloBody.childNodes[0].classList.add('active');

        });
}

function inserimentoCostruzione() {
    var section = document.getElementsByClassName('inserimento')[0];
    let nomeUtente = section.getElementsByClassName('utente')[0];
    nomeUtente.value = utenteSessione;
}

async function inserisciCostruzione(NOME_SERVER, NOME_SERVER_IMG) {
    const section = document.getElementsByClassName('inserimento')[0];

    let nomeCostruzione = section.getElementsByClassName('nome')[0].value.toLowerCase();
    let nomeUtente = section.getElementsByClassName('utente')[0].value;
    const x = section.getElementsByClassName('x')[0].value;
    const y = section.getElementsByClassName('y')[0].value;
    const gg = section.getElementsByClassName('gg')[0].value;
    const mm = section.getElementsByClassName('mm')[0].value;
    const aaaa = section.getElementsByClassName('aaaa')[0].value;
    let desc = section.getElementsByClassName('desc')[0].value;
    const file = section.getElementsByClassName('copertina')[0].files[0];
    let privato = section.getElementsByClassName('switch')[0].checked;

    const elementoSelezionato = section.getElementsByClassName('dimensione')[0];
    const selectedIndex = elementoSelezionato.selectedIndex;
    const dimensioneCostruzione = elementoSelezionato.options[selectedIndex].text;

    let dataString = gg + "/" + mm + "/" + aaaa;
    if (dataString === "//") {
        dataString = "DATO NON PRESENTE";
    }

    let imgUrl;

    const formData = new FormData();
    formData.append('nome', nomeCostruzione);
    formData.append('immagine', file);
    formData.append('server', NOME_SERVER_IMG)
    formData.append('data', dataString);

    try {
        const response = await fetch('/app/data/upload-immagine', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!data.success) {
            await Swal.fire({
                title: 'Esito operazione',
                text: data.message,
                icon: 'warning',
                confirmButtonText: 'Ok!'
            });
            return;
        } else {
            imgUrl = data.url;
        }

        if (nomeUtente === "") {
            nomeUtente = "DATO NON PRESENTE";
        }
        if (desc === "") {
            desc = "DESCRIZIONE NON PRESENTE";
        }

        const res2 = await fetch('/app/inserisciCostruzione', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: nomeCostruzione,
                posizione: [x, y],
                utente: nomeUtente,
                data: dataString,
                descrizione: desc,
                dimensione: dimensioneCostruzione,
                privato: privato,
                server: NOME_SERVER,
                immagine: imgUrl
            })
        });

        const data2 = await res2.json();

        if (data2.success) {
            await Swal.fire({
                title: 'Esito operazione',
                text: data2.message,
                icon: 'success',
                confirmButtonText: 'Ok!'
            })
            location.reload();
        } else {
            Swal.fire({
                title: 'Esito operazione',
                text: data.message,
                icon: 'error',
                confirmButtonText: 'Ok!'
            })
        }

    } catch (err) {
        console.error("Errore durante l'inserimento:", err);
        Swal.fire({
            title: 'Errore',
            text: 'Si è verificato un errore durante l\'upload.',
            icon: 'error',
            confirmButtonText: 'Ok!'
        });
    }
}

function confermaRimuoviCostruzione(NOME_SERVER, NOME_SERVER_IMG) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: 'Scegli cosa vuoi fare',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sì, cancella',
        cancelButtonText: 'No, annulla!',
    }).then((result) => {
        if (result.isConfirmed) {
            rimuoviCostruzione(NOME_SERVER, NOME_SERVER_IMG)
        } else if (result.isDismissed) {
            console.log("Azione annullata!");
        }
    });
}

function rimuoviCostruzione(NOME_SERVER, NOME_SERVER_IMG) {

    var corpoModello = document.getElementById('modello-body');
    var elementoDaRimuovere = corpoModello.getElementsByClassName('active');

    // raccogliendo dati dall'HTML
    let urlImmagine = elementoDaRimuovere[0].getElementsByClassName('immagine')[0].src;
    var titolo = elementoDaRimuovere[0].getElementsByClassName('titolo')[0].innerHTML;
    var coord = elementoDaRimuovere[0].getElementsByClassName('coordinate')[0].innerHTML;
    var utente = elementoDaRimuovere[0].getElementsByClassName('creatore')[0].innerHTML;
    var data = elementoDaRimuovere[0].getElementsByClassName('data-scoperta')[0].innerHTML;

    var next = document.getElementsByClassName('carousel-control-next')[0];
    next.click();

    fetch('/app/rimuoviCostruzione', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: titolo,
            posizione: coord,
            utente: utente,
            data: data,
            server: NOME_SERVER,
            immagine: urlImmagine
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    title: 'Esito operazione',
                    text: data.message,
                    icon: 'success',
                    confirmButtonText: 'Ok!'
                });
            }
        });

    elementoDaRimuovere[0].remove();
}

var nomePrec;
var coordPrec;
let privatoPrec;

function modificaDatiCostruzione(NOME_SERVER) {
    var modelloBody = document.getElementById('modello-body');
    var attivo = modelloBody.getElementsByClassName('active')[0];

    var nomeBioma = attivo.getElementsByClassName('titolo')[0].innerHTML;
    var coordinate = attivo.getElementsByClassName('coordinate')[0].innerHTML;

    const section = document.getElementsByClassName('modifica')[0];

    //var biomaSelettore = section.getElementsByClassName('modello-elenco')[0];
    var nomeUtente = section.getElementsByClassName('utente')[0];
    var x = section.getElementsByClassName('x')[0];
    var y = section.getElementsByClassName('y')[0];
    var gg = section.getElementsByClassName('gg')[0];
    var mm = section.getElementsByClassName('mm')[0];
    var aaaa = section.getElementsByClassName('aaaa')[0];
    var desc = section.getElementsByClassName('desc')[0];
    let privato = section.getElementsByClassName('switch')[0];

    fetch('/app/datiCostruzione', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: nomeBioma,
            posizione: coordinate,
            server: NOME_SERVER,
        })
    })
        .then(res => res.json())
        .then(datiRicevuti => {

            if (datiRicevuti[0].utente != "DATO NON PRESENTE") {
                nomeUtente.value = datiRicevuti[0].utente;
            } else {
                nomeUtente.value = "";
            }

            x.value = datiRicevuti[0].posizione[0];
            y.value = datiRicevuti[0].posizione[1];
            coordPrec = [datiRicevuti[0].posizione[0], datiRicevuti[0].posizione[1]];

            var data_scoperta = datiRicevuti[0].data;
            if (data_scoperta != "DATO NON PRESENTE") {
                data_scoperta = data_scoperta.split('/');
                gg.value = data_scoperta[0];
                mm.value = data_scoperta[1];
                aaaa.value = data_scoperta[2];
            }
            if (datiRicevuti[0].descrizione != "DESCRIZIONE NON PRESENTE") {
                desc.value = datiRicevuti[0].descrizione;
            }

            privatoPrec = datiRicevuti[0].privato;
            privato.checked = datiRicevuti[0].privato;
        });
}

function inviaDatiModificati(NOME_SERVER) {
    const section = document.getElementsByClassName('modifica')[0];
    var modelloBody = document.getElementById('modello-body');
    var active = modelloBody.getElementsByClassName('active')[0];

    const nomeCostruzione = active.getElementsByClassName('titolo')[0].innerHTML.toLowerCase();
    var utente = section.getElementsByClassName('utente')[0].value;
    var x = section.getElementsByClassName('x')[0].value;
    var y = section.getElementsByClassName('y')[0].value;
    var gg = section.getElementsByClassName('gg')[0].value;
    var mm = section.getElementsByClassName('mm')[0].value;
    var aaaa = section.getElementsByClassName('aaaa')[0].value;
    var desc = section.getElementsByClassName('desc')[0].value;
    let privato = section.getElementsByClassName('switch')[0].checked

    if (utenteSessione != utente && privatoPrec != privato) {
        Swal.fire({
            title: 'Esito operazione',
            text: "Impossibile modificare valore privato: l'utente che sta cercando di modificare il dato è diverso da quello che lo ha inserito",
            icon: 'warning',
            confirmButtonText: 'Ok!'
        })
        return;
    } else {
        privatoPrec = privato;
    }

    if (utente == "") {
        utente = "DATO NON PRESENTE";
    }

    let data = gg + "/" + mm + "/" + aaaa;
    if (data == "//") {
        data = "DATO NON PRESENTE";
    }

    if (desc == "") {
        desc = "DESCRIZIONE NON PRESENTE";
    }

    fetch('/app/modificaDatiCostruzione', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: nomeCostruzione,
            vecchiaPos: coordPrec,
            posizione: [x, y],
            utente: utente,
            data: data,
            descrizione: desc,
            privato: privatoPrec,
            server: NOME_SERVER
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    title: 'Esito operazione',
                    text: data.message,
                    icon: 'success',
                    confirmButtonText: 'Ok!'
                }).then((result) => {
                    if (result.isConfirmed) {
                        location.reload();
                    }
                });
            } else {
                Swal.fire({
                    title: 'Esito operazione',
                    text: data.message,
                    icon: 'error',
                    confirmButtonText: 'Ok!'
                })
            }
        });
}

document.addEventListener('input', function (e) {
    if (e.target.classList.contains('auto-grow')) {
        e.target.style.height = 'auto';
        e.target.style.height = (e.target.scrollHeight) + 'px';
    }
});