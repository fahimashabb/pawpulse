/**
 * PawPulse Live Search Autocomplete & Client-Side Engine
 * Fast, lightweight, zero-dependency search with instant dropdown preview.
 * Fully compatible with GitHub Pages static hosting and Express dynamic server.
 */

(function () {
  let searchIndex = null;
  let isLoading = false;

  // Determine base URL dynamically (e.g. /pawpulse or empty string)
  function getBaseUrl() {
    const metaCanonical = document.querySelector('link[rel="canonical"]');
    if (metaCanonical && metaCanonical.href) {
      try {
        const u = new URL(metaCanonical.href);
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length > 0 && parts[0] === 'pawpulse') {
          return '/pawpulse';
        }
      } catch (e) {}
    }
    // Fallback: inspect script or location
    if (window.location.pathname.startsWith('/pawpulse')) {
      return '/pawpulse';
    }
    return '';
  }

  const BASE_URL = getBaseUrl();

  // Load search index lazily
  async function loadSearchIndex() {
    if (searchIndex) return searchIndex;
    if (isLoading) return [];
    isLoading = true;

    try {
      const response = await fetch(`${BASE_URL}/api/search-index.json`);
      if (response.ok) {
        searchIndex = await response.json();
      } else {
        console.warn('[Search] Failed to load search-index.json:', response.status);
        searchIndex = [];
      }
    } catch (err) {
      console.warn('[Search] Network error loading search index:', err);
      searchIndex = [];
    } finally {
      isLoading = false;
    }
    return searchIndex || [];
  }

  // Pre-load on search input focus
  function initSearchAutocomplete() {
    const searchInputs = document.querySelectorAll('input[name="q"]');
    if (!searchInputs.length) return;

    searchInputs.forEach(input => {
      const form = input.closest('form');
      if (!form) return;

      // Create dropdown container
      const dropdown = document.createElement('div');
      dropdown.className = 'pawpulse-search-dropdown hidden absolute left-0 right-0 top-full mt-2 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl z-50 overflow-hidden text-left max-h-96 overflow-y-auto';
      form.style.position = 'relative';
      form.appendChild(dropdown);

      // Pre-warm cache on focus
      input.addEventListener('focus', () => {
        loadSearchIndex();
      });

      let debounceTimer = null;
      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = input.value.trim().toLowerCase();

        if (query.length < 2) {
          dropdown.innerHTML = '';
          dropdown.classList.add('hidden');
          return;
        }

        debounceTimer = setTimeout(async () => {
          const index = await loadSearchIndex();
          if (!index || !index.length) return;

          const terms = query.split(/\s+/).filter(Boolean);
          const matches = index.filter(item => {
            const haystack = `${item.title} ${item.pet_type} ${item.category_slug} ${item.excerpt || ''}`.toLowerCase();
            return terms.every(term => haystack.includes(term));
          }).slice(0, 6);

          if (matches.length === 0) {
            dropdown.innerHTML = `
              <div class="p-4 text-center text-xs text-stone-500">
                No guides matching "<strong class="text-stone-800">${escapeHtml(query)}</strong>".
              </div>
            `;
            dropdown.classList.remove('hidden');
            return;
          }

          dropdown.innerHTML = `
            <div class="p-2 border-b border-stone-100 flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              <span>Matching Guides (${matches.length})</span>
              <span class="text-emerald-600">Live Suggestions</span>
            </div>
            <div class="divide-y divide-stone-100">
              ${matches.map(m => `
                <a href="${BASE_URL}/blog/${m.slug}" class="flex items-center gap-3 p-3 hover:bg-emerald-50/60 transition group">
                  <img src="${m.featured_image}" alt="${escapeHtml(m.title)}" class="w-12 h-12 rounded-xl object-cover shrink-0 bg-stone-100" loading="lazy" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">${escapeHtml(m.pet_type)}</span>
                      <span class="text-[10px] text-stone-400">• ${m.reading_time_minutes || 5} min read</span>
                    </div>
                    <div class="text-xs font-bold text-stone-900 group-hover:text-emerald-700 truncate leading-snug">
                      ${escapeHtml(m.title)}
                    </div>
                  </div>
                </a>
              `).join('')}
            </div>
            <a href="${BASE_URL}/search?q=${encodeURIComponent(query)}" class="block p-2.5 text-center bg-stone-50 hover:bg-stone-100 text-xs font-bold text-emerald-700 border-t border-stone-100 transition">
              View all results for "${escapeHtml(query)}" &rarr;
            </a>
          `;
          dropdown.classList.remove('hidden');
        }, 180);
      });

      // Close dropdown on outside click
      document.addEventListener('click', (e) => {
        if (!form.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      });

      // Escape key to dismiss
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdown.classList.add('hidden');
        }
      });
    });
  }

  // Client-Side Search Page Hydration (Crucial for static GitHub Pages)
  async function hydrateSearchPage() {
    const isSearchPage = window.location.pathname.endsWith('/search') || window.location.pathname.endsWith('/search/') || window.location.pathname.endsWith('/search/index.html');
    if (!isSearchPage) return;

    const urlParams = new URLSearchParams(window.location.search);
    const query = (urlParams.get('q') || '').trim();
    if (!query) return;

    const resultsContainer = document.querySelector('.space-y-4');
    const headerTitle = document.querySelector('h1');
    const headerSubtitle = document.querySelector('h1 + p');

    // If on GitHub Pages and results are not populated by Express server
    const hasServerResults = resultsContainer && resultsContainer.querySelectorAll('article').length > 0;
    if (hasServerResults) return;

    const index = await loadSearchIndex();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = index.filter(item => {
      const haystack = `${item.title} ${item.pet_type} ${item.category_slug} ${item.excerpt || ''}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    });

    if (headerTitle) {
      headerTitle.innerHTML = `Search Results for: <span class="text-emerald-700">"${escapeHtml(query)}"</span>`;
    }
    if (headerSubtitle) {
      headerSubtitle.textContent = `Found ${matches.length} matching guides across ${index.length} indexed pet guides.`;
    }

    const mainColumn = document.querySelector('main .flex-1.min-w-0');
    if (!mainColumn) return;

    // Remove any previous empty state
    const emptyState = mainColumn.querySelector('.p-12.text-center');
    if (emptyState) emptyState.remove();

    if (matches.length === 0) {
      const noResultsDiv = document.createElement('div');
      noResultsDiv.className = 'p-12 text-center bg-white rounded-3xl border border-stone-200 mt-6';
      noResultsDiv.innerHTML = `
        <span class="text-4xl block mb-2">🔍</span>
        <h3 class="text-lg font-bold text-stone-800 mb-1">No guides matched "${escapeHtml(query)}"</h3>
        <p class="text-xs text-stone-500 max-w-sm mx-auto mb-4">
          Try searching for broader terms like "cat", "dog", "python", "lizard", "diet", or "grooming".
        </p>
        <a href="${BASE_URL}/popular" class="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
          Explore Most Popular Guides &rarr;
        </a>
      `;
      mainColumn.appendChild(noResultsDiv);
      return;
    }

    // Render matches
    let listEl = mainColumn.querySelector('.space-y-4');
    if (!listEl) {
      listEl = document.createElement('div');
      listEl.className = 'space-y-4 mt-6';
      mainColumn.appendChild(listEl);
    }

    listEl.innerHTML = matches.map(art => `
      <article class="p-5 rounded-2xl bg-white border border-stone-200/80 hover:border-emerald-500 transition shadow-xs flex flex-col sm:flex-row items-start gap-4 group">
        <div class="w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-stone-100 shrink-0">
          <img src="${art.featured_image}" alt="${escapeHtml(art.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              ${escapeHtml(art.pet_type)}
            </span>
            <span class="text-[10px] text-stone-400">•</span>
            <span class="text-[10px] text-stone-400">${formatDate(art.published_at)}</span>
          </div>
          <h3 class="text-base font-bold text-stone-900 leading-snug group-hover:text-emerald-600 transition mb-1.5">
            <a href="${BASE_URL}/blog/${art.slug}">${escapeHtml(art.title)}</a>
          </h3>
          <p class="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-2">
            ${escapeHtml(art.excerpt || '')}
          </p>
          <div class="flex items-center gap-3 text-[11px] text-stone-400">
            <span>Veterinary Care Guide</span>
            <span>•</span>
            <span>${art.reading_time_minutes || 5} min read</span>
          </div>
        </div>
      </article>
    `).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr || '';
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    initSearchAutocomplete();
    hydrateSearchPage();
  });
})();
