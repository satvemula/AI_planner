/**
 * API Wrapper Module
 * Handles communication with the backend server
 */

// Detect environment and set API URL
function getApiBaseUrl() {
    // Check if running in Capacitor (mobile app)
    if (window.Capacitor) {
        // Production API URL - UPDATE THIS with your deployed backend URL
        // For development, you can use your local IP address (e.g., http://192.168.1.100:8000)
        return 'https://api.plannerwinter.com/api/v1'; // Replace with your actual API URL
    }

    // Web development & Production (Same Origin)
    // When served by the backend, /api/v1 is relative to the root.
    // If running via http-server separately, we might need localhost:8000, 
    // but let's assume unified deployment or proxy.
    // Ideally, for local dev with separate servers, we keep the localhost:8000 fallback,
    // but for production web app served by FastAPI, we want relative path.

    if (window.location.hostname === 'localhost' && window.location.port === '8080') {
        // Local development with separate frontend server
        return 'http://localhost:8000/api/v1';
    }

    // Production Web App (served by backend)
    return '/api/v1';
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Generic fetch wrapper that handles auth headers and errors
 */
async function fetchAPI(endpoint, options = {}) {
    // Use secure storage for mobile, localStorage for web
    let token;
    if (window.Capacitor) {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key: 'access_token' });
        token = value;
    } else {
        token = localStorage.getItem('access_token');
    }

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle 401 Unauthorized - Redirect to login
        if (response.status === 401) {
            if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
                // Clear tokens from secure storage
                if (window.Capacitor) {
                    const { Preferences } = await import('@capacitor/preferences');
                    await Preferences.remove({ key: 'access_token' });
                    await Preferences.remove({ key: 'refresh_token' });
                    await Preferences.remove({ key: 'user' });
                } else {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                }
                window.location.reload(); // Will trigger auth check in app.js
                return null; // Stop processing
            }
        }

        // Parse JSON if content exists
        const data = response.status !== 204 ? await response.json() : null;

        if (!response.ok) {
            throw new Error(data?.detail || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export const api = {
    // Authentication
    auth: {
        async register(email, name, password) {
            return fetchAPI('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, name, password })
            });
        },

        async login(email, password) {
            return fetchAPI('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: email, password })
            });
        },

        async getMe() {
            return fetchAPI('/auth/me');
        }
    },

    // Tasks
    tasks: {
        async getAll(filters = {}) {
            const queryParams = new URLSearchParams();
            if (filters.due_date) queryParams.append('due_date', filters.due_date);
            if (filters.is_scheduled !== undefined) queryParams.append('is_scheduled', filters.is_scheduled);
            if (filters.is_completed !== undefined) queryParams.append('is_completed', filters.is_completed);
            if (filters.category) queryParams.append('category', filters.category);

            const queryString = queryParams.toString();
            const endpoint = `/tasks${queryString ? '?' + queryString : ''}`;

            return fetchAPI(endpoint);
        },

        async create(taskData) {
            return fetchAPI('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
        },

        async update(taskId, updates) {
            return fetchAPI(`/tasks/${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
        },

        async delete(taskId) {
            return fetchAPI(`/tasks/${taskId}`, {
                method: 'DELETE'
            });
        },

        async estimateDuration(description) {
            return fetchAPI('/tasks/estimate-duration', {
                method: 'POST',
                body: JSON.stringify({ task_description: description })
            });
        },

        async schedule(taskId, time) {
            return fetchAPI(`/tasks/${taskId}/schedule`, {
                method: 'POST',
                body: JSON.stringify({ scheduled_start_time: time })
            });
        },

        async unschedule(taskId) {
            return fetchAPI(`/tasks/${taskId}/schedule`, {
                method: 'DELETE'
            });
        }
    },

    // Calendar
    calendar: {
        async getEvents(startDate, endDate, provider = null) {
            const queryParams = new URLSearchParams();
            queryParams.append('start_date', startDate);
            queryParams.append('end_date', endDate);
            if (provider) queryParams.append('provider', provider);

            return fetchAPI(`/calendar/events?${queryParams.toString()}`);
        },

        async getConnections() {
            return fetchAPI('/calendar/connections');
        },

        async syncCalendar(connectionId = null) {
            const queryParams = connectionId ? `?connection_id=${connectionId}` : '';
            return fetchAPI(`/calendar/sync${queryParams}`, {
                method: 'POST'
            });
        },

        async connectGoogle() {
            return fetchAPI('/calendar/connect/google');
        },

        async connectMicrosoft() {
            return fetchAPI('/calendar/connect/microsoft');
        }
    }
};
