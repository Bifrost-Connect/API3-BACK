let relatoriosDoBanco = [];
let selectedReportIndex = 0;
let selectedDateRange = { from: null, to: null };
let selectedCategoria = "Chamados";
let customDateReport = null; // Guarda o relatório gerado por data customizada

const categoriasRelatorio = ["Chamados", "Abastecimento", "Ocorrências"];

const relatoriosSample = [
    {
        monthLabel: "Abril",
        year: 2026,
        status: "Relatório parcial",
        totalCalls: 42,
        completedCalls: 28,
        openCalls: 14,
        isCurrentMonth: true,
        entries: [
            {
                id: 7345,
                carPrefix: "Ford Ka | 1234",
                userName: "Ana Paula",
                description: "Verificação de bomba de combustível",
                departureTime: "20/04/2026 08:10",
                completionTime: "20/04/2026 10:00",
                status: "Aberto"
            },
            {
                id: 7343,
                carPrefix: "Fiat Mobi | 9012",
                userName: "Bruno Lima",
                description: "Manutenção preventiva de radar",
                departureTime: "17/04/2026 15:05",
                completionTime: "17/04/2026 16:40",
                status: "Finalizado"
            },
            {
                id: 7341,
                carPrefix: "Toyota Hilux | 7890",
                userName: "Juliana Costa",
                description: "Verificação de cronotacógrafos",
                departureTime: "20/04/2026 07:40",
                completionTime: "--",
                status: "Em andamento"
            }
        ],
        gastos: [
            { id: 1, type: "Combustível", vehicle: "Fiat Mobi | 9012", amount: "R$ 1.340,50", date: "17/04/2026", description: "Abastecimento e troca de óleo" },
            { id: 2, type: "Peças", vehicle: "Ford Ka | 1234", amount: "R$ 520,00", date: "20/04/2026", description: "Substituição de pastilhas de freio" }
        ],
        abastecimentos: [
            { id: 1, vehicle: "Fiat Mobi | 9012", driver: "Bruno Lima", liters: "35 L", cost: "R$ 220,00", date: "17/04/2026" },
            { id: 2, vehicle: "Toyota Hilux | 7890", driver: "Juliana Costa", liters: "50 L", cost: "R$ 310,00", date: "15/04/2026" }
        ],
        ocorrencias: [
            { id: 1, vehicle: "Ford Ka | 1234", technician: "Ana Paula", occurrence: "Avaria no sensor de velocidade", date: "12/04/2026", status: "Aberto" },
            { id: 2, vehicle: "Fiat Mobi | 9012", technician: "Bruno Lima", occurrence: "Troca de pneu emergencial", date: "08/04/2026", status: "Finalizado" }
        ]
    }
];

window.addEventListener("DOMContentLoaded", () => {
    if (typeof carregarDadosTelaInicial === "function") carregarDadosTelaInicial();
    configurarRelatorios();
    carregarRelatorioAnoVigente();
});

async function carregarRelatorioAnoVigente() {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const year = ontem.getFullYear();
    const pad = n => String(n).padStart(2, '0');
    
    const inicio = `${year}-01-01`;
    const fim = `${year}-${pad(ontem.getMonth() + 1)}-${pad(ontem.getDate())}`;

    // Atualiza os inputs do popup se eles existirem
    const inputInicio = document.getElementById("relatorio-data-inicio");
    const inputFim = document.getElementById("relatorio-data-fim");
    if (inputInicio && inputFim) {
        inputInicio.value = inicio;
        inputFim.value = fim;
    }

    selectedDateRange = { from: inicio, to: fim };

    // Inicializa as categorias (caso precise)
    if (document.getElementById("categorias-list")) {
        renderizarCategorias();
    }
    
    await buscarDadosParaCategoria(inicio, fim);
}

function configurarRelatorios() {
    const btnEscolher = document.getElementById("btn-escolher-datas");
    const btnGerar = document.getElementById("btn-gerar-relatorio");

    if (btnEscolher) btnEscolher.addEventListener("click", abrirEscolherDatas);
    if (btnGerar) btnGerar.addEventListener("click", gerarRelatorio);
}

