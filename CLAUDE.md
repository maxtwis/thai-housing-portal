# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Thai Housing Portal dashboard built with React + Vite, featuring interactive maps, data visualization, and housing analytics. The application provides insights into Thailand's housing market through various data sources and geographic visualizations.

## MCP Integration

### Context7
This project uses Context7 MCP server for enhanced context awareness and capabilities.
- **MCP Server**: Context7 (https://mcp.context7.com/mcp)
- **Configuration**: Configured via `claude mcp add` command
- **Purpose**: Provides additional context and capabilities for better code understanding and assistance

### Playwright
MCP Playwright integration for browser automation and testing.
- **MCP Server**: Playwright MCP
- **Purpose**: Enables browser automation, web scraping, and end-to-end testing capabilities
- **Features**: Browser control, page navigation, element interaction, screenshot capture

## Development Commands

- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

## Architecture

### Frontend Stack
- **Framework**: React 18 with Vite build tool
- **Routing**: React Router DOM with client-side routing
- **State Management**: React Query (TanStack) for server state and caching
- **Styling**: Tailwind CSS with custom components
- **Maps**: Leaflet with marker clustering support
- **Charts**: Recharts for data visualization
- **Data Parsing**: PapaParse for CSV processing

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── apartment-supply/ # Apartment supply specific components
│   ├── charts/          # Chart components
│   └── housing-delivery-system/ # Housing delivery components
├── pages/               # Route components/pages
├── hooks/               # Custom React hooks for data fetching
├── utils/               # Utility functions and API clients
└── assets/              # Static assets
```

### Key Components
- **MapView.jsx**: Interactive map with Leaflet integration
- **Navbar.jsx**: Main navigation component
- **Dashboard.jsx**: Main housing profile dashboard
- **ApartmentSupply.jsx**: Apartment supply analysis page
- **Report.jsx**: Detailed province reports

### Data Layer
- **React Query**: Configured with 5min stale time, 10min cache time
- **CKAN API Integration**: Custom hooks for Thailand's open data platform
- **CORS Proxy**: Vercel serverless function at `/api/cors-proxy.js` for API requests

### Custom Hooks
- `useCkanQueries.js` - CKAN API data fetching
- `useApartmentQueries.js` - Apartment-specific data
- `useSupplyData.js` - Housing supply data
- `useProximityScores.js` - Geographic proximity calculations

### Deployment
- **Platform**: Vercel
- **Build Output**: `dist/` directory
- **Routing**: SPA with client-side routing (vercel.json rewrites)
- **API**: Serverless functions in `/api` directory

## Development Notes

### Path Aliases
- `@/*` resolves to `src/*` (configured in vite.config.js)

### Code Style
- Uses modern ESLint configuration with React plugins
- React 18 with JSX runtime (no React imports needed)
- Tailwind CSS for styling with typography plugin

### Data Flow
1. Pages use custom hooks to fetch data via React Query
2. Hooks utilize `ckanClient.js` for API communication
3. CORS proxy handles external API requests in production
4. Data is cached and managed by React Query

### Performance Optimizations
- Manual chunk splitting for vendor libraries, router, and charts
- Source maps enabled for debugging
- Optimized React Query defaults for data caching

## Visual Development & Testing

### Design System

The project follows S-Tier SaaS design standards inspired by Stripe, Airbnb, and Linear. All UI development must adhere to:

- **Design Principles**: `/context/design-principles.md` - Comprehensive checklist for world-class UI
- **Component Library**: NextUI with custom Tailwind configuration

### Quick Visual Check

**IMMEDIATELY after implementing any front-end change:**

1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages` ⚠️

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review

For significant UI changes or before merging PRs, use the design review agent:

```bash
# Option 1: Use the slash command
/design-review

# Option 2: Invoke the agent directly
@agent-design-review
```

The design review agent will:

- Test all interactive states and user flows
- Verify responsiveness (desktop/tablet/mobile)
- Check accessibility (WCAG 2.1 AA compliance)
- Validate visual polish and consistency
- Test edge cases and error states
- Provide categorized feedback (Blockers/High/Medium/Nitpicks)

### Playwright MCP Integration

#### Essential Commands for UI Testing

```javascript
// Navigation & Screenshots
mcp__playwright__browser_navigate(url); // Navigate to page
mcp__playwright__browser_take_screenshot(); // Capture visual evidence
mcp__playwright__browser_resize(
  width,
  height
); // Test responsiveness

// Interaction Testing
mcp__playwright__browser_click(element); // Test clicks
mcp__playwright__browser_type(
  element,
  text
); // Test input
mcp__playwright__browser_hover(element); // Test hover states

// Validation
mcp__playwright__browser_console_messages(); // Check for errors
mcp__playwright__browser_snapshot(); // Accessibility check
mcp__playwright__browser_wait_for(
  text / element
); // Ensure loading
```

### Design Compliance Checklist

When implementing UI features, verify:

- [ ] **Visual Hierarchy**: Clear focus flow, appropriate spacing
- [ ] **Consistency**: Uses design tokens, follows patterns
- [ ] **Responsiveness**: Works on mobile (375px), tablet (768px), desktop (1440px)
- [ ] **Accessibility**: Keyboard navigable, proper contrast, semantic HTML
- [ ] **Performance**: Fast load times, smooth animations (150-300ms)
- [ ] **Error Handling**: Clear error states, helpful messages
- [ ] **Polish**: Micro-interactions, loading states, empty states, No Emojis

## When to Use Automated Visual Testing

### Use Quick Visual Check for:

- Every front-end change, no matter how small
- After implementing new components or features
- When modifying existing UI elements
- After fixing visual bugs
- Before committing UI changes

### Use Comprehensive Design Review for:

- Major feature implementations
- Before creating pull requests with UI changes
- When refactoring component architecture
- After significant design system updates
- When accessibility compliance is critical

### Skip Visual Testing for:

- Backend-only changes (API, database)
- Configuration file updates
- Documentation changes
- Test file modifications
- Non-visual utility functions

## Additional Context

- Design review agent configuration: `/.claude/agents/design-review-agent.md`
- Design principles checklist: `/context/design-principles.md`
- Custom slash commands: `/context/design-review-slash-command.md`