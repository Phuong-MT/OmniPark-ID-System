import axios from "axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Create an Axios instance specifically for Server Components
export const axiosServer = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
	timeout: 10000,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

// Request interceptor to attach SSR cookies
axiosServer.interceptors.request.use(
	async (config) => {
		// If this is a retry request, we've already manually set the new cookies
		// so we shouldn't overwrite them with the old read-only context ones.
		if ((config as any)._retry) {
			return config;
		}

		// next/headers cookies() is read-only in Server Components
		// We await it for Next.js 15+ compatibility
		const cookieStore = await cookies();
		const cookieString = cookieStore
			.getAll()
			.map((c) => `${c.name}=${c.value}`)
			.join("; ");

		if (cookieString) {
			config.headers.Cookie = cookieString;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor
axiosServer.interceptors.response.use(
	(response) => {
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		// If SSR fetch encounters an unauthorized request, attempt token refresh
		if (
			error.response?.status === 401 &&
			!originalRequest._retry &&
			originalRequest.url !== '/auth/refresh' &&
			originalRequest.url !== '/auth/login' &&
			originalRequest.url !== '/auth/login-with-code'
		) {
			originalRequest._retry = true;
			try {
				const cookieStore = await cookies();
				const cookieString = cookieStore
					.getAll()
					.map((c) => `${c.name}=${c.value}`)
					.join("; ");

				const refreshRes = await axios.post(
					`${axiosServer.defaults.baseURL}/auth/refresh`,
					{},
					{
						headers: { Cookie: cookieString },
						withCredentials: true,
					}
				);

				const setCookieHeader = refreshRes.headers["set-cookie"];
				if (setCookieHeader) {
					let newCookieStr = cookieString;
					setCookieHeader.forEach(sc => {
						const [nameValue] = sc.split(';');
						const [name, ...valParts] = nameValue.split('=');
						const value = valParts.join('=');
						newCookieStr = newCookieStr.split('; ').filter(c => !c.trim().startsWith(`${name.trim()}=`)).join('; ');
						newCookieStr = newCookieStr ? `${newCookieStr}; ${name.trim()}=${value}` : `${name.trim()}=${value}`;
					});
					originalRequest.headers.Cookie = newCookieStr;
				}
				return await axiosServer(originalRequest);
			} catch (refreshError) {
				// Refresh failed, fall through to redirect
			}

			// Safe outside catch block to avoid intercepting NEXT_REDIRECT error
			redirect("/login");
		}

		return Promise.reject(error);
	}
);
