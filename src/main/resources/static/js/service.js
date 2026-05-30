// --- CHECK-IN (Ao clicar em Salvar na tela inicial após escolher o carro) ---
window.salvarVeiculoInfo = async function() {
    const kmInput = document.getElementById("quilometragem-inicial")?.value;
    const obsInput = document.getElementById("observacoes")?.value;
    const matricula = localStorage.getItem("userRegistration");
    const vehicle = JSON.parse(localStorage.getItem('selectedVehicle'));

    if (!vehicle || !matricula) {
        mostrarToast("Erro: Matrícula do usuário ou veículo não encontrados.");
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/service/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                serviceId: localStorage.getItem("chamadoPendenteId") ? parseInt(localStorage.getItem("chamadoPendenteId")) : null, // <--- ADICIONE ESTA LINHA
                carPrefix: vehicle.prefix,
                userRegistration: matricula,
                recordKm: parseFloat(kmInput),
                note: obsInput
            })
        });

        if (response.ok) {
            const data = await response.json();
            // Salva o ID do serviço rodando para podermos fazer o check-out depois
            localStorage.setItem("activeServiceId", data.serviceId);
            localStorage.setItem("km", kmInput);
            localStorage.setItem("obs", obsInput);
            mostrarToast1("Check-in confirmado no sistema!");
        } else {
            mostrarToast("Erro ao realizar check-in no banco.");
        }
    } catch (error) {
        console.error("Erro na API:", error);
    }
};


// --- CHECK-OUT ---
window.checkoutChamado = async () => {
    const serviceId = localStorage.getItem("activeServiceId");

    // Pega o valor atual do input de KM para ser o KM de chegada
    const kmFinal = document.getElementById("quilometragem-inicial")?.value;

    if (!serviceId) {
        mostrarToast("Nenhum serviço ativo encontrado para fazer check-out.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/service/finalize/${serviceId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({recordKm: parseFloat(kmFinal) })
        });

        if (response.ok) {
            // Limpa o navegador
            localStorage.removeItem("selectedVehicle");
            localStorage.removeItem("km");
            localStorage.removeItem("obs");
            localStorage.removeItem("activeServiceId");

            // Abre o modal de sucesso do HTML
            const modal = document.getElementById("modalAvisoCheckout");
            if (modal) modal.style.display = "flex";
        } else {
            mostrarToast("Erro ao fazer o check-out no servidor.");
        }
    } catch (error) {
        console.error("Erro na API de Checkout:", error);
    }
};

window.finalizarCheckout = () => {
    window.location.reload();
};

//Função para mostrar o Toast
function mostrarToast(mensagem) {
    const toast = document.getElementById("toast-aviso");
    if (toast) {
        toast.innerText = mensagem;
        toast.style.display = "block";
        toast.classList.remove("toast-hidden");

        // Esconde após 3 segundos
        setTimeout(() => {
            toast.classList.add("toast-hidden");
            setTimeout(() => { toast.style.display = "none"; }, 500);
        }, 3000);
    }
}

//Função para mostrar o Toast
function mostrarToast1(mensagem) {
    const toast = document.getElementById("toast-aviso1");
    if (toast) {
        toast.innerText = mensagem;
        toast.style.display = "block";
        toast.classList.remove("toast-hidden");

        // Esconde após 3 segundos
        setTimeout(() => {
            toast.classList.add("toast-hidden");
            setTimeout(() => { toast.style.display = "none"; }, 500);
        }, 3000);
    }
}

window.carregarChamadosDisponiveis = async function() {
    const token = localStorage.getItem("userToken");
    const container = document.getElementById("lista-chamados-container");

    if (!container) return;

    try {
        const response = await fetch("http://localhost:8080/service/pending", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            const chamados = await response.json();

            if (chamados.length === 0) {
                container.innerHTML = `<p style="text-align: center; color: #666;">Nenhum chamado disponível no momento.</p>`;
                return;
            }

            container.innerHTML = "";

            chamados.forEach(chamado => {
                const card = `
                    <div class="chamado-card">
                        <h2 class="chamado-titulo">Serviço #${chamado.id} - Prioridade: ${chamado.priority}</h2>
                        <div class="chamado-conteudo">
                            <p><strong>Destino/Cliente:</strong> ${chamado.destinationRequester || 'Não informado'}</p>
                            <p><strong>Descrição:</strong> ${chamado.description || 'Sem descrição'}</p>
                            <p><strong>Previsão:</strong> ${chamado.expectedCompletionTime ? new Date(chamado.expectedCompletionTime).toLocaleDateString('pt-BR') : 'Sem data'}</p>
                        </div>
                        <button class="btn-aceitar" onclick="prepararAceiteChamado(${chamado.id})">
                            Aceitar chamado
                        </button>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', card);
            });
        } else {
            container.innerHTML = `<p style="text-align: center; color: red;">Erro ao carregar chamados.</p>`;
        }
    } catch (error) {
        console.error("Erro ao buscar chamados:", error);
        container.innerHTML = `<p style="text-align: center; color: red;">Falha de conexão com o servidor.</p>`;
    }
};


window.prepararAceiteChamado = function(idChamado) {

    localStorage.setItem("chamadoPendenteId", idChamado);


    if(typeof abrirModalConfirmacao === "function") {
        abrirModalConfirmacao();
    }
}

/
document.addEventListener("DOMContentLoaded", () => {
    carregarChamadosDisponiveis();
});