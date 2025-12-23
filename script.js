// Initial Mock Data (if empty)
const defaultExams = [
    {
        id: '1',
        courseName: 'Yapay Zeka',
        date: '2025-01-12T10:00',
        location: 'D-203 Amfi',
        topics: [
            { id: 't1', text: 'Machine Learning Basics', completed: true },
            { id: 't2', text: 'Neural Networks', completed: false },
            { id: 't3', text: 'Reinforcement Learning', completed: false },
            { id: 't4', text: 'Genetic Algorithms', completed: false },
        ]
    },
    {
        id: '2',
        courseName: 'Veri Yapıları',
        date: '2025-01-15T13:30',
        location: 'D-105',
        topics: [
            { id: 't5', text: 'Linked Lists', completed: true },
            { id: 't6', text: 'Trees & Graphs', completed: true },
            { id: 't7', text: 'Sorting Algorithms', completed: false },
        ]
    }
];

// State
let exams = JSON.parse(localStorage.getItem('exams')) || defaultExams;
let currentEditingExamId = null;

// DOM Elements
const modalOverlay = document.getElementById('modal-overlay');
const examModal = document.getElementById('exam-modal');
const topicsModal = document.getElementById('topics-modal');
const examForm = document.getElementById('exam-form');
const addTopicForm = document.getElementById('add-topic-form');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    saveExams(); // First save to ensure logic
    renderDashboard();
    initCountdown();

    // Show welcome dialog if first visit
    checkAndShowWelcomeDialog();

    // Vanilla Tilt Init
    // VanillaTilt.init(document.querySelectorAll(".glass-panel"));

    // Flatpickr Init
    const modalEl = document.getElementById('exam-modal');

    flatpickr("#exam-date", {
        locale: 'tr',
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d F Y",
        allowInput: false,
        disableMobile: true,
        appendTo: modalEl, // Fixes scroll drift
        static: true // Helps with positioning inside modals
    });

    flatpickr("#exam-time", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        altInput: true,
        altFormat: "H:i",
        allowInput: false,
        disableMobile: true,
        minuteIncrement: 15, // Better UX for exams
        appendTo: modalEl, // Fixes scroll drift
        static: true // Helps with positioning inside modals
    });
});


// --- Rendering ---

// Update page title dynamically based on exam count
function updatePageTitle() {
    if (exams.length === 0) {
        document.title = 'Finals Dashboard 🎉';
    } else {
        document.title = `Finals Dashboard (${exams.length} Sınav)`;
    }
}

function renderDashboard() {
    renderExamsList();
    updateHero();
    startCardCountdowns();
}

