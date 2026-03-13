/**
 * Lisan — Layout Controller
 * Shared utilities: loading, toast, sidebar behavior
 */

(function () {
    'use strict';

    const $ = (sel) => document.querySelector(sel);

    // ── Shared DOM refs ────────────────────────────
    window.lisan = {
        dom: {
            loadingOverlay: $('#loading-overlay'),
            loadingText: $('#loading-text'),
            loadingLogs: $('#loading-logs'),
            toast: $('#toast')
        },
        csrfToken: '',
        loadingInterval: null
    };

    // ── Init ───────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) window.lisan.csrfToken = meta.getAttribute('content');

        // Configure marked.js
        if (window.marked) {
            marked.setOptions({ breaks: true, gfm: true });
        }
    });

    // ── API Helper ─────────────────────────────────
    window.lisan.api = async function (url, options = {}) {
        const headers = {
            'X-CSRFToken': window.lisan.csrfToken,
            ...options.headers
        };

        const config = {
            method: options.method || 'POST',
            headers,
            ...options
        };

        if (!(config.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        config.headers = headers;

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ غير متوقع');
        }
        return data;
    };

    // ── Loading with Logs ──────────────────────────
    window.lisan.showLoading = function (title, steps) {
        const { loadingOverlay, loadingText, loadingLogs } = window.lisan.dom;
        loadingOverlay.classList.add('visible');
        loadingText.textContent = title;
        loadingLogs.innerHTML = '';

        let stepIndex = 0;

        function addEntry() {
            if (stepIndex >= steps.length) {
                clearInterval(window.lisan.loadingInterval);
                return;
            }

            const prev = loadingLogs.querySelector('.loading-log-entry.active');
            if (prev) {
                prev.classList.remove('active');
                prev.classList.add('completed');
                const icon = prev.querySelector('.log-icon');
                icon.classList.remove('pending');
                icon.classList.add('done');
            }

            const entry = document.createElement('div');
            entry.className = 'loading-log-entry active';
            entry.innerHTML = `<span class="log-icon pending"></span><span>${steps[stepIndex]}</span>`;
            loadingLogs.appendChild(entry);
            stepIndex++;
        }

        addEntry();
        window.lisan.loadingInterval = setInterval(addEntry, 1600);
    };

    window.lisan.hideLoading = function () {
        if (window.lisan.loadingInterval) {
            clearInterval(window.lisan.loadingInterval);
            window.lisan.loadingInterval = null;
        }
        const { loadingOverlay, loadingLogs } = window.lisan.dom;
        loadingLogs.querySelectorAll('.loading-log-entry.active').forEach(e => {
            e.classList.remove('active');
            e.classList.add('completed');
            const icon = e.querySelector('.log-icon');
            icon.classList.remove('pending');
            icon.classList.add('done');
        });
        setTimeout(() => loadingOverlay.classList.remove('visible'), 350);
    };

    // ── Toast ──────────────────────────────────────
    window.lisan.showToast = function (message, type = 'error') {
        const t = window.lisan.dom.toast;
        t.textContent = message;
        t.className = `toast ${type} visible`;
        setTimeout(() => t.classList.remove('visible'), 3500);
    };

    // ── Copy Helper ────────────────────────────────
    window.lisan.copyText = function (text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                try {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    ta.style.position = 'fixed';
                    ta.style.left = '-9999px';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    resolve();
                } catch (e) { reject(e); }
            }
        });
    };

})();
