export function resolveApiImages(value: unknown, baseUrl: string): unknown {
  if (typeof value === 'string' && value.startsWith('/uploads/')) return baseUrl.replace(/\/api\/?$/, '') + value;
  if (Array.isArray(value)) return value.map(item => resolveApiImages(item,baseUrl));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,resolveApiImages(item,baseUrl)]));
  return value;
}
