import i18n from '../i18n';
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

        // помилки бекенда
        if (!response.ok) {
            const errorCode = data?.code || 'ERR_UNKNOWN';

            const translatedMessage = i18n.exists(`api.error.${errorCode}`)
                ? i18n.t(`api.error.${errorCode}`)
                : (data?.message || i18n.t('common.error'));

            return {
                success: false,
                code: errorCode,
                message: translatedMessage,
                data
            };
        }

        // 🟢 УСПІШНІ ЗАПИТИ (2xx)
        const successCode = data?.code;
        const successMessage = (successCode && i18n.exists(`api.success.${successCode}`))
            ? i18n.t(`api.success.${successCode}`)
            : data?.message;

        // БРОНЕБІЙНЕ РОЗПАКУВАННЯ ДАНИХ
        let payload = data?.data !== undefined ? data.data : data;
        let meta = data?.meta || null;

        // Якщо Laravel загорнув Resource всередину нашого data (подвійна матрьошка)
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
            if ('data' in payload) {
                if ('meta' in payload && !meta) {
                    meta = payload.meta;
                }
                payload = payload.data;
            }
        }

        return {
            success: true,
            status: response.status,
            code: successCode,
            message: successMessage,
            data: payload, // Завжди чистий масив або об'єкт
            meta: meta     // Завжди чиста пагінація (якщо є)
        };

    } catch (error) {
        // ❌ ВПАВ ІНТЕРНЕТ АБО СЕРВЕР
        return {
            success: false,
            status: 0,
            code: 'ERR_NETWORK',
            message: i18n.t('api.error.ERR_NETWORK'),
            data: null,
            meta: null
        };
    }
}