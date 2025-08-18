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

function loadStrutture(NOME_SERVER) {
    var modelloBody = document.getElementById('modello-body');
    var modello = document.getElementById('modello');

    modelloBody.innerHTML = "";
    modelloBody.append(modello);

    fetch(`/app/dati/struttureSalvate?server=${encodeURIComponent(NOME_SERVER)}`)
        .then(ris => ris.json())
        .then(data => {
            for (var i = 0; i < data.length; i++) {
                var clone = modello.cloneNode(true);
                dataStrutture = data[i];

                if ((dataStrutture.privato === true && dataStrutture.utente === utenteSessione) || dataStrutture.privato === false) {
                    clone.getElementsByClassName('titolo')[0].innerHTML = dataStrutture.nome.toUpperCase();

                    let img = clone.getElementsByClassName('immagine')[0];
                    fetch(`/img/strutture/${dataStrutture.nome}.png`)
                        .then(res => res.blob())
                        .then(blob => {
                            img.src = URL.createObjectURL(blob);
                        });

                    clone.getElementsByClassName('coordinate')[0].innerHTML += "Coordinate: [" + dataStrutture.posizione + "]";

                    let fnd = clone.getElementsByClassName('scoperta')[0];
                    fnd.innerHTML += "Scoperto da: " + dataStrutture.utente;

                    let dt = clone.getElementsByClassName('data-scoperta')[0];
                    dt.innerHTML += "Data scoperta: " + dataStrutture.data;

                    let desc = clone.getElementsByClassName('descrizione')[0];
                    desc.innerHTML += dataStrutture.descrizione;

                    clone.classList.remove('d-none');
                    modello.before(clone);
                }
            }
            modello.remove();
            modelloBody.childNodes[0].classList.add('active');

        });
}

function inserimentoStruttura() {
    var section = document.getElementsByClassName('inserimento')[0];
    stampaElencoStrutture(section);
}

function modificaStruttura() {
    var section = document.getElementsByClassName('modifica')[0];
    stampaElencoStrutture(section);
}

function inserisciStruttura(NOME_SERVER) {

    const section = document.getElementsByClassName('inserimento')[0];

    const elementoSelezionato = section.getElementsByClassName('nome')[0];
    const selectedIndex = elementoSelezionato.selectedIndex;
    const nomeStruttura = elementoSelezionato.options[selectedIndex].text;

    let nomeUtente = section.getElementsByClassName('utente')[0].value;
    const x = section.getElementsByClassName('x')[0].value;
    const y = section.getElementsByClassName('y')[0].value;
    const gg = section.getElementsByClassName('gg')[0].value;
    const mm = section.getElementsByClassName('mm')[0].value;
    const aaaa = section.getElementsByClassName('aaaa')[0].value;
    let desc = section.getElementsByClassName('desc')[0].value;
    let privato = section.getElementsByClassName('switch')[0].checked;

    let dimensioneStruttura = "";
    if (selectedIndex > 0 && selectedIndex < 27) { dimensioneStruttura = "overworld"; }
    else if (selectedIndex > 27 && selectedIndex < 33) { dimensioneStruttura = "nether"; }
    else if (selectedIndex > 33 && selectedIndex < 36) { dimensioneStruttura = "end"; }

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

    fetch('/app/inserisciStruttura', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: nomeStruttura,
            posizione: [x, y],
            utente: nomeUtente,
            data: data,
            descrizione: desc,
            dimensione: dimensioneStruttura,
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

function confermaRimuoviStrutture(NOME_SERVER) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: 'Scegli cosa vuoi fare',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sì, cancella',
        cancelButtonText: 'No, annulla!',
    }).then((result) => {
        if (result.isConfirmed) {
            rimuoviStruttura(NOME_SERVER);
        } else if (result.isDismissed) {
            console.log("Azione annullata!");
        }
    });
}

