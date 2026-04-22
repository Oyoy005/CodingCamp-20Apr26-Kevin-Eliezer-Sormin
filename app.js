/**
 * Personal Dashboard MVP
 * A self-contained web application with productivity tools
 */

// Storage key for Local Storage
const STORAGE_KEY = 'dashboard-mvp-data';

/**
 * Save data to Local Storage
 * @param {Object} data - Data to save
 */
function saveToLocalStorage(data) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save to Local Storage:', error);
    showStorageWarning();
  }
}

/**
 * Load data from Local Storage
 * @returns {Object} Loaded data or default empty structure
 */
function loadFromLocalStorage() {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
    return { tasks: [], links: [] };
  } catch (error) {
    console.error('Failed to load from Local Storage:', error);
    showStorageWarning();
    return { tasks: [], links: [] };
  }
}

/**
 * Check if Local Storage is available
 * @returns {boolean} True if Local Storage is available
 */
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

/**
 * Show storage warning to user
 */
function showStorageWarning() {
  console.warn('Local Storage is unavailable. Data will not persist.');
  // In a full implementation, this would display a user-facing warning
}

/**
 * Greeting Component
 * Displays current time, date, and time-appropriate greeting
 */
const Greeting = {
  state: {
    currentTime: new Date(),
    greetingText: ''
  },

  /**
   * Get greeting based on hour of day
   * @param {number} hour - Hour (0-23)
   * @returns {string} Greeting text
   */
  getGreetingForHour(hour) {
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    if (hour >= 18 && hour < 22) return 'Good Evening';
    return 'Good Night';
  },

  /**
   * Format time as HH:MM
   * @param {Date} date - Date object
   * @returns {string} Formatted time
   */
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  /**
   * Format date as "Monday, January 1, 2024"
   * @param {Date} date - Date object
   * @returns {string} Formatted date
   */
  formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  },

  /**
   * Update current time and greeting
   */
  updateTime() {
    const now = new Date();
    const hour = now.getHours();
    const newGreeting = this.getGreetingForHour(hour);

    this.state.currentTime = now;
    this.state.greetingText = newGreeting;

    // Emit timeUpdated event if greeting changed
    if (this.state.lastGreeting !== newGreeting) {
      this.state.lastGreeting = newGreeting;
      this.emit('timeUpdated', { time: this.formatTime(now), date: this.formatDate(now), greeting: newGreeting });
    }
  },

  /**
   * Render greeting to DOM
   */
  render() {
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    const greetingElement = document.querySelector('.greeting-title');

    if (timeElement) {
      timeElement.textContent = this.formatTime(this.state.currentTime);
      timeElement.setAttribute('datetime', this.formatTime(this.state.currentTime));
    }

    if (dateElement) {
      dateElement.textContent = this.formatDate(this.state.currentTime);
    }

    if (greetingElement) {
      greetingElement.textContent = this.state.greetingText;
    }
  },

  /**
   * Initialize greeting component
   */
  init() {
    this.state.lastGreeting = '';
    this.updateTime();
    this.render();

    // Update every minute
    setInterval(() => this.updateTime(), 60000);
  },

  /**
   * Event system for greeting component
   */
  events: {},
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
};

/**
 * Focus Timer Component
 * 25-minute countdown timer for productivity sessions
 */
const Timer = {
  state: {
    duration: 1500, // 25 minutes in seconds
    remaining: 1500,
    isRunning: false,
    intervalId: null
  },

  /**
   * Format seconds as MM:SS
   * @param {number} seconds - Number of seconds
   * @returns {string} Formatted time
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  },

  /**
   * Check if timer is complete
   * @returns {boolean} True if timer reached 0
   */
  isComplete() {
    return this.state.remaining === 0;
  },

  /**
   * Start the timer
   */
  start() {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.state.intervalId = setInterval(() => this.tick(), 1000);
    this.emit('timerStart');
  },

  /**
   * Stop the timer
   */
  stop() {
    if (!this.state.isRunning) return;

    this.state.isRunning = false;
    clearInterval(this.state.intervalId);
    this.state.intervalId = null;
    this.emit('timerStop');
  },

  /**
   * Reset the timer to full duration
   */
  reset() {
    this.stop();
    this.state.remaining = this.state.duration;
    this.render();
    this.emit('timerReset');
  },

  /**
   * Decrement remaining time by 1 second
   */
  tick() {
    if (this.state.remaining > 0) {
      this.state.remaining--;
      this.render();

      if (this.isComplete()) {
        this.stop();
        this.emit('timerComplete');
      } else {
        this.emit('timerTick', { remaining: this.state.remaining });
      }
    }
  },

  /**
   * Render timer to DOM
   */
  render() {
    const displayElement = document.getElementById('timer-display');

    if (displayElement) {
      displayElement.textContent = this.formatTime(this.state.remaining);
    }
  },

  /**
   * Initialize timer component
   */
  init() {
    this.render();

    // Set up event listeners
    const startBtn = document.getElementById('timer-start');
    const stopBtn = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (startBtn) {
      startBtn.addEventListener('click', () => this.start());
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stop());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
  },

  /**
   * Event system for timer component
   */
  events: {},
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
};

