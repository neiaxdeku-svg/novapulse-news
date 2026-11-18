/**
 * NovaPulse News App
 * Client-side reactive news feed controller
 */

const STORAGE_KEYS = {
  THEME: 'novapulse_theme',
  BOOKMARKS: 'novapulse_bookmarks'
};

const state = {
  allArticles: [],
  filteredArticles: [],
  currentCategory: 'all',
  searchQuery: '',
  bookmarks: JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || '[]'),
  lastUpdated: null,
  activeReaderArticle: null
};

// DOM References
const elements = {
  html: document.documentElement,
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  searchInput: document.getElementById('searchInput'),
  mobileSearchInput: document.getElementById('mobileSearchInput'),
  categoryPills: document.querySelectorAll('.category-pill'),
  heroSection: document.getElementById('heroSection'),
  newsGrid: document.getElementById('newsGrid'),
  feedHeading: document.getElementById('feedHeading'),
  feedSubheading: document.getElementById('feedSubheading'),
  lastUpdatedLabel: document.getElementById('lastUpdatedLabel'),
  refreshBtn: document.getElementById('refreshBtn'),
  refreshIcon: document.getElementById('refreshIcon'),
  bookmarksBtn: document.getElementById('bookmarksBtn'),
  bookmarkCountBadge: document.getElementById('bookmarkCountBadge'),
  bookmarksModal: document.getElementById('bookmarksModal'),
  bookmarksList: document.getElementById('bookmarksList'),
  closeBookmarksBtn: document.getElementById('closeBookmarksBtn'),
  readerModal: document.getElementById('readerModal'),
  readerContent: document.getElementById('readerContent'),
  closeReaderBtn: document.getElementById('closeReaderBtn')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initEventListeners();
  updateBookmarkBadge();
  await loadNews();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  if (savedTheme === 'dark') {
    elements.html.classList.add('dark');
  } else {
    elements.html.classList.remove('dark');
  }

  elements.themeToggleBtn.addEventListener('click', () => {
    const isDark = elements.html.classList.toggle('dark');
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    if (window.lucide) lucide.createIcons();
  });
}

// Load News Data
async function loadNews() {
  setLoading(true);
  try {
    const res = await fetch('data/news.json');
    if (!res.ok) throw new Error('Local news.json not accessible');
    const data = await res.json();
    state.allArticles = data.articles || [];
    state.lastUpdated = data.updatedAt ? new Date(data.updatedAt) : new Date();
  } catch (err) {
    console.warn('Falling back to live direct API fetch:', err);
    await fetchLiveFallback();
  } finally {
    setLoading(false);
    updateLastUpdatedTime();
    applyFilterAndRender();
  }
}

// Client-side fallback if data/news.json is unavailable
async function fetchLiveFallback() {
  try {
    const res = await fetch('https://dev.to/api/articles?tag=ai&top=15');
    if (res.ok) {
      const items = await res.json();
      state.allArticles = items.map(item => ({
        id: `devto-${item.id}`,
        title: item.title,
        summary: item.description || item.title,
        url: item.url,
        source: 'Dev Community',
        category: 'ai',
        publishedAt: item.published_at || new Date().toISOString(),
        imageUrl: item.cover_image || item.social_image || 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
        readTime: `${item.reading_time_minutes || 4} min read`,
        reactions: item.public_reactions_count || 12
      }));
      state.lastUpdated = new Date();
    }
  } catch (e) {
    console.error('All news sources failed:', e);
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    elements.newsGrid.innerHTML = Array(6).fill(0).map(() => `
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse h-80 flex flex-col justify-between">
        <div class="h-44 bg-slate-800 rounded-xl mb-3"></div>
        <div class="h-4 bg-slate-800 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-slate-800 rounded w-full"></div>
      </div>
    `).join('');
  }
}

function updateLastUpdatedTime() {
  if (!state.lastUpdated) return;
  const minsAgo = Math.max(1, Math.round((Date.now() - new Date(state.lastUpdated).getTime()) / 60000));
  elements.lastUpdatedLabel.textContent = minsAgo <= 1 ? 'Just now' : `${minsAgo}m ago`;
}

