// Localization dictionaries for RU and SK
const i18n = {
    ru: {
        appTitle: "Статистика оценок MZI",
        appSubtitle: "От создателей 'The Holy Krajci Manuscript'. P.S сайт был написан в диком угаре, за пять копеек, корректность данных - НЕ гарантируется!!!",
        searchInput: "Поиск по имени, ID или программе...",
        studentsTitle: "Список участников",
        showingCount: "Показано:",
        statsTitle: "Аналитика недели",
        statTotalStudents: "Всего студентов",
        statAvgPoints: "Средний балл",
        statLowScore: "Баллы 0, 1 или нет работы",
        statPerfectScore: "Все задачи на 3",
        scoreDistTitle: "Распределение баллов за неделю",
        weeklyTrendTitle: "Динамика среднего балла",
        programDistTitle: "Ср. балл по программам",
        leaderboardTitle: "Топ-30 за неделю",
        homeworkWeekLabel: "Д/З (Неделя",
        tasksLabel: "Задания 1 | 2 | 3",
        lecturesLabel: "ЛЕКЦИИ",
        activityLabel: "АКТИВНОСТЬ",
        totalLabel: "ИТОГО",
        noStudentsFound: "Студенты не найдены",
        loadingError: "Ошибка загрузки данных"
    },
    sk: {
        appTitle: "Štatistika hodnotení MZI",
        appSubtitle: "Od tvorcov „The Holy Krajci Manuscript“. P.S. Správnosť údajov NIE je zaručená!!!",
        searchInput: "Hľadať podľa mena, ID alebo programu...",
        studentsTitle: "Zoznam účastníkov",
        showingCount: "Zobrazené:",
        statsTitle: "Týždenná analytika",
        statTotalStudents: "Celkovo študentov",
        statAvgPoints: "Priemerný počet bodov",
        statLowScore: "Body 0, 1 alebo chýba DÚ",
        statPerfectScore: "Všetky úlohy na 3",
        scoreDistTitle: "Rozdelenie bodov za týždeň",
        weeklyTrendTitle: "Dynamika priemerného počtu bodov",
        programDistTitle: "Priemerný počet bodov podľa programu",
        leaderboardTitle: "Top-30 za týždeň",
        homeworkWeekLabel: "DÚ (Týždeň",
        tasksLabel: "Úlohy 1 | 2 | 3",
        lecturesLabel: "PREDNÁŠKY",
        activityLabel: "AKTIVITA",
        totalLabel: "SPOLU",
        noStudentsFound: "Študenti neboli nájdení",
        loadingError: "Chyba pri načítaní údajov"
    }
};

// Weeks mapping configuration (Weeks 1 to 12)
const WEEKS_MAPPING = [
    { week: 1, keys: ['__EMPTY_38', '__EMPTY_39', '__EMPTY_40'] },
    { week: 2, keys: ['__EMPTY_42', '__EMPTY_43', '__EMPTY_44'] },
    { week: 3, keys: ['__EMPTY_46', '__EMPTY_47', '__EMPTY_48'] },
    { week: 4, keys: ['__EMPTY_50', '__EMPTY_51', '__EMPTY_52'] },
    { week: 5, keys: ['__EMPTY_54', '__EMPTY_55', '__EMPTY_56'] },
    { week: 6, keys: ['__EMPTY_58', '__EMPTY_59', '__EMPTY_60'] },
    { week: 7, keys: ['__EMPTY_62', '__EMPTY_63', '__EMPTY_64'] },
    { week: 8, keys: ['__EMPTY_66', '__EMPTY_67', '__EMPTY_68'] },
    { week: 9, keys: ['__EMPTY_70', '__EMPTY_71', '__EMPTY_72'] },
    { week: 10, keys: ['__EMPTY_74', '__EMPTY_75', '__EMPTY_76'] },
    { week: 11, keys: ['__EMPTY_78', '__EMPTY_79', '__EMPTY_80'] },
    { week: 12, keys: ['__EMPTY_82', '__EMPTY_83', '__EMPTY_84'] }
];

let allStudents = [];
let activeWeekObj = WEEKS_MAPPING[0];
let currentLang = localStorage.getItem('appLang') || 'ru';

// Chart instances storage
let perfectChartInstance = null;
let lowChartInstance = null;
let scoreDistChartInstance = null;
let weeklyTrendChartInstance = null;
let programDistChartInstance = null;

// Global Chart.js dark theme styling
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'sans-serif';

