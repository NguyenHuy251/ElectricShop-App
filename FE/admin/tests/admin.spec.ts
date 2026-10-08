import { test, expect } from '@playwright/test';
import { mockApi } from './fixtures';

test('login and logout clear session without default credentials', async ({ page }) => {
  await mockApi(page, 'Admin', false); await page.goto('/login');
  await expect(page.getByLabel('Tên đăng nhập')).toHaveValue(''); await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveValue('');
  await page.getByLabel('Tên đăng nhập').fill('admin-test'); await page.getByLabel('Mật khẩu', { exact: true }).fill('test-only'); await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tổng quan cửa hàng' })).toBeVisible();
  await page.getByRole('button', { name: 'Đăng xuất' }).click(); await expect(page).toHaveURL(/login/);
  expect(await page.evaluate(() => [localStorage.getItem('admin_token'), localStorage.getItem('admin_user')])).toEqual([null, null]);
});
test('customer is rejected, staff menus and routes are restricted', async ({ page }) => {
  await mockApi(page, 'KhachHang'); await page.goto('/products'); await expect(page).toHaveURL(/login/);
  await page.unroute('**/api/**'); await mockApi(page, 'NhanVien'); await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Tổng quan cửa hàng' })).toBeVisible(); await expect(page.getByRole('link', { name: 'Khách hàng / Tài khoản' })).toHaveCount(0); await expect(page.getByRole('link', { name: 'Nhân viên', exact: true })).toHaveCount(0);
  await page.goto('/employees'); await expect(page.getByText('Bạn không có quyền truy cập trang này')).toBeVisible();
});
test('401 clears the session and redirects to login', async ({ page }) => {
  const mock = await mockApi(page); await page.goto('/products'); await expect(page.getByRole('cell', { name: 'Nồi cơm điện' })).toBeVisible(); mock.expire();
  await page.getByRole('button', { name: 'Làm mới' }).click(); await expect(page).toHaveURL(/login/);
  expect(await page.evaluate(() => localStorage.getItem('admin_token'))).toBeNull();
});
test('category and brand CRUD, searching and empty state', async ({ page }) => {
  const mock = await mockApi(page);
  for (const [path, label, resource, name] of [['/categories', 'Tên danh mục', 'danh-muc', 'Danh mục mới'], ['/brands', 'Tên thương hiệu', 'thuong-hieu', 'Thương hiệu mới']]) {
    await page.goto(path); await page.getByRole('button', { name: 'Thêm mới' }).click(); await page.getByLabel(label, { exact: true }).fill(name); await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: name }); await expect(row).toBeVisible(); await row.getByRole('button', { name: 'Sửa', exact: true }).click(); await page.getByLabel(label, { exact: true }).fill(`${name} sửa`); await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByRole('cell', { name: `${name} sửa`, exact: true })).toBeVisible();
    await page.getByRole('row').filter({ hasText: `${name} sửa` }).getByRole('button', { name: 'Xóa', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(page.getByRole('cell', { name: `${name} sửa`, exact: true })).toHaveCount(0);
    expect(mock.requests.filter(r => r.resource === resource && r.method === 'POST')).toHaveLength(1);
    await page.getByLabel('Tìm kiếm', { exact: true }).fill('không tồn tại'); await expect(page.getByText('Chưa có dữ liệu')).toBeVisible();
  }
});
test('product CRUD preserves technical details and uses real reference IDs', async ({ page }) => {
  const mock = await mockApi(page); await page.goto('/products');
  await page.getByRole('button', { name: 'Sửa sản phẩm', exact: true }).click(); await expect(page.getByLabel('Công suất')).toHaveValue('700W'); await page.getByLabel('Công suất').fill('900W'); await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0); expect(mock.requests.find(r => r.resource === 'san-pham' && r.method === 'PUT')?.body.thong_so).toEqual([{ma_thong_so:3,gia_tri:'900W',gia_tri_so:null,gia_tri_bool:null}]);
  await page.getByRole('button', { name: 'Thêm sản phẩm', exact: true }).click(); await page.getByLabel('Mã sản phẩm', { exact: true }).fill('SP-NEW'); await page.getByLabel('Tên sản phẩm', { exact: true }).fill('Ấm điện mới');
  await page.getByLabel('Danh mục', { exact: true }).click(); await page.getByTitle('Gia dụng', { exact: true }).last().click(); await page.getByLabel('Thương hiệu', { exact: true }).click(); await page.getByTitle('Thương hiệu mẫu', { exact: true }).last().click();
  await page.getByLabel('Giá bán (VNĐ)', { exact: true }).fill('500000'); await page.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(page.getByRole('cell', { name: 'Ấm điện mới' })).toBeVisible();
  const created = mock.requests.filter(r => r.resource === 'san-pham' && r.method === 'POST'); expect(created).toHaveLength(1); expect(created[0].body.ma_danh_muc).toBe(8); expect(created[0].body.ma_thuong_hieu).toBe(9);
  await page.getByRole('row').filter({ hasText: 'Ấm điện mới' }).getByRole('button', { name: 'Xóa sản phẩm' }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Xóa', exact: true }).click(); await expect(page.getByRole('cell', { name: 'Ấm điện mới' })).toHaveCount(0);
});
test('account locking, employee CRUD and contact detail/status', async ({ page }) => {
  const mock = await mockApi(page); await page.goto('/customers'); await expect(page.getByRole('button', { name: 'Thêm mới' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sửa', exact: true }).click(); await page.getByLabel('Trạng thái tài khoản').press('ArrowDown'); await page.getByTitle('Đã khóa', { exact: true }).click(); await page.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(page.getByRole('cell', { name: 'Đã khóa' })).toBeVisible();
  await page.goto('/employees'); await page.getByRole('button', { name: 'Thêm mới' }).click(); await page.getByLabel('Họ tên', { exact: true }).fill('Nhân viên mới'); await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  const employee = page.getByRole('row').filter({ hasText: 'Nhân viên mới' }); await expect(employee).toBeVisible(); await employee.getByRole('button', { name: 'Sửa', exact: true }).click(); await page.getByLabel('Chức vụ').fill('Thu ngân'); await page.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(employee).toContainText('Thu ngân');
  await employee.getByRole('button', { name: 'Xóa', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Xóa', exact: true }).click(); await expect(employee).toHaveCount(0);
  await page.goto('/contacts'); await page.getByRole('button', { name: 'Phản hồi', exact: true }).click();
  await expect(page.getByText('Nội dung liên hệ đầy đủ')).toBeVisible();
  await page.getByLabel('Phản hồi khách hàng').fill('Hướng dẫn bảo hành'); await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Phản hồi', exact: true })).toHaveCount(0);
  await page.getByRole('button', {name:'Xem chi tiết'}).click(); await expect(page.getByRole('dialog').getByText('Hướng dẫn bảo hành')).toBeVisible();
  expect(mock.requests.some(r => r.resource === 'lien-he' && r.method === 'PUT' && r.body.phan_hoi === 'Hướng dẫn bảo hành')).toBe(true);
});
test('order detail/status and review filters/deletion', async ({ page }) => {
  const mock = await mockApi(page); await page.goto('/orders'); await expect(page.getByRole('cell', { name: 'LOCAL20', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Xem chi tiết' }).click(); await expect(page.getByRole('cell', { name: 'Nồi cơm điện' })).toBeVisible();
  const drawer = page.getByRole('dialog'); await expect(drawer.getByText('LOCAL20', {exact:true})).toBeVisible(); await expect(drawer.getByText('Tiền hàng', {exact:true})).toBeVisible(); await expect(drawer.getByText('Phí giao hàng', {exact:true})).toBeVisible(); await expect(drawer.getByText(/20[.,]000/)).toBeVisible(); await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Xóa đơn', exact: true })).toBeDisabled(); await page.getByRole('combobox', { name: 'Đổi trạng thái đơn 10' }).press('ArrowDown'); await page.getByTitle('Đã xác nhận', { exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.getByRole('cell', { name: 'Đã xác nhận', exact: true })).toBeVisible();
  await page.goto('/reviews'); await expect(page.getByRole('cell', { name: 'Sản phẩm tốt' })).toBeVisible(); await page.getByRole('combobox', { name: 'Lọc số sao' }).press('ArrowDown'); await page.getByTitle('5 sao', { exact: true }).click();
  await expect.poll(() => mock.requests.some(r => r.resource === 'danh-gia' && r.search.includes('so_sao=5'))).toBe(true);
  await page.getByRole('button', { name: 'Xóa đánh giá', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Xóa', exact: true }).click(); await expect(page.getByText('Chưa có đánh giá')).toBeVisible();
});
test('error/retry, field errors, mobile menu and horizontal table scroll', async ({ page }) => {
  await mockApi(page); let fail = true;
  await page.route('**/api/danh-muc', route => fail ? route.fulfill({ status: 503, json: { message: 'Không thể kết nối máy chủ' } }) : route.fallback());
  await page.goto('/categories'); await expect(page.getByText('Không thể kết nối máy chủ')).toBeVisible(); fail = false; await page.getByRole('button', { name: 'Thử lại' }).click(); await expect(page.getByRole('cell', { name: 'Gia dụng' })).toBeVisible();
  await page.route('**/api/danh-muc', route => route.request().method() === 'POST' ? route.fulfill({ status: 400, json: { message: 'Thông tin không hợp lệ', fieldErrors: { ten_danh_muc: 'Tên đã tồn tại' } } }) : route.fallback());
  await page.getByRole('button', { name: 'Thêm mới' }).click(); await page.getByLabel('Tên danh mục').fill('Gia dụng'); await page.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(page.getByText('Tên đã tồn tại')).toBeVisible(); await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/products'); await page.getByRole('button', { name: 'Mở menu' }).click(); await expect(page.getByRole('dialog').getByRole('link', { name: 'Đơn hàng' })).toBeVisible(); await page.getByRole('dialog').getByRole('link', { name: 'Đơn hàng' }).click(); await expect(page.getByRole('heading', { name: 'Đơn hàng', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.locator('.ant-table-content').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
});