// Filtering & Rendering
function applyFilterAndRender() {
  const query = state.searchQuery.toLowerCase().trim();
  
  state.filteredArticles = state.allArticles.filter(article => {
    const matchesCategory = state.currentCategory === 'all' || article.category === state.currentCategory;
    const matchesQuery = !query || 
      (article.title && article.title.toLowerCase().includes(query)) ||
      (article.summary && article.summary.toLowerCase().includes(query)) ||
      (article.source && article.source.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  renderHero();
  renderGrid();
  if (window.lucide) lucide.createIcons();
}

function renderHero() {
  if (state.filteredArticles.length === 0) {
    elements.heroSection.classList.add('hidden');
    return;
  }

  // Feature the top article
  const hero = state.filteredArticles[0];
  elements.heroSection.classList.remove('hidden');

  const categoryLabels = {
    ai: 'AI & Neural Nets',
    dev: 'Software Engineering',
    startups: 'Startups & VC',
    cybersecurity: 'Cybersecurity',
    gadgets: 'Gadgets & Tech'
  };

  elements.heroSection.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8">
      <div class="lg:col-span-7 space-y-4">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
            Featured Story
          </span>
          <span class="text-xs text-slate-400 font-medium">${categoryLabels[hero.category] || 'Tech'}</span>
        </div>
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight cursor-pointer hover:text-brand-400 transition" onclick="openReader('${hero.id}')">
          ${escapeHtml(hero.title)}
        </h1>
        <p class="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3">
          ${escapeHtml(hero.summary)}
        </p>
        <div class="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
          <span class="font-medium text-slate-200 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-brand-400"></span> ${escapeHtml(hero.source)}
          </span>
          <span>•</span>
          <span>${formatTimeAgo(hero.publishedAt)}</span>
          <span>•</span>
          <span>${hero.readTime || '4 min read'}</span>
          <div class="ml-auto flex items-center gap-2">
            <button onclick="toggleBookmark('${hero.id}', event)" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition" title="Save Story">
              <i data-lucide="bookmark" class="w-4 h-4 ${isBookmarked(hero.id) ? 'fill-amber-400 text-amber-400' : ''}"></i>
            </button>
            <a href="${hero.url}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition flex items-center gap-1.5 shadow-md">
              <span>Read Full</span>
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </a>
          </div>
        </div>
      </div>
      <div class="lg:col-span-5 h-64 sm:h-80 w-full overflow-hidden rounded-2xl relative group cursor-pointer" onclick="openReader('${hero.id}')">
        <img src="${hero.imageUrl}" alt="${escapeHtml(hero.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80'">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
      </div>
    </div>
  `;
}

function renderGrid() {
  // Start from second item if hero is shown, else 0
  const list = state.filteredArticles.slice(1);

  if (list.length === 0) {
    elements.newsGrid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500">
        <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
        <p class="text-base font-semibold text-slate-300">No stories match your criteria</p>
        <p class="text-xs text-slate-500 mt-1">Try switching categories or clearing your search filter.</p>
      </div>
    `;
    return;
  }

  const categoryBadges = {
    ai: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    dev: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    startups: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cybersecurity: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    gadgets: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };

  elements.newsGrid.innerHTML = list.map(item => `
    <article class="news-card flex flex-col justify-between rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden group">
      <div>
        <div class="h-48 w-full overflow-hidden relative cursor-pointer" onclick="openReader('${item.id}')">
          <img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'">
          <span class="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md ${categoryBadges[item.category] || categoryBadges.dev}">
            ${item.category}
          </span>
          <button onclick="toggleBookmark('${item.id}', event)" class="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-amber-400 transition" title="Save Story">
            <i data-lucide="bookmark" class="w-4 h-4 ${isBookmarked(item.id) ? 'fill-amber-400 text-amber-400' : ''}"></i>
          </button>
        </div>

        <div class="p-5">
          <div class="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span class="font-medium text-slate-300">${escapeHtml(item.source)}</span>
            <span>•</span>
            <span>${formatTimeAgo(item.publishedAt)}</span>
          </div>
          <h3 class="text-base font-bold text-white group-hover:text-brand-400 transition line-clamp-2 cursor-pointer leading-snug" onclick="openReader('${item.id}')">
            ${escapeHtml(item.title)}
          </h3>
          <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            ${escapeHtml(item.summary)}
          </p>
        </div>
      </div>

      <div class="px-5 pb-5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span class="flex items-center gap-1">
          <i data-lucide="flame" class="w-3.5 h-3.5 text-amber-500"></i>
          <span>${item.reactions || 1} reactions</span>
        </span>
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="hover:text-brand-400 font-medium flex items-center gap-1 transition">
          <span>Source</span>
          <i data-lucide="external-link" class="w-3 h-3"></i>
        </a>
      </div>
    </article>
  `).join('');
}

// Event Listeners
function initEventListeners() {
  // Category switching
  elements.categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.categoryPills.forEach(p => p.classList.remove('active-category'));
      pill.classList.add('active-category');
      state.currentCategory = pill.dataset.category;
      applyFilterAndRender();
    });
  });

  // Search inputs
  const handleSearch = (e) => {
    state.searchQuery = e.target.value;
    if (elements.searchInput) elements.searchInput.value = state.searchQuery;
    if (elements.mobileSearchInput) elements.mobileSearchInput.value = state.searchQuery;
    applyFilterAndRender();
  };

  elements.searchInput?.addEventListener('input', handleSearch);
  elements.mobileSearchInput?.addEventListener('input', handleSearch);

  // Refresh feed button
  elements.refreshBtn.addEventListener('click', async () => {
    elements.refreshIcon.classList.add('animate-spin');
    await loadNews();
    setTimeout(() => {
      elements.refreshIcon.classList.remove('animate-spin');
    }, 600);
  });

  // Bookmarks modal toggle
  elements.bookmarksBtn.addEventListener('click', openBookmarksModal);
  elements.closeBookmarksBtn.addEventListener('click', closeBookmarksModal);
  elements.bookmarksModal.addEventListener('click', (e) => {
    if (e.target === elements.bookmarksModal) closeBookmarksModal();
  });

  // Reader modal toggle
  elements.closeReaderBtn.addEventListener('click', closeReaderModal);
  elements.readerModal.addEventListener('click', (e) => {
    if (e.target === elements.readerModal) closeReaderModal();
  });
}

