import React, { useState, useEffect, useRef } from 'react';
import { Play, ShoppingBag, Users, Volume2, VolumeX, Coins, Award, RotateCcw, Home, BookOpen, Pause } from 'lucide-react';

// --- SOUND ENGINE (Web Audio API) ---
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmInterval = null;
  }
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  playTone(freq, type, duration, vol = 0.15, delay = 0) {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
  }
  coin() {
    this.playTone(987.77, 'sine', 0.12, 0.12, 0);
    this.playTone(1318.51, 'sine', 0.25, 0.12, 0.06);
  }
  jump() {
    this.playTone(320, 'triangle', 0.18, 0.15, 0);
    this.playTone(540, 'triangle', 0.2, 0.12, 0.05);
  }
  slide() { this.playTone(220, 'sawtooth', 0.18, 0.08, 0); }
  powerup() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.playTone(f, 'triangle', 0.2, 0.15, i * 0.06));
  }
  buy() {
    this.playTone(600, 'sine', 0.1, 0.15, 0);
    this.playTone(900, 'sine', 0.25, 0.15, 0.08);
  }
  stumble() { this.playTone(180, 'sawtooth', 0.25, 0.18, 0); }
  gameover() {
    [400, 350, 300, 220].forEach((f, i) => this.playTone(f, 'sawtooth', 0.28, 0.15, i * 0.12));
  }
  startBgm() {
    this.stopBgm();
    if (this.muted) return;
    const notes = [261.63, 329.63, 392.0, 329.63, 293.66, 349.23, 440.0, 349.23];
    let step = 0;
    this.bgmInterval = setInterval(() => {
      if (!this.muted && this.ctx) {
        this.playTone(notes[step % notes.length], 'triangle', 0.18, 0.045, 0);
        step++;
      }
    }, 260);
  }
  stopBgm() {
    if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = null; }
  }
}
const sfx = new SoundEngine();

// --- SPRITE CROP COORDINATES ---
const CHARACTERS = [
  {
    id: 'labiba', name: 'লাবিবা', tier: 'Easy', price: 0, color: '#92400e', heightScale: 0.78,
    trait: 'মিনি শিল্ড (ছোট সাইজ)', parents: ['masud', 'rokhsana'],
    sheet: '/sheet1.jfif',
    crops: { stand: [0.03, 0.05, 0.17, 0.18], run: [0.22, 0.05, 0.18, 0.18], power: [0.60, 0.05, 0.22, 0.18] }
  },
  {
    id: 'tanha', name: 'তানহা', tier: 'Easy', price: 0, color: '#15803d', heightScale: 0.78,
    trait: 'কয়েন ম্যাগনেট পাওয়ার', parents: ['nargis', 'swapan'],
    sheet: '/sheet1.jfif',
    crops: { stand: [0.03, 0.77, 0.17, 0.19], run: [0.22, 0.77, 0.18, 0.19], power: [0.76, 0.77, 0.20, 0.19] }
  },
  {
    id: 'ayat', name: 'আয়াত', tier: 'Easy', price: 0, color: '#dc2626', heightScale: 0.80,
    trait: 'চকলেট স্পিড বুস্ট', parents: ['rupali', 'mamun'],
    sheet: '/sheet1.jfif',
    crops: { stand: [0.03, 0.53, 0.17, 0.18], run: [0.22, 0.53, 0.18, 0.18], power: [0.72, 0.53, 0.23, 0.18] }
  },
  {
    id: 'jillu', name: 'জিল্লু', tier: 'Medium', price: 50, color: '#065f46', heightScale: 0.92,
    trait: 'স্পিড + স্কেটবোর্ড + বেশি কয়েন', parents: ['shahin', 'selim'],
    sheet: '/sheet3.jfif',
    crops: { stand: [0.06, 0.51, 0.18, 0.21], run: [0.35, 0.52, 0.25, 0.20], power: [0.71, 0.52, 0.26, 0.20] }
  },
  {
    id: 'raisha', name: 'রাইশা', tier: 'Medium', price: 50, color: '#eab308', heightScale: 0.90,
    trait: 'স্মার্ট রাডার অ্যালার্ট', parents: ['nargis', 'swapan'],
    sheet: '/sheet3.jfif',
    crops: { stand: [0.07, 0.76, 0.18, 0.20], run: [0.38, 0.76, 0.22, 0.20], power: [0.68, 0.75, 0.28, 0.21] }
  },
  {
    id: 'lamia', name: 'লামিয়া', tier: 'Medium', price: 50, color: '#ea580c', heightScale: 0.92,
    trait: 'ডাবল মানি (২x কয়েন)', parents: ['masud', 'rokhsana'],
    sheet: '/sheet2.jfif',
    crops: { stand: [0.06, 0.11, 0.22, 0.32], run: [0.34, 0.11, 0.27, 0.32], power: [0.65, 0.10, 0.32, 0.33] }
  },
  {
    id: 'alif', name: 'আলিফ', tier: 'Medium', price: 50, color: '#db2777', heightScale: 0.92,
    trait: 'রোগা-পাতলা উইন্ড গ্লাইডার', parents: ['rupali', 'mamun'],
    sheet: '/sheet1.jfif',
    crops: { stand: [0.03, 0.28, 0.17, 0.19], run: [0.22, 0.28, 0.18, 0.19], power: [0.66, 0.30, 0.26, 0.16] }
  },
  {
    id: 'tisha', name: 'তিশা', tier: 'Hard', price: 80, color: '#ca8a04', heightScale: 0.98,
    trait: 'লাকি স্টাম্বল (হোঁচটে আউট হয় না)', parents: ['nargis', 'swapan'],
    sheet: '/sheet2.jfif',
    crops: { stand: [0.06, 0.59, 0.22, 0.33], run: [0.34, 0.59, 0.27, 0.33], power: [0.66, 0.59, 0.31, 0.33] }
  },
  {
    id: 'simon', name: 'সিমন', tier: 'Hard', price: 90, color: '#3b82f6', heightScale: 1.12,
    trait: 'অনেক লম্বা + মেগা হাই জাম্প', parents: ['shahin', 'selim'],
    sheet: '/sheet3.jfif',
    crops: { stand: [0.07, 0.26, 0.17, 0.21], run: [0.36, 0.26, 0.26, 0.21], power: [0.73, 0.26, 0.23, 0.20] }
  },
  {
    id: 'siam', name: 'সিয়াম', tier: 'Hard', price: 100, color: '#f59e0b', heightScale: 1.02,
    trait: 'অল-ইন-ওয়ান সুপার পাওয়ার', parents: ['shahin', 'selim'],
    sheet: '/sheet3.jfif',
    crops: { stand: [0.07, 0.02, 0.17, 0.20], run: [0.37, 0.02, 0.23, 0.20], power: [0.71, 0.01, 0.26, 0.21] }
  },
];

