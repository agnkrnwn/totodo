if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
  

// Fungsi untuk memeriksa dukungan LocalStorage
function isLocalStorageSupported() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

// Fungsi untuk mendapatkan daftar tugas dari LocalStorage
function getTasksFromLocalStorage() {
    if (isLocalStorageSupported()) {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }
    return [];
}

// Fungsi untuk menyimpan daftar tugas ke LocalStorage
function saveTasksToLocalStorage(tasks) {
    if (isLocalStorageSupported()) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

// Fungsi untuk mengisi ul dengan tugas-tugas
function populateTaskList() {
    const tasks = getTasksFromLocalStorage();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    tasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.className = 'list-group-item';
    
        if (task.done) {
            taskItem.classList.add('done');
        }
    
        taskItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="task-content">
                    <div class="task-text">${task.text}</div>
                    <div class="task-timestamp">${task.timestamp}</div>
                    ${task.done ? `<div class="task-completedAt">Selesai pada: ${task.completedAt}</div>` : ''}
                </div>
                <div class="task-buttons">
                    <button class="btn btn-success btn-sm mr-2" onclick="markTaskAsDone(${index})"><i class="bi bi-check"></i></button>
                    <button class="btn btn-primary btn-sm mr-2" onclick="editTask(${index})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTask(${index})"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        `;
        taskList.appendChild(taskItem);
    });
    
    
    
}

// Fungsi untuk menambah tugas baru
function addTask(event) {
    const taskInput = document.getElementById('taskInput');
    const taskText = taskInput.value.trim();

    if ((event.key === 'Enter' || event.target.id === 'addTaskBtn') && taskText !== '') {
        const tasks = getTasksFromLocalStorage();
        const now = new Date();
        const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        tasks.push({ text: taskText, done: false, timestamp: formattedDate });
        saveTasksToLocalStorage(tasks);
        taskInput.value = '';
        populateTaskList();
    }
}




// Fungsi untuk menghapus tugas
function deleteTask(index) {
    const isConfirmed = window.confirm('Apakah Anda yakin ingin menghapus tugas ini?');
    
    if (isConfirmed) {
        const tasks = getTasksFromLocalStorage();
        tasks.splice(index, 1);
        saveTasksToLocalStorage(tasks);
        populateTaskList();
    }
}

// Fungsi untuk menandai tugas sebagai selesai
function markTaskAsDone(index) {
    const tasks = getTasksFromLocalStorage();
    tasks[index].done = true;
    tasks[index].completedAt = new Date().toLocaleString(); // Menyimpan waktu selesai
    saveTasksToLocalStorage(tasks);
    populateTaskList();
}


// Fungsi untuk mengedit tugas
function editTask(index) {
    const tasks = getTasksFromLocalStorage();
    const editedTaskInput = document.getElementById('editedTaskInput');
    
    // Mengisi input modal dengan teks tugas yang akan diedit
    editedTaskInput.value = tasks[index].text;

    // Menampilkan modal
    $('#editTaskModal').modal('show');

    // Menyimpan indeks tugas yang akan diedit sebagai atribut data pada tombol "Simpan Perubahan"
    const saveEditedTaskBtn = document.getElementById('saveEditedTaskBtn');
    saveEditedTaskBtn.setAttribute('data-task-index', index);

    // Menambahkan event listener pada tombol "Simpan Perubahan"
    saveEditedTaskBtn.addEventListener('click', saveEditedTask);
}

function saveEditedTask() {
    const editedTaskInput = document.getElementById('editedTaskInput');
    const editedTaskText = editedTaskInput.value.trim();
    const index = parseInt(this.getAttribute('data-task-index'));

    if (editedTaskText !== '') {
        const tasks = getTasksFromLocalStorage();
        tasks[index].text = editedTaskText;
        saveTasksToLocalStorage(tasks);
        populateTaskList();
    }

    // Menutup modal
    $('#editTaskModal').modal('hide');
}



// Inisialisasi
document.getElementById('addTaskBtn').addEventListener('click', addTask);
document.getElementById('taskInput').addEventListener('keydown', addTask);
populateTaskList();


function updateDateTime() {
    const datetimeElement = document.getElementById('datetime');
    const now = new Date();
    const formattedDateTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    datetimeElement.textContent = formattedDateTime;
}

// Panggil fungsi updateDateTime setiap detik
setInterval(updateDateTime, 1000);

