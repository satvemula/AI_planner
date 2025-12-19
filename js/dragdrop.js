/**
 * Drag and Drop Module
 * Handles drag-and-drop functionality for scheduling tasks on the calendar
 */

import { tasks, scheduleTask, getTaskById, formatDuration } from './app.js';
import { renderScheduledTasks, renderUnscheduledTasks, formatTime, parseTime, currentDate } from './calendar.js';

let draggedTask = null;
let dragPreview = null;

/**
 * Initialize drag and drop functionality
 */
export function initDragDrop() {
    initDraggableTasks();
    initDropZones();
}

/**
 * Initialize draggable task cards
 */
function initDraggableTasks() {
    // Use event delegation for dynamic task cards
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);

    // Also support touch devices with long-press
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
}

/**
 * Handle drag start event
 */
function handleDragStart(e) {
    const taskCard = e.target.closest('.task-card[data-draggable="true"]');
    if (!taskCard) return;

    const taskId = taskCard.dataset.taskId;
    draggedTask = getTaskById(taskId);

    if (!draggedTask) return;

    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);

    // Add dragging class
    taskCard.classList.add('dragging');

    // Create custom drag image showing duration
    const dragImage = createDragPreview(draggedTask);
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 10, 10);

    // Remove after a short delay (drag image is copied)
    setTimeout(() => dragImage.remove(), 0);
}

/**
 * Handle drag end event
 */
function handleDragEnd(e) {
    const taskCard = document.querySelector('.task-card.dragging');
    if (taskCard) {
        taskCard.classList.remove('dragging');
    }

    // Remove drop target highlights
    document.querySelectorAll('.time-slot.drop-target').forEach(slot => {
        slot.classList.remove('drop-target');
    });

    // Remove preview
    if (dragPreview) {
        dragPreview.remove();
        dragPreview = null;
    }

    draggedTask = null;
}

/**
 * Create a drag preview element showing task duration
 */
function createDragPreview(task) {
    const preview = document.createElement('div');
    preview.className = 'drag-preview';
    preview.style.cssText = `
    position: absolute;
    left: -9999px;
    background: var(--color-primary);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    white-space: nowrap;
    z-index: 9999;
  `;
    preview.innerHTML = `
    ${task.title}
    <span style="opacity: 0.8; margin-left: 8px;">${formatDuration(task.estimatedDuration)}</span>
  `;
    return preview;
}

/**
 * Initialize drop zones on calendar time slots
 */
function initDropZones() {
    const calendarGrid = document.getElementById('calendar-grid');

    calendarGrid.addEventListener('dragover', handleDragOver);
    calendarGrid.addEventListener('dragleave', handleDragLeave);
    calendarGrid.addEventListener('drop', handleDrop);
}

/**
 * Handle drag over calendar slots
 */
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const timeSlot = e.target.closest('.time-slot');
    const timeContent = e.target.closest('.time-content');

    if (!timeSlot || !draggedTask) return;

    // Add visual feedback
    document.querySelectorAll('.time-slot.drop-target').forEach(slot => {
        slot.classList.remove('drop-target');
    });
    timeSlot.classList.add('drop-target');

    // Show preview block
    showDropPreview(timeContent, e, draggedTask);
}

/**
 * Show a preview of where the task will be dropped
 */
function showDropPreview(timeContent, event, task) {
    if (!timeContent) return;

    // Remove existing preview
    if (dragPreview) {
        dragPreview.remove();
    }

    // Calculate position within the hour slot
    const rect = timeContent.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const quarterIndex = Math.floor(offsetY / (rect.height / 4));
    const snapMinute = quarterIndex * 15;

    // Create preview block
    dragPreview = document.createElement('div');
    dragPreview.className = 'drop-preview';

    const heightPx = (task.estimatedDuration / 60) * 60;
    const topOffset = (snapMinute / 60) * 60;

    dragPreview.style.cssText = `
    position: absolute;
    top: ${topOffset}px;
    left: 4px;
    right: 4px;
    height: ${Math.max(heightPx, 24)}px;
    background: var(--color-primary);
    opacity: 0.6;
    border-radius: 4px;
    pointer-events: none;
    display: flex;
    align-items: center;
    padding: 0 8px;
    color: white;
    font-size: 12px;
    font-weight: 500;
  `;
    dragPreview.textContent = task.title;

    timeContent.appendChild(dragPreview);
}

/**
 * Handle drag leave
 */