function getBadgeStyle(score) {
    if (score === null || score === undefined || score === '' || score === '-') {
        return 'bg-slate-800 text-slate-500 border border-slate-700';
    }
    const num = Number(score);
    if (num <= 1) {
        return 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm shadow-red-500/20';
    } else if (num === 2) {
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/20';
    } else if (num >= 3) {
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20';
    }
    return 'bg-slate-800 text-slate-300';
}

function detectLatestWeek(students) {
    for (let i = WEEKS_MAPPING.length - 1; i >= 0; i--) {
        const week = WEEKS_MAPPING[i];
        const hasData = students.some(s => {
            const raw = s.raw || {};
            return week.keys.some(k => raw[k] !== undefined && raw[k] !== null && raw[k] > 0);
        });
        if (hasData) {
            return week;
        }
    }
    return WEEKS_MAPPING[0];
}

function applyLanguage() {
    const dict = i18n[currentLang];

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (dict[key]) {
            element.innerText = dict[key];
        }
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.placeholder = dict.searchInput;

    const searchInputMobile = document.getElementById('search-input-mobile');
    if (searchInputMobile) searchInputMobile.placeholder = dict.searchInput;

    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === currentLang) {
            btn.classList.add('bg-sky-500', 'text-white');
            btn.classList.remove('bg-slate-800', 'text-slate-400');
        } else {
            btn.classList.remove('bg-sky-500', 'text-white');
            btn.classList.add('bg-slate-800', 'text-slate-400');
        }
    });
}

// Render compact student cards with unified stats container for mobile optimization
function renderStudents(students) {
    const container = document.getElementById('students-container');
    const dict = i18n[currentLang];
    
    document.getElementById('showing-count').innerText = `${dict.showingCount} ${students.length}`;

    if (students.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 bg-slate-800 border border-slate-700/80 rounded-xl">
                <i class="fa-solid fa-user-slash text-3xl text-slate-600 mb-2"></i>
                <p class="text-xs text-slate-400">${dict.noStudentsFound}</p>
            </div>`;
        return;
    }

    container.innerHTML = students.map(student => {
        const raw = student.raw || {};
        const taskScores = activeWeekObj.keys.map(k => raw[k]);

        const tasksHtml = taskScores.map(score => {
            const displayVal = (score !== undefined && score !== null && score !== '') ? score : '-';
            const styleClass = getBadgeStyle(score);
            return `<div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs ${styleClass}">${displayVal}</div>`;
        }).join('');

        return `
            <div class="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl p-3 transition duration-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 relative">
                
                <!-- Header Info: Study Program & Student Name -->
                <div class="flex flex-col gap-0.5 min-w-[160px]">
                    <div class="flex items-center justify-between lg:justify-start gap-1.5">
                        <span class="text-[10px] font-bold tracking-wider text-sky-400 uppercase bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                            ${student.studyProgram || 'N/A'}
                        </span>
                        <span class="text-xs text-slate-400 font-mono font-bold">#${student.id}</span>
                    </div>
                    <h3 class="text-sm font-bold text-white mt-0.5 truncate">
                        ${student.name}
                    </h3>
                </div>

                <!-- Unified Stats Container (Mobile-friendly: Homework + Lectures + Activity + Total) -->
                <div class="bg-slate-900/70 rounded-lg p-2 border border-slate-700/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-1">
                    
                    <!-- Homework Section -->
                    <div class="flex items-center justify-between sm:justify-start gap-2.5 pr-0 sm:pr-2 border-b sm:border-b-0 sm:border-r border-slate-700/60 pb-2 sm:pb-0">
                        <div class="text-[11px] text-slate-300 font-medium leading-tight">
                            <div>${dict.homeworkWeekLabel} ${activeWeekObj.week})</div>
                            <div class="text-[10px] text-slate-400">${dict.tasksLabel}</div>
                        </div>
                        <div class="flex items-center gap-1">
                            ${tasksHtml}
                        </div>
                    </div>

                    <!-- Extra Stats Section (Lectures, Activity, Total in one row) -->
                    <div class="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 sm:justify-end">
                        
                        <!-- Lectures -->
                        <div class="bg-slate-800/60 rounded px-1.5 py-1 text-center min-w-[55px]">
                            <div class="text-[8px] sm:text-[9px] text-slate-400 uppercase font-semibold truncate">${dict.lecturesLabel}</div>
                            <div class="text-xs font-bold text-slate-200 mt-0.5">${student.lectureAttendance ?? 0}</div>
                        </div>

                        <!-- Activity -->
                        <div class="bg-slate-800/60 rounded px-1.5 py-1 text-center min-w-[60px]">
                            <div class="text-[8px] sm:text-[9px] text-slate-400 uppercase font-semibold truncate">${dict.activityLabel}</div>
                            <div class="text-xs font-bold text-slate-200 mt-0.5">${student.activityPoints ?? 0}</div>
                        </div>

                        <!-- Total -->
                        <div class="bg-sky-500/10 border border-sky-500/30 rounded px-1.5 py-1 text-center min-w-[60px]">
                            <div class="text-[8px] sm:text-[9px] text-sky-400 uppercase font-bold truncate">${dict.totalLabel}</div>
                            <div class="text-xs font-bold text-sky-300 mt-0.5">${student.totalPoints ?? 0}</div>
                        </div>

                    </div>

                </div>

            </div>
        `;
    }).join('');
}

