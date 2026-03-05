/**
 * Language Switcher UI Component
 * Alpha Freight - Complete Multi-language Support
 * Works with i18n.js for translations
 */

class LanguageSwitcher {
    constructor() {
        this.manager = window.I18nManager;
        this.isOpen = false;
    }

    // Initialize language switcher
    init() {
        if (!this.manager) {
            console.warn('I18nManager not found');
            return;
        }

        // Create switcher button
        this.createSwitcherButton();

        // Create modal
        this.createModal();

        // Load saved language
        const savedLang = localStorage.getItem('alphaPreferredLanguage');
        if (savedLang) {
            this.manager.setLanguage(savedLang);
        }
    }

    // Create switcher button
    createSwitcherButton() {
        // Check if button already exists
        if (document.getElementById('languageSwitcherBtn')) return;

        // Create button
        const button = document.createElement('button');
        button.id = 'languageSwitcherBtn';
        button.className = 'language-switcher-btn';
        button.innerHTML = `
            <i class="fas fa-globe"></i>
            <span id="currentLangCode">${this.manager.getLanguage()}</span>
        `;
        button.onclick = () => this.toggleModal();

        // Add to header (try multiple locations)
        const header = document.querySelector('.top-header, .header-content, .navbar, .mobile-header');
        if (header) {
            const headerContent = header.querySelector('.header-content, .header-left, .navbar-nav');
            if (headerContent) {
                headerContent.appendChild(button);
            } else {
                header.appendChild(button);
            }
        } else {
            // Add to body if no header found
            document.body.insertBefore(button, document.body.firstChild);
        }

        // Update button on language change
        this.manager.onChange((lang) => {
            const langCode = document.getElementById('currentLangCode');
            if (langCode) {
                langCode.textContent = lang.toUpperCase();
            }
        });
    }

    // Create modal
    createModal() {
        // Check if modal already exists
        if (document.getElementById('languageModal')) return;

        const modal = document.createElement('div');
        modal.id = 'languageModal';
        modal.className = 'language-modal';
        modal.innerHTML = `
            <div class="language-modal-overlay" onclick="window.LanguageSwitcher.closeModal()"></div>
            <div class="language-modal-content">
                <div class="language-modal-header">
                    <h3 data-i18n="language.modal_title">Switch Language</h3>
                    <button class="language-modal-close" onclick="window.LanguageSwitcher.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="language-modal-body">
                    <div class="language-search">
                        <input type="text" id="languageSearch" placeholder="Search languages..." data-i18n="language.search_placeholder">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="language-list" id="languageList">
                        ${this.renderLanguageList()}
                    </div>
                    <div class="language-modal-footer">
                        <p data-i18n="language.sync_note">Applies across all Alpha Freight apps</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add search functionality
        const searchInput = document.getElementById('languageSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterLanguages(e.target.value);
            });
        }

        // Apply translations
        if (this.manager) {
            this.manager.applyTranslations();
        }
    }

    // Render language list
    renderLanguageList() {
        const languages = this.manager.getLanguages();
        const currentLang = this.manager.getLanguage();

        return languages.map(lang => `
            <div class="language-item ${lang.code === currentLang ? 'active' : ''}" 
                 onclick="window.LanguageSwitcher.selectLanguage('${lang.code}')">
                <div class="language-flag">${lang.flag}</div>
                <div class="language-info">
                    <div class="language-name">${lang.nativeName}</div>
                    <div class="language-name-en">${lang.name}</div>
                </div>
                ${lang.code === currentLang ? '<i class="fas fa-check language-check"></i>' : ''}
            </div>
        `).join('');
    }

    // Filter languages
    filterLanguages(query) {
        const list = document.getElementById('languageList');
        if (!list) return;

        const items = list.querySelectorAll('.language-item');
        const searchTerm = query.toLowerCase();

        items.forEach(item => {
            const name = item.textContent.toLowerCase();
            if (name.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Select language
    selectLanguage(code) {
        if (this.manager) {
            this.manager.setLanguage(code);
            this.closeModal();
            
            // Show success message
            this.showSuccessMessage();
        }
    }

    // Show success message
    showSuccessMessage() {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'language-toast';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Language changed successfully</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    // Toggle modal
    toggleModal() {
        const modal = document.getElementById('languageModal');
        if (!modal) return;

        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Refresh language list
            const list = document.getElementById('languageList');
            if (list) {
                list.innerHTML = this.renderLanguageList();
            }
        } else {
            this.closeModal();
        }
    }

    // Close modal
    closeModal() {
        const modal = document.getElementById('languageModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.isOpen = false;
    }
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    /* Language Switcher Button */
    .language-switcher-btn {
        background: rgba(255, 255, 255, 0.15);
        border: none;
        border-radius: 10px;
        color: white;
        padding: 8px 12px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    }

    .language-switcher-btn:hover {
        background: rgba(255, 255, 255, 0.25);
    }

    .language-switcher-btn i {
        font-size: 16px;
    }

    /* Language Modal */
    .language-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: none;
        align-items: center;
        justify-content: center;
    }

    .language-modal.active {
        display: flex;
    }

    .language-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
    }

    .language-modal-content {
        position: relative;
        background: white;
        border-radius: 20px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        z-index: 10001;
    }

    .language-modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .language-modal-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
    }

    .language-modal-close {
        background: none;
        border: none;
        font-size: 20px;
        color: #6b7280;
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .language-modal-close:hover {
        background: #f3f4f6;
        color: #1f2937;
    }

    .language-modal-body {
        padding: 20px 24px;
        overflow-y: auto;
        flex: 1;
    }

    .language-search {
        position: relative;
        margin-bottom: 16px;
    }

    .language-search input {
        width: 100%;
        padding: 12px 16px 12px 44px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 14px;
        transition: all 0.2s ease;
    }

    .language-search input:focus {
        outline: none;
        border-color: #1FA9FF;
        box-shadow: 0 0 0 3px rgba(31, 169, 255, 0.1);
    }

    .language-search i {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
    }

    .language-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .language-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
    }

    .language-item:hover {
        background: #f9fafb;
    }

    .language-item.active {
        background: #eff6ff;
        border-color: #1FA9FF;
    }

    .language-flag {
        font-size: 24px;
        width: 32px;
        text-align: center;
    }

    .language-info {
        flex: 1;
    }

    .language-name {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 2px;
    }

    .language-name-en {
        font-size: 13px;
        color: #6b7280;
    }

    .language-check {
        color: #1FA9FF;
        font-size: 18px;
    }

    .language-modal-footer {
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
        margin-top: 16px;
    }

    .language-modal-footer p {
        margin: 0;
        font-size: 13px;
        color: #6b7280;
        text-align: center;
    }

    /* Toast Notification */
    .language-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10002;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
    }

    .language-toast.show {
        transform: translateY(0);
        opacity: 1;
    }

    .language-toast i {
        font-size: 18px;
    }

    /* RTL Support */
    [dir="rtl"] .language-switcher-btn {
        direction: ltr;
    }

    [dir="rtl"] .language-modal-content {
        direction: rtl;
    }
`;
document.head.appendChild(style);

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.LanguageSwitcher = new LanguageSwitcher();
        window.LanguageSwitcher.init();
    });
} else {
    window.LanguageSwitcher = new LanguageSwitcher();
    window.LanguageSwitcher.init();
}

console.log('🌍 Language Switcher loaded');

