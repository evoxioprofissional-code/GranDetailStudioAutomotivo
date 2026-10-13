import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dateBR, money, slugify } from './data.js';

async function imageAsDataUrl(src) {
  const blob = await (await fetch(src)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const clean = (value, fallback = 'Não informado') => String(value || '').trim() || fallback;

export function buildQuotePdf(quote, logo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const width = doc.internal.pageSize.getWidth();
  const total = quote.services.reduce((sum, item) => sum + (Number(item.cents) || 0), 0);

  const drawHeader = () => {
    doc.discardPath();
    doc.saveGraphicsState();
    doc.setFillColor(8, 9, 10);
    doc.rect(0, 0, width, 41, 'F');
    doc.restoreGraphicsState();
    doc.addImage(logo, 'JPEG', 14, 5, 34, 30, undefined, 'FAST');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('ORÇAMENTO', width - 14, 17, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Nº ${String(quote.number).padStart(4, '0')}  -  ${dateBR(quote.issueDate)}`, width - 14, 25, { align: 'right' });
    doc.text('Gran Detail Studio Automotivo', width - 14, 32, { align: 'right' });
  };

  drawHeader();
  doc.setTextColor(15, 17, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 14, 54);
  doc.text('VEÍCULO', 108, 54);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(clean(quote.client.name), 14, 62);
  doc.text(clean(quote.client.phone), 14, 68);
  doc.text(clean(quote.vehicle.model), 108, 62);
  doc.text(`${clean(quote.vehicle.plate)}  -  ${clean(quote.vehicle.color)}`, 108, 68);

  autoTable(doc, {
    startY: 79,
    margin: { top: 48, left: 14, right: 14, bottom: 24 },
    head: [['Serviço', 'Valor']],
    body: quote.services.filter((s) => s.description || s.cents).map((s) => [clean(s.description, 'Serviço'), money(s.cents)]),
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 4, lineColor: [222, 225, 229], lineWidth: { bottom: 0.15 } },
    headStyles: { fillColor: [243, 244, 246], textColor: [77, 83, 93], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right', cellWidth: 44 } },
    willDrawPage: ({ pageNumber }) => {
      if (pageNumber > 1) drawHeader();
    },
    didDrawPage: ({ pageNumber }) => {
      doc.setFontSize(8);
      doc.setTextColor(120, 125, 133);
      doc.text(`Gran Detail Studio Automotivo  -  Página ${pageNumber}`, 14, 289);
    },
  });

  let y = doc.lastAutoTable.finalY + 8;
  const ensureSpace = (needed = 35) => {
    if (y + needed > 278) {
      doc.addPage();
      doc.setPage(doc.getNumberOfPages());
      drawHeader();
      doc.setTextColor(15, 17, 20);
      y = 52;
    }
  };
  ensureSpace(28);
  doc.setDrawColor(15, 17, 20);
  doc.setLineWidth(0.4);
  doc.line(120, y, width - 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 17, 20);
  doc.text('Total dos serviços', 120, y + 9);
  doc.text(money(total), width - 14, y + 9, { align: 'right' });
  y += 22;

  const paymentRows = [];
  if (quote.payments.pix.enabled) paymentRows.push(['Pix', money(quote.payments.pix.cents)]);
  if (quote.payments.debit.enabled) paymentRows.push(['Cartão de débito', money(quote.payments.debit.cents)]);
  if (quote.payments.credit.enabled) {
    const parts = Math.max(1, Number(quote.payments.credit.installments) || 1);
    const base = Math.floor(quote.payments.credit.cents / parts);
    const remainder = quote.payments.credit.cents - base * parts;
    const detail = remainder
      ? `${parts - remainder}x de ${money(base)} + ${remainder}x de ${money(base + 1)}`
      : `${parts}x de ${money(base)}`;
    paymentRows.push(['Cartão de crédito', `${money(quote.payments.credit.cents)} - até ${detail} sem juros`]);
  }
  if (paymentRows.length) {
    ensureSpace(22 + paymentRows.length * 10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDIÇÕES DE PAGAMENTO', 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      body: paymentRows,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, lineColor: [226, 228, 232], lineWidth: 0.15 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 48 }, 1: { halign: 'right' } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (quote.validUntil) {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Validade: ', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(dateBR(quote.validUntil), 32, y);
    y += 9;
  }
  if (quote.notes) {
    ensureSpace(25);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(quote.notes, width - 28), 14, y + 6);
  }

  return doc;
}

export async function createQuotePdf(quote, action = 'save') {
  const logo = await imageAsDataUrl('/logo-gran-detail.jfif');
  const doc = buildQuotePdf(quote, logo);
  const filename = `orcamento-${String(quote.number).padStart(4, '0')}-${slugify(quote.client.name) || 'cliente'}.pdf`;
  if (action === 'preview') {
    const url = URL.createObjectURL(doc.output('blob'));
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else doc.save(filename);
  return filename;
}
