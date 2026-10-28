// js/leaderboard.js — Quản lý Bảng Xếp Hạng Toàn Hệ Thống (Modal, Tabs & Time Format)
import { API_BASE } from './config.js';
import { playSound } from './audio.js';
import { getCurrentUser } from './auth.js';
import { renderIcons } from './ui.js';

let currentLeaderboardTab = 'global';

export function formatDuration(sec) {
    if (!sec || isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function openLeaderboardModal() {
    playSound('click');
    document.getElementById('leaderboardModal')?.classList.remove('hidden');
    fetchLeaderboardData();
}

export function closeLeaderboardModal() {
    document.getElementById('leaderboardModal')?.classList.add('hidden');
}

export function switchLeaderboardTab(tab) {
    playSound('click');
    currentLeaderboardTab = tab;
    const btnG = document.getElementById('lbTabGlobal');
    const btnD = document.getElementById('lbTabDaily');
    if (btnG && btnD) {
        if (tab === 'global') {
            btnG.className = 'px-2.5 py-1 text-xs font-black border-2 border-black bg-neoYellow text-black brutal-shadow-sm';
            btnD.className = 'px-2.5 py-1 text-xs font-black border-2 border-black bg-white dark:bg-gray-800 text-black dark:text-white';
        } else {
            btnD.className = 'px-2.5 py-1 text-xs font-black border-2 border-black bg-neoYellow text-black brutal-shadow-sm';
            btnG.className = 'px-2.5 py-1 text-xs font-black border-2 border-black bg-white dark:bg-gray-800 text-black dark:text-white';
        }
    }
    fetchLeaderboardData();
}

export async function fetchLeaderboardData() {
    const listEl = document.getElementById('leaderboardModalList');
    if (listEl) {
        listEl.innerHTML = `<p class="text-center p-4 text-gray-500 font-bold animate-pulse">Đang tải bảng xếp hạng...</p>`;
    }

    const endpoint = currentLeaderboardTab === 'daily'
        ? `${API_BASE}/leaderboard/daily?limit=25`
        : `${API_BASE}/leaderboard/global?limit=25`;

    const user = getCurrentUser();

    try {
        const res = await fetch(endpoint);
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
            let myRank = null;
            if (listEl) {
                listEl.innerHTML = data.data.map((item, idx) => {
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                    const isMe = user && (
                        (item.guestId && item.guestId === user.guestId) ||
                        (item.nickname && item.nickname.trim().toLowerCase() === user.nickname.trim().toLowerCase())
                    );
                    if (isMe && !myRank) {
                        myRank = { rank: idx + 1, score: item.score, time: formatDuration(item.durationSeconds) };
                    }
                    const timeStr = formatDuration(item.durationSeconds || item.timeSpentSeconds || 0);

                    return `
                        <div class="flex items-center justify-between p-2.5 border-2 border-black ${isMe ? 'bg-neoYellow/35 border-black font-black' : 'bg-white dark:bg-gray-800'} brutal-shadow-sm transition-transform hover:scale-[1.01]">
                            <div class="flex items-center gap-2 min-w-0">
                                <span class="w-6 text-center font-black flex-shrink-0">${medal}</span>
                                <span class="font-bold truncate text-black dark:text-white">
                                    ${item.nickname}
                                    ${isMe ? '<span class="bg-black text-white text-[10px] font-black px-1.5 py-0.5 ml-1 uppercase">BẠN</span>' : ''}
                                </span>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <span class="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-900 border border-black px-1.5 py-0.5 text-blue-700 dark:text-blue-300" title="Thời gian làm bài">
                                    ⏱️ ${timeStr}
                                </span>
                                <span class="text-xs sm:text-sm font-black text-green-600 dark:text-green-400">
                                    ${item.score}đ
                                </span>
                                <span class="text-xs text-gray-500 font-bold hidden sm:inline">
                                    (${item.totalCorrect}/${item.totalQuestions || 4})
                                </span>
                            </div>
                        </div>
                    `;
                }).join('');
                renderIcons();
            }

            const summaryEl = document.getElementById('myRankSummary');
            if (summaryEl) {
                if (myRank) {
                    summaryEl.innerHTML = `Vị trí của bạn: <b class="text-black dark:text-white">#${myRank.rank}</b> (${myRank.score}đ • ⏱️ ${myRank.time})`;
                } else if (user) {
                    summaryEl.innerHTML = `Tài khoản: <b class="text-black dark:text-white">${user.nickname}</b> (Chưa có trên Top)`;
                }
            }
        } else if (listEl) {
            listEl.innerHTML = `<p class="text-center p-4 text-gray-500 font-bold">Chưa có dữ liệu bảng xếp hạng.</p>`;
        }
    } catch (e) {
        if (listEl) {
            listEl.innerHTML = `<p class="text-center p-4 text-red-500 font-bold">Lỗi khi tải bảng xếp hạng: ${e.message}</p>`;
        }
    }
}

// Gắn global cho onclick html
window.openLeaderboardModal = openLeaderboardModal;
window.closeLeaderboardModal = closeLeaderboardModal;
window.switchLeaderboardTab = switchLeaderboardTab;
window.fetchLeaderboardData = fetchLeaderboardData;
