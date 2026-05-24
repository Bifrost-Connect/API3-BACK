/**
 * ===================================================================
 * ARQUIVO: user.js (ou cadusuarios.js)
 * REFERÊNCIA GLOBAL: Requer 'basic.js' (Utiliza apiFetch e mostrarToast)
 * RESPONSABILIDADE: Gerenciar o fluxo de interface e a integração
 * com a API para o cadastro de novos usuários (Técnicos).
 * ===================================================================
 */

// ===================================================================
// 1. INTEGRAÇÃO COM A API: CADASTRAR USUÁRIO
// ===================================================================

/**
 * Função: cadastrarUsuario
 * O que faz: Lê os campos do formulário, valida se estão preenchidos,
 * monta o payload (DTO) e envia para o backend. Em caso de sucesso,
 * avança para a tela de sucesso final e limpa o formulário.
 * Requisição: POST /user/register
 */
window.cadastrarUsuario = async function () {
    const nameInput = document.getElementById("cadNome")?.value;
    const emailInput = document.getElementById("cadEmail")?.value;
    const registrationInput = document.getElementById("cadMatricula")?.value;
    const passwordInput = document.getElementById("cadSenha")?.value;

    if (!nameInput || !emailInput || !registrationInput || !passwordInput) {
        window.mostrarToast("Preencha todos os campos obrigatórios!");
        return;
    }

    // Monta o objeto correspondente ao RegisterDTO do backend
    const payload = {
        registration: registrationInput.trim(),
        name: nameInput.trim(),
        email: emailInput.trim(),
        password: passwordInput,
        permission: "TECHNICIAN" // Enviado em uppercase para bater com o Enum do Java
    };

    try {
        // Dispara a requisição utilizando o wrapper global que injeta o Token
        const response = await window.apiFetch("/user/register", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (response && response.ok) {
            // Sucesso: Esconde a confirmação e exibe o modal de sucesso final
            const popupConf = document.getElementById('popupConfirmacao');
            const popupSuc = document.getElementById('popupSucesso');

            if (popupConf) popupConf.style.display = 'none';

            if (popupSuc) {
                popupSuc.style.display = 'flex';
            } else {
                // Fallback caso a nova interface não tenha o popup na tela
                window.mostrarToast("Usuário cadastrado com sucesso!", "toast-aviso1");
            }

            limparFormularioUsuario();

        } else if (response) {
            // Falha tratada: Extrai a mensagem de erro formatada do Spring Boot
            const erro = await response.json().catch(() => ({}));
            const mensagemErro = erro.error || erro.message || "Verifique os dados informados.";
            window.mostrarToast("Erro ao cadastrar: " + mensagemErro);
        }
    } catch (error) {
        console.error("Erro na requisição de cadastro:", error);
        window.mostrarToast("Falha de conexão com o servidor.");
    }
};


// ===================================================================
// 2. FUNÇÕES AUXILIARES DE UI
// ===================================================================

/**
 * Função: limparFormularioUsuario
 * O que faz: Zera todos os inputs do cadastro após uma operação bem-sucedida.
 */
function limparFormularioUsuario() {
    ["cadNome", "cadEmail", "cadMatricula", "cadSenha"].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = "";
    });
}


// ===================================================================
// 3. INICIALIZAÇÃO DE EVENTOS DOM (Modais e Botões)
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Mapeamento dos elementos da interface
    const popupConfirmacao = document.getElementById('popupConfirmacao');
    const popupSucesso = document.getElementById('popupSucesso');

    const btnCadastrar = document.getElementById('btncadastrar');
    const btnCancelarConf = document.getElementById('btn-cancelar-confirmacao');
    const btnConfirmarFinal = document.getElementById('btn-confirmar-final');
    const btnFecharSucesso = document.getElementById('btn-fechar-sucesso');

    // PASSO 1: O usuário preenche e clica no primeiro botão "Cadastrar"
    // Ação: Abre a tela de confirmação (sem enviar para a API ainda)
    if (btnCadastrar && popupConfirmacao) {
        btnCadastrar.addEventListener('click', () => {
            popupConfirmacao.style.display = 'flex';
        });
    }

    // Ação secundária: O usuário desiste na tela de confirmação
    if (btnCancelarConf && popupConfirmacao) {
        btnCancelarConf.addEventListener('click', () => {
            popupConfirmacao.style.display = 'none';
        });
    }

    // PASSO 2: O usuário confirma os dados no modal final
    // Ação: Dispara a requisição de cadastro real para o backend (service.js)
    if (btnConfirmarFinal) {
        btnConfirmarFinal.addEventListener('click', (e) => {
            e.preventDefault(); // Impede comportamento padrão de submit do form
            window.cadastrarUsuario();
        });
    }

    // PASSO 3: O usuário clica em "OK" na tela de sucesso final
    // Ação: Fecha o modal verde de sucesso
    if (btnFecharSucesso && popupSucesso) {
        btnFecharSucesso.addEventListener('click', () => {
            popupSucesso.style.display = 'none';
        });
    }
});