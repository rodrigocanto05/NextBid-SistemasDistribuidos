document.getElementById('LoginPage').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
        const data = await NB.apiPost('/api/auth/login.php', { email, password });

        if (data.status === 'success') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '../pages/index.html';
        } else {
            mostrarErro(data.message || 'Credenciais inválidas');
        }
    } catch (err) {
        mostrarErro('Erro de ligação ao servidor');
    }
});

function mostrarErro(msg) {
    document.getElementById('login-erro').textContent = msg;
}
