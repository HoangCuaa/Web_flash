// admin.js — Logic quản trị hệ thống Quiz (Neubrutalism Admin)

const API_BASE = '/api/v1';

let currentAdminSecret = sessionStorage.getItem('quiz_admin_secret') || '';
let importedQuizCache = null;

// ─────────────────────────────────────────────────────
// KHỞI ĐỘNG TRANG ADMIN
// ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (currentAdminSecret) {
        verifyAdminSession();
    } else {
        showLoginView();
    }

    // Khởi tạo ít nhất 1 câu hỏi trong Question Builder
    addNewQuestionBlock();
});

function getAdminHeaders() {
    return {
        'Content-Type': 'application/json',
        'x-admin-key': currentAdminSecret,
    };
}

// ─────────────────────────────────────────────────────
// XÁC THỰC ADMIN SECRET
// ─────────────────────────────────────────────────────
window.handleAdminLogin = async function (e) {
    if (e) e.preventDefault();
    const input = document.getElementById('adminSecretInput');
    const secret = input.value.trim();
    const errorEl = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');

    if (!secret) return;

    loginBtn.disabled = true;
    loginBtn.innerText = 'Đang kiểm tra...';
    errorEl.classList.add('hidden');

    try {
        const res = await fetch(`${API_BASE}/admin/stats`, {
            method: 'GET',
            headers: { 'x-admin-key': secret },
        });

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const rawText = await res.text();
            throw new Error(`Máy chủ phản hồi mã lỗi ${res.status}: ${rawText.slice(0, 80) || 'Không có nội dung'}`);
        }

        const data = await res.json();

        if (res.ok && data.success) {
            currentAdminSecret = secret;
            sessionStorage.setItem('quiz_admin_secret', secret);
            showDashboardView();
            loadDashboardStats(data.data);
            loadQuizzesList();
        } else {
            errorEl.innerText = data.error?.message || 'Mã ADMIN_SECRET không chính xác!';
            errorEl.classList.remove('hidden');
        }
    } catch (err) {
        errorEl.innerText = 'Không thể kết nối đến máy chủ: ' + err.message;
        errorEl.classList.remove('hidden');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerText = 'Xác Thực ▶';
    }
};

async function verifyAdminSession() {
    try {
        const res = await fetch(`${API_BASE}/admin/stats`, {
            method: 'GET',
            headers: getAdminHeaders(),
        });
        const data = await res.json();

        if (res.ok && data.success) {
            showDashboardView();
            loadDashboardStats(data.data);
            loadQuizzesList();
        } else {
            handleAdminLogout();
        }
    } catch {
        handleAdminLogout();
    }
}

window.handleAdminLogout = function () {
    currentAdminSecret = '';
    sessionStorage.removeItem('quiz_admin_secret');
    showLoginView();
};

function showLoginView() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
}

function showDashboardView() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
}

