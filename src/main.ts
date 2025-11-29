/**
 * S.EE Chrome Extension - Main Entry Point
 */

import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { UrlShortenSDK, UrlShortenerError, NetworkError } from './sdk';
import {
  getApiKey,
  saveApiKey,
  removeApiKey,
  getDomains,
  saveDomains,
  getDefaultDomain,
  saveDefaultDomain,
  getAutoCopy,
  saveAutoCopy,
  getTheme,
  saveTheme,
  getHistory,
  addToHistory,
  clearHistory,
  deleteHistoryItem,
  deleteHistoryItems,
  HISTORY_PAGE_SIZE,
  type HistoryItem,
} from './storage';

// DOM Elements
const elements = {
  // Panels
  setupPanel: document.getElementById('setup-panel') as HTMLElement,
  mainPanel: document.getElementById('main-panel') as HTMLElement,

  // Header
  themeToggle: document.getElementById('theme-toggle') as HTMLButtonElement,
  settingsBtn: document.getElementById('settings-btn') as HTMLButtonElement,

  // Setup Panel
  apiTokenInput: document.getElementById('api-token') as HTMLInputElement,
  toggleTokenVisibility: document.getElementById('toggle-token-visibility') as HTMLButtonElement,
  saveTokenBtn: document.getElementById('save-token-btn') as HTMLButtonElement,
  setupError: document.getElementById('setup-error') as HTMLElement,

  // Main Panel - URL Source Toggle
  useCurrentPageBtn: document.getElementById('use-current-page') as HTMLButtonElement,
  useCustomUrlBtn: document.getElementById('use-custom-url') as HTMLButtonElement,
  currentUrlGroup: document.getElementById('current-url-group') as HTMLElement,
  customUrlGroup: document.getElementById('custom-url-group') as HTMLElement,
  currentUrlTextarea: document.getElementById('current-url') as HTMLTextAreaElement,
  customUrlInput: document.getElementById('custom-url-input') as HTMLTextAreaElement,
  domainSelect: document.getElementById('domain-select') as HTMLSelectElement,
  useCustomSlugCheckbox: document.getElementById('use-custom-slug') as HTMLInputElement,
  customSlugInput: document.getElementById('custom-slug') as HTMLInputElement,
  shortenBtn: document.getElementById('shorten-btn') as HTMLButtonElement,
  statusMessage: document.getElementById('status-message') as HTMLElement,

  // Result Card
  resultCard: document.getElementById('result-card') as HTMLElement,
  shortUrlInput: document.getElementById('short-url') as HTMLInputElement,
  copyUrlBtn: document.getElementById('copy-url-btn') as HTMLButtonElement,
  qrCanvas: document.getElementById('qr-canvas') as HTMLCanvasElement,
  exportPngBtn: document.getElementById('export-png') as HTMLButtonElement,
  exportSvgBtn: document.getElementById('export-svg') as HTMLButtonElement,
  exportPdfBtn: document.getElementById('export-pdf') as HTMLButtonElement,

  // History
  historyToggle: document.getElementById('history-toggle') as HTMLButtonElement,
  historyCount: document.getElementById('history-count') as HTMLElement,
  historyContent: document.getElementById('history-content') as HTMLElement,
  historyActionsBar: document.getElementById('history-actions-bar') as HTMLElement,
  selectAllHistory: document.getElementById('select-all-history') as HTMLInputElement,
  deleteSelectedBtn: document.getElementById('delete-selected-btn') as HTMLButtonElement,
  clearAllHistoryBtn: document.getElementById('clear-all-history-btn') as HTMLButtonElement,
  historyList: document.getElementById('history-list') as HTMLElement,
  historyPagination: document.getElementById('history-pagination') as HTMLElement,
  historyPrevBtn: document.getElementById('history-prev') as HTMLButtonElement,
  historyNextBtn: document.getElementById('history-next') as HTMLButtonElement,
  historyPageInfo: document.getElementById('history-page-info') as HTMLElement,

  // Settings Modal
  settingsModal: document.getElementById('settings-modal') as HTMLElement,
  closeSettingsBtn: document.getElementById('close-settings') as HTMLButtonElement,
  autoCopyCheckbox: document.getElementById('auto-copy') as HTMLInputElement,
  resetTokenBtn: document.getElementById('reset-token-btn') as HTMLButtonElement,
  clearHistoryBtn: document.getElementById('clear-history-btn') as HTMLButtonElement,

  // QR Modal
  qrModal: document.getElementById('qr-modal') as HTMLElement,
  closeQrModalBtn: document.getElementById('close-qr-modal') as HTMLButtonElement,
  qrModalUrl: document.getElementById('qr-modal-url') as HTMLElement,
  qrModalCanvas: document.getElementById('qr-modal-canvas') as HTMLCanvasElement,
  qrModalStatus: document.getElementById('qr-modal-status') as HTMLElement,
  qrModalCopyBtn: document.getElementById('qr-modal-copy') as HTMLButtonElement,
  qrModalPngBtn: document.getElementById('qr-modal-png') as HTMLButtonElement,
  qrModalSvgBtn: document.getElementById('qr-modal-svg') as HTMLButtonElement,
  qrModalPdfBtn: document.getElementById('qr-modal-pdf') as HTMLButtonElement,

  // Confirm Modal
  confirmModal: document.getElementById('confirm-modal') as HTMLElement,
  confirmModalTitle: document.getElementById('confirm-modal-title') as HTMLElement,
  confirmModalMessage: document.getElementById('confirm-modal-message') as HTMLElement,
  closeConfirmModalBtn: document.getElementById('close-confirm-modal') as HTMLButtonElement,
  confirmCancelBtn: document.getElementById('confirm-cancel-btn') as HTMLButtonElement,
  confirmDeleteBtn: document.getElementById('confirm-delete-btn') as HTMLButtonElement,
};

