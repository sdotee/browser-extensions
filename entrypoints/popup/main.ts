/**
 * S.EE Browser Extension - Main Popup Entry Point
 */

import './style.css';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { SeeSDK, SeeError, NetworkError } from '@/utils/sdk';
import {
  getApiKey,
  saveApiKey,
  removeApiKey,
  getUrlDomains,
  saveUrlDomains,
  getDefaultUrlDomain,
  saveDefaultUrlDomain,
  getTextDomains,
  saveTextDomains,
  getDefaultTextDomain,
  saveDefaultTextDomain,
  getAutoCopy,
  saveAutoCopy,
  getTheme,
  saveTheme,
  getUrlHistory,
  addUrlToHistory,
  deleteUrlHistoryItem,
  deleteUrlHistoryItems,
  clearUrlHistory,
  getTextHistory,
  addTextToHistory,
  deleteTextHistoryItem,
  deleteTextHistoryItems,
  clearTextHistory,
  getFileHistory,
  addFileToHistory,
  deleteFileHistoryItem,
  deleteFileHistoryItems,
  clearFileHistory,
  HISTORY_PAGE_SIZE,
  type UrlHistoryItem,
  type TextHistoryItem,
  type FileHistoryItem,
} from '@/utils/storage';

// DOM Elements
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const elements = {
  // Panels
  setupPanel: $<HTMLElement>('setup-panel'),
  mainPanel: $<HTMLElement>('main-panel'),

  // Header
  themeToggle: $<HTMLButtonElement>('theme-toggle'),
  settingsBtn: $<HTMLButtonElement>('settings-btn'),

  // Setup Panel
  apiTokenInput: $<HTMLInputElement>('api-token'),
  toggleTokenVisibility: $<HTMLButtonElement>('toggle-token-visibility'),
  saveTokenBtn: $<HTMLButtonElement>('save-token-btn'),
  setupError: $<HTMLElement>('setup-error'),

  // Main Tabs
  tabUrl: $<HTMLButtonElement>('tab-url'),
  tabText: $<HTMLButtonElement>('tab-text'),
  tabFile: $<HTMLButtonElement>('tab-file'),
  tabContentUrl: $<HTMLElement>('tab-content-url'),
  tabContentText: $<HTMLElement>('tab-content-text'),
  tabContentFile: $<HTMLElement>('tab-content-file'),

  // URL Tab
  useCurrentPageBtn: $<HTMLButtonElement>('use-current-page'),
  useCustomUrlBtn: $<HTMLButtonElement>('use-custom-url'),
  currentUrlGroup: $<HTMLElement>('current-url-group'),
  customUrlGroup: $<HTMLElement>('custom-url-group'),
  currentUrlTextarea: $<HTMLTextAreaElement>('current-url'),
  customUrlInput: $<HTMLTextAreaElement>('custom-url-input'),
  urlDomainSelect: $<HTMLSelectElement>('url-domain-select'),
  useCustomSlugCheckbox: $<HTMLInputElement>('use-custom-slug'),
  customSlugInput: $<HTMLInputElement>('custom-slug'),
  shortenBtn: $<HTMLButtonElement>('shorten-btn'),

  // Text Tab
  textTitle: $<HTMLInputElement>('text-title'),
  textContent: $<HTMLTextAreaElement>('text-content'),
  textType: $<HTMLSelectElement>('text-type'),
  textDomainSelect: $<HTMLSelectElement>('text-domain-select'),
  shareTextBtn: $<HTMLButtonElement>('share-text-btn'),

  // Files Tab
  fileDropZone: $<HTMLElement>('file-drop-zone'),
  fileInput: $<HTMLInputElement>('file-input'),
  fileListContainer: $<HTMLElement>('file-list-container'),
  fileCount: $<HTMLElement>('file-count'),
  clearAllFilesBtn: $<HTMLButtonElement>('clear-all-files'),
  fileList: $<HTMLElement>('file-list'),
  uploadProgress: $<HTMLElement>('upload-progress'),
  progressFill: $<HTMLElement>('progress-fill'),
  progressText: $<HTMLElement>('progress-text'),
  uploadFileBtn: $<HTMLButtonElement>('upload-file-btn'),

  // Status & Result
  statusMessage: $<HTMLElement>('status-message'),
  resultCard: $<HTMLElement>('result-card'),
  resultTitle: $<HTMLElement>('result-title'),
  shortUrlInput: $<HTMLInputElement>('short-url'),
  copyUrlBtn: $<HTMLButtonElement>('copy-url-btn'),
  qrSection: $<HTMLElement>('qr-section'),
  qrCanvas: $<HTMLCanvasElement>('qr-canvas'),
  exportPngBtn: $<HTMLButtonElement>('export-png'),
  exportSvgBtn: $<HTMLButtonElement>('export-svg'),
  exportPdfBtn: $<HTMLButtonElement>('export-pdf'),

  // Batch Result
  batchResultCard: $<HTMLElement>('batch-result-card'),
  batchResultTitle: $<HTMLElement>('batch-result-title'),
  batchFilesList: $<HTMLElement>('batch-files-list'),
  batchFormat: $<HTMLSelectElement>('batch-format'),
  batchIncludeFilename: $<HTMLInputElement>('batch-include-filename'),
  batchCopyTextarea: $<HTMLTextAreaElement>('batch-copy-textarea'),
  batchCopyBtn: $<HTMLButtonElement>('batch-copy-btn'),

  // History
  historyToggle: $<HTMLButtonElement>('history-toggle'),
  historyTitle: $<HTMLElement>('history-title'),
  historyCount: $<HTMLElement>('history-count'),
  historyContent: $<HTMLElement>('history-content'),
  historyActionsBar: $<HTMLElement>('history-actions-bar'),
  selectAllHistory: $<HTMLInputElement>('select-all-history'),
  deleteSelectedBtn: $<HTMLButtonElement>('delete-selected-btn'),
  clearAllHistoryBtn: $<HTMLButtonElement>('clear-all-history-btn'),
  historyList: $<HTMLElement>('history-list'),
  historyPagination: $<HTMLElement>('history-pagination'),
  historyPrevBtn: $<HTMLButtonElement>('history-prev'),
  historyNextBtn: $<HTMLButtonElement>('history-next'),
  historyPageInfo: $<HTMLElement>('history-page-info'),

  // Modals
  settingsModal: $<HTMLElement>('settings-modal'),
  closeSettingsBtn: $<HTMLButtonElement>('close-settings'),
  autoCopyCheckbox: $<HTMLInputElement>('auto-copy'),
  resetTokenBtn: $<HTMLButtonElement>('reset-token-btn'),
  clearHistoryBtn: $<HTMLButtonElement>('clear-history-btn'),

  qrModal: $<HTMLElement>('qr-modal'),
  closeQrModalBtn: $<HTMLButtonElement>('close-qr-modal'),
  qrModalUrl: $<HTMLElement>('qr-modal-url'),
  qrModalCanvas: $<HTMLCanvasElement>('qr-modal-canvas'),
  qrModalStatus: $<HTMLElement>('qr-modal-status'),
  qrModalCopyBtn: $<HTMLButtonElement>('qr-modal-copy'),
  qrModalPngBtn: $<HTMLButtonElement>('qr-modal-png'),
  qrModalSvgBtn: $<HTMLButtonElement>('qr-modal-svg'),
  qrModalPdfBtn: $<HTMLButtonElement>('qr-modal-pdf'),

  confirmModal: $<HTMLElement>('confirm-modal'),
  confirmModalTitle: $<HTMLElement>('confirm-modal-title'),
  confirmModalMessage: $<HTMLElement>('confirm-modal-message'),
  closeConfirmModalBtn: $<HTMLButtonElement>('close-confirm-modal'),
  confirmCancelBtn: $<HTMLButtonElement>('confirm-cancel-btn'),
  confirmDeleteBtn: $<HTMLButtonElement>('confirm-delete-btn'),
};