/**
 * To-Do List Component
 * Task management system for creating, editing, and tracking tasks
 */
const TodoList = {
  state: {
    tasks: [],
    editingTaskId: null
  },

  /**
   * Generate a UUID v4
   * @returns {string} UUID string
   */
  generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Validate task title
   * @param {string} title - Task title
   * @returns {Object} Validation result
   */
  validateTitle(title) {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Task title cannot be empty' };
    }
    if (trimmed.length > 200) {
      return { valid: false, error: 'Task title is too long (max 200 characters)' };
    }
    return { valid: true };
  },

  /**
   * Add a new task
   * @param {string} title - Task title
   */
  addTask(title) {
    const validation = this.validateTitle(title);
    if (!validation.valid) {
      this.emit('validationError', validation.error);
      return;
    }

    const task = {
      id: this.generateId(),
      title: title.trim(),
      completed: false,
      createdAt: Date.now()
    };

    this.state.tasks.push(task);
    this.save();
    this.render();
    this.emit('taskAdded', task);
  },

  /**
   * Edit an existing task
   * @param {string} id - Task ID
   * @param {string} title - New task title
   */
  editTask(id, title) {
    const task = this.state.tasks.find(t => t.id === id);
    if (!task) return;

    const validation = this.validateTitle(title);
    if (!validation.valid) {
      this.emit('validationError', validation.error);
      return;
    }

    task.title = title.trim();
    this.save();
    this.render();
    this.emit('taskUpdated', task);
  },

  /**
   * Toggle task completion status
   * @param {string} id - Task ID
   */
  toggleComplete(id) {
    const task = this.state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    this.save();
    this.render();
    this.emit('taskToggled', task);
  },

  /**
   * Delete a task
   * @param {string} id - Task ID
   */
  deleteTask(id) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    this.save();
    this.render();
    this.emit('taskDeleted', id);
  },

  /**
   * Save tasks to Local Storage
   */
  save() {
    saveToLocalStorage({ tasks: this.state.tasks });
  },

  /**
   * Load tasks from Local Storage
   */
  load() {
    const data = loadFromLocalStorage();
    this.state.tasks = data.tasks || [];
  },

  /**
   * Render task list to DOM
   */
  render() {
    const listElement = document.getElementById('task-list');
    if (!listElement) return;

    listElement.innerHTML = '';

    this.state.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.setAttribute('data-task-id', task.id);

      if (this.state.editingTaskId === task.id) {
        // Editing mode
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-edit-input';
        input.value = task.title;
        input.setAttribute('aria-label', 'Edit task title');

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-success btn-sm';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
          this.editTask(task.id, input.value);
          this.state.editingTaskId = null;
          this.render();
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary btn-sm';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
          this.state.editingTaskId = null;
          this.render();
        });

        li.appendChild(input);
        li.appendChild(saveBtn);
        li.appendChild(cancelBtn);
      } else {
        // Display mode
        const titleSpan = document.createElement('span');
        titleSpan.className = 'task-title';
        titleSpan.textContent = task.title;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary btn-sm';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
          this.state.editingTaskId = task.id;
          this.render();
        });

        const completeBtn = document.createElement('button');
        completeBtn.className = `btn ${task.completed ? 'btn-secondary' : 'btn-success'} btn-sm`;
        completeBtn.textContent = task.completed ? 'Undo' : 'Done';
        completeBtn.addEventListener('click', () => this.toggleComplete(task.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(completeBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(titleSpan);
        li.appendChild(actionsDiv);
      }

      listElement.appendChild(li);
    });
  },

  /**
   * Initialize to-do list component
   */
  init() {
    this.load();
    this.render();

    // Set up event listeners
    const addBtn = document.getElementById('task-add');
    const input = document.getElementById('task-input');

    if (addBtn && input) {
      addBtn.addEventListener('click', () => {
        this.addTask(input.value);
        input.value = '';
        input.focus();
      });

      // Allow Enter key to add task
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addTask(input.value);
          input.value = '';
        }
      });
    }
  },

  /**
   * Event system for to-do list component
   */
  events: {},
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
};

