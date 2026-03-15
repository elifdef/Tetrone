const BASE_URL = import.meta.env.VITE_API_URL;

export default async function fetchClient(endpoint, { method = 'GET', body, ...customConfig } = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    if (!(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        method,
        headers: { ...headers, ...customConfig.headers },
        ...customConfig
    };

    if (body && !(body instanceof FormData)) {
        config.body = JSON.stringify(body);
    } else if (body) {
        config.body = body;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.dispatchEvent(new Event('auth_error'));
        }

        const data = response.status !== 204 ? await response.json() : null;

        if (!response.ok) {
            return Promise.reject({ status: response.status, data });
        }

        return data;

    } catch (error) {
        return Promise.reject({ status: null, message: error.message });
    }
}