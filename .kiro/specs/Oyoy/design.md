# Design Document: Personal Dashboard MVP

## Overview

This document outlines the technical design for a Personal Dashboard MVP - a lightweight, self-contained web application that provides essential productivity tools in a single interface. The dashboard includes a time-based greeting, focus timer, task manager, and quick links to favorite websites. All data is stored locally in the browser using the Local Storage API.

The application is designed to be:
- **Standalone**: Works as a single HTML file without a web server
- **Self-contained**: Single CSS and JavaScript file for all functionality
- **Persistent**: Data persists across browser sessions via Local Storage
- **Compatible**: Works across modern browsers (Chrome, Firefox, Edge, Safari)
- **Responsive**: Functions on screens with minimum width of 320px

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   UI Layer (View)                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │  Greeting│ │  Timer   │ │  To-Do   │ │ QuickLinks│ │  │
│  │  │ Component│ │Component │ │Component │ │Component  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                                │
│                              ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              State Management Layer                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Application State (in-memory)           │  │  │
│  │  │  - Current time/date                            │  │  │
│  │  │  - Timer state (running/paused/remaining)       │  │  │
│  │  │  - Tasks array                                  │  │  │
│  │  │  - Quick Links array                            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                                │
│              ┌───────────────┴───────────────┐               │
│              ▼                               ▼               │
│  ┌───────────────────────────┐   ┌─────────────────────────┐│
│  │     Local Storage API     │   │    Browser APIs         ││
│  │     (Data Persistence)    │   │    (Timer, Date, etc.)  ││
│  └───────────────────────────┘   └─────────────────────────┘│
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Initialization**: On page load, the State Management layer loads data from Local Storage
2. **UI Rendering**: The UI Layer renders components based on current state
3. **User Interaction**: User actions trigger state updates
4. **Persistence**: State changes are saved to Local Storage
5. **Timer Updates**: The Timer component updates independently via `setInterval`

## Components and Interfaces

### 1. Greeting Component

**Purpose**: Display current time, date, and time-appropriate greeting

**State**:
- `currentTime`: `Date` object
- `greeting`: `string` ("Good Morning", "Good Afternoon", "Good Evening", "Good Night")

**Methods**:
- `updateTime()`: Refresh current time and greeting
- `getGreetingForHour(hour: number): string`: Determine greeting based on time of day
- `formatTime(date: Date): string`: Format time as HH:MM
- `formatDate(date: Date): string`: Format date as "Monday, January 1, 2024"

**Events**:
- `timeUpdated`: Emitted when time or greeting changes

**Implementation Notes**:
- Updates every minute via `setInterval`
- Checks hour boundaries to update greeting automatically

---

### 2. Focus Timer Component

**Purpose**: 25-minute countdown timer for productivity sessions

**State**:
- `duration`: `number` (1500 seconds = 25 minutes)
- `remaining`: `number` (current countdown value)
- `isRunning`: `boolean`
- `intervalId`: `number | null` (timer interval reference)

**Methods**:
- `startTimer()`: Begin countdown
- `stopTimer()`: Pause countdown
- `resetTimer()`: Reset to full 25 minutes
- `tick()`: Decrement remaining time by 1 second
- `formatTime(seconds: number): string`: Format seconds as MM:SS
- `isComplete(): boolean`: Check if timer reached 00:00

**Events**:
- `timerTick`: Emitted every second
- `timerComplete`: Emitted when timer reaches 00:00

**Implementation Notes**:
- Updates display every second via `setInterval`
- Stores interval ID for proper cleanup
- Plays audio cue on completion (optional, configurable)

---

### 3. To-Do List Component

**Purpose**: Task management system for creating, editing, and tracking tasks

**State**:
- `tasks`: `Task[]` array of task objects
- `editingTaskId`: `string | null` (ID of task currently being edited)

**Data Model**:
```typescript
interface Task {
  id: string;              // Unique identifier (UUID)
  title: string;           // Task description
  completed: boolean;      // Completion status
  createdAt: number;       // Timestamp (milliseconds since epoch)
  notes?: string;          // Optional additional notes
}
```

**Methods**:
- `addTask(title: string): void`: Create new task
- `editTask(id: string, title: string): void`: Update task title
- `toggleComplete(id: string): void`: Toggle completion status
- `deleteTask(id: string): void`: Remove task from list
- `saveToLocalStorage(): void`: Persist tasks to Local Storage
- `loadFromLocalStorage(): Task[]`: Retrieve tasks from Local Storage

**Events**:
- `taskAdded`: Emitted when a new task is created
- `taskUpdated`: Emitted when a task is modified
- `taskDeleted`: Emitted when a task is removed
- `taskToggled`: Emitted when completion status changes

