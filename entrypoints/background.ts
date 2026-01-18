/**
 * S.EE Browser Extension - Background Service Worker
 * Handles context menus, quick actions, and background tasks
 */

import { storage } from '#imports';
import { SeeSDK } from '@/utils/sdk';

// Storage keys matching the storage utility
const STORAGE_KEYS = {
  API_KEY: 'sync:see_api_key',
  DEFAULT_URL_DOMAIN: 'sync:see_default_url_domain',
  AUTO_COPY: 'sync:see_auto_copy',
  URL_HISTORY: 'local:see_url_history',
  TEXT_HISTORY: 'local:see_text_history',
  FILE_HISTORY: 'local:see_file_history',
};

// Context menu IDs
const MENU_IDS = {
  SHORTEN_PAGE: 'see-shorten-page',
  SHORTEN_LINK: 'see-shorten-link',
  SHOW_QR: 'see-show-qr',
  SHARE_SELECTION: 'see-share-selection',
  UPLOAD_IMAGE: 'see-upload-image',
};

export default defineBackground({
  type: 'module',
  main() {
    // Set up context menus when extension is installed
    browser.runtime.onInstalled.addListener(() => {
      createContextMenus();
    });

    // Also create context menus on startup (for Firefox MV3 service worker restarts)
    createContextMenus();

    // Handle context menu clicks
    browser.contextMenus.onClicked.addListener(handleContextMenuClick);

    // Handle messages from popup
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'REFRESH_CONTEXT_MENUS') {
        createContextMenus();
        sendResponse({ success: true });
      }
      return true;
    });

    console.log('S.EE Extension background script loaded', { id: browser.runtime.id });
  },
});

/**
 * Create context menus
 */
function createContextMenus(): void {
  // Remove existing menus
  browser.contextMenus.removeAll().then(() => {
    // Shorten current page
    browser.contextMenus.create({
      id: MENU_IDS.SHORTEN_PAGE,
      title: 'Shorten This Page',
      contexts: ['page'],
    });

    // Shorten link
    browser.contextMenus.create({
      id: MENU_IDS.SHORTEN_LINK,
      title: 'Shorten This Link',
      contexts: ['link'],
    });

    // Show QR code
    browser.contextMenus.create({
      id: MENU_IDS.SHOW_QR,
      title: 'Show QR Code',
      contexts: ['page', 'link'],
    });

    // Share selected text
    browser.contextMenus.create({
      id: MENU_IDS.SHARE_SELECTION,
      title: 'Share Selected Text',
      contexts: ['selection'],
    });

    // Upload image
    browser.contextMenus.create({
      id: MENU_IDS.UPLOAD_IMAGE,
      title: 'Upload Image to S.EE',
      contexts: ['image'],
    });
  });
}

/**
 * Handle context menu clicks
 */
async function handleContextMenuClick(
  info: browser.Menus.OnClickData,
  tab?: browser.Tabs.Tab
): Promise<void> {
  const { menuItemId, pageUrl, linkUrl, selectionText, srcUrl } = info;

  try {
    switch (menuItemId) {
      case MENU_IDS.SHORTEN_PAGE:
        await handleShortenUrl(pageUrl || tab?.url || '');
        break;

      case MENU_IDS.SHORTEN_LINK:
        await handleShortenUrl(linkUrl || '');
        break;

      case MENU_IDS.SHOW_QR:
        await handleShowQR(linkUrl || pageUrl || tab?.url || '');
        break;

      case MENU_IDS.SHARE_SELECTION:
        await handleShareSelection(selectionText || '', tab);
        break;

      case MENU_IDS.UPLOAD_IMAGE:
        await handleUploadImage(srcUrl || '', tab);
        break;
    }
  } catch (error) {
    console.error('Context menu action failed:', error);
    showNotification('Error', error instanceof Error ? error.message : 'Action failed');
  }
}

/**
 * Handle URL shortening from context menu
 */
