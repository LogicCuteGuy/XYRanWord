import './style.css';
import initSqlJs from 'sql.js';

// --- Types ---
interface WordEntry {
  word: string;
  category: string;
}

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  weight: number;
  vx: number; // Velocity X
  vy: number; // Velocity Y
}

// --- State ---
let db: any = null;
let SQL: any = null;
let categories: string[] = [];
const nodes: Node[] = [];
let focusPoint = { x: 0.5, y: 0.5 };
let isDraggingNode: Node | null = null;
let isDraggingFocus = false;

// --- UI Elements ---
const initOverlay = document.getElementById('init-overlay')!;
const mainContent = document.getElementById('main-content')!;
const dbUpload = document.getElementById('db-upload') as HTMLInputElement;
const createDbBtn = document.getElementById('create-db')!;
const wordDisplay = document.getElementById('word-display')!;
const currentCategoryEl = document.getElementById('current-category')!;
const generateBtn = document.getElementById('generate-btn')!;
const translateBtn = document.getElementById('translate-btn')!;
const exportBtn = document.getElementById('export-db')!;
const openSettingsBtn = document.getElementById('open-settings')!;
const closeSettingsBtn = document.getElementById('close-settings')!;
const settingsModal = document.getElementById('settings-modal')!;
const jsonInput = document.getElementById('json-input') as HTMLTextAreaElement;
const importJsonBtn = document.getElementById('import-json')!;
const aiSchemaEl = document.getElementById('ai-schema')!;
const xyMapCanvas = document.getElementById('xy-map') as HTMLCanvasElement;
const focusRing = document.getElementById('focus-ring')!;
const wordListEl = document.getElementById('word-list')!;
const wordSearchInput = document.getElementById('word-search') as HTMLInputElement;
const resetDbBtn = document.getElementById('reset-db')!;
const toggleModeBtn = document.getElementById('toggle-mode')!;
const themeBtns = document.querySelectorAll('.theme-btn');
const langBtns = document.querySelectorAll('.lang-btn');

// --- Translations ---
const translations: Record<string, Record<string, string>> = {
  en: {
    init_msg: 'Please import your data.db to begin.',
    upload_btn: 'Click to upload data.db',
    no_db: "Don't have one?",
    create_db: 'Create a new database',
    map_header: 'Weighting Map',
    neutral_balance: 'Neutral Balance',
    map_instr: 'Drag nodes to influence categories.',
    sel_cat: 'Select Category',
    translate: 'Translate',
    gen_btn: 'GENERATE WORD',
    settings: 'Settings',
    export: 'Export .db',
    pref_title: 'Preferences',
    language: 'Language',
    appearance: 'Appearance',
    toggle_mode: 'Toggle Mode',
    manage_words: 'Manage Words',
    search: 'Search...',
    bulk_import: 'Bulk Import',
    import_btn: 'Import Words',
    ai_schema: 'AI Prompt Schema',
    wipe_db: 'Wipe Database'
  },
  jp: {
    init_msg: 'data.dbをインポートして開始してください。',
    upload_btn: 'data.dbをアップロード',
    no_db: "ファイルをお持ちでない場合",
    create_db: '新しいデータベースを作成',
    map_header: '重み付けマップ',
    neutral_balance: 'ニュートラルなバランス',
    map_instr: 'ノードをドラッグしてカテゴリを調整します。',
    sel_cat: 'カテゴリを選択',
    translate: '翻訳',
    gen_btn: '単語を生成',
    settings: '設定',
    export: '.dbをエクスポート',
    pref_title: 'ユーザー設定',
    language: '言語',
    appearance: '外観',
    toggle_mode: 'モード切替',
    manage_words: '単語管理',
    search: '検索...',
    bulk_import: '一括インポート',
    import_btn: '単語をインポート',
    ai_schema: 'AIプロンプトスキーマ',
    wipe_db: 'データベースを消去'
  },
  th: {
    init_msg: 'กรุณานำเข้าไฟล์ data.db เพื่อเริ่มต้น',
    upload_btn: 'คลิกเพื่ออัปโหลด data.db',
    no_db: "ยังไม่มีไฟล์ใช่ไหม?",
    create_db: 'สร้างฐานข้อมูลใหม่',
    map_header: 'แผนผังการถ่วงน้ำหนัก',
    neutral_balance: 'ความสมดุลปกติ',
    map_instr: 'ลากโหนดเพื่อปรับแต่งหมวดหมู่',
    sel_cat: 'เลือกหมวดหมู่',
    translate: 'แปลภาษา',
    gen_btn: 'สุ่มคำศัพท์',
    settings: 'ตั้งค่า',
    export: 'ส่งออก .db',
    pref_title: 'การตั้งค่า',
    language: 'ภาษา',
    appearance: 'รูปลักษณ์',
    toggle_mode: 'เปลี่ยนโหมด',
    manage_words: 'จัดการคำศัพท์',
    search: 'ค้นหา...',
    bulk_import: 'นำเข้าข้อมูลจำนวนมาก',
    import_btn: 'นำเข้าคำศัพท์',
    ai_schema: 'รูปแบบสำหรับ AI',
    wipe_db: 'ล้างฐานข้อมูล'
  }
};

