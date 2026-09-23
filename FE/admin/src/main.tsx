import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { App as AntApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#176b52', borderRadius: 10 } }}><AntApp><App /></AntApp></ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
