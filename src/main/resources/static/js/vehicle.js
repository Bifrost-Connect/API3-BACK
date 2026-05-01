let tempVehicle = {};

window.selecionarVeiculo = (title, model, brand, type, prefix, licensePlate, id) => {
    tempVehicle = { title, model, brand, type, prefix, licensePlate, id }; // Adicionado ID

    const elements = {
        foto: document.getElementById("fotoVeiculo"),
        modelo: document.getElementById("modeloVeiculo"),
        marca: document.getElementById("marcaVeiculo"),
        placa: document.getElementById("placaVeiculo"),
        prefixo: document.getElementById("prefixoVeiculo")
    };

    if (elements.foto) elements.foto.src = "img/carro 1.jpg";
    if (elements.modelo) elements.modelo.textContent = model;
    if (elements.marca) elements.marca.textContent = brand;
    if (elements.placa) elements.placa.textContent = licensePlate;
    if (elements.prefixo) elements.prefixo.textContent = prefix;

    document.getElementById("modalConfirmacao").style.display = "none";
    document.getElementById("modalDetalhesVeiculo").style.display = "flex";
};

window.confirmarVeiculo = () => {
    localStorage.setItem("selectedVehicle", JSON.stringify(tempVehicle));
    fecharTodosModais();
    if (window.location.pathname.includes("chamados.html")) {
        window.location.href = "telainicial.html";
    } else if (typeof carregarDadosTelaInicial === "function") {
        carregarDadosTelaInicial();
    }
};

window.atualizarDadosVeiculo = async function () {
    const mileageInput = document.getElementById("quilometragem-inicial")?.value;
    const notesInput = document.getElementById("observacoes")?.value;
    const vehicle = JSON.parse(localStorage.getItem('selectedVehicle'));

    if (vehicle && vehicle.prefix) {
        try {
            const response = await apiFetch(`/vehicle/${vehicle.prefix}/update-data`, {
                method: 'PATCH',
                body: JSON.stringify({
                    mileage: parseFloat(mileageInput),
                    observations: notesInput
                })
            });
            if (response && response.ok) {
                localStorage.setItem("km", mileageInput);
                localStorage.setItem("obs", notesInput);
                alert("Dados salvos no servidor!");
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
        }
    }
};

window.cadastrarVeiculo = async function () {
    const payload = {
        prefix: document.getElementById("cad-prefixo")?.value,
        licensePlate: document.getElementById("cad-placa")?.value,
        color: document.getElementById("cad-cor")?.value,
        fuel: document.getElementById("cad-combustivel")?.value,
        type: { id: parseInt(document.getElementById("cad-tipo")?.value) }, // Objeto esperado pelo Hibernate
        currentKm: 0.0,
        available: true
    };

    try {
        const response = await apiFetch("/vehicle/register", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        if (response && response.ok) alert("Veículo cadastrado!");
    } catch (error) {
        console.error("Erro de conexão:", error);
    }
};

window.registrarAbastecimento = async function () {
    const valor = document.getElementById("valor-abastecimento")?.value;
    const data = document.getElementById("data-abastecimento")?.value;
    const vehicle = JSON.parse(localStorage.getItem('selectedVehicle'));

    if (!vehicle?.id) return alert("Selecione um veículo primeiro.");

    try {
        const response = await apiFetch(`/vehicle/${vehicle.id}/fuel`, {
            method: "POST",
            body: JSON.stringify({ value: valor, date: data })
        });
        if (response?.ok) {
            alert("Abastecimento registrado!");
            fecharTodosModais();
        }
    } catch (e) { console.error(e); }
};