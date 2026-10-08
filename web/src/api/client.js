const API_URL = 'URL_API_PROSPECTS';

export async function request(url, options = {}) {
    const response = await fetch(`${API_URL}${url}`, options);
    return response.json();
}

export function getProspects() {
    return request('/prospects', { method: 'GET' });
}