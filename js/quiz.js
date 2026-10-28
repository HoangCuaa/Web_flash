// js/quiz.js — Logic Chơi Quiz (Render Responsive, Timer, Nộp Bài & Chấm Điểm)
import { API_BASE, FALLBACK_QUIZ } from './config.js';
import { playSound, playStreakSound, playSadSound, fireCuteConfetti } from './audio.js';
import { getCurrentUser, getAuthHeaders } from './auth.js';
import { getCurrentRoom } from './room.js';
import { renderIcons } from './ui.js';

let activeQuizData = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];
let isCurrentAnswered = false;
let statCorrectCount = 0;
let statWrongCount = 0;
let currentStreak = 0;
let timerInterval = null;
let secondsElapsed = 0;

export function getActiveQuizData() {
    return activeQuizData;
}

export async function startSelectedQuiz() {
    playSound('click');
    const dropdown = document.getElementById('quizSelectDropdown');
    const quizId = dropdown?.value;

    if (!quizId) {
        loadQuizIntoState(FALLBACK_QUIZ);
        return;
    }

    const startBtn = document.getElementById('startQuizBtn');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.innerText = 'Đang tải...';
    }

    try {
        const res = await fetch(`${API_BASE}/quizzes/${quizId}`);
        const data = await res.json();

        if (res.ok && data.success && data.data.questions?.length > 0) {
            const quiz = data.data;
            const normalizedQuestions = quiz.questions.map((q) => ({
                id: q.id,
                question: q.content,
                options: (q.options || []).map((opt) => (typeof opt === 'string' ? opt : opt.content)),
                rawOptions: q.options || [],
                correct: q.correctIndex !== undefined ? q.correctIndex : ((q.options || []).findIndex((opt) => opt.is_correct === true) >= 0 ? (q.options || []).findIndex((opt) => opt.is_correct === true) : 0),
            }));

            loadQuizIntoState({
                id: quiz.id,
                title: quiz.title,
                questions: normalizedQuestions,
            });
        } else {
            loadQuizIntoState(FALLBACK_QUIZ);
        }
    } catch {
        loadQuizIntoState(FALLBACK_QUIZ);
    } finally {
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerText = '▶ Làm Bài';
        }
    }
}

export function loadQuizIntoState(quiz) {
    const room = getCurrentRoom();
    const isRandom = room ? false : (document.getElementById('randomToggle')?.checked || false);
    let questions = JSON.parse(JSON.stringify(quiz.questions || []));

    if (isRandom) {
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
    }

    activeQuizData = questions;
    currentQuestionIndex = 0;
    selectedAnswers = Array(activeQuizData.length).fill(null);
    isCurrentAnswered = false;
    statCorrectCount = 0;
    statWrongCount = 0;
    currentStreak = 0;

    updateStatsUI();
    startTimer();
    renderQuiz();
}

export function startTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    timerInterval = setInterval(() => {
        secondsElapsed++;
        const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
        const s = (secondsElapsed % 60).toString().padStart(2, '0');
        const timerEl = document.getElementById('timerDisplay');
        if (timerEl) timerEl.innerText = `${m}:${s}`;
    }, 1000);
}

export function updateStatsUI() {
    const elC = document.getElementById('statCorrect');
    const elW = document.getElementById('statWrong');
    const elS = document.getElementById('statStreak');
    if (elC) elC.innerText = statCorrectCount;
    if (elW) elW.innerText = statWrongCount;
    if (elS) elS.innerText = currentStreak;
}

