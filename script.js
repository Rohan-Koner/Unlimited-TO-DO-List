document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const dueDateInput = document.getElementById('dueDate');
    const prioritySelect = document.getElementById('prioritySelect');
    const categorySelect = document.getElementById('categorySelect');
    const themeToggle = document.getElementById('themeToggle');
    
    // Stats elements
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const pendingTasksEl = document.getElementById('pendingTasks');
    const overdueTasksEl = document.getElementById('overdueTasks');
    
    // Sidebar filter buttons
    const filterButtons = document.querySelectorAll('.sidebar-menu button');
    const categoryItems = document.querySelectorAll('.category-item');
    
    // Initialize tasks from localStorage or empty array
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentCategory = null;
    let searchQuery = '';
    
    // Initialize the app
    init();
    
    function init() {
        renderTasks();
        updateStats();
        setupEventListeners();
        checkThemePreference();
    }
    
    function setupEventListeners() {
        // Add task
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        // Search tasks
        searchInput.addEventListener('input', function(e) {
            searchQuery = e.target.value.toLowerCase();
            renderTasks();
        });
        
        // Sort tasks
        sortSelect.addEventListener('change', function() {
            renderTasks();
        });
        
        // Theme toggle
        themeToggle.addEventListener('change', toggleTheme);
        
        // Filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderTasks();
            });
        });
        
        // Category filters
        categoryItems.forEach(item => {
            item.addEventListener('click', function() {
                categoryItems.forEach(cat => cat.classList.remove('active'));
                if (currentCategory === this.dataset.category) {
                    currentCategory = null;
                } else {
                    this.classList.add('active');
                    currentCategory = this.dataset.category;
                }
                renderTasks();
            });
        });
    }
    
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText) {
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                priority: prioritySelect.value,
                category: categorySelect.value || null,
                dueDate: dueDateInput.value || null,
                createdAt: new Date().toISOString()
            };
            
            tasks.unshift(newTask);
            saveTasks();
            renderTasks();
            updateStats();
            
            // Reset input fields
            taskInput.value = '';
            dueDateInput.value = '';
            prioritySelect.value = 'medium';
            categorySelect.value = '';
        }
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        
        let filteredTasks = filterTasks();
        filteredTasks = searchTasks(filteredTasks);
        filteredTasks = sortTasks(filteredTasks);
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state">No tasks found. Add a new task to get started!</div>';
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item';
            taskItem.dataset.id = task.id;
            
            if (task.completed) {
                taskItem.classList.add('completed');
            }
            
            // Check if task is overdue
            if (task.dueDate && !task.completed) {
                const today = new Date();
                const dueDate = new Date(task.dueDate);
                if (dueDate < today) {
                    taskItem.classList.add('overdue');
                }
            }
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text">${task.text}</span>
                    <div class="task-meta">
                        ${task.priority ? `<span class="task-priority priority-${task.priority}">${task.priority}</span>` : ''}
                        ${task.category ? `<span class="task-category" style="background-color: ${getCategoryColor(task.category)}20; color: ${getCategoryColor(task.category)}">${task.category}</span>` : ''}
                        ${task.dueDate ? `
                            <span class="task-due-date">
                                <i class="far fa-calendar-alt"></i>
                                ${formatDate(task.dueDate)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn btn-important" title="Mark as important">
                        <i class="fas fa-exclamation"></i>
                    </button>
                    <button class="task-btn btn-edit" title="Edit task">
                        <i class="far fa-edit"></i>
                    </button>
                    <button class="task-btn btn-delete" title="Delete task">
                        <i class="far fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners to the task item
            const checkbox = taskItem.querySelector('.task-checkbox');
            const deleteBtn = taskItem.querySelector('.btn-delete');
            const editBtn = taskItem.querySelector('.btn-edit');
            const importantBtn = taskItem.querySelector('.btn-important');
            
            checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            editBtn.addEventListener('click', () => editTask(task.id));
            importantBtn.addEventListener('click', () => toggleImportant(task.id));
            
            taskList.appendChild(taskItem);
        });
    }
    
    function filterTasks() {
        const today = new Date().toISOString().split('T')[0];
        
        return tasks.filter(task => {
            // Apply filter
            if (currentFilter === 'today' && task.dueDate !== today) return false;
            if (currentFilter === 'important' && task.priority !== 'high') return false;
            if (currentFilter === 'completed' && !task.completed) return false;
            
            // Apply category filter
            if (currentCategory && task.category !== currentCategory) return false;
            
            return true;
        });
    }
    
    function searchTasks(tasksArray) {
        if (!searchQuery) return tasksArray;
        
        return tasksArray.filter(task => 
            task.text.toLowerCase().includes(searchQuery) ||
            (task.category && task.category.toLowerCase().includes(searchQuery))
        );
    }
    
    function sortTasks(tasksArray) {
        const sortBy = sortSelect.value;
        
        return [...tasksArray].sort((a, b) => {
            switch (sortBy) {
                case 'due-date':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                
                case 'priority':
                    const priorityOrder = { high: 1, medium: 2, low: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                
                case 'alphabetical':
                    return a.text.localeCompare(b.text);
                
                case 'date-added':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }
    
    function toggleTaskCompletion(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    function editTask(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        
        // Replace task with input field for editing
        const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
        taskItem.innerHTML = `
            <div class="task-edit-form">
                <input type="text" class="edit-task-input" value="${task.text}">
                <div class="edit-options">
                    <select class="edit-priority-select">
                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                    </select>
                    <select class="edit-category-select">
                        <option value="">No Category</option>
                        <option value="work" ${task.category === 'work' ? 'selected' : ''}>Work</option>
                        <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>Personal</option>
                        <option value="shopping" ${task.category === 'shopping' ? 'selected' : ''}>Shopping</option>
                        <option value="health" ${task.category === 'health' ? 'selected' : ''}>Health</option>
                    </select>
                    <input type="date" class="edit-due-date" value="${task.dueDate || ''}">
                    <button class="save-edit-btn primary-btn">Save</button>
                    <button class="cancel-edit-btn">Cancel</button>
                </div>
            </div>
        `;
        
        const saveBtn = taskItem.querySelector('.save-edit-btn');
        const cancelBtn = taskItem.querySelector('.cancel-edit-btn');
        
        saveBtn.addEventListener('click', () => {
            const newText = taskItem.querySelector('.edit-task-input').value.trim();
            if (newText) {
                task.text = newText;
                task.priority = taskItem.querySelector('.edit-priority-select').value;
                task.category = taskItem.querySelector('.edit-category-select').value || null;
                task.dueDate = taskItem.querySelector('.edit-due-date').value || null;
                saveTasks();
                renderTasks();
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            renderTasks();
        });
    }
    
    function toggleImportant(id) {
        tasks = tasks.map(task => 
            task.id === id ? { 
                ...task, 
                priority: task.priority === 'high' ? 'medium' : 'high' 
            } : task
        );
        saveTasks();
        renderTasks();
    }
    
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        // Calculate overdue tasks
        const today = new Date().toISOString().split('T')[0];
        const overdue = tasks.filter(task => 
            !task.completed && 
            task.dueDate && 
            task.dueDate < today
        ).length;
        
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
        overdueTasksEl.textContent = overdue;
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function toggleTheme() {
        const isDark = themeToggle.checked;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
    
    function checkThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 
                           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        themeToggle.checked = savedTheme === 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function getCategoryColor(category) {
        const colors = {
            work: '#ff6b6b',
            personal: '#48dbfb',
            shopping: '#1dd1a1',
            health: '#feca57'
        };
        return colors[category] || '#6c5ce7';
    }
});