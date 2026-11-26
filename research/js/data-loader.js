// 数据加载和管理类
class DataLoader {
    constructor() {
        this.data = {
            profile: null,
            experience: null,
            publications: null
        };
        this.currentLang = 'en'; // 默认英文
    }

    // 加载所有数据
    async loadAll() {
        try {
            // 发布页内联 data.js；JSON 源仅在存在时用于本地开发
            if (window.DATA_PROFILE && window.DATA_EXPERIENCE && window.DATA_PUBLICATIONS) {
                this.data.profile = window.DATA_PROFILE;
                this.data.experience = window.DATA_EXPERIENCE;
                this.data.publications = window.DATA_PUBLICATIONS;
                return this.data;
            }

            const [profile, experience, publications] = await Promise.all([
                fetch('data/profile.json').then(r => r.json()),
                fetch('data/experience.json').then(r => r.json()),
                fetch('data/publications.json').then(r => r.json())
            ]);

            this.data.profile = profile;
            this.data.experience = experience;
            this.data.publications = publications;
            return this.data;
        } catch (error) {
            console.error('Failed to load data:', error);
            this.data.profile = window.DATA_PROFILE;
            this.data.experience = window.DATA_EXPERIENCE;
            this.data.publications = window.DATA_PUBLICATIONS;
            return this.data;
        }
    }

    // 设置当前语言
    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
    }

    // 获取当前语言
    getLanguage() {
        return this.currentLang;
    }

    // 获取翻译文本
    getText(obj) {
        if (typeof obj === 'string') return obj;
        return obj[this.currentLang] || obj['en'] || '';
    }

    // 获取基本信息
    getProfile() {
        return this.data.profile;
    }

    // 获取经历数据
    getExperience() {
        return this.data.experience;
    }

    // 获取出版物数据
    getPublications() {
        return this.data.publications;
    }
}

// 导出单例
const dataLoader = new DataLoader();
