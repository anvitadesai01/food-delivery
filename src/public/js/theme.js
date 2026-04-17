const ThemeManager = {
    STORAGE_KEY: 'foodie-theme',
    DARK_THEME: 'dark',
    LIGHT_THEME: 'light',
    
    init() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        const preferredTheme = savedTheme || this.getSystemPreference();
        this.setTheme(preferredTheme);
        this.bindToggle();
    },
    
    getSystemPreference() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? this.DARK_THEME : this.LIGHT_THEME;
    },
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
    },
    
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === this.DARK_THEME ? this.LIGHT_THEME : this.DARK_THEME;
        this.setTheme(newTheme);
        
        this.showToast(newTheme === this.DARK_THEME ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
    },
    
    bindToggle() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    },
    
    showToast(message) {
        const existingToast = document.querySelector('.theme-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'theme-toast toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(120%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