function handleDragLeave(e) {
    const timeSlot = e.target.closest('.time-slot');
    const relatedTarget = e.relatedTarget;

    // Only remove highlight if leaving the time slot entirely
    if (timeSlot && !timeSlot.contains(relatedTarget)) {
        timeSlot.classList.remove('drop-target');

        if (dragPreview && dragPreview.parentElement === timeSlot.querySelector('.time-content')) {
            dragPreview.remove();
            dragPreview = null;
        }
    }
}

/**
 * Handle drop event
 */
function handleDrop(e) {
    e.preventDefault();

    const timeContent = e.target.closest('.time-content');
    if (!timeContent || !draggedTask) return;

    const hour = parseInt(timeContent.dataset.hour);

    // Calculate snap to 15-minute increment
    const rect = timeContent.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const quarterIndex = Math.floor(offsetY / (rect.height / 4));
    const snapMinute = Math.min(quarterIndex * 15, 45); // Clamp to valid values

    const timeStr = formatTime(hour, snapMinute);

    // Construct full ISO datetime using the Calendar's currentDate
    const dateStr = currentDate.toISOString().split('T')[0];
    const fullScheduledTime = `${dateStr}T${timeStr}:00`;

    // Update task
    // Pass full ISO string to scheduleTask
    scheduleTask(draggedTask.id, fullScheduledTime);

    // Re-render
    renderScheduledTasks();
    renderUnscheduledTasks();

    // Clean up
    if (dragPreview) {
        dragPreview.remove();
        dragPreview = null;
    }

    document.querySelectorAll('.time-slot.drop-target').forEach(slot => {
        slot.classList.remove('drop-target');
    });

    draggedTask = null;
}

// ===== Touch Support for Mobile =====

let touchStartX = 0;
let touchStartY = 0;
let touchTask = null;
let touchPreview = null;
let longPressTimer = null;
let isDragging = false;

/**
 * Handle touch start - initiate long press detection
 */
function handleTouchStart(e) {
    const taskCard = e.target.closest('.task-card[data-draggable="true"]');
    if (!taskCard) return;

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    const taskId = taskCard.dataset.taskId;
    touchTask = getTaskById(taskId);

    // Start long press timer (500ms)
    longPressTimer = setTimeout(() => {
        if (touchTask) {
            isDragging = true;
            taskCard.classList.add('dragging');

            // Create touch drag preview
            touchPreview = createDragPreview(touchTask);
            touchPreview.style.position = 'fixed';
            touchPreview.style.left = `${touch.clientX + 10}px`;
            touchPreview.style.top = `${touch.clientY + 10}px`;
            document.body.appendChild(touchPreview);

            // Vibrate if supported
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }, 500);
}

/**
 * Handle touch move - update preview position
 */
function handleTouchMove(e) {
    if (longPressTimer) {
        // Check if moved too much before long press completes
        const touch = e.touches[0];
        const moveThreshold = 10;

        if (Math.abs(touch.clientX - touchStartX) > moveThreshold ||
            Math.abs(touch.clientY - touchStartY) > moveThreshold) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }

    if (!isDragging || !touchPreview) return;

    e.preventDefault();

    const touch = e.touches[0];
    touchPreview.style.left = `${touch.clientX + 10}px`;
    touchPreview.style.top = `${touch.clientY + 10}px`;

    // Find drop target
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const timeSlot = elementBelow?.closest('.time-slot');

    document.querySelectorAll('.time-slot.drop-target').forEach(slot => {
        slot.classList.remove('drop-target');
    });

    if (timeSlot) {
        timeSlot.classList.add('drop-target');
    }
}

/**
 * Handle touch end - complete or cancel drag
 */
function handleTouchEnd(e) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }

    if (!isDragging) return;

    // Find drop target
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const timeContent = elementBelow?.closest('.time-content');

    if (timeContent && touchTask) {
        const hour = parseInt(timeContent.dataset.hour);
        const rect = timeContent.getBoundingClientRect();
        const offsetY = touch.clientY - rect.top;
        const quarterIndex = Math.floor(offsetY / (rect.height / 4));
        const snapMinute = Math.min(quarterIndex * 15, 45);

        const timeStr = formatTime(hour, snapMinute);
        const dateStr = currentDate.toISOString().split('T')[0];
        const fullScheduledTime = `${dateStr}T${timeStr}:00`;

        scheduleTask(touchTask.id, fullScheduledTime);
        renderScheduledTasks();
        renderUnscheduledTasks();
    }

    // Clean up
    document.querySelectorAll('.task-card.dragging').forEach(card => {
        card.classList.remove('dragging');
    });

    document.querySelectorAll('.time-slot.drop-target').forEach(slot => {
        slot.classList.remove('drop-target');
    });

    if (touchPreview) {
        touchPreview.remove();
        touchPreview = null;
    }

    touchTask = null;
    isDragging = false;
}
