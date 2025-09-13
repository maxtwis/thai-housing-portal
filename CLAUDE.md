# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Thai Housing Portal dashboard built with React + Vite, featuring interactive maps, data visualization, and housing analytics. The application provides insights into Thailand's housing market through various data sources and geographic visualizations.

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