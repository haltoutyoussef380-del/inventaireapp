import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const materielService = {
    getAll: () => api.get('/materiels'),
    getOne: (code: string) => api.get(`/materiels/${code}`),
    create: (data: any) => api.post('/materiels', data),
    getBarcodeUrl: (code: string) => `http://localhost:5000/api/materiels/${code}/barcode`,
};

export const categorieService = {
    getAll: () => api.get('/categories'),
    create: (data: any) => api.post('/categories', data),
};

export const inventaireService = {
    create: (data: any) => api.post('/inventaires', data),
    scan: (data: any) => api.post('/inventaires/scan', data),
    getReport: (id: number) => api.get(`/inventaires/${id}/report`),
};

export default api;
