import axios from 'axios';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';
import { resolveApiImages } from '../utils/api-images';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
let refreshing:Promise<string>|null=null;
async function refreshToken(){
  const saved=await AsyncStorage.getItem('refresh_token');
  if(!saved)throw new Error('No refresh token');
  const r=await axios.post(`${API_BASE_URL}/auth/refresh`,{refresh_token:saved},{timeout:15000});
  if(await AsyncStorage.getItem('refresh_token')!==saved)throw new Error('Session changed');
  await AsyncStorage.multiSet([['token',r.data.data.token],['refresh_token',r.data.data.refresh_token]]);
  return r.data.data.token as string;
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {response.data=resolveApiImages(response.data,API_BASE_URL);return response;},
  async (error) => {
    if (error.response?.status === 401) {
      if(error.config && !error.config._retried && !['/auth/login','/auth/register','/auth/refresh','/auth/logout'].includes(error.config.url)){
        error.config._retried=true;
        try{refreshing ||= refreshToken().finally(()=>{refreshing=null;});await refreshing;return api.request(error.config);}catch(e:any){if(e.isAxiosError && (!e.response || e.response.status>=500))return Promise.reject(e);}
      }
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user');
      if (error.config?.headers?.Authorization && !['/auth/login', '/auth/register'].includes(error.config?.url)) {
        router.replace('/(auth)/login');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
