// data.js - Gerenciamento de dados da aplicação
const DataManager = {
    // URL do Google Apps Script Web App
    GAS_URL: 'https://script.google.com/macros/s/AKfycby4X7YDYnIg6R_DRzdRTDBAjZur6uxItQ6p_4k4PsfO_n3I-OYVkjVKwbqheGZUwRe46g/exec',
    
    // Dados da aplicação
    itemsData: [],
    currentPage: 1,
    itemsPerPage: 20,
    
    // Inicializar dados
    init() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('reportDate').value = today;
    },
    
    // Carregar dados da planilha
    async loadData() {
        const loadingElement = document.getElementById('loading');
        const tableContainer = document.getElementById('tableContainer');
        
        loadingElement.style.display = 'block';
        tableContainer.innerHTML = '';
        
        try {
            await this.loadFromGoogleSheets();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            loadingElement.style.display = 'none';
            this.createSampleData();
        }
    },
    
    // Carregar dados do Google Sheets
    async loadFromGoogleSheets() {
        return new Promise((resolve, reject) => {
            const callbackName = 'handleInventoryData';
            const script = document.createElement('script');
            script.src = `${this.GAS_URL}?action=getData&callback=${callbackName}`;
            
            window[callbackName] = (data) => {
                this.itemsData = data.map(item => ({
                    ...item,
                    updatedStock: item.currentStock,
                    purchaseQty: 0
                }));
                
                TableRenderer.renderTable();
                this.updateItemCount();
                document.getElementById('loading').style.display = 'none';
                
                resolve(data);
                document.body.removeChild(script);
                delete window[callbackName];
            };
            
            script.onerror = () => {
                document.getElementById('loading').style.display = 'none';
                this.createSampleData();
                reject(new Error('Falha ao carregar dados'));
            };
            
            document.body.appendChild(script);
        });
    },
    
    // Criar dados de exemplo
    createSampleData() {
        const sampleItems = [
            {id: 1, name: "Papel A4", currentStock: 5, minStock: 10, updatedStock: 5, purchaseQty: 0},
            {id: 2, name: "Caneta Azul", currentStock: 25, minStock: 15, updatedStock: 25, purchaseQty: 0},
            {id: 3, name: "Clips para Papel", currentStock: 8, minStock: 20, updatedStock: 8, purchaseQty: 0},
            {id: 4, name: "Grampeador", currentStock: 3, minStock: 5, updatedStock: 3, purchaseQty: 0},
            {id: 5, name: "Cartucho Tinta Preto", currentStock: 12, minStock: 8, updatedStock: 12, purchaseQty: 0},
            {id: 6, name: "Resma de Papel", currentStock: 2, minStock: 5, updatedStock: 2, purchaseQty: 0},
            {id: 7, name: "Marcador Permanente", currentStock: 18, minStock: 10, updatedStock: 18, purchaseQty: 0},
            {id: 8, name: "Fita Adesiva", currentStock: 7, minStock: 15, updatedStock: 7, purchaseQty: 0},
            {id: 9, name: "Post-it", currentStock: 4, minStock: 8, updatedStock: 4, purchaseQty: 0},
            {id: 10, name: "Agenda 2024", currentStock: 6, minStock: 5, updatedStock: 6, purchaseQty: 0},
            {id: 11, name: "Pasta Suspensa", currentStock: 15, minStock: 20, updatedStock: 15, purchaseQty: 0},
            {id: 12, name: "Envelope", currentStock: 50, minStock: 30, updatedStock: 50, purchaseQty: 0},
            {id: 13, name: "Lápis", currentStock: 9, minStock: 25, updatedStock: 9, purchaseQty: 0},
            {id: 14, name: "Borracha", currentStock: 7, minStock: 10, updatedStock: 7, purchaseQty: 0},
            {id: 15, name: "Apontador", currentStock: 4, minStock: 8, updatedStock: 4, purchaseQty: 0},
            {id: 16, name: "Régua 30cm", currentStock: 6, minStock: 5, updatedStock: 6, purchaseQty: 0},
            {id: 17, name: "Tesoura", currentStock: 3, minStock: 6, updatedStock: 3, purchaseQty: 0},
            {id: 18, name: "Cola Bastão", currentStock: 11, minStock: 10, updatedStock: 11, purchaseQty: 0},
            {id: 19, name: "Caneta Vermelha", currentStock: 14, minStock: 12, updatedStock: 14, purchaseQty: 0},
            {id: 20, name: "Marcador de Texto", currentStock: 8, minStock: 15, updatedStock: 8, purchaseQty: 0}
        ];
        
        this.itemsData = sampleItems;
        TableRenderer.renderTable();
        this.updateItemCount();
        
        alert('Dados de exemplo carregados. Configure o Google Apps Script para conectar com sua planilha real.');
    },
    
    // Atualizar contador de itens
    updateItemCount() {
        document.getElementById('itemCount').textContent = 
            `${this.itemsData.length} itens carregados`;
    },
    
    // Limpar todas as alterações
    clearAll() {
        if (confirm('Tem certeza que deseja limpar todas as alterações?')) {
            this.itemsData.forEach((item, index) => {
                const checkbox = document.getElementById(`changed-${index}`);
                const updatedInput = document.getElementById(`updatedQty-${index}`);
                const purchaseInput = document.getElementById(`purchaseQty-${index}`);
                
                if (checkbox) checkbox.checked = false;
                if (updatedInput) {
                    updatedInput.value = item.currentStock;
                    updatedInput.disabled = true;
                }
                if (purchaseInput) purchaseInput.value = 0;
                
                // Atualiza dados locais
                item.updatedStock = item.currentStock;
                item.purchaseQty = 0;
                
                // Atualiza status
                TableRenderer.updateItemStatus(index);
            });
        }
    },
    
    // Coletar todos os dados para relatório
    collectReportData() {
        return {
            date: document.getElementById('reportDate').value,
            items: this.itemsData,
            totalItems: this.itemsData.length,
            itemsToReorder: this.itemsData.filter(item => {
                const currentValue = item.updatedStock || item.currentStock;
                return currentValue <= item.minStock;
            }).length
        };
    }
};