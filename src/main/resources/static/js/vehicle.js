// SELEÇÃO DE VEÍCULO
let tempVehicle = {};

window.selecionarVeiculo = (title, model, brand, type, prefix, licensePlate) => {
    tempVehicle = { title, model, brand, type, prefix, licensePlate };
    
    if (document.getElementById("fotoVeiculo")) document.getElementById("fotoVeiculo").src = "img/carro 1.jpg";
    if (document.getElementById("modeloVeiculo")) document.getElementById("modeloVeiculo").textContent = model;
    if (document.getElementById("marcaVeiculo")) document.getElementById("marcaVeiculo").textContent = brand;
    if (document.getElementById("placaVeiculo")) document.getElementById("placaVeiculo").textContent = licensePlate;
    if (document.getElementById("prefixoVeiculo")) document.getElementById("prefixoVeiculo").textContent = prefix;
    
    if (document.getElementById("modalConfirmacao")) document.getElementById("modalConfirmacao").style.display = "none";
    if (document.getElementById("modalDetalhesVeiculo")) document.getElementById("modalDetalhesVeiculo").style.display = "flex";
};

window.voltarParaVeiculos = () => {
    if (document.getElementById("modalDetalhesVeiculo")) document.getElementById("modalDetalhesVeiculo").style.display = "none";
    if (document.getElementById("modalConfirmacao")) document.getElementById("modalConfirmacao").style.display = "flex";
};

// CONFIRMAR CHECK-IN
window.confirmarVeiculo = () => {
    localStorage.setItem("selectedVehicle", JSON.stringify(tempVehicle));
    fecharTodosModais(); // Depende do ui.js
    
    if (window.location.pathname.includes("chamados.html")) {
        window.location.href = "telainicial.html";
    } else {
        if (typeof carregarDadosTelaInicial === "function") carregarDadosTelaInicial();
    }
};

// SALVAR INFORMAÇÕES DO VEÍCULO (API)
window.salvarVeiculoInfo = async function() {
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
            alert("Dados salvos!");
        } catch (error) { 
            console.error("API error:", error);
            alert("Salvo localmente."); 
        }
    }
};
