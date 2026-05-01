function exibirErroDashboard(mensagem, detalhes = "") {
    const htmlErro = `
        <div style="background-color: #ffebee; border: 1px solid #f44336; color: #b71c1c; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; width: 100%; grid-column: 1 / -1;">
            <h3 style="margin-top: 0;">❌ Erro no Dashboard</h3>
            <p><strong>Mensagem:</strong> ${mensagem}</p>
            ${detalhes ? `<p style="font-size: 13px; background: #fff; padding: 10px; border: 1px solid #ffcdd2; color: #333; font-family: monospace;">${detalhes}</p>` : ""}
        </div>
    `;
    const grid = document.querySelector(".dashboard-grid");
    if (grid) {
        grid.innerHTML = htmlErro;
        grid.style.display = "block";
    }
}

async function carregarMetricasDashboard() {
    try {
        const response = await apiFetch("/service/dashboard");

        if (!response) return;

        if (!response.ok) {
            const erroTexto = await response.text();
            exibirErroDashboard(`Status HTTP: ${response.status}`, erroTexto);
            return;
        }

        const metricas = await response.json();
        const atualizarElemento = (id, valor) => {
            const el = document.getElementById(id);
            if (el && valor !== undefined) el.textContent = valor;
        };

        atualizarElemento("val-disponiveis", metricas.availableCars);
        atualizarElemento("val-manutencao", metricas.maintenanceCars);
        atualizarElemento("val-uso", metricas.inUseCars);
        atualizarElemento("val-tecnicos-disp", metricas.availableTechnicians);
        atualizarElemento("val-tecnicos-serv", metricas.onDutyTechnicians);

        if (metricas.monthlyFuelSpend !== undefined) {
            atualizarElemento("val-gasto-mensal", `R$ ${metricas.monthlyFuelSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }
        if (metricas.averagePricePerLiter !== undefined) {
            atualizarElemento("val-preco-litro", `R$ ${metricas.averagePricePerLiter.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }
        if (metricas.totalLitersRefueled !== undefined) {
            atualizarElemento("val-litros", `${metricas.totalLitersRefueled.toLocaleString('pt-BR')} L`);
        }

    } catch (error) {
        exibirErroDashboard("Erro no JavaScript", error.message);
    }
}

async function carregarResumoHistorico() {
    try {
        const response = await apiFetch("/service/history");

        if (!response) return;

        if (!response.ok) {
            const container = document.getElementById("chamados-recentes-lista");
            if (container) container.innerHTML = `<div class="nenhum-registro" style="color:red;">Erro ${response.status} ao carregar histórico. Verifique a API.</div>`;
            return;
        }

        const data = await response.json();

        const ativos = data.filter(rev => rev.entity.completionTime === null).length;
        const concluidos = data.filter(rev => rev.entity.completionTime !== null).length;

        if (document.getElementById("resumo-ativos")) document.getElementById("resumo-ativos").textContent = ativos;
        if (document.getElementById("resumo-concluidos")) document.getElementById("resumo-concluidos").textContent = concluidos;

        const container = document.getElementById("chamados-recentes-lista");
        if (!data || data.length === 0) {
            if (container) container.innerHTML = `<div class="nenhum-registro">Nenhum chamado registrado na auditoria.</div>`;
            return;
        }

        const recentes = data.slice(0, 5).map(rev => {
            const isFinalizado = rev.entity.completionTime !== null;
            const statusStr = isFinalizado ? "finalizado" : "andamento";
            const statusLabelStr = isFinalizado ? "Finalizado" : "Em andamento";

            const rawDate = rev.entity.departureTime || rev.revisionDate;
            const dataAbertura = rawDate ? new Date(rawDate) : new Date();
            const horaStr = `${String(dataAbertura.getHours()).padStart(2, '0')}:${String(dataAbertura.getMinutes()).padStart(2, '0')}`;

            return `
                <article class="item-chamado item-${statusStr === 'finalizado' ? 'finalizado' : 'andamento'}">
                    <div class="item-chamado-principal">
                        <div class="item-chamado-topo">
                            <span class="chamado-numero">N° ${rev.entity.id}</span>
                            <span class="status-chip status-${statusStr}">${statusLabelStr}</span>
                        </div>
                        <h3>Revisão: ${rev.revisionType === 'ADD' ? "Abertura de Chamado" : "Atualização/Check-out"}</h3>
                        <div class="dados-veiculo">Viatura ${rev.entity.car?.prefix || "N/A"} | Técnico: ${rev.entity.user?.name || "N/A"}</div>
                        <div class="meta-chamado">
                            <span>${rev.entity.destinationRequester || "Sem local informado"}</span>
                            <span>Horário: ${horaStr}</span>
                        </div>
                    </div>
                    <button class="btn-status status-${statusStr}" onclick="window.location.href='historicochamados.html'">ver histórico</button>
                </article>
            `;
        });

        if (container) container.innerHTML = recentes.join("");

    } catch (error) {
        console.error("Erro ao carregar resumo de histórico:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".dashboard-gestor")) {
        carregarMetricasDashboard();
        carregarResumoHistorico();
    }
});