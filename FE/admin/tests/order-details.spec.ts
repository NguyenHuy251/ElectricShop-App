import { test, expect } from '@playwright/test';
import { mockApi } from './fixtures';

test('staff with orders permission can inspect each ordered variant without catalog permission', async ({ page }) => {
  const mock = await mockApi(page, 'NhanVien', true, ['orders']);
  mock.data['don-hang'][0].items = [700, 900].map((power, index) => ({
    ma_san_pham: 7, ma_bien_the: index + 11, ten_san_pham: 'Nồi cơm điện',
    ten_bien_the: `Đỏ ${power}W`, hinh_anh: '/uploads/rice.jpg', so_luong: 2, don_gia: 500000, thanh_tien: 1000000,
    product_details: { ma_san_pham_code: 'SP7', ma_sku: `RED${power}`, ten_danh_muc: 'Nhà bếp', ten_thuong_hieu: 'Hãng mẫu', bao_hanh: 24,
      thong_so_ky_thuat: [{ma_thong_so:1,ten_thong_so:'Công suất',gia_tri:`${power} W`},{ma_thong_so:2,ten_thong_so:'Màu sắc',gia_tri:'Đỏ'}] },
  }));
  await page.goto('/orders');
  await page.getByRole('button', { name: 'Xem chi tiết', exact: true }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByRole('img', {name:'Nồi cơm điện'})).toHaveCount(2);
  await drawer.getByRole('button', { name: 'Xem chi tiết sản phẩm', exact: true }).first().click();
  await expect(drawer.getByText('700 W', {exact:true})).toBeVisible();
  await expect(drawer.getByText('900 W', {exact:true})).toHaveCount(0);
  await expect(drawer.getByText('RED700', {exact:true})).toBeVisible();
  await expect(drawer.getByText('24 tháng', {exact:true})).toBeVisible();
  await drawer.getByRole('button', { name: 'Xem chi tiết sản phẩm', exact: true }).click();
  await expect(drawer.getByText('900 W', {exact:true})).toBeVisible();
  await drawer.getByRole('button', { name: 'Thu gọn chi tiết', exact: true }).first().click();
  await expect(drawer.getByText('700 W', {exact:true})).not.toBeVisible();
  await expect(drawer.getByText('900 W', {exact:true})).toBeVisible();
  expect(mock.requests.filter(request => request.resource === 'san-pham')).toHaveLength(0);
});

test('historical items remain visible when the product is no longer in the catalog', async ({ page }) => {
  const mock = await mockApi(page);
  mock.data['don-hang'][0].items = [{ma_san_pham:999,ten_san_pham:'Sản phẩm cũ',ten_bien_the:'Bản cũ',so_luong:3,don_gia:100000,thanh_tien:300000,product_details:null}];
  await page.goto('/orders');
  await page.getByRole('button', { name: 'Xem chi tiết', exact: true }).click();
  const drawer = page.getByRole('dialog');
  await drawer.getByRole('button', { name: 'Xem chi tiết sản phẩm', exact: true }).click();
  await expect(drawer.getByText('Sản phẩm không còn trong danh mục.', {exact:false})).toBeVisible();
  await expect(drawer.getByText('Thông tin sản phẩm đã đặt', {exact:true})).toBeVisible();
  await expect(drawer.getByText('Bản cũ', {exact:true})).toHaveCount(2);
});

test('management waits for the buyer and cannot choose delivered status', async ({ page }) => {
  const mock = await mockApi(page);
  mock.data['don-hang'][0].trang_thai = 'DangGiao';
  await page.goto('/orders');
  await page.getByRole('combobox', { name: 'Đổi trạng thái đơn 10' }).click();
  await expect(page.locator('.ant-select-item-option').filter({hasText:'Đã giao'})).toHaveCount(0);
  await expect(page.locator('.ant-select-item-option').filter({hasText:'Đã hủy'})).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', {name:'Xem chi tiết',exact:true}).click();
  await expect(page.getByRole('dialog').getByText('Đang chờ khách hàng xác nhận đã nhận hàng trên ứng dụng.', {exact:false})).toBeVisible();
});