function renderExamsList() {
    const listContainer = document.getElementById('exams-list');
    listContainer.innerHTML = '';

    // Update dynamic page title
    updatePageTitle();

    // Empty State Check
    if (exams.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state flex flex-col items-center justify-center py-20 px-8">
                <div class="glass-panel p-12 rounded-3xl text-center max-w-md border border-white/10">
                    <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-neonBlue/20 to-neonPurple/20 flex items-center justify-center">
                        <i class="fa-solid fa-mug-hot text-5xl text-neonBlue/70"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-white mb-2">Hiç sınavın yok!</h3>
                    <p class="text-gray-400 mb-6">Keyfine bak veya yeni bir tane ekle 🎉</p>
                    <button onclick="openAddModal()" 
                        class="bg-gradient-to-r from-neonBlue to-neonPurple text-white font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition duration-300">
                        <i class="fa-solid fa-plus mr-2"></i>İlk Sınavını Ekle
                    </button>
                </div>
            </div>
        `;
        document.getElementById('total-exams').innerText = '0';
        return;
    }

    // Sort exams by date
    const sortedExams = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));
    const now = new Date();

    sortedExams.forEach((exam, index) => {
        const total = exam.topics.length;
        const completed = exam.topics.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        const dateObj = new Date(exam.date);
        const dateStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const isPast = dateObj < now;

        // --- NEW FEATURES LOGIC ---
        // Date Formatting for Side Info
        const day = dateObj.getDate();
        const month = dateObj.toLocaleDateString('tr-TR', { month: 'long' });
        const year = dateObj.getFullYear();
        const dayName = dateObj.toLocaleDateString('tr-TR', { weekday: 'long' });

        // --- NEW FEATURES LOGIC ---
        // Priority Styles - Full Card Theme
        let cardTheme = "bg-white/5 border-white/10"; // Default/NORMAL
        let accentColor = "neonBlue";
        let priorityIcon = "";

        if (exam.priority === 'HIGH') {
            cardTheme = "bg-gradient-to-br from-red-900/30 to-red-950/20 border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.15)]";
            accentColor = "red-400";
            priorityIcon = `<span class="text-red-400 text-xs font-bold">🔥 KRİTİK</span>`;
        } else if (exam.priority === 'LOW') {
            cardTheme = "bg-gradient-to-br from-green-900/20 to-green-950/10 border-green-500/30";
            accentColor = "green-400";
            priorityIcon = `<span class="text-green-400 text-xs font-bold">🤙🏻 RAHAT</span>`;
        }

        // Midterm grade color
        let midtermColor = "text-white";
        if (exam.midtermGrade && parseFloat(exam.midtermGrade) < 40) {
            midtermColor = "text-red-400 font-bold";
        }

        // Layout: Alternate sides for Desktop, all left for mobile
        const isLeft = index % 2 === 0;

        const row = document.createElement('div');
        row.className = `timeline-row grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 md:gap-0 items-center ${isPast ? 'opacity-50 grayscale past' : ''}`;

        // Calculate days remaining for urgency styling
        const daysRemaining = Math.floor((dateObj - now) / (1000 * 60 * 60 * 24));
        const isUrgent = daysRemaining >= 0 && daysRemaining < 3;
        const urgentClass = isUrgent ? 'countdown-urgent' : '';

        // Side Info HTML (Visible in Desktop Timeline List)
        // Corrected Logic: 
        // If Card is Left (isLeft=true) -> Info is on Right. We want it 'items-start pl-8 text-left' (near center).
        // If Card is Right (isLeft=false) -> Info is on Left. We want it 'items-end pr-8 text-right' (near center).
        const sideClass = isLeft ? 'items-start pl-8 text-left' : 'items-end pr-8 text-right';
        const sideIconAlign = isLeft ? 'flex-row' : 'flex-row-reverse'; // Icon order for location

        const infoSideHtml = `
            <div class="timeline-side-info hidden md:flex flex-col gap-1 justify-center ${sideClass}">
                 <div class="text-3xl font-extrabold text-white leading-none tracking-tight">
                    ${day} <span class="text-lg font-medium text-gray-400 block -mt-1 uppercase tracking-wider">${month}</span>
                </div>
                <div class="text-xs text-gray-500 font-mono tracking-widest uppercase mb-1">${dayName}, ${year}</div>
                <div class="flex flex-col gap-1 ${isLeft ? 'items-start' : 'items-end'}">
                     <span class="text-${accentColor} font-mono font-bold text-lg bg-black/40 px-2 py-0.5 rounded border border-white/5 shadow-inner">
                        <i class="fa-regular fa-clock text-xs mr-1 opacity-70"></i>${timeStr}
                    </span>
                    <span class="text-gray-400 text-sm flex items-center gap-1 ${sideIconAlign}">
                        <i class="fa-solid fa-location-dot text-xs text-${accentColor}"></i> ${exam.location}
                    </span>
                </div>
            </div>
        `;

        // Card Content with Enhanced Glassmorphism
        const cardHtml = `
            <div class="exam-card p-5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col gap-3 
                        bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]
                        hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:scale-[1.02]
                        ${exam.priority === 'HIGH' ? 'border-red-500/30 bg-gradient-to-br from-red-900/20 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}
                        ${exam.priority === 'LOW' ? 'border-green-500/30 bg-gradient-to-br from-green-900/20 to-transparent' : ''}"
                 onclick="openTopicsModal('${exam.id}')">
                
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 class="text-xl md:text-2xl font-bold text-white leading-tight">${exam.courseName}</h3>
                            ${priorityIcon}
                        </div>
                        

                        <!-- Internal Info (Visible in Mobile & Grid, Hidden in Desktop List) -->
                        <div class="grid-internal-info md:hidden flex flex-col gap-1 text-xs text-gray-400 mt-1 p-2 rounded-lg bg-white/5 border border-white/5">
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-white text-sm"><i class="fa-regular fa-calendar mr-1 text-neonBlue"></i> ${dateStr}</span>
                                <span class="font-mono text-neonBlue bg-black/30 px-2 py-0.5 rounded"><i class="fa-regular fa-clock mr-1"></i> ${timeStr}</span>
                            </div>
                            <div class="w-full border-t border-white/10"></div>
                            <span class="card-detail-hide font-medium text-white flex items-center"><i class="fa-solid fa-location-dot mr-1.5 text-neonPurple"></i> ${exam.location}</span>
                        </div>
                    </div>
                </div>

                <!-- Midterm Grade (Always Visible Placeholder) -->
                <div class="card-detail-hide flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/5">
                     <span class="text-xs text-gray-400">Vize: <b class="${exam.midtermGrade ? midtermColor : 'text-gray-500'}">${exam.midtermGrade ? exam.midtermGrade : '-'}</b></span>
                </div>

                <!-- COUNTDOWN - Enhanced & Prominent -->
                <div class="countdown-box p-3 bg-black/40 rounded-xl border border-white/10 card-countdown-container ${urgentClass}" data-date="${exam.date}">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex-shrink-0">Kalan Süre</span>
                        <span class="countdown-timer font-mono text-xl md:text-2xl font-bold tracking-tight text-right
                                     ${isUrgent ? 'text-orange-400 animate-pulse' : `text-${accentColor}`}">...</span>
                    </div>
                </div>

                <!-- Progress -->
                <div>
                     <div class="flex justify-between text-[10px] text-gray-500 mb-1">
                         <span>İlerleme</span>
                         <span>${percentage}%</span>
                    </div>
                    <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-${accentColor} to-neonPurple transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;

        // Center Dot - colored by priority
        let dotColor = "bg-gradient-to-br from-neonBlue to-neonPurple shadow-[0_0_12px_rgba(0,243,255,0.5)]";
        if (exam.priority === 'HIGH') {
            dotColor = "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]";
        } else if (exam.priority === 'LOW') {
            dotColor = "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]";
        }

        // Connector line color matches dot
        let connectorColor = "bg-gradient-to-r from-neonBlue/50 to-transparent";
        if (exam.priority === 'HIGH') connectorColor = "bg-gradient-to-r from-red-500/50 to-transparent";
        else if (exam.priority === 'LOW') connectorColor = "bg-gradient-to-r from-green-500/50 to-transparent";

        // Desktop: Grid with connectors [left | dot | right]
        if (isLeft) {
            row.innerHTML = `
                <div class="flex items-center justify-end w-full">
                    <div class="w-full">${cardHtml}</div>
                    <div class="hidden md:block w-8 h-[2px] ${connectorColor} flex-shrink-0"></div>
                </div>
                <div class="timeline-dot hidden md:block ${dotColor}"></div>
                <div class="hidden md:block w-full">${infoSideHtml}</div>
            `;
        } else {
            row.innerHTML = `
                <div class="hidden md:block w-full">${infoSideHtml}</div>
                <div class="timeline-dot hidden md:block ${dotColor}"></div>
                <div class="flex items-center w-full">
                    <div class="hidden md:block w-8 h-[2px] ${connectorColor.replace('to-transparent', 'from-transparent').replace('from-', 'to-')} flex-shrink-0"></div>
                    <div class="w-full">${cardHtml}</div>
                </div>
            `;
        }

        listContainer.appendChild(row);
    });

    document.getElementById('total-exams').innerText = exams.length;
}