const SHOP_ITEMS = [
  { id: 'skateboard', name: 'রকেট স্কেটবোর্ড', price: 10, desc: '২০ সেকেন্ড সুপার স্পিড ও সেফটি', icon: '🛹' },
  { id: 'magnet', name: 'সুপার ম্যাগনেট', price: 10, desc: 'সব লেনের কয়েন কাছে টেনে নেবে', icon: '🧲' },
  { id: 'sneakers', name: 'স্প্রিং জুতা', price: 10, desc: 'অনেক উঁচুতে লাফ দেওয়ার ক্ষমতা', icon: '👟' },
  { id: 'cloak', name: 'অদৃশ্য চাদর', price: 10, desc: 'বাবা-মা ও আন্টিরা দেখতে পাবে না', icon: '🧥' },
  { id: 'chocolate', name: 'চকলেট বুস্ট', price: 10, desc: 'শুরুতেই ঝড়ের গতিতে হেডস্টার্ট', icon: '🍫' },
  { id: 'notebook', name: 'ফাঁকা খাতা (Save Me)', price: 15, desc: 'ধরা পড়লে খাতা দেখিয়ে বেঁচে যাবে', icon: '📓' },
  { id: 'helmet', name: 'সেফটি হেলমেট', price: 15, desc: 'একবার ধাক্কায় আউট হবে না', icon: '🪖' },
  { id: 'doubleCoin', name: 'ডাবল কয়েন কার্ড', price: 15, desc: 'সংগ্রহ করা কয়েন দ্বিগুণ হবে', icon: '💳' },
  { id: 'glider', name: 'উইন্ড গ্লাইডার', price: 15, desc: 'লাফ দিলে বাতাসে ভেসে উড়বে', icon: '🪁' },
  { id: 'watch', name: 'স্লো-মোশন ঘড়ি', price: 15, desc: 'চেসারদের গতি স্লো করে দেবে', icon: '⏱️' },
  { id: 'radarGlass', name: 'স্মার্ট রাডার চশমা', price: 20, desc: 'সামনে ওঁৎ পাতা বিপদ আগে দেখাবে', icon: '🕶️' },
  { id: 'converter', name: 'কয়েন কনভার্টার', price: 20, desc: 'সামনের বাধাগুলো কয়েন হয়ে যাবে', icon: '✨' },
  { id: 'mysteryBox', name: 'মিস্ট্রি বক্স', price: 20, desc: 'খুললেই ১৫ থেকে ৬০ কয়েন বোনাস!', icon: '🎁' },
  { id: 'ninjaShoes', name: 'সাইলেন্ট স্নিকার্স', price: 20, desc: 'পায়ে শব্দ হবে না, চেসার দূরে থাকবে', icon: '👟' },
];

const CHASERS = [
  { id: 'shahin', name: 'শাহিন', weapon: 'ঝাড়ু', emoji: '🧹', color: '#be185d', gender: 'f', glasses: true, dialog: 'হারামজাদা! সিমন প্রিয় ছেলে, বাকিরা পড়তে বস!' },
  { id: 'selim', name: 'সেলিম', weapon: 'অংক বই', emoji: '📘', color: '#1d4ed8', gender: 'm', glasses: true, dialog: 'জিল্লু কই? আজকে নামতা না ধরে ছাড়ছি না!' },
  { id: 'nargis', name: 'নারগিস', weapon: 'খুন্তি', emoji: '🍳', color: '#047857', gender: 'f', glasses: false, dialog: 'কই যাস? পড়ার টেবিলে বসবি নাকি দেবো!' },
  { id: 'swapan', name: 'স্বপন', weapon: 'ছাতা', emoji: '☂️', color: '#4338ca', gender: 'm', glasses: false, dialog: 'জয় বাংলা! আজকে সব কয়টাকে পড়তে বসাবো!' },
  { id: 'rupali', name: 'রুপালি', weapon: 'স্কেল', emoji: '📏', color: '#b45309', gender: 'f', glasses: false, dialog: 'আলিফ-আয়াত, তোদের সবার আজকে খবর আছে!' },
  { id: 'mamun', name: 'মামুন', weapon: 'বেত', emoji: '🪄', color: '#374151', gender: 'm', glasses: false, dialog: 'সবাইকে ধরে আজকে পড়ার টেবিলে বসাবো!' },
  { id: 'masud', name: 'মাসুদ', weapon: 'জুতা', emoji: '👞', color: '#7c2d12', gender: 'm', glasses: true, dialog: 'লুকিয়ে লাভ নেই, সব কয়টাকে দেখে ফেলেছি!' },
  { id: 'rokhsana', name: 'রোখসানা', weapon: 'বেলন', emoji: '🥖', color: '#6d28d9', gender: 'f', glasses: false, dialog: 'পড়া শেষ না করলে আজকে কারো টিফিন নেই!' },
];