// ─────────────────────────────────────────────────────
// CHUYỂN TABS
// ─────────────────────────────────────────────────────
window.switchTab = function (tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-neoYellow', 'text-black');
        btn.classList.add('bg-white', 'dark:bg-darkCard', 'text-black', 'dark:text-white');
    });

    const activeBtn = document.getElementById(`tabBtn-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-neoYellow', 'text-black');
        activeBtn.classList.remove('bg-white', 'dark:bg-darkCard', 'text-white');
    }

    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.add('hidden');
    });

    const activePane = document.getElementById(`tabContent-${tabName}`);
    if (activePane) {
        activePane.classList.remove('hidden');
        activePane.classList.add('pop-in');
    }

    if (tabName === 'quizzes') loadQuizzesList();
    if (tabName === 'leaderboard') loadAdminLeaderboard();
};

// ─────────────────────────────────────────────────────
// THỐNG KÊ DASHBOARD
// ─────────────────────────────────────────────────────
async function loadDashboardStats(cachedStats = null) {
    try {
        let stats = cachedStats;
        if (!stats) {
            const res = await fetch(`${API_BASE}/admin/stats`, {
                headers: getAdminHeaders(),
            });
            const data = await res.json();
            if (data.success) stats = data.data;
        }

        if (stats) {
            document.getElementById('statTotalQuizzes').innerText = stats.totalQuizzes ?? 0;
            document.getElementById('statTotalQuestions').innerText = stats.totalQuestions ?? 0;
            document.getElementById('statTotalRooms').innerText = stats.totalRooms ?? 0;
            document.getElementById('statTotalAttempts').innerText = stats.totalAttempts ?? 0;
        }
    } catch (e) {
        console.error('Không thể tải thống kê:', e);
    }
}

// ─────────────────────────────────────────────────────
// QUẢN LÝ DANH SÁCH QUIZ
// ─────────────────────────────────────────────────────
window.loadQuizzesList = async function () {
    const tbody = document.getElementById('quizzesTableBody');
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500">Đang tải danh sách câu hỏi...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/admin/quizzes`, {
            headers: getAdminHeaders(),
        });
        const data = await res.json();

        if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center font-bold">Chưa có bộ quiz nào trong hệ thống. Hãy bấm tab "Tạo Quiz Mới" hoặc "Import".</td></tr>`;
            return;
        }

        tbody.innerHTML = data.data.map(q => {
            const created = q.createdAt ? new Date(q.createdAt).toLocaleDateString('vi-VN') : '—';
            return `
                <tr class="hover:bg-yellow-50 dark:hover:bg-gray-800 transition-colors">
                    <td class="p-3 sm:p-4 font-bold">${q.title}</td>
                    <td class="p-3 sm:p-4"><span class="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 border border-black text-xs font-bold">${q.category || 'Chung'}</span></td>
                    <td class="p-3 sm:p-4 font-bold text-blue-600">${q.questionCount} câu</td>
                    <td class="p-3 sm:p-4">${q.timePerQuestion}s</td>
                    <td class="p-3 sm:p-4 text-xs text-gray-500">${created}</td>
                    <td class="p-3 sm:p-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="viewQuizDetail('${q.id}')"
                                class="bg-neoCyan text-black font-bold border-2 border-black px-2.5 py-1 brutal-shadow-sm brutal-hover text-xs uppercase">
                                👁 Xem
                            </button>
                            <button onclick="deleteQuiz('${q.id}', '${q.title.replace(/'/g, "\\'")}')"
                                class="bg-red-400 text-black font-bold border-2 border-black px-2.5 py-1 brutal-shadow-sm brutal-hover text-xs uppercase">
                                🗑 Xóa
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        loadDashboardStats();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-500 font-bold">Lỗi khi tải quiz: ${err.message}</td></tr>`;
    }
};