async function handleShortenUrl(url: string): Promise<void> {
  if (!url) {
    showNotification('Error', 'No URL to shorten');
    return;
  }

  const apiKey = await storage.getItem<string>(STORAGE_KEYS.API_KEY);
  if (!apiKey) {
    showNotification('Setup Required', 'Please set up your API token first');
    // Open popup to set up
    browser.action.openPopup();
    return;
  }

  const sdk = new SeeSDK({
    baseUrl: 'https://s.ee',
    apiKey,
  });

  try {
    const defaultDomain = await storage.getItem<string>(STORAGE_KEYS.DEFAULT_URL_DOMAIN);

    const response = await sdk.shortenUrl({
      domain: defaultDomain || 's.ee',
      target_url: url,
    });

    const shortUrl = response.data.short_url;

    // Copy to clipboard
    const autoCopy = await storage.getItem<boolean>(STORAGE_KEYS.AUTO_COPY);
    let copied = false;
    if (autoCopy !== false) {
      try {
        await copyToClipboard(shortUrl);
        copied = true;
      } catch (e) {
        console.error('Clipboard copy failed:', e);
      }
    }

    // Show notification
    if (copied) {
      showNotification('URL Shortened', `${shortUrl}\n\nCopied to clipboard!`);
    } else {
      showNotification('URL Shortened', shortUrl);
    }

    // Add to history
    await addToUrlHistory({
      originalUrl: url,
      shortUrl,
      domain: defaultDomain || 's.ee',
      slug: response.data.slug,
    });
  } catch (error) {
    console.error('Failed to shorten URL:', error);
    showNotification('Error', 'Failed to shorten URL. Please try again.');
  }
}

/**
 * Handle showing QR code from context menu
 */
async function handleShowQR(url: string): Promise<void> {
  if (!url) {
    showNotification('Error', 'No URL for QR code');
    return;
  }

  // Store the URL for the popup to pick up
  await storage.setItem('local:see_pending_qr', url);
  await storage.setItem('local:see_pending_qr_timestamp', Date.now());

  // Open popup
  browser.action.openPopup();
}

/**
 * Handle sharing selected text from context menu
 */
async function handleShareSelection(text: string, tab?: browser.Tabs.Tab): Promise<void> {
  if (!text || text.trim().length === 0) {
    showNotification('Error', 'No text selected');
    return;
  }

  const apiKey = await storage.getItem<string>(STORAGE_KEYS.API_KEY);
  if (!apiKey) {
    showNotification('Setup Required', 'Please set up your API token first');
    browser.action.openPopup();
    return;
  }

  const sdk = new SeeSDK({
    baseUrl: 'https://s.ee',
    apiKey,
  });

  try {
    const title = tab?.title ? `Text from ${tab.title}` : 'Shared Text';

    const response = await sdk.shareText({
      title: title.substring(0, 255),
      content: text,
      text_type: 'plain_text',
    });

    const shortUrl = response.data.short_url;

    // Copy to clipboard
    const autoCopy = await storage.getItem<boolean>(STORAGE_KEYS.AUTO_COPY);
    let copied = false;
    if (autoCopy !== false) {
      try {
        await copyToClipboard(shortUrl);
        copied = true;
      } catch (e) {
        console.error('Clipboard copy failed:', e);
      }
    }

    // Show notification
    if (copied) {
      showNotification('Text Shared', `${shortUrl}\n\nCopied to clipboard!`);
    } else {
      showNotification('Text Shared', shortUrl);
    }

    // Add to history
    await addToTextHistory({
      title,
      content: text.substring(0, 500),
      shortUrl,
      slug: response.data.slug,
    });
  } catch (error) {
    console.error('Failed to share text:', error);
    showNotification('Error', 'Failed to share text. Please try again.');
  }
}

/**
 * Copy text to clipboard using scripting API
 */
async function copyToClipboard(text: string): Promise<void> {
  try {
    // Try using the Clipboard API in the background script
    // This may not work in all browsers, so we have a fallback
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback: Inject script into the active tab to copy
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: (textToCopy: string) => {
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        },
        args: [text],
      });
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw error;
  }
}

/**
 * Show browser notification
 */
function showNotification(title: string, message: string): void {
  const notificationId = `see-notification-${Date.now()}`;
  browser.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: browser.runtime.getURL('icons/icon128.png'),
    title: `S.EE - ${title}`,
    message,
  }).catch((error) => {
    console.error('Failed to show notification:', error);
  });
}

/**
 * Handle uploading image from context menu
 */
