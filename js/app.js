/**
 * Main Application Module
 * Handles navigation, tab switching, and app initialization
 */

import { initCalendar } from './calendar.js';
import { initDragDrop } from './dragdrop.js';
import { initModal } from './modal.js';
import { initAuth, checkAuth } from './auth.js';
import { api } from './api.js';
import { initMobile } from './mobile.js';
import { initNotebook, flipToPage } from './notebook.js';

// Global state
export let tasks = [];
let currentUser = null;

/**
 * Initialize the application
 */
async function initApp() {
  // Initialize mobile features first (if on mobile)
  await initMobile();
  
  // Initialize notebook 3D interface (non-blocking)
  initNotebook().catch(err => {
    console.warn('Notebook 3D failed to initialize, using CSS fallback');
  });
  
  initNavigation();
  initGreeting();
  initCurrentDate();
  initAuth(); // Initialize auth listeners

  // Check authentication - this will show modal if not authenticated
  const isAuthenticated = await checkAuth();
  
  if (isAuthenticated) {
    // Only fetch data if authenticated
    await fetchUserData();
    await fetchTasks();

    // Initialize UI components requiring data
    initCalendar();
    initDragDrop();
    initModal();
    initFilterChips();
    initToggles();
  } else {
    // Hide main content if not authenticated
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.display = 'none';
    }
  }
}

/**
 * Fetch current user data
 */
async function fetchUserData() {
  try {
    const user = await api.auth.getMe();
    currentUser = user;
    // Potentially update UI with user name/avatar here
    initGreeting();
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
}

/**
 * Fetch tasks from API
 */
async function fetchTasks() {
  try {
    const response = await api.tasks.getAll();
    tasks = response.tasks.map(mapApiTaskToAppTask);

    renderHomeStats();
    renderUpcomingTasks();
    renderTaskLists();
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
  }
}

/**
 * Map API task object to internal app task format
 */
function mapApiTaskToAppTask(apiTask) {
  // Parse scheduled_start_time to get both date and time
  let scheduledDate = null;
  let scheduledTime = null;
  
  if (apiTask.scheduled_start_time) {
    const scheduledDateTime = new Date(apiTask.scheduled_start_time);
    scheduledDate = scheduledDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
    scheduledTime = scheduledDateTime.toTimeString().substring(0, 5); // HH:MM
  }
  
  return {
    id: apiTask.id,
    title: apiTask.task_name,
    description: apiTask.description || '',
    estimatedDuration: apiTask.estimated_duration || 30,
    category: apiTask.category,
    priority: apiTask.priority,
    dueDate: apiTask.due_date,
    isScheduled: apiTask.is_scheduled,
    scheduledDate: scheduledDate, // Date when task is scheduled
    scheduledTime: scheduledTime, // Time (HH:MM) when task is scheduled
    completed: apiTask.is_completed
  };
}

/**
 * Initialize tab navigation for both sidebar and bottom nav
 */
function initNavigation() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const bottomNavLinks = document.querySelectorAll('.bottom-nav-link');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(tabId) {
    if (!tabId) return;

    // Flip notebook page
    flipToPage(tabId);

    // Update sidebar links
    sidebarLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabId);
    });

    // Update bottom nav links
    bottomNavLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabId);
    });

    // Update tab content
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    // Update URL hash
    window.location.hash = tabId;
  }

  // Add click handlers to sidebar links
  sidebarLinks.forEach(link => {
    if (!link.id) { // Skip logout button which has an ID
      link.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(link.dataset.tab);
      });
    }
  });

  // Add click handlers to bottom nav links
  bottomNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });

  // Handle initial hash on page load
  const initialTab = window.location.hash.slice(1) || 'home';
  if (initialTab !== 'home' && initialTab !== 'tasks' && initialTab !== 'calendar' && initialTab !== 'settings') {
    switchTab('home');
  } else {
    switchTab(initialTab);
  }

  // Handle browser back/forward
  window.addEventListener('hashchange', () => {
    const tab = window.location.hash.slice(1) || 'home';
    switchTab(tab);
  });
}

/**
 * Set personalized greeting based on time of day
 */
function initGreeting() {
  const greetingEl = document.getElementById('greeting');
  const hour = new Date().getHours();

  let greeting;
  if (hour < 12) {
    greeting = 'Good Morning';
  } else if (hour < 17) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }

  if (currentUser && currentUser.name) {
    greeting += `, ${currentUser.name.split(' ')[0]}`;
  }

  greetingEl.textContent = greeting;
}

/**
 * Set current date display
 */
function initCurrentDate() {
  const dateEl = document.getElementById('current-date');
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateEl.textContent = new Date().toLocaleDateString('en-US', options);
}

/**
 * Render home page statistics
 */
function renderHomeStats() {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === today);
  const completedTasks = todayTasks.filter(t => t.completed);

  document.getElementById('total-tasks').textContent = todayTasks.length;
  document.getElementById('completed-tasks').textContent = completedTasks.length;
  document.getElementById('pending-tasks').textContent = todayTasks.length - completedTasks.length;

  // Week stats
  const weekTasks = tasks.filter(t => !t.completed); // Simplified logic
  document.getElementById('week-total').textContent = weekTasks.length;
}

