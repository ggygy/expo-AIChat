interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST';
  data?: any;
  headers?: Record<string, string>;
}

function objectToQueryString(obj: Record<string, any>): string {
  return Object.keys(obj)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

export async function customFetch(config: RequestConfig) {
  const { url, method = 'GET', data, headers = {} } = config;
  
  let finalUrl = url;
  if (method === 'GET' && data) {
    finalUrl = `${url}${url.includes('?') ? '&' : '?'}${objectToQueryString(data)}`;
  }

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (method === 'POST' && data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(finalUrl, options);
    return await response.json();
  } catch (error) {
    throw error;
  }
}
