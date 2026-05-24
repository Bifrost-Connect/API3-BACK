<<<<<<< Updated upstream
/**
 * js/vehicle.js
 * Responsável por: Cadastro, Listagem, Filtros e Seleção de Veículos.
 */

// ===================================================================
// UTILS
// ===================================================================
const traduzirCategoria = (cat) => {
    if (!cat) return 'PASSEIO';
    cat = cat.toLowerCase();
    if (cat === 'passenger') return 'PASSEIO';
    if (cat === 'utility') return 'UTILITÁRIO';
    return cat.toUpperCase();
};

// ===================================================================
// 1. CADASTRO DE VEÍCULOS
// ===================================================================

// Busca os modelos (Tipos de Carro) cadastrados para preencher o <select>
async function carregarTiposVeiculo() {
    const selectTipo = document.getElementById("cad-tipo");
    if (!selectTipo) return;

    try {
        const response = await apiFetch("/vehicle/types");
        if (response && response.ok) {
            const tipos = await response.json();
            selectTipo.innerHTML = '<option value="" disabled selected>Selecione um modelo...</option>';

            tipos.forEach(tipo => {
                const categoriaPt = traduzirCategoria(tipo.category);
                const option = document.createElement("option");
                option.value = tipo.id;
                option.textContent = `${tipo.brand} ${tipo.model} (${tipo.year}) - ${categoriaPt}`;
                selectTipo.appendChild(option);
            });
        } else {
            selectTipo.innerHTML = '<option value="" disabled>Erro ao carregar tipos.</option>';
        }
    } catch (error) {
        console.error("Erro ao carregar tipos de veículo:", error);
        if (selectTipo) selectTipo.innerHTML = '<option value="" disabled>Servidor offline.</option>';
    }
}

// ===================================================================
// NOVO: CARREGAMENTO DINÂMICO DOS FILTROS
// ===================================================================

async function carregarFiltrosDinamicos() {
    const selectTipo = document.getElementById("filtroTipo");
    const selectMarca = document.getElementById("filtroMarca");

    if (!selectTipo || !selectMarca) return;

    try {
        const response = await apiFetch("/vehicle/types");

        if (response && response.ok) {
            const tipos = await response.json();

            // Mantém apenas a opção padrão
            selectTipo.innerHTML = '<option value="TODOS">Todos os tipos</option>';
            selectMarca.innerHTML = '<option value="TODOS">Todas as marcas</option>';

            const categoriasAdicionadas = new Set();
            const marcasAdicionadas = new Set();

            tipos.forEach(tipo => {

                // ===== CATEGORIAS =====
                const categoria = traduzirCategoria(tipo.category);

                if (!categoriasAdicionadas.has(categoria)) {
                    categoriasAdicionadas.add(categoria);

                    const optionTipo = document.createElement("option");
                    optionTipo.value = categoria.toUpperCase();
                    optionTipo.textContent = categoria;

                    selectTipo.appendChild(optionTipo);
                }

                // ===== MARCAS =====
                const marcaUpper = tipo.brand.toUpperCase();

                if (!marcasAdicionadas.has(marcaUpper)) {
                    marcasAdicionadas.add(marcaUpper);

                    const optionMarca = document.createElement("option");
                    optionMarca.value = marcaUpper;
                    optionMarca.textContent = tipo.brand;

                    selectMarca.appendChild(optionMarca);
                }
            });
        }
    } catch (error) {
        console.error("Erro ao carregar filtros:", error);
    }
}