async function carregarRelatoriosDaAPI() {
    try {
        const response = await window.apiFetch("/dashboard/reports", {
            method: "GET"
        });

        if (response && response.ok) {
            const data = await response.json();
            relatoriosDoBanco = data.reports || [];
            inicializarRelatorios();
        } else {
            console.error("Erro ao buscar relatórios. Status:", response.status);
            relatoriosDoBanco = relatoriosSample;
            inicializarRelatorios();
            mostrarErroNaTabela("Falha ao carregar os dados do servidor.");
        }
    } catch (error) {
        console.error("Erro de conexão com a API:", error);
        relatoriosDoBanco = relatoriosSample;
        inicializarRelatorios();
        mostrarErroNaTabela("Erro de conexão. Verifique se o back-end está rodando.");
    }
}

function inicializarRelatorios() {
    if (!document.getElementById("categorias-list")) return;

    if (relatoriosDoBanco.length === 0) {
        relatoriosDoBanco = relatoriosSample;
    }

    renderizarCategorias();
    selecionarRelatorio(0);
}

function renderizarCategorias() {
    const container = document.getElementById("categorias-list");
    if (!container) return;

    container.innerHTML = categoriasRelatorio
        .map(categoria => `
            <button type="button" class="categoria-btn ${categoria === selectedCategoria ? "active" : ""}" onclick="selecionarCategoria('${categoria}')">${categoria}</button>
        `)
        .join("");
}

function obterEndpointDaCategoria() {
    switch (selectedCategoria) {
        case "Abastecimento": return "/dashboard/supplies-by-date";
        case "Ocorrências": return "/dashboard/incidents-by-date";
        case "Chamados":
        default: return "/dashboard/reports-by-date";
    }
}

function obterNomeRecursoDeExportacao() {
    switch (selectedCategoria) {
        case "Abastecimento": return "supplies-by-date";
        case "Ocorrências": return "incidents-by-date";
        case "Chamados":
        default: return "reports-by-date";
    }
}

async function buscarDadosParaCategoria(inicio, fim) {
    if (!inicio || !fim) return;
    
    const endpoint = obterEndpointDaCategoria();
    window.mostrarToast(`Buscando ${selectedCategoria.toLowerCase()}...`, "toast-aviso1");
    
    try {
        const response = await window.apiFetch(`${endpoint}?startDate=${inicio}&endDate=${fim}`, { method: "GET" });
        if (response && response.ok) {
            const data = await response.json();
            const entries = data.entries || [];
            
            customDateReport = {
                month: `Período Personalizado`,
                totalCalls: entries.length,
                completedCalls: entries.filter(e => e.status && e.status.includes("Finalizado")).length,
                openCalls: entries.filter(e => e.status && !e.status.includes("Finalizado")).length,
                isCurrentMonth: false,
                status: `Filtro: ${formatDate(inicio)} a ${formatDate(fim)}`,
                entries: entries
            };
            
            atualizarStatusEResumo();
            atualizarConteudo();
        } else {
            window.mostrarToast(`Erro ao buscar ${selectedCategoria.toLowerCase()}`, "toast-aviso");
        }
    } catch (e) {
        console.error(e);
        window.mostrarToast("Erro de conexão com o servidor.", "toast-aviso");
    }
}

async function selecionarCategoria(categoria) {
    selectedCategoria = categoria;
    renderizarCategorias();
    
    if (selectedDateRange.from && selectedDateRange.to) {
        await buscarDadosParaCategoria(selectedDateRange.from, selectedDateRange.to);
    } else {
        atualizarConteudo();
    }
}

function selecionarRelatorio(index) {
    selectedReportIndex = index;
    if (selectedReportIndex >= relatoriosDoBanco.length) selectedReportIndex = 0;
    
    selectedDateRange = { from: null, to: null }; // Limpa qualquer filtro de data ao clicar em um mês
    customDateReport = null; // Limpa relatório customizado

    document.querySelectorAll(".periodo-item").forEach(el => el.classList.remove("active"));
    const selectedEl = document.querySelector(`.periodo-item[data-index="${index}"]`);
    if (selectedEl) selectedEl.classList.add("active");

    renderizarCategorias();
    atualizarStatusEResumo();
    atualizarConteudo();
}