// State
let sdk: SeeSDK | null = null;
let currentShortUrl: string | null = null;
let qrModalUrl: string | null = null;
let useCustomUrl = false;
let selectedFiles: File[] = [];

// Batch upload results
interface BatchUploadResult {
  filename: string;
  url: string;
  success: boolean;
  error?: string;
}
let batchUploadResults: BatchUploadResult[] = [];

// Tab state
type TabType = 'url' | 'text' | 'file';
let currentTab: TabType = 'url';

// History state - generic to support all types
type HistoryItem = UrlHistoryItem | TextHistoryItem | FileHistoryItem;
let allHistory: HistoryItem[] = [];
let currentPage = 1;
let selectedIds: Set<string> = new Set();
let confirmCallback: (() => void) | null = null;

// QR code export size
const QR_EXPORT_SIZE = 512;

// Draft storage key
const DRAFT_TEXT_CONTENT_KEY = 'local:see_draft_text_content';

// Initialize
async function init(): Promise<void> {
  await initTheme();
  await checkAuthStatus();
  setupEventListeners();
  await checkPendingQR();
  await loadDraftTextContent();
  await loadDraftTextTitle();
  await loadDraftCustomUrl();
}

// Check for pending QR code from context menu
async function checkPendingQR(): Promise<void> {
  try {
    const result = await browser.storage.local.get(['see_pending_qr', 'see_pending_qr_timestamp']);
    if (result.see_pending_qr && result.see_pending_qr_timestamp) {
      const age = Date.now() - result.see_pending_qr_timestamp;
      if (age < 30000) {
        await browser.storage.local.remove(['see_pending_qr', 'see_pending_qr_timestamp']);
        openQrModal(result.see_pending_qr);
      }
    }
  } catch (error) {
    console.error('Failed to check pending QR:', error);
  }
}

// Load draft text content from storage
async function loadDraftTextContent(): Promise<void> {
  try {
    const result = await browser.storage.local.get(['see_draft_text_content']);
    if (result.see_draft_text_content) {
      elements.textContent.value = result.see_draft_text_content;
    }
  } catch (error) {
    console.error('Failed to load draft text:', error);
  }
}

// Save draft text content to storage
async function saveDraftTextContent(): Promise<void> {
  try {
    const content = elements.textContent.value;
    if (content) {
      await browser.storage.local.set({ see_draft_text_content: content });
    } else {
      await browser.storage.local.remove(['see_draft_text_content']);
    }
  } catch (error) {
    console.error('Failed to save draft text:', error);
  }
}

// Clear draft text content from storage
async function clearDraftTextContent(): Promise<void> {
  try {
    await browser.storage.local.remove(['see_draft_text_content']);
  } catch (error) {
    console.error('Failed to clear draft text:', error);
  }
}

// Load draft custom URL from storage
async function loadDraftCustomUrl(): Promise<void> {
  try {
    const result = await browser.storage.local.get(['see_draft_custom_url']);
    if (result.see_draft_custom_url) {
      elements.customUrlInput.value = result.see_draft_custom_url;
    }
  } catch (error) {
    console.error('Failed to load draft custom URL:', error);
  }
}

// Save draft custom URL to storage
async function saveDraftCustomUrl(): Promise<void> {
  try {
    const url = elements.customUrlInput.value;
    if (url) {
      await browser.storage.local.set({ see_draft_custom_url: url });
    } else {
      await browser.storage.local.remove(['see_draft_custom_url']);
    }
  } catch (error) {
    console.error('Failed to save draft custom URL:', error);
  }
}

// Clear draft custom URL from storage
async function clearDraftCustomUrl(): Promise<void> {
  try {
    await browser.storage.local.remove(['see_draft_custom_url']);
  } catch (error) {
    console.error('Failed to clear draft custom URL:', error);
  }
}

// Load draft text title from storage
async function loadDraftTextTitle(): Promise<void> {
  try {
    const result = await browser.storage.local.get(['see_draft_text_title']);
    if (result.see_draft_text_title) {
      elements.textTitle.value = result.see_draft_text_title;
    }
  } catch (error) {
    console.error('Failed to load draft text title:', error);
  }
}

// Save draft text title to storage
async function saveDraftTextTitle(): Promise<void> {
  try {
    const title = elements.textTitle.value;
    if (title) {
      await browser.storage.local.set({ see_draft_text_title: title });
    } else {
      await browser.storage.local.remove(['see_draft_text_title']);
    }
  } catch (error) {
    console.error('Failed to save draft text title:', error);
  }
}

// Clear draft text title from storage
async function clearDraftTextTitle(): Promise<void> {
  try {
    await browser.storage.local.remove(['see_draft_text_title']);
  } catch (error) {
    console.error('Failed to clear draft text title:', error);
  }
}