// --- DB Logic ---
async function init() {
  loadSettings();
  try {
    SQL = await initSqlJs({
      locateFile: file => {
        const path = `${import.meta.env.BASE_URL}${file}`;
        console.log('SQL.js loading:', path);
        return path;
      }
    });
  } catch (err) {
    console.error('Failed to initialize SQL.js:', err);
    // Fallback if needed or show error to user
  }
  
  // Show AI Schema
  const schema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        word: { type: "string" },
        category: { type: "string" }
      },
      required: ["word", "category"]
    }
  };
  aiSchemaEl.textContent = JSON.stringify(schema, null, 2);
}

function setupDatabase(data?: ArrayBuffer) {
  if (data) {
    db = new SQL.Database(new Uint8Array(data));
    // Ensure unique constraint exists for older DBs if necessary, 
    // but for simplicity we'll assume new DBs or handle it in logic.
  } else {
    db = new SQL.Database();
    db.run("CREATE TABLE words (id INTEGER PRIMARY KEY, word TEXT, category TEXT, UNIQUE(word, category))");
    // Default words
    db.run("INSERT OR REPLACE INTO words (word, category) VALUES ('Serenity', 'Abstract'), ('Luminous', 'Visual'), ('Petrichor', 'Nature'), ('Ephemeral', 'Time')");
  }
  
  refreshCategories();
  renderWordList();
  showApp();
}

function refreshCategories() {
  const res = db.exec("SELECT DISTINCT category FROM words");
  const currentCategories = res[0] ? res[0].values.map((v: any) => v[0]) : [];
  
  // Remove nodes for categories that no longer exist
  const nodesToRemove = nodes.filter(n => !currentCategories.includes(n.label));
  nodesToRemove.forEach(n => {
    const idx = nodes.indexOf(n);
    if (idx > -1) nodes.splice(idx, 1);
  });

  // Add nodes for new categories
  currentCategories.forEach((cat: string) => {
    if (!nodes.find(n => n.label === cat)) {
      nodes.push({
        id: Math.random().toString(36).substr(2, 9),
        label: cat,
        x: Math.random() * 0.8 + 0.1,
        y: Math.random() * 0.8 + 0.1,
        weight: 1,
        vx: 0,
        vy: 0
      });
    }
  });

  categories = currentCategories;
  drawMap();
}

