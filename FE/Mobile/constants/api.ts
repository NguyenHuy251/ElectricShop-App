import Constants from 'expo-constants';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const backendPort = process.env.EXPO_PUBLIC_BACKEND_PORT?.trim() || '3000';

function getExpoHost() {
	const hostUri = Constants.expoConfig?.hostUri;
	return hostUri?.split(':')[0] || 'localhost';
}

export const API_BASE_URL = !configuredUrl || configuredUrl.toLowerCase() === 'auto'
	? `http://${getExpoHost()}:${backendPort}/api`
	: configuredUrl.replace(/\/$/, '');
