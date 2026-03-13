/**
 * Lisan — Morphology Page (morphology.js)
 */
(function () {
    'use strict';
    const { api, showLoading, hideLoading, showToast } = window.lisan;
    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);

    let powerLevel = 'strong';

    const dom = {
        wordInput: $('#morph-word'),
        searchBtn: $('#morph-search-btn'),
        results: $('#morph-results'),
        title: $('#morph-title'),
        type: $('#morph-type'),
        content: $('#morph-content')
    };

    function init() {
        $$('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.power-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                powerLevel = btn.dataset.power;
            });
        });

        dom.searchBtn.addEventListener('click', handleSearch);
        dom.wordInput.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } });
    }

    async function handleSearch() {
        const word = dom.wordInput.value.trim();
        if (!word) { showToast('أدخل كلمة للتحليل'); return; }
        showLoading('جارٍ التحليل الصرفي...', ['إرسال الكلمة...', 'تحليل الجذر والوزن...', 'استخراج المشتقات...', 'إعداد النتائج...']);
        dom.searchBtn.disabled = true;
        try {
            const data = await api('/api/morphology', { body: JSON.stringify({ word, power_level: powerLevel }) });
            renderResults(data);
            showToast('تم التحليل بنجاح', 'success');
            window.lisan.savePageContent('morphology', { result: data.result, inputWord: word });
        } catch (err) { showToast(err.message); }
        finally { hideLoading(); dom.searchBtn.disabled = false; }
    }

    function renderResults(data) {
        const m = data.result;
        if (!m) return;

        dom.title.textContent = m.tashkeel || m.word || dom.wordInput.value;
        dom.type.textContent = m.word_type ? `(${m.word_type}${m.word_subtype ? ' — ' + m.word_subtype : ''})` : '';

        let html = '';

        // Root & Pattern
        html += `
            <div class="meaning-block">
                <div class="meaning-block-title"><span class="icon">🌱</span> الجذر والوزن</div>
                <div class="meaning-text">
                    ${m.root ? `<strong>الجذر:</strong> ${m.root}${m.root_type ? ` (${m.root_type})` : ''}<br>` : ''}
                    ${m.pattern ? `<strong>الوزن الصرفي:</strong> ${m.pattern}<br>` : ''}
                    ${m.word_type ? `<strong>النوع:</strong> ${m.word_type}${m.word_subtype ? ` — ${m.word_subtype}` : ''}<br>` : ''}
                    ${m.tashkeel ? `<strong>التشكيل:</strong> ${m.tashkeel}` : ''}
                </div>
            </div>`;

        // Derivatives
        if (m.derivatives && m.derivatives.length) {
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">🔗</span> المشتقات</div>
                    <div class="meaning-tags">
                        ${m.derivatives.map(d => `
                            <div class="spell-word-card correct-word" style="display:inline-block; margin:0.25rem;">
                                <span class="meaning-tag synonym">${d.word}</span>
                                <span style="font-size:0.8rem; opacity:0.7;"> (${d.type}${d.pattern ? ' — ' + d.pattern : ''})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }

        // Conjugation
        if (m.conjugation && (m.conjugation.past || m.conjugation.present)) {
            const c = m.conjugation;
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">🔄</span> التصريفات</div>
                    <div class="meaning-text">
                        ${c.past ? `<strong>الماضي:</strong> ${c.past}<br>` : ''}
                        ${c.present ? `<strong>المضارع:</strong> ${c.present}<br>` : ''}
                        ${c.imperative ? `<strong>الأمر:</strong> ${c.imperative}<br>` : ''}
                        ${c.verbal_noun ? `<strong>المصدر:</strong> ${c.verbal_noun}` : ''}
                    </div>
                </div>`;
        }

        // Related words
        if (m.related_words && m.related_words.length) {
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">💡</span> كلمات مرتبطة</div>
                    <div class="meaning-tags">${m.related_words.map(w => `<span class="meaning-tag synonym">${w}</span>`).join('')}</div>
                </div>`;
        }

        // Explanation
        if (m.explanation) {
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">📖</span> شرح مفصل</div>
                    <div class="meaning-text">${m.explanation}</div>
                </div>`;
        }

        dom.content.innerHTML = html;
        dom.results.classList.add('visible');
        dom.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        init();
        const saved = await window.lisan.loadPageContent('morphology');
        if (saved && saved.result) {
            if (saved.inputWord) dom.wordInput.value = saved.inputWord;
            renderResults({ result: saved.result });
        }
    });
})();
