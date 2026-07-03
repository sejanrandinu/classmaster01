
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
    async login(email, password, turnstileToken) {
        const data = await client.post('auth/login', { email, password, turnstileToken });
        if (data.token) {
            console.log('API: Login successful, saving token');
            localStorage.setItem('classmaster-token', data.token);
            localStorage.setItem('classmaster-user', JSON.stringify(data.user));
        }
        return data;
    },

    async register(email, password, whatsapp, turnstileToken) {
        const data = await client.post('auth/register', { email, password, whatsapp, turnstileToken });
        if (data.token) {
            localStorage.setItem('classmaster-token', data.token);
        }
        return data;
    },

    async verifyEmail(token) {
        return await client.post('auth/verify-email', { token });
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

export const tutes = {
    async getAll(params = {}) {
        let path = 'tutes';
        const search = new URLSearchParams(params).toString();
        if (search) path += `?${search}`;
        return await client.get(path);
    },
    async create(data) {
        return await client.post('tutes', data);
    },
    async update(id, data) {
        return await client.put(`tutes/${id}`, data);
    },
    async delete(id) {
        return await client.delete(`tutes/${id}`);
    }
};

export const studentTutes = {
    async getAll(params = {}) {
        let path = 'student-tutes';
        const search = new URLSearchParams(params).toString();
        if (search) path += `?${search}`;
        return await client.get(path);
    },
    async markReceived(student_id, tute_id, status = 'Received') {
        return await client.post('student-tutes', { student_id, tute_id, status });
    },
    async remove(student_id, tute_id) {
        return await client.delete(`student-tutes?student_id=${student_id}&tute_id=${tute_id}`);
    }
};

export const exams = {
    getAll: (params) => client.get('exams', params),
    create: (data) => client.post('exams', data),
    update: (id, data) => client.put(`exams/${id}`, data),
    delete: (id) => client.delete(`exams/${id}`)
}

export const examResults = {
    getAll: (params) => client.get('exam-results', params),
    upsert: (data) => client.post('exam-results/upsert', data), 
    getStudentResults: (studentId) => client.get(`exam-results/student/${studentId}`),
    getExamAnalytics: (examId) => client.get(`exam-results/analytics/${examId}`)
}

export const discipline = {
    getAll(params = {}) {
        let path = 'discipline';
        const search = new URLSearchParams(params).toString();
        if (search) path += `?${search}`;
        return client.get(path);
    },
    create(data) {
        return client.post('discipline', data);
    },
    update(id, data) {
        return client.put(`discipline/${id}`, data);
    },
    delete(id) {
        return client.delete(`discipline/${id}`);
    }
};

export const pairings = {
    getAll(params = {}) {
        let path = 'pairings';
        const search = new URLSearchParams(params).toString();
        if (search) path += `?${search}`;
        return client.get(path);
    },
    create(data) {
        return client.post('pairings', data);
    },
    update(id, data) {
        return client.put(`pairings/${id}`, data);
    },
    delete(id) {
        return client.delete(`pairings/${id}`);
    }
};

export const studentsBulk = {
    async bulkReactivate(ids) {
        return await client.post('students/bulk-status', { ids, status: 'Active' });
    },
    async bulkDelete(ids) {
        return await client.post('students/bulk-delete', { ids });
    }
};

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = 'q7mpaptn';
const CLOUDINARY_UPLOAD_PRESET = 'classmaster_unsigned';

export const storage = {
    async upload(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || 'Cloudinary upload failed');
        }

        const data = await response.json();
        // Return { url } so all callers (SettingsPage, TutesPage, etc.) work as-is
        return { url: data.secure_url };
    }
};