function updateNodePhysics() {
  const repulsionForce = 0.0005;
  const minDistance = 0.15;
  const friction = 0.9;

  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    if (nodeA === isDraggingNode) continue;

    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];
      
      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;

      if (dist < minDistance) {
        const force = (minDistance - dist) * repulsionForce;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (nodeB !== isDraggingNode) {
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
        nodeA.vx -= fx;
        nodeA.vy -= fy;
      }
    }

    // Apply velocity and boundaries
    nodeA.x += nodeA.vx;
    nodeA.y += nodeA.vy;
    nodeA.vx *= friction;
    nodeA.vy *= friction;

    // Boundary constraints
    nodeA.x = Math.max(0.08, Math.min(0.92, nodeA.x));
    nodeA.y = Math.max(0.08, Math.min(0.92, nodeA.y));
  }
}

function animate() {
  updateNodePhysics();
  drawMap();
  requestAnimationFrame(animate);
}

function renderWordList() {
  if (!db) return;
  const searchTerm = wordSearchInput.value.toLowerCase();
  const res = db.exec("SELECT id, word, category FROM words ORDER BY category, word");
  
  wordListEl.innerHTML = '';
  
  if (res[0]) {
    res[0].values.forEach((row: any) => {
      const id = row[0];
      const word = row[1];
      const category = row[2];
      
      if (word.toLowerCase().includes(searchTerm) || category.toLowerCase().includes(searchTerm)) {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 glass rounded-lg group hover:bg-primary/5 transition-colors';
        item.innerHTML = `
          <div class="flex flex-col">
            <span class="font-medium">${word}</span>
            <span class="text-[10px] text-primary uppercase tracking-tighter font-bold">${category}</span>
          </div>
          <button data-id="${id}" class="delete-word-btn opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        `;
        wordListEl.appendChild(item);
      }
    });
  }

  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-word-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      deleteWord(id);
    });
  });
}

function deleteWord(id: string | null) {
  if (!id) return;
  db.run(`DELETE FROM words WHERE id = ${id}`);
  renderWordList();
  refreshCategories();
}

// --- Theme Logic ---
function loadSettings() {
  const mode = localStorage.getItem('mode') || 'dark';
  const theme = localStorage.getItem('theme') || 'indigo';
  const lang = localStorage.getItem('lang') || 'en';
  
  if (mode === 'light') document.documentElement.classList.add('light');
  setTheme(theme);
  setLanguage(lang);
}

function updateThemeUI(theme: string, mode: string) {
  themeBtns.forEach(btn => {
    btn.classList.toggle('ring-2', btn.getAttribute('data-theme') === theme);
    btn.classList.toggle('ring-primary', btn.getAttribute('data-theme') === theme);
  });
  toggleModeBtn.textContent = mode === 'dark' ? 'Toggle Light Mode' : 'Toggle Dark Mode';
}

function toggleMode() {
  const isLight = document.documentElement.classList.toggle('light');
  const mode = isLight ? 'light' : 'dark';
  localStorage.setItem('mode', mode);
  toggleModeBtn.textContent = isLight ? 'Toggle Dark Mode' : 'Toggle Light Mode';
  drawMap(); // Refresh canvas colors
}

function setTheme(theme: string) {
  // Remove all theme classes
  const root = document.documentElement;
  const themeClasses = Array.from(root.classList).filter(c => c.startsWith('theme-'));
  root.classList.remove(...themeClasses);
  root.classList.add(`theme-${theme}`);
  
  localStorage.setItem('theme', theme);
  updateThemeUI(theme, localStorage.getItem('mode') || 'dark');
  drawMap(); // Refresh canvas colors
}

function setLanguage(lang: string) {
  localStorage.setItem('lang', lang);
  const t = translations[lang];
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')!;
    if (t[key]) el.textContent = t[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder')!;
    if (t[key]) (el as HTMLInputElement).placeholder = t[key];
  });

  langBtns.forEach(btn => {
    btn.classList.toggle('bg-primary', btn.getAttribute('data-lang') === lang);
    btn.classList.toggle('text-white', btn.getAttribute('data-lang') === lang);
  });
}




