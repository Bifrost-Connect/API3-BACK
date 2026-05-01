let tecnicosAtuais = [];
let tecnicoEditandoId = null;

async function buscarTecnicosDaAPI() {
    try {
        const response = await apiFetch("/user/technicians", { method: "GET" });
        if (response && response.ok) {
            const data = await response.json();

            tecnicosAtuais = data.map(u => ({
                id: u.registration, 
                name: u.name,
                registration: u.registration,
                email: u.email,
                phone: u.phone || "Não informado",
                setor: u.setor || "Campo", 
                perfil: u.permission,
                status: u.employeeStatus || "Ativo"
            }));
            renderizarTecnicos(tecnicosAtuais);
        }
    } catch (error) {
        console.error("Erro ao carregar técnicos:", error);
    }
}

function renderizarTecnicos(lista) {
    const corpo = document.getElementById("tecnicosTabelaCorpo");
    if (!corpo) return;

    if (!lista || lista.length === 0) {
        corpo.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px 0;">Nenhum técnico encontrado.</td></tr>`;
        return;
    }

    corpo.innerHTML = lista.map(tecnico => `
        <tr>
            <td>${tecnico.name}</td>
            <td>${tecnico.registration}</td>
            <td>${tecnico.email}</td>
            <td>${tecnico.setor}</td>
            <td>${tecnico.perfil}</td>
            <td><span class="status-badge status-${tecnico.status}">${tecnico.status}</span></td>
            <td><button class="btn-tecnico-editar" type="button" onclick="abrirEditarTecnico('${tecnico.registration}')">Editar</button></td>
        </tr>
    `).join("");
}

async function salvarAlteracoesTecnico() {
    const matricula = document.getElementById("editarMatricula").value.trim();
    const payload = {
        name: document.getElementById("editarNome").value.trim(),
        email: document.getElementById("editarEmail").value.trim(),
        phone: document.getElementById("editarTelefone").value.trim(),
        employeeStatus: document.getElementById("editarStatus").value
    };

    try {
        const response = await apiFetch(`/user/update/${matricula}`, {
            method: "PATCH",
            body: JSON.stringify(payload)
        });

        if (response && response.ok) {
            alert("Técnico atualizado com sucesso!");
            fecharPopupEditarTecnico();
            buscarTecnicosDaAPI(); 
        }
    } catch (error) {
        alert("Erro ao salvar alterações.");
    }
}

function aplicarFiltroTecnicos() {
    const termo = document.getElementById("filtroBuscaTecnico").value.trim().toLowerCase();
    const filtrados = tecnicosAtuais.filter(t => 
        Object.values(t).some(v => String(v).toLowerCase().includes(termo))
    );
    renderizarTecnicos(filtrados);
}

window.addEventListener("DOMContentLoaded", () => {
    buscarTecnicosDaAPI();
});
