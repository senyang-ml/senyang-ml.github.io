// 应用程序主入口
class App {
    constructor() {
        this.currentLang = this.getInitialLanguage();
        this.init();
    }

    // 获取初始语言
    getInitialLanguage() {
        // 优先使用localStorage保存的语言
        const saved = localStorage.getItem('preferredLanguage');
        if (saved) return saved;
        
        // 根据URL路径判断
        const path = window.location.pathname;
        if (path.includes('_en.html')) return 'en';
        return 'zh';
    }

    // 初始化应用
    async init() {
        try {
            // 显示加载状态
            this.showLoading();
            
            // 加载数据
            await dataLoader.loadAll();
            dataLoader.setLanguage(this.currentLang);
            
            // 渲染页面
            pageRenderer.renderAll();
            
            // 初始化思维导图语言
            this.switchMindmapLanguage(this.currentLang);
            
            // 设置语言切换
            this.setupLanguageSwitch();
            
            // 设置其他功能
            this.setupScrollEffects();
            this.setupSmoothScroll();
            this.setupAnimations();
            
            // 隐藏加载状态
            this.hideLoading();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError();
        }
    }

    // 显示加载状态
    showLoading() {
        // 可以添加加载动画
        document.body.style.opacity = '0';
    }

    // 隐藏加载状态
    hideLoading() {
        document.body.style.opacity = '1';
        document.body.style.transition = 'opacity 0.3s';
    }

    // 显示错误
    showError() {
        alert('Failed to load page data. Please refresh the page.');
    }

    // 设置语言切换
    setupLanguageSwitch() {
        const langSwitch = document.querySelector('.language-switch');
        if (!langSwitch) return;
        
        langSwitch.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'SPAN') {
                e.preventDefault();
                
                // 切换语言
                const newLang = this.currentLang === 'zh' ? 'en' : 'zh';
                this.switchLanguage(newLang);
            }
        });
        
        // 更新语言切换显示
        this.updateLanguageSwitch();
    }

    // 切换语言
    switchLanguage(lang) {
        this.currentLang = lang;
        dataLoader.setLanguage(lang);
        pageRenderer.renderAll();
        this.updateLanguageSwitch();
        
        // 切换思维导图语言
        this.switchMindmapLanguage(lang);
        
        // 重新初始化某些功能
        this.setupAnimations();
    }
    
    // 切换思维导图语言
    switchMindmapLanguage(lang) {
        const zhContent = document.querySelector('.markmap-content[data-lang="zh"]');
        const enContent = document.querySelector('.markmap-content[data-lang="en"]');
        
        if (zhContent && enContent) {
            if (lang === 'zh') {
                zhContent.style.display = 'block';
                enContent.style.display = 'none';
            } else {
                zhContent.style.display = 'none';
                enContent.style.display = 'block';
            }
            
            // 重新初始化 markmap
            if (typeof window.initMarkmap === 'function') {
                setTimeout(() => {
                    window.initMarkmap();
                }, 50);
            }
        }
    }

    // 更新语言切换按钮
    updateLanguageSwitch() {
        const langSwitch = document.querySelector('.language-switch');
        if (!langSwitch) return;
        
        if (this.currentLang === 'zh') {
            langSwitch.innerHTML = '<a href="#" data-lang="en">EN</a> | <span class="active">中文</span>';
        } else {
            langSwitch.innerHTML = '<span class="active">EN</span> | <a href="#" data-lang="zh">中文</a>';
        }
    }

    // 设置滚动效果
    setupScrollEffects() {
        const header = document.querySelector('header');
        if (!header) return;
        
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(44, 62, 80, 0.95)';
                header.style.padding = '10px 0';
            } else {
                header.style.background = 'var(--dark-color)';
                header.style.padding = '20px 0';
            }
        });
    }

    // 设置平滑滚动
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                // 如果是语言切换链接，不阻止默认行为
                if (this.closest('.language-switch')) return;
                
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('header').offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // 设置滚动动画
    setupAnimations() {
        const animateOnScroll = function() {
            const elements = document.querySelectorAll('.section-title, .about-content, .timeline-event, .publication-card');
            
            elements.forEach(element => {
                const elementPosition = element.getBoundingClientRect().top;
                const windowHeight = window.innerHeight;
                
                if (elementPosition < windowHeight - 100) {
                    element.classList.add('animate');
                }
            });
        };

        // 初始动画
        setTimeout(animateOnScroll, 300);
        
        // 滚动时动画
        window.addEventListener('scroll', animateOnScroll);
    }
}

// 页面加载完成后启动应用
document.addEventListener('DOMContentLoaded', function() {
    const app = new App();
}); 