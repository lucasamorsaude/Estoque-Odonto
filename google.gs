// Código do Google Apps Script - Versão corrigida
// Substitua com o ID da sua planilha
const SPREADSHEET_ID = '1VcW8sjV1azx8wRlvCY59pnBn_yZB2_Nuncr8eU1xMfs';
const SHEET_NAME = 'Produtos';

// Função principal que lida com requisições GET
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getData') {
    return handleGetData(e);
  } else if (action === 'generatePDF') {
    // Para requisições GET do PDF, redireciona para POST
    return HtmlService.createHtmlOutput(`
      <html>
        <body>
          <h1>Geração de PDF</h1>
          <p>Use o método POST para gerar PDFs.</p>
          <p>Acesse a interface web para gerar relatórios.</p>
        </body>
      </html>
    `);
  } else {
    // Retorna uma página HTML básica com instruções
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>API Controle de Estoque</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .logo { background-color: #4a6fa5; color: white; padding: 20px; text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>API Controle de Estoque</h1>
            </div>
            <h2>Endpoints disponíveis:</h2>
            <ul>
              <li><strong>GET ?action=getData&callback=funcao</strong> - Retorna dados do estoque em JSONP</li>
              <li><strong>POST ?action=generatePDF</strong> - Gera PDF com os dados enviados</li>
            </ul>
            <p>Para usar, acesse a interface web hospedada no GitHub.</p>
          </div>
        </body>
      </html>
    `);
  }
}

// Função principal que lida com requisições POST
function doPost(e) {
  const action = e.parameter.action;
  
  if (action === 'generatePDF') {
    return handleGeneratePDF(e);
  } else if (action === 'saveData') {
    return handleSaveData(e);
  } else {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Ação não reconhecida',
      status: 400
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para lidar com obtenção de dados
function handleGetData(e) {
  try {
    const callback = e.parameter.callback;
    const data = getInventoryData();
    
    if (callback) {
      // Para JSONP
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(data) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      // Para JSON normal
      return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Erro em handleGetData:', error);
    return ContentService.createTextOutput(JSON.stringify({
      error: error.message,
      status: 500
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para lidar com geração de PDF
function handleGeneratePDF(e) {
  try {
    // Tenta parsear os dados do POST
    let reportData;
    
    if (e.postData && e.postData.contents) {
      reportData = JSON.parse(e.postData.contents);
    } else if (e.parameter.data) {
      reportData = JSON.parse(e.parameter.data);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Dados não fornecidos',
        status: 400
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Gera o PDF
    const pdfUrl = generatePDFFromData(reportData);
    
    // Retorna a URL do PDF
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'PDF gerado com sucesso',
      url: pdfUrl,
      status: 200
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Erro em handleGeneratePDF:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message,
      status: 500
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para salvar dados (opcional)
function handleSaveData(e) {
  try {
    let data;
    
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Dados não fornecidos',
        status: 400
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Salva os dados na planilha
    const result = saveToSpreadsheet(data);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Dados salvos com sucesso',
      status: 200,
      result: result
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Erro em handleSaveData:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message,
      status: 500
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para obter dados do estoque da planilha
function getInventoryData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Aba "${SHEET_NAME}" não encontrada na planilha`);
    }
    
    // Obtém os dados da planilha
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow < 2) {
      return [];
    }
    
    // Assume formato: Coluna A: ID, B: Nome, C: Estoque, D: Mínimo
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    
    // Converte para array de objetos
    const items = data.map((row, index) => {
      return {
        id: row[0] || index + 1,
        name: row[1] || 'Item sem nome',
        currentStock: parseInt(row[2]) || 0,
        minStock: parseInt(row[3]) || 0,
        updatedStock: parseInt(row[2]) || 0,
        purchaseQty: 0
      };
    });
    
    return items;
    
  } catch (error) {
    console.error('Erro em getInventoryData:', error);
    throw error;
  }
}

// Função para gerar PDF a partir dos dados
function generatePDFFromData(reportData) {
  try {
    // Formata a data
    const reportDate = new Date(reportData.date || new Date());
    const formattedDate = reportDate.toLocaleDateString('pt-BR');
    
    // Cria o conteúdo HTML do PDF
    const htmlContent = createPDFHtml(reportData, formattedDate);
    
    // Cria o blob do PDF
    const blob = Utilities.newBlob(htmlContent, 'text/html', 'relatorio.html')
      .getAs('application/pdf')
      .setName(`Relatorio_Estoque_${formattedDate.replace(/\//g, '-')}.pdf`);
    
    // Salva no Google Drive
    const folder = DriveApp.getRootFolder();
    const file = folder.createFile(blob);
    
    // Torna o arquivo público
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Retorna a URL do arquivo
    return file.getUrl();
    
  } catch (error) {
    console.error('Erro em generatePDFFromData:', error);
    throw error;
  }
}