function processSpriteSheet(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 16 && min > 125 && max < 248) {
            d[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) {}
      resolve(c);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function SpritePortrait({ char, pose = 'stand', sheets, className = 'w-16 h-16' }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const sheetCanvas = sheets[char.sheet];
    if (!canvas || !sheetCanvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const [nx, ny, nw, nh] = char.crops[pose] || char.crops.stand;
    const sx = nx * sheetCanvas.width;
    const sy = ny * sheetCanvas.height;
    const sw = nw * sheetCanvas.width;
    const sh = nh * sheetCanvas.height;

    const scale = Math.min(canvas.width / sw, canvas.height / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(sheetCanvas, sx, sy, sw, sh, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  }, [char, pose, sheets]);

  return <canvas ref={ref} width={140} height={140} className={className} />;
}

// --- 3D CARTOON CHASER RENDERER ---
function drawDetailedChaser(ctx, x, y, scale, chaser, frame, isParent = false, showTag = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const bob = Math.sin(frame * 0.35) * 4;
  const legSwing = Math.sin(frame * 0.35) * 11;

  // Ground Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 28, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoes & Legs
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-15, -30 + legSwing * 0.45, 11, 30, 5);
  ctx.roundRect(4, -30 - legSwing * 0.45, 11, 30, 5);
  ctx.fill();

  // 3D Shaded Torso
  const bodyGrad = ctx.createLinearGradient(-24, -82, 24, -28);
  bodyGrad.addColorStop(0, chaser.color);
  bodyGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-24, -82 + bob, 48, 56, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Collar / Scarf Detail
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.moveTo(-10, -82 + bob);
  ctx.lineTo(0, -62 + bob);
  ctx.lineTo(10, -82 + bob);
  ctx.fill();

  // Left Arm
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.roundRect(-32, -76 + bob - legSwing * 0.3, 9, 30, 5);
  ctx.fill();

  // Right Arm + Animated Weapon
  ctx.save();
  ctx.translate(26, -74 + bob);
  ctx.rotate(Math.sin(frame * 0.25) * 0.3 - 0.35);
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.roundRect(-4, 0, 9, 28, 5);
  ctx.fill();
  ctx.font = '30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(chaser.emoji, 5, 6);
  ctx.restore();

  // Head
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, -100 + bob, 19, 0, Math.PI * 2);
  ctx.fill();

  // Hair / Bun
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(0, -104 + bob, 19.5, Math.PI, Math.PI * 2);
  ctx.fill();
  if (chaser.gender === 'f') {
    ctx.beginPath();
    ctx.arc(0, -119 + bob, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Angry Eyebrows & Eyes
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(-11, -105 + bob);
  ctx.lineTo(-3, -101 + bob);
  ctx.moveTo(11, -105 + bob);
  ctx.lineTo(3, -101 + bob);
  ctx.stroke();

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(-6, -98 + bob, 2.5, 0, Math.PI * 2);
  ctx.arc(6, -98 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();

  if (chaser.glasses) {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-12, -102 + bob, 10, 7);
    ctx.strokeRect(2, -102 + bob, 10, 7);
  }

  // Shouting Mouth
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.arc(0, -90 + bob, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // High-Contrast Nameplate
  if (showTag) {
    const label = `${chaser.name} • ${chaser.weapon}`;
    ctx.font = 'bold 13px sans-serif';
    const textW = ctx.measureText(label).width;
    const pillW = Math.max(96, textW + 22);
    const pillH = 26;
    const pillY = -152 + bob;

    ctx.fillStyle = isParent ? '#dc2626' : '#1e1b4b';
    ctx.beginPath();
    ctx.roundRect(-pillW / 2, pillY, pillW, pillH, 13);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, pillY + pillH / 2 + 1);
  }

  ctx.restore();
}

// --- 3D ISOMETRIC OBSTACLE RENDERER ---
function draw3DObstacle(ctx, x, y, scale, sub) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (sub === 'books') {
    // 3D Stacked Textbooks with Top Face & Pages
    const books = [
      { color: '#dc2626', top: '#f87171', h: 15, w: 74 },
      { color: '#2563eb', top: '#60a5fa', h: 15, w: 68 },
      { color: '#059669', top: '#34d399', h: 14, w: 62 },
    ];
    let curY = 0;
    books.forEach((b) => {
      // Front Spine
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.w / 2, curY - b.h, b.w, b.h);
      // White Pages Strip
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(-b.w / 2 + 5, curY - b.h + 3, b.w - 10, b.h - 6);
      // 3D Top Face
      ctx.fillStyle = b.top;
      ctx.beginPath();
      ctx.moveTo(-b.w / 2, curY - b.h);
      ctx.lineTo(-b.w / 2 + 10, curY - b.h - 9);
      ctx.lineTo(b.w / 2 + 10, curY - b.h - 9);
      ctx.lineTo(b.w / 2, curY - b.h);
      ctx.closePath();
      ctx.fill();
      curY -= b.h;
    });

    // Clear Badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-38, curY - 30, 76, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⬆️ জাম্প করো', 0, curY - 16);
  } else {
    // 3D High Study Table (Slide Under!)
    const w = 80;
    const h = 64;
    // Back Legs
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-w / 2 + 12, -h, 8, h - 4);
    ctx.fillRect(w / 2 - 20, -h, 8, h - 4);
    // Front Legs
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-w / 2 + 4, -h + 6, 9, h - 6);
    ctx.fillRect(w / 2 - 13, -h + 6, 9, h - 6);

    // Table Top (3D Perspective)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 4, -h + 6);
    ctx.lineTo(-w / 2 + 12, -h - 8);
    ctx.lineTo(w / 2 + 12, -h - 8);
    ctx.lineTo(w / 2 + 4, -h + 6);
    ctx.closePath();
    ctx.fill();

    // Table Front Edge
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-w / 2 - 4, -h + 6, w + 8, 10);

    // Clear Slide Badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-40, -h - 32, 80, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⬇️ স্লাইড করো', 0, -h - 18);
  }

  ctx.restore();
}

