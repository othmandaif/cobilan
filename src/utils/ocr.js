import { createWorker } from 'tesseract.js';

let workerInstance = null;

async function getWorker() {
  if (!workerInstance) {
    workerInstance = await createWorker('fra+eng', 1, {
      logger: () => {},
    });
  }
  return workerInstance;
}

function cleanAmount(str) {
  if (!str) return 0;
  const cleaned = str
    .replace(/[^\d,.]/g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function matchFirst(text, patterns) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1]?.trim() || m[0]?.trim();
  }
  return null;
}

function parseDate(str) {
  if (!str) return '';
  const m = str.match(/(\d{2})[-/.](\d{2})[-/.](\d{4})/);
  if (m) {
    let [_, d, mo, y] = m;
    if (parseInt(mo) > 12) { [d, mo] = [mo, d]; }
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return str;
}

function parseInvoiceNumber(text) {
  return matchFirst(text, [
    /(?:N[°º]?\s*(?:facture|Facture|devis)?\s*[:.\s]*)\b([A-Z]{2,6}[-/]\d{4}[-/]\d+|[A-Z]{2,6}\d{4,}|FAC[-/]\d+|PI[-/]\d+|INV[-/]\d+)/,
    /(?:facture|Facture|N[°º]?)\s*[:.\s]*\b([A-Z0-9][-A-Z0-9/]{3,20})\b/,
  ]) || '';
}

function parsePostingDate(text) {
  const d = matchFirst(text, [
    /(?:date\s*(?:d['e]mission|facture|du)?\s*[:.\s]*)(\d{2}[-/.]\d{2}[-/.]\d{4})/i,
    /(?:facture\s*[:.\s]*)(\d{2}[-/.]\d{2}[-/.]\d{4})/i,
  ]);
  return d ? parseDate(d) : '';
}

function parseDueDate(text) {
  const d = matchFirst(text, [
    /(?:echeance|échéance|date\s*d['e]cheance|date\s*d['é]chéance)\s*[:.\s]*(\d{2}[-/.]\d{2}[-/.]\d{4})/i,
  ]);
  return d ? parseDate(d) : '';
}

function parseTotalHT(text) {
  const val = matchFirst(text, [
    /(?:total\s*ht?|sous[- ]?total|montant\s*ht?|net\s*ht?)\s*[:.\s]*(\d[\d\s.,]*\d)/i,
  ]);
  return val ? cleanAmount(val) : 0;
}

function parseTotalTTC(text) {
  const val = matchFirst(text, [
    /(?:total\s*ttc?|net\s*[àa]\s*payer|total\s*general|total\s*[aà]\s*payer|net\s*[aà]\s*payer)\s*[:.\s]*(\d[\d\s.,]*\d)/i,
    /(?:total)\s*[:.\s]*(\d[\d\s.,]*\d)\s*(?:mad|dhs|dh|€)/i,
  ]);
  return val ? cleanAmount(val) : 0;
}

function parseTVARate(text) {
  const val = matchFirst(text, [
    /(?:tva|taxe)\s*(?:sur\s*)?(\d+(?:[.,]\d+)?)\s*%/i,
    /(\d+(?:[.,]\d+)?)\s*%\s*(?:tva|taxe)/i,
  ]);
  return val ? cleanAmount(val) : 0;
}

function parseTVAAmount(text) {
  const val = matchFirst(text, [
    /(?:tva|taxe)\s*(?:\d+%)?\s*[:.\s]*(\d[\d\s.,]*\d)/i,
  ]);
  return val ? cleanAmount(val) : 0;
}

function parseICE(text) {
  const m = text.match(/ICE\s*[:.\s]*(\d{15})/i);
  return m ? m[1] : '';
}

function parseIF(text) {
  const m = text.match(/IF\s*[:.\s]*(\d{7,10})/i);
  return m ? m[1] : '';
}

function parseCompanyName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const skipKeywords = /facture|devis|n[°º]|date|total|tva|ht|ttc|ice|if|email|tel|fax|www|mad|dhs|dh|euro|€|rib|iban|swift|code|rc|patente|cnss/i;
  for (const line of lines.slice(0, Math.min(10, lines.length))) {
    if (line.length > 5 && line.length < 80 && !skipKeywords.test(line)) {
      return line;
    }
  }
  return '';
}

function parseCustomerName(text) {
  const m = text.match(/(?:client|facturé\s*[àa]|destinataire|mr?|mme?|société)\s*[:.\s]+(.+)/i);
  if (m) {
    const name = m[1].split('\n')[0].trim();
    if (name.length > 2) return name;
  }
  return '';
}

function parseSupplierName(text) {
  const m = text.match(/(?:fournisseur|vendeur|fr?|prestataire)\s*[:.\s]+(.+)/i);
  if (m) {
    const name = m[1].split('\n')[0].trim();
    if (name.length > 2) return name;
  }
  return '';
}

function parseBillNo(text) {
  const m = text.match(/(?:bon\s*(?:de\s*)?commande|bc?|commande)\s*[:.\s]*([A-Z0-9][-A-Z0-9/]+)/i);
  return m ? m[1] : '';
}

function parseItems(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/article|designation|description|produit|libellé/i.test(line)) {
      inTable = true;
      continue;
    }
    if (/total|tva|net|ttc|ht|sous[- ]?total|arrêté/i.test(line) && /\d/.test(line)) {
      inTable = false;
      continue;
    }

    if (inTable) {
      const nums = line.match(/\d[\d.,]*\d/g);
      if (nums && nums.length >= 2 && line.length > 10) {
        const name = line.replace(/\d[\d.,]*\d/g, '').replace(/x\s*\d+/, '').trim();
        if (name.length > 2) {
          const amounts = nums.map(n => cleanAmount(n));
          items.push({
            item_name: name,
            qty: amounts.length >= 3 ? amounts[0] : 1,
            rate: amounts.length >= 3 ? amounts[1] : (amounts[0] / (amounts.length >= 2 ? amounts[0] : 1)),
            amount: amounts[amounts.length - 1],
          });
        }
      }
    }
  }
  return items;
}

export async function ocrInvoice(file) {
  const imageUrl = URL.createObjectURL(file);

  const worker = await getWorker();
  const { data } = await worker.recognize(imageUrl);

  URL.revokeObjectURL(imageUrl);

  const text = data.text;
  const confidence = data.confidence;

  const result = {
    rawText: text,
    confidence: Math.round(confidence),
    invoice_number: parseInvoiceNumber(text),
    posting_date: parsePostingDate(text),
    due_date: parseDueDate(text),
    total_ht: parseTotalHT(text),
    total_ttc: parseTotalTTC(text),
    tva_rate: parseTVARate(text),
    tva_amount: parseTVAAmount(text),
    ice: parseICE(text),
    if_: parseIF(text),
    company_name: parseCompanyName(text),
    customer_name: parseCustomerName(text),
    supplier_name: parseSupplierName(text),
    bill_no: parseBillNo(text),
    items: parseItems(text),
  };

  return result;
}

export function getFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}