// Initialize theme
async function initTheme(): Promise<void> {
  const savedTheme = await getTheme();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

// Check if user has API token
async function checkAuthStatus(): Promise<void> {
  const apiKey = await getApiKey();

  if (apiKey) {
    sdk = new SeeSDK({
      baseUrl: 'https://s.ee',
      apiKey,
    });
    await showMainPanel();
  } else {
    showSetupPanel();
  }
}

// Show setup panel
function showSetupPanel(): void {
  elements.setupPanel.classList.remove('hidden');
  elements.mainPanel.classList.add('hidden');
  elements.apiTokenInput.focus();
}

// Show main panel
async function showMainPanel(): Promise<void> {
  elements.setupPanel.classList.add('hidden');
  elements.mainPanel.classList.remove('hidden');

  await loadCurrentTabUrl();
  await loadUrlDomains();
  await loadTextDomains();
  await loadHistory();

  const autoCopy = await getAutoCopy();
  elements.autoCopyCheckbox.checked = autoCopy;
}

// Load current tab URL
async function loadCurrentTabUrl(): Promise<void> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      elements.currentUrlTextarea.value = tab.url;
    }
  } catch (error) {
    console.error('Failed to get current tab URL:', error);
    elements.currentUrlTextarea.value = 'Unable to get current page URL';
  }
}

// Load URL domains
async function loadUrlDomains(): Promise<void> {
  let domains = await getUrlDomains();

  if (!domains || domains.length === 0) {
    try {
      showStatus('Fetching available domains...', 'info');
      const response = await sdk!.listUrlDomains();
      domains = response.data.domains;
      await saveUrlDomains(domains);
      hideStatus();
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      showStatus('Failed to load domains.', 'error');
      domains = ['s.ee'];
    }
  }

  elements.urlDomainSelect.innerHTML = '';
  const defaultDomain = await getDefaultUrlDomain();

  domains.forEach((domain) => {
    const option = document.createElement('option');
    option.value = domain;
    option.textContent = domain;
    if (domain === defaultDomain) {
      option.selected = true;
    }
    elements.urlDomainSelect.appendChild(option);
  });
}

// Load text domains
async function loadTextDomains(): Promise<void> {
  let domains = await getTextDomains();

  if (!domains || domains.length === 0) {
    try {
      const response = await sdk!.listTextDomains();
      domains = response.data.domains;
      await saveTextDomains(domains);
    } catch (error) {
      console.error('Failed to fetch text domains:', error);
      domains = ['fs.to'];
    }
  }

  elements.textDomainSelect.innerHTML = '';
  const defaultDomain = await getDefaultTextDomain();

  domains.forEach((domain) => {
    const option = document.createElement('option');
    option.value = domain;
    option.textContent = domain;
    if (domain === defaultDomain) {
      option.selected = true;
    }
    elements.textDomainSelect.appendChild(option);
  });
}

// Load history
async function loadHistory(): Promise<void> {
  // Load history based on current tab
  switch (currentTab) {
    case 'url':
      allHistory = await getUrlHistory();
      break;
    case 'text':
      allHistory = await getTextHistory();
      break;
    case 'file':
      allHistory = await getFileHistory();
      break;
  }
  selectedIds.clear();
  elements.selectAllHistory.checked = false;
  updateDeleteSelectedBtn();
  renderHistory();
}

// Get total pages
function getTotalPages(): number {
  return Math.ceil(allHistory.length / HISTORY_PAGE_SIZE);
}

// Get current page items
function getCurrentPageItems(): HistoryItem[] {
  const start = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const end = start + HISTORY_PAGE_SIZE;
  return allHistory.slice(start, end);
}