let cardCountdownInterval;

function startCardCountdowns() {
    if (cardCountdownInterval) clearInterval(cardCountdownInterval);

    function update() {
        const now = new Date().getTime();
        const containers = document.querySelectorAll('.card-countdown-container');

        containers.forEach(container => {
            const dateStr = container.getAttribute('data-date');
            const target = new Date(dateStr).getTime();
            const diff = target - now;
            const display = container.querySelector('.countdown-timer');
            const isUrgent = container.classList.contains('countdown-urgent');

            if (diff < 0) {
                container.classList.add('completed-mode');
                display.innerText = "Tamamlandı";
                display.className = 'countdown-timer font-mono text-xl md:text-2xl font-bold tracking-tight text-gray-500';
            } else {
                container.classList.remove('completed-mode');
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                // Prominent display
                display.innerText = `${d}g ${h}s ${m}d`;

                // Apply urgent styling dynamically
                if (d < 3 && d >= 0) {
                    display.classList.add('text-orange-400', 'animate-pulse');
                    display.classList.remove('text-neonBlue', 'text-red-400', 'text-green-400');
                }
            }
        });
    }

    update();
    cardCountdownInterval = setInterval(update, 1000);
}

function updateHero() {
    // Find next upcoming exam
    const now = new Date();
    const futureExams = exams.filter(e => new Date(e.date) > now).sort((a, b) => new Date(a.date) - new Date(b.date));

    const nextExam = futureExams[0];
    const heroText = document.getElementById('next-exam-text');

    if (nextExam) {
        heroText.innerHTML = `Sırada: <span class="text-white font-bold">${nextExam.courseName}</span> - ${nextExam.location}`;
        startCountdown(nextExam.date);
    } else {
        heroText.innerText = "Yaklaşan sınav yok! İyi tatiller.";
        document.getElementById('countdown').innerHTML = `<span class="text-2xl">🎉</span>`;
    }
}

