// CADASTRAR USUÁRIO
window.cadastrarUsuario = async function() {
    const nameInput = document.getElementById("cadNome")?.value;
    const emailInput = document.getElementById("cadEmail")?.value;
    const registrationInput = document.getElementById("cadMatricula")?.value;
    const passwordInput = document.getElementById("cadSenha")?.value;

    if (!nameInput || !emailInput || !registrationInput || !passwordInput) {
        mostrarToast("Preencha todos os campos!");
        return;
    }

    // Payload compatível com RegisterDTO / backend Spring Boot
    const payload = {
        registration: registrationInput,
        name: nameInput,
        email: emailInput,
        password: passwordInput,
        permission: "technician"
    };

    try {
        const response = await fetch("http://localhost:8080/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            if (typeof abrirModalConfirmacao === "function") {
                abrirModalConfirmacao();
            }

            // Limpa os campos após sucesso
            ["cadNome", "cadEmail", "cadMatricula", "cadSenha"].forEach(id => {
                const field = document.getElementById(id);
                if (field) field.value = "";
            });

        } else {
            const errorMsg = await response.text();
            mostrarToast("Erro ao cadastrar: " + errorMsg);
        }

    } catch (error) {
        console.error("Connection error:", error);
        mostrarToast("Erro de conexão com o servidor.");
    }
};

// salvar info

const popupConfirmacao = document.getElementById('popupConfirmacao');
const popupSucesso = document.getElementById('popupSucesso');
const btncadastrar = document.getElementById('btncadastrar');
const btnCancelar = document.getElementById('btn-cancelar-confirmacao');
const btnConfirmarFinal = document.getElementById('btn-confirmar-final');
const btnFecharSucesso = document.getElementById('btn-fechar-sucesso');

btncadastrar.addEventListener('click', () => {
    popupConfirmacao.style.display = 'flex';
});

btnCancelar.addEventListener('click', () => {
    popupConfirmacao.style.display = 'none';
    return
});

btnConfirmarFinal.onclick = (e) => {
    e.preventDefault(); // Bloqueia o refresh da página (essencial)
    
    popupConfirmacao.style.display = 'none';
    popupSucesso.style.display = 'flex';
};

// 4. Fechar o popup de sucesso final
btnFecharSucesso.addEventListener('click', () => {
    popupSucesso.style.display = 'none';
});


function mostrarToast(mensagem) {
    const toast = document.getElementById("toast-aviso");
    if (toast) {
        toast.innerText = mensagem;
        toast.style.display = "block";
        toast.classList.remove("toast-hidden");

        // Esconde após 3 segundos
        setTimeout(() => {
            toast.classList.add("toast-hidden");
            setTimeout(() => { toast.style.display = "none"; }, 500);
        }, 3000);
    }

    window.carregarDadosUsuario = async function() {
        // 1. Resgata as credenciais salvas no login
        const registration = localStorage.getItem("userRegistration");
        const token = localStorage.getItem("userToken");

        if (!registration) {
            console.warn("Matrícula não encontrada no localStorage. O usuário precisa fazer login.");
            return; 
        }

        try {

            const response = await fetch(`http://localhost:8080/user/${registration}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`, // Passando o token por segurança
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const user = await response.json();


                const inputEmail = document.getElementById("perfilEmail");
                const inputTelefone = document.getElementById("perfilTelefone");
                const selectCNH = document.getElementById("perfilCNH");
                const textNome = document.getElementById("perfilNome");
                const previewFoto = document.getElementById("previewFoto");
                const avatarPlaceholder = document.getElementById("avatarPlaceholder");


                if (inputEmail) inputEmail.value = user.email || "";
                if (inputTelefone) inputTelefone.value = user.phone || "";
                if (selectCNH) selectCNH.value = user.driverLicenseCategory || "";


                if (textNome) textNome.innerText = user.name || "Usuário";

                if (user.photo && previewFoto) {

                    previewFoto.src = user.photo.startsWith("data:image") ? user.photo : `data:image/jpeg;base64,${user.photo}`;
                    previewFoto.style.display = "block";
                    if (avatarPlaceholder) avatarPlaceholder.style.display = "none";
                }

            } else {
                console.error("Erro ao buscar perfil:", await response.text());
                mostrarToast("Erro ao carregar dados do perfil.");
            }
        } catch (error) {
            console.error("Erro de conexão ao buscar perfil:", error);
        }
    };


    document.addEventListener("DOMContentLoaded", () => {
        if (document.body.classList.contains("pagina-configuracoes")) {
            carregarDadosUsuario();
        }
    });

    window.atualizarPreviewFoto = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById("previewFoto");
                const placeholder = document.getElementById("avatarPlaceholder");

                if (preview) {
                    preview.src = e.target.result;
                    preview.style.display = "block";
                }
                if (placeholder) {
                    placeholder.style.display = "none";
                }
            }
            reader.readAsDataURL(file);
        }
    };


    window.salvarConfiguracoesPerfil = async function() {
        const registration = localStorage.getItem("userRegistration");
        const token = localStorage.getItem("userToken");

        if (!registration) {
            mostrarToast("Sessão expirada. Faça login novamente.");
            return;
        }


        const emailInput = document.getElementById("perfilEmail")?.value;
        const senhaInput = document.getElementById("perfilSenha")?.value;
        const telefoneInput = document.getElementById("perfilTelefone")?.value;
        const cnhInput = document.getElementById("perfilCNH")?.value;


        const payloadTexto = {};
        if (emailInput) payloadTexto.email = emailInput;
        if (senhaInput) payloadTexto.password = senhaInput; // A API deve lidar com o hash da senha se necessário
        if (telefoneInput) payloadTexto.phone = telefoneInput;
        if (cnhInput) payloadTexto.driverLicenseCategory = cnhInput;

        try {

            if (Object.keys(payloadTexto).length > 0) {
                const resTexto = await fetch(`http://localhost:8080/user/update/${registration}`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payloadTexto)
                });

                if (!resTexto.ok) {
                    mostrarToast("Erro ao atualizar os dados do perfil.");
                    return;
                }
            }


            const fotoInput = document.getElementById("perfilFoto");
            if (fotoInput && fotoInput.files.length > 0) {
                const fotoFile = fotoInput.files[0];
                const formData = new FormData();
                formData.append("foto", fotoFile); // O nome "foto" deve bater com o @RequestParam("foto") no Spring

                const resFoto = await fetch(`http://localhost:8080/user/upload-photo/${registration}`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`

                    },
                    body: formData
                });

                if (!resFoto.ok) {
                    mostrarToast("Dados salvos, mas erro ao enviar a imagem.");
                    return;
                }
            }


            mostrarToast("Configurações salvas com sucesso!");

            const inputSenha = document.getElementById("perfilSenha");
            if (inputSenha) inputSenha.value = "";

            setTimeout(() => carregarDadosUsuario(), 1500);

        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            mostrarToast("Erro de conexão com o servidor.");
        }
    };

}