window.viewQuizDetail = async function (quizId) {
    try {
        const res = await fetch(`${API_BASE}/admin/quizzes?id=${quizId}`, {
            headers: getAdminHeaders(),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message);

        const quiz = data.data;
        document.getElementById('modalQuizTitle').innerText = quiz.title;

        const questionsListEl = document.getElementById('modalQuizQuestions');
        if (!quiz.questions || quiz.questions.length === 0) {
            questionsListEl.innerHTML = `<p class="text-center p-4">Bộ quiz này chưa có câu hỏi.</p>`;
        } else {
            questionsListEl.innerHTML = quiz.questions.map((q, qIdx) => {
                const optionsHtml = (q.question_options || []).map((opt, oIdx) => {
                    const isCorrect = opt.is_correct;
                    const letter = ['A', 'B', 'C', 'D'][oIdx] || (oIdx + 1);
                    return `
                        <div class="p-2 border-2 border-black font-medium text-sm flex items-center justify-between ${isCorrect ? 'bg-green-300 dark:bg-green-950 font-bold' : 'bg-white dark:bg-gray-800'}">
                            <span><strong>${letter}.</strong> ${opt.content}</span>
                            ${isCorrect ? '<span class="text-xs bg-black text-white px-2 py-0.5 font-bold">ĐÁP ÁN ĐÚNG ✅</span>' : ''}
                        </div>
                    `;
                }).join('');

                return `
                    <div class="border-2 border-black p-4 bg-gray-50 dark:bg-gray-900 brutal-shadow-sm">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-bold text-base">Câu ${qIdx + 1}: ${q.content}</h4>
                            <span class="text-xs font-bold bg-yellow-300 text-black px-2 py-0.5 border border-black">${q.points || 100} điểm</span>
                        </div>
                        <div class="space-y-2 mt-3">${optionsHtml}</div>
                        ${q.explanation ? `<p class="mt-2 text-xs italic text-gray-500 dark:text-gray-400">💡 Giải thích: ${q.explanation}</p>` : ''}
                    </div>
                `;
            }).join('');
        }

        document.getElementById('quizDetailModal').classList.remove('hidden');
    } catch (err) {
        alert('Lỗi tải chi tiết quiz: ' + err.message);
    }
};

window.closeQuizDetailModal = function () {
    document.getElementById('quizDetailModal').classList.add('hidden');
};

window.deleteQuiz = async function (quizId, quizTitle) {
    if (!confirm(`Bạn có chắc chắn muốn XÓA bộ câu hỏi "${quizTitle}" không?\nThao tác này sẽ xóa toàn bộ câu hỏi và kết quả liên quan!`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/admin/quizzes?id=${quizId}`, {
            method: 'DELETE',
            headers: getAdminHeaders(),
        });
        const data = await res.json();
        if (data.success) {
            alert('Đã xóa bộ quiz thành công!');
            loadQuizzesList();
        } else {
            alert('Lỗi khi xóa: ' + (data.error?.message || 'Thao tác thất bại'));
        }
    } catch (err) {
        alert('Lỗi kết nối: ' + err.message);
    }
};

// ─────────────────────────────────────────────────────
// TẠO QUIZ THỦ CÔNG (QUESTION BUILDER)
// ─────────────────────────────────────────────────────
let questionCounter = 0;

window.addNewQuestionBlock = function () {
    questionCounter++;
    const container = document.getElementById('questionsBuilderContainer');
    const qIndex = questionCounter;

    const block = document.createElement('div');
    block.id = `qBlock_${qIndex}`;
    block.className = 'border-3 border-black p-4 sm:p-5 bg-gray-50 dark:bg-gray-900 brutal-shadow-sm pop-in space-y-3';
    block.innerHTML = `
        <div class="flex justify-between items-center border-b-2 border-black pb-2">
            <span class="font-extrabold uppercase text-sm bg-neoYellow px-2 py-0.5 border border-black">Câu hỏi #${qIndex}</span>
            <button type="button" onclick="removeQuestionBlock(${qIndex})" class="text-xs bg-red-400 text-black font-black px-2 py-1 border border-black brutal-hover uppercase">
                ✕ Xóa
            </button>
        </div>

        <div>
            <label class="block font-bold text-xs uppercase mb-1">Nội dung câu hỏi *:</label>
            <input type="text" class="q-content w-full p-2.5 border-2 border-black font-bold bg-white dark:bg-gray-800" required placeholder="Nhập câu hỏi tại đây..." />
        </div>

        <div class="space-y-2 pt-1">
            <label class="block font-bold text-xs uppercase text-gray-700 dark:text-gray-300">
                Các phương án trả lời (Tick vào nút tròn để chọn đáp án đúng):
            </label>
            ${[0, 1, 2, 3].map(i => {
                const letter = ['A', 'B', 'C', 'D'][i];
                return `
                    <div class="flex items-center gap-2">
                        <label class="flex items-center gap-1 font-bold text-xs cursor-pointer">
                            <input type="radio" name="correct_${qIndex}" value="${i}" ${i === 0 ? 'checked' : ''} class="w-4 h-4 border-2 border-black accent-green-600" />
                            <span>${letter}</span>
                        </label>
                        <input type="text" class="q-opt-${i} flex-grow p-2 border-2 border-black text-sm bg-white dark:bg-gray-800" required placeholder="Nội dung phương án ${letter}..." />
                    </div>
                `;
            }).join('')}
        </div>

        <div class="pt-1">
            <label class="block font-bold text-xs uppercase mb-1 text-gray-500">Giải thích đáp án (tùy chọn):</label>
            <input type="text" class="q-explanation w-full p-2 border border-black text-xs bg-white dark:bg-gray-800" placeholder="Giải thích lý do tại sao đáp án này đúng..." />
        </div>
    `;

    container.appendChild(block);
    updateQuestionBadge();
};

window.removeQuestionBlock = function (id) {
    const el = document.getElementById(`qBlock_${id}`);
    if (el) el.remove();
    updateQuestionBadge();
};

function updateQuestionBadge() {
    const count = document.querySelectorAll('#questionsBuilderContainer > div').length;
    const badge = document.getElementById('questionCountBadge');
    if (badge) badge.innerText = count;
}

window.handleCreateQuiz = async function (e) {
    e.preventDefault();
    const saveBtn = document.getElementById('saveQuizBtn');

    const title = document.getElementById('newQuizTitle').value.trim();
    const category = document.getElementById('newQuizCategory').value.trim() || 'Chung';
    const timePerQuestion = parseInt(document.getElementById('newQuizTime').value, 10) || 20;
    const description = document.getElementById('newQuizDescription').value.trim();

    const blocks = document.querySelectorAll('#questionsBuilderContainer > div');
    if (blocks.length === 0) {
        alert('Vui lòng thêm ít nhất 1 câu hỏi!');
        return;
    }

    const questions = [];
    for (const b of blocks) {
        const content = b.querySelector('.q-content').value.trim();
        const opt0 = b.querySelector('.q-opt-0').value.trim();
        const opt1 = b.querySelector('.q-opt-1').value.trim();
        const opt2 = b.querySelector('.q-opt-2').value.trim();
        const opt3 = b.querySelector('.q-opt-3').value.trim();
        const selectedRadio = b.querySelector('input[type="radio"]:checked');
        const correctIdx = selectedRadio ? parseInt(selectedRadio.value, 10) : 0;
        const explanation = b.querySelector('.q-explanation').value.trim();

        if (!content || !opt0 || !opt1) {
            alert('Mỗi câu hỏi cần có ít nhất nội dung và 2 phương án A, B!');
            return;
        }

        const options = [opt0, opt1, opt2, opt3].filter(Boolean);

        questions.push({
            content,
            questionType: 'multiple_choice',
            points: 100,
            explanation,
            options: options.map((optText, idx) => ({
                content: optText,
                isCorrect: idx === correctIdx,
            })),
        });
    }

    saveBtn.disabled = true;
    saveBtn.innerText = 'Đang lưu quiz...';

    try {
        const res = await fetch(`${API_BASE}/admin/quizzes`, {
            method: 'POST',
            headers: getAdminHeaders(),
            body: JSON.stringify({
                title,
                category,
                timePerQuestion,
                description,
                questions,
            }),
        });
        const data = await res.json();

        if (data.success) {
            alert(`🎉 Tạo thành công bộ quiz "${title}" với ${questions.length} câu hỏi!`);
            document.getElementById('createQuizForm').reset();
            document.getElementById('questionsBuilderContainer').innerHTML = '';
            questionCounter = 0;
            addNewQuestionBlock();
            switchTab('quizzes');
        } else {
            alert('Lỗi tạo quiz: ' + (data.error?.message || 'Thất bại'));
        }
    } catch (err) {
        alert('Lỗi kết nối: ' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = '💾 Lưu Bộ Quiz Lên Database';
    }
};

// ─────────────────────────────────────────────────────
// IMPORT FILE WORD (.DOCX) HOẶC JSON TRONG ADMIN
// ─────────────────────────────────────────────────────
window.handleAdminJsonUpload = function (fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            let data;
            if (file.name.endsWith('.js')) {
                // eslint-disable-next-line no-new-func
                const fn = new Function(e.target.result + '\nreturn typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : null;');
                data = fn();
            } else {
                data = JSON.parse(e.target.result);
            }

            const questions = Array.isArray(data) ? data : data.questions;
            if (!questions || questions.length === 0) {
                throw new Error('Không tìm thấy danh sách câu hỏi trong file.');
            }

            setupImportPreview(file.name.replace(/\.[^/.]+$/, ''), questions);
        } catch (err) {
            alert('Lỗi đọc file JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
};

window.handleAdminDocxUpload = async function (fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    if (typeof JSZip === 'undefined') {
        alert('Thiếu thư viện JSZip để đọc file Word.');
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const xmlFile = zip.file('word/document.xml');
        if (!xmlFile) throw new Error('File không đúng cấu trúc Word docx.');

        const xmlText = await xmlFile.async('text');
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
        const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const paragraphs = Array.from(xmlDoc.getElementsByTagNameNS(NS, 'p'));

        const parsedQuestions = [];
        let cur = null;

        paragraphs.forEach(p => {
            const runs = Array.from(p.getElementsByTagNameNS(NS, 'r'));
            let lineText = '';
            let isRedLine = false;

            runs.forEach(r => {
                const rPr = r.getElementsByTagNameNS(NS, 'rPr')[0];
                let isRed = false;
                if (rPr) {
                    const colorEl = rPr.getElementsByTagNameNS(NS, 'color')[0];
                    if (colorEl) {
                        const val = (colorEl.getAttributeNS(NS, 'val') || colorEl.getAttribute('w:val') || '').toLowerCase();
                        if (val === 'ff0000' || val === 'red' || val.startsWith('e') || val.startsWith('f')) isRed = true;
                    }
                }
                const textNodes = Array.from(r.getElementsByTagNameNS(NS, 't'));
                textNodes.forEach(t => {
                    lineText += t.textContent;
                });
                if (isRed) isRedLine = true;
            });

            lineText = lineText.trim();
            if (!lineText) return;

            // Kiểm tra câu hỏi: Câu 1:, 1., Câu 2...
            const qMatch = lineText.match(/^\s*(?:Câu\s*)?(\d+)\s*[\.\)\-:]\s*(.+)$/i);
            if (qMatch) {
                if (cur && cur.options.length > 0) parsedQuestions.push(cur);
                cur = { question: qMatch[2].trim(), options: [], correct: 0 };
                return;
            }

            // Kiểm tra phương án: A., B., a. ...
            const optMatch = lineText.match(/^\s*([A-D])\s*[\.\)\-:]\s*(.+)$/i);
            if (optMatch && cur) {
                const optText = optMatch[2].trim();
                cur.options.push(optText);
                if (isRedLine) {
                    cur.correct = cur.options.length - 1;
                }
            }
        });

        if (cur && cur.options.length > 0) parsedQuestions.push(cur);

        if (parsedQuestions.length === 0) {
            alert('Không phân tích được câu hỏi nào từ file Word. Hãy đảm bảo file có các mục như "Câu 1:" và "A. / B."!');
            return;
        }

        setupImportPreview(file.name.replace(/\.[^/.]+$/, ''), parsedQuestions);
    } catch (err) {
        alert('Lỗi đọc file docx: ' + err.message);
    }
};

function setupImportPreview(defaultTitle, questions) {
    importedQuizCache = questions;
    document.getElementById('importQuizTitle').value = defaultTitle || 'Bộ Quiz Mới';
    document.getElementById('importQuestionCount').innerText = questions.length;

    const listEl = document.getElementById('importQuestionsPreviewList');
    listEl.innerHTML = questions.slice(0, 50).map((q, idx) => {
        const correctText = q.options[q.correct] || q.options[0] || '—';
        return `
            <div class="p-3 border border-black bg-white dark:bg-gray-800 text-xs font-medium">
                <p class="font-bold">Câu ${idx + 1}: ${q.question}</p>
                <p class="text-green-600 dark:text-green-400 font-bold mt-1">✔ Đáp án đúng: ${correctText}</p>
                <p class="text-gray-500 mt-0.5">Số lựa chọn: ${q.options.length}</p>
            </div>
        `;
    }).join('') + (questions.length > 50 ? `<p class="text-center font-bold text-xs p-2">...và còn ${questions.length - 50} câu hỏi khác.</p>` : '');

    document.getElementById('importPreviewArea').classList.remove('hidden');
    document.getElementById('importPreviewArea').classList.add('pop-in');
}

window.saveImportedQuizToDB = async function () {
    if (!importedQuizCache || importedQuizCache.length === 0) return;

    const title = document.getElementById('importQuizTitle').value.trim() || 'Bộ Quiz Import';
    const category = document.getElementById('importQuizCategory').value.trim() || 'Imported';
    const btn = document.getElementById('confirmImportBtn');

    btn.disabled = true;
    btn.innerText = 'Đang đẩy lên database...';

    const formattedQuestions = importedQuizCache.map(q => ({
        content: q.question,
        questionType: 'multiple_choice',
        points: 100,
        options: (q.options || []).map((optText, oIdx) => ({
            content: typeof optText === 'string' ? optText : (optText.content || ''),
            isCorrect: oIdx === (q.correct || 0),
        })),
    }));

    try {
        const res = await fetch(`${API_BASE}/admin/quizzes`, {
            method: 'POST',
            headers: getAdminHeaders(),
            body: JSON.stringify({
                title,
                category,
                timePerQuestion: 20,
                questions: formattedQuestions,
            }),
        });
        const data = await res.json();

        if (data.success) {
            alert(`🎉 Import thành công "${title}" với ${formattedQuestions.length} câu hỏi vào Supabase Database!`);
            importedQuizCache = null;
            document.getElementById('importPreviewArea').classList.add('hidden');
            switchTab('quizzes');
        } else {
            alert('Lỗi import: ' + (data.error?.message || 'Thất bại'));
        }
    } catch (err) {
        alert('Lỗi kết nối: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = '🚀 Xác Nhận Lưu Vào Database';
    }
};

// ─────────────────────────────────────────────────────
// BẢNG XẾP HẠNG ADMIN
// ─────────────────────────────────────────────────────
window.loadAdminLeaderboard = async function () {
    const tbody = document.getElementById('leaderboardTableBody');
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-500">Đang tải bảng xếp hạng...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/leaderboard/global?limit=50`);
        const data = await res.json();

        if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center font-bold">Chưa có kết quả thi nào được ghi nhận.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.data.map((item, idx) => {
            const finished = item.finishedAt ? new Date(item.finishedAt).toLocaleString('vi-VN') : '—';
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return `
                <tr class="hover:bg-green-50 dark:hover:bg-gray-800 transition-colors">
                    <td class="p-3 sm:p-4 text-center font-black text-base">${medal}</td>
                    <td class="p-3 sm:p-4 font-bold">${item.nickname}</td>
                    <td class="p-3 sm:p-4 font-black text-green-600 dark:text-green-400">${item.score} điểm</td>
                    <td class="p-3 sm:p-4 font-bold">${item.totalCorrect} câu</td>
                    <td class="p-3 sm:p-4 text-xs text-gray-500">${finished}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold">Lỗi tải BXH: ${err.message}</td></tr>`;
    }
};

// ─────────────────────────────────────────────────────
// DARK MODE
// ─────────────────────────────────────────────────────
window.toggleDarkMode = function () {
    document.documentElement.classList.toggle('dark');
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
});