// --- Countdown Logic ---
let countdownInterval;

function startCountdown(targetDateStr) {
    if (countdownInterval) clearInterval(countdownInterval);

    const targetDate = new Date(targetDateStr).getTime();
    const el = document.getElementById('countdown');

    function update() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            el.innerHTML = "Sınav Başladı!";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const formatBox = (val, label) => `
            <div class="countdown-box p-3 rounded-xl min-w-[70px] flex flex-col items-center">
                <span class="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">${val}</span>
                <span class="text-[10px] md:text-xs uppercase tracking-widest text-gray-400">${label}</span>
            </div>
        `;

        el.innerHTML = `
            ${formatBox(days, 'Gün')}
            ${formatBox(hours, 'Saat')}
            ${formatBox(minutes, 'Dk')}
            ${formatBox(seconds, 'Sn')}
        `;
    }

    update();
    countdownInterval = setInterval(update, 1000);
}

function initCountdown() {
    updateHero();
}

// --- Modals & CRUD ---
let currentExamIdForTopics = null;

function openAddModal() {
    currentEditingExamId = null;
    document.getElementById('modal-title').innerText = "Yeni Sınav Ekle";
    examForm.reset();

    // Fix: Use Flatpickr instance to set date
    const dateInput = document.getElementById('exam-date');
    if (dateInput._flatpickr) {
        dateInput._flatpickr.setDate(new Date());
    }

    const timeInput = document.getElementById('exam-time');
    if (timeInput._flatpickr) {
        timeInput._flatpickr.clear();
    }

    showModal('exam-modal');
}

function openEditExamFromTopics() {
    if (!currentExamIdForTopics) return;

    closeModalImmediate(); // close topics modal

    const exam = exams.find(e => e.id === currentExamIdForTopics);
    if (!exam) return;

    currentEditingExamId = exam.id;
    document.getElementById('modal-title').innerText = "Sınavı Düzenle";

    document.getElementById('course-name').value = exam.courseName;
    document.getElementById('exam-location').value = exam.location;

    // Fix: Use Flatpickr instance to set values correctly for edit
    const dateInput = document.getElementById('exam-date');
    const timeInput = document.getElementById('exam-time');

    // Split ISO string back to parts
    const [d, t] = exam.date.split('T');

    if (dateInput._flatpickr) {
        dateInput._flatpickr.setDate(d);
    }
    if (timeInput._flatpickr) {
        timeInput._flatpickr.setDate(t);
    }

    // Load New Fields for Edit
    document.getElementById('exam-midterm').value = exam.midtermGrade || '';
    document.getElementById('exam-priority').value = exam.priority || 'NORMAL';
    document.getElementById('exam-notes').value = exam.notes || '';

    showModal('exam-modal');
}

function openTopicsModal(examId) {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    currentExamIdForTopics = examId;

    document.getElementById('topic-course-title').innerText = exam.courseName;
    const d = new Date(exam.date);
    document.getElementById('topic-exam-date').innerText = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    document.getElementById('topic-exam-location').innerText = exam.location;

    renderTopicsList(exam);
    showModal('topics-modal');
}

function showModal(modalId) {
    modalOverlay.classList.remove('hidden');
    // small delay for transition
    setTimeout(() => {
        modalOverlay.classList.remove('opacity-0');
        document.getElementById(modalId).classList.remove('hidden');
        setTimeout(() => {
            document.getElementById(modalId).classList.remove('scale-95');
        }, 10);
    }, 10);
}

function closeModal() {
    modalOverlay.classList.add('opacity-0');
    const modals = document.querySelectorAll('.glass-modal');
    modals.forEach(m => m.classList.add('scale-95'));

    setTimeout(() => {
        modalOverlay.classList.add('hidden');
        modals.forEach(m => m.classList.add('hidden'));
    }, 300);
}

