window.salvarVeiculoInfo = async function() {
    const kmInput = document.getElementById("quilometragem-inicial")?.value;
    const obsInput = document.getElementById("observacoes")?.value;
    const destinoInput = document.getElementById("destino-requisitante")?.value || "Não informado";

    const matricula = localStorage.getItem("userRegistration");
    const vehicle = JSON.parse(localStorage.getItem('selectedVehicle'));

    if (!vehicle || !matricula) {
        alert("Erro: Matrícula do usuário ou veículo não encontrados.");
        return;
    }

    try {
        const response = await apiFetch("/service/start", {
            method: "POST",
            body: JSON.stringify({
                carPrefix: vehicle.prefix,
                userRegistration: matricula,
                recordKm: parseFloat(kmInput),
                note: obsInput,
                destinationRequester: destinoInput,
                priority: "MEDIUM"
            })
        });

        if (response && response.ok) {
            const data = await response.json();
            localStorage.setItem("activeServiceId", data.id || data.serviceId);
            localStorage.setItem("km", kmInput);
            localStorage.setItem("obs", obsInput);
            alert("Check-in confirmado no sistema!");
        } else {
            alert("Erro ao realizar check-in no banco.");
        }
    } catch (error) {
        console.error("Erro na API:", error);
    }
};

window.checkoutChamado = async () => {
    const serviceId = localStorage.getItem("activeServiceId");
    const kmFinalValue = document.getElementById("quilometragem-inicial")?.value;

    if (!serviceId) {
        alert("Nenhum serviço ativo encontrado.");
        return;
    }

    try {
        const response = await apiFetch(`/service/finalize/${serviceId}`, {
            method: "POST",
            body: JSON.stringify({ kmFinal: parseFloat(kmFinalValue) })
        });

        if (response && response.ok) {
            localStorage.removeItem("selectedVehicle");
            localStorage.removeItem("km");
            localStorage.removeItem("obs");
            localStorage.removeItem("activeServiceId");

            const modal = document.getElementById("modalAvisoCheckout");
            if (modal) modal.style.display = "flex";
        } else {
            alert("Erro ao fazer o check-out no servidor.");
        }
    } catch (error) {
        console.error("Erro na API de Checkout:", error);
    }
};