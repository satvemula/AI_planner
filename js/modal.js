/**
 * Modal Module
 * Handles task creation modal with LLM duration estimation
 */

import { addTask } from './app.js';
import { api } from './api.js';

let isModalOpen = false;
let estimationTimeout = null;

/**
 * Initialize modal functionality
 */
export function initModal() {
    const fab = document.getElementById('fab-add');
    const modal = document.getElementById('task-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    const form = document.getElementById('task-form');
    const taskNameInput = document.getElementById('task-name');

    // Open modal on FAB click
    fab.addEventListener('click', openModal);

    // Close modal handlers
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isModalOpen) {
            closeModal();
        }
    });

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // LLM duration estimation on task name change
    taskNameInput.addEventListener('input', (e) => {
        // Debounce the estimation
        if (estimationTimeout) {
            clearTimeout(estimationTimeout);
        }

        estimationTimeout = setTimeout(() => {
            estimateDuration(e.target.value);
        }, 500);
    });

    // Set default date to today
    const dateInput = document.getElementById('task-date');
    dateInput.value = new Date().toISOString().split('T')[0];
}

/**
 * Open the task modal
 */
function openModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.add('active');
    isModalOpen = true;

    // Focus on task name input
    setTimeout(() => {
        document.getElementById('task-name').focus();
    }, 100);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

/**
 * Close the task modal
 */
function closeModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.remove('active');
    isModalOpen = false;

    // Reset form
    document.getElementById('task-form').reset();
    document.getElementById('ai-duration-text').textContent = 'AI: -- min';

    // Restore body scroll
    document.body.style.overflow = '';
}

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    // Get AI estimate or manual override
    const aiEstimate = parseInt(document.getElementById('ai-duration-text').textContent.match(/\d+/)?.[0] || '30');
    const manualDuration = parseInt(document.getElementById('manual-duration').value);

    const taskData = {
        title: document.getElementById('task-name').value.trim(),
        description: document.getElementById('task-description').value.trim(),
        estimatedDuration: manualDuration || aiEstimate,
        category: document.getElementById('task-category').value,
        priority: formData.get('priority') || 'medium',
        dueDate: document.getElementById('task-date').value || new Date().toISOString().split('T')[0]
    };

    if (!taskData.title) {
        document.getElementById('task-name').focus();
        return;
    }

    // Add the task
    addTask(taskData);

    // Close modal
    closeModal();

    // Show success feedback (could be a toast notification)
    showNotification('Task created successfully!');
}

/**
 * Estimate duration using LLM API
 */
async function estimateDuration(taskName) {
    const aiDurationText = document.getElementById('ai-duration-text');

    if (!taskName.trim()) {
        aiDurationText.textContent = 'AI: -- min';
        return;
    }

    // Show loading state
    aiDurationText.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="spin">
      <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
    </svg>
    Estimating...
  `;

    try {
        // Call the backend API
        const response = await api.tasks.estimateDuration(taskName);

        // Response format: { estimated_duration: number, explanation: string }
        const duration = response.estimated_duration;

        if (duration) {
            aiDurationText.textContent = `AI: ${duration} min`;

            // Optional: You could show the explanation in a tooltip or console
            console.log('AI Logic:', response.explanation);
        } else {
            // Fallback if API returns null/0
            aiDurationText.textContent = 'AI: -- min';
        }
    } catch (error) {
        console.error('AI Estimation failed:', error);
        aiDurationText.textContent = 'AI: Error';
    }
}

/**
 * Show a notification toast
 */
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--color-text);
    color: var(--color-surface);
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    box-shadow: var(--shadow-lg);
    z-index: 9999;
    animation: slideUp 0.3s ease, fadeOut 0.3s ease 2.5s forwards;
  `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS animation for notification
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(style);