// State
let sdk: UrlShortenSDK | null = null;
let currentShortUrl: string | null = null;
let qrModalUrl: string | null = null;
let useCustomUrl = false;

// History state
let allHistory: HistoryItem[] = [];
let currentPage = 1;
let selectedIds: Set<string> = new Set();
let confirmCallback: (() => void) | null = null;

// Initialize the extension
async function init(): Promise<void> {
  await initTheme();
  await checkAuthStatus();
  setupEventListeners();
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
    sdk = new UrlShortenSDK({
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

  // Load current tab URL
  await loadCurrentTabUrl();

  // Load domains
  await loadDomains();

  // Load history
  await loadHistory();

  // Load settings
  const autoCopy = await getAutoCopy();
  elements.autoCopyCheckbox.checked = autoCopy;
}

// Load current tab URL
async function loadCurrentTabUrl(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      elements.currentUrlTextarea.value = tab.url;
    }
  } catch (error) {
    console.error('Failed to get current tab URL:', error);
    elements.currentUrlTextarea.value = 'Unable to get current page URL';
  }
}

// Load domains
async function loadDomains(): Promise<void> {
  // First try to load from storage
  let domains = await getDomains();

  if (!domains || domains.length === 0) {
    // Fetch from API
    try {
      showStatus('Fetching available domains...', 'info');
      const response = await sdk!.listDomains();
      domains = response.data.domains;
      await saveDomains(domains);
      hideStatus();
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      showStatus('Failed to load domains. You can use a custom domain.', 'error');
      domains = ['s.ee'];
    }
  }

  // Populate dropdown
  elements.domainSelect.innerHTML = '';
  const defaultDomain = await getDefaultDomain();

  domains.forEach((domain) => {
    const option = document.createElement('option');
    option.value = domain;
    option.textContent = domain;
    if (domain === defaultDomain) {
      option.selected = true;
    }
    elements.domainSelect.appendChild(option);
  });
}

