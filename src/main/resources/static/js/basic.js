const CONFIG = {
    API_URL: "http://localhost:8080",
    TOKEN_KEY: "auth_token",

    checkAuth: function () {
        const token = localStorage.getItem(this.TOKEN_KEY);
        const isLoginPage = window.location.pathname.endsWith("index.html") ||
            window.location.pathname === "/" ||
            window.location.pathname === "";

        if (!token || this.isTokenExpired(token)) {
            this.handleLogout(isLoginPage);
            return null;
        }

        if (isLoginPage) {
            this.redirectByPermission();
        }

        return token;
    },

    isTokenExpired: function (token) {
        try {
            const payload = this.decodeToken(token);
            if (!payload || !payload.exp) return true;

            return (Date.now() >= (payload.exp * 1000) - 10000);
        } catch (e) {
            return true;
        }
    },

    decodeToken: function (token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            return JSON.parse(atob(parts[1]));
        } catch (e) {
            return null;
        }
    },

    redirectByPermission: function () {
        const rawPermission = localStorage.getItem("userPermission") || "";
        const permission = rawPermission.trim().toUpperCase().replace("ROLE_", "");

        if (permission === "ADMINISTRATOR") {
            window.location.href = "telainicial-gestor.html";
        } else {
            window.location.href = "telainicial.html";
        }
    },

    handleLogout: function (isLoginPage) {
        localStorage.clear();
        if (!isLoginPage) {
            window.location.href = "index.html";
        }
    }
};

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions = {
        ...options,
        headers: headers
    };

    try {
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, fetchOptions);

        if (response.status === 401 || response.status === 403 || response.status === 500) {
            console.warn(`Sessão inválida (Status ${response.status}). Limpando acesso...`);

            const isLoginPage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";

            CONFIG.handleLogout(isLoginPage);
            return null;
        }

        return response;
    } catch (error) {
        console.error("Erro crítico na conexão com a API:", error);
        throw error;
    }
}

window.btnlogout = () => {
    CONFIG.handleLogout(false);
};

CONFIG.checkAuth();