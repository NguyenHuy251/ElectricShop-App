import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  timeout: 20000,
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
let refreshing:Promise<void>|null=null;
async function refreshToken(){
  const saved=localStorage.getItem('admin_refresh_token');
  if(!saved)throw new Error('No refresh token');
  const r=await axios.post(`${API_BASE_URL}/auth/refresh`,{refresh_token:saved},{timeout:15000});
  if(localStorage.getItem('admin_refresh_token')!==saved)throw new Error('Session changed');
  localStorage.setItem('admin_token',r.data.data.token);localStorage.setItem('admin_refresh_token',r.data.data.refresh_token);
}

api.interceptors.response.use(
  (response) => {
    const resolveImages=(value:unknown):unknown=>{
      if(typeof value==='string' && value.startsWith('/uploads/'))return API_BASE_URL.replace(/\/api\/?$/,'')+value;
      if(Array.isArray(value))return value.map(resolveImages);
      if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,resolveImages(item)]));
      return value;
    };
    response.data=resolveImages(response.data);return response;
  },
  async (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/auth/login') {
      if(error.config && !error.config._retried && !['/auth/refresh','/auth/logout'].includes(error.config.url)){
        error.config._retried=true;
        try{refreshing ||= refreshToken().finally(()=>{refreshing=null;});await refreshing;return api.request(error.config);}catch(e:any){if(e.isAxiosError && (!e.response || e.response.status>=500))return Promise.reject(e);}
      }
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
      window.dispatchEvent(new Event('admin:unauthorized'));
    }
    return Promise.reject(error);
  },
);
