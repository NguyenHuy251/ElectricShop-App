import { useCallback, useState } from 'react';
import { App, Button, Card, Form, Input, InputNumber, Table, Switch, Select, Space } from 'antd';
import { api } from '../api/api';
import { useLoad } from '../hooks/useLoad';
import LoadError from '../components/LoadError';
import { errorMessage } from '../utils/errors';
import { money, dateTime } from '../utils/format';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';

export default function ShopOperationsPage({kind}:{kind:'vouchers'|'inventory'}) {
  const {message}=App.useApp();
  const [form]=Form.useForm();
  const [busy,setBusy]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [variants,setVariants]=useState<{ma_bien_the:number;ten_bien_the:string}[]>([]);
  const result=useLoad(useCallback(async()=>{const response=await api.get(`/shop/${kind}`);return response.data.data as any[];},[kind]));
  const products=useLoad(useCallback(async()=>{const response=await api.get('/san-pham',{params:{limit:100}});return response.data.data as any[];},[]));
  const save=async(values:any)=>{
    setBusy(true);
    try{await api.post(`/shop/${kind}`,values);form.resetFields();setVariants([]);setShowForm(false);message.success('Đã lưu');await result.reload();}
    catch(e){message.error(errorMessage(e));}finally{setBusy(false);}
  };
  return <><div className="page-heading"><h1 className="page-title">{kind==='vouchers'?'Mã giảm giá':'Nhập kho'}</h1><Button type={showForm ? 'default' : 'primary'} icon={showForm ? <CloseOutlined /> : <PlusOutlined />} disabled={busy} aria-expanded={showForm} aria-controls="shop-add-form" onClick={()=>setShowForm(current=>!current)}>{showForm ? 'Ẩn form thêm' : kind==='vouchers' ? 'Thêm mã giảm giá' : 'Tạo phiếu nhập'}</Button></div><LoadError error={result.error || products.error} retry={()=>{void result.reload();void products.reload();}}/>
    {showForm && <Card id="shop-add-form" title={kind==='vouchers'?'Tạo mã giảm giá':'Tạo phiếu nhập'}><Form form={form} layout="vertical" onFinish={save}>
      {kind==='vouchers'? <>
        <Form.Item name="ma_code" label="Mã giảm giá" rules={[{required:true,pattern:/^[A-Za-z0-9_-]{3,32}$/,message:'Nhập 3–32 ký tự chữ, số, gạch ngang hoặc gạch dưới.'}]}><Input maxLength={32} autoComplete="off"/></Form.Item>
        <Form.Item name="giam_tien" label="Số tiền giảm (đ)" rules={[{required:true}]}><InputNumber min={1} max={1e9}/></Form.Item>
        <Form.Item name="don_toi_thieu" label="Giá trị đơn tối thiểu (đ)" initialValue={0}><InputNumber min={0} max={1e12}/></Form.Item>
        <Form.Item name="so_luot" label="Tổng lượt sử dụng" rules={[{required:true}]}><InputNumber min={1} max={1e6} precision={0}/></Form.Item>
        <Form.Item name="bat_dau" label="Bắt đầu" rules={[{required:true}]}><Input type="datetime-local"/></Form.Item>
        <Form.Item name="ket_thuc" label="Kết thúc" rules={[{required:true}]}><Input type="datetime-local"/></Form.Item>
      </> : <>
        <Form.Item name="ma_san_pham" label="Sản phẩm" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={(products.data || []).map(p=>({value:p.ma_san_pham,label:p.ten_san_pham}))} onChange={async(id:number)=>{form.setFieldValue('ma_bien_the',undefined);try{const r=await api.get(`/san-pham/${id}`);setVariants(r.data.data.variants || []);}catch(e){message.error(errorMessage(e));}}}/></Form.Item>
        <Form.Item name="ma_bien_the" label="Biến thể" rules={[{required:variants.length>0}]}><Select allowClear disabled={!variants.length} options={variants.map(v=>({value:v.ma_bien_the,label:v.ten_bien_the}))}/></Form.Item>
        <Form.Item name="so_luong" label="Số lượng nhập" rules={[{required:true}]}><InputNumber min={1} max={1e6} precision={0}/></Form.Item>
        <Form.Item name="ghi_chu" label="Ghi chú"><Input.TextArea maxLength={500}/></Form.Item>
      </>}
      <Space><Button htmlType="submit" type="primary" loading={busy}>Lưu</Button><Button disabled={busy} onClick={()=>{form.resetFields();setVariants([]);setShowForm(false);}}>Hủy</Button></Space>
    </Form></Card>}
    <div className="card mt"><Space><Button onClick={result.reload}>Làm mới</Button></Space><Table rowKey={kind==='vouchers'?'ma_voucher':'ma_nhap'} loading={result.loading} dataSource={result.data || []} scroll={{x:900}} columns={kind==='vouchers' ? [
      {title:'Mã',dataIndex:'ma_code'},{title:'Giảm',dataIndex:'giam_tien',render:(value,r)=>r.loai==='PhanTram'?`${value}%${r.giam_toi_da!=null?` (tối đa ${money(r.giam_toi_da)})`:''}`:money(value)},{title:'Đơn tối thiểu',dataIndex:'don_toi_thieu',render:money},{title:'Đã dùng',render:(_,r)=>`${r.da_dung}/${r.so_luot}`},{title:'Lượt/khách',render:(_,r)=>r.moi_khach || 'Không giới hạn'},{title:'Hết hạn',dataIndex:'ket_thuc',render:dateTime},{title:'Hoạt động',render:(_,r)=><Switch checked={Boolean(r.trang_thai)} onChange={async(trang_thai)=>{try{await api.put(`/shop/vouchers/${r.ma_voucher}`,{trang_thai});await result.reload();}catch(e){message.error(errorMessage(e));}}}/>}
    ] : [{title:'Sản phẩm',dataIndex:'ten_san_pham'},{title:'Biến thể',dataIndex:'ten_bien_the'},{title:'Số lượng',dataIndex:'so_luong'},{title:'Người nhập',dataIndex:'ho_ten'},{title:'Ngày nhập',dataIndex:'ngay_nhap',render:dateTime},{title:'Ghi chú',dataIndex:'ghi_chu'}]}/></div></>;
}
