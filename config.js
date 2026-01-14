// config.js - Configurações da aplicação
const AppConfig = {
    // URL do Google Apps Script (mantenha a sua)
    GAS_URL: 'https://script.google.com/macros/s/AKfycbyk3Ra6onktTwcgfR5VD-7VmHjs7TjZy4ZtFeyyWFkanVBiWKz0KnD8V-FJjGEDfpLj0w/exec',
    
    // Configurações
    ITEMS_PER_PAGE: 20,
    DEBUG: true,
    
    // Modo de execução
    IS_LOCAL_FILE: window.location.protocol === 'file:',
    
    // URLs
    GITHUB_PAGES_URL: 'https://seu-usuario.github.io/estoque-app/',
    
    // Mensagens
    WARNINGS: {
        LOCAL_FILE: 'Arquivo executado localmente. Alguns recursos podem não funcionar devido a restrições de CORS.'
    }
};