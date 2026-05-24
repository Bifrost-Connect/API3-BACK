/**
 * ===================================================================
 * ARQUIVO: basic.js
 * RESPONSABILIDADE: Núcleo do Sistema (SIVA).
 * Fornece a fundação global para Autenticação, Comunicação Segura com
 * a API (Interceptors), injeção de Layouts estáticos e Feedbacks de UI.
 * ===================================================================
 */

// ===================================================================
// 1. CONFIGURAÇÕES, SEGURANÇA E SESSÃO
// ===================================================================

const CONFIG = Object.freeze({
    // Configurações de Ambiente
    // Padrão de produção: window.location.origin (Front e Back rodam no mesmo domínio/servidor)
    // Teste local: Caso o frontend rode separado (ex: Live Server), altere temporariamente para "http://localhost:8080"
    API_URL: window.location.origin,

    TOKEN_KEY: "auth_token",

    // MODO DESENVOLVEDOR: Se true, ignora redirecionamentos automáticos de segurança para a tela de login.
    DEV_MODE: false,

    /**
     * Valida a sessão atual do usuário e protege as rotas no client-side.
     * Executada automaticamente ao carregar o script.
     */
    checkAuth: function () {
        if (this.DEV_MODE) {
            console.warn("⚠️ [DEV MODE] Redirecionamentos de segurança desativados.");
            return localStorage.getItem(this.TOKEN_KEY);
        }

        const token = localStorage.getItem(this.TOKEN_KEY);
        const path = window.location.pathname;
        const isLoginPage = path.endsWith("index.html") || path === "/" || path === "";

        // Se não tem token ou expirou, limpa tudo e joga pro login
        if (!token || this.isTokenExpired(token)) {
            this.handleLogout(isLoginPage);
            return null;
        }

        // Se estiver logado e tentar acessar a tela de login, redireciona pro dashboard correto
        if (isLoginPage) {
            this.redirectByPermission();
        }

        return token;
    },

    /**
     * Verifica a validade temporal do JWT (Aplica margem de segurança de 10 segundos).
     */
    isTokenExpired: function (token) {
        try {
            const payload = this.decodeToken(token);
            if (!payload || !payload.exp) return true;

            const expirationTime = (payload.exp * 1000) - 10000;
            return Date.now() >= expirationTime;
        } catch (e) {
            return true; // Na dúvida, expira a sessão por segurança
        }
    },

    /**
     * Decodifica o payload do JWT tratando caracteres especiais (UTF-8).
     */
    decodeToken: function (token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            // Corrige caracteres base64url e decodifica para string padrão
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
            );

            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Erro ao decodificar token JWT:", e);
            return null;
        }
    },

    /**
     * Lógica centralizada de roteamento baseada na Role do usuário.
     */
    redirectByPermission: function () {
        const rawPermission = localStorage.getItem("userPermission") || "";
        const permission = rawPermission.trim().toUpperCase().replace("ROLE_", "");
        const destination = (permission === "ADMINISTRATOR") ? "telainicial-gestor.html" : "telainicial.html";

        window.location.replace(destination); // Usamos replace para não gerar histórico de voltar ao login
    },

    /**
     * Finaliza a sessão limpando os dados locais de forma segura.
     */
    handleLogout: function (isLoginPage = false) {
        localStorage.clear();
        if (!isLoginPage && !this.DEV_MODE) {
            window.location.href = "index.html";
        }
    },

    /**
     * Injeta o CSS necessário para os componentes globais (Toast e Container de Erros) dinamicamente.
     */
    injectGlobalStyles: function() {
        if (document.getElementById("basic-global-styles")) return;

        const style = document.createElement("style");
        style.id = "basic-global-styles";
        style.innerHTML = `
            .error-container-global { background-color: #ffebee; border: 1px solid #f44336; color: #b71c1c; padding: 20px; border-radius: 8px; margin: 20px auto; text-align: left; width: 95%; max-width: 1200px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: basicFadeIn 0.3s ease-out; }
            .error-details { font-size: 12px; background: #fff; padding: 10px; border: 1px solid #ffcdd2; color: #333; font-family: monospace; overflow-x: auto; margin-top: 10px; }
            @keyframes basicFadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            .toast-hidden, .toast-hidden1 { opacity: 0 !important; transition: opacity 0.5s ease; pointer-events: none; }
        `;
        document.head.appendChild(style);
    }
});


// ===================================================================
// 2. INJEÇÃO DE COMPONENTES DE LAYOUT
// ===================================================================

/**
 * Injeta automaticamente o Layout (Topbar e Sidebar) nas páginas
 * @param {string} titulo - Título que aparecerá na TopBar
 * @param {string} tipoSidebar - 'gestor' ou 'tecnico'
 */
window.injetarLayout = function(titulo, tipoSidebar = 'tecnico') {
    const topbar = document.getElementById("topbar-container");
    const sidebar = document.getElementById("sidebar-container");

    if (topbar && typeof window.renderizarTopBar === 'function') {
        topbar.insertAdjacentHTML("beforeend", window.renderizarTopBar(titulo));
    }

    if (sidebar && typeof window.renderizarSidebarGestor === 'function' && typeof window.renderizarSidebarTecnico === 'function') {
        const menuHTML = (tipoSidebar === 'gestor') ? window.renderizarSidebarGestor() : window.renderizarSidebarTecnico();
        sidebar.insertAdjacentHTML("beforeend", menuHTML);
    }

    // Inicializa os eventos da sidebar e menus
    if (typeof window.inicializarComponentes === 'function') {
        window.inicializarComponentes();
    }
};


// ===================================================================
// 3. FETCH WRAPPER GLOBAL
// ===================================================================