// Render history list
function renderHistory(): void {
  // Update history section title based on current tab
  const historyTitles: Record<TabType, string> = {
    url: 'Recent Links',
    text: 'Recent Texts',
    file: 'Recent Files',
  };
  elements.historyTitle.textContent = historyTitles[currentTab];
  elements.historyCount.textContent = allHistory.length > 0 ? `${allHistory.length}` : '';

  // Get empty message and item type label based on current tab
  const emptyMessages: Record<TabType, string> = {
    url: 'No recent links yet',
    text: 'No shared texts yet',
    file: 'No uploaded files yet',
  };

  const itemLabels: Record<TabType, string> = {
    url: 'link',
    text: 'text',
    file: 'file',
  };

  if (allHistory.length === 0) {
    elements.historyList.innerHTML = `<div class="history-empty">${emptyMessages[currentTab]}</div>`;
    elements.historyActionsBar.classList.add('hidden');
    elements.historyPagination.classList.add('hidden');
    return;
  }

  elements.historyActionsBar.classList.remove('hidden');

  const totalPages = getTotalPages();
  const pageItems = getCurrentPageItems();

  if (totalPages > 1) {
    elements.historyPagination.classList.remove('hidden');
    elements.historyPageInfo.textContent = `${currentPage} / ${totalPages}`;
    elements.historyPrevBtn.disabled = currentPage <= 1;
    elements.historyNextBtn.disabled = currentPage >= totalPages;
  } else {
    elements.historyPagination.classList.add('hidden');
  }

  // Render items based on type
  elements.historyList.innerHTML = pageItems
    .map((item) => {
      // Get display URL based on item type
      let displayUrl = '';
      let secondaryText = '';

      if (currentTab === 'url') {
        const urlItem = item as UrlHistoryItem;
        displayUrl = urlItem.shortUrl;
        secondaryText = truncateUrl(urlItem.originalUrl);
      } else if (currentTab === 'text') {
        const textItem = item as TextHistoryItem;
        displayUrl = textItem.shortUrl;
        secondaryText = textItem.title;
      } else if (currentTab === 'file') {
        const fileItem = item as FileHistoryItem;
        displayUrl = fileItem.pageUrl;
        secondaryText = `${fileItem.filename} (${formatFileSize(fileItem.size)})`;
      }

      return `
      <div class="history-item ${selectedIds.has(item.id) ? 'selected' : ''}" data-id="${escapeHtml(item.id)}" data-short-url="${escapeHtml(displayUrl)}">
        <input type="checkbox" class="checkbox history-item-checkbox" ${selectedIds.has(item.id) ? 'checked' : ''}>
        <div class="history-item-content">
          <div class="history-short-url">${escapeHtml(formatShortUrl(displayUrl))}</div>
          <div class="history-original-url">${escapeHtml(secondaryText)}</div>
        </div>
        <div class="history-actions">
          <button class="icon-btn history-qr-btn" title="QR Code">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button class="icon-btn history-copy-btn" title="Copy URL">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="icon-btn history-open-btn" title="Open">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>
          <button class="icon-btn history-delete-btn" title="Delete">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    })
    .join('');

  // Add event listeners
  elements.historyList.querySelectorAll('.history-item-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      const item = (e.currentTarget as HTMLElement).closest('.history-item');
      const id = item?.getAttribute('data-id');
      if (id) {
        if ((e.currentTarget as HTMLInputElement).checked) {
          selectedIds.add(id);
          item?.classList.add('selected');
        } else {
          selectedIds.delete(id);
          item?.classList.remove('selected');
        }
        updateSelectAllCheckbox();
        updateDeleteSelectedBtn();
      }
    });
  });

  elements.historyList.querySelectorAll('.history-qr-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = (e.currentTarget as HTMLElement).closest('.history-item');
      const shortUrl = item?.getAttribute('data-short-url');
      if (shortUrl) openQrModal(shortUrl);
    });
  });

  elements.historyList.querySelectorAll('.history-copy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = (e.currentTarget as HTMLElement).closest('.history-item');
      const shortUrl = item?.getAttribute('data-short-url');
      if (shortUrl) {
        copyToClipboard(shortUrl);
        showStatus('Copied to clipboard!', 'success');
        setTimeout(hideStatus, 2000);
      }
    });
  });

  elements.historyList.querySelectorAll('.history-open-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = (e.currentTarget as HTMLElement).closest('.history-item');
      const shortUrl = item?.getAttribute('data-short-url');
      if (shortUrl) browser.tabs.create({ url: shortUrl });
    });
  });

  elements.historyList.querySelectorAll('.history-delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = (e.currentTarget as HTMLElement).closest('.history-item');
      const id = item?.getAttribute('data-id');
      if (id) {
        const label = itemLabels[currentTab];
        showConfirmModal(
          `Delete ${label.charAt(0).toUpperCase() + label.slice(1)}`,
          `Are you sure you want to delete this ${label} from history?`,
          async () => {
            // Delete from correct history based on current tab
            switch (currentTab) {
              case 'url':
                await deleteUrlHistoryItem(id);
                break;
              case 'text':
                await deleteTextHistoryItem(id);
                break;
              case 'file':
                await deleteFileHistoryItem(id);
                break;
            }
            await loadHistory();
            showStatus(`${label.charAt(0).toUpperCase() + label.slice(1)} deleted from history`, 'success');
            setTimeout(hideStatus, 2000);
          }
        );
      }
    });
  });
}

// Setup event listeners
function setupEventListeners(): void {
  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Settings
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.closeSettingsBtn.addEventListener('click', closeSettings);
  elements.settingsModal.querySelector('.modal-backdrop')?.addEventListener('click', closeSettings);

  // Token visibility toggle
  elements.toggleTokenVisibility.addEventListener('click', toggleTokenVisibility);

  // Save token
  elements.saveTokenBtn.addEventListener('click', handleSaveToken);
  elements.apiTokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSaveToken();
  });

  // Main tabs
  elements.tabUrl.addEventListener('click', () => switchTab('url'));
  elements.tabText.addEventListener('click', () => switchTab('text'));
  elements.tabFile.addEventListener('click', () => switchTab('file'));

  // URL source toggle
  elements.useCurrentPageBtn.addEventListener('click', () => switchUrlSource(false));
  elements.useCustomUrlBtn.addEventListener('click', () => switchUrlSource(true));

  // Custom slug toggle
  elements.useCustomSlugCheckbox.addEventListener('change', toggleCustomSlug);

  // Domain selection
  elements.urlDomainSelect.addEventListener('change', async () => {
    await saveDefaultUrlDomain(elements.urlDomainSelect.value);
  });
  elements.textDomainSelect.addEventListener('change', async () => {
    await saveDefaultTextDomain(elements.textDomainSelect.value);
  });

  // Auto-save text content draft
  elements.textContent.addEventListener('input', saveDraftTextContent);

  // Auto-save text title draft
  elements.textTitle.addEventListener('input', saveDraftTextTitle);

  // Auto-save custom URL draft
  elements.customUrlInput.addEventListener('input', saveDraftCustomUrl);

  // Action buttons
  elements.shortenBtn.addEventListener('click', handleShorten);
  elements.shareTextBtn.addEventListener('click', handleShareText);
  elements.uploadFileBtn.addEventListener('click', handleUploadFile);

  // Copy button
  elements.copyUrlBtn.addEventListener('click', handleCopyUrl);

  // Export buttons
  elements.exportPngBtn.addEventListener('click', exportPng);
  elements.exportSvgBtn.addEventListener('click', exportSvg);
  elements.exportPdfBtn.addEventListener('click', exportPdf);

  // File upload
  elements.fileInput.addEventListener('change', handleFileSelect);
  elements.clearAllFilesBtn.addEventListener('click', clearAllSelectedFiles);

  // Drag and drop
  elements.fileDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.fileDropZone.classList.add('drag-over');
  });
  elements.fileDropZone.addEventListener('dragleave', () => {
    elements.fileDropZone.classList.remove('drag-over');
  });
  elements.fileDropZone.addEventListener('drop', handleFileDrop);

  // Batch copy options
  elements.batchFormat.addEventListener('change', updateBatchCopyPreview);
  elements.batchIncludeFilename.addEventListener('change', updateBatchCopyPreview);
  elements.batchCopyBtn.addEventListener('click', handleBatchCopy);

  // History toggle
  elements.historyToggle.addEventListener('click', toggleHistory);

  // History pagination
  elements.historyPrevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderHistory();
    }
  });
  elements.historyNextBtn.addEventListener('click', () => {
    if (currentPage < getTotalPages()) {
      currentPage++;
      renderHistory();
    }
  });

  // History batch actions
  elements.selectAllHistory.addEventListener('change', handleSelectAll);
  elements.deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
  elements.clearAllHistoryBtn.addEventListener('click', handleClearAllHistory);

  // Settings options
  elements.autoCopyCheckbox.addEventListener('change', async () => {
    await saveAutoCopy(elements.autoCopyCheckbox.checked);
  });
  elements.resetTokenBtn.addEventListener('click', handleResetToken);
  elements.clearHistoryBtn.addEventListener('click', handleClearHistory);

  // QR Modal
  elements.closeQrModalBtn.addEventListener('click', closeQrModal);
  elements.qrModal.querySelector('.modal-backdrop')?.addEventListener('click', closeQrModal);
  elements.qrModalCopyBtn.addEventListener('click', handleQrModalCopy);
  elements.qrModalPngBtn.addEventListener('click', handleQrModalPng);
  elements.qrModalSvgBtn.addEventListener('click', handleQrModalSvg);
  elements.qrModalPdfBtn.addEventListener('click', handleQrModalPdf);

  // Confirm Modal
  elements.closeConfirmModalBtn.addEventListener('click', closeConfirmModal);
  elements.confirmModal.querySelector('.modal-backdrop')?.addEventListener('click', closeConfirmModal);
  elements.confirmCancelBtn.addEventListener('click', closeConfirmModal);
  elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
}

// Switch tab
async function switchTab(tab: 'url' | 'text' | 'file'): Promise<void> {
  // Update current tab state
  currentTab = tab;

  // Update tab buttons
  elements.tabUrl.classList.toggle('active', tab === 'url');
  elements.tabText.classList.toggle('active', tab === 'text');
  elements.tabFile.classList.toggle('active', tab === 'file');

  // Update tab content
  elements.tabContentUrl.classList.toggle('hidden', tab !== 'url');
  elements.tabContentText.classList.toggle('hidden', tab !== 'text');
  elements.tabContentFile.classList.toggle('hidden', tab !== 'file');

  // Hide result card when switching tabs
  elements.resultCard.classList.add('hidden');
  hideStatus();

  // Reload history for the current tab
  currentPage = 1;
  await loadHistory();
}

// Toggle theme
async function toggleTheme(): Promise<void> {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  await saveTheme(newTheme);
}

// Toggle token visibility
function toggleTokenVisibility(): void {
  const isPassword = elements.apiTokenInput.type === 'password';
  elements.apiTokenInput.type = isPassword ? 'text' : 'password';

  const eyeIcon = elements.toggleTokenVisibility.querySelector('.icon-eye');
  const eyeOffIcon = elements.toggleTokenVisibility.querySelector('.icon-eye-off');

  eyeIcon?.classList.toggle('hidden', !isPassword);
  eyeOffIcon?.classList.toggle('hidden', isPassword);
}

// Switch URL source mode
function switchUrlSource(toCustom: boolean): void {
  useCustomUrl = toCustom;
  elements.useCurrentPageBtn.classList.toggle('active', !toCustom);
  elements.useCustomUrlBtn.classList.toggle('active', toCustom);
  elements.currentUrlGroup.classList.toggle('hidden', toCustom);
  elements.customUrlGroup.classList.toggle('hidden', !toCustom);

  if (toCustom) {
    elements.customUrlInput.focus();
  }
}

// Toggle custom slug input
function toggleCustomSlug(): void {
  const isChecked = elements.useCustomSlugCheckbox.checked;
  elements.customSlugInput.classList.toggle('hidden', !isChecked);
  if (isChecked) {
    elements.customSlugInput.focus();
  }
}

// Handle save token
async function handleSaveToken(): Promise<void> {
  const token = elements.apiTokenInput.value.trim();

  if (!token) {
    showSetupError('Please enter your API token');
    return;
  }

  setButtonLoading(elements.saveTokenBtn, true);
  hideSetupError();

  try {
    sdk = new SeeSDK({
      baseUrl: 'https://s.ee',
      apiKey: token,
    });

    const response = await sdk.listUrlDomains();

    await saveApiKey(token);
    await saveUrlDomains(response.data.domains);

    await showMainPanel();
  } catch (error) {
    let errorMessage = 'Failed to verify API token';

    if (error instanceof SeeError) {
      errorMessage = error.message;
    } else if (error instanceof NetworkError) {
      errorMessage = 'Network error. Please check your connection.';
    }

    showSetupError(errorMessage);
    sdk = null;
  } finally {
    setButtonLoading(elements.saveTokenBtn, false);
  }
}

// Handle shorten
async function handleShorten(): Promise<void> {
  const targetUrl = useCustomUrl
    ? elements.customUrlInput.value.trim()
    : elements.currentUrlTextarea.value.trim();

  if (!targetUrl) {
    showStatus(useCustomUrl ? 'Please enter a URL to shorten' : 'No URL to shorten', 'error');
    return;
  }

  if (useCustomUrl) {
    try {
      new URL(targetUrl);
    } catch {
      showStatus('Please enter a valid URL (e.g., https://example.com)', 'error');
      return;
    }
  }

  const domain = elements.urlDomainSelect.value;

  if (!domain) {
    showStatus('Please select a domain', 'error');
    return;
  }

  let customSlug: string | undefined;
  if (elements.useCustomSlugCheckbox.checked && elements.customSlugInput.value.trim()) {
    customSlug = elements.customSlugInput.value.trim();
  }

  setButtonLoading(elements.shortenBtn, true);
  hideStatus();
  elements.resultCard.classList.add('hidden');

  try {
    const response = await sdk!.shortenUrl({
      domain,
      target_url: targetUrl,
      custom_slug: customSlug,
    });

    currentShortUrl = response.data.short_url;

    await saveDefaultUrlDomain(domain);

    elements.shortUrlInput.value = currentShortUrl;
    elements.resultTitle.textContent = 'Short URL Created';
    elements.qrSection.classList.remove('hidden');
    elements.resultCard.classList.remove('hidden');

    await generateQRCode(currentShortUrl);

    const autoCopy = await getAutoCopy();
    if (autoCopy) {
      await copyToClipboard(currentShortUrl);
      showStatus('Short URL created and copied to clipboard!', 'success');
    } else {
      showStatus('Short URL created successfully!', 'success');
    }

    await addUrlToHistory({
      originalUrl: targetUrl,
      shortUrl: currentShortUrl,
      domain,
      slug: response.data.slug,
    });

    await loadHistory();

    // Clear custom URL input and draft after successful shortening
    if (useCustomUrl) {
      elements.customUrlInput.value = '';
      await clearDraftCustomUrl();
    }
  } catch (error) {
    let errorMessage = 'Failed to shorten URL';

    if (error instanceof SeeError) {
      errorMessage = error.message;
    } else if (error instanceof NetworkError) {
      errorMessage = 'Network error. Please check your connection.';
    }

    showStatus(errorMessage, 'error');
  } finally {
    setButtonLoading(elements.shortenBtn, false);
  }
}

// Handle share text
async function handleShareText(): Promise<void> {
  const title = elements.textTitle.value.trim() || 'Untitled';
  const content = elements.textContent.value;
  const textType = elements.textType.value as 'plain_text' | 'source_code' | 'markdown';
  const domain = elements.textDomainSelect.value;

  if (!content) {
    showStatus('Please enter some content', 'error');
    return;
  }

  setButtonLoading(elements.shareTextBtn, true);
  hideStatus();
  elements.resultCard.classList.add('hidden');

  try {
    const response = await sdk!.shareText({
      title,
      content,
      text_type: textType,
      domain: domain || undefined,
    });

    currentShortUrl = response.data.short_url;

    elements.shortUrlInput.value = currentShortUrl;
    elements.resultTitle.textContent = 'Text Shared';
    elements.qrSection.classList.remove('hidden');
    elements.resultCard.classList.remove('hidden');

    await generateQRCode(currentShortUrl);

    const autoCopy = await getAutoCopy();
    if (autoCopy) {
      await copyToClipboard(currentShortUrl);
      showStatus('Text shared and link copied to clipboard!', 'success');
    } else {
      showStatus('Text shared successfully!', 'success');
    }

    await addTextToHistory({
      title,
      shortUrl: currentShortUrl,
      domain: domain || 'fs.to',
      textType,
    });

    // Clear form and draft
    elements.textTitle.value = '';
    elements.textContent.value = '';
    await clearDraftTextTitle();
    await clearDraftTextContent();
  } catch (error) {
    let errorMessage = 'Failed to share text';

    if (error instanceof SeeError) {
      errorMessage = error.message;
    } else if (error instanceof NetworkError) {
      errorMessage = 'Network error. Please check your connection.';
    }

    showStatus(errorMessage, 'error');
  } finally {
    setButtonLoading(elements.shareTextBtn, false);
  }
}

// Handle file select
function handleFileSelect(e: Event): void {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    addSelectedFiles(Array.from(input.files));
  }
}

// Handle file drop
function handleFileDrop(e: DragEvent): void {
  e.preventDefault();
  elements.fileDropZone.classList.remove('drag-over');

  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    addSelectedFiles(Array.from(e.dataTransfer.files));
  }
}

// Add files to selected files list
function addSelectedFiles(files: File[]): void {
  selectedFiles = [...selectedFiles, ...files];
  updateFileListUI();
}

// Remove a specific file by index
function removeFileAtIndex(index: number): void {
  selectedFiles = selectedFiles.filter((_, i) => i !== index);
  updateFileListUI();
}

// Clear all selected files
function clearAllSelectedFiles(): void {
  selectedFiles = [];
  elements.fileInput.value = '';
  updateFileListUI();
}

// Update file list UI
function updateFileListUI(): void {
  if (selectedFiles.length === 0) {
    elements.fileDropZone.classList.remove('hidden');
    elements.fileListContainer.classList.add('hidden');
    elements.uploadFileBtn.disabled = true;
    elements.uploadProgress.classList.add('hidden');
    return;
  }

  elements.fileDropZone.classList.add('hidden');
  elements.fileListContainer.classList.remove('hidden');
  elements.uploadFileBtn.disabled = false;

  // Update file count
  const fileText = selectedFiles.length === 1 ? '1 file selected' : `${selectedFiles.length} files selected`;
  elements.fileCount.textContent = fileText;

  // Render file list
  elements.fileList.innerHTML = selectedFiles
    .map(
      (file, index) => `
      <div class="file-list-item" data-index="${index}">
        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <div class="file-details">
          <span class="file-name">${escapeHtml(file.name)}</span>
          <span class="file-size">${formatFileSize(file.size)}</span>
        </div>
        <button class="icon-btn remove-file-btn" title="Remove file" data-index="${index}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `
    )
    .join('');

  // Add event listeners for remove buttons
  elements.fileList.querySelectorAll('.remove-file-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '0', 10);
      removeFileAtIndex(index);
    });
  });
}