export function renderQuiz() {
    const appElement = document.getElementById('app');
    if (!appElement || !activeQuizData || activeQuizData.length === 0) return;

    const q = activeQuizData[currentQuestionIndex];
    const totalQ = activeQuizData.length;
    const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQ) * 100);

    const optionsHtml = q.options.map((opt, index) => {
        let bgColor = 'bg-white dark:bg-darkCard';
        let textColor = 'text-gray-900 dark:text-gray-100';
        let borderColor = 'border-black dark:border-black';
        let cursorStyle = isCurrentAnswered ? 'cursor-default disabled' : 'cursor-pointer brutal-hover brutal-active';
        const letter = ['A', 'B', 'C', 'D'][index] || (index + 1);

        if (isCurrentAnswered) {
            if (index === q.correct) {
                bgColor = 'bg-neoGreen text-black font-extrabold';
                borderColor = 'border-black';
            } else if (index === selectedAnswers[currentQuestionIndex]) {
                bgColor = 'bg-red-400 text-white font-extrabold';
                borderColor = 'border-black';
            } else {
                bgColor = 'bg-gray-100 dark:bg-gray-900 opacity-50';
            }
        }

        return `
            <div class="${bgColor} ${textColor} border-2 sm:border-3 ${borderColor} ${cursorStyle} brutal-shadow-sm p-3 sm:p-4 option-touch-target flex items-center gap-3 transition-transform pop-in select-none"
                 style="animation-delay: ${index * 0.04}s;"
                 onclick="handleOptionSelect(${index})">
                <span class="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center font-black border-2 border-black bg-neoYellow text-black text-xs sm:text-sm">
                    ${letter}
                </span>
                <span class="text-sm sm:text-base font-bold leading-snug flex-grow">${opt}</span>
                ${isCurrentAnswered && index === q.correct ? '<span class="text-base sm:text-lg">✅</span>' : ''}
                ${isCurrentAnswered && index === selectedAnswers[currentQuestionIndex] && index !== q.correct ? '<span class="text-base sm:text-lg">❌</span>' : ''}
            </div>
        `;
    }).join('');

    const isLast = currentQuestionIndex === totalQ - 1;
    const actionBtnHtml = `
        <div class="flex items-center justify-between gap-3 w-full pt-2">
            ${currentQuestionIndex > 0
                ? `<button onclick="handleGoBack()" class="bg-gray-200 text-black font-extrabold border-2 border-black px-4 py-2.5 brutal-shadow-sm brutal-hover brutal-active text-xs sm:text-sm uppercase tracking-wider">
                    ◀ Câu Trước
                   </button>`
                : `<div></div>`}
            
            ${isLast
                ? `<button onclick="handleFinishQuiz()" class="bg-neoPink text-black font-black border-2 sm:border-3 border-black px-6 py-2.5 brutal-shadow-sm brutal-hover brutal-active text-xs sm:text-sm uppercase tracking-wider">
                    🏆 Xem Kết Quả
                   </button>`
                : `<button onclick="handleGoNext()" class="bg-neoCyan text-black font-black border-2 sm:border-3 border-black px-6 py-2.5 brutal-shadow-sm brutal-hover brutal-active text-xs sm:text-sm uppercase tracking-wider">
                    Tiếp Theo ▶
                   </button>`
            }
        </div>
    `;

    appElement.innerHTML = `
        <div class="w-full flex flex-col space-y-3 sm:space-y-4 pop-in">
            <div class="w-full bg-gray-200 dark:bg-gray-800 border-2 border-black h-4 overflow-hidden brutal-shadow-sm">
                <div class="bg-neoYellow h-full transition-all duration-300 border-r-2 border-black" style="width: ${progressPercent}%;"></div>
            </div>

            <div class="flex items-center justify-between text-xs sm:text-sm font-black uppercase text-gray-700 dark:text-gray-300">
                <span>Tiến Độ</span>
                <span class="bg-black text-white px-2 py-0.5">${currentQuestionIndex + 1} / ${totalQ}</span>
            </div>

            <div class="bg-white dark:bg-darkCard border-3 sm:border-4 border-black p-4 sm:p-6 brutal-shadow">
                <h2 class="text-base sm:text-lg md:text-xl font-extrabold leading-relaxed text-black dark:text-white">
                    ${q.question}
                </h2>
            </div>

            <div class="flex flex-col space-y-2.5 sm:space-y-3">
                ${optionsHtml}
            </div>

            ${actionBtnHtml}
        </div>
    `;
    renderIcons();
}

export function handleOptionSelect(index) {
    if (isCurrentAnswered) return;

    const q = activeQuizData[currentQuestionIndex];
    selectedAnswers[currentQuestionIndex] = index;
    isCurrentAnswered = true;

    const room = getCurrentRoom();
    if (room) {
        const selectedOpt = q.rawOptions ? q.rawOptions[index] : null;
        try {
            fetch(`${API_BASE}/rooms/${room.code}/answers`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    questionId: q.id || 'q1',
                    selectedOptionId: selectedOpt ? selectedOpt.id : null,
                    clientTimeTakenMs: 3000,
                }),
            }).catch((e) => console.warn('Lỗi nộp đáp án:', e));
        } catch {}
    }

    const appElement = document.getElementById('app');

    if (index === q.correct) {
        statCorrectCount++;
        currentStreak++;
        if (currentStreak >= 3) {
            playStreakSound();
            fireCuteConfetti();
            if (appElement) {
                appElement.classList.add('animate-tada');
                setTimeout(() => appElement.classList.remove('animate-tada'), 500);
            }
        } else {
            playSound('correct');
        }
    } else {
        statWrongCount++;
        if (currentStreak >= 3) {
            playSadSound();
        } else {
            playSound('wrong');
        }
        currentStreak = 0;
    }

    updateStatsUI();
    renderQuiz();
}

