const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'features');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace formatCurrency
  const formatRegex = /function formatCurrency\([^)]+\) ?: ?string ?{\s*return new Intl\.NumberFormat\([^)]+\)\.format\([^)]+\)\s*}/g;
  if(formatRegex.test(content)) {
    content = content.replace(formatRegex, '');
    let importLine = `$1import { formatCurrency } from '@/shared/utils/format'\n`;
    content = content.replace(/^(\s*import .*from .*[\r\n]+)/m, importLine);
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed formatCurrency in', file);
  }
}

['orders/OrderForm.tsx', 'orders/OrderDetail.tsx', 'quotations/QuotationList.tsx', 'quotations/QuotationForm.tsx', 'quotations/QuotationDetail.tsx'].forEach(f => processFile(path.join(p, f)));
