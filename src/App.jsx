import React, { useState, useEffect, useRef } from 'react';
import { Play, ShoppingBag, Users, Volume2, VolumeX, Shield, Zap, Coins, Award, RotateCcw, Home, Sparkles } from 'lucide-react';

// --- SOUND ENGINE (Web Audio API) ---
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmInterval = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
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

  slide() {
    this.playTone(220, 'sawtooth', 0.18, 0.08, 0);
  }

  powerup() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.playTone(f, 'triangle', 0.2, 0.15, i * 0.06);
    });
  }

  buy() {
    this.playTone(600, 'sine', 0.1, 0.15, 0);
    this.playTone(900, 'sine', 0.25, 0.15, 0.08);
  }

  stumble() {
    this.playTone(180, 'sawtooth', 0.25, 0.18, 0);
  }

  gameover() {
    [400, 350, 300, 220].forEach((f, i) => {
      this.playTone(f, 'sawtooth', 0.28, 0.15, i * 0.12);
    });
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
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const sfx = new SoundEngine();

// --- GAME DATA ---
const CHARACTERS = [
  { id: 'labiba', name: 'লাবিবা', tier: 'Easy', price: 0, color: '#92400e', accent: '#fbbf24', heightScale: 0.72, trait: 'মিনি শিল্ড (ছোট সাইজ)', parents: ['masud', 'rokhsana'], gender: 'F' },
  { id: 'tanha', name: 'তানহা', tier: 'Easy', price: 0, color: '#15803d', accent: '#ef4444', heightScale: 0.72, trait: 'কয়েন ম্যাগনেট পাওয়ার', parents: ['nargis', 'swapan'], gender: 'F' },
  { id: 'ayat', name: 'আয়াত', tier: 'Easy', price: 0, color: '#dc2626', accent: '#fde047', heightScale: 0.74, trait: 'চকলেট স্পিড বুস্ট', parents: ['rupali', 'mamun'], gender: 'M' },
  { id: 'jillu', name: 'জিল্লু', tier: 'Medium', price: 50, color: '#065f46', accent: '#38bdf8', heightScale: 0.88, trait: 'স্পিড + স্কেটবোর্ড + বেশি কয়েন', parents: ['shahin', 'selim'], gender: 'M' },
  { id: 'raisha', name: 'রাইশা', tier: 'Medium', price: 50, color: '#eab308', accent: '#f43f5e', heightScale: 0.86, trait: 'স্মার্ট রাডার অ্যালার্ট', parents: ['nargis', 'swapan'], gender: 'F' },
  { id: 'lamia', name: 'লামিয়া', tier: 'Medium', price: 50, color: '#ea580c', accent: '#22c55e', heightScale: 0.88, trait: 'ডাবল মানি (২x কয়েন)', parents: ['masud', 'rokhsana'], gender: 'F' },
  { id: 'alif', name: 'আলিফ', tier: 'Medium', price: 50, color: '#db2777', accent: '#7dd3fc', heightScale: 0.88, slim: true, trait: 'রোগা-পাতলা উইন্ড গ্লাইডার', parents: ['rupali', 'mamun'], gender: 'M' },
  { id: 'tisha', name: 'তিশা', tier: 'Hard', price: 80, color: '#ca8a04', accent: '#ec4899', heightScale: 0.96, trait: 'লাকি স্টাম্বল (হোঁচটে আউট হয় না)', parents: ['nargis', 'swapan'], gender: 'F' },
  { id: 'simon', name: 'সিমন', tier: 'Hard', price: 90, color: '#f8fafc', accent: '#3b82f6', heightScale: 1.12, trait: 'অনেক লম্বা + মেগা হাই জাম্প', parents: ['shahin', 'selim'], gender: 'M' },
  { id: 'siam', name: 'সিয়াম', tier: 'Hard', price: 100, color: '#e2e8f0', accent: '#f59e0b', heightScale: 1.0, glasses: true, trait: 'অল-ইন-ওয়ান সুপার পাওয়ার', parents: ['shahin', 'selim'], gender: 'M' },
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
  { id: 'mysteryBox', name: 'মিস্ট্রি বক্স', price: 20, desc: 'খুললেই ১০ থেকে ৬০ কয়েন বোনাস!', icon: '🎁' },
  { id: 'ninjaShoes', name: 'সাইলেন্ট স্নিকার্স', price: 20, desc: 'পায়ে শব্দ হবে না, চেসার দূরে থাকবে', icon: '👟' },
];

const CHASERS = [
  { id: 'shahin', name: 'শাহিন', weapon: 'ঝাড়ু 🧹', color: '#be185d', dialog: 'হারামজাদা! সিমন প্রিয় ছেলে, বাকিরা পড়তে বস!' },
  { id: 'selim', name: 'সেলিম', weapon: 'অংক বই 📘', color: '#1d4ed8', dialog: 'জিল্লু কই? আজকে নামতা না ধরে ছাড়ছি না!' },
  { id: 'nargis', name: 'নারগিস', weapon: 'খুন্তি 🍳', color: '#047857', dialog: 'কই যাস? পড়ার টেবিলে বসবি নাকি দেবো!' },
  { id: 'swapan', name: 'স্বপন', weapon: 'ছাতা ☂️', color: '#4338ca', dialog: 'জয় বাংলা! আজকে সব কয়টাকে পড়তে বসাবো!' },
  { id: 'rupali', name: 'রুপালি', weapon: 'স্কেল 📏', color: '#b45309', dialog: 'আলিফ-আয়াত, তোদের সবার আজকে খবর আছে!' },
  { id: 'mamun', name: 'মামুন', weapon: 'বেত 🪄', color: '#374151', dialog: 'সবাইকে ধরে আজকে পড়ার টেবিলে বসাবো!' },
  { id: 'masud', name: 'মাসুদ', weapon: 'জুতা 👞', color: '#7c2d12', dialog: 'লুকিয়ে লাভ নেই, সব কয়টাকে দেখে ফেলেছি!' },
  { id: 'rokhsana', name: 'রোখসানা', weapon: 'বেলন 🥖', color: '#6d28d9', dialog: 'পড়া শেষ না করলে আজকে কারো টিফিন নেই!' },
];

export default function App() {
  // Persistent Storage
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

  // UI States
  const [screen, setScreen] = useState('menu'); // menu, chars, shop, playing, gameover
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState('');
  const [lastRunStats, setLastRunStats] = useState({ score: 0, coinsEarned: 0, caughtBy: null });
  const [activePowersUI, setActivePowersUI] = useState([]);

  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);

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
    else if (screen === 'playing') sfx.startBgm();
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

  // --- START GAME ---
  const startGame = () => {
    sfx.init();
    sfx.startBgm();
    const char = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];

    // Consume equipped items (1 unit each if owned) for this run
    const activeBuffs = {};
    const nextInv = { ...inventory };
    Object.keys(nextInv).forEach(key => {
      if (nextInv[key] > 0) {
        activeBuffs[key] = true;
        nextInv[key] -= 1;
      }
    });
    setInventory(nextInv);

    // Innate character bonuses (only minor innate feel; main powers come from shop!)
    const baseSpeed = char.tier === 'Easy' ? 7.2 : char.tier === 'Medium' ? 8.4 : 9.4;

    gameStateRef.current = {
      running: true,
      char,
      lane: 1, // 0: left, 1: center, 2: right
      visualLane: 1,
      y: 0,
      vy: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      speed: activeBuffs.chocolate ? baseSpeed + 4 : baseSpeed,
      baseSpeed,
      distance: 0,
      runCoins: 0,
      entities: [], // coins, obstacles, ambushers
      spawnTimer: 0,
      chaserDist: activeBuffs.ninjaShoes ? 140 : 85, // closer means danger
      activeChaser: CHASERS[Math.floor(Math.random() * CHASERS.length)],
      activeDialog: '',
      dialogTimer: 0,
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

  // --- GAME LOOP & RENDERING ---
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

    // Controls
    let touchStartX = 0;
    let touchStartY = 0;

    const doLeft = () => {
      const g = gameStateRef.current;
      if (g && g.lane > 0) { g.lane--; sfx.slide(); }
    };
    const doRight = () => {
      const g = gameStateRef.current;
      if (g && g.lane < 2) { g.lane++; sfx.slide(); }
    };
    const doJump = () => {
      const g = gameStateRef.current;
      if (!g || g.isJumping) return;
      g.isJumping = true;
      g.isSliding = false;
      const jumpPower = g.buffs.sneakers || g.char.id === 'simon' ? 17.5 : 14.5;
      g.vy = jumpPower;
      sfx.jump();
    };
    const doSlide = () => {
      const g = gameStateRef.current;
      if (!g) return;
      if (g.isJumping) g.vy = -14;
      g.isSliding = true;
      g.slideTimer = 32;
      sfx.slide();
    };

    const onKeyDown = (e) => {
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
        if (dx > 25) doRight();
        else if (dx < -25) doLeft();
      } else {
        if (dy < -25) doJump();
        else if (dy > 25) doSlide();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    const loop = () => {
      const g = gameStateRef.current;
      if (!g || !g.running) return;
      g.frame++;

      const W = canvas.width;
      const H = canvas.height;
      const horizonY = H * 0.32;
      const groundY = H * 0.84;

      // Update Buff Timers
      Object.keys(g.buffTimers).forEach(k => {
        if (g.buffTimers[k] > 0) g.buffTimers[k]--;
      });
      if (g.invincibleTimer > 0) g.invincibleTimer--;
      if (g.dialogTimer > 0) g.dialogTimer--;

      // Speed & Distance
      const currentSpeed = g.buffTimers.chocolate > 0 ? g.baseSpeed + 5 : g.buffTimers.skateboard > 0 ? g.baseSpeed + 2.5 : g.baseSpeed + Math.min(4, g.distance / 2500);
      g.distance += currentSpeed * 0.15;

      // Chaser recovery
      const chaserRecovery = g.buffTimers.watch > 0 ? 0.02 : 0.08;
      if (g.chaserDist < 110) g.chaserDist += chaserRecovery;

      // Smooth Lane & Jump Physics
      g.visualLane += (g.lane - g.visualLane) * 0.22;
      if (g.isJumping) {
        g.y += g.vy;
        const gravity = (g.buffs.glider || g.char.id === 'alif') && g.vy < 0 ? 0.42 : 0.72;
        g.vy -= gravity;
        if (g.y <= 0) {
          g.y = 0;
          g.vy = 0;
          g.isJumping = false;
        }
      }
      if (g.isSliding) {
        g.slideTimer--;
        if (g.slideTimer <= 0) g.isSliding = false;
      }

      // Spawn Entities (Generous coins + Obstacles + Ambush Chasers)
      g.spawnTimer -= currentSpeed;
      if (g.spawnTimer <= 0) {
        g.spawnTimer = 155;
        const lane = Math.floor(Math.random() * 3);
        const roll = Math.random();

        if (roll < 0.48) {
          // Spawn a line of 4 coins so player easily earns 50-100+ coins per run
          for (let i = 0; i < 4; i++) {
            g.entities.push({ type: 'coin', lane, z: 1.0 + i * 0.07 });
          }
        } else if (roll < 0.76) {
          // Ambush Aunt/Uncle waiting on road!
          const ambusher = CHASERS[Math.floor(Math.random() * CHASERS.length)];
          const isParent = g.char.parents.includes(ambusher.id);
          g.entities.push({
            type: 'ambush',
            lane,
            z: 1.0,
            chaser: ambusher,
            isParent
          });
          // Add extra coins in safe adjacent lane
          const safeLane = (lane + 1) % 3;
          g.entities.push({ type: 'coin', lane: safeLane, z: 1.0 });
          g.entities.push({ type: 'coin', lane: safeLane, z: 1.08 });
        } else {
          // Study Obstacle (Books stack or Study Table)
          const sub = Math.random() < 0.5 ? 'books' : 'table';
          g.entities.push({ type: 'obstacle', sub, lane, z: 1.0 });
          const safeLane = (lane + 2) % 3;
          g.entities.push({ type: 'coin', lane: safeLane, z: 1.02 });
        }
      }

      // Perspective Helper
      const project = (laneIdx, z) => {
        // z: 1 (horizon) -> 0 (player)
        const progress = 1 - z;
        const scale = 0.22 + progress * 0.95;
        const y = horizonY + Math.pow(progress, 1.35) * (groundY - horizonY);
        const roadHalfW = (W * 0.09) + Math.pow(progress, 1.25) * (W * 0.36);
        const x = W / 2 + (laneIdx - 1) * (roadHalfW * 0.66);
        return { x, y, scale, roadHalfW };
      };

      // --- DRAW BACKGROUND (Environment changes with score) ---
      const stage = g.distance < 350 ? 0 : g.distance < 850 ? 1 : 2;
      const skyColors = [
        ['#fef3c7', '#fde68a'], // House Interior warm tone
        ['#38bdf8', '#bae6fd'], // Rooftop bright sky
        ['#fb923c', '#fed7aa'], // Neighborhood sunset
      ];
      const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
      grad.addColorStop(0, skyColors[stage][0]);
      grad.addColorStop(1, skyColors[stage][1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, horizonY);

      // Ground
      ctx.fillStyle = stage === 0 ? '#d97706' : stage === 1 ? '#64748b' : '#16a34a';
      ctx.fillRect(0, horizonY, W, H - horizonY);

      // Road Trapezoid
      ctx.beginPath();
      ctx.moveTo(W / 2 - W * 0.09, horizonY);
      ctx.lineTo(W / 2 + W * 0.09, horizonY);
      ctx.lineTo(W / 2 + W * 0.45, H);
      ctx.lineTo(W / 2 - W * 0.45, H);
      ctx.closePath();
      ctx.fillStyle = stage === 0 ? '#fef9c3' : stage === 1 ? '#475569' : '#334155';
      ctx.fill();

      // Lane Dividers
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 3;
      [-0.33, 0.33].forEach(offset => {
        ctx.beginPath();
        ctx.moveTo(W / 2 + W * 0.09 * offset, horizonY);
        ctx.lineTo(W / 2 + W * 0.45 * offset, H);
        ctx.stroke();
      });

      // Moving Floor Stripes
      const stripeOffset = (g.frame * currentSpeed * 0.015) % 0.25;
      for (let z = stripeOffset; z < 1; z += 0.25) {
        const p = project(1, z);
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(W / 2 - p.roadHalfW, p.y, p.roadHalfW * 2, 6 * p.scale);
      }

      // --- UPDATE & DRAW ENTITIES ---
      g.entities.sort((a, b) => b.z - a.z);

      for (let i = g.entities.length - 1; i >= 0; i--) {
        const ent = g.entities[i];
        ent.z -= currentSpeed * 0.0022;

        // Coin Converter Power
        if (g.buffTimers.converter > 0 && (ent.type === 'obstacle' || ent.type === 'ambush')) {
          ent.type = 'coin';
        }

        // Magnet Power
        if (ent.type === 'coin' && (g.buffs.magnet || g.char.id === 'tanha') && ent.z < 0.45 && ent.z > 0) {
          ent.lane += (g.visualLane - ent.lane) * 0.25;
        }

        const p = project(ent.lane, Math.max(0, ent.z));

        // Draw Entity
        if (ent.type === 'coin') {
          const r = 15 * p.scale;
          ctx.beginPath();
          ctx.arc(p.x, p.y - r - 8 * p.scale, r, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ca8a04';
          ctx.stroke();
          ctx.fillStyle = '#854d0e';
          ctx.font = `bold ${Math.max(9, Math.floor(13 * p.scale))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('৳', p.x, p.y - r - 4 * p.scale);
        } else if (ent.type === 'obstacle') {
          const w = 58 * p.scale;
          const h = (ent.sub === 'books' ? 38 : 54) * p.scale;
          ctx.fillStyle = ent.sub === 'books' ? '#ef4444' : '#78350f';
          ctx.fillRect(p.x - w / 2, p.y - h, w, h);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x - w / 2, p.y - h, w, h);
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.max(10, Math.floor(12 * p.scale))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(ent.sub === 'books' ? '📚 বই' : '🪑 টেবিল', p.x, p.y - h / 2 + 4);
        } else if (ent.type === 'ambush') {
          // Aunt / Uncle waiting on road!
          const bw = 46 * p.scale;
          const bh = 86 * p.scale;
          // Body
          ctx.fillStyle = ent.chaser.color;
          ctx.beginPath();
          ctx.roundRect(p.x - bw / 2, p.y - bh, bw, bh * 0.72, 10);
          ctx.fill();
          // Head
          ctx.beginPath();
          ctx.arc(p.x, p.y - bh - 14 * p.scale, 16 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = '#fed7aa';
          ctx.fill();
          // Name + Weapon Tag
          ctx.fillStyle = ent.isParent ? '#dc2626' : '#1e1b4b';
          ctx.fillRect(p.x - 42 * p.scale, p.y - bh - 48 * p.scale, 84 * p.scale, 20 * p.scale);
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.max(9, Math.floor(11 * p.scale))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`${ent.chaser.name} ${ent.chaser.weapon}`, p.x, p.y - bh - 34 * p.scale);

          // Smart Radar Glass or Raisha Warning
          if ((g.buffs.radarGlass || g.char.id === 'raisha') && ent.z < 0.75 && ent.z > 0.25) {
            ctx.fillStyle = '#ef4444';
            ctx.font = `bold ${Math.max(12, Math.floor(16 * p.scale))}px sans-serif`;
            ctx.fillText('⚠️ সাবধান!', p.x, p.y - bh - 56 * p.scale);
          }
        }

        // --- COLLISION CHECK (Near Player z ~ 0.04) ---
        if (ent.z <= 0.06 && ent.z >= -0.05) {
          const sameLane = Math.abs(ent.lane - g.visualLane) < 0.42;

          if (sameLane && ent.type === 'coin') {
            sfx.coin();
            const mult = (g.buffs.doubleCoin || g.char.id === 'lamia') ? 2 : 1;
            const bonus = g.char.id === 'jillu' ? 2 : 1;
            g.runCoins += mult * bonus;
            g.entities.splice(i, 1);
            continue;
          }

          if (sameLane && (ent.type === 'obstacle' || ent.type === 'ambush')) {
            // Can jump over books or slide under table or Easy small char slips under table
            const clearedJump = ent.type === 'obstacle' && ent.sub === 'books' && g.y > 28;
            const clearedHighJump = g.y > 68;
            const clearedSlide = ent.type === 'obstacle' && ent.sub === 'table' && (g.isSliding || g.char.tier === 'Easy');

            if (!clearedJump && !clearedHighJump && !clearedSlide) {
              g.entities.splice(i, 1);

              // Check protections
              if (g.invincibleTimer > 0 || g.buffTimers.cloak > 0 || g.buffTimers.chocolate > 0) {
                continue;
              }
              if (g.buffTimers.skateboard > 0) {
                g.buffTimers.skateboard = 0;
                g.invincibleTimer = 60;
                sfx.stumble();
                continue;
              }
              if (g.shield > 0) {
                g.shield = 0;
                g.invincibleTimer = 60;
                sfx.stumble();
                continue;
              }

              // Stumble vs Caught!
              if (ent.type === 'obstacle' && (g.chaserDist > 45 || g.char.id === 'tisha')) {
                // Stumble! Chaser gets closer & shouts!
                sfx.stumble();
                g.chaserDist = Math.max(20, g.chaserDist - 45);
                g.activeChaser = CHASERS[Math.floor(Math.random() * CHASERS.length)];
                g.activeDialog = g.activeChaser.dialog;
                g.dialogTimer = 130;
                g.invincibleTimer = 45;
              } else {
                // Caught by Ambush or Chaser! Check Save Me (Fake Notebook)
                if (g.saveMe > 0) {
                  g.saveMe = 0;
                  g.invincibleTimer = 90;
                  g.activeDialog = '📓 খাতা দেখে ছেড়ে দিলো!';
                  g.dialogTimer = 110;
                  sfx.powerup();
                  continue;
                }

                // GAME OVER!
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

      // --- DRAW PLAYER CHARACTER ---
      const playerProj = project(g.visualLane, 0.02);
      const px = playerProj.x;
      const py = playerProj.y - g.y * 1.6;
      const cScale = g.char.heightScale * (g.isSliding ? 0.55 : 1);
      const pw = (g.char.slim ? 30 : 40);
      const ph = 78 * cScale;
      const bob = g.isJumping ? 0 : Math.sin(g.frame * 0.35) * 4;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(px, playerProj.y + 4, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Skateboard visual
      if (g.buffTimers.skateboard > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px - 26, py - 4, 52, 8);
      }

      // Cloak transparency
      ctx.globalAlpha = g.buffTimers.cloak > 0 ? 0.45 : 1;

      // Body
      ctx.fillStyle = g.char.color;
      ctx.beginPath();
      ctx.roundRect(px - pw / 2, py - ph + bob, pw, ph * 0.7, 10);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(px, py - ph - 13 + bob, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#fde68a';
      ctx.fill();

      // Siam's Yellow Sunglasses
      if (g.char.glasses) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px - 11, py - ph - 17 + bob, 9, 5);
        ctx.fillRect(px + 2, py - ph - 17 + bob, 9, 5);
      }

      // Shield Aura
      if (g.shield > 0 || g.char.id === 'siam') {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py - ph / 2, 42, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // --- DRAW CHASER BEHIND PLAYER ---
      const chaserY = playerProj.y + (g.chaserDist * 0.75);
      if (chaserY < H + 60) {
        ctx.fillStyle = g.activeChaser.color;
        ctx.beginPath();
        ctx.roundRect(px - 22, chaserY - 75, 44, 55, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, chaserY - 88, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#fed7aa';
        ctx.fill();
        ctx.font = '20px sans-serif';
        ctx.fillText(g.activeChaser.weapon.split(' ')[1] || '🧹', px + 26, chaserY - 60);
      }

      // --- DIALOG SPEECH BUBBLE ---
      if (g.dialogTimer > 0 && g.activeDialog) {
        const bw = Math.min(W - 30, 340);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(W / 2 - bw / 2, horizonY - 68, bw, 46, 14);
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${g.activeChaser.name}: "${g.activeDialog}"`, W / 2, horizonY - 40);
      }

      // --- HUD (SCORE & COINS) ---
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      ctx.roundRect(14, 14, 150, 54, 14);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🪙 কয়েন: ${g.runCoins}`, 26, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`🏃 স্কোর: ${Math.floor(g.distance)}m`, 26, 58);

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
  }, [screen, highScore]);

  const currentChar = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];

  return (
    <div className="relative w-screen h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-900 flex flex-col items-center justify-between overflow-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-full shadow-xl animate-bounce text-sm">
          {toast}
        </div>
      )}

      {/* Top Bar (Hidden while playing) */}
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
        <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center px-6 text-center gap-5">
          <div>
            <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
              ফ্যামিলি এন্ডলেস রানার
            </span>
            <h1 className="text-4xl font-black mt-2 bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              পড়াশোনা এস্কেপ!
            </h1>
            <p className="text-xs text-slate-300 mt-1">বাবা-মা ও আঙ্কেল-আন্টির হাত থেকে পালিয়ে দৌড়াও!</p>
          </div>

          {/* Selected Character Card */}
          <div className="w-full bg-slate-900/80 border-2 border-amber-400/50 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                currentChar.tier === 'Easy' ? 'bg-emerald-500/20 text-emerald-300' :
                currentChar.tier === 'Medium' ? 'bg-sky-500/20 text-sky-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {currentChar.tier} Mode
              </span>
              <span className="text-xs text-slate-400">সিলেক্টেড রানার</span>
            </div>

            <div className="w-20 h-20 mx-auto my-2 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner border-2 border-white/20"
                 style={{ backgroundColor: currentChar.color }}>
              {currentChar.name[0]}
            </div>
            <h2 className="text-2xl font-extrabold text-white">{currentChar.name}</h2>
            <p className="text-xs text-amber-300 mt-1">{currentChar.trait}</p>

            {/* Equipped Items Preview */}
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap justify-center gap-1.5">
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

          {/* Action Buttons */}
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
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                    isSelected ? 'bg-indigo-900/80 border-amber-400' : 'bg-slate-900/80 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border border-white/20"
                         style={{ backgroundColor: char.color }}>
                      {char.name[0]}
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
        <div className="relative w-full h-full">
          <canvas ref={canvasRef} className="block w-full h-full touch-none" />
          {/* Active Power Icons */}
          {activePowersUI.length > 0 && (
            <div className="fixed top-4 right-4 flex gap-1.5 bg-slate-900/75 px-3 py-1.5 rounded-full border border-amber-400/40">
              {activePowersUI.map((ic, idx) => <span key={idx} className="text-base">{ic}</span>)}
            </div>
          )}
          <div className="fixed bottom-3 w-full text-center pointer-events-none">
            <span className="bg-black/40 text-white/80 text-[11px] px-3 py-1 rounded-full">
              সোয়াইপ করো: ⬅️ বামে | ➡️ ডানে | ⬆️ জাম্প | ⬇️ স্লাইড
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
                  ধরেছেন: {lastRunStats.caughtBy.name} ({lastRunStats.caughtBy.weapon})
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