// Envia os dados do formulário para registrar uma nova viatura física
window.cadastrarVeiculo = async function () {
    const prefixo = document.getElementById("cad-prefixo")?.value;
    const placa = document.getElementById("cad-placa")?.value;
    const cor = document.getElementById("cad-cor")?.value;
    const tipoId = document.getElementById("cad-tipo")?.value;

    if (!prefixo || !placa || !tipoId) {
        window.mostrarToast("Por favor, preencha o Prefixo, Placa e selecione o Modelo.");
        return;
    }

    const payload = {
        prefix: prefixo.trim(),
        licensePlate: placa.trim(),
        color: cor || "Não informada",
        available: true,
        currentKm: 0.0,
        type: { id: parseInt(tipoId) }
    };

    try {
        const response = await apiFetch("/vehicle/register", { method: "POST", body: JSON.stringify(payload) });

        if (response && response.ok) {
            const popupConf = document.getElementById('popupConfirmacao');
            const popupSuc = document.getElementById('popupSucesso');
            const msgSucesso = document.getElementById("mensagem-sucesso");

            if (popupConf) popupConf.style.display = 'none';
            if (msgSucesso) msgSucesso.textContent = "Veículo cadastrado com sucesso!";

            if (popupSuc) {
                popupSuc.style.display = 'flex';
                popupSuc.setAttribute("data-action", "cadastro");
            } else {
                window.mostrarToast("Veículo cadastrado!", "toast-aviso1");
            }

            limparFormulario();

            // NOVO: Atualiza filtros automaticamente após cadastro
            carregarFiltrosDinamicos();

        } else if (response) {
            const erro = await response.json();
            window.mostrarToast("Erro no cadastro: " + (erro.error || "Verifique os dados."));
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        window.mostrarToast("Falha ao conectar com o servidor.");
    }
};

function limparFormulario() {
    ["cad-prefixo", "cad-placa", "cad-cor", "cad-tipo"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

// ===================================================================
// 2. LISTAGEM DE VEÍCULOS DISPONÍVEIS
// ===================================================================
async function carregarVeiculosDisponiveis() {
    const listaVeiculos = document.getElementById("listaVeiculos");
    if (!listaVeiculos) return;

    listaVeiculos.innerHTML = '<p style="text-align:center; padding: 20px;">Carregando veículos...</p>';

    try {
        const response = await apiFetch("/vehicle");
        if (response && response.ok) {
            const veiculos = await response.json();
            listaVeiculos.innerHTML = '';
            let veiculosLivres = 0;

            veiculos.forEach(v => {
                // Filtra para exibir apenas veículos que não estão em uso ou manutenção
                if (v.available === false || String(v.available) === "false" || v.vehicleStatus === "IN_USE" || v.vehicleStatus === "MAINTENANCE") {
                    return;
                }
                veiculosLivres++;

                const marca = v.type ? v.type.brand : 'Desconhecida';
                const modelo = v.type ? v.type.model : 'Desconhecido';
                const categoria = traduzirCategoria(v.type ? v.type.category : '');
                const kmAtual = (v.currentKm !== undefined && v.currentKm !== null) ? v.currentKm : 0;

                const btn = document.createElement("button");
                btn.className = "btn-veiculo";
                btn.setAttribute("data-tipo", categoria.toUpperCase());
                btn.setAttribute("data-marca", marca.toUpperCase());
                btn.textContent = `Viatura ${v.prefix} - ${modelo}`;

                // Ao clicar, o veículo é selecionado temporariamente
                btn.onclick = () => selecionarVeiculo(
                    `Viatura ${v.prefix}`, modelo, marca, categoria, v.prefix, v.licensePlate, kmAtual
                );

                listaVeiculos.appendChild(btn);
            });

            if (veiculosLivres === 0) {
                listaVeiculos.innerHTML = '<p style="text-align:center; padding: 20px;">Nenhum veículo disponível no momento.</p>';
            }
        } else {
            listaVeiculos.innerHTML = '<p style="text-align:center; padding: 20px; color: red;">Erro ao carregar veículos.</p>';
        }
    } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        listaVeiculos.innerHTML = '<p style="text-align:center; padding: 20px; color: red;">Falha de conexão com o servidor.</p>';
    }
}

// ===================================================================
// 3. SELEÇÃO DE VEÍCULO
// ===================================================================
=======
// SELEÇÃO DE VEÍCULO
>>>>>>> Stashed changes
let tempVehicle = {};

window.selecionarVeiculo = async (title, model, brand, type, prefix, licensePlate) => {
    tempVehicle = { title, model, brand, type, prefix, licensePlate };

    if (document.getElementById("fotoVeiculo")) document.getElementById("fotoVeiculo").src = "img/carro 1.jpg";
    if (document.getElementById("modeloVeiculo")) document.getElementById("modeloVeiculo").textContent = model;
    if (document.getElementById("marcaVeiculo")) document.getElementById("marcaVeiculo").textContent = brand;
    if (document.getElementById("placaVeiculo")) document.getElementById("placaVeiculo").textContent = licensePlate;
    if (document.getElementById("prefixoVeiculo")) document.getElementById("prefixoVeiculo").textContent = prefix;

    // Busca automática da quilometragem ao abrir os detalhes do veículo selecionado
    await buscarUltimaKilometragem(prefix);

    if (document.getElementById("modalConfirmacao")) document.getElementById("modalConfirmacao").style.display = "none";
    if (document.getElementById("modalDetalhesVeiculo")) document.getElementById("modalDetalhesVeiculo").style.display = "flex";
};

// FUNÇÃO DEDICADA: Consome sua API Spring Boot e popula o campo de forma segura
async function buscarUltimaKilometragem(prefix) {
    try {
        const response = await fetch(`http://localhost:8080/vehicle/${prefix}/last-final-km`);

        if (response.ok) {
            const data = await response.json();
            const kmInput = document.getElementById("quilometragem-inicial");

            if (kmInput) {
                // Caso o retorno do banco venha null/undefined por ser o primeiro uso do veículo, define como 0
                kmInput.value = (data.lastFinalKm !== undefined && data.lastFinalKm !== null) ? data.lastFinalKm : 0;
            }
        }
    } catch (error) {
        console.error("Erro ao buscar KM final:", error);
        mostrarToast("Erro ao conectar ao servidor para obter quilometragem.");
    }
}

window.voltarParaVeiculos = () => {
    if (document.getElementById("modalDetalhesVeiculo")) document.getElementById("modalDetalhesVeiculo").style.display = "none";
    if (document.getElementById("modalConfirmacao")) document.getElementById("modalConfirmacao").style.display = "flex";
};

// CONFIRMAR CHECK-IN
window.confirmarVeiculo = () => {
    localStorage.setItem("selectedVehicle", JSON.stringify(tempVehicle));
    localStorage.setItem("activeServiceId", "12345");
    fecharTodosModais();

    if (window.location.pathname.includes("chamados.html")) {
        window.location.href = "telainicial.html";
    } else {
        if (typeof carregarDadosTelaInicial === "function") carregarDadosTelaInicial();
        // Garante a atualização da quilometragem diretamente no painel da tela inicial ao confirmar
        buscarUltimaKilometragem(tempVehicle.prefix);
    }
};

// SALVAR INFORMAÇÕES DO VEÍCULO (API)
window.salvarVeiculoInfo = async function () {
    const mileageInput = document.getElementById("quilometragem-inicial")?.value;
    const notesInput = document.getElementById("observacoes")?.value;

    localStorage.setItem("km", mileageInput);
    localStorage.setItem("obs", notesInput);

    const vehicle = JSON.parse(localStorage.getItem('selectedVehicle'));

    if (vehicle && vehicle.prefix) {
        try {
            await fetch(`http://localhost:8080/vehicle/${vehicle.prefix}/update-data`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mileage: mileageInput,
                    observations: notesInput
                })
            });

            // Alterado para executar a lógica de UI correta do check-in após o sucesso da requisição
            alterarLayoutPosCheckin();
            mostrarToast1("Dados salvos!");
        } catch (error) {
            console.error("API error:", error);
            mostrarToast("Salvo localmente.");
        }
    }
};

