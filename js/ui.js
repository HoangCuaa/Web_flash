// js/ui.js — Thư viện UI Helper (SweetAlert2 Neubrutalism Theme & Lucide Icons)

export function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

// Cấu hình SweetAlert2 theo phong cách Neubrutalism
function getSwalBase() {
    if (!window.Swal) {
        return null;
    }
    return window.Swal.mixin({
        customClass: {
            popup: 'border-4 border-black brutal-shadow font-sans bg-white dark:bg-darkCard text-black dark:text-white',
            title: 'font-black uppercase text-base sm:text-lg text-black dark:text-white tracking-wide',
            htmlContainer: 'text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300',
            confirmButton: 'bg-neoYellow text-black font-black border-2 border-black px-5 py-2.5 brutal-shadow-sm brutal-hover brutal-active text-xs sm:text-sm uppercase tracking-wider mx-1',
            cancelButton: 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-extrabold border-2 border-black px-5 py-2.5 brutal-shadow-sm brutal-hover brutal-active text-xs sm:text-sm uppercase tracking-wider mx-1',
            input: 'border-2 border-black font-black p-2.5 bg-yellow-50 dark:bg-gray-900 text-black dark:text-white text-sm w-full',
        },
        buttonsStyling: false,
    });
}

// Alert thông báo Neubrutalism
export async function brutalAlert(title, text = '', icon = 'info') {
    const swal = getSwalBase();
    if (!swal) {
        alert(`${title}\n${text}`);
        return;
    }
    return swal.fire({
        title,
        text,
        icon,
        confirmButtonText: 'ĐÃ HIỂU 👍',
    });
}

// Toast thông báo góc màn hình
export function brutalToast(title, icon = 'success') {
    if (window.Swal) {
        window.Swal.fire({
            toast: true,
            position: 'top-end',
            icon,
            title,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            customClass: {
                popup: 'border-3 border-black brutal-shadow-sm bg-white dark:bg-darkCard text-black dark:text-white font-black text-xs uppercase',
            },
        });
        return;
    }
    console.log('[TOAST]', title);
}

// Modal xác nhận Có / Không
export async function brutalConfirm(title, text = '', confirmText = 'Đồng ý', cancelText = 'Hủy bỏ') {
    const swal = getSwalBase();
    if (!swal) {
        return confirm(`${title}\n${text}`);
    }
    const result = await swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
    });
    return result.isConfirmed;
}

// Prompt nhập dữ liệu (nhập nickname mới)
export async function brutalPrompt(title, inputLabel = '', inputValue = '', placeholder = '') {
    const swal = getSwalBase();
    if (!swal) {
        return prompt(title, inputValue);
    }
    const result = await swal.fire({
        title,
        input: 'text',
        inputLabel,
        inputValue,
        inputPlaceholder: placeholder,
        showCancelButton: true,
        confirmButtonText: 'LƯU THAY ĐỔI 💾',
        cancelButtonText: 'HỦY',
        inputValidator: (value) => {
            if (!value || value.trim().length < 2) {
                return 'Biệt danh phải có tối thiểu 2 ký tự!';
            }
            if (value.trim().length > 30) {
                return 'Biệt danh tối đa 30 ký tự!';
            }
            return null;
        },
    });

    if (result.isConfirmed) {
        return result.value.trim();
    }
    return null;
}

// Gắn global
window.brutalAlert = brutalAlert;
window.brutalToast = brutalToast;
window.brutalConfirm = brutalConfirm;
window.brutalPrompt = brutalPrompt;
window.renderIcons = renderIcons;
