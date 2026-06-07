// 获取页面元素
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const countSpan = document.getElementById('count');
const clearBtn = document.getElementById('clearBtn');

// 待办事项数据（从浏览器本地存储读取，刷新页面不会丢失）
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// 保存到本地存储
function save() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 渲染列表
function render() {
    todoList.innerHTML = '';

    if (todos.length === 0) {
        todoList.innerHTML = '<div class="empty-state">暂无待办事项，添加一个吧！</div>';
    } else {
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = todo.done ? 'completed' : '';
            li.innerHTML = `
                <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggle(${index})">
                <span>${escapeHtml(todo.text)}</span>
                <button class="delete-btn" onclick="deleteTodo(${index})">删除</button>
            `;
            todoList.appendChild(li);
        });
    }

    // 更新统计
    const total = todos.length;
    const completed = todos.filter(t => t.done).length;
    countSpan.textContent = `共 ${total} 项，已完成 ${completed} 项`;
}

// 防止XSS攻击：转义HTML特殊字符
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 添加待办事项
function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') {
        alert('请输入内容！');
        return;
    }
    todos.push({ text, done: false });
    todoInput.value = '';
    save();
    render();
}

// 切换完成状态
function toggle(index) {
    todos[index].done = !todos[index].done;
    save();
    render();
}

// 删除单项
function deleteTodo(index) {
    todos.splice(index, 1);
    save();
    render();
}

// 清空已完成
function clearCompleted() {
    todos = todos.filter(t => !t.done);
    save();
    render();
}

// 绑定事件
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});
clearBtn.addEventListener('click', clearCompleted);

// 页面加载时渲染
render();
