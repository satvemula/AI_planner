/**
 * Calendar Module
 * Handles calendar rendering, time slots, and scheduled tasks
 */

import { tasks, formatDuration, getTaskById, createTaskCardHTML } from './app.js';
import { api } from './api.js';

export let currentDate = new Date();
let currentView = 'day'; // 'day' or 'week'

/**
 * Initialize calendar functionality
 */
export function initCalendar() {
    renderCalendarHeader();
    renderTimeSlots();
    renderScheduledTasks();
    renderUnscheduledTasks();
    initCalendarControls();
    initSidebarToggle();
    initCalendarConnections();
}

/**
 * Render calendar header with current date/month
 */
function renderCalendarHeader() {
    const titleEl = document.getElementById('calendar-title');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    titleEl.textContent = currentDate.toLocaleDateString('en-US', options);
}

/**
 * Render time slots for the calendar grid
 */
function renderTimeSlots() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    // Generate time slots from 6 AM to 10 PM
    for (let hour = 6; hour <= 22; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.dataset.hour = hour;

        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = formatHour(hour);

        const timeContent = document.createElement('div');
        timeContent.className = 'time-content';
        timeContent.dataset.hour = hour;

        // Add 15-minute increment markers
        for (let quarter = 0; quarter < 4; quarter++) {
            const quarterSlot = document.createElement('div');
            quarterSlot.className = 'quarter-slot';
            quarterSlot.dataset.time = `${hour.toString().padStart(2, '0')}:${(quarter * 15).toString().padStart(2, '0')}`;
            quarterSlot.style.cssText = `
        position: absolute;
        top: ${quarter * 25}%;
        left: 0;
        right: 0;
        height: 25%;
      `;
            timeContent.appendChild(quarterSlot);
        }

        timeSlot.appendChild(timeLabel);
        timeSlot.appendChild(timeContent);
        grid.appendChild(timeSlot);
    }
}

/**
 * Format hour to 12-hour format
 */
