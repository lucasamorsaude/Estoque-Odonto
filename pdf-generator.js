// pdf-generator.js - Geracao de PDF via jsPDF + AutoTable
const PDFGenerator = {
    async generatePDF() {
        const reportData = DataManager.collectReportData();
        const loadingElement = document.getElementById('loading');
        loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando relatorio...';
        loadingElement.style.display = 'block';
        
        try {
            await this.generateWithJsPDF(reportData);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Nao foi possivel gerar o PDF. Verifique o console.');
        } finally {
            loadingElement.style.display = 'none';
        }
    },
    
    async generateWithJsPDF(reportData) {
        const items = reportData.items || [];
        if (items.length === 0) {
            throw new Error('Nao ha itens para gerar o PDF');
        }
        
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('Biblioteca jsPDF nao carregada');
        }
        if (!window.jspdf.jsPDF.API.autoTable) {
            throw new Error('Plugin AutoTable nao carregado');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        
        const rawDate = reportData.date || new Date();
        // Adiciona o horário se for uma string para evitar o fuso horário UTC
        const dateObj = typeof rawDate === 'string' && !rawDate.includes('T') 
            ? new Date(rawDate + 'T00:00:00') 
            : new Date(rawDate);

        const date = dateObj.toLocaleDateString('pt-BR');
        const fileName = `Relatorio_Estoque_${date.replace(/\//g, '-')}.pdf`;
        const logoData = await this.loadImageAsDataUrl('icon.png');
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 14;
        const headerY = 14;
        
        const addHeader = (pageNumber, totalPages) => {
            if (logoData) {
                doc.addImage(logoData, 'PNG', marginX, headerY, 20, 20);
            }
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('CONTROLE DE ESTOQUE MANUAL', pageWidth / 2, headerY + 8, { align: 'center' });
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Relatório gerado em: ${date}`, pageWidth / 2, headerY + 14, { align: 'center' });
            
            if (pageNumber > 1) {
                doc.setFontSize(9);
                doc.text(`Continuação - Página ${pageNumber} de ${totalPages}`, pageWidth / 2, headerY + 19, { align: 'center' });
            }
            
            doc.setDrawColor(74, 111, 165);
            doc.setLineWidth(0.5);
            doc.line(marginX, headerY + 22, pageWidth - marginX, headerY + 22);
        };
        
        const summary = [
            `Total de Itens: ${reportData.totalItems || items.length}`,
            `Itens para Repor: ${reportData.itemsToReorder || 0}`,
            `Data do Relatório: ${date}`
        ];
        
        const tableBody = items.map(item => {
            const currentValue = item.updatedStock || item.currentStock;
            const needsReorder = currentValue <= item.minStock;
            const purchaseQty = item.purchaseQty || '';
            return [
                String(item.id),
                String(item.name),
                String(item.currentStock),
                String(item.minStock),
                '',
                String(purchaseQty),
                needsReorder ? 'REPOR' : 'OK'
            ];
        });
        
        const startY = headerY + 28;
        const headerSpacing = headerY + 26;
        
        addHeader(1, 1);
        doc.setFontSize(10);
        doc.setTextColor(60);
        summary.forEach((line, index) => {
            doc.text(line, marginX, startY + (index * 5));
        });
        
        doc.autoTable({
            head: [[
                'ID',
                'Item',
                'Estoque Atual',
                'Mínimo',
                'Qtd. Atualizada',
                'Qtd. Comprar',
                'Status'
            ]],
            body: tableBody,
            startY: startY + 18,
            margin: { top: headerSpacing, left: marginX, right: marginX },
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 2,
                lineWidth: 0.2,
                lineColor: [120, 120, 120]
            },
            headStyles: {
                fillColor: [52, 73, 94],
                lineWidth: 0.2,
                lineColor: [120, 120, 120]
            },
            didDrawPage: data => {
                const totalPages = doc.getNumberOfPages();
                addHeader(data.pageNumber, totalPages);
            },
            willDrawCell: data => {
                if (data.section === 'body' && data.row.index >= 0) {
                    const status = data.row.raw[6];
                    if (status === 'REPOR') {
                        doc.setFillColor(248, 215, 218);
                        data.cell.styles.fillColor = [248, 215, 218];
                    }
                }
            }
        });
        
        const finalY = doc.lastAutoTable.finalY || doc.internal.pageSize.getHeight() - 40;
        const footerY = Math.min(finalY + 12, doc.internal.pageSize.getHeight() - 30);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Data do Relatório:', marginX, footerY);
        doc.text(date, marginX, footerY + 5);
        
        const signatureX = pageWidth / 2 + 10;
        doc.text('_________________________________', signatureX, footerY);
        doc.text('Assinatura do Responsável', signatureX, footerY + 5);
        
        doc.save(fileName);
    },
    
    loadImageAsDataUrl(src) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (error) {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }
};