**Implementation Notes**:
- Uses UUID for unique task identification
- Validates task title (non-empty)
- Saves to Local Storage after every change

---

### 4. Quick Links Component

**Purpose**: Bookmark buttons for frequently visited websites

**State**:
- `links`: `Link[]` array of link objects
- `newLinkName`: `string` (temporary input state)
- `newLinkUrl`: `string` (temporary input state)
- `validationError`: `string | null` (error message for invalid URL)

**Data Model**:
```typescript
interface Link {
  id: string;      // Unique identifier (UUID)
  name: string;    // Display name (or URL if name not provided)
  url: string;     // Full URL (must be valid)
}
```

**Methods**:
- `addLink(name: string, url: string): void`: Create new link
- `deleteLink(id: string): void`: Remove link
- `openLink(url: string): void`: Open URL in new tab
- `validateUrl(url: string): boolean`: Check if URL is valid
- `saveToLocalStorage(): void`: Persist links to Local Storage
- `loadFromLocalStorage(): Link[]`: Retrieve links from Local Storage

**Events**:
- `linkAdded`: Emitted when a new link is created
- `linkDeleted`: Emitted when a link is removed

**Implementation Notes**:
- Validates URL format before creating link
- Falls back to URL as button text if name is empty
- Uses `window.open(url, '_blank')` for opening links

---

## Data Models

### Task Data Model

```typescript
interface Task {
  id: string;              // Unique identifier (UUID v4)
  title: string;           // Task description (required, non-empty)
  completed: boolean;      // Completion status
  createdAt: number;       // Timestamp (milliseconds since epoch)
  notes?: string;          // Optional additional notes
}
```

**Validation Rules**:
- `id`: Must be a valid UUID v4 string
- `title`: Must be non-empty string (after trimming whitespace)
- `completed`: Boolean value
- `createdAt`: Must be a valid timestamp (milliseconds since epoch)

**Storage Format**:
```json
{
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Complete project proposal",
      "completed": false,
      "createdAt": 1704067200000,
      "notes": "Submit by Friday"
    }
  ]
}
```

---

### Quick Links Data Model

```typescript
interface Link {
  id: string;      // Unique identifier (UUID v4)
  name: string;    // Display name (can be empty)
  url: string;     // Full URL (must be valid)
}
```

