// pdf-generator.js - Lógica de geração de PDF
const PDFGenerator = {
    // Gerar PDF com todos os dados
    async generatePDF() {
        // Coletar todos os dados atualizados
        this.saveAllCurrentData();
        
        // Preparar dados para o relatório
        const reportData = DataManager.collectReportData();
        
        try {
            // Mostrar loading
            const loadingElement = document.getElementById('loading');
            loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando PDF...';
            loadingElement.style.display = 'block';
            
            // Enviar dados para o Google Apps Script
            const response = await fetch(DataManager.GAS_URL + '?action=generatePDF', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'data=' + encodeURIComponent(JSON.stringify(reportData))
            });
            
            // Esconder loading
            loadingElement.style.display = 'none';
            
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor');
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Abrir o PDF em uma nova aba
                window.open(result.url, '_blank');
                alert('PDF gerado com sucesso!');
            } else {
                throw new Error(result.error || 'Erro ao gerar PDF');
            }
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.fallbackPrint();
        }
    },
    
    // Salvar todos os dados da interface antes de gerar PDF
    saveAllCurrentData() {
        DataManager.itemsData.forEach((item, index) => {
            const updatedQtyInput = document.getElementById(`updatedQty-${index}`);
            const purchaseQtyInput = document.getElementById(`purchaseQty-${index}`);
            
            if (updatedQtyInput) {
                const updatedQty = parseInt(updatedQtyInput.value) || item.currentStock;
                item.updatedStock = updatedQty;
            }
            
            if (purchaseQtyInput) {
                const purchaseQty = parseInt(purchaseQtyInput.value) || 0;
                item.purchaseQty = purchaseQty;
            }
        });
    },
    
    // Fallback para impressão do navegador
    fallbackPrint() {
        if (confirm('Não foi possível gerar o PDF automaticamente. Deseja usar a impressão do navegador?')) {
            // Criar uma versão para impressão com todos os itens
            this.createPrintableVersion();
            
            // Esperar um momento para renderizar
            setTimeout(() => {
                window.print();
                
                // Restaurar a interface original
                setTimeout(() => {
                    TableRenderer.renderTable();
                }, 1000);
            }, 500);
        } else {
            alert('Erro ao gerar PDF. Tente novamente mais tarde.');
        }
    },
    
    // Criar versão para impressão com todos os itens
    createPrintableVersion() {
        const tableContainer = document.getElementById('tableContainer');
        let printableHTML = `
            <div class="print-header">
                <h2>RELATÓRIO COMPLETO DE ESTOQUE</h2>
                <p>Data: ${document.getElementById('reportDate').value}</p>
                <p>Total de Itens: ${DataManager.itemsData.length}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Item</th>
                        <th>Estoque Atual</th>
                        <th>Mínimo</th>
                        <th>Qtd. Atualizada</th>
                        <th>Qtd. Comprar</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        DataManager.itemsData.forEach((item, index) => {
            const needsReorder = (item.updatedStock || item.currentStock) <= item.minStock;
            
            printableHTML += `
                <tr class="${needsReorder ? 'needs-reorder' : ''}">
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.currentStock}</td>
                    <td>${item.minStock}</td>
                    <td>${item.updatedStock || item.currentStock}</td>
                    <td>${item.purchaseQty || 0}</td>
                    <td>
                        ${needsReorder ? 
                            '<i class="fas fa-exclamation-triangle" style="color:#e74c3c;"></i> Repor' : 
                            '<i class="fas fa-check" style="color:#2ecc71;"></i> OK'}
                    </td>
                </tr>
            `;
        });
        
        // Adicionar resumo
        const itemsToReorder = DataManager.itemsData.filter(item => {
            const currentValue = item.updatedStock || item.currentStock;
            return currentValue <= item.minStock;
        }).length;
        
        printableHTML += `
                </tbody>
            </table>
            <div class="print-summary" style="margin-top: 30px; page-break-before: always;">
                <h3>RESUMO DO RELATÓRIO</h3>
                <p>Total de itens: ${DataManager.itemsData.length}</p>
                <p>Itens que necessitam reposição: ${itemsToReorder}</p>
                <p>Data de geração: ${new Date().toLocaleString()}</p>
            </div>
        `;
        
        tableContainer.innerHTML = printableHTML;
    }
};