// Handle upload files (batch upload)
async function handleUploadFile(): Promise<void> {
  if (selectedFiles.length === 0) {
    showStatus('Please select file(s) to upload', 'error');
    return;
  }

  setButtonLoading(elements.uploadFileBtn, true);
  hideStatus();
  elements.resultCard.classList.add('hidden');
  elements.batchResultCard.classList.add('hidden');
  elements.uploadProgress.classList.remove('hidden');
  elements.progressFill.style.width = '0%';
  elements.progressText.textContent = '0%';

  const totalFiles = selectedFiles.length;
  batchUploadResults = [];
  let completedCount = 0;

  // Update progress based on completed files
  const updateProgress = () => {
    const percent = Math.round((completedCount / totalFiles) * 100);
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = `${completedCount}/${totalFiles}`;
  };

  // Upload files sequentially to avoid overwhelming the server
  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const listItem = elements.fileList.querySelector(`[data-index="${i}"]`);

    try {
      listItem?.classList.add('uploading');

      const response = await sdk!.uploadFile(file);

      batchUploadResults.push({
        filename: file.name,
        url: response.data.page,
        success: true,
      });

      // Add to history
      await addFileToHistory({
        filename: file.name,
        url: response.data.url,
        pageUrl: response.data.page,
        size: response.data.size,
        deleteHash: response.data.hash,
      });

      // Mark as success in UI
      listItem?.classList.remove('uploading');
      listItem?.classList.add('success');

      // Add success icon
      const statusIcon = document.createElement('span');
      statusIcon.innerHTML = `<svg class="status-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>`;
      listItem?.querySelector('.remove-file-btn')?.replaceWith(statusIcon);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      batchUploadResults.push({
        filename: file.name,
        url: '',
        success: false,
        error: errorMsg,
      });

      // Mark as error in UI
      listItem?.classList.remove('uploading');
      listItem?.classList.add('error');

      // Add error icon
      const statusIcon = document.createElement('span');
      statusIcon.innerHTML = `<svg class="status-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`;
      listItem?.querySelector('.remove-file-btn')?.replaceWith(statusIcon);
    }

    completedCount++;
    updateProgress();
  }

  const successCount = batchUploadResults.filter(r => r.success).length;
  const failCount = batchUploadResults.filter(r => !r.success).length;

  // Show results
  if (successCount > 0) {
    // For single file, show result card with QR
    if (totalFiles === 1 && successCount === 1) {
      currentShortUrl = batchUploadResults[0].url;
      elements.shortUrlInput.value = currentShortUrl;
      elements.resultTitle.textContent = 'File Uploaded';
      elements.qrSection.classList.remove('hidden');
      elements.resultCard.classList.remove('hidden');
      await generateQRCode(currentShortUrl);

      // Auto copy for single file
      const autoCopy = await getAutoCopy();
      if (autoCopy) {
        await copyToClipboard(currentShortUrl);
        showStatus('File uploaded and link copied to clipboard!', 'success');
      } else {
        showStatus('File uploaded successfully!', 'success');
      }
    } else {
      // For multiple files, show batch result card
      renderBatchResults();
      elements.batchResultCard.classList.remove('hidden');

      if (failCount > 0) {
        showStatus(`${successCount} file(s) uploaded successfully. ${failCount} failed.`, 'success');
      } else {
        showStatus(`${successCount} file(s) uploaded successfully!`, 'success');
      }
    }

    await loadHistory();
  } else {
    // All files failed
    showStatus(`Failed to upload ${failCount} file(s). Please try again.`, 'error');
  }

  setButtonLoading(elements.uploadFileBtn, false);

  // Clear files after a delay to let user see the results
  setTimeout(() => {
    clearAllSelectedFiles();
  }, 2000);
}

