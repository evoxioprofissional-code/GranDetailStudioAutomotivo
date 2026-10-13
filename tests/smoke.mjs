import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { buildQuotePdf } from '../src/lib/pdf.js';
import { money, parseMoney, slugify } from '../src/lib/data.js';

assert.equal(parseMoney('R$ 1.234,56'), 123456);
assert.equal(money(123456), 'R$ 1.234,56');
assert.equal(slugify('João da Silva'), 'joao-da-silva');

const logoBytes = await readFile(new URL('../public/logo-gran-detail.jfif', import.meta.url));
const logo = `data:image/jpeg;base64,${logoBytes.toString('base64')}`;
const quote = {
  number: 99, issueDate: '2026-10-13', validUntil: '2026-10-30',
  client: { name: 'João da Silva', phone: '(11) 99999-9999' },
  vehicle: { model: 'Veículo de teste', plate: 'ABC1D23', color: 'Preto' },
  services: Array.from({ length: 45 }, (_, index) => ({ id: String(index), description: `Serviço detalhado ${index + 1} com uma descrição longa para validar as quebras de linha do documento`, cents: 12345 + index })),
  payments: { pix: { enabled: true, cents: 555000 }, debit: { enabled: true, cents: 570000 }, credit: { enabled: true, cents: 570001, installments: 3 } },
  notes: 'Observação longa com acentuação: higienização, proteção e conservação. '.repeat(8),
};
const doc = buildQuotePdf(quote, logo);
assert.ok(doc.getNumberOfPages() > 1, 'o PDF longo deve quebrar em mais de uma página');
const bytes = Buffer.from(doc.output('arraybuffer'));
assert.ok(bytes.length > 30_000, 'o PDF deve conter logo e conteúdo');
await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
await writeFile(new URL('../test-results/orcamento-0099-smoke.pdf', import.meta.url), bytes);
console.log(`Smoke OK: PDF com ${doc.getNumberOfPages()} páginas e ${bytes.length} bytes.`);