function getRandomWord() {
  if (categories.length === 0) return { word: "No words found", category: "N/A" };
  
  // Calculate weights based on focus distance
  const weightedCats = nodes.map(node => {
    const dx = node.x - focusPoint.x;
    const dy = node.y - focusPoint.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    // Gaussian-like weight: e^(-dist^2 / 2σ^2)
    const weight = Math.exp(-(dist * dist) / (2 * 0.15 * 0.15));
    return { label: node.label, weight };
  });

  const totalWeight = weightedCats.reduce((acc, c) => acc + c.weight, 0);
  let random = Math.random() * totalWeight;
  
  let selectedCat = weightedCats[0].label;
  for (const cat of weightedCats) {
    if (random < cat.weight) {
      selectedCat = cat.label;
      break;
    }
    random -= cat.weight;
  }

  const res = db.exec(`SELECT word, category FROM words WHERE category = '${selectedCat.replace(/'/g, "''")}' ORDER BY RANDOM() LIMIT 1`);
  if (res[0] && res[0].values[0]) {
    return { word: res[0].values[0][0], category: res[0].values[0][1] };
  }
  return { word: "Empty Category", category: selectedCat };
}

// --- UI Logic ---
function showApp() {
  initOverlay.classList.add('hidden');
  mainContent.classList.remove('hidden');
  setTimeout(() => mainContent.classList.add('opacity-100'), 50);
  resizeCanvas();
}

function resizeCanvas() {
  const container = xyMapCanvas.parentElement!;
  xyMapCanvas.width = container.clientWidth;
  xyMapCanvas.height = container.clientHeight;
  drawMap();
}

function drawMap() {
  const ctx = xyMapCanvas.getContext('2d')!;
  const w = xyMapCanvas.width;
  const h = xyMapCanvas.height;
  
  const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#6366f1';
  const primaryGlow = getComputedStyle(document.body).getPropertyValue('--primary-glow').trim() || 'rgba(99, 102, 241, 0.2)';
  const textColor = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#94a3b8';

  ctx.clearRect(0, 0, w, h);
  
  // Draw connections/grid
  ctx.strokeStyle = localStorage.getItem('mode') === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
  ctx.beginPath();
  for(let i=0; i<=10; i++) {
    ctx.moveTo(i * w/10, 0); ctx.lineTo(i * w/10, h);
    ctx.moveTo(0, i * h/10); ctx.lineTo(w, i * h/10);
  }
  ctx.stroke();

  // Draw Nodes
  nodes.forEach(node => {
    const nx = node.x * w;
    const ny = node.y * h;
    
    // Gradient glow
    const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, 40);
    grad.addColorStop(0, primaryGlow);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(nx, ny, 40, 0, Math.PI * 2);
    ctx.fill();

    // Node circle
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(nx, ny, 6, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = textColor;
    ctx.font = 'bold 12px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(node.label, nx, ny - 15);
  });

  // Update Focus Ring position
  focusRing.style.left = `${focusPoint.x * 100}%`;
  focusRing.style.top = `${focusPoint.y * 100}%`;
  focusRing.style.transform = 'translate(-50%, -50%)';
}

// --- Event Listeners ---
dbUpload.addEventListener('change', (e: any) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function() {
    setupDatabase(this.result as ArrayBuffer);
  };
  reader.readAsArrayBuffer(file);
});

createDbBtn.addEventListener('click', () => setupDatabase());

generateBtn.addEventListener('click', () => {
  const { word, category } = getRandomWord();
  wordDisplay.textContent = word;
  currentCategoryEl.textContent = category;
  
  // Animation
  wordDisplay.classList.remove('animate-in', 'fade-in', 'zoom-in');
  void wordDisplay.offsetWidth; // trigger reflow
  wordDisplay.classList.add('animate-in', 'fade-in', 'zoom-in', 'duration-300');
});

translateBtn.addEventListener('click', () => {
  const word = wordDisplay.textContent;
  if (word && word !== '...') {
    window.open(`https://translate.google.com/?sl=auto&tl=th&text=${encodeURIComponent(word)}&op=translate`, '_blank');
  }
});