// Render batch upload results
function renderBatchResults(): void {
  const successResults = batchUploadResults.filter(r => r.success);
  const failResults = batchUploadResults.filter(r => !r.success);

  elements.batchResultTitle.textContent = `${successResults.length} File(s) Uploaded`;

  // Render file list
  elements.batchFilesList.innerHTML = [
    ...successResults.map(
      (result) => `
      <div class="batch-file-item">
        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <div class="file-info">
          <span class="file-name">${escapeHtml(result.filename)}</span>
          <span class="file-url">${escapeHtml(result.url)}</span>
        </div>
        <button class="icon-btn copy-file-btn" title="Copy URL" data-url="${escapeHtml(result.url)}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    `
    ),
    ...failResults.map(
      (result) => `
      <div class="batch-file-item error">
        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <div class="file-info">
          <span class="file-name">${escapeHtml(result.filename)}</span>
          <span class="file-url">Upload failed: ${escapeHtml(result.error || 'Unknown error')}</span>
        </div>
      </div>
    `
    ),
  ].join('');

  // Add event listeners for copy buttons
  elements.batchFilesList.querySelectorAll('.copy-file-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const url = (e.currentTarget as HTMLElement).getAttribute('data-url');
      if (url) {
        await copyToClipboard(url);
        showStatus('Copied to clipboard!', 'success');
        setTimeout(hideStatus, 2000);
      }
    });
  });

  // Update batch copy preview
  updateBatchCopyPreview();
}

