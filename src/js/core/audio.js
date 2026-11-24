// core/audio.js

// ==================== AUDIO ====================
let audioCtx, userGestured = false, lastHover = null;
let soundOn = true;
try { soundOn = localStorage.getItem('kstream_sound') !== 'off'; } catch (e) {}
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => { userGestured = true; }, { once: true, capture: true }));

export function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
export function playSound(type) {
  if (!soundOn || !userGestured) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'hover') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    }
  } catch (e) {}
}
// Hover hanya berbunyi saat masuk ke elemen interaktif BARU (bukan tiap pindah child)
document.addEventListener('mouseover', (e) => {
  const el = e.target.closest('button, a, .cursor-pointer');
  if (el && el !== lastHover) playSound('hover');
  lastHover = el;
});
export function updateMuteBtn() {
  const b = document.getElementById('muteBtn'); if (!b) return;
  b.innerHTML = `<svg class="ico"><use href="#${soundOn ? 'i-sound' : 'i-mute'}"/></svg>`;
  b.setAttribute('aria-label', soundOn ? 'Matikan suara' : 'Nyalakan suara');
}
export function toggleSound() {
  soundOn = !soundOn;
  try { localStorage.setItem('kstream_sound', soundOn ? 'on' : 'off'); } catch (e) {}
  updateMuteBtn(); playSound('click');
}