async function handleUploadImage(imageUrl: string, tab?: browser.Tabs.Tab): Promise<void> {
  if (!imageUrl) {
    showNotification('Error', 'No image to upload');
    return;
  }

  const apiKey = await storage.getItem<string>(STORAGE_KEYS.API_KEY);
  if (!apiKey) {
    showNotification('Setup Required', 'Please set up your API token first');
    browser.action.openPopup();
    return;
  }

  showNotification('Uploading', 'Converting and uploading image...');

  try {
    // Inject script to convert image to WebP
    if (!tab?.id) {
      throw new Error('No active tab');
    }

    const results = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (imgUrl: string) => {
        // Helper to convert image to WebP using Canvas
        const convertToWebP = async (url: string): Promise<{ data: string; type: string; filename: string } | null> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  resolve(null);
                  return;
                }

                ctx.drawImage(img, 0, 0);

                // Try to convert to WebP with 0.9 quality
                const webpData = canvas.toDataURL('image/webp', 0.9);

                // Check if browser actually supports WebP encoding
                if (webpData.startsWith('data:image/webp')) {
                  resolve({
                    data: webpData,
                    type: 'image/webp',
                    filename: 'image.webp',
                  });
                } else {
                  // Fallback to PNG if WebP not supported
                  resolve({
                    data: canvas.toDataURL('image/png'),
                    type: 'image/png',
                    filename: 'image.png',
                  });
                }
              } catch {
                resolve(null);
              }
            };

            img.onerror = () => {
              resolve(null);
            };

            // Set timeout for loading
            setTimeout(() => resolve(null), 10000);

            img.src = url;
          });
        };

        // Try to convert image
        const result = await convertToWebP(imgUrl);

        if (result) {
          return result;
        }

        // Fallback: fetch original image as blob
        try {
          const response = await fetch(imgUrl);
          const blob = await response.blob();

          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              // Extract filename from URL
              let filename = 'image';
              try {
                const urlObj = new URL(imgUrl);
                const pathname = urlObj.pathname;
                const lastPart = pathname.split('/').pop();
                if (lastPart && lastPart.includes('.')) {
                  filename = lastPart;
                } else {
                  // Add extension based on mime type
                  const ext = blob.type.split('/')[1] || 'png';
                  filename = `image.${ext}`;
                }
              } catch {
                filename = 'image.png';
              }

              resolve({
                data: reader.result as string,
                type: blob.type || 'image/png',
                filename,
              });
            };
            reader.onerror = () => {
              resolve(null);
            };
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      },
      args: [imageUrl],
    });

    const result = results?.[0]?.result as { data: string; type: string; filename: string } | null;

    if (!result) {
      throw new Error('Failed to process image. The image may be protected by CORS.');
    }

    // Convert base64 to Blob
    const base64Data = result.data.split(',')[1];
    const binaryData = atob(base64Data);
    const byteArray = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      byteArray[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: result.type });
    const file = new File([blob], result.filename, { type: result.type });

    // Upload using SDK
    const sdk = new SeeSDK({
      baseUrl: 'https://s.ee',
      apiKey,
    });

    const response = await sdk.uploadFile(file);
    const pageUrl = response.data.page;

    // Copy to clipboard
    const autoCopy = await storage.getItem<boolean>(STORAGE_KEYS.AUTO_COPY);
    if (autoCopy !== false) {
      await copyToClipboard(pageUrl);
      showNotification('Image Uploaded', `${pageUrl}\n\nCopied to clipboard!`);
    } else {
      showNotification('Image Uploaded', pageUrl);
    }

    // Add to file history
    await addToFileHistory({
      filename: result.filename,
      url: response.data.url,
      pageUrl: response.data.page,
      size: response.data.size,
      deleteHash: response.data.hash,
    });
  } catch (error) {
    console.error('Failed to upload image:', error);
    showNotification('Error', error instanceof Error ? error.message : 'Failed to upload image');
  }
}

/**
 * Add URL to history storage
 */
interface UrlHistoryItem {
  id: string;
  createdAt: number;
  originalUrl: string;
  shortUrl: string;
  domain: string;
  slug?: string;
}

async function addToUrlHistory(item: Omit<UrlHistoryItem, 'id' | 'createdAt'>): Promise<void> {
  const history = await storage.getItem<UrlHistoryItem[]>(STORAGE_KEYS.URL_HISTORY) ?? [];
  const newItem: UrlHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await storage.setItem(STORAGE_KEYS.URL_HISTORY, [newItem, ...history]);
}

/**
 * Add text to history storage
 */
interface TextHistoryItem {
  id: string;
  createdAt: number;
  title: string;
  content: string;
  shortUrl: string;
  slug?: string;
}

async function addToTextHistory(item: Omit<TextHistoryItem, 'id' | 'createdAt'>): Promise<void> {
  const history = await storage.getItem<TextHistoryItem[]>(STORAGE_KEYS.TEXT_HISTORY) ?? [];
  const newItem: TextHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await storage.setItem(STORAGE_KEYS.TEXT_HISTORY, [newItem, ...history]);
}

/**
 * Add file to history storage
 */
interface FileHistoryItem {
  id: string;
  createdAt: number;
  filename: string;
  url: string;
  pageUrl: string;
  size: number;
  deleteHash: string;
}

async function addToFileHistory(item: Omit<FileHistoryItem, 'id' | 'createdAt'>): Promise<void> {
  const history = await storage.getItem<FileHistoryItem[]>(STORAGE_KEYS.FILE_HISTORY) ?? [];
  const newItem: FileHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await storage.setItem(STORAGE_KEYS.FILE_HISTORY, [newItem, ...history]);
}
