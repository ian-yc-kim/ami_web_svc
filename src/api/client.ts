import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.BASE_URL ?? '/'

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, redirect to login respecting Vite base
    if (error?.response?.status === 401) {
      const base = import.meta.env.BASE_URL ?? '/'
      const loginPath = base.endsWith('/') ? `${base}login` : `${base}/login`
      try {
        // prefer assign to allow test stubbing
        window.location.assign(loginPath)
      } catch (e) {
        // fallback if assign is not writable in some environments
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.location.href = loginPath
      }
    }

    console.error('API client:', error)
    return Promise.reject(error)
  },
)

export default apiClient