/**
 * Centraliza e padroniza as requisições para a API do Spring Boot.
 */
window.apiFetch = async function (endpoint, options = {}) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, { ...options, headers });

        // Trata interceptação de segurança do Spring Security (Expirou ou Inválido)
        if ([401, 403].includes(response.status)) {
            console.warn(`Sessão inválida ou sem permissão (${response.status}). Redirecionando...`);
            CONFIG.handleLogout(window.location.pathname.endsWith("index.html"));
            return null;
        }

        return response;
    } catch (error) {
        console.error("Erro Crítico de Conexão na API:", error);
        throw error;
    }
};


// ===================================================================
// 4. SISTEMA DE TOAST E FEEDBACK VISUAL
// ===================================================================

let toastTimeout; // Variável global para gerenciar cliques rápidos

/**
 * Controle visual de mensagens não intrusivas.
 * @param {string} mensagem - Texto a ser exibido
 * @param {string} toastId - ID do elemento HTML (Padrão: toast-aviso, Sucesso: toast-aviso1)
 */
window.mostrarToast = function (mensagem, toastId = "toast-aviso") {
    const toast = document.getElementById(toastId);
    if (!toast) {
        alert(mensagem); // Fallback de emergência
        return;
    }

    // Limpa timeout anterior caso o usuário clique várias vezes
    clearTimeout(toastTimeout);

    // Reseta classes para reiniciar a animação nativa
    const classOculta = toastId === "toast-aviso1" ? "toast-hidden1" : "toast-hidden";
    toast.innerText = mensagem;
    toast.style.display = "block";
    toast.classList.remove(classOculta);

    // Força reflow do navegador para reiniciar a transição visual
    void toast.offsetWidth;

    // Agenda o desaparecimento
    toastTimeout = setTimeout(() => {
        toast.classList.add(classOculta);
        setTimeout(() => {
            if (toast.classList.contains(classOculta)) toast.style.display = "none";
        }, 500);
    }, 3000);
};

/**
 * Substitui um container da tela por uma mensagem de erro vermelha detalhada.
 */
window.exibirErro = function (mensagem, detalhes = "", seletor = ".dashboard-grid, .main-content, #app") {
    const htmlErro = `
        <div class="error-container-global">
            <h3 style="margin-top:0; display:flex; align-items:center; gap:8px;">⚠️ Falha na Operação</h3>
            <p style="margin-bottom:0;"><strong>Causa:</strong> ${mensagem}</p>
            ${detalhes ? `<div class="error-details">${detalhes}</div>` : ""}
        </div>
    `;

    // Tenta encontrar o melhor lugar na tela atual para ancorar o erro
    const container = document.querySelector(seletor);
    if (container) {
        container.innerHTML = htmlErro;
        // Proteção para grids quebrando a visualização
        if (window.getComputedStyle(container).display === "grid") {
            container.style.display = "block";
        }
    } else {
        // Se a tela não tiver nenhum dos seletores, injeta direto no body
        document.body.insertAdjacentHTML('afterbegin', htmlErro);
    }

    // Dispara o toast padrão em conjunto para avisar caso o bloco fique fora do scroll
    window.mostrarToast(mensagem);
};


// ===================================================================
// 5. SISTEMA DE EXPORTAÇÃO GLOBAL
// ===================================================================

/**
 * Faz o download de arquivos (CSV, PDF, Excel) gerados pela API.
 * @param {string} formato - Formato desejado (ex: "csv", "pdf", "excel")
 * @param {string} recurso - Recurso da API alvo da exportação (ex: "users", "vehicle")
 * @param {object} parametros - Objeto com query params (ex: { status: 'ativo' }). Passe {} se não usar.
 * @param {string} nomeArquivo - Nome do arquivo a ser salvo (ex: "relatorio_usuarios")
 */
window.baixarArquivo = async function (formato, recurso, parametros = {}, nomeArquivo) {
    const formatoLimpo = formato.toLowerCase();

    // 1. Monta o caminho base automaticamente seguindo a estrutura do seu ExportController
    const caminhoBase = `/export/${formatoLimpo}/${recurso}/${nomeArquivo}`;

    // 2. Monta a string de parâmetros de URL (query params) caso eles existam
    const queryParams = new URLSearchParams(parametros).toString();
    const urlFinal = queryParams ? `${caminhoBase}?${queryParams}` : caminhoBase;

    // 3. Faz a chamada usando o apiFetch
    const response = await window.apiFetch(urlFinal, { method: "GET" });

    // Se a resposta for nula, o apiFetch já interceptou um erro 401/403 e fez o redirecionamento
    if (!response) return;

    if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
    }

    // 4. Extrai o conteúdo binário
    const blob = await response.blob();

    // 5. Cria URL temporária
    const url = window.URL.createObjectURL(blob);

    // 6. Cria link fantasma
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;

    // 7. Garante que o nome do arquivo termina com a extensão correta
    const extensao = formatoLimpo === 'excel' ? 'xlsx' : formatoLimpo;
    const nomeFinal = nomeArquivo.toLowerCase().endsWith(`.${extensao}`) ? nomeArquivo : `${nomeArquivo}.${extensao}`;
    a.download = nomeFinal;

    // 8. Aciona o download e limpa a memória
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};


// ===================================================================
// 6. ROTINA DE INICIALIZAÇÃO
// ===================================================================

// Rodada imediatamente ao carregar qualquer página que importe o script.
(function init() {
    CONFIG.injectGlobalStyles();
    CONFIG.checkAuth();

    // Expõe ação de logout para os botões do header
    window.btnlogout = () => CONFIG.handleLogout(false);
})();