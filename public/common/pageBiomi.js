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

var utenteSessione;

fetch('/app/data/utente')
    .then(res => res.json())
    .then(data => {
        utenteSessione = data.message.username;
    });

/**
 * Funzione che si occupa di caricare in modo dinamico tutti i biomi salvati all'interno del sito
 */
function loadBiomi(NOME_SERVER) {
    var modelloBody = document.getElementById('modello-body');
    var modello = document.getElementById('modello');

    modelloBody.innerHTML = "";
    modelloBody.append(modello);

    fetch(`/app/dati/biomiSalvati?server=${encodeURIComponent(NOME_SERVER)}`)
        .then(ris => ris.json())
        .then(elencoBiomi => {
            for (var i = 0; i < elencoBiomi.length; i++) {
                var clone = modello.cloneNode(true);
                dataBiomes = elencoBiomi[i];
                if ((dataBiomes.privato === true && dataBiomes.utente === utenteSessione) || dataBiomes.privato === false) {
                    clone.getElementsByClassName('titolo')[0].innerHTML = dataBiomes.nome.toUpperCase();

                    let img = clone.getElementsByClassName('immagine')[0];
                    fetch(`/img/biomi/${dataBiomes.nome}.png`)
                        .then(res => res.blob())
                        .then(blob => {
                            img.src = URL.createObjectURL(blob);
                        });

                    clone.getElementsByClassName('coordinate')[0].innerHTML += "Coordinate: [" + dataBiomes.posizione + "]";

                    let fnd = clone.getElementsByClassName('scoperta')[0];
                    fnd.innerHTML += "Scoperto da: " + dataBiomes.utente;

                    let dt = clone.getElementsByClassName('data-scoperta')[0];
                    dt.innerHTML += "Data scoperta: " + dataBiomes.data;

                    let desc = clone.getElementsByClassName('descrizione')[0];
                    desc.innerHTML += dataBiomes.descrizione;

                    clone.classList.remove('d-none');
                    modello.before(clone);
                }

            }
            modello.remove();
            modelloBody.childNodes[0].classList.add('active');

        });
}

/**
 * Porzione di codice che si occupa di far crescere automaticamente il campo di scrittura del testo
 * della descrizione dei biomi
 */
document.addEventListener('input', function (e) {
    if (e.target.classList.contains('auto-grow')) {
        e.target.style.height = 'auto';
        e.target.style.height = (e.target.scrollHeight) + 'px';
    }
});

/**
 * Funzione che si occupa di captare la sezione da cui viene effettuata la richiesta per mostrare l'elenco dei biomi.
 * In particolare questa si occupa di gestire il caso della sezione di inserimento
 */
function inserimentoBioma() {
    var section = document.getElementsByClassName('inserimento')[0];
    stampaElencoBiomi(section);
}

function filtraBiomi() {
    var section = document.getElementsByClassName('filtro')[0];
    stampaElencoBiomi(section);
}

/**
 * Funzione che si occupa di captare la sezione da cui viene effettuata la richiesta per mostrare l'elenco dei biomi.
 * In particolare questa si occupa di gestire il caso della sezione di modifica
 */
function modificaBioma() {
    var section = document.getElementsByClassName('modifica')[0];
    stampaElencoBiomi(section);
}

/**
 * Funzione si occupa di stampare all'interno della selection tutto l'elenco (in ordine alfabetico) dei biomi presenti
 * attualmente in minecraft.
 * 
 * @param {} section parametro che identifica la sezione corrispondente in cui occorre stampare l'elenco
 */
function stampaElencoBiomi(section) {
    var modelloElenco = section.getElementsByClassName('modello-elenco')[0];
    let nomeUtente = section.getElementsByClassName('utente')[0];

    fetch('/app/dati/elencoBiomi')
        .then(ris => ris.json())
        .then(elencoBiomi => {
            const arrayBiomi = elencoBiomi.biomi;
            const nomiBiomi = Object.keys(arrayBiomi);

            for (var i = 0; i < nomiBiomi.length; i++) {
                // se il bioma è overworld, nether o end allora lo rendo non selezionabile
                if (nomiBiomi[i] == "overworld" || nomiBiomi[i] == "nether" || nomiBiomi[i] == "end") {
                    modelloElenco.insertAdjacentHTML("beforeend", `<option value="${i + 1}" disabled>biomi ${nomiBiomi[i]}</option>`);
                } else {
                    modelloElenco.insertAdjacentHTML("beforeend", `<option value="${i + 1}">${nomiBiomi[i]}</option>`);
                }
            }
        });
    nomeUtente.value = utenteSessione;
}

/**
 * Funzione che si occupa di rimuovere l'elenco dei biomi nella selection una volta che viene premuto il pulsante di chiusura
 * del offcanvas.
 * 
 * @param {*} nomeSection parametro che identifica la sezione corrispondente in cui occorre rimuovere l'elenco
 */
function rimuoviElencoBiomi(nomeSection) {
    var section = document.getElementsByClassName(nomeSection)[0];
    var modelloElenco = section.getElementsByClassName('modello-elenco')[0];
    modelloElenco.replaceChildren();
}

/**
 * Funzione che permette di inserire un bioma con i seguenti dati dopo aver premuto il pulsante invia.
 */