/**
 * Render upcoming tasks on home page
 */
function renderUpcomingTasks() {
  const container = document.getElementById('upcoming-tasks');
  const upcomingTasks = tasks
    .filter(t => !t.completed)
    .slice(0, 4);

  container.innerHTML = upcomingTasks.map(task => createTaskCardHTML(task)).join('');
}

/**
 * Render task lists on the Tasks tab
 */
export function renderTaskLists() {
  const today = new Date().toISOString().split('T')[0];

  // Today's tasks
  const todayTasks = tasks.filter(t => t.dueDate === today && !t.completed);
  document.getElementById('today-task-list').innerHTML =
    todayTasks.length ? todayTasks.map(t => createTaskCardHTML(t)).join('') : '<p class="text-muted">No tasks for today</p>';

  // Upcoming tasks
  const upcomingTasks = tasks.filter(t => t.dueDate > today && !t.completed);
  document.getElementById('upcoming-task-list').innerHTML =
    upcomingTasks.length ? upcomingTasks.map(t => createTaskCardHTML(t)).join('') : '<p class="text-muted">No upcoming tasks</p>';

  // Completed tasks
  const completedTasks = tasks.filter(t => t.completed);
  document.getElementById('completed-task-list').innerHTML =
    completedTasks.length ? completedTasks.map(t => createTaskCardHTML(t, true)).join('') : '<p class="text-muted">No completed tasks</p>';
}

/**
 * Create HTML for a task card
 */
export function createTaskCardHTML(task, isCompleted = false) {
  const categoryClass = `category-${task.category}`;
  const priorityClass = `priority-${task.priority}`; // Mapping to existing CSS classes

  return `
    <div class="task-card ${isCompleted ? 'completed' : ''}" 
         data-task-id="${task.id}" 
         draggable="${!isCompleted}"
         ${!task.isScheduled && !isCompleted ? 'data-draggable="true"' : ''}>
      <div class="task-card-drag-handle">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </div>
      <div class="task-card-content">
        <div class="task-card-title">${task.title}</div>
        <div class="task-card-meta">
          <span class="priority-indicator ${priorityClass}"></span>
          <span class="task-duration">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            ${formatDuration(task.estimatedDuration)}
          </span>
          <span class="category-tag ${categoryClass}">${capitalize(task.category)}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Initialize filter chips on Tasks tab
 */
function initFilterChips() {
  const chips = document.querySelectorAll('.chip');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Update active state
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      // Apply filter
      const filter = chip.dataset.filter;
      filterTasks(filter);
    });
  });
}

/**
 * Filter tasks based on category/priority
 */
function filterTasks(filter) {
  const taskCards = document.querySelectorAll('#tab-tasks .task-card');

  taskCards.forEach(card => {
    const taskId = card.dataset.taskId;
    const task = tasks.find(t => t.id === taskId);

    if (!task) return;

    let show = false;
    switch (filter) {
      case 'all':
        show = true;
        break;
      case 'work':
      case 'personal':
      case 'health':
        show = task.category === filter;
        break;
      case 'high':
        show = task.priority === 'high';
        break;
    }

    card.style.display = show ? 'flex' : 'none';
  });
}

/**
 * Initialize toggle switches
 */
function initToggles() {
  const toggles = document.querySelectorAll('.toggle');

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
    });
  });
}

/**
 * Add a new task to the backend and state
 */
export async function addTask(taskData) {
  try {
    const apiTask = await api.tasks.create({
      task_name: taskData.title,
      description: taskData.description,
      manual_duration: Number(taskData.estimatedDuration), // Ensure number
      category: taskData.category,
      priority: taskData.priority,
      due_date: taskData.dueDate
    });

    const newTask = mapApiTaskToAppTask(apiTask);
    tasks.push(newTask);

    // Re-render lists
    renderHomeStats();
    renderUpcomingTasks();
    renderTaskLists();

    // Re-initialize calendar's unscheduled tasks
    import('./calendar.js').then(module => {
      module.renderUnscheduledTasks();
    });

    return newTask;
  } catch (error) {
    console.error('Failed to create task:', error);
    alert('Failed to create task: ' + (error.message || 'Unknown error'));
  }
}

/**
 * Update a task's scheduled status
 */
export async function scheduleTask(taskId, time) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    try {
      // time can be short "HH:MM" or full ISO string
      let scheduledTime = time;

      // If it's short, assume today (fallback)
      if (time.length === 5) { // HH:MM
        const today = new Date().toISOString().split('T')[0];
        scheduledTime = `${today}T${time}:00`;
      }

      // Send to API
      const result = await api.tasks.schedule(taskId, scheduledTime);

      // Update local state with result from API
      // The API returns the task object with the correct scheduled_start_time
      const updatedTask = mapApiTaskToAppTask(result);

      // Update in place
      Object.assign(task, updatedTask);

      renderTaskLists();
    } catch (error) {
      console.error('Failed to schedule task:', error);
    }
  }
}

/**
 * Get task by ID
 */
export function getTaskById(id) {
  return tasks.find(t => t.id === id);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
