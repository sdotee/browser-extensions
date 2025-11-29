/**
 * Chrome Storage Utilities for S.EE Extension
 */

// Storage keys
export const STORAGE_KEYS = {
  API_KEY: 'see_api_key',
  DOMAINS: 'see_domains',
  DEFAULT_DOMAIN: 'see_default_domain',
  HISTORY: 'see_history',
  AUTO_COPY: 'see_auto_copy',
  THEME: 'see_theme',
} as const;

// History item interface
export interface HistoryItem {
  id: string;
  createdAt: number;
  originalUrl: string;
  shortUrl: string;
  domain: string;
  slug?: string;
}

// Items per page for history pagination
export const HISTORY_PAGE_SIZE = 10;

/**
 * Get value from chrome.storage.sync
 */
export async function getSyncStorage<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result[key] ?? null);
    });
  });
}

/**
 * Set value in chrome.storage.sync
 */
export async function setSyncStorage<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, () => {
      resolve();
    });
  });
}

/**
 * Remove value from chrome.storage.sync
 */
export async function removeSyncStorage(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(key, () => {
      resolve();
    });
  });
}

/**
 * Get value from chrome.storage.local
 */
export async function getLocalStorage<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] ?? null);
    });
  });
}

/**
 * Set value in chrome.storage.local
 */
export async function setLocalStorage<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}

/**
 * Remove value from chrome.storage.local
 */
export async function removeLocalStorage(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => {
      resolve();
    });
  });
}

// Specific storage functions

/**
 * Get stored API key
 */
export async function getApiKey(): Promise<string | null> {
  return getSyncStorage<string>(STORAGE_KEYS.API_KEY);
}

/**
 * Save API key
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  return setSyncStorage(STORAGE_KEYS.API_KEY, apiKey);
}

/**
 * Remove API key
 */
export async function removeApiKey(): Promise<void> {
  return removeSyncStorage(STORAGE_KEYS.API_KEY);
}

/**
 * Get stored domains
 */
export async function getDomains(): Promise<string[] | null> {
  return getSyncStorage<string[]>(STORAGE_KEYS.DOMAINS);
}

/**
 * Save domains
 */
export async function saveDomains(domains: string[]): Promise<void> {
  return setSyncStorage(STORAGE_KEYS.DOMAINS, domains);
}

/**
 * Get default domain
 */
export async function getDefaultDomain(): Promise<string | null> {
  return getSyncStorage<string>(STORAGE_KEYS.DEFAULT_DOMAIN);
}

/**
 * Save default domain
 */
export async function saveDefaultDomain(domain: string): Promise<void> {
  return setSyncStorage(STORAGE_KEYS.DEFAULT_DOMAIN, domain);
}

/**
 * Get auto-copy setting
 */
export async function getAutoCopy(): Promise<boolean> {
  const value = await getSyncStorage<boolean>(STORAGE_KEYS.AUTO_COPY);
  return value ?? true; // Default to true
}

/**
 * Save auto-copy setting
 */
export async function saveAutoCopy(autoCopy: boolean): Promise<void> {
  return setSyncStorage(STORAGE_KEYS.AUTO_COPY, autoCopy);
}

/**
 * Get theme preference
 */
export async function getTheme(): Promise<'light' | 'dark' | null> {
  return getSyncStorage<'light' | 'dark'>(STORAGE_KEYS.THEME);
}

/**
 * Save theme preference
 */
export async function saveTheme(theme: 'light' | 'dark'): Promise<void> {
  return setSyncStorage(STORAGE_KEYS.THEME, theme);
}

/**
 * Get history items
 */
export async function getHistory(): Promise<HistoryItem[]> {
  const history = await getLocalStorage<HistoryItem[]>(STORAGE_KEYS.HISTORY);
  return history ?? [];
}

/**
 * Add item to history
 */
export async function addToHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>): Promise<void> {
  const history = await getHistory();

  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  // Add to beginning of array (no limit)
  const updatedHistory = [newItem, ...history];

  return setLocalStorage(STORAGE_KEYS.HISTORY, updatedHistory);
}

/**
 * Delete single history item by id
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  const history = await getHistory();
  const updatedHistory = history.filter(item => item.id !== id);
  return setLocalStorage(STORAGE_KEYS.HISTORY, updatedHistory);
}

/**
 * Delete multiple history items by ids
 */
export async function deleteHistoryItems(ids: string[]): Promise<void> {
  const history = await getHistory();
  const idsSet = new Set(ids);
  const updatedHistory = history.filter(item => !idsSet.has(item.id));
  return setLocalStorage(STORAGE_KEYS.HISTORY, updatedHistory);
}

/**
 * Clear history
 */
export async function clearHistory(): Promise<void> {
  return removeLocalStorage(STORAGE_KEYS.HISTORY);
}

/**
 * Clear all stored data (for reset)
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    removeSyncStorage(STORAGE_KEYS.API_KEY),
    removeSyncStorage(STORAGE_KEYS.DOMAINS),
    removeSyncStorage(STORAGE_KEYS.DEFAULT_DOMAIN),
    removeLocalStorage(STORAGE_KEYS.HISTORY),
  ]);
}
