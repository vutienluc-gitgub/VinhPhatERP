/**
 * Helper generating interactive floating margin controller widget for A5 continuous dot matrix previews.
 * Fully hidden during print via media print CSS.
 */
export function buildMarginToolbarHtml(
  initialTop: number,
  initialBottom: number,
  initialLeft: number,
  initialRight: number,
): string {
  return `
<div class="a5-margin-controller" id="marginController">
  <div class="ctrl-header">
    <div class="ctrl-title">CĂN LỀ IN KIM A5</div>
    <button type="button" class="ctrl-btn-print" onclick="window.print()">In ngay</button>
  </div>
  <div class="ctrl-grid">
    <div class="ctrl-item">
      <span class="ctrl-label">Lề trên:</span>
      <div class="ctrl-stepper">
        <button type="button" onclick="adjustMargin('top', -0.5)">-</button>
        <input id="in-top" type="number" step="0.5" value="${initialTop}" oninput="updateMargin('top', this.value)" />
        <button type="button" onclick="adjustMargin('top', 0.5)">+</button>
        <span class="ctrl-unit">mm</span>
      </div>
    </div>
    <div class="ctrl-item">
      <span class="ctrl-label">Lề dưới:</span>
      <div class="ctrl-stepper">
        <button type="button" onclick="adjustMargin('bottom', -0.5)">-</button>
        <input id="in-bottom" type="number" step="0.5" value="${initialBottom}" oninput="updateMargin('bottom', this.value)" />
        <button type="button" onclick="adjustMargin('bottom', 0.5)">+</button>
        <span class="ctrl-unit">mm</span>
      </div>
    </div>
    <div class="ctrl-item">
      <span class="ctrl-label">Lề trái:</span>
      <div class="ctrl-stepper">
        <button type="button" onclick="adjustMargin('left', -0.5)">-</button>
        <input id="in-left" type="number" step="0.5" value="${initialLeft}" oninput="updateMargin('left', this.value)" />
        <button type="button" onclick="adjustMargin('left', 0.5)">+</button>
        <span class="ctrl-unit">mm</span>
      </div>
    </div>
    <div class="ctrl-item">
      <span class="ctrl-label">Lề phải:</span>
      <div class="ctrl-stepper">
        <button type="button" onclick="adjustMargin('right', -0.5)">-</button>
        <input id="in-right" type="number" step="0.5" value="${initialRight}" oninput="updateMargin('right', this.value)" />
        <button type="button" onclick="adjustMargin('right', 0.5)">+</button>
        <span class="ctrl-unit">mm</span>
      </div>
    </div>
  </div>
  <div class="ctrl-presets">
    <button type="button" onclick="setAllMargins(2, 2, 3.5, 3.5)">Chuẩn VP (2 / 3.5 mm)</button>
    <button type="button" onclick="setAllMargins(0, 0, 0, 0)">0mm (Sát mép)</button>
    <button type="button" onclick="setAllMargins(3, 3, 5, 5)">Rộng (3 / 5 mm)</button>
  </div>
</div>

<style>
@media screen {
  .a5-margin-controller {
    position: fixed;
    top: 16px;
    right: 16px;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px 14px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 11px;
    z-index: 999999;
    width: 250px;
    box-sizing: border-box;
  }
  .ctrl-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 1px solid #334155;
    padding-bottom: 6px;
  }
  .ctrl-title {
    font-weight: 700;
    letter-spacing: 0.03em;
    color: #38bdf8;
    font-size: 11px;
  }
  .ctrl-btn-print {
    background: #0284c7;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }
  .ctrl-btn-print:hover {
    background: #0369a1;
  }
  .ctrl-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }
  .ctrl-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .ctrl-label {
    font-size: 10px;
    color: #94a3b8;
    font-weight: 500;
  }
  .ctrl-stepper {
    display: flex;
    align-items: center;
    background: #1e293b;
    border: 1px solid #475569;
    border-radius: 4px;
    overflow: hidden;
  }
  .ctrl-stepper button {
    background: transparent;
    border: none;
    color: #cbd5e1;
    width: 20px;
    height: 24px;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ctrl-stepper button:hover {
    background: #334155;
    color: #fff;
  }
  .ctrl-stepper input {
    width: 32px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    outline: none;
    -moz-appearance: textfield;
  }
  .ctrl-stepper input::-webkit-outer-spin-button,
  .ctrl-stepper input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .ctrl-unit {
    color: #64748b;
    font-size: 9px;
    padding-right: 4px;
  }
  .ctrl-presets {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    border-top: 1px solid #334155;
    padding-top: 8px;
  }
  .ctrl-presets button {
    background: #1e293b;
    border: 1px solid #475569;
    color: #cbd5e1;
    font-size: 9px;
    padding: 3px 6px;
    border-radius: 4px;
    cursor: pointer;
  }
  .ctrl-presets button:hover {
    background: #334155;
    color: #fff;
  }
}

@media print {
  .a5-margin-controller {
    display: none !important;
  }
}
</style>

<script>
function updateMargin(side, val) {
  var page = document.querySelector('.a5-page');
  if (!page) return;
  var num = parseFloat(val);
  if (isNaN(num) || num < 0) num = 0;
  if (side === 'top') page.style.paddingTop = num + 'mm';
  if (side === 'bottom') page.style.paddingBottom = num + 'mm';
  if (side === 'left') page.style.paddingLeft = num + 'mm';
  if (side === 'right') page.style.paddingRight = num + 'mm';
}

function adjustMargin(side, delta) {
  var input = document.getElementById('in-' + side);
  if (!input) return;
  var current = parseFloat(input.value) || 0;
  var next = Math.max(0, parseFloat((current + delta).toFixed(1)));
  input.value = next;
  updateMargin(side, next);
}

function setAllMargins(t, b, l, r) {
  var inTop = document.getElementById('in-top');
  var inBottom = document.getElementById('in-bottom');
  var inLeft = document.getElementById('in-left');
  var inRight = document.getElementById('in-right');
  if (inTop) inTop.value = t; updateMargin('top', t);
  if (inBottom) inBottom.value = b; updateMargin('bottom', b);
  if (inLeft) inLeft.value = l; updateMargin('left', l);
  if (inRight) inRight.value = r; updateMargin('right', r);
}
</script>
`;
}
