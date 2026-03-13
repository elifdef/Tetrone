import axios from 'axios';
import { API_URL } from "../config"

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token)
        config.headers.Authorization = `Bearer ${token}`;

    const currentLang = localStorage.getItem('lang') || 'en';
    config.headers['Accept-Language'] = currentLang;

    return config;
});

export default api;