function mostrarStatus(text) {
    // Seleciona o primeiro 'strong' dentro do primeiro 'article' dos KPIs
    const statusElement = document.querySelector(".relatorios-kpis article:nth-child(1) strong");
    if (statusElement) statusElement.textContent = text;
}

function atualizarResumo(total, completed, open) {
    const kpis = document.querySelectorAll(".relatorios-kpis article strong");
    if (kpis.length >= 4) {
        kpis[1].textContent = total;
        kpis[2].textContent = completed;
        kpis[3].textContent = open;
    }
}

function atualizarTabela(entries) {
    const tbody = document.querySelector(".relatorios-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!entries || entries.length === 0) {
        mostrarErroNaTabela(`Nenhum registro de ${selectedCategoria.toLowerCase()} disponível.`);
        return;
    }

    const headerRow = document.querySelector(".relatorios-table thead tr");
    if (headerRow) headerRow.innerHTML = cabecalhoPorCategoria();

    entries.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = linhaPorCategoria(entry);
        tbody.appendChild(row);
    });
}

function atualizarStatusEResumo() {
    const report = customDateReport || relatoriosDoBanco[selectedReportIndex] || relatoriosSample[0];
    mostrarStatus(report.status);
    atualizarResumo(report.totalCalls, report.completedCalls, report.openCalls);
    atualizarBotaoGerar(report);
}

function atualizarBotaoGerar(report) {
    const btn = document.getElementById("btn-gerar-relatorio");
    if (!btn) return;
    btn.textContent = isRelatorioParcial(report) ? "Gerar relatório parcial" : "Gerar relatório completo";
}

function isRelatorioParcial(report) {
    if (!report) return false;
    if (report.isCurrentMonth != null) return report.isCurrentMonth;
    if (report.isPartial != null) return report.isPartial;
    if (report.status) return /parcial/i.test(report.status);

    const now = new Date();
    if (report.month && report.year) {
        return Number(report.month) === now.getMonth() + 1 && Number(report.year) === now.getFullYear();
    }

    if (report.monthLabel && report.year) {
        return report.monthLabel.toLowerCase().includes("abril") && now.getMonth() + 1 === 4 && now.getFullYear() === report.year;
    }

    return false;
}

function atualizarConteudo() {
    const report = customDateReport || relatoriosDoBanco[selectedReportIndex] || relatoriosSample[0];
    atualizarBannerPeriodo(report);
    const dados = obterDadosPorCategoria(report);
    atualizarTabela(dados);
}

function atualizarBannerPeriodo(report) {
    const label = document.getElementById("report-range-label");
    if (!label) return;

    if (selectedDateRange.from && selectedDateRange.to) {
        label.textContent = `Período selecionado: ${formatDate(selectedDateRange.from)} até ${formatDate(selectedDateRange.to)}`;
        return;
    }

    if (report.monthLabel && report.year) {
        label.textContent = `Período atual: ${report.monthLabel} ${report.year}`;
        return;
    }

    label.textContent = `Período atual: ${selectedCategoria}`;
}

function obterDadosPorCategoria(report) {
    if (!report) return [];
    
    // For custom date reports fetched from our new endpoints, all data comes in 'entries'
    if (report.month === "Período Personalizado") {
        return report.entries || [];
    }

    switch (selectedCategoria) {
        case "Abastecimento":
            return report.abastecimentos?.length ? report.abastecimentos : extrairAbastecimentos(report);
        case "Ocorrências":
            return report.ocorrencias?.length ? report.ocorrencias : extrairOcorrencias(report);
        default:
            return report.entries?.length ? report.entries : [];
    }
}

