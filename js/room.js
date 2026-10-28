// js/room.js — Quản lý phòng thi đấu Multiplayer (Room Lobby & Realtime Polling)
import { API_BASE, FALLBACK_QUIZ } from './config.js';
import { playSound } from './audio.js';
import { getCurrentUser, getAuthHeaders } from './auth.js';
import { loadQuizIntoState } from './quiz.js';
import { brutalAlert, brutalToast, brutalConfirm, renderIcons } from './ui.js';

let currentRoom = null; // { code, roomId, isHost, status }
let roomPollingInterval = null;

export function getCurrentRoom() {
    return currentRoom;
}

export function setCurrentRoom(room) {
    currentRoom = room;
}

export async function handleCreateRoom() {
    playSound('click');
    const quizDropdown = document.getElementById('roomQuizSelectDropdown');
    const quizId = quizDropdown?.value || FALLBACK_QUIZ.id;
    const btn = document.getElementById('createRoomBtn');

    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Đang tạo phòng...';
    }

    try {
        const res = await fetch(`${API_BASE}/rooms`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                quizId,
                maxPlayers: 20,
                timePerQuestion: 20,
            }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
            currentRoom = {
                code: data.data.roomCode,
                roomId: data.data.roomId,
                quizId: data.data.quizId,
                isHost: true,
                status: 'waiting',
            };
            enterRoomLobby();
            brutalToast(`Đã tạo phòng thành công! Mã: ${data.data.roomCode}`, 'success');
        } else {
            brutalAlert('LỖI TẠO PHÒNG', data.error?.message || 'Không thể tạo phòng lúc này', 'error');
        }
    } catch (err) {
        brutalAlert('LỖI KẾT NỐI', err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = 'Tạo Phòng Mới ⚡';
        }
    }
}

export async function handleJoinRoom() {
    playSound('click');
    const input = document.getElementById('joinRoomCodeInput') || document.getElementById('roomCodeInput');
    const roomCode = input?.value?.trim().toUpperCase();

    if (!roomCode || roomCode.length < 4) {
        brutalAlert('CHÚ Ý', 'Vui lòng nhập mã phòng hợp lệ (tối thiểu 4 ký tự)!', 'warning');
        return;
    }

    const btn = document.getElementById('joinRoomBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Đang vào...';
    }

    const user = getCurrentUser();
    try {
        const res = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                nickname: user ? user.nickname : 'Người chơi',
            }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
            currentRoom = {
                code: roomCode,
                roomId: data.data.room_id,
                isHost: false,
                status: 'waiting',
            };
            enterRoomLobby();
            brutalToast(`Đã vào phòng: ${roomCode}`, 'success');
        } else {
            brutalAlert('LỖI THAM GIA', data.error?.message || 'Mã phòng không tồn tại hoặc trận đấu đã diễn ra', 'error');
        }
    } catch (err) {
        brutalAlert('LỖI KẾT NỐI', err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = 'Tham Gia ➔';
        }
    }
}

export function enterRoomLobby() {
    const lobbyCard = document.getElementById('currentRoomLobby');
    const roomCodeEl = document.getElementById('lobbyRoomCode');
    const hostBtn = document.getElementById('hostStartGameBtn');

    if (!currentRoom || !lobbyCard) return;

    lobbyCard.classList.remove('hidden');
    if (roomCodeEl) {
        roomCodeEl.innerText = currentRoom.code;
        roomCodeEl.onclick = () => {
            navigator.clipboard.writeText(currentRoom.code);
            brutalToast(`Đã sao chép mã phòng: ${currentRoom.code}!`, 'success');
        };
    }

    if (hostBtn) {
        if (currentRoom.isHost) {
            hostBtn.classList.remove('hidden');
        } else {
            hostBtn.classList.add('hidden');
        }
    }

    pollRoomState();
    clearInterval(roomPollingInterval);
    roomPollingInterval = setInterval(pollRoomState, 2500);
}

