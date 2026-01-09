// data.js - Gerenciamento de dados (versão simplificada)
const DataManager = {
    // Dados da aplicação
    itemsData: [],
    currentPage: 1,
    itemsPerPage: AppConfig.ITEMS_PER_PAGE,
    isUsingSampleData: false,
    isLoading: false,
    
    // Inicializar dados
    init() {
        console.log('DataManager inicializado');
        console.log('URL do GAS:', AppConfig.GAS_URL);
        console.log('Executando localmente?', AppConfig.IS_LOCAL_FILE);
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('reportDate').value = today;
        
        // Mostrar aviso se estiver executando localmente
        if (AppConfig.IS_LOCAL_FILE) {
            this.showLocalFileWarning();
        }
    },
    
    // Mostrar aviso para arquivo local
    showLocalFileWarning() {
        const warningHTML = `
            <div style="position: fixed; top: 10px; right: 10px; left: 10px; background: #f39c12; color: white; padding: 10px; border-radius: 5px; z-index: 10000; box-shadow: 0 3px 10px rgba(0,0,0,0.2);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div style="flex: 1;">
                        <strong>Atenção:</strong> Arquivo executado localmente. Para carregar dados do Google Sheets, 
                        <a href="${AppConfig.GITHUB_PAGES_URL}" target="_blank" style="color: white; text-decoration: underline;">
                            acesse a versão online
                        </a>
                        ou use um servidor local.
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer;">×</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', warningHTML);
    },
    
    // Carregar dados da planilha
    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const loadingElement = document.getElementById('loading');
        const tableContainer = document.getElementById('tableContainer');
        
        loadingElement.style.display = 'block';
        tableContainer.innerHTML = '';
        
        // Verifica se estamos em arquivo local
        if (AppConfig.IS_LOCAL_FILE) {
            loadingElement.innerHTML = '<i class="fas fa-info-circle"></i> Modo local: carregando dados de exemplo...';
            
            // Espera 1 segundo para mostrar a mensagem
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            loadingElement.style.display = 'none';
            this.createSampleData();
            this.isLoading = false;
            return;
        }
        
        // Modo online - tenta carregar do Google Sheets
        loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando ao Google Sheets...';
        
        try {
            await this.loadFromGoogleSheets();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            loadingElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + error.message;
            
            // Aguarda 2 segundos e carrega dados de exemplo
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            loadingElement.style.display = 'none';
            this.createSampleData();
        } finally {
            this.isLoading = false;
        }
    },
    
    // Carregar dados do Google Sheets via JSONP (funciona mesmo com CORS)
    async loadFromGoogleSheets() {
        return new Promise((resolve, reject) => {
            const callbackName = 'handleInventoryData_' + Date.now();
            const script = document.createElement('script');
            
            // Timeout de 10 segundos
            const timeoutId = setTimeout(() => {
                if (window[callbackName]) delete window[callbackName];
                if (script.parentNode) document.body.removeChild(script);
                reject(new Error('Timeout: Não foi possível conectar ao Google Sheets'));
            }, 10000);
            
            // Função de callback
            window[callbackName] = (response) => {
                clearTimeout(timeoutId);
                
                // Limpar o script
                if (script.parentNode) document.body.removeChild(script);
                delete window[callbackName];
                
                // Verificar se há erro
                if (response && response.error) {
                    reject(new Error(`Erro no Google Sheets: ${response.error}`));
                    return;
                }
                
                // Validar dados recebidos
                if (!Array.isArray(response)) {
                    reject(new Error('Formato de dados inválido recebido do Google Sheets'));
                    return;
                }
                
                // Processar dados
                this.itemsData = response.map((item, index) => ({
                    id: item.id || index + 1,
                    name: item.name || 'Item sem nome',
                    currentStock: parseInt(item.currentStock) || 0,
                    minStock: parseInt(item.minStock) || 0,
                    updatedStock: parseInt(item.currentStock) || 0,
                    purchaseQty: 0
                }));
                
                this.isUsingSampleData = false;
                TableRenderer.renderTable();
                this.updateItemCount();
                document.getElementById('loading').style.display = 'none';
                
                console.log(`${this.itemsData.length} itens carregados do Google Sheets`);
                resolve(response);
            };
            
            // Configurar erro no script
            script.onerror = () => {
                clearTimeout(timeoutId);
                if (script.parentNode) document.body.removeChild(script);
                if (window[callbackName]) delete window[callbackName];
                reject(new Error('Falha ao carregar dados do Google Sheets'));
            };
            
            // URL com callback (usando JSONP para evitar CORS)
            const url = `${AppConfig.GAS_URL}?action=getData&callback=${callbackName}&t=${Date.now()}`;
            script.src = url;
            
            // Adicionar script à página
            document.body.appendChild(script);
        });
    },
    
    // Criar dados de exemplo
    createSampleData() {
        console.log('Criando dados de exemplo...');
        
        const sampleItems = [
            {id: 1, name: "Papel A4 75g", currentStock: 5, minStock: 10},
            {id: 2, name: "Caneta Esferográfica Azul", currentStock: 25, minStock: 15},
            {id: 3, name: "Clips para Papel Nº 1", currentStock: 8, minStock: 20},
            {id: 4, name: "Grampeador Compacto", currentStock: 3, minStock: 5},
            {id: 5, name: "Cartucho de Tinta Preto", currentStock: 12, minStock: 8},
            {id: 6, name: "Resma de Papel Fotográfico", currentStock: 2, minStock: 5},
            {id: 7, name: "Marcador Permanente Preto", currentStock: 18, minStock: 10},
            {id: 8, name: "Fita Adesiva Transparente", currentStock: 7, minStock: 15},
            {id: 9, name: "Bloco de Notas Post-it", currentStock: 4, minStock: 8},
            {id: 10, name: "Agenda Executiva 2024", currentStock: 6, minStock: 5}
        ];
        
        this.itemsData = sampleItems.map(item => ({
            ...item,
            updatedStock: item.currentStock,
            purchaseQty: 0
        }));
        
        this.isUsingSampleData = true;
        TableRenderer.renderTable();
        this.updateItemCount();
        
        // Mostrar instruções para usar online
        this.showOnlineInstructions();
    },
    
    // Mostrar instruções para usar online
    showOnlineInstructions() {
        const tableContainer = document.getElementById('tableContainer');
        
        const instructionsHTML = `
            <div style="margin-top: 30px; padding: 20px; background-color: #e3f2fd; border-radius: 10px; border-left: 5px solid #2196f3;">
                <h4 style="color: #1565c0; margin-bottom: 15px;">
                    <i class="fas fa-cloud-upload-alt"></i> Como usar com seus dados reais:
                </h4>
                <ol style="color: #1565c0; margin-left: 20px;">
                    <li><strong>Hospede esta aplicação online:</strong>
                        <ul style="margin-top: 5px;">
                            <li>Opção 1: <a href="https://pages.github.com/" target="_blank">GitHub Pages</a> (gratuito)</li>
                            <li>Opção 2: <a href="https://vercel.com/" target="_blank">Vercel</a> (gratuito)</li>
                            <li>Opção 3: <a href="https://netlify.com/" target="_blank">Netlify</a> (gratuito)</li>
                        </ul>
                    </li>
                    <li><strong>Configure o Google Apps Script:</strong>
                        <ul style="margin-top: 5px;">
                            <li>Acesse <a href="https://script.google.com/" target="_blank">Google Apps Script</a></li>
                            <li>Cole o código fornecido</li>
                            <li>Substitua o SPREADSHEET_ID pelo ID da sua planilha</li>
                            <li>Publicar como "Aplicativo Web" com acesso a "Qualquer pessoa"</li>
                        </ul>
                    </li>
                    <li><strong>Teste a URL do GAS:</strong>
                        <a href="${AppConfig.GAS_URL}?action=getData&callback=test" target="_blank">
                            Clique aqui para testar
                        </a>
                    </li>
                </ol>
                
                <div style="margin-top: 20px; padding: 15px; background-color: white; border-radius: 5px;">
                    <h5 style="margin-bottom: 10px;">Teste rápido de conexão:</h5>
                    <button onclick="DataManager.testGASConnection()" class="btn btn-primary btn-sm">
                        <i class="fas fa-wifi"></i> Testar Conexão com Google Apps Script
                    </button>
                    <div id="connectionTestResult" style="margin-top: 10px; font-size: 12px;"></div>
                </div>
            </div>
        `;
        
        tableContainer.insertAdjacentHTML('beforeend', instructionsHTML);
    },
    
    // Testar conexão com GAS
    async testGASConnection() {
        const resultDiv = document.getElementById('connectionTestResult');
        resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando conexão...';
        
        try {
            const callbackName = 'testConnection_' + Date.now();
            const script = document.createElement('script');
            
            return new Promise((resolve) => {
                window[callbackName] = (data) => {
                    if (script.parentNode) document.body.removeChild(script);
                    delete window[callbackName];
                    
                    resultDiv.innerHTML = `
                        <div style="color: #27ae60;">
                            <i class="fas fa-check-circle"></i> Conexão bem-sucedida!
                        </div>
                        <div style="font-size: 10px; margin-top: 5px;">
                            Dados recebidos: ${JSON.stringify(data).substring(0, 100)}...
                        </div>
                    `;
                    resolve(true);
                };
                
                script.onerror = () => {
                    if (script.parentNode) document.body.removeChild(script);
                    if (window[callbackName]) delete window[callbackName];
                    
                    resultDiv.innerHTML = `
                        <div style="color: #e74c3c;">
                            <i class="fas fa-times-circle"></i> Falha na conexão. Verifique:
                            <ul style="margin: 5px 0 0 15px;">
                                <li>URL do GAS está correta</li>
                                <li>Google Apps Script está publicado</li>
                                <li>Acesso está como "Qualquer pessoa"</li>
                            </ul>
                        </div>
                    `;
                    resolve(false);
                };
                
                script.src = `${AppConfig.GAS_URL}?action=getData&callback=${callbackName}&t=${Date.now()}`;
                document.body.appendChild(script);
            });
            
        } catch (error) {
            resultDiv.innerHTML = `<div style="color: #e74c3c;">Erro: ${error.message}</div>`;
            return false;
        }
    },
    
    // Atualizar contador de itens
    updateItemCount() {
        const countElement = document.getElementById('itemCount');
        if (countElement) {
            const reorderCount = this.itemsData.filter(item => 
                (item.updatedStock || item.currentStock) <= item.minStock
            ).length;
            
            countElement.innerHTML = `
                <span>${this.itemsData.length} itens</span>
                ${reorderCount > 0 ? `<span style="color:#e74c3c; margin-left: 10px;">
                    <i class="fas fa-exclamation-triangle"></i> ${reorderCount} para repor
                </span>` : ''}
                ${this.isUsingSampleData ? `<span style="color:#f39c12; margin-left: 10px;">
                    <i class="fas fa-exclamation-circle"></i> Dados de Exemplo
                </span>` : ''}
            `;
        }
    },
    
    // Coletar todos os dados para relatório
    collectReportData() {
        // Primeiro atualiza todos os dados dos inputs
        this.itemsData.forEach((item, index) => {
            const updatedQtyInput = document.getElementById(`updatedQty-${index}`);
            const purchaseQtyInput = document.getElementById(`purchaseQty-${index}`);
            
            if (updatedQtyInput) {
                item.updatedStock = parseInt(updatedQtyInput.value) || item.currentStock;
            }
            if (purchaseQtyInput) {
                item.purchaseQty = parseInt(purchaseQtyInput.value) || 0;
            }
        });
        
        return {
            date: document.getElementById('reportDate').value,
            items: this.itemsData,
            totalItems: this.itemsData.length,
            itemsToReorder: this.itemsData.filter(item => {
                const currentValue = item.updatedStock || item.currentStock;
                return currentValue <= item.minStock;
            }).length,
            isSampleData: this.isUsingSampleData,
            generatedAt: new Date().toISOString()
        };
    },
    
    // Limpar todas as alterações
    clearAll() {
        if (confirm('Tem certeza que deseja limpar todas as alterações? Isso redefinirá todas as quantidades atualizadas e a comprar.')) {
            this.itemsData.forEach((item, index) => {
                item.updatedStock = item.currentStock;
                item.purchaseQty = 0;
                
                // Atualizar elementos da interface se existirem
                const checkbox = document.getElementById(`changed-${index}`);
                const updatedInput = document.getElementById(`updatedQty-${index}`);
                const purchaseInput = document.getElementById(`purchaseQty-${index}`);
                
                if (checkbox) checkbox.checked = false;
                if (updatedInput) {
                    updatedInput.value = item.currentStock;
                    updatedInput.disabled = true;
                }
                if (purchaseInput) purchaseInput.value = 0;
            });
            
            // Re-renderizar a tabela
            TableRenderer.renderTable();
            this.updateItemCount();
            
            alert('Todas as alterações foram limpas!');
        }
    }
};