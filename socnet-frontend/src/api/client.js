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
        
        let data = null;
        if (response.status !== 204) {
            try {
                data = await response.json();
            } catch (e) {
                data = { code: 'ERR_SERVER', message: 'Internal Server Error' };
            }
        }

        if (!response.ok) {
            const errorCode = data?.code || 'ERR_UNKNOWN';

            if (response.status === 401 && errorCode !== 'ERR_INVALID_CREDENTIALS') {
                window.dispatchEvent(new CustomEvent('session-expired'));
                throw { 
                    success: false, 
                    code: 'ERR_UNAUTHENTICATED', 
                    message: i18n.t('api.error.ERR_UNAUTHENTICATED') 
                };
            }

            const translatedMessage = i18n.exists(`api.error.${errorCode}`)
                ? i18n.t(`api.error.${errorCode}`)
                : (data?.message || i18n.t('common.error'));

            throw {
                success: false,
                status: response.status,
                code: errorCode,
                message: translatedMessage,
                data
            };
        }

        const successCode = data?.code;
        const successMessage = (successCode && i18n.exists(`api.success.${successCode}`))
            ? i18n.t(`api.success.${successCode}`)
            : data?.message;

        let payload = data?.data !== undefined ? data.data : data;
        let meta = data?.meta || null;
        let extraParams = {};

        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
            if ('data' in payload) {
                if ('meta' in payload && !meta) {
                    meta = payload.meta;
                }

                const { data: _d, meta: _m, ...rest } = payload;
                extraParams = rest;

                payload = payload.data;
            }
        }

        return {
            success: true,
            status: response.status,
            code: successCode,
            message: successMessage,
            data: payload,
            meta: meta,
            ...extraParams
        };

    } catch (error) {
        if (error.success === false) throw error;

        throw {
            success: false,
            status: 0,
            code: 'ERR_NETWORK',
            message: i18n.t('api.error.ERR_NETWORK'),
            data: null,
            meta: null
        };
    }
}