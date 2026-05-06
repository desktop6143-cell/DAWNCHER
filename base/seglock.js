if (sessionStorage.getItem('logado') !== 'true') {
    // Verifica se já não estamos na página de login para evitar loop infinito
    if (!window.location.href.includes("index.html")) {
        window.location.href = "../index.html"; 
    }
}