// Bookmarks Logic
function isBookmarked(id) {
  return state.bookmarks.some(b => b.id === id);
}

function toggleBookmark(id, event) {
  if (event) event.stopPropagation();
  const existingIndex = state.bookmarks.findIndex(b => b.id === id);
  if (existingIndex > -1) {
    state.bookmarks.splice(existingIndex, 1);
  } else {
    const article = state.allArticles.find(a => a.id === id);
    if (article) state.bookmarks.unshift(article);
  }
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(state.bookmarks));
  updateBookmarkBadge();
  applyFilterAndRender();
  if (!elements.bookmarksModal.classList.contains('hidden')) {
    renderBookmarksList();
  }
}

function updateBookmarkBadge() {
  elements.bookmarkCountBadge.textContent = state.bookmarks.length;
}

function openBookmarksModal() {
  renderBookmarksList();
  elements.bookmarksModal.classList.remove('hidden');
}

function closeBookmarksModal() {
  elements.bookmarksModal.classList.add('hidden');
}

function renderBookmarksList() {
  if (state.bookmarks.length === 0) {
    elements.bookmarksList.innerHTML = `
      <div class="py-12 text-center text-slate-500">
        <i data-lucide="bookmark" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
        <p class="text-sm font-semibold text-slate-300">No saved stories yet</p>
        <p class="text-xs text-slate-500 mt-1">Tap the bookmark icon on any headline to save it here.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  elements.bookmarksList.innerHTML = state.bookmarks.map(item => `
    <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 gap-3">
      <div class="min-w-0 flex-1 cursor-pointer" onclick="openReader('${item.id}'); closeBookmarksModal();">
        <h4 class="text-sm font-semibold text-white truncate hover:text-brand-400 transition">${escapeHtml(item.title)}</h4>
        <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>${escapeHtml(item.source)}</span>
          <span>•</span>
          <span>${formatTimeAgo(item.publishedAt)}</span>
        </div>
      </div>
      <button onclick="toggleBookmark('${item.id}', event)" class="p-1.5 rounded-lg text-rose-400 hover:bg-slate-900 transition" title="Remove">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

// Reader Modal Logic
window.openReader = function(id) {
  const article = state.allArticles.find(a => a.id === id) || state.bookmarks.find(b => b.id === id);
  if (!article) return;

  state.activeReaderArticle = article;
  elements.readerContent.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center gap-2 text-xs">
        <span class="px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-400 font-bold uppercase">${article.category}</span>
        <span class="text-slate-400">• ${escapeHtml(article.source)}</span>
        <span class="text-slate-400">• ${formatTimeAgo(article.publishedAt)}</span>
      </div>
      <h2 class="text-xl sm:text-2xl font-black text-white leading-tight">${escapeHtml(article.title)}</h2>
      <div class="h-64 w-full rounded-2xl overflow-hidden my-3">
        <img src="${article.imageUrl}" alt="" class="w-full h-full object-cover">
      </div>
      <p class="text-slate-300 text-sm sm:text-base leading-relaxed">${escapeHtml(article.summary)}</p>
      
      <div class="pt-6 border-t border-slate-800 flex items-center justify-between">
        <button onclick="toggleBookmark('${article.id}', event)" class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition">
          <i data-lucide="bookmark" class="w-4 h-4 ${isBookmarked(article.id) ? 'fill-amber-400 text-amber-400' : ''}"></i>
          <span>${isBookmarked(article.id) ? 'Saved' : 'Save for later'}</span>
        </button>
        <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-brand-500/20 transition">
          <span>Read Full Article at Source</span>
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
        </a>
      </div>
    </div>
  `;
  elements.readerModal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
};

function closeReaderModal() {
  elements.readerModal.classList.add('hidden');
}

// Helpers
function formatTimeAgo(dateString) {
  if (!dateString) return 'recently';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.toggleBookmark = toggleBookmark;
