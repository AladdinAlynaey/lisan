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
            // Handle auth/credits errors
            if (data.redirect) {
                window.location.href = data.redirect;
                throw new Error('redirecting');
            }
            if (data.no_credits) {
                window.lisan.showToast('لا توجد أرصدة كافية! اشترِ أرصدة من صفحة الملف الشخصي.', 'error');
                window.lisan.updateCreditsDisplay(0);
                throw new Error(data.error || 'لا توجد أرصدة');
            }
            throw new Error(data.error || 'حدث خطأ غير متوقع');
        }

        // Refresh credits display after successful API call
        window.lisan.refreshCredits();

        return data;
    };

    // ── Live Credits Update ───────────────────────
    window.lisan.refreshCredits = async function () {
        try {
            const r = await fetch('/auth/api/me');
            const d = await r.json();
            if (d.logged_in) {
                window.lisan.updateCreditsDisplay(d.credits);
            }
        } catch (e) { /* silent */ }
    };

    window.lisan.updateCreditsDisplay = function (credits) {
        // Update sidebar badge
        const sidebarNum = document.querySelector('.credits-badge .cb-num');
        if (sidebarNum) {
            sidebarNum.textContent = credits;
            // Animate
            sidebarNum.style.transform = 'scale(1.3)';
            sidebarNum.style.transition = 'transform 0.2s';
            setTimeout(() => { sidebarNum.style.transform = 'scale(1)'; }, 200);
        }
        // Update sidebar profile link
        const sidebarCredits = document.querySelector('[href="/auth/profile"] span[style*="margin-right"]');
        if (sidebarCredits) sidebarCredits.textContent = credits;
        // Update mobile bottom nav profile
        const mobileItems = document.querySelectorAll('.bottom-nav-item');
        mobileItems.forEach(item => {
            if (item.href && item.href.includes('/auth/profile')) {
                const span = item.querySelector('span');
                if (span) span.textContent = credits + '💎';
            }
        });
    };

    // ── Content Persistence (localStorage, 30 min) ─
    window.lisan.savePageContent = function (key, data) {
        const entry = { data, ts: Date.now() };
        try { localStorage.setItem('lisan_' + key, JSON.stringify(entry)); } catch (e) {}
    };

    window.lisan.loadPageContent = function (key, maxAgeMs = 30 * 60 * 1000) {
        try {
            const raw = localStorage.getItem('lisan_' + key);
            if (!raw) return null;
            const entry = JSON.parse(raw);
            if (Date.now() - entry.ts > maxAgeMs) {
                localStorage.removeItem('lisan_' + key);
                return null;
            }
            return entry.data;
        } catch (e) { return null; }
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