exportBtn.addEventListener('click', () => {
  const data = db.export();
  const blob = new Blob([data], { type: "application/x-sqlite3" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.db";
  a.click();
});

openSettingsBtn.addEventListener('click', () => {
  renderWordList();
  settingsModal.classList.remove('hidden');
});
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

wordSearchInput.addEventListener('input', renderWordList);

toggleModeBtn.addEventListener('click', toggleMode);

themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.getAttribute('data-theme');
    if (theme) setTheme(theme);
  });
});

langBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.getAttribute('data-lang');
    if (lang) setLanguage(lang);
  });
});

importJsonBtn.addEventListener('click', () => {
  try {
    const data = JSON.parse(jsonInput.value);
    const words = Array.isArray(data) ? data : [data];
    
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("INSERT OR REPLACE INTO words (word, category) VALUES (?, ?)");
    words.forEach((w: WordEntry) => {
      if (w.word && w.category) {
        stmt.run([w.word, w.category]);
      }
    });
    stmt.free();
    db.run("COMMIT");
    
    refreshCategories();
    renderWordList();
    alert(`Successfully imported ${words.length} words!`);
    jsonInput.value = '';
    settingsModal.classList.add('hidden');
  } catch (e) {
    alert("Invalid JSON format. Please use: [{word, category}, ...]");
  }
});

resetDbBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to wipe the entire database? This cannot be undone.")) {
    db.run("DELETE FROM words");
    nodes.length = 0;
    refreshCategories();
    renderWordList();
    settingsModal.classList.add('hidden');
  }
});

// Canvas Interaction
xyMapCanvas.addEventListener('mousedown', (e) => {
  const rect = xyMapCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  // Check if clicked near a node
  const hitNode = nodes.find(n => {
    const dx = n.x - x;
    const dy = n.y - y;
    return Math.sqrt(dx*dx + dy*dy) < 0.05;
  });

  if (hitNode) {
    isDraggingNode = hitNode;
  } else {
    // Check if clicked near focus
    const dx = focusPoint.x - x;
    const dy = focusPoint.y - y;
    if (Math.sqrt(dx*dx + dy*dy) < 0.05) {
      isDraggingFocus = true;
    } else {
      // Move focus here directly
      focusPoint = { x, y };
      drawMap();
    }
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isDraggingNode && !isDraggingFocus) return;
  
  const rect = xyMapCanvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

  if (isDraggingNode) {
    isDraggingNode.x = x;
    isDraggingNode.y = y;
  } else if (isDraggingFocus) {
    focusPoint = { x, y };
  }
  
  drawMap();
});

window.addEventListener('mouseup', () => {
  isDraggingNode = null;
  isDraggingFocus = false;
});

// Touch Support
xyMapCanvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = xyMapCanvas.getBoundingClientRect();
  const x = (touch.clientX - rect.left) / rect.width;
  const y = (touch.clientY - rect.top) / rect.height;

  const hitNode = nodes.find(n => {
    const dx = n.x - x;
    const dy = n.y - y;
    return Math.sqrt(dx*dx + dy*dy) < 0.08;
  });

  if (hitNode) {
    isDraggingNode = hitNode;
  } else {
    const dx = focusPoint.x - x;
    const dy = focusPoint.y - y;
    if (Math.sqrt(dx*dx + dy*dy) < 0.08) {
      isDraggingFocus = true;
    } else {
      focusPoint = { x, y };
      drawMap();
    }
  }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (!isDraggingNode && !isDraggingFocus) return;
  e.preventDefault();
  const touch = e.touches[0];
  const rect = xyMapCanvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));

  if (isDraggingNode) {
    isDraggingNode.x = x;
    isDraggingNode.y = y;
  } else if (isDraggingFocus) {
    focusPoint = { x, y };
  }
  drawMap();
}, { passive: false });

window.addEventListener('touchend', () => {
  isDraggingNode = null;
  isDraggingFocus = false;
});

window.addEventListener('resize', resizeCanvas);


// Init
init();
animate();
