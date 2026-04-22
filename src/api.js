
// Custom API Client for Cloudflare Workers + D1
// Replaces Supabase SDK

const API_URL = '/api';

const getAuthToken = () => localStorage.getItem('classmaster-token');

export const client = {
    async request(path, options = {}) {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/${path}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            localStorage.removeItem('classmaster-token');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        let data = {};
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (e) {
                console.error('JSON Parse Error:', e);
            }
        } else {
            // Probably HTML or text error from Cloudflare
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        if (!response.ok) {
            throw new Error(data.error || `API Error ${response.status}`);
        }

        return data;
    },

    get(path) { return this.request(path, { method: 'GET' }); },
    post(path, data) { return this.request(path, { method: 'POST', body: JSON.stringify(data) }); },
    put(path, data) { return this.request(path, { method: 'PUT', body: JSON.stringify(data) }); },
    delete(path) { return this.request(path, { method: 'DELETE' }); }
};

export const auth = {
    async login(email, password) {
        const data = await client.post('auth/login', { email, password });
        if (data.token) {
            console.log('API: Login successful, saving token');
            localStorage.setItem('classmaster-token', data.token);
            localStorage.setItem('classmaster-user', JSON.stringify(data.user));
        }
        return data;
    },

    async register(email, password, whatsapp) {
        const data = await client.post('auth/register', { email, password, whatsapp });
        if (data.token) {
            localStorage.setItem('classmaster-token', data.token);
        }
        return data;
    },

    logout() {
        localStorage.removeItem('classmaster-token');
        localStorage.removeItem('classmaster-user');
        window.location.href = '/login';
    },

    async getUser() {
        try {
            console.log('API: Fetching current user profile...');
            const user = await client.get('me');
            console.log('API: User profile fetched:', user?.email);
            return user;
        } catch (e) {
            console.error('API: Failed to get user:', e.message);
            return null;
        }
    },

    async forgotPassword(email) {
        return await client.post('auth/reset-password', { email });
    },

    async changePassword(newPassword) {
        return await client.put('me/password', { password: newPassword });
    }
};
