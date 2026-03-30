import axios from "axios";

// Create an Axios instance with default configuration
const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
	timeout: 10000, // 10 seconds timeout
	withCredentials: true, // Send cookies with requests
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

// Request interceptor
apiClient.interceptors.request.use(
	(config) => {
		// Modify request config before sending if needed (e.g., adding tokens)
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor
apiClient.interceptors.response.use(
	(response) => {
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		// If error is 401 Unauthorized, and we haven't already retried this request
		if (
			error.response?.status === 401 && 
			!originalRequest._retry && 
			originalRequest.url !== '/auth/refresh' &&
			originalRequest.url !== '/auth/login' &&
			originalRequest.url !== '/auth/login-with-code'
		) {
			originalRequest._retry = true;
			try {
				// Attempt to refresh token
				await axios.post(
					`${apiClient.defaults.baseURL}/auth/refresh`,
					{},
					{ withCredentials: true }
				);
				// If refresh is successful, retry the original request
				return apiClient(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login
				if (typeof window !== 'undefined') {
					window.location.href = '/login';
				}
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default apiClient;
