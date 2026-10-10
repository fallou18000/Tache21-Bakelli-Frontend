const API_URL = import.meta.env.VITE_API_URL;

export async function request(url, options = {}) {
    const response = await fetch(`${API_URL}${url}`, options);

    const data = await response.json();

    return data;
}