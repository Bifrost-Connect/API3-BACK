const veiculosSample = [
    {
        id: 101,
        model: "Fiat Mobi",
        brand: "Fiat",
        type: "Sedan",
        prefix: "1234",
        licensePlate: "ABC-1234",
        status: "Disponível"
    },
    {
        id: 102,
        model: "VW Gol",
        brand: "Volkswagen",
        type: "Hatch",
        prefix: "5678",
        licensePlate: "DEF-5678",
        status: "Em manutenção"
    },
    {
        id: 103,
        model: "Toyota Hilux",
        brand: "Toyota",
        type: "Pick-up",
        prefix: "7890",
        licensePlate: "GHI-9012",
        status: "Em uso"
    },
    {
        id: 104,
        model: "Chevrolet Onix",
        brand: "Chevrolet",
        type: "Hatch",
        prefix: "3456",
        licensePlate: "JKL-3456",
        status: "Disponível"
    }
];

let veiculosAtuais = [...veiculosSample];
let veiculosFiltrados = [...veiculosAtuais];

function renderizarVeiculos(lista) {
    const corpo = document.getElementById("veiculosTabelaCorpo");
    if (!corpo) return;

    if (!lista || lista.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 32px 0; color: #4a5c7f;">Nenhum veículo encontrado.</td>
            </tr>
        `;
        return;
    }

    corpo.innerHTML = lista.map(veiculo => {
        return `
            <tr>
                <td>${veiculo.model}</td>
                <td>${veiculo.brand}</td>
                <td>${veiculo.prefix}</td>
                <td>${veiculo.licensePlate}</td>
                <td>${veiculo.type}</td>
                <td><span class="status-badge ${obterStatusClass(veiculo.status)}">${veiculo.status}</span></td>
            </tr>
        `;
    }).join("");
}

function obterStatusClass(status) {
    return `status-${String(status).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')}`;
}

function aplicarFiltroVeiculos() {
    const termo = document.getElementById("filtroBuscaVeiculo").value.trim().toLowerCase();
    const filtrados = veiculosAtuais.filter(veiculo => {
        return [
            veiculo.model,
            veiculo.brand,
            veiculo.prefix,
            veiculo.licensePlate,
            veiculo.type,
            veiculo.status
        ].some(valor => (valor || "").toLowerCase().includes(termo));
    });

    veiculosFiltrados = filtrados;
    renderizarVeiculos(veiculosFiltrados);
}

function limparFiltroVeiculos() {
    const campo = document.getElementById("filtroBuscaVeiculo");
    if (campo) campo.value = "";
    veiculosFiltrados = [...veiculosAtuais];
    renderizarVeiculos(veiculosFiltrados);
}

async function carregarVeiculos() {
    try {
        const response = await window.apiFetch("/vehicle", { method: "GET" });
        if (response && response.ok) {
            const data = await response.json();
            veiculosAtuais = data.map(v => ({
                id: v.prefix, // Car usa prefix como ID
                model: v.type ? v.type.model : "Desconhecido",
                brand: v.type ? v.type.brand : "Desconhecido",
                type: v.type ? v.type.category : "Desconhecido",
                prefix: v.prefix,
                licensePlate: v.licensePlate,
                status: v.vehicleStatus || "Disponível"
            }));
            veiculosFiltrados = [...veiculosAtuais];
            renderizarVeiculos(veiculosFiltrados);
            return;
        }
    } catch (error) {
        console.warn("Backend indisponível para carregar veículos, utilizando dados mockados.", error);
    }
    veiculosAtuais = [...veiculosSample];
    veiculosFiltrados = [...veiculosAtuais];
    renderizarVeiculos(veiculosFiltrados);
}

window.tiposVeiculosAtuais = [];

async function carregarTiposVeiculos() {
    try {
        const response = await window.apiFetch("/vehicle/types", { method: "GET" });
        if (response && response.ok) {
            const data = await response.json();
            window.tiposVeiculosAtuais = data;
            renderizarTiposVeiculos(window.tiposVeiculosAtuais);
        }
    } catch (error) {
        console.warn("Backend indisponível para carregar tipos de veículos.", error);
    }
}

function renderizarTiposVeiculos(lista) {
    const corpo = document.getElementById("tiposVeiculosTabelaCorpo");
    if (!corpo) return;

    if (!lista || lista.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 32px 0; color: #4a5c7f;">Nenhum tipo de veículo encontrado.</td>
            </tr>
        `;
        return;
    }

    corpo.innerHTML = lista.map(tipo => {
        return `
            <tr>
                <td>${tipo.id}</td>
                <td>${tipo.brand || '-'}</td>
                <td>${tipo.model || '-'}</td>
                <td>${tipo.year || '-'}</td>
                <td>${tipo.category || '-'}</td>
            </tr>
        `;
    }).join("");
}

window.alternarAbaVeiculos = function(aba) {
    const btnVeiculos = document.getElementById("btnAbaVeiculos");
    const btnTipos = document.getElementById("btnAbaTipos");
    const tabVeiculos = document.getElementById("tabVeiculos");
    const tabTipos = document.getElementById("tabTipos");

    if (!btnVeiculos || !btnTipos || !tabVeiculos || !tabTipos) return;

    if (aba === 'veiculos') {
        btnVeiculos.classList.add("aba-ativa");
        btnVeiculos.classList.remove("aba-inativa");
        btnTipos.classList.remove("aba-ativa");
        btnTipos.classList.add("aba-inativa");
        
        tabVeiculos.style.display = "block";
        tabTipos.style.display = "none";
    } else {
        btnTipos.classList.add("aba-ativa");
        btnTipos.classList.remove("aba-inativa");
        btnVeiculos.classList.remove("aba-ativa");
        btnVeiculos.classList.add("aba-inativa");
        
        tabTipos.style.display = "block";
        tabVeiculos.style.display = "none";
        
        if (window.tiposVeiculosAtuais.length === 0) {
            carregarTiposVeiculos();
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    carregarVeiculos();
    carregarTiposVeiculos();
});