# AGENTS.md

Guidelines for AI agents working on this personal academic portfolio website.
This project is located at <USERNAME>.github.io/research. I want to maintian this project for my personal website.

## git push rule
每次修改完新的feature，以合理的commits提交

## Project Overview

Static personal research portfolio website with bilingual support (Chinese/English). Built with vanilla HTML, CSS, and JavaScript. Features publication filtering, mindmap visualization, and responsive design

## Data Structure & Source
所有的个人信息原数据都存放在js/data.js里面



## Build Commands

This is a static website - no build step required. Files are served directly.

```bash
# Serve locally (any static server)
python3 -m http.server 8000
# or
npx serve .

# Sync data from JSON to inline JS
python3 update_data.py
```

## Testing

No automated test suite configured. Manual testing checklist:
- [ ] Language switching works (CN/EN toggle)
- [ ] Publication filters work (All/Pose/Autonomous/MLLM)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Mindmap renders and is interactive
- [ ] Smooth scroll to anchors works

## Code Style Guidelines

### JavaScript
- Use ES6+ features (classes, arrow functions, const/let)
- Class-based architecture with clear separation of concerns
- Async/await for asynchronous operations
- Use `this.loader` pattern for dependency injection
- Event listeners use arrow functions to preserve `this` context
- Comments in Chinese for Chinese-language project

Example:
```javascript
class MyClass {
    constructor(dependency) {
        this.loader = dependency;
        this.currentLang = 'zh';
    }

    async init() {
        try {
            await this.loadData();
        } catch (error) {
            console.error('Error:', error);
        }
    }
}
```

### CSS
- CSS custom properties (variables) for theming in `:root`
- BEM-like naming: `.component-element--modifier`
- Mobile-first responsive design with `@media` queries
- Chinese font stack: `'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif`
- Transition timing: `0.3s ease` standard

### HTML
- Semantic HTML5 elements (`header`, `nav`, `section`, etc.)
- `data-*` attributes for JavaScript hooks (e.g., `data-filter`)
- Font Awesome icons via CDN
- Include `rel="noopener noreferrer"` on external links

### Python (update_data.py)
- Standard library only (json, os)
- UTF-8 encoding for all file operations
- Docstrings in Chinese
- Print statements use emoji indicators (✅ ❌)

### Naming Conventions
- JavaScript: camelCase (`dataLoader`, `renderPublications`)
- CSS: kebab-case (`.section-title`, `--primary-color`)
- Files: kebab-case (`data-loader.js`, `style.css`)
- Classes: PascalCase (`DataLoader`, `PageRenderer`)
- Constants: UPPER_SNAKE_CASE for module-level constants

### Data Structure
- Bilingual fields use object with `zh` and `en` keys
- JSON source files in `data/` directory (if present)
- Inline data in `js/data.js` for static deployment
- Run `update_data.py` after modifying JSON source files

### Error Handling
- Try-catch blocks for async operations
- Fallback to inline data when fetch fails
- Console.error for debugging, user-friendly alerts for critical failures

### Accessibility
- Use semantic HTML
- Include `alt` attributes on images
- Ensure sufficient color contrast (WCAG AA)
- Keyboard-navigable interactive elements

## File Organization

```
research/
├── index.html           # Chinese version
├── index_en.html        # English version
├── index_profile.html   # Profile page
├── css/
│   └── style.css        # All styles
├── js/
│   ├── data.js          # Inline data (auto-generated)
│   ├── data-loader.js   # Data loading class
│   ├── renderer.js      # Page rendering class
│   └── main.js          # App initialization
├── data/                # JSON source files (if present)
│   ├── profile.json
│   ├── experience.json
│   └── publications.json
└── update_data.py       # Sync script
```

## Common Tasks

1. **Add new publication**: Edit `js/data.js` → add to `DATA_PUBLICATIONS.papers`
2. **Update personal info**: Edit `js/data.js` → modify `DATA_PROFILE`
3. **Add new section**: Update HTML → add rendering method in `renderer.js`
4. **Style changes**: Edit `css/style.css`
5. **Add translation**: Add `zh`/`en` keys to all bilingual objects

## External Dependencies

- Font Awesome 6.4.0 (CDN)
- Markmap (CDN, for mindmap visualization)
- Google Fonts (Noto Sans SC)

No package manager - all deps loaded via CDN.