function closeModalImmediate() {
    modalOverlay.classList.add('hidden');
    modalOverlay.classList.add('opacity-0');
    const modals = document.querySelectorAll('.glass-modal');
    modals.forEach(m => {
        m.classList.add('hidden');
        m.classList.add('scale-95');
    });
}


if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
} else {
    console.error("CRITICAL: modal-overlay element not found! Check index.html.");
}

// --- Topic Logic ---
function renderTopicsList(exam) {
    const list = document.getElementById('topics-list');
    list.innerHTML = '';

    const total = exam.topics.length;
    const completed = exam.topics.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById('modal-progress-text').innerText = `${percent}%`;
    document.getElementById('modal-progress-bar').style.width = `${percent}%`;

    exam.topics.forEach((topic, index) => {
        const item = document.createElement('div');
        item.className = `topic-item group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition cursor-pointer ${topic.completed ? 'completed' : ''}`;
        item.onclick = (e) => {
            if (e.target.closest('button')) return; // ignore delete btn
            toggleTopic(exam.id, topic.id);
        };

        item.innerHTML = `
            <div class="custom-checkbox w-6 h-6 border-2 border-neonBlue rounded flex items-center justify-center">
                <i class="fa-solid fa-check text-xs opacity-0 transition-opacity duration-200"></i>
            </div>
            <span class="flex-1 text-gray-300 group-hover:text-white transition select-none">${topic.text}</span>
            <button onclick="removeTopic('${exam.id}', '${topic.id}')" class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-2"><i class="fa-solid fa-trash"></i></button>
        `;
        list.appendChild(item);
    });
}

function toggleTopic(examId, topicId) {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    const topic = exam.topics.find(t => t.id === topicId);
    if (topic) {
        topic.completed = !topic.completed;
        saveExams();
        renderTopicsList(exam);
        renderExamsList(); // update list only once

        // Confetti Check
        if (topic.completed) {
            const allDone = exam.topics.every(t => t.completed);
            if (allDone && exam.topics.length > 0) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#00f3ff', '#bc13fe', '#ff0055']
                });
            }
        }
    }
}

function removeTopic(examId, topicId) {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    exam.topics = exam.topics.filter(t => t.id !== topicId);
    saveExams();
    renderTopicsList(exam);
    renderExamsList();
}

addTopicForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentExamIdForTopics) return;

    const input = document.getElementById('new-topic-input');
    const text = input.value.trim();
    if (!text) return;

    const exam = exams.find(e => e.id === currentExamIdForTopics);
    exam.topics.push({
        id: Date.now().toString(),
        text: text,
        completed: false
    });

    saveExams();
    renderTopicsList(exam);
    renderExamsList();
    input.value = '';
});

// --- Exam CRUD ---

examForm.addEventListener('submit', (e) => {
    e.preventDefault();

    try {
        const nameInput = document.getElementById('course-name');
        const dateInput = document.getElementById('exam-date');
        const timeInput = document.getElementById('exam-time');
        const locationInput = document.getElementById('exam-location');
        const midtermInput = document.getElementById('exam-midterm');
        const priorityInput = document.getElementById('exam-priority');
        const notesInput = document.getElementById('exam-notes');

        // Defensive check: Ensure elements exist
        if (!nameInput || !dateInput || !timeInput || !locationInput) {
            console.error("Critical form elements missing!");
            alert("Form elemanları bulunamadı. Sayfayı yenileyip tekrar deneyin.");
            return;
        }

        const name = nameInput.value;
        const location = locationInput.value;
        const midterm = midtermInput ? midtermInput.value : '';
        const priority = priorityInput ? priorityInput.value : 'NORMAL';
        const notes = notesInput ? notesInput.value : '';

        // ROBUST DATE RETRIEVAL via Flatpickr API
        let dateVal = "";
        let timeVal = "";

        if (dateInput._flatpickr && dateInput._flatpickr.selectedDates.length > 0) {
            dateVal = dateInput._flatpickr.formatDate(dateInput._flatpickr.selectedDates[0], "Y-m-d");
        } else {
            dateVal = dateInput.value;
        }

        if (timeInput._flatpickr && timeInput._flatpickr.selectedDates.length > 0) {
            timeVal = timeInput._flatpickr.formatDate(timeInput._flatpickr.selectedDates[0], "H:i");
        } else {
            timeVal = timeInput.value;
        }

        if (!dateVal || !timeVal) {
            alert("Lütfen tarih ve saat seçiniz!");
            return;
        }

        const fullDate = `${dateVal}T${timeVal}`;

        if (currentEditingExamId) {
            // Edit
            const exam = exams.find(e => e.id === currentEditingExamId);
            if (exam) {
                exam.courseName = name;
                exam.date = fullDate;
                exam.location = location;
                // Update New Fields
                exam.midtermGrade = midterm;
                exam.priority = priority;
                exam.notes = notes;
            }
        } else {
            // Add
            const newExam = {
                id: Date.now().toString(),
                courseName: name,
                date: fullDate,
                location: location,
                // Add New Fields
                midtermGrade: midterm,
                priority: priority,
                notes: notes,
                topics: []
            };
            exams.push(newExam);
        }

        saveExams();
        closeModal();
        renderDashboard();
        initCountdown();

    } catch (err) {
        console.error("Save Error:", err);
        alert("Bir hata oluştu: " + err.message);
    }
});

