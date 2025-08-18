accedi.addEventListener('click', () => {

    const username = document.getElementsByClassName('username')[0].value;
    const password = document.getElementsByClassName('password')[0].value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            username: username,
            password: password,
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirectTo;
            } else {
                Swal.fire({
                    title: 'Esito operazione',
                    text: data.error,
                    icon: 'warning',
                    confirmButtonText: 'Ok!'
                  });
            }
        })
});