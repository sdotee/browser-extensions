/**
 * S.EE Chrome Extension - Background Service Worker
 * Handles context menu and background operations
 */

import { UrlShortenSDK, UrlShortenerError, NetworkError } from './sdk';
import {
  getApiKey,
  getDomains,
  getDefaultDomain,
  addToHistory,
  getAutoCopy,
} from './storage';

// Context menu IDs
const MENU_ID_SHORTEN_PAGE = 'see-shorten-page';
const MENU_ID_SHORTEN_LINK = 'see-shorten-link';
const MENU_ID_QR_PAGE = 'see-qr-page';
const MENU_ID_QR_LINK = 'see-qr-link';

// Create context menus on installation
chrome.runtime.onInstalled.addListener(() => {
  // Parent menu for page
  chrome.contextMenus.create({
    id: MENU_ID_SHORTEN_PAGE,
    title: 'Shorten this page',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: MENU_ID_QR_PAGE,
    title: 'Generate QR Code for this page',
    contexts: ['page'],
  });

  // Parent menu for links
  chrome.contextMenus.create({
    id: MENU_ID_SHORTEN_LINK,
    title: 'Shorten this link',
    contexts: ['link'],
  });

  chrome.contextMenus.create({
    id: MENU_ID_QR_LINK,
    title: 'Generate QR Code for this link',
    contexts: ['link'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuId = info.menuItemId;
  const tabId = tab?.id;

  // Determine the URL to process
  let targetUrl: string | undefined;

  if (menuId === MENU_ID_SHORTEN_LINK || menuId === MENU_ID_QR_LINK) {
    targetUrl = info.linkUrl;
  } else if (menuId === MENU_ID_SHORTEN_PAGE || menuId === MENU_ID_QR_PAGE) {
    targetUrl = info.pageUrl || tab?.url;
  }

  if (!targetUrl) {
    showNotification('Error', 'Could not get URL');
    return;
  }

  // Check if API key is configured
  const apiKey = await getApiKey();
  if (!apiKey) {
    showNotification('Setup Required', 'Please configure your API token first by clicking the extension icon.');
    return;
  }

  // Handle the action
  if (menuId === MENU_ID_SHORTEN_PAGE || menuId === MENU_ID_SHORTEN_LINK) {
    await handleShortenUrl(targetUrl, apiKey, tabId);
  } else if (menuId === MENU_ID_QR_PAGE || menuId === MENU_ID_QR_LINK) {
    await handleGenerateQR(targetUrl, apiKey);
  }
});

// Shorten URL
async function handleShortenUrl(url: string, apiKey: string, tabId?: number): Promise<void> {
  try {
    // Get domain
    let domains = await getDomains();
    if (!domains || domains.length === 0) {
      // Try to fetch domains
      const sdk = new UrlShortenSDK({ baseUrl: 'https://s.ee', apiKey });
      const response = await sdk.listDomains();
      domains = response.data.domains;
    }

    const defaultDomain = await getDefaultDomain();
    const domain = defaultDomain && domains.includes(defaultDomain) ? defaultDomain : domains[0];

    if (!domain) {
      showNotification('Error', 'No domain available');
      return;
    }

    // Create short URL
    const sdk = new UrlShortenSDK({ baseUrl: 'https://s.ee', apiKey });
    const response = await sdk.create({
      domain,
      target_url: url,
    });

    const shortUrl = response.data.short_url;

    // Save to history
    await addToHistory({
      originalUrl: url,
      shortUrl,
      domain,
      slug: response.data.slug,
    });

    // Copy to clipboard if enabled
    const autoCopy = await getAutoCopy();
    if (autoCopy) {
      const copied = await copyToClipboard(shortUrl, tabId);
      if (copied) {
        showNotification('URL Shortened!', `${shortUrl}\n\nCopied to clipboard!`);
      } else {
        showNotification('URL Shortened!', `${shortUrl}\n\n(Could not copy to clipboard)`);
      }
    } else {
      showNotification('URL Shortened!', shortUrl);
    }
  } catch (error) {
    let message = 'Failed to shorten URL';
    if (error instanceof UrlShortenerError) {
      message = error.message;
    } else if (error instanceof NetworkError) {
      message = 'Network error. Please check your connection.';
    }
    showNotification('Error', message);
  }
}

// Generate QR Code - opens popup with QR
async function handleGenerateQR(url: string, apiKey: string): Promise<void> {
  try {
    // Get domain
    let domains = await getDomains();
    if (!domains || domains.length === 0) {
      const sdk = new UrlShortenSDK({ baseUrl: 'https://s.ee', apiKey });
      const response = await sdk.listDomains();
      domains = response.data.domains;
    }

    const defaultDomain = await getDefaultDomain();
    const domain = defaultDomain && domains.includes(defaultDomain) ? defaultDomain : domains[0];

    if (!domain) {
      showNotification('Error', 'No domain available');
      return;
    }

    // Create short URL first
    const sdk = new UrlShortenSDK({ baseUrl: 'https://s.ee', apiKey });
    const response = await sdk.create({
      domain,
      target_url: url,
    });

    const shortUrl = response.data.short_url;

    // Save to history
    await addToHistory({
      originalUrl: url,
      shortUrl,
      domain,
      slug: response.data.slug,
    });

    // Store the URL for the popup to display QR
    await chrome.storage.local.set({
      see_pending_qr: shortUrl,
      see_pending_qr_timestamp: Date.now()
    });

    // Show notification with instruction
    showNotification('QR Code Ready!', `${shortUrl}\n\nClick the extension icon to view and download QR code.`);

  } catch (error) {
    let message = 'Failed to generate QR code';
    if (error instanceof UrlShortenerError) {
      message = error.message;
    } else if (error instanceof NetworkError) {
      message = 'Network error. Please check your connection.';
    }
    showNotification('Error', message);
  }
}

// Show notification
function showNotification(title: string, message: string): void {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: `S.EE - ${title}`,
    message,
  });
}

// Copy to clipboard by injecting script into the active tab
async function copyToClipboard(text: string, tabId?: number): Promise<boolean> {
  try {
    // Get the active tab if not provided
    let targetTabId = tabId;
    if (!targetTabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      targetTabId = tab?.id;
    }

    if (!targetTabId) {
      console.error('No active tab found');
      return false;
    }

    // Inject script to copy to clipboard
    await chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      func: (textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy);
      },
      args: [text],
    });

    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