function deleteCurrentExam() {
    if (!currentExamIdForTopics) return;
    if (confirm('Bu sınavı silmek istediğine emin misin?')) {
        exams = exams.filter(e => e.id !== currentExamIdForTopics);
        saveExams();
        closeModal();
        renderDashboard();
        initCountdown();
    }
}


// --- Persistence ---
function saveExams() {
    localStorage.setItem('exams', JSON.stringify(exams));
}


// --- View Toggle (List / Grid) ---
let currentView = 'list';

function setView(view) {
    currentView = view;
    const section = document.getElementById('exams-section');
    const listBtn = document.getElementById('view-list-btn');
    const gridBtn = document.getElementById('view-grid-btn');

    // Update section class
    section.classList.remove('view-list', 'view-grid');
    section.classList.add(`view-${view}`);

    // Update button states
    listBtn.classList.remove('active');
    gridBtn.classList.remove('active');

    if (view === 'list') {
        listBtn.classList.add('active');
    } else {
        gridBtn.classList.add('active');
    }

    // Save preference
    localStorage.setItem('examViewMode', view);
}

// --- Hide Completed Toggle ---
let hideCompleted = false;

function toggleHideCompleted() {
    hideCompleted = !hideCompleted;
    const section = document.getElementById('exams-section');

    // Get the filter button (now only in header)
    const btn = document.getElementById('hide-completed-btn-mobile');

    if (hideCompleted) {
        section.classList.add('hide-completed');
        if (btn) {
            btn.classList.add('active');
            const icon = btn.querySelector('i');
            const label = btn.querySelector('span');
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            btn.title = 'Tamamlanan Sınavları Göster';
            if (label) label.textContent = 'Bitenleri Göster';
        }
    } else {
        section.classList.remove('hide-completed');
        if (btn) {
            btn.classList.remove('active');
            const icon = btn.querySelector('i');
            const label = btn.querySelector('span');
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            btn.title = 'Tamamlanan Sınavları Gizle';
            if (label) label.textContent = 'Bitenleri Gizle';
        }
    }

    // Save preference
    localStorage.setItem('hideCompletedExams', hideCompleted);
}

// Restore view preference on load
document.addEventListener('DOMContentLoaded', () => {
    const savedView = localStorage.getItem('examViewMode') || 'list';
    const savedHideCompleted = localStorage.getItem('hideCompletedExams') === 'true';

    // Small delay to ensure DOM is ready
    setTimeout(() => {
        setView(savedView);

        // Restore hide completed state
        if (savedHideCompleted) {
            toggleHideCompleted();
        }
    }, 100);
});

// --- Welcome Dialog ---
function checkAndShowWelcomeDialog() {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

    if (!hasSeenWelcome) {
        showWelcomeDialog();
    }
}

function showWelcomeDialog() {
    const overlay = document.getElementById('welcome-overlay');
    const dialog = document.getElementById('welcome-dialog');

    overlay.classList.remove('hidden');

    // Small delay for transition
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        dialog.classList.remove('scale-95');
    }, 10);
}

function closeWelcomeDialog() {
    const overlay = document.getElementById('welcome-overlay');
    const dialog = document.getElementById('welcome-dialog');

    overlay.classList.add('opacity-0');
    dialog.classList.add('scale-95');

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);

    // Save that user has seen the welcome dialog
    localStorage.setItem('hasSeenWelcome', 'true');
}
