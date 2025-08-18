function home() {
    window.location.href = '/';
}

function ME() {
    fetch(`/minecraft_empire`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            if (data.success) {
                window.location.href = data.redirectTo;
            } else {
                alert("Redirect fallito!");
            }
        });
}

function factions() {
    fetch(`/factions`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            if (data.success) {
                window.location.href = data.redirectTo;
            } else {
                alert("Redirect fallito!");
            }
        });
}

function zoomCard() {
    var active = document.getElementsByClassName('active')[0];

    var card = active.getElementsByClassName('card')[0];
    card.classList.remove("card-beforeClick");
    card.classList.add("card-afterClick");

    var desc = active.getElementsByClassName('descrizione')[0];
    if (desc.classList.contains('d-none')) {
        desc.classList.remove('d-none');
    } else {
        desc.classList.add('d-none');
        card.classList.remove("card-afterClick");
        card.classList.add("card-beforeClick");
    }
}