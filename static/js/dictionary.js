/**
 * Lisan — Dictionary Page (dictionary.js)
 */
(function () {
    'use strict';
    const { api, showLoading, hideLoading, showToast } = window.lisan;
    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);

    let powerLevel = 'strong';

    const dom = {
        wordInput: $('#dict-word'),
        searchBtn: $('#dict-search-btn'),
        checkboxes: $('#dict-checkboxes'),
        selectAll: $('#dict-select-all'),
        deselectAll: $('#dict-deselect-all'),
        results: $('#dict-results'),
        title: $('#dict-title'),
        content: $('#dict-content')
    };

    function getSelectedDictionaries() {
        const checks = dom.checkboxes.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checks).map(c => c.value);
    }

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

        dom.selectAll.addEventListener('click', () => {
            dom.checkboxes.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = true);
        });
        dom.deselectAll.addEventListener('click', () => {
            dom.checkboxes.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
        });
    }

    async function handleSearch() {
        const word = dom.wordInput.value.trim();
        if (!word) { showToast('أدخل كلمة للبحث'); return; }

        const dictionaries = getSelectedDictionaries();
        if (!dictionaries.length) { showToast('اختر معجماً واحداً على الأقل'); return; }

        showLoading('جارٍ البحث في المعاجم...', ['إرسال الطلب...', 'الكشف في المعاجم المختارة...', 'جمع التعريفات والشواهد...', 'إعداد النتائج...']);
        dom.searchBtn.disabled = true;
        try {
            const data = await api('/api/dictionary', {
                body: JSON.stringify({ word, dictionaries, power_level: powerLevel })
            });
            renderResults(data);
            showToast('تم البحث بنجاح', 'success');
        } catch (err) { showToast(err.message); }
        finally { hideLoading(); dom.searchBtn.disabled = false; }
    }

    function renderResults(data) {
        const r = data.result;
        if (!r) return;

        dom.title.textContent = r.word || dom.wordInput.value;

        let html = '';

        // Root & stripping steps
        if (r.root || r.stripping_steps) {
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">🌱</span> معلومات الكشف</div>
                    <div class="meaning-text">
                        ${r.root ? `<strong>الجذر:</strong> ${r.root}<br>` : ''}
                        ${r.stripping_steps ? `<strong>خطوات التجريد:</strong> ${r.stripping_steps}` : ''}
                    </div>
                </div>`;
        }

        // Dictionary entries with باب system
        if (r.dictionaries && r.dictionaries.length) {
            r.dictionaries.forEach(d => {
                html += `
                    <div class="meaning-block" style="border-right: 3px solid var(--accent, #c9a43c);">
                        <div class="meaning-block-title"><span class="icon">📚</span> ${d.name} ${d.author ? `<span style="opacity:0.6; font-size:0.85rem;">— ${d.author}</span>` : ''}</div>
                        ${d.lookup_method || d.chapter || d.section || d.lookup_steps ? `
                            <div style="background: var(--bg-input, rgba(255,255,255,0.04)); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.75rem; font-size: 0.9rem;">
                                ${d.lookup_method ? `<strong>طريقة الكشف:</strong> ${d.lookup_method}<br>` : ''}
                                ${d.chapter ? `<strong>الباب:</strong> ${d.chapter}${d.section ? ` → <strong>الفصل:</strong> ${d.section}` : ''}<br>` : ''}
                                ${d.lookup_steps ? `<strong>خطوات الكشف:</strong> ${d.lookup_steps}` : ''}
                            </div>
                        ` : ''}
                        <div class="meaning-text">${d.definition || ''}</div>
                        ${d.examples && d.examples.length ? `
                            <div style="margin-top:0.5rem;">
                                ${d.examples.map(e => `<div class="meaning-example">${e}</div>`).join('')}
                            </div>` : ''}
                        ${d.notes ? `<div class="spell-reason" style="margin-top:0.5rem;">${d.notes}</div>` : ''}
                    </div>`;
            });
        }

        // Comparison
        if (r.comparison) {
            html += `
                <div class="meaning-block">
                    <div class="meaning-block-title"><span class="icon">↔</span> مقارنة بين المعاجم</div>
                    <div class="meaning-text">${r.comparison}</div>
                </div>`;
        }

        dom.content.innerHTML = html;
        dom.results.classList.add('visible');
        dom.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
