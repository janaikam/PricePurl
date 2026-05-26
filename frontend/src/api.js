const API_BASE_URL = 'http://localhost:3001';

const readJson = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
};

const requestJson = async (path, {
  method = 'GET',
  body,
  accessToken = '',
  onUnauthorized,
} = {}) => {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && onUnauthorized) {
    await onUnauthorized();
  }

  return readJson(response, 'Request failed');
};

export const fetchProductInfo = async (url) => {
  return requestJson('/scrape', {
    method: 'POST',
    body: { url },
  });
};

export const createApiClient = ({ getAccessToken, onUnauthorized } = {}) => {
  const getRequiredAccessToken = async () => {
    const accessToken = await getAccessToken?.();

    if (!accessToken) {
      throw new Error('Authentication is required');
    }

    return accessToken;
  };

  const requestWithAuth = async (path, options = {}, fallbackMessage) => {
    const accessToken = await getRequiredAccessToken();

    try {
      return await requestJson(path, {
        ...options,
        accessToken,
        onUnauthorized,
      });
    } catch (error) {
      if (!error.message || error.message === 'Request failed') {
        throw new Error(fallbackMessage);
      }

      throw error;
    }
  };

  return {
    fetchYarnList: async () => requestWithAuth('/api/yarn', {}, 'Failed to load yarn list'),
    checkYarnDuplicate: async (name) => requestWithAuth(
      `/api/yarn/check?name=${encodeURIComponent(name)}`,
      {},
      'Failed to check for duplicate yarns'
    ),
    createYarnEntry: async (yarn, { allowDuplicate = false } = {}) => requestWithAuth(
      '/api/yarn',
      {
        method: 'POST',
        body: { yarn, allowDuplicate },
      },
      'Failed to add yarn'
    ),
    updateYarnEntry: async (id, yarn) => requestWithAuth(
      `/api/yarn/${id}`,
      {
        method: 'PUT',
        body: { yarn },
      },
      'Failed to update yarn'
    ),
    updateYarnEntryStatus: async (id, status) => requestWithAuth(
      `/api/yarn/${id}`,
      {
        method: 'PATCH',
        body: { status },
      },
      'Failed to update yarn status'
    ),
    deleteYarnEntry: async (id) => requestWithAuth(
      `/api/yarn/${id}`,
      {
        method: 'DELETE',
      },
      'Failed to delete yarn'
    ),
  };
};