export default function App() {
  const [coins, setCoins] = useState(() => Number(localStorage.getItem('pe_coins') || 20));
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('pe_highscore') || 0));
  const [unlockedChars, setUnlockedChars] = useState(() => {
    const saved = localStorage.getItem('pe_chars');
    return saved ? JSON.parse(saved) : ['labiba', 'tanha', 'ayat'];
  });
  const [selectedCharId, setSelectedCharId] = useState(() => localStorage.getItem('pe_selected') || 'labiba');
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('pe_inventory');
    return saved ? JSON.parse(saved) : {};
  });

  const [sheets, setSheets] = useState({});
  const [screen, setScreen] = useState('menu');
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState('');
  const [lastRunStats, setLastRunStats] = useState({ score: 0, coinsEarned: 0, caughtBy: null });
  const [activePowersUI, setActivePowersUI] = useState([]);

  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    Promise.all([
      processSpriteSheet('/sheet1.jfif'),
      processSpriteSheet('/sheet2.jfif'),
      processSpriteSheet('/sheet3.jfif'),
    ]).then(([s1, s2, s3]) => {
      setSheets({
        '/sheet1.jfif': s1,
        '/sheet2.jfif': s2,
        '/sheet3.jfif': s3,
      });
    });
  }, []);

  useEffect(() => { localStorage.setItem('pe_coins', coins); }, [coins]);
  useEffect(() => { localStorage.setItem('pe_highscore', highScore); }, [highScore]);
  useEffect(() => { localStorage.setItem('pe_chars', JSON.stringify(unlockedChars)); }, [unlockedChars]);
  useEffect(() => { localStorage.setItem('pe_selected', selectedCharId); }, [selectedCharId]);
  useEffect(() => { localStorage.setItem('pe_inventory', JSON.stringify(inventory)); }, [inventory]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const toggleMute = () => {
    sfx.init();
    const next = !muted;
    setMuted(next);
    sfx.muted = next;
    if (next) sfx.stopBgm();
    else if (screen === 'playing' && !paused) sfx.startBgm();
  };

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    if (next) sfx.stopBgm();
    else if (!muted) sfx.startBgm();
  };

  const handleBuyCharacter = (char) => {
    sfx.init();
    if (unlockedChars.includes(char.id)) {
      setSelectedCharId(char.id);
      sfx.coin();
      showToast(`${char.name} সিলেক্ট করা হয়েছে!`);
      return;
    }
    if (coins >= char.price) {
      setCoins(c => c - char.price);
      setUnlockedChars(prev => [...prev, char.id]);
      setSelectedCharId(char.id);
      sfx.buy();
      showToast(`অভিনন্দন! ${char.name} আনলক হয়েছে!`);
    } else {
      sfx.stumble();
      showToast(`আরও ${char.price - coins} কয়েন লাগবে!`);
    }
  };

  const handleBuyItem = (item) => {
    sfx.init();
    if (coins < item.price) {
      sfx.stumble();
      showToast(`পর্যাপ্ত কয়েন নেই! (${item.price} কয়েন লাগবে)`);
      return;
    }
    setCoins(c => c - item.price);
    sfx.buy();

    if (item.id === 'mysteryBox') {
      const reward = [15, 25, 35, 50, 60][Math.floor(Math.random() * 5)];
      setCoins(c => c + reward);
      showToast(`🎁 মিস্ট্রি বক্স থেকে ${reward} কয়েন পেয়েছ!`);
      return;
    }

    setInventory(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));
    showToast(`${item.icon} ${item.name} কেনা হয়েছে! (স্টক: ${(inventory[item.id] || 0) + 1})`);
  };

  const startGame = () => {
    sfx.init();
    sfx.startBgm();
    setPaused(false);
    const char = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];

    const activeBuffs = {};
    const nextInv = { ...inventory };
    Object.keys(nextInv).forEach(key => {
      if (nextInv[key] > 0) {
        activeBuffs[key] = true;
        nextInv[key] -= 1;
      }
    });
    setInventory(nextInv);

    // Balanced speeds so Hard mode is thrilling yet clearly visible
    const baseSpeed = char.tier === 'Easy' ? 6.8 : char.tier === 'Medium' ? 7.8 : 8.6;

    const scenery = [];
    for (let i = 0; i < 12; i++) {
      scenery.push({ z: i * 0.085, side: i % 2 === 0 ? -1 : 1, kind: i % 3 === 0 ? 'house' : i % 2 === 0 ? 'lamp' : 'tree' });
    }

    gameStateRef.current = {
      running: true,
      char,
      lane: 1,
      visualLane: 1,
      y: 0,
      vy: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      speed: activeBuffs.chocolate ? baseSpeed + 3.5 : baseSpeed,
      baseSpeed,
      distance: 0,
      runCoins: 0,
      entities: [],
      particles: [],
      scenery,
      spawnTimer: 0,
      chaserDist: activeBuffs.ninjaShoes ? 140 : 85,
      activeChaser: CHASERS[Math.floor(Math.random() * CHASERS.length)],
      activeDialog: '',
      dialogTimer: 0,
      shakeTimer: 0,
      buffs: activeBuffs,
      buffTimers: {
        skateboard: activeBuffs.skateboard ? 900 : 0,
        cloak: activeBuffs.cloak ? 600 : 0,
        chocolate: activeBuffs.chocolate ? 300 : 0,
        converter: activeBuffs.converter ? 500 : 0,
        watch: activeBuffs.watch ? 500 : 0,
      },
      shield: activeBuffs.helmet ? 1 : 0,
      saveMe: activeBuffs.notebook ? 1 : 0,
      invincibleTimer: 0,
      frame: 0,
    };

    const labels = Object.keys(activeBuffs).map(k => SHOP_ITEMS.find(i => i.id === k)?.icon).filter(Boolean);
    setActivePowersUI(labels);
    setScreen('playing');
  };

  // --- GAME LOOP ---
  useEffect(() => {
    if (screen !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnParticles = (x, y, color, count = 12) => {
      const g = gameStateRef.current;
      if (!g) return;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 2 + Math.random() * 5;
        g.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 24 + Math.random() * 10,
          maxLife: 34,
          color,
          size: 3 + Math.random() * 4
        });
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const doLeft = () => { const g = gameStateRef.current; if (g && !pausedRef.current && g.lane > 0) { g.lane--; sfx.slide(); } };
    const doRight = () => { const g = gameStateRef.current; if (g && !pausedRef.current && g.lane < 2) { g.lane++; sfx.slide(); } };
    const doJump = () => {
      const g = gameStateRef.current;
      if (!g || pausedRef.current || g.isJumping) return;
      g.isJumping = true;
      g.isSliding = false;
      g.vy = g.buffs.sneakers || g.char.id === 'simon' ? 17.5 : 14.5;
      sfx.jump();
    };
    const doSlide = () => {
      const g = gameStateRef.current;
      if (!g || pausedRef.current) return;
      if (g.isJumping) g.vy = -14;
      g.isSliding = true;
      g.slideTimer = 32;
      sfx.slide();
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'p') { togglePause(); return; }
      if (e.key === 'ArrowLeft' || e.key === 'a') doLeft();
      if (e.key === 'ArrowRight' || e.key === 'd') doRight();
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') doJump();
      if (e.key === 'ArrowDown' || e.key === 's') doSlide();
    };
    const onTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 25) doRight(); else if (dx < -25) doLeft();
      } else {
        if (dy < -25) doJump(); else if (dy > 25) doSlide();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    const loop = () => {
      const g = gameStateRef.current;
      if (!g || !g.running) return;

      if (pausedRef.current) {
        animId = requestAnimationFrame(loop);
        return;
      }

      g.frame++;

      const W = canvas.width;
      const H = canvas.height;
      // High Camera Angle (horizonY = 0.21) so far road & obstacles are super clear even in Hard mode!
      const horizonY = H * 0.21;
      const groundY = H * 0.87;

      Object.keys(g.buffTimers).forEach(k => { if (g.buffTimers[k] > 0) g.buffTimers[k]--; });
      if (g.invincibleTimer > 0) g.invincibleTimer--;
      if (g.dialogTimer > 0) g.dialogTimer--;
      if (g.shakeTimer > 0) g.shakeTimer--;

      const currentSpeed = g.buffTimers.chocolate > 0 ? g.baseSpeed + 4.2 : g.buffTimers.skateboard > 0 ? g.baseSpeed + 2.2 : g.baseSpeed + Math.min(3.2, g.distance / 3000);
      g.distance += currentSpeed * 0.15;

      const chaserRecovery = g.buffTimers.watch > 0 ? 0.02 : 0.08;
      if (g.chaserDist < 110) g.chaserDist += chaserRecovery;

      g.visualLane += (g.lane - g.visualLane) * 0.24;
      if (g.isJumping) {
        g.y += g.vy;
        const gravity = (g.buffs.glider || g.char.id === 'alif') && g.vy < 0 ? 0.42 : 0.72;
        g.vy -= gravity;
        if (g.y <= 0) { g.y = 0; g.vy = 0; g.isJumping = false; }
      }
      if (g.isSliding) {
        g.slideTimer--;
        if (g.slideTimer <= 0) g.isSliding = false;
      }

      // Proportional Spawn Spacing (prevents overcrowding in Hard mode!)
      g.spawnTimer -= currentSpeed;
      if (g.spawnTimer <= 0) {
        g.spawnTimer = 140 + currentSpeed * 6;
        const lane = Math.floor(Math.random() * 3);
        const roll = Math.random();

        if (roll < 0.46) {
          for (let i = 0; i < 4; i++) g.entities.push({ type: 'coin', lane, z: 1.0 + i * 0.065 });
        } else if (roll < 0.74) {
          const ambusher = CHASERS[Math.floor(Math.random() * CHASERS.length)];
          const isParent = g.char.parents.includes(ambusher.id);
          g.entities.push({ type: 'ambush', lane, z: 1.0, chaser: ambusher, isParent });
          const safeLane = (lane + 1) % 3;
          g.entities.push({ type: 'coin', lane: safeLane, z: 1.0 });
          g.entities.push({ type: 'coin', lane: safeLane, z: 1.07 });
        } else {
          const sub = Math.random() < 0.5 ? 'books' : 'table';
          g.entities.push({ type: 'obstacle', sub, lane, z: 1.0 });
          const safeLane = (lane + 2) % 3;
          g.entities.push({ type: 'coin', lane: safeLane, z: 1.02 });
        }
      }

      // Improved Linear-Perspective Projection for Maximum Forward Visibility
      const project = (laneIdx, z) => {
        const progress = 1 - z;
        const scale = 0.26 + progress * 0.92;
        const y = horizonY + Math.pow(progress, 1.15) * (groundY - horizonY);
        const roadHalfW = (W * 0.11) + Math.pow(progress, 1.1) * (W * 0.36);
        const x = W / 2 + (laneIdx - 1) * (roadHalfW * 0.66);
        return { x, y, scale, roadHalfW };
      };

      ctx.save();
      if (g.shakeTimer > 0) {
        ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      }

      // --- 1. VIBRANT SKY, CITY SILHOUETTE & CLOUDS ---
      const stage = g.distance < 400 ? 0 : g.distance < 950 ? 1 : 2;
      const skyPalettes = [
        ['#0284c7', '#38bdf8', '#bae6fd'], // Crisp Morning Blue
        ['#4f46e5', '#818cf8', '#e0e7ff'], // Royal Indigo Day
        ['#c2410c', '#f97316', '#fde047'], // Golden Sunset
      ];
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, skyPalettes[stage][0]);
      skyGrad.addColorStop(0.65, skyPalettes[stage][1]);
      skyGrad.addColorStop(1, skyPalettes[stage][2]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, horizonY);

      // Glowing Sun
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.beginPath();
      ctx.arc(W * 0.82, horizonY * 0.42, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.arc(W * 0.82, horizonY * 0.42, 20, 0, Math.PI * 2);
      ctx.fill();

      // Moving Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      [0.15, 0.48, 0.82].forEach((cx, idx) => {
        const cloudX = ((cx * W + g.frame * (0.25 + idx * 0.08)) % (W + 150)) - 75;
        const cloudY = horizonY * (0.28 + (idx % 2) * 0.22);
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 16, 0, Math.PI * 2);
        ctx.arc(cloudX + 15, cloudY - 4, 20, 0, Math.PI * 2);
        ctx.arc(cloudX + 32, cloudY, 15, 0, Math.PI * 2);
        ctx.fill();
      });

      // Distant Dhaka / Town Skyline on Horizon
      ctx.fillStyle = stage === 2 ? '#7c2d12' : '#1e293b';
      for (let bx = 0; bx < W; bx += 42) {
        const bh = 14 + ((bx * 17) % 24);
        ctx.fillRect(bx, horizonY - bh, 36, bh);
        // Tiny Lit Windows
        ctx.fillStyle = '#facc15';
        if (bx % 84 === 0) ctx.fillRect(bx + 8, horizonY - bh + 5, 5, 5);
        ctx.fillStyle = stage === 2 ? '#7c2d12' : '#1e293b';
      }

      // --- 2. GRASS GROUND & 3-TRACK RAILWAY / BRICK ROAD ---
      const grassGrad = ctx.createLinearGradient(0, horizonY, 0, H);
      grassGrad.addColorStop(0, stage === 2 ? '#a16207' : '#16a34a');
      grassGrad.addColorStop(1, stage === 2 ? '#422006' : '#14532d');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, horizonY, W, H - horizonY);

      // Brick Sidewalks / Curbs
      ctx.beginPath();
      ctx.moveTo(W / 2 - W * 0.122, horizonY);
      ctx.lineTo(W / 2 + W * 0.122, horizonY);
      ctx.lineTo(W / 2 + W * 0.50, H);
      ctx.lineTo(W / 2 - W * 0.50, H);
      ctx.closePath();
      ctx.fillStyle = '#b91c1c';
      ctx.fill();

      // Gravel Track Bed
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, H);
      roadGrad.addColorStop(0, '#475569');
      roadGrad.addColorStop(1, '#1e293b');
      ctx.beginPath();
      ctx.moveTo(W / 2 - W * 0.11, horizonY);
      ctx.lineTo(W / 2 + W * 0.11, horizonY);
      ctx.lineTo(W / 2 + W * 0.47, H);
      ctx.lineTo(W / 2 - W * 0.47, H);
      ctx.closePath();
      ctx.fillStyle = roadGrad;
      ctx.fill();

      // Animated Wooden Railway Sleepers across all 3 Lanes
      const sleeperStep = 0.055;
      const sleeperOffset = (g.frame * currentSpeed * 0.0022) % sleeperStep;
      for (let z = 1 - sleeperOffset; z > 0; z -= sleeperStep) {
        const p = project(1, z);
        const sw = p.roadHalfW * 1.88;
        const sh = Math.max(2, 6 * p.scale);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(W / 2 - sw / 2, p.y - sh / 2, sw, sh);
      }

      // 6 Shiny Steel Rails (2 per Lane)
      [-0.66, 0, 0.66].forEach(laneOffset => {
        [-0.14, 0.14].forEach(railOffset => {
          const topX = W / 2 + (W * 0.11) * (laneOffset + railOffset);
          const botX = W / 2 + (W * 0.47) * (laneOffset + railOffset);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(topX, horizonY);
          ctx.lineTo(botX, H);
          ctx.stroke();
        });
      });

      // --- 3. MOVING ROADSIDE TREES, HOUSES & STREET LAMPS ---
      g.scenery.forEach(item => {
        item.z -= currentSpeed * 0.0022;
        if (item.z < -0.05) {
          item.z = 1.0;
          const r = Math.random();
          item.kind = r < 0.35 ? 'house' : r < 0.65 ? 'lamp' : 'tree';
        }
        const p = project(1, Math.max(0, item.z));
        const sx = W / 2 + item.side * (p.roadHalfW + 52 * p.scale);
        const sy = p.y;

        if (item.kind === 'tree') {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx - 5 * p.scale, sy - 38 * p.scale, 10 * p.scale, 38 * p.scale);
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(sx, sy - 52 * p.scale, 26 * p.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(sx - 7 * p.scale, sy - 58 * p.scale, 16 * p.scale, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.kind === 'lamp') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(sx - 3 * p.scale, sy - 75 * p.scale, 6 * p.scale, 75 * p.scale);
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(sx - item.side * 8 * p.scale, sy - 75 * p.scale, 7 * p.scale, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const hw = 58 * p.scale;
          const hh = 44 * p.scale;
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(sx - hw / 2, sy - hh, hw, hh);
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(sx - hw * 0.62, sy - hh);
          ctx.lineTo(sx, sy - hh - 26 * p.scale);
          ctx.lineTo(sx + hw * 0.62, sy - hh);
          ctx.closePath();
          ctx.fill();
        }
      });

      // --- 4. ENTITIES (COINS, 3D OBSTACLES, AMBUSH CHASERS) ---
      g.entities.sort((a, b) => b.z - a.z);

      for (let i = g.entities.length - 1; i >= 0; i--) {
        const ent = g.entities[i];
        ent.z -= currentSpeed * 0.0022;

        if (g.buffTimers.converter > 0 && (ent.type === 'obstacle' || ent.type === 'ambush')) ent.type = 'coin';
        if (ent.type === 'coin' && (g.buffs.magnet || g.char.id === 'tanha') && ent.z < 0.48 && ent.z > 0) {
          ent.lane += (g.visualLane - ent.lane) * 0.26;
        }

        const p = project(ent.lane, Math.max(0, ent.z));

        if (ent.type === 'coin') {
          const r = 17 * p.scale;
          const cy = p.y - r - 10 * p.scale + Math.sin(g.frame * 0.15 + i) * 3 * p.scale;
          const spinWidth = Math.max(0.35, Math.abs(Math.cos(g.frame * 0.1 + i)));

          ctx.fillStyle = 'rgba(250, 204, 21, 0.32)';
          ctx.beginPath();
          ctx.arc(p.x, cy, r * 1.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.translate(p.x, cy);
          ctx.scale(spinWidth, 1);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#ca8a04';
          ctx.stroke();

          ctx.fillStyle = '#854d0e';
          ctx.font = `bold ${Math.max(10, Math.floor(15 * p.scale))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('৳', 0, 1);
          ctx.restore();
        } else if (ent.type === 'obstacle') {
          draw3DObstacle(ctx, p.x, p.y, p.scale, ent.sub);
        } else if (ent.type === 'ambush') {
          drawDetailedChaser(ctx, p.x, p.y, p.scale, ent.chaser, g.frame + i * 5, ent.isParent, true);

          if ((g.buffs.radarGlass || g.char.id === 'raisha') && ent.z < 0.85 && ent.z > 0.2) {
            ctx.fillStyle = '#ef4444';
            ctx.font = `bold ${Math.max(12, Math.floor(16 * p.scale))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ সাবধান!', p.x, p.y - 175 * p.scale);
          }
        }

        // Collision Detection
        if (ent.z <= 0.06 && ent.z >= -0.05) {
          const sameLane = Math.abs(ent.lane - g.visualLane) < 0.42;

          if (sameLane && ent.type === 'coin') {
            sfx.coin();
            const mult = (g.buffs.doubleCoin || g.char.id === 'lamia') ? 2 : 1;
            const bonus = g.char.id === 'jillu' ? 2 : 1;
            g.runCoins += mult * bonus;
            spawnParticles(p.x, p.y - 25, '#facc15', 10);
            g.entities.splice(i, 1);
            continue;
          }

          if (sameLane && (ent.type === 'obstacle' || ent.type === 'ambush')) {
            const clearedJump = ent.type === 'obstacle' && ent.sub === 'books' && g.y > 28;
            const clearedHighJump = g.y > 68;
            const clearedSlide = ent.type === 'obstacle' && ent.sub === 'table' && (g.isSliding || g.char.tier === 'Easy');

            if (!clearedJump && !clearedHighJump && !clearedSlide) {
              g.entities.splice(i, 1);
              spawnParticles(p.x, p.y - 40, '#ef4444', 18);
              g.shakeTimer = 14;

              if (g.invincibleTimer > 0 || g.buffTimers.cloak > 0 || g.buffTimers.chocolate > 0) continue;
              if (g.buffTimers.skateboard > 0) { g.buffTimers.skateboard = 0; g.invincibleTimer = 60; sfx.stumble(); continue; }
              if (g.shield > 0) { g.shield = 0; g.invincibleTimer = 60; sfx.stumble(); continue; }

              if (ent.type === 'obstacle' && (g.chaserDist > 45 || g.char.id === 'tisha')) {
                sfx.stumble();
                g.chaserDist = Math.max(20, g.chaserDist - 45);
                g.activeChaser = CHASERS[Math.floor(Math.random() * CHASERS.length)];
                g.activeDialog = g.activeChaser.dialog;
                g.dialogTimer = 130;
                g.invincibleTimer = 45;
              } else {
                if (g.saveMe > 0) {
                  g.saveMe = 0;
                  g.invincibleTimer = 90;
                  g.activeDialog = '📓 খাতা দেখে ছেড়ে দিলো!';
                  g.dialogTimer = 110;
                  sfx.powerup();
                  continue;
                }
                g.running = false;
                sfx.stopBgm();
                sfx.gameover();
                const finalScore = Math.floor(g.distance);
                const caughtBy = ent.type === 'ambush' ? ent.chaser : g.activeChaser;
                setCoins(c => c + g.runCoins);
                if (finalScore > highScore) setHighScore(finalScore);
                setLastRunStats({ score: finalScore, coinsEarned: g.runCoins, caughtBy });
                setScreen('gameover');
                return;
              }
            }
          }
        }
        if (ent.z < -0.1) g.entities.splice(i, 1);
      }

      // --- 5. DRAW PLAYER CHARACTER ---
      const playerProj = project(g.visualLane, 0.02);
      const px = playerProj.x;
      const py = playerProj.y - g.y * 1.6;
      const sheetCanvas = sheets[g.char.sheet];

      // Ground Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(px, playerProj.y + 4, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Skateboard
      if (g.buffTimers.skateboard > 0) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.roundRect(px - 28, py - 8, 56, 11, 5);
        ctx.fill();
      }

      ctx.globalAlpha = g.buffTimers.cloak > 0 ? 0.45 : (g.invincibleTimer > 0 && g.frame % 6 < 3 ? 0.5 : 1);

      if (sheetCanvas) {
        const isPowerActive = g.isJumping || g.buffTimers.skateboard > 0 || g.buffTimers.chocolate > 0 || g.shield > 0;
        const poseKey = isPowerActive ? 'power' : (Math.floor(g.frame / 7) % 2 === 0 ? 'run' : 'stand');
        const [nx, ny, nw, nh] = g.char.crops[poseKey];
        const sx = nx * sheetCanvas.width;
        const sy = ny * sheetCanvas.height;
        const sw = nw * sheetCanvas.width;
        const sh = nh * sheetCanvas.height;

        const drawH = 132 * g.char.heightScale * (g.isSliding ? 0.58 : 1);
        const drawW = drawH * (sw / sh);
        const bob = g.isJumping ? 0 : Math.sin(g.frame * 0.4) * 4;

        ctx.drawImage(sheetCanvas, sx, sy, sw, sh, px - drawW / 2, py - drawH + bob, drawW, drawH);
      } else {
        ctx.fillStyle = g.char.color;
        ctx.fillRect(px - 20, py - 80, 40, 80);
      }

      if (g.shield > 0) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py - 55, 54, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // --- 6. DRAW CHASER BEHIND PLAYER ---
      const chaserY = playerProj.y + (g.chaserDist * 0.78);
      if (chaserY < H + 70) {
        drawDetailedChaser(ctx, px, chaserY, 0.95, g.activeChaser, g.frame, true, false);
      }

      // --- 7. SPARKLE PARTICLES ---
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.25;
        pt.life--;
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        if (pt.life <= 0) g.particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;

      // --- 8. ANIME SPEED LINES ON EDGES WHEN FAST ---
      if (currentSpeed >= 8.4) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 2;
        for (let s = 0; s < 8; s++) {
          const side = s % 2 === 0 ? 1 : -1;
          const sx = side === 1 ? W - 15 - (s * 6) : 15 + (s * 6);
          const sy = ((g.frame * 24 + s * 110) % H);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, sy + 55);
          ctx.stroke();
        }
      }

      ctx.restore();

      // --- 9. DIALOG SPEECH BUBBLE ---
      if (g.dialogTimer > 0 && g.activeDialog) {
        const bw = Math.min(W - 30, 360);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(W / 2 - bw / 2, horizonY + 12, bw, 44, 14);
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${g.activeChaser.name}: "${g.activeDialog}"`, W / 2, horizonY + 38);
      }

      // --- 10. MODERN HUD ---
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(14, 14, 170, 60, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🪙 কয়েন: ${g.runCoins}`, 28, 38);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`🏃 স্কোর: ${Math.floor(g.distance)}m`, 28, 61);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [screen, highScore, sheets]);

  const currentChar = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];

  return (
    <div className="relative w-screen h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-900 flex flex-col items-center justify-between overflow-hidden font-sans">
      {toast && (
        <div className="fixed top-4 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-full shadow-xl animate-bounce text-sm">
          {toast}
        </div>
      )}

      {screen !== 'playing' && (
        <div className="w-full max-w-md flex items-center justify-between p-4 z-10">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-amber-400/40 px-3.5 py-1.5 rounded-full">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-amber-300">{coins}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 border border-purple-400/40 px-3.5 py-1.5 rounded-full">
            <Award className="w-4 h-4 text-purple-300" />
            <span className="text-xs font-bold">বেস্ট: {highScore}m</span>
          </div>
          <button onClick={toggleMute} className="p-2 bg-slate-800 rounded-full border border-white/10">
            {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      )}

      {/* --- MAIN MENU --- */}
      {screen === 'menu' && (
        <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center px-6 text-center gap-4">
          <div>
            <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
              ফ্যামিলি এন্ডলেস রানার
            </span>
            <h1 className="text-4xl font-black mt-2 bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              পড়াশোনা এস্কেপ!
            </h1>
            <p className="text-xs text-slate-300 mt-1">বাবা-মা ও আঙ্কেল-আন্টির হাত থেকে পালিয়ে দৌড়াও!</p>
          </div>

          <div className="w-full bg-slate-900/85 border-2 border-amber-400/50 rounded-3xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                currentChar.tier === 'Easy' ? 'bg-emerald-500/20 text-emerald-300' :
                currentChar.tier === 'Medium' ? 'bg-sky-500/20 text-sky-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {currentChar.tier} Mode
              </span>
              <button onClick={() => setScreen('bible')} className="text-xs text-amber-300 underline flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Character Bible
              </button>
            </div>

            <div className="flex justify-center my-1">
              <SpritePortrait char={currentChar} pose="power" sheets={sheets} className="w-28 h-28 object-contain" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">{currentChar.name}</h2>
            <p className="text-xs text-amber-300 mt-0.5">{currentChar.trait}</p>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap justify-center gap-1.5">
              {Object.entries(inventory).filter(([, count]) => count > 0).length === 0 ? (
                <span className="text-[11px] text-slate-400">কোনো পাওয়ার কেনা নেই (শপ থেকে কিনুন)</span>
              ) : (
                Object.entries(inventory).filter(([, count]) => count > 0).map(([id, count]) => {
                  const it = SHOP_ITEMS.find(x => x.id === id);
                  return (
                    <span key={id} className="bg-indigo-600/40 border border-indigo-400/40 text-xs px-2 py-0.5 rounded-lg">
                      {it?.icon} x{count}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Play className="w-6 h-6 fill-slate-950" /> দৌড় শুরু করো!
          </button>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => setScreen('chars')}
              className="py-3.5 rounded-2xl bg-slate-800/90 border border-white/15 font-bold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Users className="w-5 h-5 text-sky-400" /> ক্যারেক্টার (১০)
            </button>
            <button
              onClick={() => setScreen('shop')}
              className="py-3.5 rounded-2xl bg-slate-800/90 border border-white/15 font-bold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400" /> পাওয়ার শপ (১৪)
            </button>
          </div>
        </div>
      )}

      {/* --- CHARACTER BIBLE POSTER VIEW --- */}
      {screen === 'bible' && (
        <div className="flex-1 w-full max-w-md flex flex-col px-4 pb-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-black text-amber-300">Character Bible</h2>
            <button onClick={() => setScreen('menu')} className="px-3 py-1.5 bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1">
              <Home className="w-4 h-4" /> হোম
            </button>
          </div>
          <div className="flex-1 overflow-y-auto rounded-2xl border border-amber-400/30 bg-slate-950 p-2">
            <img src="/bible.jfif" alt="Character Bible" className="w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* --- CHARACTER SELECTION --- */}
      {screen === 'chars' && (
        <div className="flex-1 w-full max-w-md flex flex-col px-4 pb-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black text-amber-300">ভাই-বোন সিলেক্ট করো</h2>
            <button onClick={() => setScreen('menu')} className="px-3 py-1.5 bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1">
              <Home className="w-4 h-4" /> হোম
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {CHARACTERS.map(char => {
              const isUnlocked = unlockedChars.includes(char.id);
              const isSelected = selectedCharId === char.id;
              return (
                <div
                  key={char.id}
                  onClick={() => handleBuyCharacter(char)}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                    isSelected ? 'bg-indigo-900/85 border-amber-400' : 'bg-slate-900/85 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/90 flex items-center justify-center border border-white/15 overflow-hidden shrink-0">
                      <SpritePortrait char={char} pose={isSelected ? 'power' : 'stand'} sheets={sheets} className="w-16 h-16" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base">{char.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          char.tier === 'Easy' ? 'bg-emerald-500/20 text-emerald-300' :
                          char.tier === 'Medium' ? 'bg-sky-500/20 text-sky-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {char.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{char.trait}</p>
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl">সিলেক্টেড</span>
                    ) : isUnlocked ? (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-xl">ফ্রি / আনলকড</span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1">
                        🪙 {char.price}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- POWER SHOP --- */}
      {screen === 'shop' && (
        <div className="flex-1 w-full max-w-md flex flex-col px-4 pb-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-black text-amber-300">পাওয়ার ও গ্যাজেট শপ</h2>
              <p className="text-[11px] text-slate-300">কেনা পাওয়ার পরবর্তী দৌড়ে অটোমেটিক কাজ করবে!</p>
            </div>
            <button onClick={() => setScreen('menu')} className="px-3 py-1.5 bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1">
              <Home className="w-4 h-4" /> হোম
            </button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 gap-2.5 pr-1">
            {SHOP_ITEMS.map(item => {
              const owned = inventory[item.id] || 0;
              return (
                <div key={item.id} className="bg-slate-900/85 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl bg-slate-800 w-11 h-11 rounded-xl flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{item.name}</span>
                        {owned > 0 && (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            স্টক: {owned}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuyItem(item)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3 py-2 rounded-xl active:scale-95 transition shrink-0"
                  >
                    🪙 {item.price}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- PLAYING SCREEN --- */}
      {screen === 'playing' && (
        <div className={`relative w-full h-full ${paused ? 'cursor-auto' : 'cursor-none'}`}>
          <canvas ref={canvasRef} className="block w-full h-full touch-none" />

          <div className="fixed top-4 right-4 flex items-center gap-2 z-20 cursor-auto">
            {activePowersUI.length > 0 && (
              <div className="flex gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-amber-400/40">
                {activePowersUI.map((ic, idx) => <span key={idx} className="text-base">{ic}</span>)}
              </div>
            )}
            <button
              onClick={togglePause}
              className="p-2.5 bg-slate-900/85 hover:bg-slate-800 text-amber-300 rounded-full border border-white/15 shadow-lg active:scale-95 transition"
              title="Pause"
            >
              {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          </div>

          {paused && (
            <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 cursor-auto">
              <div className="bg-slate-900 border-2 border-amber-400/50 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
                <h2 className="text-2xl font-black text-amber-300">গেম পজ করা আছে</h2>
                <button
                  onClick={togglePause}
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-slate-950" /> আবার দৌড়াও
                </button>
                <button
                  onClick={() => { setPaused(false); sfx.stopBgm(); setScreen('menu'); }}
                  className="w-full py-3 rounded-2xl bg-slate-800 text-white font-bold flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5 text-sky-400" /> মেইন মেনু
                </button>
              </div>
            </div>
          )}

          <div className="fixed bottom-3 w-full text-center pointer-events-none">
            <span className="bg-black/50 text-white/90 text-[11px] px-3.5 py-1 rounded-full">
              সোয়াইপ বা অ্যারো কী: ⬅️ বামে | ➡️ ডানে | ⬆️ জাম্প | ⬇️ স্লাইড
            </span>
          </div>
        </div>
      )}

      {/* --- GAME OVER SCREEN --- */}
      {screen === 'gameover' && (
        <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="bg-rose-500/20 border-2 border-rose-500/50 rounded-3xl p-6 w-full shadow-2xl">
            <span className="text-4xl">📚</span>
            <h2 className="text-2xl font-black text-rose-300 mt-2">ধরা খেয়ে গেছ! এবার পড়তে বসো!</h2>
            {lastRunStats.caughtBy && (
              <div className="mt-3 bg-slate-950/70 p-3 rounded-2xl border border-rose-400/30">
                <p className="text-xs text-amber-300 font-bold">
                  ধরেছেন: {lastRunStats.caughtBy.name} ({lastRunStats.caughtBy.weapon} {lastRunStats.caughtBy.emoji})
                </p>
                <p className="text-sm text-white italic mt-1">"{lastRunStats.caughtBy.dialog}"</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-900/90 p-3 rounded-2xl">
                <p className="text-xs text-slate-400">দৌড়েছ</p>
                <p className="text-xl font-black text-white">{lastRunStats.score}m</p>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-2xl">
                <p className="text-xs text-slate-400">জমানো কয়েন</p>
                <p className="text-xl font-black text-amber-400">+{lastRunStats.coinsEarned} 🪙</p>
              </div>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            <RotateCcw className="w-5 h-5" /> আবার পালাও!
          </button>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button onClick={() => setScreen('shop')} className="py-3 rounded-2xl bg-slate-800 font-bold text-sm flex items-center justify-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-400" /> শপে যাও
            </button>
            <button onClick={() => setScreen('menu')} className="py-3 rounded-2xl bg-slate-800 font-bold text-sm flex items-center justify-center gap-1.5">
              <Home className="w-4 h-4 text-sky-400" /> মেইন মেনু
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