/**
 * Quick Links Component
 * Bookmark buttons for frequently visited websites
 */
const QuickLinks = {
  state: {
    links: [],
    newLinkName: '',
    newLinkUrl: '',
    validationError: null
  },

  /**
   * Generate a UUID v4
   * @returns {string} UUID string
   */
  generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is valid
   */
  validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Add a new link
   * @param {string} name - Link name
   * @param {string} url - Link URL
   */
  addLink(name, url) {
    const trimmedUrl = url.trim();

    if (!this.validateUrl(trimmedUrl)) {
      this.state.validationError = 'Please enter a valid URL (must start with http:// or https://)';
      this.render();
      return;
    }

    this.state.validationError = null;

    const link = {
      id: this.generateId(),
      name: name.trim(),
      url: trimmedUrl
    };

    this.state.links.push(link);
    this.save();
    this.render();
    this.emit('linkAdded', link);
  },

  /**
   * Delete a link
   * @param {string} id - Link ID
   */
  deleteLink(id) {
    this.state.links = this.state.links.filter(l => l.id !== id);
    this.save();
    this.render();
    this.emit('linkDeleted', id);
  },

  /**
   * Open a link in new tab
   * @param {string} url - URL to open
   */
  openLink(url) {
    window.open(url, '_blank');
  },

  /**
   * Save links to Local Storage
   */
  save() {
    saveToLocalStorage({ links: this.state.links });
  },

  /**
   * Load links from Local Storage
   */
  load() {
    const data = loadFromLocalStorage();
    this.state.links = data.links || [];
  },

  /**
   * Render links to DOM
   */
  render() {
    const listElement = document.getElementById('link-list');
    const errorElement = document.getElementById('link-error');

    if (errorElement) {
      if (this.state.validationError) {
        errorElement.textContent = this.state.validationError;
        errorElement.style.display = 'block';
      } else {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
    }

    if (!listElement) return;

    listElement.innerHTML = '';

    this.state.links.forEach(link => {
      const linkElement = document.createElement('a');
      linkElement.className = 'link-item';
      linkElement.href = link.url;
      linkElement.target = '_blank';
      linkElement.rel = 'noopener noreferrer';
      linkElement.setAttribute('role', 'listitem');
      linkElement.setAttribute('aria-label', link.name || link.url);

      const nameSpan = document.createElement('span');
      nameSpan.textContent = link.name || link.url;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'link-delete';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.setAttribute('aria-label', `Delete ${link.name || link.url}`);
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.deleteLink(link.id);
      });

      linkElement.appendChild(nameSpan);
      linkElement.appendChild(deleteBtn);
      listElement.appendChild(linkElement);
    });
  },

  /**
   * Initialize quick links component
   */
  init() {
    this.load();
    this.render();

    // Set up event listeners
    const addBtn = document.getElementById('link-add');
    const nameInput = document.getElementById('link-name');
    const urlInput = document.getElementById('link-url');

    if (addBtn && nameInput && urlInput) {
      addBtn.addEventListener('click', () => {
        this.addLink(nameInput.value, urlInput.value);
        nameInput.value = '';
        urlInput.value = '';
        nameInput.focus();
      });

      // Allow Enter key to add link (only if URL is focused)
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addLink(nameInput.value, urlInput.value);
          nameInput.value = '';
          urlInput.value = '';
          nameInput.focus();
        }
      });
    }
  },

  /**
   * Event system for quick links component
   */
  events: {},
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
};

/**
 * Main Application
 * Initializes all components and manages global state
 */
const App = {
  /**
   * Initialize the application
   */
  init() {
    console.log('Initializing Personal Dashboard MVP...');

    // Check Local Storage availability
    if (!checkLocalStorageAvailability()) {
      console.warn('Local Storage is not available. Data will not persist.');
    }

    // Initialize all components
    Greeting.init();
    Timer.init();
    TodoList.init();
    QuickLinks.init();

    console.log('Dashboard initialized successfully');
  }
};

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}