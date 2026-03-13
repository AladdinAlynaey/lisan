/**
 * Lisan — Tashkeel Page (tashkeel.js)
 */
(function () {
    'use strict';
    const { api, showLoading, hideLoading, showToast } = window.lisan;
    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);

    let powerLevel = 'strong';

    const dom = {
        text: $('#tashkeel-text'),
        btn: $('#tashkeel-btn'),
        results: $('#tashkeel-results'),
        output: $('#tashkeel-output'),
        words: $('#tashkeel-words')
    };

    function init() {
        $$('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.power-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                powerLevel = btn.dataset.power;
            });
        });

        dom.btn.addEventListener('click', handleTashkeel);
        dom.text.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleTashkeel(); } });
    }

    async function handleTashkeel() {
        const text = dom.text.value.trim();
        if (!text) { showToast('أدخل نصاً للتشكيل'); return; }
        showLoading('جارٍ تشكيل النص...', ['إرسال النص...', 'تحليل القواعد النحوية والصرفية...', 'إضافة الحركات...', 'إعداد النتائج...']);
        dom.btn.disabled = true;
        try {
            const data = await api('/api/tashkeel', { body: JSON.stringify({ text, power_level: powerLevel }) });
            renderResults(data);
            showToast('تم التشكيل بنجاح', 'success');
            window.lisan.savePageContent('tashkeel', { result: data.result, inputText: text });
        } catch (err) { showToast(err.message); }
        finally { hideLoading(); dom.btn.disabled = false; }
    }

    function renderResults(data) {
        const r = data.result;
        if (!r) return;

        // Show the fully diacritized text prominently
        dom.output.innerHTML = `
            <div class="tashkeel-full-text">${r.tashkeel_text || ''}</div>
            <button class="btn btn-secondary copy-btn" id="copy-tashkeel" style="margin-top:1rem;">نسخ النص المشكّل</button>
        `;

        // Copy button
        const copyBtn = $('#copy-tashkeel');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(r.tashkeel_text || '').then(() => {
                    showToast('تم نسخ النص المشكّل', 'success');
                }).catch(() => showToast('فشل النسخ'));
            });
        }

        // Word-by-word breakdown
        if (r.words && r.words.length) {
            dom.words.innerHTML = `
                <div class="card-title" style="margin-top:1.5rem;"><span class="icon">📋</span> تفصيل التشكيل</div>
                ${r.words.map(w => `
                    <div class="spell-word-card correct-word">
                        <div class="spell-word-header">
                            <span class="spell-original ok">${w.original || ''}</span>
                            <span style="margin: 0 0.5rem;">←</span>
                            <span style="font-size:1.2rem; font-weight:700; color: var(--accent, #c9a43c);">${w.tashkeel || ''}</span>
                        </div>
                        ${w.explanation ? `<div class="spell-reason">${w.explanation}</div>` : ''}
                    </div>
                `).join('')}
            `;
        }

        dom.results.classList.add('visible');
        dom.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        init();
        const saved = await window.lisan.loadPageContent('tashkeel');
        if (saved && saved.result) {
            if (saved.inputText) dom.text.value = saved.inputText;
            renderResults({ result: saved.result });
        }
    });
})();