export function handleGoBack() {
    playSound('click');
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        isCurrentAnswered = selectedAnswers[currentQuestionIndex] !== null;
        renderQuiz();
    }
}

export function handleGoNext() {
    playSound('click');
    if (currentQuestionIndex < activeQuizData.length - 1) {
        currentQuestionIndex++;
        isCurrentAnswered = selectedAnswers[currentQuestionIndex] !== null;
        renderQuiz();
    }
}

export async function handleFinishQuiz() {
    playSound('click');
    clearInterval(timerInterval);

    const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const s = (secondsElapsed % 60).toString().padStart(2, '0');
    const totalQ = activeQuizData.length;
    const accuracy = totalQ > 0 ? Math.round((statCorrectCount / totalQ) * 100) : 0;
    const calculatedScore = (statCorrectCount * 100) + Math.max(0, (totalQ * 25) - Math.floor(secondsElapsed * 1.5));

    fireCuteConfetti();

    const appElement = document.getElementById('app');
    if (appElement) {
        appElement.innerHTML = `
            <div class="bg-white dark:bg-darkCard border-4 border-black p-6 sm:p-8 brutal-shadow text-center pop-in w-full">
                <span class="text-4xl sm:text-5xl">🎉</span>
                <h2 class="text-2xl sm:text-3xl font-black uppercase mt-2 mb-1">Hoàn Thành Xuất Sắc!</h2>
                <p class="text-sm font-bold text-gray-600 dark:text-gray-400 mb-6">
                    Thời gian làm bài: <span class="text-black dark:text-white underline font-black font-mono">⏱️ ${m}:${s}</span>
                    <span class="mx-2">•</span>
                    Điểm số: <span class="text-green-600 dark:text-green-400 font-black">${calculatedScore} điểm</span>
                </p>

                <div class="grid grid-cols-2 gap-3 mb-6">
                    <div class="p-3 border-2 border-black bg-green-100 dark:bg-green-950">
                        <p class="text-xs uppercase font-extrabold text-gray-600 dark:text-gray-400">Số câu đúng</p>
                        <p class="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400">${statCorrectCount} / ${totalQ}</p>
                    </div>
                    <div class="p-3 border-2 border-black bg-yellow-100 dark:bg-yellow-950">
                        <p class="text-xs uppercase font-extrabold text-gray-600 dark:text-gray-400">Độ chính xác</p>
                        <p class="text-2xl sm:text-3xl font-black text-yellow-600 dark:text-yellow-400">${accuracy}%</p>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onclick="startSelectedQuiz()"
                        class="bg-neoYellow text-black font-black border-2 border-black py-3 px-6 brutal-shadow-sm brutal-hover brutal-active text-sm uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Làm Lại Lượt Này
                    </button>
                    <button onclick="openLeaderboardModal()"
                        class="bg-neoGreen text-black font-black border-2 border-black py-3 px-6 brutal-shadow-sm brutal-hover brutal-active text-sm uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <i data-lucide="trophy" class="w-4 h-4"></i> Xem Bảng Xếp Hạng
                    </button>
                </div>
            </div>
        `;
        renderIcons();
    }

    const user = getCurrentUser();
    const room = getCurrentRoom();
    if (user && user.token) {
        try {
            await fetch(`${API_BASE}/players/me/history`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    quizId: activeQuizData[0]?.id || '11111111-1111-1111-1111-111111111111',
                    score: calculatedScore,
                    totalCorrect: statCorrectCount,
                    totalQuestions: totalQ,
                    durationSeconds: secondsElapsed,
                    roomCode: room ? room.code : null,
                }),
            });
        } catch (e) {
            console.warn('Lỗi ghi nhận lượt thi vào BXH:', e);
        }
    }
}

// Gắn global cho onclick html
window.startSelectedQuiz = startSelectedQuiz;
window.handleOptionSelect = handleOptionSelect;
window.handleGoBack = handleGoBack;
window.handleGoNext = handleGoNext;
window.handleFinishQuiz = handleFinishQuiz;