export async function pollRoomState() {
    if (!currentRoom) return;

    const user = getCurrentUser();

    try {
        // 1. Cập nhật danh sách người chơi trong phòng
        const res = await fetch(`${API_BASE}/rooms/${currentRoom.code}/players`);
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.data)) {
            const players = data.data;
            const countEl = document.getElementById('lobbyPlayerCount');
            if (countEl) countEl.innerText = players.length;

            const listEl = document.getElementById('lobbyPlayersList');
            if (listEl) {
                listEl.innerHTML = players.map((p) => `
                    <span class="bg-gray-100 dark:bg-gray-800 border border-black px-2 py-1 text-xs font-bold flex items-center gap-1">
                        🟢 ${p.nickname} ${user && p.guest_id === user.guestId ? '(Bạn)' : ''}
                    </span>
                `).join('');
            }
        }

        // 2. Kiểm tra xem chủ phòng đã bấm bắt đầu trận đấu chưa
        const stateRes = await fetch(`${API_BASE}/rooms/${currentRoom.code}/state`, {
            headers: getAuthHeaders(),
        });
        const stateData = await stateRes.json();

        if (stateRes.ok && stateData.success && stateData.data.room) {
            const r = stateData.data.room;
            const statusEl = document.getElementById('lobbyRoomStatus');
            if (statusEl) {
                statusEl.innerText = r.status === 'in_progress' ? 'Đang thi đấu' : 'Đang chờ';
            }

            // Nếu trận đấu đã bắt đầu, tự động tải câu hỏi
            if (r.status === 'in_progress') {
                clearInterval(roomPollingInterval);
                loadRoomQuestionGame();
            }
        }
    } catch (e) {
        console.error('Lỗi polling phòng:', e);
    }
}

export async function handleStartRoomGame() {
    if (!currentRoom || !currentRoom.isHost) return;
    playSound('click');

    const btn = document.getElementById('hostStartGameBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Đang bắt đầu...';
    }

    try {
        const res = await fetch(`${API_BASE}/rooms/${currentRoom.code}/start`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        const data = await res.json();

        if (res.ok && data.success) {
            clearInterval(roomPollingInterval);
            loadRoomQuestionGame();
        } else {
            alert('Không thể bắt đầu: ' + (data.error?.message || 'Lỗi không xác định'));
        }
    } catch (err) {
        alert('Lỗi kết nối: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = '▶ Bắt Đầu Trận Đấu';
        }
    }
}

export async function loadRoomQuestionGame() {
    try {
        const roomRes = await fetch(`${API_BASE}/rooms/${currentRoom.code}`);
        const roomData = await roomRes.json();

        const quizId = roomData.data?.quizId || roomData.data?.quiz_id;
        if (quizId) {
            const quizRes = await fetch(`${API_BASE}/quizzes/${quizId}`);
            const quizJson = await quizRes.json();
            if (quizJson.success && quizJson.data.questions?.length > 0) {
                const quiz = quizJson.data;
                loadQuizIntoState({
                    id: currentRoom.code,
                    title: `⚔️ Thi Đấu Phòng #${currentRoom.code} — ${quiz.title}`,
                    questions: quiz.questions.map((q) => ({
                        id: q.id,
                        question: q.content,
                        options: (q.options || []).map((opt) => (typeof opt === 'string' ? opt : opt.content)),
                        rawOptions: q.options || [],
                        correct: q.correctIndex !== undefined ? q.correctIndex : ((q.options || []).findIndex((opt) => opt.is_correct === true) >= 0 ? (q.options || []).findIndex((opt) => opt.is_correct === true) : 0),
                    })),
                });
                document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' });
                return;
            }
        }

        loadQuizIntoState(FALLBACK_QUIZ);
    } catch (e) {
        console.error('Lỗi tải câu hỏi phòng:', e);
        loadQuizIntoState(FALLBACK_QUIZ);
    }
}

export async function handleLeaveRoom() {
    const ok = await brutalConfirm('RỜI PHÒNG THI ĐẤU', 'Bạn có chắc chắn muốn rời khỏi phòng này không?', 'RỜI PHÒNG', 'Ở LẠI');
    if (ok) {
        clearInterval(roomPollingInterval);
        if (currentRoom) {
            try {
                await fetch(`${API_BASE}/rooms/${currentRoom.code}/leave`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                });
            } catch (e) {
                console.warn('Lỗi gọi API rời phòng:', e);
            }
        }
        currentRoom = null;
        document.getElementById('currentRoomLobby')?.classList.add('hidden');
        brutalToast('Đã rời phòng thi đấu', 'info');
    }
}

// Gắn global cho onclick html
window.handleCreateRoom = handleCreateRoom;
window.handleJoinRoom = handleJoinRoom;
window.handleStartRoomGame = handleStartRoomGame;
window.handleLeaveRoom = handleLeaveRoom;
