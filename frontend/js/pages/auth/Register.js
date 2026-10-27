document.getElementById('RegisterPage').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('Nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const gender = document.getElementById('genero').value;
    const birthdate = document.getElementById('birthdate').value;

    if (password.length < 8) {
        mostrarErro('A password deve ter pelo menos 8 caracteres');
        return;
    }

    try {
        const data = await NB.apiPost('/api/auth/register.php', { name, email, password, gender, birthdate });

        if (data.status === 'success') {
            localStorage.setItem('welcome', JSON.stringify({
                name: name,
                message: data.message,
                xp: data.xp
            }));
            window.location.href = '../pages/index.html';
        } else {
            mostrarErro(data.message || 'Erro ao registar');
        }
    } catch (err) {
        mostrarErro('Erro de ligação ao servidor');
    }
});

function mostrarErro(msg) {
    document.getElementById('register-erro').textContent = msg;
}
