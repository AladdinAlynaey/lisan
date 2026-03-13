/**
 * Lisan — Spelling Page (spelling.js)
 */
(function () {
    'use strict';
    const { api, showLoading, hideLoading, showToast } = window.lisan;
    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);

    let powerLevel = 'strong';
    let selectedFile = null;

    const dom = {
        text: $('#spell-text'),
        checkBtn: $('#spell-check-btn'),
        uploadBtn: $('#spell-upload-btn'),
        uploadZone: $('#spell-upload-zone'),
        fileInput: $('#spell-file-input'),
        preview: $('#spell-upload-preview'),
        previewThumb: $('#spell-preview-thumb'),
        filename: $('#spell-filename'),
        removeBtn: $('#spell-remove-file'),
        results: $('#spell-results'),
        summary: $('#spell-summary'),
        words: $('#spell-words')
    };

    function init() {
        $$('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.power-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                powerLevel = btn.dataset.power;
            });
        });

        dom.checkBtn.addEventListener('click', handleCheck);
        dom.uploadBtn.addEventListener('click', handleImageCheck);
        dom.uploadZone.addEventListener('click', () => dom.fileInput.click());
        dom.uploadZone.addEventListener('dragover', e => { e.preventDefault(); dom.uploadZone.classList.add('dragover'); });
        dom.uploadZone.addEventListener('dragleave', e => { e.preventDefault(); dom.uploadZone.classList.remove('dragover'); });
        dom.uploadZone.addEventListener('drop', e => { e.preventDefault(); dom.uploadZone.classList.remove('dragover'); if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]); });
        dom.fileInput.addEventListener('change', e => { if (e.target.files.length) setFile(e.target.files[0]); });
        dom.removeBtn.addEventListener('click', removeFile);
        dom.text.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleCheck(); } });
    }

    function setFile(file) {
        const ok = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/tiff'];
        if (!ok.includes(file.type)) { showToast('صيغة غير مدعومة'); return; }
        selectedFile = file;
        dom.filename.textContent = file.name;
        dom.preview.classList.add('visible');
        const r = new FileReader();
        r.onload = e => { dom.previewThumb.innerHTML = `<img src="${e.target.result}" alt="thumb">`; };
        r.readAsDataURL(file);
    }

    function removeFile() {
        selectedFile = null;
        dom.fileInput.value = '';
        dom.preview.classList.remove('visible');
        dom.previewThumb.innerHTML = '';
    }

    async function handleCheck() {
        const text = dom.text.value.trim();
        if (!text) { showToast('أدخل نصاً للتصحيح'); return; }
        showLoading('جارٍ التصحيح الإملائي...', ['إرسال النص...', 'مراجعة القواميس العربية...', 'تحليل الكلمات...', 'إعداد التصحيحات...']);
        dom.checkBtn.disabled = true;
        try {
            const data = await api('/api/spell-check', { body: JSON.stringify({ text, power_level: powerLevel }) });
            renderResults(data);
            showToast('تم التدقيق بنجاح', 'success');
            window.lisan.savePageContent('spelling', { result: data.result, inputText: text });
        } catch (err) { showToast(err.message); }
        finally { hideLoading(); dom.checkBtn.disabled = false; }
    }

    async function handleImageCheck() {
        if (!selectedFile) { showToast('ارفع صورة أولاً'); return; }
        showLoading('جارٍ تصحيح نص الصورة...', ['قراءة الصورة...', 'استخراج النص العربي...', 'مراجعة الإملاء...', 'إعداد التصحيحات...']);
        dom.uploadBtn.disabled = true;
        try {
            const fd = new FormData();
            fd.append('image', selectedFile);
            fd.append('power_level', powerLevel);
            const data = await api('/api/spell-check-image', { body: fd });
            dom.text.value = data.extracted_text || '';
            removeFile();
            renderResults(data);
            showToast('تم تصحيح نص الصورة', 'success');
            window.lisan.savePageContent('spelling', { result: data.result, inputText: dom.text.value });
        } catch (err) { showToast(err.message); }
        finally { hideLoading(); dom.uploadBtn.disabled = false; }
    }

    function renderResults(data) {
        const r = data.result;
        if (!r || !r.words) return;

        const correct = r.words.filter(w => w.is_correct).length;
        const wrong = r.words.filter(w => !w.is_correct).length;

        dom.summary.innerHTML = `
            <div class="spell-stat correct"><div class="stat-num">${correct}</div><div class="stat-label">كلمات صحيحة</div></div>
            <div class="spell-stat wrong"><div class="stat-num">${wrong}</div><div class="stat-label">أخطاء إملائية</div></div>
        `;

        dom.words.innerHTML = r.words.map(w => `
            <div class="spell-word-card ${w.is_correct ? 'correct-word' : 'incorrect'}">
                <div class="spell-word-header">
                    <span class="spell-original ${w.is_correct ? 'ok' : 'wrong'}">${w.word}</span>
                    <span class="spell-badge ${w.is_correct ? 'pass' : 'error'}">${w.is_correct ? 'صحيح' : 'خطأ'}</span>
                </div>
                ${!w.is_correct ? `<div class="spell-correction">التصحيح: <strong>${w.correction || '—'}</strong></div>` : ''}
                <div class="spell-reason">${w.explanation || ''}</div>
            </div>
        `).join('');

        dom.results.classList.add('visible');
        dom.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        init();
        const saved = await window.lisan.loadPageContent('spelling');
        if (saved && saved.result) {
            if (saved.inputText) dom.text.value = saved.inputText;
            renderResults({ result: saved.result });
        }
    });
})();