function drawDonutChart(canvasId, value, total, color, instanceRef) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const remainder = Math.max(0, total - value);

    if (instanceRef) instanceRef.destroy();

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [value, remainder],
                backgroundColor: [color, '#334155'],
                borderWidth: 0,
                hoverOffset: 2
            }]
        },
        options: {
            cutout: '74%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            },
            animation: { duration: 600 }
        }
    });
}

// 1. Гистограмма распределения баллов за неделю (Bar Chart)
function renderScoreDistChart(students) {
    const ctx = document.getElementById('chart-score-dist').getContext('2d');
    const dist = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

    students.forEach(s => {
        const raw = s.raw || {};
        const sum = activeWeekObj.keys.reduce((acc, k) => acc + Number(raw[k] || 0), 0);
        const key = Math.min(9, Math.max(0, sum));
        dist[key] = (dist[key] || 0) + 1;
    });

    if (scoreDistChartInstance) scoreDistChartInstance.destroy();

    scoreDistChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            datasets: [{
                data: Object.values(dist),
                backgroundColor: '#6366f1',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { grid: { color: '#334155' }, ticks: { precision: 0, font: { size: 10 } } }
            }
        }
    });
}

// 2. Линейный график динамики по неделям (Line Chart)
function renderWeeklyTrendChart(students) {
    const ctx = document.getElementById('chart-weekly-trend').getContext('2d');
    
    const labels = [];
    const avgData = [];

    WEEKS_MAPPING.forEach(wObj => {
        let weekSum = 0;
        let activeCount = 0;

        students.forEach(s => {
            const raw = s.raw || {};
            const scores = wObj.keys.map(k => raw[k]).filter(v => v !== undefined && v !== null && v !== '');
            if (scores.length > 0) {
                const sum = scores.reduce((a, b) => a + Number(b), 0);
                weekSum += sum;
                activeCount++;
            }
        });

        if (activeCount > 0) {
            labels.push(`W${wObj.week}`);
            avgData.push((weekSum / activeCount).toFixed(1));
        }
    });

    if (weeklyTrendChartInstance) weeklyTrendChartInstance.destroy();

    weeklyTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: avgData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { grid: { color: '#334155' }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

// 3. Диаграмма распределения по программам обучения (Horizontal Bar Chart)
function renderProgramDistChart(students) {
    const ctx = document.getElementById('chart-program-dist').getContext('2d');
    const progMap = {};

    students.forEach(s => {
        const prog = s.studyProgram || 'N/A';
        const raw = s.raw || {};
        const sum = activeWeekObj.keys.reduce((acc, k) => acc + Number(raw[k] || 0), 0);

        if (!progMap[prog]) {
            progMap[prog] = { totalPoints: 0, count: 0 };
        }
        progMap[prog].totalPoints += sum;
        progMap[prog].count += 1;
    });

    const labels = Object.keys(progMap);
    const avgScores = labels.map(p => (progMap[p].totalPoints / progMap[p].count).toFixed(1));

    if (programDistChartInstance) programDistChartInstance.destroy();

    programDistChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: avgScores,
                backgroundColor: '#f59e0b',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: '#334155' }, ticks: { font: { size: 10 } } },
                y: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

function updateSidebarAndStats(students) {
    if (students.length === 0) return;

    const totalCount = students.length;
    const totals = students.map(s => s.totalPoints || 0);
    const avg = (totals.reduce((a, b) => a + b, 0) / totalCount).toFixed(1);

    let countLowScore = 0;
    let countPerfectScore = 0;

    students.forEach(student => {
        const raw = student.raw || {};
        const scores = activeWeekObj.keys.map(k => raw[k]);
        
        const hasLowOrMissing = scores.some(s => {
            if (s === undefined || s === null || s === '' || s === '-') return true;
            return Number(s) <= 1;
        });

        if (hasLowOrMissing) countLowScore++;

        const isPerfect = scores.length === 3 && scores.every(s => s !== undefined && s !== null && s !== '' && Number(s) === 3);
        if (isPerfect) countPerfectScore++;
    });

    document.getElementById('stat-total').innerText = totalCount;
    document.getElementById('stat-avg').innerText = avg;

    const perfectPercent = ((countPerfectScore / totalCount) * 100).toFixed(1);
    const lowPercent = ((countLowScore / totalCount) * 100).toFixed(1);

    document.getElementById('perfect-count-text').innerText = countPerfectScore;
    document.getElementById('perfect-percent-text').innerText = `${perfectPercent}%`;

    document.getElementById('low-count-text').innerText = countLowScore;
    document.getElementById('low-percent-text').innerText = `${lowPercent}%`;

    // Render Donut Charts
    perfectChartInstance = drawDonutChart('chart-perfect', countPerfectScore, totalCount, '#10b981', perfectChartInstance);
    lowChartInstance = drawDonutChart('chart-low', countLowScore, totalCount, '#ef4444', lowChartInstance);

    // Render Additional Analytics Charts
    renderScoreDistChart(students);
    renderWeeklyTrendChart(students);
    renderProgramDistChart(students);

    // Generate Top-30 Leaderboard
    const leaderboardStudents = [...students].map(student => {
        const raw = student.raw || {};
        const scores = activeWeekObj.keys.map(k => {
            const val = raw[k];
            return (val !== undefined && val !== null && val !== '') ? Number(val) : 0;
        });
        
        const count3 = scores.filter(s => s === 3).length;
        const count2 = scores.filter(s => s === 2).length;
        const count1 = scores.filter(s => s === 1).length;
        const weeklySum = scores.reduce((a, b) => a + b, 0);

        return { ...student, scores, count3, count2, count1, weeklySum };
    });

    leaderboardStudents.sort((a, b) => {
        if (a.count3 === 3 && b.count3 !== 3) return -1;
        if (b.count3 === 3 && a.count3 !== 3) return 1;

        if (a.count2 !== b.count2) return b.count2 - a.count2;
        if (a.weeklySum !== b.weeklySum) return b.weeklySum - a.weeklySum;
        return b.totalPoints - a.totalPoints;
    });

    const top30 = leaderboardStudents.slice(0, 30);
    const leaderboardContainer = document.getElementById('leaderboard-list');

    leaderboardContainer.innerHTML = top30.map((s, index) => {
        const scoresFormatted = s.scores.map(score => {
            const style = getBadgeStyle(score);
            return `<span class="w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-[10px] ${style}">${score}</span>`;
        }).join('');

        return `
            <div class="flex items-center justify-between p-1.5 rounded-md bg-slate-900/50 border border-slate-700/40 text-xs">
                <div class="flex items-center gap-2">
                    <span class="w-4 font-bold font-mono ${index < 3 ? 'text-amber-400 text-xs' : 'text-slate-500 text-[11px]'}">
                        #${index + 1}
                    </span>
                    <span class="font-semibold text-slate-200 truncate max-w-[120px]" title="${s.name}">
                        ${s.name}
                    </span>
                </div>
                <div class="flex items-center gap-1">
                    ${scoresFormatted}
                </div>
            </div>
        `;
    }).join('');
}

async function init() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Failed to load data.json');

        allStudents = await response.json();
        activeWeekObj = detectLatestWeek(allStudents);

        applyLanguage();
        updateSidebarAndStats(allStudents);
        renderStudents(allStudents);

    } catch (err) {
        console.error(err);
        const dict = i18n[currentLang];
        document.getElementById('students-container').innerHTML = `
            <div class="text-center py-8 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
                <i class="fa-solid fa-triangle-exclamation text-2xl mb-1.5"></i>
                <p class="text-xs">${dict.loadingError}: ${err.message}</p>
            </div>`;
    }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentLang = e.target.getAttribute('data-lang');
        localStorage.setItem('appLang', currentLang);
        applyLanguage();
        renderStudents(allStudents);
        updateSidebarAndStats(allStudents);
    });
});

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const filtered = allStudents.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.studyProgram && s.studyProgram.toLowerCase().includes(query)) ||
        s.id.toString().includes(query)
    );
    renderStudents(filtered);
}

const searchInput = document.getElementById('search-input');
if (searchInput) searchInput.addEventListener('input', handleSearch);

const searchInputMobile = document.getElementById('search-input-mobile');
if (searchInputMobile) searchInputMobile.addEventListener('input', handleSearch);

document.addEventListener('DOMContentLoaded', init);