/**
 * Storage utilities for S.EE Browser Extension
 * Uses WXT storage API for cross-browser compatibility
 */

import { storage } from '#imports';

// Storage keys
export const STORAGE_KEYS = {
  API_KEY: 'sync:see_api_key',
  URL_DOMAINS: 'sync:see_url_domains',
  DEFAULT_URL_DOMAIN: 'sync:see_default_url_domain',
  TEXT_DOMAINS: 'sync:see_text_domains',
  DEFAULT_TEXT_DOMAIN: 'sync:see_default_text_domain',
  FILE_DOMAINS: 'sync:see_file_domains',
  AUTO_COPY: 'sync:see_auto_copy',
  THEME: 'sync:see_theme',
  URL_HISTORY: 'local:see_url_history',
  TEXT_HISTORY: 'local:see_text_history',
  FILE_HISTORY: 'local:see_file_history',
} as const;

// History item interfaces
export interface UrlHistoryItem {
  id: string;
  createdAt: number;
  originalUrl: string;
  shortUrl: string;
  domain: string;
  slug?: string;
}

export interface TextHistoryItem {
  id: string;
  createdAt: number;
  title: string;
  shortUrl: string;
  domain: string;
  textType: string;
}

export interface FileHistoryItem {
  id: string;
  createdAt: number;
  filename: string;
  url: string;
  pageUrl: string;
  size: number;
  deleteHash: string;
}

// History page size
export const HISTORY_PAGE_SIZE = 10;

// ==================== API Key ====================

export async function getApiKey(): Promise<string | null> {
  return storage.getItem<string>(STORAGE_KEYS.API_KEY);
}

export async function saveApiKey(apiKey: string): Promise<void> {
  await storage.setItem(STORAGE_KEYS.API_KEY, apiKey);
}

export async function removeApiKey(): Promise<void> {
  await storage.removeItem(STORAGE_KEYS.API_KEY);
}

// ==================== URL Domains ====================

export async function getUrlDomains(): Promise<string[] | null> {
  return storage.getItem<string[]>(STORAGE_KEYS.URL_DOMAINS);
}

export async function saveUrlDomains(domains: string[]): Promise<void> {
  await storage.setItem(STORAGE_KEYS.URL_DOMAINS, domains);
}

export async function getDefaultUrlDomain(): Promise<string | null> {
  return storage.getItem<string>(STORAGE_KEYS.DEFAULT_URL_DOMAIN);
}

export async function saveDefaultUrlDomain(domain: string): Promise<void> {
  await storage.setItem(STORAGE_KEYS.DEFAULT_URL_DOMAIN, domain);
}

// ==================== Text Domains ====================

export async function getTextDomains(): Promise<string[] | null> {
  return storage.getItem<string[]>(STORAGE_KEYS.TEXT_DOMAINS);
}

export async function saveTextDomains(domains: string[]): Promise<void> {
  await storage.setItem(STORAGE_KEYS.TEXT_DOMAINS, domains);
}

export async function getDefaultTextDomain(): Promise<string | null> {
  return storage.getItem<string>(STORAGE_KEYS.DEFAULT_TEXT_DOMAIN);
}

export async function saveDefaultTextDomain(domain: string): Promise<void> {
  await storage.setItem(STORAGE_KEYS.DEFAULT_TEXT_DOMAIN, domain);
}

// ==================== File Domains ====================

export async function getFileDomains(): Promise<string[] | null> {
  return storage.getItem<string[]>(STORAGE_KEYS.FILE_DOMAINS);
}

export async function saveFileDomains(domains: string[]): Promise<void> {
  await storage.setItem(STORAGE_KEYS.FILE_DOMAINS, domains);
}

// ==================== Settings ====================

export async function getAutoCopy(): Promise<boolean> {
  const value = await storage.getItem<boolean>(STORAGE_KEYS.AUTO_COPY);
  return value ?? true;
}

export async function saveAutoCopy(autoCopy: boolean): Promise<void> {
  await storage.setItem(STORAGE_KEYS.AUTO_COPY, autoCopy);
}

export async function getTheme(): Promise<'light' | 'dark' | null> {
  return storage.getItem<'light' | 'dark'>(STORAGE_KEYS.THEME);
}

export async function saveTheme(theme: 'light' | 'dark'): Promise<void> {
  await storage.setItem(STORAGE_KEYS.THEME, theme);
}

