// js/audio.js — Hiệu ứng âm thanh (Web Audio API) & Confetti

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    }
}

export function playStreakSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
    });
}

export function playSadSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    [400, 350, 300, 250].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.25);
    });
}

export function fireCuteConfetti() {
    const colors = ['#FFE600', '#FF0055', '#00F0FF', '#00FF66', '#000000'];
    for (let i = 0; i < 40; i++) {
        const el = document.createElement('div');
        el.className = 'fixed pointer-events-none z-50';
        el.style.width = Math.random() * 8 + 6 + 'px';
        el.style.height = Math.random() * 8 + 6 + 'px';
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        el.style.border = '2px solid black';
        el.style.left = '50vw';
        el.style.top = '45vh';
        document.body.appendChild(el);

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 250 + 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 100;
        const rot = Math.random() * 720 - 360;

        const anim = el.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty + 200}px) rotate(${rot}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 600 + 700,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
        });

        anim.onfinish = () => el.remove();
    }
}

// Gắn global cho các onclick html
window.playSound = playSound;
