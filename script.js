// script.js - Lógica principal da aplicação
const TableRenderer = {
    // Renderizar a tabela com os dados
    renderTable() {
        if (!DataManager.itemsData || DataManager.itemsData.length === 0) {
            this.showEmptyTable();
            return;
        }
        
        const tableContainer = document.getElementById('tableContainer');
        const totalPages = Math.ceil(DataManager.itemsData.length / DataManager.itemsPerPage);
        const startIndex = (DataManager.currentPage - 1) * DataManager.itemsPerPage;
        const endIndex = Math.min(startIndex + DataManager.itemsPerPage, DataManager.itemsData.length);
        const pageItems = DataManager.itemsData.slice(startIndex, endIndex);
        
        let tableHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                <strong>Página ${DataManager.currentPage} de ${totalPages}</strong> | 
                Mostrando ${startIndex + 1} a ${endIndex} de ${DataManager.itemsData.length} itens
            </div>
            <table>
                <thead>
                    <tr>
                        <th width="5%">ID</th>
                        <th width="30%">Item</th>
                        <th width="10%">Estoque Atual</th>
                        <th width="10%">Mínimo</th>
                        <th width="10%" class="checkbox-cell">Alteração?</th>
                        <th width="10%">Qtd. Atualizada</th>
                        <th width="15%">Qtd. Comprar</th>
                        <th width="10%">Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        pageItems.forEach((item, index) => {
            const globalIndex = startIndex + index;
            const currentValue = item.updatedStock || item.currentStock;
            const needsReorder = currentValue <= item.minStock;
            const rowClass = needsReorder ? 'needs-reorder' : '';
            
            tableHTML += `
                <tr class="${rowClass}" data-index="${globalIndex}">
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.currentStock}</td>
                    <td>${item.minStock}</td>
                    <td class="checkbox-cell">
                        <input type="checkbox" id="changed-${globalIndex}" 
                               onchange="TableRenderer.toggleUpdatedQty(${globalIndex})">
                    </td>
                    <td>
                        <input type="number" id="updatedQty-${globalIndex}" 
                               min="0" value="${currentValue}" 
                               disabled onchange="TableRenderer.updateItem(${globalIndex})">
                    </td>
                    <td>
                        <input type="number" id="purchaseQty-${globalIndex}" 
                               min="0" value="${item.purchaseQty || 0}" 
                               onchange="TableRenderer.updateItem(${globalIndex})"
                               class="${needsReorder ? 'highlight' : ''}">
                    </td>
                    <td>
                        <span id="status-${globalIndex}">
                            ${needsReorder ? 
                                '<i class="fas fa-exclamation-triangle" style="color:#e74c3c;"></i> Repor' : 
                                '<i class="fas fa-check" style="color:#2ecc71;"></i> OK'}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        // Adicionar controles de paginação se necessário
        if (totalPages > 1) {
            tableHTML += `
                <div class="pagination-controls">
                    <button class="btn btn-primary" onclick="TableRenderer.changePage(${DataManager.currentPage - 1})" 
                            ${DataManager.currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i> Anterior
                    </button>
                    <span class="page-info">
                        Página ${DataManager.currentPage} de ${totalPages}
                    </span>
                    <button class="btn btn-primary" onclick="TableRenderer.changePage(${DataManager.currentPage + 1})" 
                            ${DataManager.currentPage === totalPages ? 'disabled' : ''}>
                        Próxima <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            `;
        }
        
        tableContainer.innerHTML = tableHTML;
    },
    
    // Mostrar tabela vazia
    showEmptyTable() {
        const tableContainer = document.getElementById('tableContainer');
        tableContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background-color: #f8f9fa; border-radius: 10px;">
                <i class="fas fa-box-open" style="font-size: 48px; color: #bdc3c7; margin-bottom: 20px;"></i>
                <h3 style="color: #7f8c8d;">Nenhum item carregado</h3>
                <p style="color: #95a5a6;">Clique em "Carregar Dados" para começar.</p>
                <button class="btn btn-primary" onclick="DataManager.loadData()" style="margin-top: 20px;">
                    <i class="fas fa-sync-alt"></i> Carregar Dados
                </button>
            </div>
        `;
    },
    
    // Mudar de página
    changePage(page) {
        const totalPages = Math.ceil(DataManager.itemsData.length / DataManager.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        DataManager.currentPage = page;
        this.renderTable();
    },
    
    // Habilitar/desabilitar quantidade atualizada
    toggleUpdatedQty(index) {
        const checkbox = document.getElementById(`changed-${index}`);
        const input = document.getElementById(`updatedQty-${index}`);
        input.disabled = !checkbox.checked;
        
        if (!checkbox.checked) {
            input.value = DataManager.itemsData[index].currentStock;
        }
        
        this.updateItem(index);
    },
    
    // Atualizar um item
    updateItem(index) {
        const updatedQty = document.getElementById(`updatedQty-${index}`).value;
        const purchaseQty = document.getElementById(`purchaseQty-${index}`).value;
        
        // Atualiza os dados locais
        DataManager.itemsData[index].updatedStock = parseInt(updatedQty) || DataManager.itemsData[index].currentStock;
        DataManager.itemsData[index].purchaseQty = parseInt(purchaseQty) || 0;
        
        // Atualiza status
        this.updateItemStatus(index);
    },
    
    // Atualizar status do item
    updateItemStatus(index) {
        const statusElement = document.getElementById(`status-${index}`);
        const purchaseInput = document.getElementById(`purchaseQty-${index}`);
        const currentValue = DataManager.itemsData[index].updatedStock || DataManager.itemsData[index].currentStock;
        const minStock = DataManager.itemsData[index].minStock;
        
        if (currentValue <= minStock) {
            statusElement.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#e74c3c;"></i> Repor';
            if (purchaseInput) purchaseInput.classList.add('highlight');
        } else {
            statusElement.innerHTML = '<i class="fas fa-check" style="color:#2ecc71;"></i> OK';
            if (purchaseInput) purchaseInput.classList.remove('highlight');
        }
    }
};

// Objeto principal da aplicação
const InventoryApp = {
    init() {
        console.log('Inicializando aplicação de estoque...');
        
        // Inicializar dados
        DataManager.init();
        
        // Configurar event listeners
        document.getElementById('loadDataBtn').addEventListener('click', () => {
            DataManager.loadData();
        });
        
        document.getElementById('generatePDFBtn').addEventListener('click', () => {
            PDFGenerator.generatePDF();
        });
        
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            DataManager.clearAll();
        });
        
        // Carregar dados automaticamente
        DataManager.loadData();
    }
};