function cabecalhoPorCategoria() {
    switch (selectedCategoria) {
        case "Abastecimento":
            return `<th>ID</th><th>Veículo</th><th>Motorista</th><th>Posto</th><th>Litros</th><th>Valor Total</th><th>Data</th>`;
        case "Ocorrências":
            return `<th>ID</th><th>Veículo</th><th>Técnico</th><th>Tipo</th><th>Gravidade</th><th>Data</th><th>Status</th>`;
        default:
            return `<th>ID</th><th>Veículo</th><th>Técnico</th><th>Descrição</th><th>Saída</th><th>Conclusão</th><th>Status</th>`;
    }
}

function linhaPorCategoria(entry) {
    switch (selectedCategoria) {
        case "Abastecimento":
            return `<td>${entry.ID || entry.id || "-"}</td><td>${entry['Veículo'] || entry.carPrefix || entry.vehicle || entry.veiculo || "-"}</td><td>${entry['Motorista'] || entry.technicianName || entry.driver || entry.motorista || "-"}</td><td>${entry['Posto'] || entry.gasStationName || entry.posto || "-"}</td><td>${entry['Litros'] || entry.liters || "-"} L</td><td>${entry['Valor Total'] || entry.totalAmount || entry.cost || "-"}</td><td>${entry['Data'] || entry.date || entry.data || "-"}</td>`;
        case "Ocorrências":
            let statusOcorrenciaClass = "status-indicar";
            if (entry.Status === "Resolvido" || entry.status === "Resolvido") statusOcorrenciaClass = "status-finalizado";
            return `<td>${entry.ID || entry.id || "-"}</td><td>${entry['Placa do Veículo'] || entry.carPrefix || "-"}</td><td>${entry['Técnico'] || entry.technicianName || "-"}</td><td>${entry['Tipo de Ocorrência'] || entry.incidentType || "-"}</td><td>${entry['Gravidade'] || entry.severity || "-"}</td><td>${entry['Data da Ocorrência'] || entry.date || "-"}</td><td><span class="status-chip ${statusOcorrenciaClass}">${entry.Status || entry.status || "-"}</span></td>`;
        default: {
            let statusClass = "status-indicar";
            if (entry.status === "Finalizado") statusClass = "status-finalizado";
            else if (entry.status === "Em andamento") statusClass = "status-andamento";

            return `<td>${entry.id || "-"}</td><td>${entry.carPrefix || entry.vehicle || entry.veiculo || "-"}</td><td>${entry.userName || entry.userRegistration || entry.technician || entry.tecnico || "-"}</td><td>${entry.description || entry.descricao || "-"}</td><td>${entry.departureTime || entry.dataSaida || "-"}</td><td>${entry.completionTime || entry.conclusionTime || "-"}</td><td><span class="status-chip ${statusClass}">${entry.status || "-"}</span></td>`;
        }
    }
}

function extrairGastos(report) {
    return (report.entries || []).map((entry, index) => ({
        id: entry.id || index + 1,
        type: entry.expenseType || "Gasto",
        vehicle: entry.carPrefix || entry.vehicle || "-",
        amount: entry.cost || entry.valor || "R$ 0,00",
        date: entry.date || entry.data || "-",
        description: entry.description || entry.descricao || "-"
    }));
}

function extrairAbastecimentos(report) {
    return (report.entries || []).map((entry, index) => ({
        id: entry.id || index + 1,
        vehicle: entry.carPrefix || entry.vehicle || "-",
        driver: entry.userName || entry.driver || "-",
        liters: entry.liters || entry.litros || "-",
        cost: entry.cost || entry.custo || "R$ 0,00",
        date: entry.date || entry.data || "-"
    }));
}

function extrairOcorrencias(report) {
    return (report.entries || []).map((entry, index) => ({
        id: entry.id || index + 1,
        vehicle: entry.carPrefix || entry.vehicle || "-",
        technician: entry.userName || entry.technician || "-",
        occurrence: entry.occurrence || entry.ocorrencia || entry.description || "Ocorrência registrada",
        date: entry.date || entry.data || "-",
        status: entry.status || "Aberto"
    }));
}

