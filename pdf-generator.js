// pdf-generator.js - Versão simplificada
const PDFGenerator = {
    // Gerar PDF
    async generatePDF() {
        // Coletar dados
        const reportData = DataManager.collectReportData();
        
        // Mostrar loading
        const loadingElement = document.getElementById('loading');
        loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando relatório...';
        loadingElement.style.display = 'block';
        
        // Se estiver em modo local, usar impressão do navegador
        if (AppConfig.IS_LOCAL_FILE) {
            loadingElement.style.display = 'none';
            this.generateLocalPDF(reportData);
            return;
        }
        
        // Se estiver online, tentar usar o Google Apps Script
        try {
            const response = await this.sendToGAS(reportData);
            loadingElement.style.display = 'none';
            
            if (response.success && response.url) {
                window.open(response.url, '_blank');
                alert('PDF gerado com sucesso!');
            } else {
                throw new Error(response.error || 'Erro ao gerar PDF');
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            loadingElement.style.display = 'none';
            this.generateLocalPDF(reportData);
        }
    },
    
    // Enviar para Google Apps Script
    async sendToGAS(reportData) {
        const formData = new FormData();
        formData.append('data', JSON.stringify(reportData));
        
        const response = await fetch(`${AppConfig.GAS_URL}?action=generatePDF`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    },
    
    // Gerar PDF local (imprimir)
    generateLocalPDF(reportData) {
        if (confirm('Para gerar PDF, use a impressão do navegador. Deseja continuar?')) {
            // Criar versão para impressão
            this.createPrintableVersion(reportData);
            
            // Aguardar renderização e imprimir
            setTimeout(() => {
                window.print();
                
                // Restaurar após impressão
                setTimeout(() => {
                    TableRenderer.renderTable();
                }, 500);
            }, 300);
        }
    },
    
    // Criar versão para impressão
    createPrintableVersion(reportData) {
        const tableContainer = document.getElementById('tableContainer');
        const date = new Date(reportData.date).toLocaleDateString('pt-BR');
        
        let html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2>RELATÓRIO DE ESTOQUE</h2>
                    <p><strong>Data:</strong> ${date}</p>
                    <p><strong>Total de Itens:</strong> ${reportData.totalItems}</p>
                    <p><strong>Itens para Repor:</strong> ${reportData.itemsToReorder}</p>
                </div>
                
                <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
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
        
        reportData.items.forEach(item => {
            const currentValue = item.updatedStock || item.currentStock;
            const needsReorder = currentValue <= item.minStock;
            
            html += `
                <tr style="${needsReorder ? 'background-color: #ffebee;' : ''}">
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.currentStock}</td>
                    <td>${item.minStock}</td>
                    <td>${currentValue}</td>
                    <td>${item.purchaseQty || 0}</td>
                    <td>${needsReorder ? 'REPOR' : 'OK'}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
                
                <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #000;">
                    <div style="float: left; width: 50%;">
                        <p><strong>Data do Relatório:</strong></p>
                        <p>${date}</p>
                    </div>
                    <div style="float: right; width: 50%; text-align: center;">
                        <p>_________________________________</p>
                        <p><strong>Assinatura do Responsável</strong></p>
                    </div>
                    <div style="clear: both;"></div>
                </div>
            </div>
        `;
        
        tableContainer.innerHTML = html;
    }
};