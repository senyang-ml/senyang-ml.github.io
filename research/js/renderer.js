// 页面渲染类
class PageRenderer {
    constructor(dataLoader) {
        this.loader = dataLoader;
    }

    // 渲染导航栏
    renderNavigation() {
        const profile = this.loader.getProfile();
        const nav = profile.navigation;
        const lang = this.loader.getLanguage();
        
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;
        
        const navItems = lang === 'zh' ? 
            ['#about', '#experience', '#education', '#publications', '#contact'] :
            ['#about', '#experience', '#education', '#publications', '#contact'];
        
        navLinks.innerHTML = nav[lang].map((item, index) => 
            `<li><a href="${navItems[index]}">${item}</a></li>`
        ).join('');
    }

    // 渲染Hero区域
    renderHero() {
        const profile = this.loader.getProfile();
        const basic = profile.basic;
        const lang = this.loader.getLanguage();
        
        document.querySelector('.logo').textContent = this.loader.getText(basic.name);
        document.querySelector('.hero h1').textContent = this.loader.getText(basic.name);
        document.querySelector('.hero h2').textContent = this.loader.getText(basic.title);
        document.querySelector('.hero-text > p').textContent = this.loader.getText(basic.description);
        
        // 更新联系方式
        const emailText = lang === 'zh' ? '邮箱' : 'Email';
        const scholarText = lang === 'zh' ? '谷歌学术' : 'Google Scholar';
        const blogText = lang === 'zh' ? '博客' : 'Blog';
        
        const contactBrief = document.querySelector('.contact-brief');
        contactBrief.innerHTML = `
            <p><i class="fas fa-envelope"></i> ${emailText}: <a href="mailto:${basic.email}">${basic.email}</a></p>
            <p><i class="fas fa-graduation-cap"></i> ${scholarText}: <a href="${basic.scholar}" target="_blank" rel="noopener noreferrer">${lang === 'zh' ? '个人主页' : 'Profile'}</a></p>
            <p><i class="fas fa-blog"></i> ${blogText}: <a href="${basic.blog}" target="_blank" rel="noopener noreferrer">${basic.blog.replace('https://', '')}</a></p>
        `;
    }

