import test from 'node:test';
import assert from 'node:assert/strict';
import { discount, voucherCode } from '../dist/services/voucher.service.js';
const v={ma_voucher:1,code:'SAVE10',loai:'PhanTram',gia_tri:10,don_toi_thieu:1000000,giam_toi_da:200000,bat_dau:new Date('2020-01-01'),ket_thuc:new Date('2099-01-01'),gioi_han:2,moi_khach:1,hoat_dong:1};
test('normalizes codes and rejects malformed input',()=>{assert.equal(voucherCode(' save10 '),'SAVE10');assert.equal(voucherCode(undefined),'');assert.throws(()=>voucherCode({}));assert.throws(()=>voucherCode('a b'));});
test('percentage discount respects cap and fixed amount cannot exceed subtotal',()=>{assert.equal(discount(v,1500000,0,0),150000);assert.equal(discount(v,10000000,0,0),200000);assert.equal(discount({...v,loai:'SoTien',gia_tri:2000000,giam_toi_da:null},1000000,0,0),1000000);});
test('rejects expired, future, inactive, minimum and usage restrictions',()=>{for(const input of [{...v,hoat_dong:0},{...v,bat_dau:new Date('2098-01-01')},{...v,ket_thuc:new Date('2021-01-01')}])assert.throws(()=>discount(input,1000000,0,0));assert.throws(()=>discount(v,999999,0,0));assert.throws(()=>discount(v,1000000,2,0));assert.throws(()=>discount(v,1000000,0,1));});
