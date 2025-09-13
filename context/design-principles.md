# Design Principles - Thai Housing Portal

This document outlines the design principles, patterns, and standards used in the Thai Housing Portal dashboard application.

## Core Design Philosophy

### Data-Driven Design
- **Information First**: All UI decisions prioritize clear presentation of housing and demographic data
- **Progressive Disclosure**: Complex data is organized into digestible sections with clear navigation
- **Context-Aware Interface**: Province selection drives all data visualization and maintains state across sessions

### Accessibility & Localization
- **Bilingual Support**: Interface supports both Thai and English text appropriately
- **Mobile-First Responsive**: Design adapts seamlessly from mobile dropdown navigation to desktop tabs
- **Clear Information Hierarchy**: Important data is prominently displayed with consistent typography scales

## Visual Design System

### Color Palette
- **Primary Blue**: `bg-blue-800` for active states, `bg-blue-50/100/200` for lighter variants
- **Semantic Colors**: Green for success/positive metrics, Red for errors/negative trends, Yellow for warnings
- **Neutral Grays**: `text-gray-600/700/800` for content hierarchy, `bg-gray-50/100` for backgrounds
- **Status Colors**: Blue tints for loading states and cache status indicators

### Typography
- **Hierarchy**: Clear distinction between headings (`text-2xl`, `text-lg`) and body text (`text-sm`, `text-xs`)
- **Font Weight**: Bold (`font-bold/semibold/medium`) used strategically for emphasis and navigation
- **Consistent Sizing**: Small text (`text-xs`) for metadata, standard (`text-sm`) for UI elements

### Layout Patterns
- **Container System**: `container mx-auto px-4 py-4` for consistent page margins
- **Grid Layouts**: Flexible `grid-cols-1 md:grid-cols-2` patterns for responsive chart arrangements
- **Sidebar Pattern**: 7/12 main content, 5/12 sidebar layout on desktop
- **Card System**: `bg-white rounded-lg shadow p-4` for content containers

## Component Architecture

### Navigation Design
- **Tab Navigation**: Active state styling with `bg-blue-800 text-white` vs `bg-gray-100 text-gray-700`
- **Mobile Adaptation**: Dropdown select on mobile, horizontal tabs on desktop
- **State Management**: URL parameters maintain navigation state across page loads

### Data Visualization
- **Consistent Chart Containers**: All charts follow similar prop patterns (`provinceName`, `provinceId`)
- **Loading States**: Granular loading indicators for different data types
- **Error Handling**: Clear error messages with actionable recovery options

### Interactive Elements
- **Button Styling**: Consistent padding (`px-4 py-2`), hover states, and semantic colors
- **Form Controls**: Standardized select styling with focus states (`focus:ring-2 focus:ring-blue-500`)
- **Clickable Elements**: Proper cursor styling and hover feedback

## Data Management Principles

### Performance Optimization
- **Caching Strategy**: React Query implementation for efficient data fetching and caching
- **Prefetching**: Intelligent data prefetching on province hover for smooth UX
- **Loading States**: Granular loading indicators prevent UI blocking

### State Management
- **URL-Driven State**: Province and topic selections persist via URL parameters
- **Reactive Updates**: Real-time cache status indicators in development mode
- **Filter State**: Clean filter management with clear removal options

### Error Resilience
- **Graceful Degradation**: Individual component error boundaries prevent total failure
- **User Feedback**: Clear error messages with reload options
- **Data Validation**: Robust handling of missing or incomplete data

## Content Strategy

### Information Architecture
- **Topic-Based Organization**: Demographics, Housing Supply, Affordability, Demand, Policy
- **Contextual Help**: Inline explanations for complex metrics and calculations
- **Summary Cards**: Key metrics prominently displayed in sidebar

### Multilingual Considerations
- **Context-Appropriate Language**: Thai for local data labels, English for technical terms
- **Cultural Adaptation**: Number formatting and cultural context in data presentation

## Interaction Patterns

### User Flow Design
- **Province-Centric Navigation**: All interactions center around province selection
- **Topic Switching**: Smooth transitions between different data topics
- **Deep Linking**: Direct access to specific province/topic combinations via URLs

### Responsive Behavior
- **Breakpoint Strategy**: Mobile-first design with `md:` breakpoint for desktop enhancements
- **Navigation Adaptation**: Dropdown on mobile, tabs on desktop
- **Grid Flexibility**: Responsive grid systems that stack appropriately

## Development Standards

### Code Organization
- **Component Separation**: Clear separation between data components and presentation
- **Hook Patterns**: Custom hooks for data fetching and state management
- **Utility Integration**: Consistent use of utility functions for data processing

### Performance Guidelines
- **Bundle Optimization**: Lazy loading and code splitting considerations
- **Render Optimization**: Efficient re-rendering patterns with proper dependency arrays
- **Memory Management**: Proper cleanup and cache management strategies

### Testing Approach
- **Component Testing**: Focus on user interactions and data display accuracy
- **Integration Testing**: Province switching and topic navigation flows
- **Performance Testing**: Data loading and cache behavior validation

---

*This document should be updated as the application evolves to maintain consistency across the development team.*