    // 渲染关于我
    renderAbout() {
        const profile = this.loader.getProfile();
        const about = profile.about;
        const lang = this.loader.getLanguage();
        
        const sectionTitle = lang === 'zh' ? '关于我' : 'About Me';
        const interestsTitle = lang === 'zh' ? '我的研究兴趣包括：' : 'My research interests include:';
        
        const aboutSection = document.getElementById('about');
        const titleEl = aboutSection.querySelector('.section-title');
        const contentEl = aboutSection.querySelector('.about-content');
        
        titleEl.textContent = sectionTitle;
        contentEl.innerHTML = `
            <p>${this.loader.getText(about.content)}</p>
            <p>${interestsTitle}</p>
            <ul class="interests-list">
                ${about.interests[lang].map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
    }

    // 渲染教育背景
    renderEducation() {
        const experience = this.loader.getExperience();
        const lang = this.loader.getLanguage();
        
        const sectionTitle = lang === 'zh' ? '教育背景' : 'Education Background';
        const section = document.getElementById('education');
        const titleEl = section.querySelector('.section-title');
        
        titleEl.textContent = sectionTitle;
        
        const timeline = section.querySelector('.education-timeline');
        timeline.innerHTML = experience.education.map(edu => `
            <div class="timeline-event">
                <div class="timeline-dot ${edu.highlight ? 'highlight' : ''}">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="timeline-content">
                    <div class="degree">${this.loader.getText(edu.degree)}</div>
                    <div class="school">${this.loader.getText(edu.school)}</div>
                    <div class="major">${this.loader.getText(edu.major)}</div>
                    <div class="date">${edu.period}</div>
                </div>
            </div>
        `).join('');
    }

    // 渲染工作经历
    renderExperience() {
        const experience = this.loader.getExperience();
        const lang = this.loader.getLanguage();
        
        const sectionTitle = lang === 'zh' ? '工作实习经历' : 'Work and Internship Experience';
        const section = document.getElementById('experience');
        const titleEl = section.querySelector('.section-title');
        
        titleEl.textContent = sectionTitle;
        
        const grid = section.querySelector('.experience-grid');
        grid.innerHTML = experience.experience.map(exp => `
            <div class="experience-card job-${exp.type}">
                <div class="card-header">
                    <span class="icon"><i class="fas fa-${exp.type === 'fulltime' ? 'briefcase' : 'lightbulb'}"></i></span>
                    <h3>${this.loader.getText(exp.company)}</h3>
                </div>
                <p class="position">${this.loader.getText(exp.position)}</p>
                <p class="date">${this.loader.getText(exp.period)}</p>
                <p class="description">${this.loader.getText(exp.description)}</p>
            </div>
        `).join('');
    }

    // 渲染论文列表
    renderPublications() {
        const publications = this.loader.getPublications();
        const lang = this.loader.getLanguage();
        
        const sectionTitle = lang === 'zh' ? '研究成果' : 'Research Publications';
        const section = document.getElementById('publications');
        const titleEl = section.querySelector('.section-title');
        
        titleEl.textContent = sectionTitle;
        
        // 渲染过滤按钮
        const filterDiv = section.querySelector('.publications-filter');
        filterDiv.innerHTML = publications.categories[lang].map((cat, idx) => {
            const filters = ['all', 'pose', 'autonomous', 'mllm'];
            return `<button class="filter-btn ${idx === 0 ? 'active' : ''}" data-filter="${filters[idx]}">${cat}</button>`;
        }).join('');
        
        // 渲染论文卡片
        const grid = section.querySelector('.publications-grid');
        grid.innerHTML = publications.papers.map(paper => {
            const linksHtml = Object.entries(paper.links).map(([key, url]) => {
                const labels = {
                    'paper': lang === 'zh' ? '论文' : 'Paper',
                    'code': lang === 'zh' ? '代码' : 'Code',
                    'project': lang === 'zh' ? '项目' : 'Project',
                    'zhihu': lang === 'zh' ? '知乎' : 'Zhihu'
                };
                return `<a href="${url}" class="btn" target="_blank" rel="noopener noreferrer">${labels[key] || key}</a>`;
            }).join('');
            
            const citationText = paper.citations > 0 ? 
                (lang === 'zh' ? `(${paper.citations}次引用)` : `(${paper.citations} citations)`) : 
                '';
            
            return `
                <div class="publication-card" data-category="${paper.category}">
                    <h3>${paper.title}</h3>
                    <p class="authors">${this.highlightAuthor(paper.authors)}</p>
                    <p class="venue">${paper.venue} ${citationText}</p>
                    <div class="publication-links">
                        ${linksHtml}
                    </div>
                </div>
            `;
        }).join('');
        
        // 添加过滤功能
        this.attachPublicationFilters();
    }

    // 高亮作者名字
    highlightAuthor(authors) {
        return authors.replace(/Sen Yang/g, '<strong>Sen Yang</strong>');
    }

    // 添加论文过滤功能
    attachPublicationFilters() {
        const filterButtons = document.querySelectorAll('.publications-filter .filter-btn');
        const publicationCards = document.querySelectorAll('.publications-grid .publication-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const filter = button.dataset.filter;

                publicationCards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // 渲染联系方式
    renderContact() {
        const profile = this.loader.getProfile();
        const basic = profile.basic;
        const lang = this.loader.getLanguage();
        
        const sectionTitle = lang === 'zh' ? '联系方式' : 'Contact Me';
        const section = document.getElementById('contact');
        const titleEl = section.querySelector('.section-title');
        
        titleEl.textContent = sectionTitle;
        
        const contactInfo = section.querySelector('.contact-info');
        contactInfo.innerHTML = `
            <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <p>${basic.email}</p>
            </div>
            <div class="contact-item">
                <i class="fas fa-blog"></i>
                <p><a href="${basic.blog}" target="_blank" rel="noopener noreferrer">${basic.blog}</a></p>
            </div>
        `;
    }

    // 渲染思维导图
    renderMindmap() {
        const profile = this.loader.getProfile();
        const lang = this.loader.getLanguage();

        const section = document.getElementById('mindmap');

        // 渲染标题
        const titleEl = section.querySelector('.section-title');
        if (titleEl) {
            titleEl.textContent = this.loader.getText(profile.mindmap.title);
        }

        // 渲染提示文字
        const tipEl = section.querySelector('.markmap-tip');
        if (tipEl) {
            tipEl.textContent = this.loader.getText(profile.mindmap.tip);
        }

        // 渲染思维导图内容
        const mindmapContent = section.querySelector('.markmap-content');
        if (mindmapContent && profile.mindmap.content) {
            const content = this.loader.getText(profile.mindmap.content);
            mindmapContent.textContent = content;

            // 重新初始化 markmap
            this.reinitializeMarkmap(mindmapContent);
        }
    }

    // 重新初始化 markmap
    reinitializeMarkmap(element) {
        // 如果存在全局 initMarkmap 函数，调用它重新初始化
        if (typeof window.initMarkmap === 'function') {
            // 延迟执行，确保 DOM 更新完成
            setTimeout(() => {
                window.initMarkmap();
            }, 50);
        }
    }

    // 渲染所有内容
    renderAll() {
        this.renderNavigation();
        this.renderHero();
        this.renderAbout();
        this.renderEducation();
        this.renderExperience();
        this.renderPublications();
        this.renderContact();
        this.renderMindmap();
    }
}

// 导出渲染器
const pageRenderer = new PageRenderer(dataLoader);
