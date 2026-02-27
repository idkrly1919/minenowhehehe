# LangSearch Integration

This project now includes a custom search engine powered by LangSearch API with a beautiful Vanta fog effect and Qwant-inspired UI.

## Features

- **AI-Powered Search**: Uses LangSearch API for intelligent web search with AI-generated summaries
- **Beautiful UI**: Vanta fog effect with snow/fog theme inspired by Qwant
- **Time Filters**: Filter results by time (Past 24h, Week, Month, Year, or All)
- **AI Summaries**: Get AI-generated summaries for each search result
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Default Search**: Integrated as the default search engine in the homepage

## How to Use

1. **From Homepage**: Type your query in the search box on the homepage and press Enter
2. **Direct Access**: Visit `/search.html` for the dedicated search page
3. **URL Navigation**: Type a URL (with dots) to navigate directly, or type a search query to use LangSearch

## API Configuration

The LangSearch API key is embedded in the code (as requested for this private project):
- **API Key**: `sk-0f90e3aff838488aa561c7846db184e2`
- **Endpoint**: `https://api.langsearch.com/v1/web-search`

## Search Features

### Time-based Filtering
- **All**: No time restrictions (default)
- **Past 24h**: Results from the last day
- **Past Week**: Results from the last week
- **Past Month**: Results from the last month
- **Past Year**: Results from the last year

### Result Display
Each search result includes:
- **Title**: Clickable link to the source
- **URL**: Display URL of the source
- **Snippet**: Brief excerpt from the page
- **AI Summary**: Detailed AI-generated summary (when available)

## Visual Design

### Vanta Fog Effect
- Uses Three.js and Vanta.js for stunning fog animation
- Colors adapt to the site's theme variables
- Smooth, performance-optimized rendering

### Color Scheme
- Primary gradient: Purple to indigo (#667eea to #764ba2)
- Dark theme with glassmorphism effects
- Frosted glass cards with backdrop blur
- Hover effects and smooth transitions

## Technical Implementation

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with backdrop-filter, gradients, and animations
- **Vanilla JavaScript**: No framework dependencies
- **Three.js**: 3D rendering for Vanta effects
- **Vanta.js**: Fog effect library

### API Integration
```javascript
fetch('https://api.langsearch.com/v1/web-search', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer sk-0f90e3aff838488aa561c7846db184e2',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        query: searchQuery,
        freshness: 'noLimit',
        summary: true,
        count: 10
    })
})
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Performance

- Lightweight implementation
- Optimized animations
- Efficient API calls
- Responsive loading states

## Future Enhancements

Potential improvements:
- Image search results
- Video search integration
- Dark/light theme toggle
- Search suggestions
- Advanced filters
- Result pagination
- Search history

---

**Note**: This is a private project with the API key embedded in the code for convenience. For production use, API keys should be stored securely on the backend.