function rimuoviStruttura(NOME_SERVER) {

    var corpoModello = document.getElementById('modello-body');
    var elementoDaRimuovere = corpoModello.getElementsByClassName('active');

    // raccogliendo dati dall'HTML
    var titolo = elementoDaRimuovere[0].getElementsByClassName('titolo')[0].innerHTML;
    var coord = elementoDaRimuovere[0].getElementsByClassName('coordinate')[0].innerHTML;
    var utente = elementoDaRimuovere[0].getElementsByClassName('scoperta')[0].innerHTML;
    var data = elementoDaRimuovere[0].getElementsByClassName('data-scoperta')[0].innerHTML;

    var next = document.getElementsByClassName('carousel-control-next')[0];
    next.click();

    fetch('/app/rimuoviStruttura', {
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

var nomePrec;
var coordPrec;
let privatoPrec;

function modificaDatiStruttura(NOME_SERVER) {
    modificaStruttura();
    var modelloBody = document.getElementById('modello-body');
    var attivo = modelloBody.getElementsByClassName('active')[0];

    var nomeStruttura = attivo.getElementsByClassName('titolo')[0].innerHTML.toLowerCase();
    var coordinate = attivo.getElementsByClassName('coordinate')[0].innerHTML;

    const section = document.getElementsByClassName('modifica')[0];

    var strutturaSelettore = section.getElementsByClassName('modello-elenco')[0];
    var nomeUtente = section.getElementsByClassName('utente')[0];
    var x = section.getElementsByClassName('x')[0];
    var y = section.getElementsByClassName('y')[0];
    var gg = section.getElementsByClassName('gg')[0];
    var mm = section.getElementsByClassName('mm')[0];
    var aaaa = section.getElementsByClassName('aaaa')[0];
    var desc = section.getElementsByClassName('desc')[0];
    let privato = section.getElementsByClassName('switch')[0];

    fetch('/app/datiStruttura', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: nomeStruttura,
            posizione: coordinate,
            server: NOME_SERVER
        })
    })
        .then(res => res.json())
        .then(datiRicevuti => {


            nomePrec = datiRicevuti[0].nome;
            fetch('/app/dati/elencoStrutture')
                .then(ris => ris.json())
                .then(elencoStrutture => {
                    const arrayStrutture = elencoStrutture.strutture;
                    strutturaSelettore.value = arrayStrutture[nomePrec] + 1;
                })

            let utente = datiRicevuti[0].utente;
            if (utente != "DATO NON PRESENTE") {
                nomeUtente.value = utente;
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

/**
 * Funzione che invia i dati modificati dopo aver premuto il tasto salva
 */
function inviaDatiModificati(NOME_SERVER) {
    const section = document.getElementsByClassName('modifica')[0];
    const elementoSelezionato = section.getElementsByClassName('nome')[0];
    const selectedIndex = elementoSelezionato.selectedIndex;
    var nomeStruttura = elementoSelezionato.options[selectedIndex].text;

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

    fetch('/app/modificaDatiStruttura', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            vecchioNome: nomePrec,
            nome: nomeStruttura,
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


function stampaElencoStrutture(section) {
    let modelloElenco = section.getElementsByClassName('modello-elenco')[0];
    let nomeUtente = section.getElementsByClassName('utente')[0];
    fetch('/app/dati/elencoStrutture')
        .then(res => res.json())
        .then(data => {
            let elencoStrutture = data.strutture;
            const nomiStrutture = Object.keys(elencoStrutture);

            for (let i = 0; i < nomiStrutture.length; i++) {
                if (nomiStrutture[i] == "overworld" || nomiStrutture[i] == "nether" || nomiStrutture[i] == "end") {
                    modelloElenco.insertAdjacentHTML("beforeend", `<option value="${i + 1}" disabled>strutture ${nomiStrutture[i]}</option>`);
                } else {
                    modelloElenco.insertAdjacentHTML("beforeend", `<option value="${i + 1}">${nomiStrutture[i]}</option>`);
                }
            }
        });

    nomeUtente.value = utenteSessione;
}

function rimuoviElencoStrutture(nomeSection) {
    var section = document.getElementsByClassName(nomeSection)[0];
    var modelloElenco = section.getElementsByClassName('modello-elenco')[0];
    modelloElenco.replaceChildren();
}

document.addEventListener('input', function (e) {
    if (e.target.classList.contains('auto-grow')) {
        e.target.style.height = 'auto';
        e.target.style.height = (e.target.scrollHeight) + 'px';
    }
});