// Generate formatted batch copy text
function generateBatchCopyText(): string {
  const format = elements.batchFormat.value;
  const includeFilename = elements.batchIncludeFilename.checked;
  const successResults = batchUploadResults.filter(r => r.success);

  return successResults
    .map((result) => {
      const { filename, url } = result;

      switch (format) {
        case 'markdown':
          return includeFilename ? `[${filename}](${url})` : `[${url}](${url})`;
        case 'html':
          return includeFilename
            ? `<a href="${url}">${escapeHtml(filename)}</a>`
            : `<a href="${url}">${url}</a>`;
        case 'bbcode':
          return includeFilename ? `[url=${url}]${filename}[/url]` : `[url]${url}[/url]`;
        case 'plain':
        default:
          return includeFilename ? `${filename}: ${url}` : url;
      }
    })
    .join('\n');
}

// Update batch copy preview
function updateBatchCopyPreview(): void {
  elements.batchCopyTextarea.value = generateBatchCopyText();
}

// Handle batch copy
async function handleBatchCopy(): Promise<void> {
  const text = elements.batchCopyTextarea.value;
  if (text) {
    await copyToClipboard(text);

    // Visual feedback on button
    elements.batchCopyBtn.classList.add('copied');
    showStatus('Copied to clipboard!', 'success');

    setTimeout(() => {
      elements.batchCopyBtn.classList.remove('copied');
      hideStatus();
    }, 2000);
  }
}

// Generate QR code
async function generateQRCode(url: string): Promise<void> {
  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    await QRCode.toCanvas(elements.qrCanvas, url, {
      width: 100,
      margin: 1,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
  }
}

// Handle copy URL
async function handleCopyUrl(): Promise<void> {
  if (!currentShortUrl) return;

  await copyToClipboard(currentShortUrl);

  elements.copyUrlBtn.classList.add('copied');
  showStatus('Copied to clipboard!', 'success');

  setTimeout(() => {
    elements.copyUrlBtn.classList.remove('copied');
    hideStatus();
  }, 2000);
}

// Copy to clipboard
async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// Export PNG
async function exportPng(): Promise<void> {
  if (!currentShortUrl) return;

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const tempCanvas = document.createElement('canvas');
    await QRCode.toCanvas(tempCanvas, currentShortUrl, {
      width: QR_EXPORT_SIZE,
      margin: 2,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });

    const dataUrl = tempCanvas.toDataURL('image/png');
    downloadFile(dataUrl, 'see-qr-code.png');
  } catch (error) {
    console.error('Failed to export PNG:', error);
    showStatus('Failed to export PNG', 'error');
  }
}

// Export SVG
async function exportSvg(): Promise<void> {
  if (!currentShortUrl) return;

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const svgString = await QRCode.toString(currentShortUrl, {
      type: 'svg',
      width: QR_EXPORT_SIZE,
      margin: 2,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, 'see-qr-code.svg');
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export SVG:', error);
    showStatus('Failed to export SVG', 'error');
  }
}

// Export PDF
async function exportPdf(): Promise<void> {
  if (!currentShortUrl) return;

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const tempCanvas = document.createElement('canvas');
    await QRCode.toCanvas(tempCanvas, currentShortUrl, {
      width: QR_EXPORT_SIZE,
      margin: 2,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [150, 150],
    });

    const imgData = tempCanvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 15, 15, 120, 120);
    pdf.save('see-qr-code.pdf');
  } catch (error) {
    console.error('Failed to export PDF:', error);
    showStatus('Failed to export PDF', 'error');
  }
}

// Download file helper
function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Toggle history
function toggleHistory(): void {
  elements.historyToggle.classList.toggle('expanded');
  elements.historyContent.classList.toggle('expanded');
}

// Update select all checkbox state
function updateSelectAllCheckbox(): void {
  const pageItems = getCurrentPageItems();
  const allPageItemsSelected = pageItems.length > 0 && pageItems.every(item => selectedIds.has(item.id));
  elements.selectAllHistory.checked = allPageItemsSelected;
}

// Update delete selected button state
function updateDeleteSelectedBtn(): void {
  elements.deleteSelectedBtn.disabled = selectedIds.size === 0;
}

// Handle select all
function handleSelectAll(): void {
  const pageItems = getCurrentPageItems();
  if (elements.selectAllHistory.checked) {
    pageItems.forEach(item => selectedIds.add(item.id));
  } else {
    pageItems.forEach(item => selectedIds.delete(item.id));
  }
  updateDeleteSelectedBtn();
  renderHistory();
}

// Handle delete selected
function handleDeleteSelected(): void {
  if (selectedIds.size === 0) return;

  const itemLabels: Record<TabType, string> = {
    url: 'link',
    text: 'text',
    file: 'file',
  };
  const label = itemLabels[currentTab];
  const plural = selectedIds.size > 1 ? 's' : '';

  showConfirmModal(
    `Delete Selected ${label.charAt(0).toUpperCase() + label.slice(1)}${plural}`,
    `Are you sure you want to delete ${selectedIds.size} ${label}${plural} from history?`,
    async () => {
      // Delete from correct history based on current tab
      switch (currentTab) {
        case 'url':
          await deleteUrlHistoryItems(Array.from(selectedIds));
          break;
        case 'text':
          await deleteTextHistoryItems(Array.from(selectedIds));
          break;
        case 'file':
          await deleteFileHistoryItems(Array.from(selectedIds));
          break;
      }
      currentPage = 1;
      await loadHistory();
      showStatus(`${selectedIds.size} ${label}${plural} deleted from history`, 'success');
      setTimeout(hideStatus, 2000);
    }
  );
}