function abrirEscolherDatas() {
    const popup = document.getElementById("popupRelatorioDatas");
    const inputInicio = document.getElementById("relatorio-data-inicio");
    const inputFim = document.getElementById("relatorio-data-fim");
    
    if (inputInicio && inputFim && !inputInicio.value && !inputFim.value) {
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        
        const year = ontem.getFullYear();
        const pad = n => String(n).padStart(2, '0');
        
        inputInicio.value = `${year}-01-01`;
        inputFim.value = `${year}-${pad(ontem.getMonth() + 1)}-${pad(ontem.getDate())}`;
    }

    if (popup) popup.style.display = "flex";
}

function fecharEscolherDatas() {
    const popup = document.getElementById("popupRelatorioDatas");
    if (popup) popup.style.display = "none";
}

async function confirmarPeriodoRelatorio() {
    const inicio = document.getElementById("relatorio-data-inicio").value;
    const fim = document.getElementById("relatorio-data-fim").value;

    if (!inicio || !fim) {
        window.mostrarToast("Escolha data de início e fim.", "toast-aviso");
        return;
    }

    selectedDateRange = { from: inicio, to: fim };
    fecharEscolherDatas();
    window.mostrarToast(`Buscando relatórios de ${formatDate(inicio)} até ${formatDate(fim)}...`, "toast-aviso1");

        await buscarDadosParaCategoria(inicio, fim);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR');
}

function fecharExport() {
    const popup = document.getElementById("popupExport");
    if (popup) popup.style.display = "none";
}

function gerarRelatorio() {
    const popup = document.getElementById("popupExport");
    if (popup) popup.style.display = "flex";
}

window.executarExportacao = async function () {
    const nomeArquivo = document.getElementById("export-filename").value.trim() || "Relatorio";
    const formato = document.querySelector('input[name="exportFormat"]:checked').value;
    
    // Verifies if custom dates are selected
    if (customDateReport && selectedDateRange.from && selectedDateRange.to) {
        try {
            const recursoExportacao = obterNomeRecursoDeExportacao();
            window.mostrarToast("Iniciando exportação por período...", "toast-aviso1");
            await window.baixarArquivo(formato, recursoExportacao, { startDate: selectedDateRange.from, endDate: selectedDateRange.to }, nomeArquivo);
        } catch (error) {
            console.error("Erro durante a exportação:", error);
            window.mostrarToast("Erro ao exportar arquivo.", "toast-aviso");
        }
    } else {
        const report = relatoriosDoBanco[selectedReportIndex] || relatoriosSample[0];
        
        // Mapeia o mês para calcular início e fim e exportar corretamente a lista de chamados
        const mapMeses = { "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12 };
        
        let monthNum = new Date().getMonth() + 1;
        let yearNum = new Date().getFullYear();
        
        if (report && report.monthLabel) {
            monthNum = mapMeses[report.monthLabel.toLowerCase()] || monthNum;
            yearNum = report.year || yearNum;
        }
        
        const pad = (n) => String(n).padStart(2, '0');
        const lastDay = new Date(yearNum, monthNum, 0).getDate();
        
        const startDate = `${yearNum}-${pad(monthNum)}-01`;
        const endDate = `${yearNum}-${pad(monthNum)}-${pad(lastDay)}`;

        try {
            const recursoExportacao = obterNomeRecursoDeExportacao();
            window.mostrarToast("Iniciando exportação do mês...", "toast-aviso1");
            await window.baixarArquivo(formato, recursoExportacao, { startDate: startDate, endDate: endDate }, nomeArquivo);
        } catch (error) {
            console.error("Erro durante a exportação:", error);
            window.mostrarToast("Erro ao exportar arquivo.", "toast-aviso");
        }
    }
    fecharExport();
};
function mostrarErroNaTabela(mensagem) {
    const tbody = document.querySelector(".relatorios-table tbody");
    if (tbody) {
        const colspan = selectedCategoria === "Chamados" ? 7 : 6;
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center; color:#67717b; padding:28px 0;">${mensagem}</td></tr>`;
    }
}

window.exportCsvForSelectedMonth = function() {
    window.mostrarToast("Exportação habilitada para uma futura integração.", "toast-aviso1");
}