function formatHour(hour) {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour} ${suffix}`;
}

/**
 * Render scheduled tasks on the calendar
 */
export function renderScheduledTasks() {
    // Current viewed date in YYYY-MM-DD
    const viewDate = currentDate.toISOString().split('T')[0];

    // Filter tasks that are scheduled AND their scheduled date matches the current view
    // Use scheduledDate if available, otherwise fall back to dueDate
    const scheduledTasks = tasks.filter(t => {
        if (!t.isScheduled || !t.scheduledTime) return false;

        // Use scheduledDate if available (from scheduled_start_time), otherwise use dueDate
        const taskDate = t.scheduledDate || t.dueDate;
        return taskDate === viewDate;
    });

    // Clear existing scheduled task blocks
    document.querySelectorAll('.scheduled-task').forEach(el => el.remove());

    scheduledTasks.forEach(task => {
        if (task.scheduledTime) {
            const [hour, minute] = task.scheduledTime.split(':').map(Number);
            const timeContent = document.querySelector(`.time-content[data-hour="${hour}"]`);

            if (timeContent) {
                const taskBlock = createScheduledTaskBlock(task, minute);
                timeContent.appendChild(taskBlock);
            }
        }
    });
}

/**
 * Create a scheduled task block element
 */
function createScheduledTaskBlock(task, startMinute = 0) {
    const block = document.createElement('div');
    block.className = 'scheduled-task';
    block.dataset.taskId = task.id;

    // Calculate height based on duration (60px per hour)
    const heightPx = (task.estimatedDuration / 60) * 60;
    const topOffset = (startMinute / 60) * 60;

    block.style.cssText = `
    top: ${topOffset}px;
    height: ${Math.max(heightPx, 24)}px;
    min-height: 24px;
    background-color: var(--color-category-${task.category});
    opacity: 0.9;
  `;

    block.innerHTML = `
    <div style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
      ${task.title}
    </div>
    ${heightPx > 30 ? `<div style="font-size: 11px; opacity: 0.85;">${formatDuration(task.estimatedDuration)}</div>` : ''}
  `;

    // Add click handler to view/edit task
    block.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent bubbling
        console.log('Task clicked:', task);
    });

    return block;
}

/**
 * Render unscheduled tasks in the sidebar
 */
export function renderUnscheduledTasks() {
    const container = document.getElementById('unscheduled-tasks');
    const countEl = document.getElementById('unscheduled-count');

    // Show tasks that are NOT scheduled and NOT completed
    const unscheduledTasks = tasks.filter(t => !t.isScheduled && !t.completed);

    if (countEl) countEl.textContent = `(${unscheduledTasks.length})`;

    if (unscheduledTasks.length === 0) {
        container.innerHTML = `
      <div class="empty-state" style="padding: var(--space-6);">
        <div class="empty-state-icon">✨</div>
        <div class="empty-state-title">All caught up!</div>
        <div class="empty-state-description">No unscheduled tasks. Create a new task to get started.</div>
      </div>
    `;
        return;
    }

    container.innerHTML = unscheduledTasks.map(task => createTaskCardHTML(task)).join('');
}

/**
 * Initialize calendar navigation controls
 */
function initCalendarControls() {
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    const todayBtn = document.getElementById('cal-today');
    const viewSelect = document.getElementById('cal-view');

    prevBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        renderCalendarHeader();
        renderScheduledTasks();
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        renderCalendarHeader();
        renderScheduledTasks();
    });

    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendarHeader();
        renderScheduledTasks();
    });

    viewSelect.addEventListener('change', (e) => {
        currentView = e.target.value;
        // Logic for week view could go here
    });
}

/**
 * Initialize mobile sidebar toggle
 */
function initSidebarToggle() {
    const sidebar = document.getElementById('task-sidebar');
    const toggle = document.getElementById('sidebar-toggle');

    if (!toggle) return;

    // Start collapsed on mobile
    if (window.innerWidth <= 1024) {
        sidebar.classList.add('collapsed');
    }

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Handle resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('collapsed');
        }
    });
}

/**
 * Parse time string to get hour and minute
 */
export function parseTime(timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute };
}

/**
 * Format time for display
 */
export function formatTime(hour, minute = 0) {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Initialize calendar connection buttons
 */
function initCalendarConnections() {
    const googleBtn = document.getElementById('connect-google-btn');
    const microsoftBtn = document.getElementById('connect-microsoft-btn');
    const connectionsEl = document.getElementById('calendar-connections');

    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            try {
                const response = await api.calendar.connectGoogle();
                if (response.message) {
                    alert(response.message + '\n' + (response.instruction || ''));
                }
            } catch (error) {
                console.error('Failed to connect Google Calendar:', error);
                alert('Google Calendar connection is not yet configured. Please set up OAuth credentials in the backend.');
            }
        });
    }

    if (microsoftBtn) {
        microsoftBtn.addEventListener('click', async () => {
            try {
                const response = await api.calendar.connectMicrosoft();
                if (response.message) {
                    alert(response.message + '\n' + (response.instruction || ''));
                }
            } catch (error) {
                console.error('Failed to connect Microsoft Calendar:', error);
                alert('Microsoft Calendar connection is not yet configured. Please set up OAuth credentials in the backend.');
            }
        });
    }

    // Load existing connections
    loadCalendarConnections();
}

/**
 * Load and display calendar connections
 */
async function loadCalendarConnections() {
    const connectionsEl = document.getElementById('calendar-connections');
    if (!connectionsEl) return;

    try {
        const connections = await api.calendar.getConnections();
        
        if (connections && connections.length > 0) {
            connectionsEl.innerHTML = `
                <div style="font-weight: var(--font-weight-medium); margin-bottom: var(--space-2);">Connected:</div>
                ${connections.map(conn => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-2); background: var(--color-background); border-radius: var(--radius-sm); margin-bottom: var(--space-1);">
                        <span>${conn.provider === 'google' ? '📅 Google' : '📅 Microsoft'}</span>
                        <span style="font-size: 10px; color: var(--color-text-muted);">${conn.last_synced_at ? 'Synced' : 'Not synced'}</span>
                    </div>
                `).join('')}
            `;
        } else {
            connectionsEl.innerHTML = '<div style="color: var(--color-text-muted);">No calendars connected</div>';
        }
    } catch (error) {
        console.error('Failed to load calendar connections:', error);
        connectionsEl.innerHTML = '<div style="color: var(--color-text-muted);">Unable to load connections</div>';
    }
}
