const fs = require('fs');

let file = 'src/features/orders/OrderDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace title block
let titleTarget = `<h3 style={{ margin: 0 }}>{order.order_number}</h3>
            <span className="td-muted">{order.customers?.name ?? '—'}</span>`;

let titleRepl = `<h3 style={{ margin: 0 }}>
              {order.order_number}
              {order.quotations?.quotation_number && (
                <span style={{ marginLeft: '0.75rem', background: '#fef3c7', color: '#b45309', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', verticalAlign: 'middle', fontWeight: 500 }}>
                  Từ BG: {order.quotations.quotation_number}
                </span>
              )}
            </h3>
            <span className="td-muted">{order.customers?.name ?? '—'}</span>`;

content = content.replace(titleTarget, titleRepl);

// replace header row
let theadTarget = `<th>Màu</th>
                  <th style={{ textAlign: 'right' }}>Số lượng</th>
                  <th style={{ textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ textAlign: 'right' }}>Thành tiền</th>`;

let theadRepl = `<th>Màu</th>
                  <th style={{ textAlign: 'right' }}>Khổ</th>
                  <th style={{ textAlign: 'right' }}>Số lượng</th>
                  <th style={{ textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ textAlign: 'right' }}>Thành tiền</th>`;

content = content.replace(theadTarget, theadRepl);

// replace tbody row
let tbodyTarget = `<td className="td-muted">{item.color_name ?? '—'}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {new Intl.NumberFormat('vi-VN').format(item.quantity)} {item.unit}
                      </td>`;

let tbodyRepl = `<td className="td-muted">{item.color_name ?? '—'}</td>
                      <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{item.width_cm ? \`\${item.width_cm} cm\` : '—'}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {new Intl.NumberFormat('vi-VN').format(item.quantity)} {item.unit}
                      </td>`;

content = content.replace(tbodyTarget, tbodyRepl);

// replace colspan
content = content.replace('colSpan={5}', 'colSpan={6}');

fs.writeFileSync(file, content);
console.log('patched OrderDetail.tsx successfully!');
