const API_BASE_URL = 'http://localhost:3001';

const readJson = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
};

export const fetchProductInfo = async (url) => {
  const response = await fetch(`${API_BASE_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  return readJson(response, 'Failed to fetch product info');
};

export const fetchYarnList = async () => {
  const response = await fetch(`${API_BASE_URL}/api/yarn`);
  return readJson(response, 'Failed to load yarn list');
};

export const checkYarnDuplicate = async (name) => {
  const response = await fetch(`${API_BASE_URL}/api/yarn/check?name=${encodeURIComponent(name)}`);
  return readJson(response, 'Failed to check for duplicate yarns');
};

export const createYarnEntry = async (yarn, { allowDuplicate = false } = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/yarn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ yarn, allowDuplicate }),
  });

  return readJson(response, 'Failed to add yarn');
};

export const updateYarnEntry = async (id, yarn) => {
  const response = await fetch(`${API_BASE_URL}/api/yarn/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ yarn }),
  });

  return readJson(response, 'Failed to update yarn');
};

export const updateYarnEntryStatus = async (id, status) => {
  const response = await fetch(`${API_BASE_URL}/api/yarn/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  return readJson(response, 'Failed to update yarn status');
};

export const deleteYarnEntry = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/yarn/${id}`, {
    method: 'DELETE',
  });

  return readJson(response, 'Failed to delete yarn');
};
