window.btnindex = async function () {
    const registrationInput = document.getElementById("matricula")?.value;
    const passwordInput = document.getElementById("senha")?.value;

    if (!registrationInput || !passwordInput) {
        mostrarToast("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const apiUrl = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : "http://localhost:8080";

        const response = await apiFetch("/user/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                registration: String(registrationInput),
                password: passwordInput
            })
        });

        if (response && response.ok) {
            const data = await response.json();
            const token = data.token;

            if (token) {
                localStorage.setItem(typeof CONFIG !== 'undefined' ? CONFIG.TOKEN_KEY : "auth_token", token);
            }

            let payload = null;
            if (typeof CONFIG !== 'undefined' && CONFIG.decodeToken && token) {
                payload = CONFIG.decodeToken(token);
            }

            const rawPermission = payload?.permission || data.permission || "TECHNICIAN";
            const permission = String(rawPermission).toUpperCase().replace("ROLE_", "");
            const name = payload?.name || data.name || "Usuário";

            localStorage.setItem("userName", name);
            localStorage.setItem("userPermission", permission);
            localStorage.setItem("userRegistration", String(registrationInput));

            if (permission === "ADMINISTRATOR") {
                window.location.href = "telainicial-gestor.html";
            } else if (permission === "TECHNICIAN") {
                window.location.href = "telainicial.html";
            } else {
                window.location.href = "telainicial.html";
            }
        } else {
            mostrarToast("Matrícula ou senha incorretos.");
        }
    } catch (error) {
        console.error("Login error:", error);
        mostrarToast("Erro ao conectar com o servidor.");
    }
};

window.togglePassword = function () {
    const passwordField = document.getElementById("senha");
    const eyeLine = document.getElementById("eyeLine");
    if (passwordField.type === "password") {
        passwordField.type = "text";
        if (eyeLine) eyeLine.style.display = "block";
    } else {
        passwordField.type = "password";
        if (eyeLine) eyeLine.style.display = "none";
    }
};

window.btnlogout = () => {
    if (typeof CONFIG !== 'undefined' && typeof CONFIG.handleLogout === 'function') {
        CONFIG.handleLogout(false);
    } else {
        localStorage.clear();
        window.location.href = "index.html";
    }
};

function mostrarToast(mensagem) {
    const toast = document.getElementById("toast-aviso");
    if (toast) {
        toast.innerText = mensagem;
        toast.style.display = "block";
        toast.classList.remove("toast-hidden");

        setTimeout(() => {
            toast.classList.add("toast-hidden");
            setTimeout(() => { toast.style.display = "none"; }, 500);
        }, 3000);
    } else {
        alert(mensagem);
    }
}

function mostrarToast1(mensagem) {
    const toast = document.getElementById("toast-aviso1");
    if (toast) {
        toast.innerText = mensagem;
        toast.style.display = "block";
        toast.classList.remove("toast-hidden1");

        setTimeout(() => {
            toast.classList.add("toast-hidden1");
            setTimeout(() => { toast.style.display = "none"; }, 500);
        }, 3000);
    } else {
        alert(mensagem);
    }
}