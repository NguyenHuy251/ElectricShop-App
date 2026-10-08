export async function exportExcel(filename:string, columns:{header:string;key:string}[], rows:Record<string,unknown>[]) {
  const ExcelJS=await import('exceljs');
  const workbook=new ExcelJS.Workbook();
  const sheet=workbook.addWorksheet('Dữ liệu');
  sheet.columns=columns.map(c=>({...c,width:26}));
  for(const row of rows)sheet.addRow(Object.fromEntries(columns.map(c=>[c.key,row[c.key] ?? ''])));
  sheet.getRow(1).font={bold:true};
  sheet.views=[{state:'frozen',ySplit:1}];
  const buffer=await workbook.xlsx.writeBuffer();
  const url=URL.createObjectURL(new Blob([buffer as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const link=document.createElement('a');link.href=url;link.download=`${filename}.xlsx`;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function printOrder(order:{ma_don_hang:number;ho_ten_nguoi_nhan:string;so_dien_thoai:string;dia_chi_giao_hang:string;tong_tien:number|string;ma_code?:string|null;ma_voucher?:number|null;tam_tinh?:number|string;giam_gia?:number|string;phi_giao_hang?:number|string;items?:any[]}) {
  const escape=(value:unknown)=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const popup=window.open('','_blank');
  if(!popup)throw new Error('Cho phép cửa sổ in trong trình duyệt để in phiếu.');
  const currency=(value:unknown)=>`${Number(value || 0).toLocaleString('vi-VN')}đ`;
  const payment=`<p>Tiền hàng: ${currency(order.tam_tinh ?? Number(order.tong_tien)+Number(order.giam_gia || 0)-Number(order.phi_giao_hang || 0))}</p><p>Mã giảm giá: ${escape(order.ma_code || (order.ma_voucher ? `Voucher #${order.ma_voucher}` : 'Không áp dụng'))}</p><p>Giảm giá: ${currency(order.giam_gia)}</p><p>Phí giao hàng: ${currency(order.phi_giao_hang)}</p>`;
  popup.document.write(`<html lang="vi"><head><title>Phiếu giao hàng #${order.ma_don_hang}</title><style>body{font:16px Arial;padding:24px;color:#183C35}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:10px;text-align:left}</style></head><body><h1>ElectricShop</h1><h2>Phiếu giao hàng #${order.ma_don_hang}</h2><p>${escape(order.ho_ten_nguoi_nhan)} · ${escape(order.so_dien_thoai)}</p><p>${escape(order.dia_chi_giao_hang)}</p><table><thead><tr><th>Sản phẩm / biến thể</th><th>Số lượng</th><th>Đơn giá</th></tr></thead><tbody>${(order.items || []).map(i=>`<tr><td>${escape(i.ten_san_pham)} ${escape(i.ten_bien_the)}</td><td>${escape(i.so_luong)}</td><td>${Number(i.don_gia).toLocaleString('vi-VN')}đ</td></tr>`).join('')}</tbody></table>${payment}<h3>Tổng thanh toán: ${Number(order.tong_tien).toLocaleString('vi-VN')}đ</h3></body></html>`);
  popup.document.close();popup.focus();setTimeout(()=>popup.print(),250);
}