// ==================== URL History ====================

export async function getUrlHistory(): Promise<UrlHistoryItem[]> {
  const history = await storage.getItem<UrlHistoryItem[]>(STORAGE_KEYS.URL_HISTORY);
  return history ?? [];
}

export async function addUrlToHistory(item: Omit<UrlHistoryItem, 'id' | 'createdAt'>): Promise<void> {
  const history = await getUrlHistory();
  const newItem: UrlHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await storage.setItem(STORAGE_KEYS.URL_HISTORY, [newItem, ...history]);
}

export async function deleteUrlHistoryItem(id: string): Promise<void> {
  const history = await getUrlHistory();
  await storage.setItem(STORAGE_KEYS.URL_HISTORY, history.filter(item => item.id !== id));
}

export async function deleteUrlHistoryItems(ids: string[]): Promise<void> {
  const history = await getUrlHistory();
  const idsSet = new Set(ids);
  await storage.setItem(STORAGE_KEYS.URL_HISTORY, history.filter(item => !idsSet.has(item.id)));
}

export async function clearUrlHistory(): Promise<void> {
  await storage.removeItem(STORAGE_KEYS.URL_HISTORY);
}

// ==================== Text History ====================

export async function getTextHistory(): Promise<TextHistoryItem[]> {
  const history = await storage.getItem<TextHistoryItem[]>(STORAGE_KEYS.TEXT_HISTORY);
  return history ?? [];
}

export async function addTextToHistory(item: Omit<TextHistoryItem, 'id' | 'createdAt'>): Promise<void> {
  const history = await getTextHistory();
  const newItem: TextHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await storage.setItem(STORAGE_KEYS.TEXT_HISTORY, [newItem, ...history]);
}

export async function deleteTextHistoryItem(id: string): Promise<void> {
  const history = await getTextHistory();
  await storage.setItem(STORAGE_KEYS.TEXT_HISTORY, history.filter(item => item.id !== id));
}

export async function deleteTextHistoryItems(ids: string[]): Promise<void> {
  const history = await getTextHistory();
  const idsSet = new Set(ids);
  await storage.setItem(STORAGE_KEYS.TEXT_HISTORY, history.filter(item => !idsSet.has(item.id)));
}

export async function clearTextHistory(): Promise<void> {
  await storage.removeItem(STORAGE_KEYS.TEXT_HISTORY);
}

// ==================== File History ====================

export async function getFileHistory(): Promise<FileHistoryItem[]> {
  const history = await storage.getItem<FileHistoryItem[]>(STORAGE_KEYS.FILE_HISTORY);
  return history ?? [];
}

export async function addFileToHistory(item: Omit<FileHistoryItem, 'id' | 'createdAt'>): Promise<void> {
  const history = await getFileHistory();
  const newItem: FileHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await storage.setItem(STORAGE_KEYS.FILE_HISTORY, [newItem, ...history]);
}

export async function deleteFileHistoryItem(id: string): Promise<void> {
  const history = await getFileHistory();
  await storage.setItem(STORAGE_KEYS.FILE_HISTORY, history.filter(item => item.id !== id));
}

export async function deleteFileHistoryItems(ids: string[]): Promise<void> {
  const history = await getFileHistory();
  const idsSet = new Set(ids);
  await storage.setItem(STORAGE_KEYS.FILE_HISTORY, history.filter(item => !idsSet.has(item.id)));
}

export async function clearFileHistory(): Promise<void> {
  await storage.removeItem(STORAGE_KEYS.FILE_HISTORY);
}

// ==================== Clear All Data ====================

export async function clearAllData(): Promise<void> {
  await Promise.all([
    storage.removeItem(STORAGE_KEYS.API_KEY),
    storage.removeItem(STORAGE_KEYS.URL_DOMAINS),
    storage.removeItem(STORAGE_KEYS.DEFAULT_URL_DOMAIN),
    storage.removeItem(STORAGE_KEYS.TEXT_DOMAINS),
    storage.removeItem(STORAGE_KEYS.DEFAULT_TEXT_DOMAIN),
    storage.removeItem(STORAGE_KEYS.FILE_DOMAINS),
    storage.removeItem(STORAGE_KEYS.URL_HISTORY),
    storage.removeItem(STORAGE_KEYS.TEXT_HISTORY),
    storage.removeItem(STORAGE_KEYS.FILE_HISTORY),
  ]);
}