**Validation Rules**:
- `id`: Must be a valid UUID v4 string
- `name`: Optional string (if empty, URL is displayed as button text)
- `url`: Must be a valid URL format (starts with http:// or https://)

**Storage Format**:
```json
{
  "links": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "GitHub",
      "url": "https://github.com"
    }
  ]
}
```

---

### Application State Structure

```typescript
interface AppState {
  greeting: {
    currentTime: number;     // Timestamp of current time
    greetingText: string;    // "Good Morning" | "Good Afternoon" | "Good Evening" | "Good Night"
  };
  timer: {
    duration: number;        // 1500 (25 minutes in seconds)
    remaining: number;       // Current countdown value
    isRunning: boolean;      // Timer state
  };
  tasks: Task[];
  links: Link[];
}
```

## State Management

### State Initialization

```javascript
function initializeState() {
  // Load from Local Storage
  const storedData = loadFromLocalStorage();
  
  // Initialize with defaults if no stored data
  return {
    greeting: {
      currentTime: Date.now(),
      greetingText: getGreetingForHour(new Date().getHours())
    },
    timer: {
      duration: 1500,
      remaining: 1500,
      isRunning: false
    },
    tasks: storedData.tasks || [],
    links: storedData.links || []
  };
}
```

### State Update Pattern

All state updates follow this pattern:

1. **Update in-memory state**
2. **Save to Local Storage**
3. **Re-render affected components**

```javascript
function updateState(updater) {
  state = updater(state);
  saveToLocalStorage();
  render();
}
```

### Local Storage Operations

```javascript
const STORAGE_KEY = 'dashboard-mvp-data';

function saveToLocalStorage() {
  try {
    const data = {
      tasks: state.tasks,
      links: state.links
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to Local Storage:', error);
    showStorageWarning();
  }
}

function loadFromLocalStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { tasks: [], links: [] };
  } catch (error) {
    console.error('Failed to load from Local Storage:', error);
    showStorageWarning();
    return { tasks: [], links: [] };
  }
}
```

### Error Handling

```javascript
function showStorageWarning() {
  // Display warning message to user
  // Application continues to function for current session
  console.warn('Local Storage is unavailable. Data will not persist.');
}
```

## UI Layout

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Container                      │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Header Section                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Greeting Component                             │  │  │
│  │  │  - Time: 10:30                                  │  │  │
│  │  │  - Date: Monday, January 1, 2024               │  │  │
│  │  │  - Greeting: Good Morning                       │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Main Content Area                    │  │
│  │  ┌──────────────┐ ┌────────────────────────────────┐  │  │
│  │  │              │ │  Focus Timer                   │  │  │
│  │  │  To-Do List  │ │  ┌──────────────────────────┐  │  │  │
│  │  │              │ │  │  25:00                   │  │  │  │
│  │  │  + [Task]    │ │  │  [Start] [Stop] [Reset]  │  │  │  │
│  │  │              │ │  └──────────────────────────┘  │  │  │
│  │  │  [Task 1] ✓  │ │                                │  │  │
│  │  │  [Task 2] ✗  │ │  ┌──────────────────────────┐  │  │  │
│  │  │  [Task 3] ✗  │ │  │  Quick Links             │  │  │  │
│  │  │              │ │  └──────────────────────────┘  │  │  │
│  │  │  [Add Task]  │ │  ┌──────┐ ┌──────┐           │  │  │
│  │  │              │ │  │GitHub│ │SO   │           │  │  │
│  │  └──────────────┘ └──┴──────┘ └──────┘           │  │  │
│  │                              [Add Link]            │  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Layout

- **Desktop (> 768px)**: Two-column layout (Timer + Links on right)
- **Tablet (320px - 768px)**: Single column layout
- **Mobile (320px - 480px)**: Stacked layout with compact components

### CSS Organization

```css
/* Single CSS file structure */
:root {
  /* Color scheme */
  --primary-color: #3498db;
  --secondary-color: #2c3e50;
  --success-color: #27ae60;
  --danger-color: #e74c3c;
  --background-color: #f5f7fa;
  --card-background: #ffffff;
  --text-color: #333333;
  --text-secondary: #666666;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-base: 16px;
  --font-size-large: 24px;
  --font-size-small: 14px;
  
  /* Spacing */
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  
  /* Border radius */
  --border-radius: 8px;
}

/* Component styles */
.greeting { /* ... */ }
.timer { /* ... */ }
.todo-list { /* ... */ }
.quick-links { /* ... */ }

/* Responsive breakpoints */
@media (max-width: 768px) { /* ... */ }
@media (max-width: 480px) { /* ... */ }
```

## Interaction Flow

### Greeting Component Flow

```
User Opens Dashboard
    ↓
Initialize Time Display
    ↓
Set Up Minute Timer (setInterval)
    ↓
On Timer Tick:
    - Update current time
    - Check if hour changed
    - Update greeting if needed
    - Re-render time and greeting
```

### Focus Timer Flow

```
User Clicks Start
    ↓
Check if already running
    ↓
Start Countdown Interval (1 second)
    ↓
On Each Tick:
    - Decrement remaining time
    - Update display
    - Check if complete
    ↓
On Complete:
    - Stop timer
    - Play audio cue (optional)
    - Show completion message
```

### To-Do List Flow

```
User Enters Task Title
    ↓
Clicks Add Button
    ↓
Validate Title (non-empty)
    ↓
Create New Task Object
    - Generate UUID
    - Set completed = false
    - Set createdAt = Date.now()
    ↓
Add to Tasks Array
    ↓
Save to Local Storage
    ↓
Re-render Task List
```

### Quick Links Flow

```
User Enters Link Name and URL
    ↓
Clicks Add Button
    ↓
Validate URL Format
    ↓
If Invalid:
    - Show error message
    - Do not create link
If Valid:
    ↓
Create New Link Object
    - Generate UUID
    - Use name or URL as display text
    ↓
Add to Links Array
    ↓
Save to Local Storage
    ↓
Re-render Links List
```

## Error Handling

### Local Storage Errors

```javascript
function saveToLocalStorage() {
  try {
    const data = {
      tasks: state.tasks,
      links: state.links
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to Local Storage:', error);
    showStorageWarning();
  }
}

function loadFromLocalStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { tasks: [], links: [] };
  } catch (error) {
    console.error('Failed to load from Local Storage:', error);
    showStorageWarning();
    return { tasks: [], links: [] };
  }
}

function showStorageWarning() {
  // Display non-intrusive warning message
  // Application continues to function for current session
  console.warn('Local Storage is unavailable. Data will not persist.');
}
```

### Input Validation Errors

```javascript
function validateTaskTitle(title) {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Task title cannot be empty' };
  }
  if (trimmed.length > 200) {
    return { valid: false, error: 'Task title is too long (max 200 characters)' };
  }
  return { valid: true };
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### Browser Compatibility Errors

```javascript
function checkLocalStorageAvailability() {
  try {
    const testKey = '__test_localstorage__';
    localStorage.setItem(testKey, 'value');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

function showBrowserWarning() {
  if (!checkLocalStorageAvailability()) {
    console.warn('Local Storage is not available in this browser.');
    // Display warning message to user
  }
}
```

## Browser Compatibility Considerations

### Supported Browsers

- **Chrome**: Full support (latest 2 versions)
- **Firefox**: Full support (latest 2 versions)
- **Edge**: Full support (latest 2 versions)
- **Safari**: Full support (latest 2 versions)

### Feature Detection

```javascript
// Check Local Storage availability
function checkLocalStorageAvailability() {
  try {
    const testKey = '__test_localstorage__';
    localStorage.setItem(testKey, 'value');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

// Check URL constructor support
function supportsUrlConstructor() {
  return typeof URL !== 'undefined';
}

// Check UUID generation support
function supportsCrypto() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
}
```

### Fallback Strategies

1. **Local Storage Unavailable**:
   - Display warning message
   - Continue functioning for current session
   - Data will not persist across sessions

2. **URL Constructor Not Supported**:
   - Use regex-based URL validation
   - Display warning for older browsers

3. **UUID Generation Not Supported**:
   - Use timestamp + random number fallback
   - Display warning for older browsers

### CSS Compatibility

```css
/* Use standard CSS properties */
/* Avoid experimental features */
/* Test on all supported browsers */

/* Flexbox for layout */
display: flex;
flex-direction: column;

/* CSS Variables for theming */
:root {
  --primary-color: #3498db;
}
```

### JavaScript Compatibility

```javascript
// Use ES6+ features with polyfills if needed
// Test on all supported browsers

// Arrow functions
const greet = (name) => `Hello, ${name}!`;

// Template literals
const message = `Current time: ${formatTime(date)}`;

// Destructuring
const { tasks, links } = state;

// Optional chaining
const greeting = state?.greeting?.text;
```

## Testing Strategy

### Unit Tests

1. **Greeting Component**:
   - Time formatting (HH:MM)
   - Date formatting
   - Greeting selection by hour
   - Hour boundary detection

2. **Timer Component**:
   - Start/stop/reset functionality
   - Time formatting (MM:SS)
   - Countdown behavior
   - Completion detection

3. **To-Do List Component**:
   - Task creation with validation
   - Task editing
   - Task completion toggle
   - Task deletion
   - Local Storage persistence

4. **Quick Links Component**:
   - Link creation with validation
   - Link deletion
   - URL validation
   - Local Storage persistence

### Property-Based Tests

1. **Task Persistence Round Trip**:
   - *For any* valid task, adding it to the list and retrieving from Local Storage should produce an equivalent task

2. **Link Persistence Round Trip**:
   - *For any* valid link, adding it to the list and retrieving from Local Storage should produce an equivalent link

3. **Timer Countdown Invariant**:
   - *For any* timer state, decrementing by 1 second should reduce remaining time by exactly 1

4. **Greeting Consistency**:
   - *For any* hour, the greeting should match the expected greeting for that time range

### Integration Tests

1. **End-to-End Workflow**:
   - User opens dashboard
   - User adds tasks and links
   - User refreshes page
   - User verifies data persists

2. **Browser Compatibility**:
   - Test on Chrome, Firefox, Edge, Safari
   - Verify Local Storage functionality
   - Verify UI rendering

### Manual Testing Checklist

- [ ] Greeting updates correctly at hour boundaries
- [ ] Timer starts, stops, resets, and completes
- [ ] Tasks can be added, edited, completed, and deleted
- [ ] Links can be added, validated, and opened
- [ ] Data persists across page refreshes
- [ ] Error handling works for Local Storage issues
- [ ] UI is responsive on different screen sizes
- [ ] Works in all supported browsers

## Implementation Notes

### File Structure

```
dashboard-mvp/
├── index.html          # Main HTML file
├── styles.css          # Single CSS file for all styling
├── app.js              # Single JavaScript file for all functionality
└── README.md           # Documentation
```

### Key Implementation Details

1. **Single File Architecture**:
   - All CSS in `styles.css`
   - All JavaScript in `app.js`
   - No external dependencies

2. **State Management**:
   - Centralized state object
   - Immutable state updates
   - Local Storage persistence

3. **Event Handling**:
   - Event delegation for dynamic content
   - Debounced updates for performance
   - Error handling for all user actions

4. **Performance Considerations**:
   - Minimal DOM manipulation
   - Efficient re-rendering
   - Proper cleanup of intervals

5. **Accessibility**:
   - Semantic HTML
   - Keyboard navigation
   - ARIA labels for interactive elements

## Conclusion

This design provides a comprehensive technical specification for the Personal Dashboard MVP. The application is designed to be simple, self-contained, and highly compatible while providing essential productivity tools in a single interface.

The modular component architecture, clear data models, and comprehensive error handling ensure the application will be maintainable and robust. The single-file structure makes it easy to deploy and use as either a standalone web app or browser extension.