// Handle clear all history
function handleClearAllHistory(): void {
  if (allHistory.length === 0) return;

  const itemLabels: Record<TabType, string> = {
    url: 'link',
    text: 'text',
    file: 'file',
  };
  const label = itemLabels[currentTab];
  const plural = allHistory.length > 1 ? 's' : '';

  showConfirmModal(
    `Clear All ${label.charAt(0).toUpperCase() + label.slice(1)}${plural}`,
    `Are you sure you want to clear all ${allHistory.length} ${label}${plural} from history?`,
    async () => {
      // Clear correct history based on current tab
      switch (currentTab) {
        case 'url':
          await clearUrlHistory();
          break;
        case 'text':
          await clearTextHistory();
          break;
        case 'file':
          await clearFileHistory();
          break;
      }
      currentPage = 1;
      await loadHistory();
      showStatus('All history cleared', 'success');
      setTimeout(hideStatus, 2000);
    }
  );
}

// Show confirm modal
function showConfirmModal(title: string, message: string, onConfirm: () => void): void {
  elements.confirmModalTitle.textContent = title;
  elements.confirmModalMessage.textContent = message;
  confirmCallback = onConfirm;
  elements.confirmModal.classList.remove('hidden');
}

// Close confirm modal
function closeConfirmModal(): void {
  elements.confirmModal.classList.add('hidden');
  confirmCallback = null;
}

// Handle confirm delete
function handleConfirmDelete(): void {
  if (confirmCallback) {
    confirmCallback();
  }
  closeConfirmModal();
}

// Open settings
function openSettings(): void {
  elements.settingsModal.classList.remove('hidden');
}

// Close settings
function closeSettings(): void {
  elements.settingsModal.classList.add('hidden');
}

// Handle reset token
async function handleResetToken(): Promise<void> {
  await removeApiKey();
  sdk = null;
  closeSettings();
  showSetupPanel();
  elements.apiTokenInput.value = '';
}

// Handle clear history (from settings)
function handleClearHistory(): void {
  closeSettings();
  handleClearAllHistory();
}

// Show status message
function showStatus(message: string, type: 'success' | 'error' | 'info'): void {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`;
  elements.statusMessage.classList.remove('hidden');
}

// Hide status message
function hideStatus(): void {
  elements.statusMessage.classList.add('hidden');
}

// Show setup error
function showSetupError(message: string): void {
  elements.setupError.textContent = message;
  elements.setupError.classList.remove('hidden');
}

// Hide setup error
function hideSetupError(): void {
  elements.setupError.classList.add('hidden');
}

// Set button loading state
function setButtonLoading(button: HTMLButtonElement, loading: boolean): void {
  button.disabled = loading;
  button.classList.toggle('loading', loading);

  const loader = button.querySelector('.btn-loader');
  const text = button.querySelector('.btn-text');
  const icon = button.querySelector('.btn-icon');

  loader?.classList.toggle('hidden', !loading);
  text?.classList.toggle('hidden', loading);
  icon?.classList.toggle('hidden', loading);
}

// Escape HTML helper
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Truncate URL helper
function truncateUrl(url: string, maxLength = 40): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

// Format short URL for display (remove https://)
function formatShortUrl(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Open QR Modal
async function openQrModal(url: string): Promise<void> {
  qrModalUrl = url;
  elements.qrModalUrl.textContent = url;
  elements.qrModal.classList.remove('hidden');

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    await QRCode.toCanvas(elements.qrModalCanvas, url, {
      width: 200,
      margin: 2,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
  }
}

// Close QR Modal
function closeQrModal(): void {
  elements.qrModal.classList.add('hidden');
  qrModalUrl = null;
}

// Show QR Modal status
function showQrModalStatus(message: string, type: 'success' | 'error'): void {
  elements.qrModalStatus.textContent = message;
  elements.qrModalStatus.className = `qr-modal-status ${type}`;
  elements.qrModalStatus.classList.remove('hidden');
}

// Hide QR Modal status
function hideQrModalStatus(): void {
  elements.qrModalStatus.classList.add('hidden');
}

// Handle QR Modal Copy
async function handleQrModalCopy(): Promise<void> {
  if (!qrModalUrl) return;

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const tempCanvas = document.createElement('canvas');
    await QRCode.toCanvas(tempCanvas, qrModalUrl, {
      width: QR_EXPORT_SIZE,
      margin: 2,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });

    tempCanvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showQrModalStatus('QR code copied to clipboard!', 'success');
          setTimeout(hideQrModalStatus, 2000);
        } catch (err) {
          console.error('Failed to copy image:', err);
          showQrModalStatus('Failed to copy QR code', 'error');
        }
      }
    }, 'image/png');
  } catch (error) {
    console.error('Failed to copy QR code:', error);
    showQrModalStatus('Failed to copy QR code', 'error');
  }
}

// Handle QR Modal PNG Export
async function handleQrModalPng(): Promise<void> {
  if (!qrModalUrl) return;

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const tempCanvas = document.createElement('canvas');
    await QRCode.toCanvas(tempCanvas, qrModalUrl, {
      width: QR_EXPORT_SIZE,
      margin: 2,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });

    const dataUrl = tempCanvas.toDataURL('image/png');
    downloadFile(dataUrl, 'see-qr-code.png');
  } catch (error) {
    console.error('Failed to export PNG:', error);
    showStatus('Failed to export PNG', 'error');
  }
}

// Handle QR Modal SVG Export
async function handleQrModalSvg(): Promise<void> {
  if (!qrModalUrl) return;

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const svgString = await QRCode.toString(qrModalUrl, {
      type: 'svg',
      width: QR_EXPORT_SIZE,
      margin: 2,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, 'see-qr-code.svg');
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export SVG:', error);
    showStatus('Failed to export SVG', 'error');
  }
}

// Handle QR Modal PDF Export
async function handleQrModalPdf(): Promise<void> {
  if (!qrModalUrl) return;

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const tempCanvas = document.createElement('canvas');
    await QRCode.toCanvas(tempCanvas, qrModalUrl, {
      width: QR_EXPORT_SIZE,
      margin: 2,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [150, 150],
    });

    const imgData = tempCanvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 15, 15, 120, 120);
    pdf.save('see-qr-code.pdf');
  } catch (error) {
    console.error('Failed to export PDF:', error);
    showStatus('Failed to export PDF', 'error');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
