/**
 * Lisan — Grammar Page (app.js)
 * Uses window.lisan from layout.js for shared utilities
 */

(function () {
    'use strict';

    const { api, showLoading, hideLoading, showToast, copyText } = window.lisan;
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const state = {
        sentence: '',
        mode: 'detailed',
        powerLevel: 'strong',
        analysis: null,
        chatHistory: [],
        selectedFile: null
    };

    const dom = {
        sentenceInput: $('#sentence-input'),
        modeBtns: $$('.mode-btn'),
        powerBtns: $$('.power-btn'),
        analyzeBtn: $('#analyze-btn'),
        uploadBtn: $('#upload-btn'),
        fallbackNote: $('#fallback-note'),
        uploadZone: $('#upload-zone'),
        fileInput: $('#file-input'),
        uploadPreview: $('#upload-preview'),
        uploadFilename: $('#upload-filename'),
        previewThumbnail: $('#preview-thumbnail'),
        previewShowBtn: $('#preview-show-btn'),
        imageModal: $('#image-modal'),
        imageModalImg: $('#image-modal-img'),
        imageModalClose: $('#image-modal-close'),
        removeFileBtn: $('#remove-file'),
        resultsSection: $('#results-section'),
        resultSentence: $('#result-sentence'),
        sentenceType: $('#sentence-type'),
        tierBadge: $('#tier-badge'),
        analysisBody: $('#analysis-body'),
        analysisHead: $('#analysis-head'),
        chatSection: $('#chat-section'),
        chatMessages: $('#chat-messages'),
        chatInput: $('#chat-input'),
        chatSendBtn: $('#chat-send'),
        chatPowerSelect: $('#chat-power-select'),
        chatClearBtn: $('#chat-clear'),
        explorePanel: $('#explore-panel'),
        exploreContent: $('#explore-content'),
        exploreClose: $('#explore-close'),
        panelOverlay: $('#panel-overlay')
    };

    function init() {
        dom.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dom.modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.mode = btn.dataset.mode;
            });
        });

        dom.powerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dom.powerBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.powerLevel = btn.dataset.power;
            });
        });

        dom.analyzeBtn.addEventListener('click', handleAnalyze);
        dom.uploadZone.addEventListener('click', () => dom.fileInput.click());
        dom.uploadZone.addEventListener('dragover', e => { e.preventDefault(); dom.uploadZone.classList.add('dragover'); });
        dom.uploadZone.addEventListener('dragleave', e => { e.preventDefault(); dom.uploadZone.classList.remove('dragover'); });
        dom.uploadZone.addEventListener('drop', e => {
            e.preventDefault(); dom.uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) setFile(e.dataTransfer.files[0]);
        });
        dom.fileInput.addEventListener('change', e => { if (e.target.files.length > 0) setFile(e.target.files[0]); });
        dom.removeFileBtn.addEventListener('click', removeFile);
        dom.previewShowBtn.addEventListener('click', () => { if (dom.imageModalImg.src) dom.imageModal.classList.add('visible'); });
        dom.imageModalClose.addEventListener('click', () => dom.imageModal.classList.remove('visible'));
        dom.imageModal.addEventListener('click', e => { if (e.target === dom.imageModal) dom.imageModal.classList.remove('visible'); });
        dom.uploadBtn.addEventListener('click', handleImageAnalyze);
        dom.chatSendBtn.addEventListener('click', handleChat);
        dom.chatInput.addEventListener('keypress', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } });
        dom.exploreClose.addEventListener('click', closeExplorePanel);
        dom.panelOverlay.addEventListener('click', closeExplorePanel);
        dom.chatClearBtn.addEventListener('click', () => { dom.chatMessages.innerHTML = ''; state.chatHistory = []; showToast('تم مسح المحادثة', 'success'); });
        dom.sentenceInput.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleAnalyze(); } });
    }

    function setFile(file) {
        const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/tiff'];
        if (!allowed.includes(file.type)) { showToast('صيغة الملف غير مدعومة'); return; }
        state.selectedFile = file;
        dom.uploadFilename.textContent = file.name;
        dom.uploadPreview.classList.add('visible');
        const reader = new FileReader();
        reader.onload = e => { dom.previewThumbnail.innerHTML = `<img src="${e.target.result}" alt="معاينة">`; dom.imageModalImg.src = e.target.result; };
        reader.readAsDataURL(file);
    }

    function removeFile() {
        state.selectedFile = null;
        dom.fileInput.value = '';
        dom.uploadPreview.classList.remove('visible');
        dom.previewThumbnail.innerHTML = '';
        dom.imageModalImg.src = '';
    }

    function showFallbackNote(failed, method) {
        const map = { 'Advanced': 'قوي', 'Standard': 'متوسط', 'Local': 'محلي' };
        let parts = [];
        if (failed && failed.length) parts.push(`⚠ فشل: ${failed.map(p => map[p] || p).join('، ')} — تم الانتقال للتالي`);
        if (method === 'vision') parts.push('<span class="extraction-label strong">📷 استخراج بالنموذج القوي</span>');
        else if (method === 'vision_local') parts.push('<span class="extraction-label low">📷 استخراج بالنموذج المحلي</span>');
        else if (method === 'ocr') parts.push('<span class="extraction-label low">📷 OCR محلي</span>');
        if (parts.length) { dom.fallbackNote.innerHTML = parts.join('<br>'); dom.fallbackNote.style.display = 'block'; }
        else { dom.fallbackNote.style.display = 'none'; }
    }

    async function handleAnalyze() {
        const sentence = dom.sentenceInput.value.trim();
        if (!sentence) { showToast('الرجاء إدخال جملة عربية'); return; }
        showLoading('جارٍ تحليل الجملة...', ['إرسال الطلب إلى الخادم...', 'الاتصال بنموذج الذكاء الاصطناعي...', 'تحليل الجملة إعرابياً...', 'استخراج الإعراب والعلامات...', 'بناء جدول التحليل...']);
        dom.analyzeBtn.disabled = true;
        try {
            const data = await api('/api/analyze', { body: JSON.stringify({ sentence, mode: state.mode, power_level: state.powerLevel }) });
            state.sentence = data.sentence; state.analysis = data.analysis; state.chatHistory = [];
            renderResults(data); showFallbackNote(data.failed_providers, null); showToast('تم التحليل بنجاح', 'success');
        } catch (err) { showToast(err.message); } finally { hideLoading(); dom.analyzeBtn.disabled = false; }
    }

    async function handleImageAnalyze() {
        if (!state.selectedFile) { showToast('الرجاء رفع صورة أولاً'); return; }
        showLoading('جارٍ تحليل الصورة...', ['قراءة الصورة المرفقة...', 'استخراج النص العربي...', 'إرسال النص للنموذج...', 'تحليل الجملة إعرابياً...', 'بناء جدول التحليل...']);
        dom.uploadBtn.disabled = true;
        try {
            const fd = new FormData();
            fd.append('image', state.selectedFile); fd.append('mode', state.mode); fd.append('power_level', state.powerLevel);
            const data = await api('/api/analyze-image', { body: fd });
            state.sentence = data.sentence; state.analysis = data.analysis; state.chatHistory = [];
            dom.sentenceInput.value = data.sentence; removeFile();
            renderResults(data); showFallbackNote(data.failed_providers, data.extraction_method); showToast('تم تحليل الصورة بنجاح', 'success');
        } catch (err) { showToast(err.message); } finally { hideLoading(); dom.uploadBtn.disabled = false; }
    }

    function renderResults(data) {
        const a = data.analysis, detailed = data.mode === 'detailed';
        dom.resultSentence.textContent = a.sentence || data.sentence;
        dom.sentenceType.textContent = a.sentence_type || '';
        const tierMap = { 'Advanced': { t: 'متقدم', c: 'advanced' }, 'Standard': { t: 'قياسي', c: 'standard' }, 'Local': { t: 'محلي', c: 'local' } };
        const tier = tierMap[data.tier] || tierMap['Advanced'];
        dom.tierBadge.textContent = `المستوى: ${tier.t}`;
        dom.tierBadge.className = `tier-badge ${tier.c}`;

        dom.analysisHead.innerHTML = detailed ?
            '<tr><th>الكلمة</th><th>النوع</th><th>الإعراب</th><th>العلامة</th><th>الدور النحوي</th><th>الشرح</th></tr>' :
            '<tr><th>الكلمة</th><th>الإعراب</th><th>الشرح</th></tr>';

        dom.analysisBody.innerHTML = '';
        if (a.analysis && Array.isArray(a.analysis)) {
            a.analysis.forEach((item, idx) => {
                const hasExpl = item.explanation && item.explanation.trim().length > 0;
                const row = document.createElement('tr');
                row.className = 'analysis-row';
                if (detailed) {
                    row.innerHTML = `<td class="word-cell" data-word="${item.word}" data-idx="${idx}">${item.word || ''}</td><td>${item.type || ''}</td><td>${item.irab || ''}</td><td>${item.case_ending || ''}</td><td>${item.grammatical_role || ''}</td><td><button class="explain-btn" data-idx="${idx}">${hasExpl ? 'شرح' : 'اطلب شرح'}</button></td>`;
                } else {
                    row.innerHTML = `<td class="word-cell" data-word="${item.word}" data-idx="${idx}">${item.word || ''}</td><td>${item.irab || ''}</td><td><button class="explain-btn" data-idx="${idx}">${hasExpl ? 'شرح' : 'اطلب شرح'}</button></td>`;
                }
                dom.analysisBody.appendChild(row);

                const explRow = document.createElement('tr');
                explRow.className = 'explanation-row'; explRow.id = `expl-${idx}`;
                const cs = detailed ? 6 : 3;
                explRow.innerHTML = `<td class="explanation-cell" colspan="${cs}"><div class="explanation-text">${hasExpl ? item.explanation : '<em style="color:var(--text-dim);">جارٍ طلب الشرح...</em>'}</div></td>`;
                dom.analysisBody.appendChild(explRow);
            });
        }

        dom.analysisBody.querySelectorAll('.explain-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                const explRow = document.getElementById(`expl-${idx}`);
                const item = a.analysis[idx];
                const hasExpl = item.explanation && item.explanation.trim().length > 0;
                if (!hasExpl && !explRow.classList.contains('visible')) {
                    explRow.classList.add('visible'); btn.textContent = 'إخفاء';
                    fetchExplanation(item.word, idx);
                } else {
                    explRow.classList.toggle('visible');
                    btn.textContent = explRow.classList.contains('visible') ? 'إخفاء' : 'شرح';
                }
            });
        });

        dom.analysisBody.querySelectorAll('.word-cell').forEach(cell => {
            cell.addEventListener('click', () => openExplorePanel(cell.dataset.word));
        });

        dom.resultsSection.classList.add('visible');
        dom.chatSection.classList.add('visible');
        dom.chatMessages.innerHTML = '';
        dom.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function fetchExplanation(word, idx) {
        try {
            const data = await api('/api/explore-word', { body: JSON.stringify({ word, sentence: state.sentence, power_level: state.powerLevel }) });
            const notes = data.exploration.linguistic_notes || 'لم يتم العثور على شرح';
            const el = document.getElementById(`expl-${idx}`);
            if (el) el.querySelector('.explanation-text').textContent = notes;
            if (state.analysis?.analysis?.[idx]) state.analysis.analysis[idx].explanation = notes;
        } catch (err) {
            const el = document.getElementById(`expl-${idx}`);
            if (el) { el.querySelector('.explanation-text').textContent = 'خطأ في طلب الشرح'; el.querySelector('.explanation-text').style.color = 'var(--danger)'; }
        }
    }

    async function openExplorePanel(word) {
        dom.explorePanel.classList.add('open');
        dom.panelOverlay.classList.add('visible');
        dom.exploreContent.innerHTML = `<div class="explore-word-title">${word}</div><div class="explore-loading"><div class="loading-spinner" style="margin:0 auto;width:32px;height:32px;"></div><p style="margin-top:0.75rem;">جارٍ استكشاف الكلمة...</p></div>`;
        try {
            const data = await api('/api/explore-word', { body: JSON.stringify({ word, sentence: state.sentence, power_level: state.powerLevel }) });
            const e = data.exploration;
            dom.exploreContent.innerHTML = `
                <div class="explore-word-title">${e.word || word}</div>
                <div class="explore-field"><div class="explore-label">الجذر</div><div class="explore-value">${e.root || '—'}</div></div>
                <div class="explore-field"><div class="explore-label">الوزن الصرفي</div><div class="explore-value">${e.pattern || '—'}</div></div>
                ${e.synonyms?.length ? `<div class="explore-field"><div class="explore-label">المرادفات</div><div class="explore-tags">${e.synonyms.map(s => `<span class="explore-tag">${s}</span>`).join('')}</div></div>` : ''}
                ${e.derived_forms?.length ? `<div class="explore-field"><div class="explore-label">المشتقات</div><div class="explore-tags">${e.derived_forms.map(d => `<span class="explore-tag">${d}</span>`).join('')}</div></div>` : ''}
                ${e.linguistic_notes ? `<div class="explore-field"><div class="explore-label">ملاحظات لغوية</div><div class="explore-value">${e.linguistic_notes}</div></div>` : ''}`;
        } catch (err) {
            dom.exploreContent.innerHTML = `<div class="explore-word-title">${word}</div><div class="explore-loading" style="color:var(--danger);"><p>${err.message}</p></div>`;
        }
    }

    function closeExplorePanel() { dom.explorePanel.classList.remove('open'); dom.panelOverlay.classList.remove('visible'); }

    // ── Chat ──────────────────────────────────────
    async function handleChat() {
        const q = dom.chatInput.value.trim();
        if (!q) return;
        if (!state.sentence) { showToast('حلل جملة أولاً'); return; }
        appendMsg(q, 'user');
        state.chatHistory.push({ role: 'user', content: q });
        dom.chatInput.value = ''; dom.chatSendBtn.disabled = true;
        showTyping();
        try {
            const data = await api('/api/chat', { body: JSON.stringify({ question: q, sentence: state.sentence, analysis: state.analysis, history: state.chatHistory, power_level: dom.chatPowerSelect.value }) });
            removeTyping(); appendMsg(data.answer, 'assistant');
            state.chatHistory.push({ role: 'assistant', content: data.answer });
        } catch (err) { removeTyping(); appendMsg(err.message, 'assistant'); }
        finally { dom.chatSendBtn.disabled = false; dom.chatInput.focus(); }
    }

    function showTyping() {
        const d = document.createElement('div');
        d.className = 'chat-message typing'; d.id = 'typing-indicator';
        d.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        dom.chatMessages.appendChild(d);
        dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    }

    function removeTyping() { const t = document.getElementById('typing-indicator'); if (t) t.remove(); }

    function appendMsg(text, role) {
        const w = document.createElement('div');
        w.className = `chat-message ${role}`;
        if (role === 'assistant' && window.marked) {
            const c = document.createElement('div'); c.className = 'msg-content'; c.innerHTML = marked.parse(text);
            w.appendChild(c);
            const acts = document.createElement('div'); acts.className = 'msg-actions';
            acts.innerHTML = `<button class="msg-action-btn" data-action="copy" title="نسخ"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><button class="msg-action-btn" data-action="regenerate" title="إعادة"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg></button>`;
            w.appendChild(acts); w.dataset.rawText = text;
            acts.querySelector('[data-action="copy"]').addEventListener('click', () => doCopy(w));
            acts.querySelector('[data-action="regenerate"]').addEventListener('click', () => doRegen(w));
        } else { w.textContent = text; }
        dom.chatMessages.appendChild(w);
        dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    }

    function doCopy(el) {
        const btn = el.querySelector('[data-action="copy"]');
        copyText(el.dataset.rawText || el.textContent).then(() => {
            btn.classList.add('copied');
            btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            showToast('تم النسخ ✓', 'success');
            setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'; }, 2000);
        }).catch(() => showToast('فشل النسخ'));
    }

    async function doRegen(el) {
        const msgs = [...dom.chatMessages.querySelectorAll('.chat-message')];
        const idx = msgs.indexOf(el);
        let q = '';
        for (let i = idx - 1; i >= 0; i--) { if (msgs[i].classList.contains('user')) { q = msgs[i].textContent; break; } }
        if (!q) { showToast('لا يوجد سؤال'); return; }
        if (state.chatHistory.length >= 2) state.chatHistory.pop();
        const c = el.querySelector('.msg-content');
        if (c) c.innerHTML = '<span class="typing-dot" style="display:inline-block"></span><span class="typing-dot" style="display:inline-block"></span><span class="typing-dot" style="display:inline-block"></span>';
        try {
            const data = await api('/api/chat', { body: JSON.stringify({ question: q, sentence: state.sentence, analysis: state.analysis, history: state.chatHistory, power_level: dom.chatPowerSelect.value }) });
            if (c && window.marked) c.innerHTML = marked.parse(data.answer);
            el.dataset.rawText = data.answer;
            state.chatHistory.push({ role: 'assistant', content: data.answer });
        } catch (err) { if (c) c.innerHTML = `<p style="color:var(--danger);">${err.message}</p>`; }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
