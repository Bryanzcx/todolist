// =============================
// 待办事项应用 - 支持日期时间、优先级、排序、编辑
// =============================

// 获取页面元素
const todoInput = document.getElementById('todoInput');
const todoDateTime = document.getElementById('todoDateTime');
const todoPriority = document.getElementById('todoPriority');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const countSpan = document.getElementById('count');
const clearBtn = document.getElementById('clearBtn');
const sortBy = document.getElementById('sortBy');

// 待办事项数据（兼容旧数据格式）
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// 迁移旧数据格式
const MIGRATED = todos.map(todo => ({
    text: todo.text || '',
    done: todo.done || false,
    datetime: todo.datetime || new Date().toISOString(),
    priority: todo.priority || 2,
    createdAt: todo.createdAt || new Date().toISOString()
}));
todos = MIGRATED;

// 当前排序方式
let currentSort = localStorage.getItem('todoSort') || 'time-asc';
sortBy.value = currentSort;

// 当前正在编辑的索引（-1 表示没有正在编辑）
let editingIndex = -1;

// =============================
// 工具函数
// =============================

function save() {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('todoSort', currentSort);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const dateStr = date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let relativeStr = '';
    if (diffDays === 0) relativeStr = '今天';
    else if (diffDays === 1) relativeStr = '明天';
    else if (diffDays === -1) relativeStr = '昨天';
    else if (diffDays > 1) relativeStr = `${diffDays}天后`;
    else relativeStr = `${Math.abs(diffDays)}天前`;

    return { dateStr, relativeStr, isOverdue: diffMs < 0 && !isNaN(diffMs) };
}

function getPriorityConfig(level) {
    const configs = {
        3: { label: '高', className: 'priority-high' },
        2: { label: '中', className: 'priority-medium' },
        1: { label: '低', className: 'priority-low' }
    };
    return configs[level] || configs[2];
}

function sortTodos(todoList, sortType) {
    const sorted = [...todoList];
    switch (sortType) {
        case 'time-asc':
            return sorted.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        case 'time-desc':
            return sorted.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
        case 'priority-desc':
            return sorted.sort((a, b) => b.priority - a.priority);
        case 'priority-asc':
            return sorted.sort((a, b) => a.priority - b.priority);
        default:
            return sorted;
    }
}

// =============================
// 编辑功能
// =============================

function startEdit(index) {
    editingIndex = index;
    render();
}

function saveEdit(index) {
    const editText = document.getElementById('editText').value.trim();
    const editDateTime = document.getElementById('editDateTime').value;
    const editPriority = parseInt(document.getElementById('editPriority').value);

    if (editText === '') {
        alert('内容不能为空！');
        return;
    }
    if (!editDateTime) {
        alert('请选择日期时间！');
        return;
    }

    todos[index].text = editText;
    todos[index].datetime = editDateTime;
    todos[index].priority = editPriority;

    editingIndex = -1;
    save();
    render();
}

function cancelEdit() {
    editingIndex = -1;
    render();
}

// =============================
// 核心功能
// =============================

function render() {
    todoList.innerHTML = '';

    const sortedTodos = sortTodos(todos, currentSort);

    if (sortedTodos.length === 0) {
        todoList.innerHTML = '<div class="empty-state">暂无待办事项，添加一个吧！</div>';
        countSpan.innerHTML = '共 0 项';
        return;
    }

    sortedTodos.forEach((todo) => {
        const originalIndex = todos.indexOf(todo);
        const isEditing = originalIndex === editingIndex;

        const li = document.createElement('li');
        li.className = todo.done ? 'completed' : '';
        if (isEditing) li.classList.add('editing');

        if (isEditing) {
            // 编辑态
            const priorityInfo = getPriorityConfig(todo.priority);
            li.innerHTML = `
                <div class="edit-area">
                    <input type="text" id="editText" value="${escapeHtml(todo.text)}" placeholder="待办内容...">
                    <div class="edit-row">
                        <input type="datetime-local" id="editDateTime" value="${todo.datetime}">
                        <select id="editPriority">
                            <option value="3" ${todo.priority === 3 ? 'selected' : ''}>🔴 高优先级</option>
                            <option value="2" ${todo.priority === 2 ? 'selected' : ''}>🟡 中优先级</option>
                            <option value="1" ${todo.priority === 1 ? 'selected' : ''}>🟢 低优先级</option>
                        </select>
                    </div>
                    <div class="edit-actions">
                        <button class="save-btn" onclick="saveEdit(${originalIndex})">💾 保存</button>
                        <button class="cancel-btn" onclick="cancelEdit()">❌ 取消</button>
                    </div>
                </div>
            `;
        } else {
            // 普通态
            const timeInfo = formatDateTime(todo.datetime);
            const priorityInfo = getPriorityConfig(todo.priority);
            li.innerHTML = `
                <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggle(${originalIndex})" ${editingIndex !== -1 ? 'disabled' : ''}>
                <div class="todo-content">
                    <span class="todo-text">${escapeHtml(todo.text)}</span>
                    <div class="todo-meta">
                        <span class="todo-time" style="${timeInfo.isOverdue && !todo.done ? 'color:#e74c3c;font-weight:bold;' : ''}">
                            ⏰ ${timeInfo.dateStr} · ${timeInfo.relativeStr}
                        </span>
                        <span class="todo-priority ${priorityInfo.className}">
                            ${priorityInfo.label}
                        </span>
                    </div>
                </div>
                <button class="edit-btn" onclick="startEdit(${originalIndex})" ${editingIndex !== -1 ? 'disabled' : ''}>编辑</button>
                <button class="delete-btn" onclick="deleteTodo(${originalIndex})" ${editingIndex !== -1 ? 'disabled' : ''}>删除</button>
            `;
        }

        todoList.appendChild(li);
    });

    const total = todos.length;
    const completed = todos.filter(t => t.done).length;
    const highPriority = todos.filter(t => t.priority === 3 && !t.done).length;
    countSpan.innerHTML = `共 ${total} 项 · 已完成 ${completed} 项 · <span style="color:#c0392b">🔴 待办高优 ${highPriority} 项</span>`;
}

function addTodo() {
    const text = todoInput.value.trim();
    const datetime = todoDateTime.value;
    const priority = parseInt(todoPriority.value);

    if (text === '') {
        alert('请输入内容！');
        return;
    }
    if (!datetime) {
        alert('请选择日期时间！');
        return;
    }

    todos.push({
        text,
        done: false,
        datetime,
        priority,
        createdAt: new Date().toISOString()
    });

    todoInput.value = '';
    todoDateTime.value = '';
    todoPriority.value = '2';

    // 重置默认时间
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    todoDateTime.value = now.toISOString().slice(0, 16);

    save();
    render();
}

function toggle(index) {
    if (editingIndex !== -1) return;
    todos[index].done = !todos[index].done;
    save();
    render();
}

function deleteTodo(index) {
    if (editingIndex !== -1) return;
    todos.splice(index, 1);
    if (editingIndex === index) editingIndex = -1;
    save();
    render();
}

function clearCompleted() {
    if (editingIndex !== -1) return;
    todos = todos.filter(t => !t.done);
    editingIndex = -1;
    save();
    render();
}

function changeSort() {
    currentSort = sortBy.value;
    save();
    render();
}

// =============================
// 事件绑定
// =============================

addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

clearBtn.addEventListener('click', clearCompleted);

sortBy.addEventListener('change', changeSort);

// 设置默认日期时间为当前时间
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
todoDateTime.value = now.toISOString().slice(0, 16);

// 页面加载时渲染
render();