// CADASTRAR VEÍCULO
window.cadastrarVeiculo = async function () {
    const payload = {
        prefix: document.getElementById("cad-prefixo")?.value,
        licensePlate: document.getElementById("cad-placa")?.value,
        typeId: document.getElementById("cad-tipo")?.value,
        color: document.getElementById("cad-cor")?.value,
        fuel: document.getElementById("cad-combustivel")?.value,
        currentKm: 0,
        nextOilChangeKm: 0
    };

    try {
        const response = await fetch("http://localhost:8080/vehicle/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            mostrarToast1("Veículo cadastrado com sucesso!");
        } else {
            mostrarToast("Erro ao cadastrar veículo.");
        }

    } catch (error) {
        console.error("API error:", error);
        mostrarToast("Erro de conexão.");
    }
};

// ABRIR FILTRO
function abrirModalFiltro() {
    document.getElementById('modalFiltroAvancado').style.display = 'flex';
}

function fecharModalFiltro() {
    document.getElementById('modalFiltroAvancado').style.display = 'none';
}

function aplicarFiltros() {
    const pesquisa = document.getElementById('inputPesquisa').value.toUpperCase();
    const tipo = document.getElementById('filtroTipo').value.toUpperCase();

    const botoes = document.querySelectorAll('.btn-veiculo');

    botoes.forEach(btn => {
        const txtBotao = btn.textContent.toUpperCase();
        const vTipo = btn.getAttribute('data-tipo').toUpperCase();

        const batePesquisa = txtBotao.includes(pesquisa);
        const bateTipo = (tipo === "TODOS" || vTipo === tipo);

        if (batePesquisa && bateTipo) {
            btn.style.display = "block";
        } else {
            btn.style.display = "none";
        }
    });

    fecharModalFiltro();
}

