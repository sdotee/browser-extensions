/**
 * S.EE Browser Extension - Standalone Upload Page
 * Used for Firefox to handle file selection without popup closing
 */

import './style.css';
import { SeeSDK } from '@/utils/sdk';
import {
  getApiKey,
  getTheme,
  saveTheme,
  getAutoCopy,
  addFileToHistory,
} from '@/utils/storage';

// DOM Elements
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const elements = {
  themeToggle: $<HTMLButtonElement>('theme-toggle'),
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
  statusMessage: $<HTMLElement>('status-message'),
  batchResultCard: $<HTMLElement>('batch-result-card'),
  batchResultTitle: $<HTMLElement>('batch-result-title'),
  batchFilesList: $<HTMLElement>('batch-files-list'),
  batchFormat: $<HTMLSelectElement>('batch-format'),
  batchIncludeFilename: $<HTMLInputElement>('batch-include-filename'),
  batchCopyTextarea: $<HTMLTextAreaElement>('batch-copy-textarea'),
  batchCopyBtn: $<HTMLButtonElement>('batch-copy-btn'),
  closeBtn: $<HTMLButtonElement>('close-btn'),
};

// State
let sdk: SeeSDK | null = null;
let selectedFiles: File[] = [];

// Batch upload results
interface BatchUploadResult {
  filename: string;
  url: string;
  success: boolean;
  error?: string;
}
let batchUploadResults: BatchUploadResult[] = [];

// Initialize
async function init(): Promise<void> {
  await initTheme();
  await checkAuth();
  setupEventListeners();
}

// Initialize theme
async function initTheme(): Promise<void> {
  const savedTheme = await getTheme();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

// Check authentication
async function checkAuth(): Promise<void> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    showStatus('Please set up your API token in the extension popup first.', 'error');
    elements.uploadFileBtn.disabled = true;
    return;
  }

  sdk = new SeeSDK({
    baseUrl: 'https://s.ee',
    apiKey,
  });
}

// Setup event listeners
function setupEventListeners(): void {
  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // File input
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

  // Upload
  elements.uploadFileBtn.addEventListener('click', handleUploadFile);

  // Batch copy options
  elements.batchFormat.addEventListener('change', updateBatchCopyPreview);
  elements.batchIncludeFilename.addEventListener('change', updateBatchCopyPreview);
  elements.batchCopyBtn.addEventListener('click', handleBatchCopy);

  // Close button
  elements.closeBtn.addEventListener('click', () => window.close());
}

// Toggle theme
async function toggleTheme(): Promise<void> {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  await saveTheme(newTheme);
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
  elements.uploadFileBtn.disabled = !sdk;

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
  if (selectedFiles.length === 0 || !sdk) {
    showStatus('Please select file(s) to upload', 'error');
    return;
  }

  setButtonLoading(elements.uploadFileBtn, true);
  hideStatus();
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

      const response = await sdk.uploadFile(file);

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
    renderBatchResults();
    elements.batchResultCard.classList.remove('hidden');

    // Auto copy for single file
    if (totalFiles === 1 && successCount === 1) {
      const autoCopy = await getAutoCopy();
      if (autoCopy) {
        await copyToClipboard(batchUploadResults[0].url);
        showStatus('File uploaded and link copied to clipboard!', 'success');
      } else {
        showStatus('File uploaded successfully!', 'success');
      }
    } else if (failCount > 0) {
      showStatus(`${successCount} file(s) uploaded successfully. ${failCount} failed.`, 'success');
    } else {
      showStatus(`${successCount} file(s) uploaded successfully!`, 'success');
    }

    // Show close button
    elements.closeBtn.classList.remove('hidden');
  } else {
    // All files failed
    showStatus(`Failed to upload ${failCount} file(s). Please try again.`, 'error');
  }

  setButtonLoading(elements.uploadFileBtn, false);
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

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
