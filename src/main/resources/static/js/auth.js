/**
 * ===================================================================
 * ARQUIVO: auth.js
 * REFERÊNCIA GLOBAL: Requer 'basic.js' (Utiliza apiFetch, mostrarToast e CONFIG)
 * RESPONSABILIDADE: Gerenciar as operações de autenticação do usuário,
 * capturar credenciais e tratar as interações de interface da tela de login.
 * ===================================================================
 */

/**
 * Função: btnindex
 * O que faz: Captura os dados da tela de login, sanitiza as entradas e realiza
 * a requisição POST para a API. Em caso de sucesso, armazena o token e o perfil
 * e delega o roteamento para o basic.js. Em caso de falha, exibe o toast de erro.
 * Requisição: POST /user/login
 */
window.btnindex = async function () {
    const regField = document.getElementById("matricula");
    const passField = document.getElementById("senha");

    // Validação inicial e sanitização (trim) para evitar espaços acidentais
    if (!regField?.value.trim() || !passField?.value) {
        window.mostrarToast("Por favor, preencha todos os campos.");
        return;
    }

    const loginData = {
        registration: String(regField.value.trim()),
        password: passField.value
    };

    try {
        // Utiliza o wrapper centralizado do basic.js para as chamadas à API
        const response = await window.apiFetch("/user/login", {
            method: "POST",
            body: JSON.stringify(loginData)
        });

        // Caso a API retorne sucesso (status 200-299)
        if (response && response.ok) {
            const data = await response.json();

            // Salva o Token JWT usando a constante global
            if (data.token) {
                localStorage.setItem(CONFIG.TOKEN_KEY, data.token);
            }

            // Decodifica o payload do token (ou usa o body da requisição como fallback)
            const payload = data.token ? CONFIG.decodeToken(data.token) : null;
            const permission = String(payload?.permission || data.permission || "TECHNICIAN")
                .toUpperCase()
                .replace("ROLE_", ""); // Padroniza a string de permissão

            const name = payload?.name || data.name || "Usuário";

            // Persiste os dados básicos do usuário no LocalStorage
            localStorage.setItem("userName", name);
            localStorage.setItem("userPermission", permission);
            localStorage.setItem("userRegistration", loginData.registration);

            // Redirecionamento centralizado com base na Role do usuário (via basic.js)
            CONFIG.redirectByPermission();

        } else if (response) {
            // Tratamento de falha de autenticação (ex: senha incorreta ou usuário não encontrado)
            const errorData = await response.json().catch(() => ({}));
            const mensagem = errorData.error || errorData.message || "Matrícula ou senha incorretos.";
            window.mostrarToast(mensagem);
        }
    } catch (error) {
        // Captura quedas de rede ou erros não previstos na comunicação
        console.error("Erro crítico na tentativa de login:", error);
        window.mostrarToast("Erro ao conectar com o servidor.");
    }
};

/**
 * Função: togglePassword
 * O que faz: Alterna dinamicamente o atributo 'type' do input de senha
 * entre 'password' (oculto com asteriscos) e 'text' (visível),
 * e controla a exibição da linha sobre o ícone do olho na UI.
 */
window.togglePassword = function () {
    const passwordField = document.getElementById("senha");
    const eyeLine = document.getElementById("eyeLine"); // Elemento visual de bloqueio/visibilidade

    if (passwordField) {
        // Verifica o estado atual e inverte
        const isPasswordHidden = passwordField.type === "password";
        passwordField.type = isPasswordHidden ? "text" : "password";

        // Exibe ou oculta o "risco" no ícone do olho
        if (eyeLine) {
            eyeLine.style.display = isPasswordHidden ? "block" : "none";
        }
    }
};

/**
 * ===================================================================
 * OPERAÇÕES DO MODAL DE RECUPERAÇÃO DE SENHA
 * ===================================================================
 */

/**
 * Função: abrirModalRecuperacao
 * O que faz: Torna o modal visível na tela e aplica o foco no campo de e-mail.
 */
window.abrirModalRecuperacao = function () {
    const modal = document.getElementById("modalRecuperarSenha");
    if (modal) {
        modal.style.display = "flex";

        // Foca automaticamente no campo de e-mail ao abrir o modal
        setTimeout(() => {
            document.getElementById("email-recuperacao")?.focus();
        }, 100);
    }
};

/**
 * Função: fecharModalRecuperacao
 * O que faz: Oculta o modal de recuperação de senha da interface.
 */
window.fecharModalRecuperacao = function () {
    const modal = document.getElementById("modalRecuperarSenha");
    if (modal) {
        modal.style.display = "none";
    }
};

/**
 * Função: enviarRecuperacaoSenha
 * O que faz: Valida a formatação estrutural do e-mail digitado e submete
 * a ação de recuperação, disparando o feedback visual do sistema (Toast).
 */
window.enviarRecuperacaoSenha = function () {
    const emailField = document.getElementById("email-recuperacao");
    if (!emailField) return;

    const email = emailField.value.trim();

    // Validação de campo vazio
    if (email === "") {
        window.mostrarToast("Digite um e-mail.");
        return;
    }

    // Validação através de Expressão Regular (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        window.mostrarToast("Insira um e-mail válido");
        return;
    }

    // Se validado, limpa o campo e fecha o Modal
    window.fecharModalRecuperacao();
    emailField.value = "";

    // Exibe a mensagem de sucesso consumindo a estrutura padrão do basic.js
    window.mostrarToast("E-mail enviado com sucesso!", "toast-aviso1");

    // NOTA: Caso queira integrar com a API futuramente, implemente a chamada apiFetch aqui.
};

/**
 * Bloco de Inicialização: Event Listeners
 * O que faz: Aguarda o carregamento completo da página e adiciona eventos
 * de conveniência para o usuário (Teclas de atalho e clique fora).
 */
document.addEventListener('DOMContentLoaded', () => {
    // Atalho Enter no campo de Senha para efetuar Login
    const passField = document.getElementById("senha");
    if (passField) {
        passField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.btnindex();
            }
        });
    }

    // Atalho Enter no campo de recuperação para enviar e-mail
    const emailRecuperacaoField = document.getElementById("email-recuperacao");
    if (emailRecuperacaoField) {
        emailRecuperacaoField.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                window.enviarRecuperacaoSenha();
            }
        });
    }

    // Evento para fechar o modal clicando na área escura (Overlay)
    const modalRecuperarSenha = document.getElementById("modalRecuperarSenha");
    if (modalRecuperarSenha) {
        modalRecuperarSenha.addEventListener("click", (event) => {
            if (event.target.id === "modalRecuperarSenha") {
                window.fecharModalRecuperacao();
            }
        });
    }
});