function filtrarVeiculos() {
    aplicarFiltros();
}

// POPUPS
const popupConfirmacao = document.getElementById('popupConfirmacao');
const popupSucesso = document.getElementById('popupSucesso');
const btncadastrar = document.getElementById('btncadastrar');
const btnCancelar = document.getElementById('btn-cancelar-confirmacao');
const btnConfirmarFinal = document.getElementById('btn-confirmar-final');
const btnFecharSucesso = document.getElementById('btn-fechar-sucesso');

<<<<<<< Updated upstream
    // NOVO: Carrega filtros dinamicamente
    carregarFiltrosDinamicos();

    // Configuração dos botões de cadastro (Tela do Gestor)
    const popupConfirmacaoCad = document.getElementById('popupConfirmacao');
    const btncadastrar = document.getElementById('btncadastrar');
    const btnConfirmarFinal = document.getElementById('btn-confirmar-final');
=======
btncadastrar?.addEventListener('click', () => {
    popupConfirmacao.style.display = 'flex';
});
>>>>>>> Stashed changes

btnCancelar?.addEventListener('click', () => {
    popupConfirmacao.style.display = 'none';
});

btnConfirmarFinal?.addEventListener('click', (e) => {
    e.preventDefault();
    popupConfirmacao.style.display = 'none';
    popupSucesso.style.display = 'flex';
});

btnFecharSucesso?.addEventListener('click', () => {
    popupSucesso.style.display = 'none';
});

// TOAST
function mostrarToast(mensagem) {
    const toast = document.getElementById("toast-aviso");
    if (toast) {
        toast.innerText = message; // Atribuindo dinamicamente a mensagem informada
        toast.style.display = "block";
        toast.classList.remove("toast-hidden");

        setTimeout(() => {
            toast.classList.add("toast-hidden");
            setTimeout(() => { toast.style.display = "none"; }, 500);
        }, 3000);
    }
}

function mostrarToast1(mensagem) {
    const toast = document.getElementById("toast-aviso1");
    if (toast) {
        toast.innerText = mensagem;
        toast.style.display = "block";
        toast.classList.remove("toast-hidden");

        setTimeout(() => {
            toast.classList.add("toast-hidden");
            setTimeout(() => { toast.style.display = "none"; }, 500);
        }, 3000);
    }
}

// UI CHECK-IN
// Alterada a assinatura de "salvarVeiculoInfo" para evitar conflito com a requisição da API
function alterarLayoutPosCheckin() {
    document.getElementById('grupo-km-inicial').style.display = 'none';
    document.getElementById('btn-salvar-veiculo').style.display = 'none';
    document.getElementById('btn-cancelar-veiculo').style.display = 'none';

    document.getElementById('grupo-km-final').style.display = 'block';
    document.getElementById('btn-abs-veiculo').style.display = 'inline-block';
    document.getElementById('btn-checkout').style.display = 'inline-block';
}

function cancelarVeiculoInfo() {
    document.getElementById('secao-pos-checkin').style.display = 'none';
    document.getElementById('info-veiculo-dados').style.display = 'none';
    document.getElementById('container-checkin-botao').style.display = 'block';
}

// PERSISTÊNCIA AUTOMÁTICA: Busca o KM no Spring Boot caso a página seja atualizada com o veículo ativo
document.addEventListener("DOMContentLoaded", () => {
    const savedVehicle = JSON.parse(localStorage.getItem('selectedVehicle'));
    if (savedVehicle && savedVehicle.prefix) {
        buscarUltimaKilometragem(savedVehicle.prefix);
    }
});