function inserisciBioma(NOME_SERVER) {

    const section = document.getElementsByClassName('inserimento')[0];

    const elementoSelezionato = section.getElementsByClassName('nome')[0];
    const selectedIndex = elementoSelezionato.selectedIndex;
    const nomeBioma = elementoSelezionato.options[selectedIndex].text;
    let nomeUtente = section.getElementsByClassName('utente')[0].value;
    const x = section.getElementsByClassName('x')[0].value;
    const y = section.getElementsByClassName('y')[0].value;
    const gg = section.getElementsByClassName('gg')[0].value;
    const mm = section.getElementsByClassName('mm')[0].value;
    const aaaa = section.getElementsByClassName('aaaa')[0].value;
    let desc = section.getElementsByClassName('desc')[0].value;
    let privato = section.getElementsByClassName('switch')[0].checked;

    let dimensioneBioma;
    if (selectedIndex > 0 && selectedIndex < 54) { dimensioneBioma = "overworld"; }
    else if (selectedIndex > 54 && selectedIndex < 60) { dimensioneBioma = "nether"; }
    else if (selectedIndex > 60 && selectedIndex < 66) { dimensioneBioma = "end"; }

    var data = gg + "/" + mm + "/" + aaaa;
    if (data == "//") {
        data = "DATO NON PRESENTE";
    }

    if (nomeUtente == "") {
        nomeUtente = "DATO NON PRESENTE";
    }

    if (desc == "") {
        desc = "DESCRIZIONE NON PRESENTE";
    }

    fetch('/app/inserisciBioma', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: nomeBioma,
            posizione: [x, y],
            utente: nomeUtente,
            data: data,
            descrizione: desc,
            dimensione: dimensioneBioma,
            privato: privato,
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

/**
 * Dati e funzione che permettono di modificare i dati del bioma selezionato a proprio piacere.
 */
var nomePrec;
var coordPrec;
let privatoPrec;

function modificaDatiBioma(NOME_SERVER) {
    modificaBioma();
    var modelloBody = document.getElementById('modello-body');
    var attivo = modelloBody.getElementsByClassName('active')[0];

    var nomeBioma = attivo.getElementsByClassName('titolo')[0].innerHTML.toLowerCase();
    var coordinate = attivo.getElementsByClassName('coordinate')[0].innerHTML;

    const section = document.getElementsByClassName('modifica')[0];

    var biomaSelettore = section.getElementsByClassName('modello-elenco')[0];
    var nomeUtente = section.getElementsByClassName('utente')[0];
    var x = section.getElementsByClassName('x')[0];
    var y = section.getElementsByClassName('y')[0];
    var gg = section.getElementsByClassName('gg')[0];
    var mm = section.getElementsByClassName('mm')[0];
    var aaaa = section.getElementsByClassName('aaaa')[0];
    let desc = section.getElementsByClassName('desc')[0];
    let privato = section.getElementsByClassName('switch')[0];

    fetch('/app/datiBioma', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: nomeBioma,
            posizione: coordinate,
            server: NOME_SERVER
        })
    })
        .then(res => res.json())
        .then(datiRicevuti => {

            nomePrec = datiRicevuti[0].nome;
            fetch('/app/dati/elencoBiomi')
                .then(ris => ris.json())
                .then(elencoBiomi => {
                    const arrayBiomi = elencoBiomi.biomi;
                    biomaSelettore.value = arrayBiomi[nomePrec] + 1;
                });

            x.value = datiRicevuti[0].posizione[0];
            y.value = datiRicevuti[0].posizione[1];
            coordPrec = [datiRicevuti[0].posizione[0], datiRicevuti[0].posizione[1]];

            let utente = datiRicevuti[0].utente;
            if (utente != "DATO NON PRESENTE") {
                nomeUtente.value = utente;
            } else {
                nomeUtente.value = "";
            }

            let data_scoperta = datiRicevuti[0].data;
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

/**
 * Funzione che invia i dati modificati dopo aver premuto il tasto salva
 */
function inviaDatiModificati(NOME_SERVER) {
    const section = document.getElementsByClassName('modifica')[0];
    const elementoSelezionato = section.getElementsByClassName('nome')[0];
    const selectedIndex = elementoSelezionato.selectedIndex;
    var nomeBioma = elementoSelezionato.options[selectedIndex].text;

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

    fetch('/app/modificaDatiBioma', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            vecchioNome: nomePrec,
            nome: nomeBioma,
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

function confermaRimuoviBioma(NOME_SERVER) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: 'Scegli cosa vuoi fare',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sì, cancella',
        cancelButtonText: 'No, annulla!',
    }).then((result) => {
        if (result.isConfirmed) {
            rimuoviBioma(NOME_SERVER);
        } else if (result.isDismissed) {
            console.log("Azione annullata!");
        }
    });
}

/**
 * Funzione che permette di rimuovere un bioma a seguito della pressione del tasto corrispondente.
 */
function rimuoviBioma(NOME_SERVER) {
    var corpoModello = document.getElementById('modello-body');
    var elementoDaRimuovere = corpoModello.getElementsByClassName('active');

    // raccogliendo dati dall'HTML
    var titolo = elementoDaRimuovere[0].getElementsByClassName('titolo')[0].innerHTML;
    var coord = elementoDaRimuovere[0].getElementsByClassName('coordinate')[0].innerHTML;
    var utente = elementoDaRimuovere[0].getElementsByClassName('scoperta')[0].innerHTML;
    var data = elementoDaRimuovere[0].getElementsByClassName('data-scoperta')[0].innerHTML;

    var next = document.getElementsByClassName('carousel-control-next')[0];
    next.click();

    fetch('/app/cancellaBioma', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: titolo,
            posizione: coord,
            utente: utente,
            data: data,
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
                });
            }
        });

    elementoDaRimuovere[0].remove();
}