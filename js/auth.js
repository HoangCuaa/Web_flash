// js/auth.js — Quản lý danh tính khách (Guest User) & Token Authentication
import { API_BASE } from './config.js';
import { playSound } from './audio.js';
import { brutalPrompt, brutalToast } from './ui.js';

let currentUser = null; // { guestId, nickname, token, recoveryCode }

export function getCurrentUser() {
    return currentUser;
}

export function setCurrentUser(user) {
    currentUser = user;
}

export function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser && currentUser.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
        headers['x-guest-token'] = currentUser.token;
        headers['x-guest-id'] = currentUser.guestId;
    }
    return headers;
}

export function updateUserBadgeUI() {
    const el = document.getElementById('displayUserNick');
    if (el && currentUser) {
        el.innerText = currentUser.nickname;
    }
}

export async function registerGuestUser(nickname) {
    try {
        const res = await fetch(`${API_BASE}/guests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
            currentUser = data.data;
            localStorage.setItem('quiz_guest_user', JSON.stringify(currentUser));
            updateUserBadgeUI();
        } else {
            currentUser = {
                guestId: 'local-' + Date.now(),
                nickname: nickname,
                token: 'local-token-' + Date.now(),
            };
            localStorage.setItem('quiz_guest_user', JSON.stringify(currentUser));
            updateUserBadgeUI();
        }
    } catch {
        currentUser = {
            guestId: 'local-' + Date.now(),
            nickname: nickname,
            token: 'local-token-' + Date.now(),
        };
        localStorage.setItem('quiz_guest_user', JSON.stringify(currentUser));
        updateUserBadgeUI();
    }
}

export function initUserSession() {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const defaultNick = `Player_${randomSuffix}`;

    const savedUserJson = localStorage.getItem('quiz_guest_user');
    if (savedUserJson) {
        try {
            currentUser = JSON.parse(savedUserJson);
            updateUserBadgeUI();

            // Tự động kiểm tra tính hợp lệ của token với backend
            fetch(`${API_BASE}/players/me`, { headers: getAuthHeaders() })
                .then((r) => r.json())
                .then((data) => {
                    if (!data.success && currentUser) {
                        registerGuestUser(currentUser.nickname || defaultNick);
                    }
                })
                .catch(() => {});
            return;
        } catch {
            localStorage.removeItem('quiz_guest_user');
        }
    }

    registerGuestUser(defaultNick);
}

export async function promptChangeNickname() {
    playSound('click');
    const oldNick = currentUser ? currentUser.nickname : 'Người chơi';
    const newNick = await brutalPrompt('ĐỔI TÊN HIỂN THỊ', 'Nhập biệt danh mới của bạn:', oldNick, 'VD: SuperPlayer');

    if (newNick && newNick.trim() && newNick.trim() !== oldNick) {
        const trimmed = newNick.trim();
        if (currentUser && currentUser.token) {
            try {
                const res = await fetch(`${API_BASE}/players/me`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ nickname: trimmed }),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    currentUser.nickname = trimmed;
                    localStorage.setItem('quiz_guest_user', JSON.stringify(currentUser));
                    updateUserBadgeUI();
                    brutalToast(`Đã đổi tên thành: ${trimmed}`, 'success');
                    return;
                }
            } catch (e) {
                console.warn('Lỗi cập nhật tên lên server:', e);
            }
        }
        await registerGuestUser(trimmed);
        brutalToast(`Đã đổi tên thành: ${trimmed}`, 'success');
    }
}

// Gắn global cho onclick html
window.promptChangeNickname = promptChangeNickname;
