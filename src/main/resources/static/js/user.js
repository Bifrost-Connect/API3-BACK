window.cadastrarUsuario = async function() {
    const nameInput = document.getElementById("cadNome")?.value;
    const emailInput = document.getElementById("cadEmail")?.value;
    const registrationInput = document.getElementById("cadMatricula")?.value;
    const passwordInput = document.getElementById("cadSenha")?.value;

    if (!nameInput || !emailInput || !registrationInput || !passwordInput) {
        alert("Preencha todos os campos!");
        return;
    }

    const payload = {
        registration: registrationInput,
        name: nameInput,
        email: emailInput,
        password: passwordInput,
        permission: "technician"
    };

    try {
        const response = await apiFetch("/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response && response.ok) {
            if (typeof abrirModalConfirmacao === "function") {
                abrirModalConfirmacao();
            }

            // Limpa os campos após sucesso
            ["cadNome", "cadEmail", "cadMatricula", "cadSenha"].forEach(id => {
                const field = document.getElementById(id);
                if (field) field.value = "";
            });

        } else if (response) {
            const errorMsg = await response.text();
            alert("Erro ao cadastrar: " + errorMsg);
        }

    } catch (error) {
        console.error("Connection error:", error);
        alert("Erro de conexão com o servidor.");
    }
};
