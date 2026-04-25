// ABASTECIMENTO
window.abrirPopupAbastecimento = () => {
    const popup = document.getElementById("popupAbastecimento");
    if (popup) popup.style.display = "flex";
};

window.fecharAbastecimento = () => {
    const popup = document.getElementById("popupAbastecimento");
    if (popup) popup.style.display = "none";
};

// FAZER CHECK-OUT
window.checkoutChamado = () => {
    localStorage.removeItem("selectedVehicle");
    localStorage.removeItem("km");
    localStorage.removeItem("obs");
    
    const modal = document.getElementById("modalAvisoCheckout");
    if (modal) modal.style.display = "flex";
};

window.finalizarCheckout = () => { 
    window.location.reload(); 
};
