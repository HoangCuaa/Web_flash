// js/app.js — Frontend Quiz Client Orchestrator (Bootstrap & Mode Switching)
import { API_BASE, FALLBACK_QUIZ } from './config.js';
import { playSound } from './audio.js';
import { initUserSession } from './auth.js';
import { loadQuizIntoState } from './quiz.js';
import { renderIcons } from './ui.js';
import './room.js';
import './leaderboard.js';

let publicQuizzes = [];

export function switchMode(mode) {
    playSound('click');
    const btnSolo = document.getElementById('tabModeSolo') || document.getElementById('tabBtnSolo');
    const btnRoom = document.getElementById('tabModeMulti') || document.getElementById('tabBtnRoom');
    const panelSolo = document.getElementById('soloModeCard') || document.getElementById('soloModePanel');
    const panelRoom = document.getElementById('multiModeCard') || document.getElementById('roomModePanel');

    if (!btnSolo || !btnRoom || !panelSolo || !panelRoom) return;

    if (mode === 'solo') {
        btnSolo.className = 'flex-1 py-2 font-black border-3 border-black bg-neoYellow text-black text-xs sm:text-sm uppercase brutal-shadow-sm flex items-center justify-center gap-1.5';
        btnRoom.className = 'flex-1 py-2 font-black border-3 border-black bg-white dark:bg-darkCard text-gray-700 dark:text-gray-300 text-xs sm:text-sm uppercase brutal-shadow-sm flex items-center justify-center gap-1.5';
        panelSolo.classList.remove('hidden');
        panelRoom.classList.add('hidden');
    } else {
        btnRoom.className = 'flex-1 py-2 font-black border-3 border-black bg-neoCyan text-black text-xs sm:text-sm uppercase brutal-shadow-sm flex items-center justify-center gap-1.5';
        btnSolo.className = 'flex-1 py-2 font-black border-3 border-black bg-white dark:bg-darkCard text-gray-700 dark:text-gray-300 text-xs sm:text-sm uppercase brutal-shadow-sm flex items-center justify-center gap-1.5';
        panelRoom.classList.remove('hidden');
        panelSolo.classList.add('hidden');
    }
    renderIcons();
}

export function toggleDarkMode() {
    playSound('click');
    document.documentElement.classList.toggle('dark');
}

export async function loadPublicQuizzes() {
    const dropdown = document.getElementById('quizSelectDropdown');
    const roomDropdown = document.getElementById('roomQuizSelectDropdown');
    if (!dropdown) return;

    try {
        const res = await fetch(`${API_BASE}/quizzes`);
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
            publicQuizzes = data.data;
            const optionsHtml = publicQuizzes.map((q) => `
                <option value="${q.id}">${q.title} (${q.questionCount || 4} câu)</option>
            `).join('');

            dropdown.innerHTML = optionsHtml;
            if (roomDropdown) roomDropdown.innerHTML = optionsHtml;
            handleQuizChange(publicQuizzes[0].id);

            // Tải bộ câu hỏi đầu tiên vào giao diện
            loadSelectedQuizIntoPreview(publicQuizzes[0].id);
        } else {
            useFallbackQuiz();
        }
    } catch {
        useFallbackQuiz();
    }
}

function useFallbackQuiz() {
    const dropdown = document.getElementById('quizSelectDropdown');
    const roomDropdown = document.getElementById('roomQuizSelectDropdown');
    const html = `<option value="${FALLBACK_QUIZ.id}">${FALLBACK_QUIZ.title} (4 câu)</option>`;
    if (dropdown) dropdown.innerHTML = html;
    if (roomDropdown) roomDropdown.innerHTML = html;
    publicQuizzes = [FALLBACK_QUIZ];
    loadQuizIntoState(FALLBACK_QUIZ);
}

export function handleQuizChange(quizId) {
    const quiz = publicQuizzes.find((q) => q.id === quizId);
    const metaInfo = document.getElementById('quizMetaInfo');
    if (quiz && metaInfo) {
        metaInfo.innerHTML = `
            <span class="bg-blue-100 dark:bg-blue-950 px-2 py-0.5 border border-black">🏷️ ${quiz.category || 'Chung'}</span>
            <span class="bg-yellow-100 dark:bg-yellow-950 px-2 py-0.5 border border-black">❓ ${quiz.questionCount || quiz.questions?.length || 4} câu</span>
            <span class="bg-purple-100 dark:bg-purple-950 px-2 py-0.5 border border-black">⏱️ ${quiz.timePerQuestion || 20}s / câu</span>
        `;
    }
}

async function loadSelectedQuizIntoPreview(quizId) {
    try {
        const res = await fetch(`${API_BASE}/quizzes/${quizId}`);
        const data = await res.json();
        if (res.ok && data.success && data.data.questions?.length > 0) {
            const quiz = data.data;
            loadQuizIntoState({
                id: quiz.id,
                title: quiz.title,
                questions: quiz.questions.map((q) => ({
                    id: q.id,
                    question: q.content,
                    options: (q.options || []).map((opt) => (typeof opt === 'string' ? opt : opt.content)),
                    rawOptions: q.options || [],
                    correct: q.correctIndex !== undefined ? q.correctIndex : ((q.options || []).findIndex((opt) => opt.is_correct === true) >= 0 ? (q.options || []).findIndex((opt) => opt.is_correct === true) : 0),
                })),
            });
        } else {
            loadQuizIntoState(FALLBACK_QUIZ);
        }
    } catch {
        loadQuizIntoState(FALLBACK_QUIZ);
    }
}

// Gắn global cho onclick html
window.switchMode = switchMode;
window.toggleDarkMode = toggleDarkMode;
window.handleQuizChange = handleQuizChange;

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    initUserSession();
    loadPublicQuizzes();
    renderIcons();

    const quizDropdown = document.getElementById('quizSelectDropdown');
    if (quizDropdown) {
        quizDropdown.addEventListener('change', (e) => {
            handleQuizChange(e.target.value);
            loadSelectedQuizIntoPreview(e.target.value);
        });
    }

    const roomDropdown = document.getElementById('roomQuizSelectDropdown');
    if (roomDropdown) {
        roomDropdown.addEventListener('change', (e) => {
            handleQuizChange(e.target.value);
        });
    }
});
