import { test, expect } from '@playwright/test';
import { mockApi } from './fixtures';

test('admin assigns and revokes permission groups from the staff page', async ({ page }) => {
  const mock = await mockApi(page);
  await page.goto('/employees');
  await page.getByRole('button', { name: 'Phân quyền', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(page).toHaveURL(/\/employees$/);
  await expect(page.getByRole('link', { name: 'Phân quyền', exact: true })).toHaveCount(0);
  await modal.getByRole('button', { name: 'Kho', exact: true }).click();
  await expect(modal.getByRole('checkbox')).toHaveCount(8);
  await expect(modal.getByRole('checkbox').nth(1)).toBeChecked();
  await expect(modal.getByRole('checkbox').nth(3)).toBeChecked();
  await modal.getByRole('button', { name: 'Lưu quyền' }).click();
  await expect(modal).toHaveCount(0);
  expect(mock.requests.filter(request => request.resource === 'permissions' && request.method === 'PUT').at(-1)?.body.permissions).toEqual(['catalog','inventory']);
  await expect(page.getByRole('row').filter({hasText:'Nhân viên mẫu'}).getByText('Nhập kho',{exact:true})).toBeVisible();
  await page.getByRole('button', { name: 'Phân quyền', exact: true }).click();
  await modal.getByRole('button', { name: 'Bỏ tất cả' }).click();
  await modal.getByRole('button', { name: 'Lưu quyền' }).click();
  await expect(modal).toHaveCount(0);
  expect(mock.requests.filter(request => request.resource === 'permissions' && request.method === 'PUT').at(-1)?.body.permissions).toEqual([]);
  await expect(page.getByText('Chưa cấp quyền',{exact:true})).toBeVisible();
});

test('staff sees only assigned modules and cannot open restricted routes', async ({ page }) => {
  const mock = await mockApi(page, 'NhanVien', true, ['contacts']);
  await page.goto('/');
  await expect(page).toHaveURL(/contacts/);
  await expect(page.getByRole('link',{name:'Liên hệ',exact:true})).toBeVisible();
  for (const name of ['Tổng quan','Sản phẩm','Nhập kho','Đơn hàng','Báo cáo','Phân quyền']) await expect(page.getByRole('link',{name,exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Xóa',exact:true})).toBeVisible();
  const before = mock.requests.filter(request => request.resource === 'san-pham').length;
  await page.goto('/products');
  await expect(page.getByText('Bạn không có quyền truy cập trang này')).toBeVisible();
  expect(mock.requests.filter(request => request.resource === 'san-pham').length).toBe(before);
  await page.goto('/permissions');
  await expect(page.getByText('Bạn không có quyền truy cập trang này')).toBeVisible();
});

test('employee tab supports unlinked accounts and cancellation preserves saved rights', async ({ page }) => {
  const mock = await mockApi(page);
  mock.data['tai-khoan'].push({ma_tai_khoan:20,ten_dang_nhap:'unlinked-staff',ho_ten:'Tài khoản chưa liên kết',email:'unlinked@example.test',vai_tro:'NhanVien',trang_thai:'HoatDong',permissions:['contacts']});
  await page.goto('/employees');
  await page.getByRole('button',{name:'Phân quyền tài khoản',exact:true}).click();
  const modal=page.getByRole('dialog');
  await expect(modal.getByRole('button',{name:'Lưu quyền'})).toBeDisabled();
  await modal.getByRole('combobox',{name:'Tài khoản phân quyền'}).click();
  await page.getByTitle('Tài khoản chưa liên kết · unlinked-staff · Chưa liên kết hồ sơ',{exact:true}).click();
  await expect(modal.getByRole('checkbox').nth(5)).toBeChecked();
  await modal.getByRole('button',{name:'Bán hàng',exact:true}).click();
  await modal.getByRole('button',{name:'Hủy',exact:true}).click();
  expect(mock.requests.filter(request=>request.resource==='permissions'&&request.method==='PUT')).toHaveLength(0);
  await page.goto('/permissions?account=20');
  await expect(page).toHaveURL(/\/employees$/);
  await expect(modal.getByRole('checkbox').nth(5)).toBeChecked();
  await expect(modal.getByRole('checkbox').nth(2)).not.toBeChecked();
  await modal.getByRole('button',{name:'Bán hàng',exact:true}).click();
  await modal.getByRole('button',{name:'Lưu quyền'}).click();
  await expect(modal).toHaveCount(0);
  expect(mock.data['tai-khoan'].find(account=>account.ma_tai_khoan===20)?.permissions).toEqual(['orders','contacts']);
});

test('unassigned staff starts at their account without management menus', async ({ page }) => {
  await mockApi(page, 'NhanVien', true, []);
  await page.goto('/login');
  await expect(page).toHaveURL(/account/);
  await expect(page.locator('.sidebar-nav a')).toHaveCount(1);
  await expect(page.getByRole('link',{name:'Tài khoản của tôi'})).toBeVisible();
});