// Load history
async function loadHistory(): Promise<void> {
  allHistory = await getHistory();
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
  // Update count
  elements.historyCount.textContent = allHistory.length > 0 ? `${allHistory.length}` : '';

  if (allHistory.length === 0) {
    elements.historyList.innerHTML = '<div class="history-empty">No recent links yet</div>';
    elements.historyActionsBar.classList.add('hidden');
    elements.historyPagination.classList.add('hidden');
    return;
  }

  // Show actions bar
  elements.historyActionsBar.classList.remove('hidden');

  const totalPages = getTotalPages();
  const pageItems = getCurrentPageItems();

  // Update pagination
  if (totalPages > 1) {
    elements.historyPagination.classList.remove('hidden');
    elements.historyPageInfo.textContent = `${currentPage} / ${totalPages}`;
    elements.historyPrevBtn.disabled = currentPage <= 1;
    elements.historyNextBtn.disabled = currentPage >= totalPages;
  } else {
    elements.historyPagination.classList.add('hidden');
  }

  elements.historyList.innerHTML = pageItems
    .map(
      (item) => `
      <div class="history-item ${selectedIds.has(item.id) ? 'selected' : ''}" data-id="${escapeHtml(item.id)}" data-short-url="${escapeHtml(item.shortUrl)}">
        <input type="checkbox" class="checkbox history-item-checkbox" ${selectedIds.has(item.id) ? 'checked' : ''}>
        <div class="history-item-content">
          <div class="history-short-url">${escapeHtml(formatShortUrl(item.shortUrl))}</div>
          <div class="history-original-url">${escapeHtml(truncateUrl(item.originalUrl))}</div>
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
    `
    )
    .join('');

  // Add event listeners to history items
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
      if (shortUrl) {
        openQrModal(shortUrl);
      }
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
      if (shortUrl) {
        chrome.tabs.create({ url: shortUrl });
      }
    });
  });

  elements.historyList.querySelectorAll('.history-delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = (e.currentTarget as HTMLElement).closest('.history-item');
      const id = item?.getAttribute('data-id');
      if (id) {
        showConfirmModal(
          'Delete Link',
          'Are you sure you want to delete this link from history?',
          async () => {
            await deleteHistoryItem(id);
            await loadHistory();
            showStatus('Link deleted from history', 'success');
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

  // URL source toggle
  elements.useCurrentPageBtn.addEventListener('click', () => switchUrlSource(false));
  elements.useCustomUrlBtn.addEventListener('click', () => switchUrlSource(true));

  // Custom slug toggle
  elements.useCustomSlugCheckbox.addEventListener('change', toggleCustomSlug);

  // Domain selection
  elements.domainSelect.addEventListener('change', async () => {
    await saveDefaultDomain(elements.domainSelect.value);
  });

  // Shorten button
  elements.shortenBtn.addEventListener('click', handleShorten);

  // Copy button
  elements.copyUrlBtn.addEventListener('click', handleCopyUrl);

  // Export buttons
  elements.exportPngBtn.addEventListener('click', exportPng);
  elements.exportSvgBtn.addEventListener('click', exportSvg);
  elements.exportPdfBtn.addEventListener('click', exportPdf);

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

  // Update button states
  elements.useCurrentPageBtn.classList.toggle('active', !toCustom);
  elements.useCustomUrlBtn.classList.toggle('active', toCustom);

  // Show/hide appropriate input
  elements.currentUrlGroup.classList.toggle('hidden', toCustom);
  elements.customUrlGroup.classList.toggle('hidden', !toCustom);

  // Focus custom URL input if switching to custom mode
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
    // Initialize SDK and test connection
    sdk = new UrlShortenSDK({
      baseUrl: 'https://s.ee',
      apiKey: token,
    });

    // Try to fetch domains to verify token
    const response = await sdk.listDomains();

    // Save token and domains
    await saveApiKey(token);
    await saveDomains(response.data.domains);

    // Show main panel
    await showMainPanel();
  } catch (error) {
    let errorMessage = 'Failed to verify API token';

    if (error instanceof UrlShortenerError) {
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
  // Get URL based on current mode
  const targetUrl = useCustomUrl
    ? elements.customUrlInput.value.trim()
    : elements.currentUrlTextarea.value.trim();

  if (!targetUrl) {
    showStatus(useCustomUrl ? 'Please enter a URL to shorten' : 'No URL to shorten', 'error');
    return;
  }

  // Validate URL format for custom URLs
  if (useCustomUrl) {
    try {
      new URL(targetUrl);
    } catch {
      showStatus('Please enter a valid URL (e.g., https://example.com)', 'error');
      return;
    }
  }

  // Get domain
  const domain = elements.domainSelect.value;

  if (!domain) {
    showStatus('Please select a domain', 'error');
    return;
  }

  // Get custom slug if enabled
  let customSlug: string | undefined;
  if (elements.useCustomSlugCheckbox.checked && elements.customSlugInput.value.trim()) {
    customSlug = elements.customSlugInput.value.trim();
  }

  setButtonLoading(elements.shortenBtn, true);
  hideStatus();
  elements.resultCard.classList.add('hidden');

  try {
    const response = await sdk!.create({
      domain,
      target_url: targetUrl,
      custom_slug: customSlug,
    });

    currentShortUrl = response.data.short_url;

    // Save default domain
    await saveDefaultDomain(domain);

    // Show result
    elements.shortUrlInput.value = currentShortUrl;
    elements.resultCard.classList.remove('hidden');

    // Generate QR code
    await generateQRCode(currentShortUrl);

    // Auto-copy if enabled
    const autoCopy = await getAutoCopy();
    if (autoCopy) {
      await copyToClipboard(currentShortUrl);
      showStatus('Short URL created and copied to clipboard!', 'success');
    } else {
      showStatus('Short URL created successfully!', 'success');
    }

    // Add to history
    await addToHistory({
      originalUrl: targetUrl,
      shortUrl: currentShortUrl,
      domain,
      slug: response.data.slug,
    });

    // Refresh history
    await loadHistory();
  } catch (error) {
    let errorMessage = 'Failed to shorten URL';

    if (error instanceof UrlShortenerError) {
      errorMessage = error.message;
    } else if (error instanceof NetworkError) {
      errorMessage = 'Network error. Please check your connection.';
    }

    showStatus(errorMessage, 'error');
  } finally {
    setButtonLoading(elements.shortenBtn, false);
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

  // Show copied state on button
  elements.copyUrlBtn.classList.add('copied');

  // Show status message
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
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// QR code export size
const QR_EXPORT_SIZE = 512;

// Export PNG
async function exportPng(): Promise<void> {
  if (!currentShortUrl) return;

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create a temporary canvas with higher resolution
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

    // Create a temporary canvas with higher resolution
    const tempCanvas = document.createElement('canvas');
    await QRCode.toCanvas(tempCanvas, currentShortUrl, {
      width: QR_EXPORT_SIZE,
      margin: 2,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });

    // Create PDF with proper size (150mm x 150mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [150, 150],
    });

    const imgData = tempCanvas.toDataURL('image/png');

    // Add QR code to PDF centered with padding
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

  showConfirmModal(
    'Delete Selected Links',
    `Are you sure you want to delete ${selectedIds.size} link${selectedIds.size > 1 ? 's' : ''} from history?`,
    async () => {
      await deleteHistoryItems(Array.from(selectedIds));
      currentPage = 1;
      await loadHistory();
      showStatus(`${selectedIds.size} link${selectedIds.size > 1 ? 's' : ''} deleted from history`, 'success');
      setTimeout(hideStatus, 2000);
    }
  );
}

// Handle clear all history
function handleClearAllHistory(): void {
  if (allHistory.length === 0) return;

  showConfirmModal(
    'Clear All History',
    `Are you sure you want to clear all ${allHistory.length} links from history?`,
    async () => {
      await clearHistory();
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

// Open QR Modal
async function openQrModal(url: string): Promise<void> {
  qrModalUrl = url;
  elements.qrModalUrl.textContent = url;
  elements.qrModal.classList.remove('hidden');

  // Generate QR code in modal
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

// Handle QR Modal Copy (copy QR code image)
async function handleQrModalCopy(): Promise<void> {
  if (!qrModalUrl) return;

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create a high-res canvas for copying
    const tempCanvas = document.createElement('canvas');
    await QRCode.toCanvas(tempCanvas, qrModalUrl, {
      width: QR_EXPORT_SIZE,
      margin: 2,
      color: {
        dark: isDark ? '#FAFAFA' : '#0A0A0A',
        light: isDark ? '#171717' : '#FFFFFF',
      },
    });

    // Convert canvas to blob and copy to clipboard
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
