import { useCallback, useState } from 'react';
import { App, Button, Card, Input, Space, Table } from 'antd';
import { api } from '../api/api';
import { useLoad } from '../hooks/useLoad';
import LoadError from '../components/LoadError';
import { money } from '../utils/format';
import { exportExcel } from '../utils/export';
import { errorMessage } from '../utils/errors';

export default function ReportsPage(){
  const [from,setFrom]=useState(''),[to,setTo]=useState('');
  const {message}=App.useApp();
  const result=useLoad(useCallback(async()=>{const r=await api.get('/shop/reports',{params:{from:from || undefined,to:to || undefined}});return r.data.data as {monthly:any[];bestsellers:any[];low_stock:any[]};},[from,to]));
  return <><h1 className="page-title">Báo cáo bán hàng</h1><Space wrap><label>Từ ngày <Input type="date" aria-label="Từ ngày" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Đến ngày <Input type="date" aria-label="Đến ngày" value={to} onChange={e=>setTo(e.target.value)}/></label><Button onClick={result.reload}>Làm mới</Button><Button onClick={()=>window.print()}>In / PDF</Button></Space>
  <LoadError error={result.error} retry={result.reload}/>
  <Card title="Doanh thu đơn đã giao" className="mt"><Button disabled={result.loading || !!result.error} onClick={()=>void exportExcel('doanh-thu',[{header:'Tháng',key:'thang'},{header:'Số đơn',key:'so_don'},{header:'Doanh thu',key:'doanh_thu'}],result.data?.monthly || []).catch(e=>message.error(errorMessage(e)))}>Xuất Excel</Button><Table rowKey="thang" loading={result.loading} dataSource={result.data?.monthly || []} columns={[{title:'Tháng',dataIndex:'thang'},{title:'Số đơn',dataIndex:'so_don'},{title:'Doanh thu',dataIndex:'doanh_thu',render:money}]}/></Card>
  <Card title="Sản phẩm bán chạy" className="mt"><Table rowKey="ma_san_pham" dataSource={result.data?.bestsellers || []} columns={[{title:'Sản phẩm',dataIndex:'ten_san_pham'},{title:'Đã bán',dataIndex:'da_ban'},{title:'Tiền hàng trước giảm giá',dataIndex:'tien_hang',render:money}]}/></Card>
  <Card title="Tồn kho thấp (tối đa 5 sản phẩm)" className="mt"><Table rowKey={r=>`${r.ma_san_pham}:${r.ten_bien_the || ''}`} dataSource={result.data?.low_stock || []} columns={[{title:'Sản phẩm',dataIndex:'ten_san_pham'},{title:'Biến thể',dataIndex:'ten_bien_the'},{title:'Tồn kho',dataIndex:'so_luong'}]}/></Card></>;
}