// Função para criar HTML do PDF
function createPDFHtml(reportData, formattedDate) {
  const items = reportData.items || [];
  const totalPages = Math.ceil(items.length / 22); // 25 itens por página
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 20px; 
          color: #333;
          font-size: 12px;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #4a6fa5; 
          padding-bottom: 20px; 
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
          color: #4a6fa5; 
          margin-bottom: 10px; 
        }
        .title { 
          font-size: 20px; 
          font-weight: bold; 
          margin-bottom: 5px; 
          color: #2c3e50;
        }
        .subtitle { 
          color: #7f8c8d; 
          margin-bottom: 20px; 
          font-size: 14px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px; 
          font-size: 11px;
        }
        th { 
          background-color: #34495e; 
          color: white;
          padding: 10px; 
          border: 1px solid #ddd; 
          text-align: left; 
          font-weight: bold;
        }
        td { 
          padding: 8px; 
          border: 1px solid #ddd; 
        }
        .highlight { 
          background-color: #fff3cd; 
          font-weight: bold;
        }
        .needs-reorder { 
          background-color: #f8d7da; 
        }
        .footer { 
          margin-top: 50px; 
          padding-top: 20px; 
          border-top: 1px solid #333; 
        }
        .page-break { 
          page-break-after: always; 
        }
        .signature-line { 
          width: 300px; 
          border-top: 2px solid #000; 
          margin: 60px auto 10px; 
        }
        .summary {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .page-break { page-break-after: always; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
  `;
  
  // Para cada página
  for (let page = 0; page < totalPages; page++) {
    const startIndex = page * 22;
    const endIndex = Math.min(startIndex + 22, items.length);
    const pageItems = items.slice(startIndex, endIndex);
    
    html += `
      <div class="header">
        <div class="logo">
          <img src="https://imgur.com/a/bEuinAB" alt="Logo" style="height: 40px; vertical-align: middle;">
        </div>
        <div class="title">CONTROLE DE ESTOQUE MANUAL</div>
        <div class="subtitle">Relatório gerado em: ${formattedDate}</div>
        ${page > 0 ? `<div class="subtitle">Continuação - Página ${page + 1} de ${totalPages}</div>` : ''}
      </div>
      
      ${page === 0 ? `
        <div class="summary">
          <strong>Resumo:</strong>
          <div>Total de Itens: ${reportData.totalItems || items.length}</div>
          <div>Itens para Repor: ${reportData.itemsToReorder || 0}</div>
          <div>Data do Relatório: ${formattedDate}</div>
        </div>
      ` : ''}
      
      <table>
        <thead>
          <tr>
            <th width="5%">ID</th>
            <th width="30%">Item</th>
            <th width="10%">Estoque Atual</th>
            <th width="10%">Mínimo</th>
            <th width="10%">Qtd. Atualizada</th>
            <th width="15%">Qtd. Comprar</th>
            <th width="10%">Status</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    pageItems.forEach(item => {
      const currentStock = item.updatedStock || item.currentStock;
      const needsReorder = currentStock <= item.minStock;
      const rowClass = needsReorder ? 'needs-reorder' : '';
      const purchaseQty = item.purchaseQty || 0;
      const status = needsReorder ? 
        `<span style="color: #e74c3c; font-weight: bold;">REPOR</span>` : 
        `<span style="color: #27ae60;">OK</span>`;
      
      html += `
        <tr class="${rowClass}">
          <td>${item.id}</td>
          <td>${item.name}</td>
          <td>${item.currentStock}</td>
          <td>${item.minStock}</td>
          <td>${currentStock}</td>
          <td class="${purchaseQty > 0 ? 'highlight' : ''}">
            ${purchaseQty > 0 ? purchaseQty : '-'}
          </td>
          <td>${status}</td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
    
    // Se for a última página, adiciona o rodapé
    if (page === totalPages - 1) {
      html += `
        <div class="footer">
          <div style="float: left; width: 40%;">
            <div style="margin-bottom: 10px;">
              <strong>Data do Relatório:</strong><br>
              ${formattedDate}
            </div>
            <div>
              <strong>Local:</strong><br>
              Almoxarifado Central
            </div>
          </div>
          <div style="float: right; width: 60%; text-align: center;">
            <div class="signature-line"></div>
            <div style="margin-top: 5px;">
              <strong>Assinatura do Responsável</strong><br>
              Nome: ___________________________<br>
            </div>
          </div>
          <div style="clear: both;"></div>
        </div>
      `;
    }
    
    // Adiciona quebra de página se não for a última
    if (page < totalPages - 1) {
      html += '<div class="page-break"></div>';
    }
  }
  
  html += `
    </body>
    </html>
  `;
  
  return html;
}

// Função para salvar dados na planilha
function saveToSpreadsheet(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Aba "${SHEET_NAME}" não encontrada`);
    }
    
    // Procura a última coluna vazia para salvar os dados
    const lastCol = sheet.getLastColumn();
    const newCol = lastCol + 1;
    
    // Adiciona cabeçalho
    const today = new Date().toLocaleDateString('pt-BR');
    sheet.getRange(1, newCol).setValue(`Relatório ${today}`);
    sheet.getRange(2, newCol).setValue('Qtd. Atualizada');
    sheet.getRange(2, newCol + 1).setValue('Qtd. Comprar');
    
    // Para cada item, salva na linha correspondente
    data.items.forEach(item => {
      const ids = sheet.getRange('A:A').getValues().flat();
      const rowIndex = ids.indexOf(item.id) + 1;
      
      if (rowIndex > 1) {
        // Salva quantidade atualizada
        sheet.getRange(rowIndex, newCol).setValue(item.updatedStock || item.currentStock);
        
        // Salva quantidade a comprar
        sheet.getRange(rowIndex, newCol + 1).setValue(item.purchaseQty || 0);
      }
    });
    
    return {
      saved: true,
      column: newCol,
      date: today,
      itemsCount: data.items.length
    };
    
  } catch (error) {
    console.error('Erro em saveToSpreadsheet:', error);
    throw error;
  }
}