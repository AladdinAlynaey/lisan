/**
 * Lisan — Meanings Page (meanings.js)
 */
(function () {
    'use strict';
    const { api, showLoading, hideLoading, showToast } = window.lisan;
    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);

    let powerLevel = 'strong';

    const dom = {
        wordInput: $('#meaning-word'),
        searchBtn: $('#meaning-search-btn'),
        results: $('#meaning-results'),
        title: $('#meaning-title'),
        type: $('#meaning-type'),
        content: $('#meaning-content')
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
        if (!word) { showToast('أدخل كلمة للبحث'); return; }
        showLoading('جارٍ البحث عن المعنى...', ['إرسال الطلب...', 'البحث في المعاجم العربية...', 'استخراج المرادفات والتضادات...', 'إعداد النتائج...']);
        dom.searchBtn.disabled = true;
        try {
            const data = await api('/api/meanings', { body: JSON.stringify({ word, power_level: powerLevel }) });
            renderResults(data);
            showToast('تم البحث بنجاح', 'success');
        } catch (err) { showToast(err.message); }
        finally { hideLoading(); dom.searchBtn.disabled = false; }
    }

    function renderResults(data) {
        const m = data.result;
        if (!m) return;

        dom.title.textContent = m.word || dom.wordInput.value;
        dom.type.textContent = m.word_type ? `(${m.word_type})` : '';

        let html = '';

        // Meaning(s)
        if (m.meaning) {
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">📖</span> المعنى</div>
                    <div class="meaning-text">${m.meaning}</div>
                </div>`;
        }

        // Synonyms
        if (m.synonyms && m.synonyms.length) {
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">🔗</span> المرادفات</div>
                    <div class="meaning-tags">${m.synonyms.map(s => `<span class="meaning-tag synonym">${s}</span>`).join('')}</div>
                </div>`;
        }

        // Antonyms
        if (m.antonyms && m.antonyms.length) {
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">↔</span> التضادات</div>
                    <div class="meaning-tags">${m.antonyms.map(a => `<span class="meaning-tag antonym">${a}</span>`).join('')}</div>
                </div>`;
        }

        // Examples
        if (m.examples && m.examples.length) {
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">💡</span> أمثلة الاستخدام</div>
                    ${m.examples.map(e => `<div class="meaning-example">${e}</div>`).join('')}
                </div>`;
        }

        // Root & Pattern
        if (m.root || m.pattern) {
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">🌱</span> معلومات صرفية</div>
                    <div class="meaning-text">
                        ${m.root ? `<strong>الجذر:</strong> ${m.root}<br>` : ''}
                        ${m.pattern ? `<strong>الوزن:</strong> ${m.pattern}` : ''}
                    </div>
                </div>`;
        }

        dom.content.innerHTML = html;
        dom.results.classList.add('visible');
        dom.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
