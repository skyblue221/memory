// ── 상수 ──────────────────────────────────────────────
const STORAGE_KEY  = "membox-records-v1";
const VERSION_KEY  = "membox-version";
const DATA_VERSION = "1";

// ── Supabase ──────────────────────────────────────────
const SUPA_URL = "https://isipaiefpiugdtbgrwmo.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaXBhaWVmcGl1Z2R0Ymdyd21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTMxMTEsImV4cCI6MjA5NjQ4OTExMX0.GJjd65CgqM20LvfZMwxdlmR1if4mJehBWjii8JpYeXk";

const supa = {
  async getAll() {
    const res = await fetch(`${SUPA_URL}/rest/v1/records?order=date.desc`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.map(r => ({
      id: r.id, type: r.type, title: r.title, author: r.author,
      isbn: r.isbn, coverUrl: r.cover_url, content: r.content,
      imageUrl: r.image_url, review: r.review, quote: r.quote,
      finishedDate: r.finished_date, date: r.date,
      tags: r.tags || [], createdAt: r.created_at,
    }));
  },
  async upsert(record) {
    // base64 이미지는 Supabase 저장 크기 초과할 수 있어서 1MB 이상이면 스킵
    const imageUrl = record.imageUrl && record.imageUrl.length < 1000000 ? record.imageUrl : null;
    const coverUrl = record.coverUrl && record.coverUrl.length < 1000000 ? record.coverUrl : null;
    const row = {
      id: record.id, type: record.type, title: record.title,
      author: record.author || null, isbn: record.isbn || null,
      cover_url: coverUrl, content: record.content || null,
      image_url: imageUrl, review: record.review || null,
      quote: record.quote || null, finished_date: record.finishedDate || null,
      date: record.date, tags: record.tags || [],
      created_at: record.createdAt || new Date().toISOString(),
    };
    const res = await fetch(`${SUPA_URL}/rest/v1/records`, {
      method: "POST",
      headers: {
        apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify(row),
    });
    if(!res.ok) console.warn("Supabase 저장 실패", await res.text());
  },
  async deleteAll() {
    await fetch(`${SUPA_URL}/rest/v1/records?id=neq.none`, {
      method: "DELETE",
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
    });
  }
};

const SPINE_COLORS = [
  ["#8b5e3c","#6b4428"],["#4a7c6f","#2f5c52"],["#7a5c7e","#5a3c5e"],
  ["#5c7a9e","#3c5a7e"],["#8e7050","#6e5030"],["#6b8a5c","#4b6a3c"],
  ["#9e6060","#7e4040"],["#607890","#405870"],["#7a6e5a","#5a4e3a"],
];

const MEMO_BG = ["#f5f0e6","#eef3f0","#eeedf5","#f5eeee","#eef3f5"];

const SEED_DATA = [
  { id:"s-b1", type:"book", title:"모순", author:"양귀자",
    isbn:"9788937461033",
    coverUrl:"https://covers.openlibrary.org/b/isbn/9788937461033-L.jpg",
    finishedDate:"2026-05-10", date:"2026-05-10",
    review:"생각보다 오래 남는 이야기",
    quote:"",tags:["소설"] },
  { id:"s-b2", type:"book", title:"채식주의자", author:"한강",
    isbn:"9788936433598",
    coverUrl:"https://covers.openlibrary.org/b/isbn/9788936433598-L.jpg",
    finishedDate:"2026-03-15", date:"2026-03-15",
    review:"오랫동안 머릿속을 맴돌았다.",
    quote:"다시 펼치면 다른 나를 만나게 될 것 같다.",
    tags:["소설","한강"] },
  { id:"s-m1", type:"memory", title:"노을",
    content:"오늘은 조금 평온했다",
    imageUrl:"", date:"2026-06-05", tags:["일상"] },
  { id:"s-m2", type:"memory", title:"요즘 자꾸 생각나는 것들",
    content:"오래된 책방. 낡은 목재 선반. 커피 냄새. 비가 오는 날.",
    imageUrl:"", date:"2026-06-03", tags:["단상"] },
  { id:"s-m3", type:"memory", title:"전시 준비",
    content:"생각보다 잘 될 것 같다",
    imageUrl:"", date:"2026-06-03", tags:["타임클라우드"] },
  { id:"s-m4", type:"memory", title:"모니터링단 아이디어",
    content:"온라인 폼 + 알림톡 연계해보면 어떨까",
    imageUrl:"", date:"2026-05-28", tags:["업무","아이디어"] },
];

// ── 유틸 ──────────────────────────────────────────────
function seedN(str){ return str.split("").reduce((a,c)=>a+c.charCodeAt(0),0); }
function today(){ return new Date().toISOString().slice(0,10); }
function fmt(iso){
  if(!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${y}년 ${+m}월 ${+d}일`;
}
function showToast(msg){
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
    background:var(--ink);color:#fff;padding:10px 20px;border-radius:99px;
    font-size:13px;font-weight:500;z-index:999;opacity:0;transition:opacity 250ms;
    white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.2);`;
  document.body.appendChild(t);
  requestAnimationFrame(()=>{ t.style.opacity="1"; });
  setTimeout(()=>{ t.style.opacity="0"; setTimeout(()=>t.remove(), 300); }, 2000);
}

function esc(str){
  return String(str||"")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// 이미지를 리사이즈 + 압축해서 base64로 반환
// maxSize: 가로/세로 중 긴 쪽의 최대 픽셀 (기본 800px)
// quality: JPEG 압축 품질 0~1 (기본 0.7)
function resizeImageFile(file, maxSize = 800, quality = 0.7){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        // JPEG로 압축 (투명 배경이 필요없는 사진/표지에 적합)
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function groupBy(arr, fn){
  return arr.reduce((a,x)=>{ const k=fn(x); (a[k]=a[k]||[]).push(x); return a; }, {});
}
function tagsHtml(tags){
  if(!tags||!tags.length) return "";
  return `<div class="tag-row">${tags.map(t=>`<span class="tag">#${esc(t)}</span>`).join("")}</div>`;
}

// ── 데이터 ────────────────────────────────────────────
function loadRecords(){
  // localStorage 폴백 (Supabase 로드 전 임시)
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch(_){}
  return [];
}

function saveRecords(records){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

async function syncFromSupabase(){
  try {
    const rows = await supa.getAll();
    if (rows === null) {
      console.warn("Supabase 응답 없음, localStorage 사용");
      return;
    }
    if (rows.length > 0) {
      state.records = rows;
      saveRecords(rows);
    } else {
      // Supabase 비어있으면 localStorage 샘플도 비우기
      state.records = [];
      saveRecords([]);
    }
    renderView(state.tab);
  } catch(e){
    console.warn("Supabase 연결 실패, localStorage 사용", e);
  }
}

async function addRecord(record){
  state.records = [record, ...state.records];
  saveRecords(state.records);
  renderView(state.tab);
  // 백그라운드로 Supabase에 저장
  try { await supa.upsert(record); } catch(_){}
}

// ── 상태 ──────────────────────────────────────────────
let state = {
  tab: "home",
  records: loadRecords(),
};

// ── DOM refs ──────────────────────────────────────────
const $ = id => document.getElementById(id);
const views = {
  home:     $("view-home"),
  shelf:    $("view-shelf"),
  memories: $("view-memories"),
  recall:   $("view-recall"),
};
const navBtns      = document.querySelectorAll(".nav-btn");
const detailOverlay = $("detailOverlay");
const detailModal   = $("detailModal");
const sheetOverlay  = $("sheetOverlay");
const sheetContent  = $("sheetContent");

// ── 탭 전환 ───────────────────────────────────────────
function setTab(tab){
  state.tab = tab;
  Object.entries(views).forEach(([id, el])=>{
    el.classList.toggle("active", id === tab);
  });
  navBtns.forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  updateHeaderDate();
  renderView(tab);
}

// ── 렌더 진입 ─────────────────────────────────────────
function renderView(tab){
  if(tab==="home")     renderHome();
  if(tab==="shelf")    renderShelf();
  if(tab==="memories") renderMemories();
  if(tab==="recall")   renderRecall();
}

// ── 홈 ───────────────────────────────────────────────
function renderHome(){
  const now = new Date();
  const mmdd = now.toISOString().slice(5,10);
  const yr = String(now.getFullYear());
  const records = [...state.records].sort((a,b)=>b.date.localeCompare(a.date));

  const todayMems = records.filter(r=>r.date.slice(5,10)===mmdd && r.date.slice(0,4)!==yr);
  const featured = todayMems[0] || records[0];
  const recent = records.slice(0,5);

  let html = "";

  // 오늘의 기억
  html += `<p class="section-eyebrow">오늘의 기억</p>`;
  if(featured){
    const yago = now.getFullYear() - +featured.date.slice(0,4);
    const label = yago > 0 ? `${yago}년 전 오늘` : "최근의 기억";
    const desc = featured.review || featured.content || "";
    html += `<div class="today-card" data-id="${esc(featured.id)}" style="cursor:pointer">
      <p class="today-label">${esc(label)}</p>
      <p class="today-title">${esc(featured.title)}</p>
      ${desc ? `<p class="today-desc">"${esc(desc)}"</p>` : ""}
    </div>`;
  } else {
    html += `<div class="today-card" id="emptyTodayCard" style="cursor:pointer;text-align:center">
      <p style="font-size:24px;margin-bottom:8px">📝</p>
      <p class="today-title" style="font-size:15px">첫 기억을 남겨볼까요?</p>
      <p class="today-desc" style="margin-top:4px">탭해서 기록 시작하기</p>
    </div>`;
  }

  // 최근 기록
  html += `<p class="section-eyebrow">최근 기록</p><div class="recent-list">`;
  recent.forEach(r=>{
    const s = seedN(r.id);
    const [c1,c2] = SPINE_COLORS[s % SPINE_COLORS.length];
    const thumbContent = r.type==="book" && r.coverUrl
      ? `<img src="${esc(r.coverUrl)}" alt="" onerror="this.style.display='none'">`
      : r.type==="book" ? "📚" : r.imageUrl ? `<img src="${esc(r.imageUrl)}" alt="">` : "📝";
    html += `<div class="recent-item" data-id="${esc(r.id)}" style="cursor:pointer">
      <div class="recent-thumb" style="background:linear-gradient(160deg,${c1},${c2})">${thumbContent}</div>
      <div style="flex:1;min-width:0">
        <p class="recent-title">${esc(r.title)}</p>
        <p class="recent-date">${fmt(r.date)}</p>
      </div>
    </div>`;
  });
  html += `</div>`;

  html += `<div style="margin-top:32px;padding-top:16px;border-top:0.5px solid var(--line);text-align:center;display:flex;gap:8px;justify-content:center">
    <button id="resetDataBtn" style="background:none;border:0.5px solid var(--line);border-radius:8px;
      padding:8px 16px;font-size:11px;color:var(--muted);font-family:var(--sans);cursor:pointer">
      샘플 데이터로 초기화
    </button>
    <button id="clearDataBtn" style="background:none;border:0.5px solid rgba(200,80,80,0.3);border-radius:8px;
      padding:8px 16px;font-size:11px;color:rgba(180,60,60,0.7);font-family:var(--sans);cursor:pointer">
      전체 삭제
    </button>
  </div>`;

  views.home.innerHTML = html;

  // 클릭 이벤트 — 오늘의 기억, 최근 기록
  views.home.querySelectorAll("[data-id]").forEach(el=>{
    el.addEventListener("click", ()=>openDetail(el.dataset.id));
  });

  // 빈 상태 카드 — 누르면 기록 추가 시트
  const emptyCard = document.getElementById("emptyTodayCard");
  if(emptyCard) emptyCard.addEventListener("click", openAddSheet);

  const resetBtn = document.getElementById("resetDataBtn");
  if(resetBtn){
    resetBtn.addEventListener("click", ()=>{
      if(confirm("모든 기록이 삭제되고 샘플 데이터로 초기화됩니다.\n계속할까요?")){
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(VERSION_KEY);
        state.records = loadRecords();
        renderView(state.tab);
      }
    });
  }

  const clearBtn = document.getElementById("clearDataBtn");
  if(clearBtn){
    clearBtn.addEventListener("click", async ()=>{
      if(confirm("모든 기록이 완전히 삭제됩니다.\n되돌릴 수 없어요. 계속할까요?")){
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(VERSION_KEY, DATA_VERSION);
        state.records = [];
        renderView(state.tab);
        try { await supa.deleteAll(); } catch(_){}
      }
    });
  }
}

// ── 서가 ─────────────────────────────────────────────
function renderShelf(){
  const books = state.records.filter(r=>r.type==="book");
  const thisYear = String(new Date().getFullYear());
  const byYear = groupBy(books, b=>(b.finishedDate||b.date).slice(0,4));

  // 올해 서가가 없으면 빈 선반으로 추가
  if(!byYear[thisYear]) byYear[thisYear] = [];

  let html = `<p class="section-eyebrow">나의 서가</p>`;

  Object.entries(byYear).sort(([a],[b])=>+b-+a).forEach(([year, ybooks])=>{
    // 책 순서: 오래된 것(왼쪽) → 최신(오른쪽)
    ybooks = [...ybooks].sort((a,b)=>(a.finishedDate||a.date).localeCompare(b.finishedDate||b.date));
    html += `<div class="shelf-year">
      <div class="shelf-year-label">
        <span class="shelf-year-title">${esc(year)}년</span>
        <span class="shelf-year-count">${ybooks.length ? ybooks.length+"권" : "아직 비어있어요"}</span>
      </div>
      <div class="shelf-frame">
        <div class="shelf-rail">
          ${!ybooks.length ? `<button id="emptyShelfBtn"
            style="width:100%;padding:20px 0;text-align:center;font-size:12px;
            color:var(--muted);font-style:italic;background:none;border:none;
            cursor:pointer;font-family:var(--sans)">
            + 탭해서 첫 책을 담아보세요
          </button>` : ""}`;

    ybooks.forEach(b=>{
      const s = seedN(b.id);
      const [c1,c2] = SPINE_COLORS[s % SPINE_COLORS.length];
      const w = 36 + (s%5)*5;
      const h = 120 + (s%6)*14;
      html += `<button class="book-spine-btn" data-id="${esc(b.id)}" title="${esc(b.title)}">
        <div class="book-spine-inner" style="width:${w}px;height:${h}px">
          <div class="book-spine-text" style="background:linear-gradient(160deg,${c1},${c2})">${esc(b.title)}</div>
        </div>
      </button>`;
    });

    html += `</div><div class="shelf-plank"></div></div></div>`;
  });

  views.shelf.innerHTML = html;
  views.shelf.querySelectorAll(".book-spine-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>openDetail(btn.dataset.id));
  });

  const emptyShelfBtn = document.getElementById("emptyShelfBtn");
  if(emptyShelfBtn) emptyShelfBtn.addEventListener("click", ()=>{
    openAddSheet();
    // 바텀시트 열리면 바로 책 담기로
    setTimeout(()=>{ const pickBook = document.getElementById("pickBook"); if(pickBook) pickBook.click(); }, 100);
  });
}

// ── 기억 ─────────────────────────────────────────────
function renderMemories(){
  const mems = state.records.filter(r=>r.type==="memory");
  if(!mems.length){ views.memories.innerHTML = `<p class="empty-state">아직 담긴 기억이 없어요.</p>`; return; }

  const byMonth = groupBy(mems, m=>m.date.slice(0,7));
  let html = "";

  Object.entries(byMonth).sort(([a],[b])=>b.localeCompare(a)).forEach(([month, mlist])=>{
    const [y,mo] = month.split("-");
    html += `<div style="margin-bottom:28px">
      <p class="section-divider">${esc(y)}년 ${+mo}월</p>
      <div class="polaroid-grid">`;

    mlist.forEach((m,i)=>{
      const rot = [-1.8,1.2,-0.6,2.1,-1.2][i%5];
      const s = seedN(m.id);
      const tape = i%2===0 ? `<div class="polaroid-tape"></div>` : "";
      const caption = m.content
        ? `"${esc(m.content.slice(0,18))}${m.content.length>18?"…":""}"`
        : esc(m.title);
      const lines = (m.content || m.title || "").split(/(?<=.{14})/g).slice(0,6).join("\n");
      const photo = m.imageUrl
        ? `<img class="polaroid-photo" src="${esc(m.imageUrl)}" alt="${esc(m.title)}">`
        : `<div class="polaroid-memo">
             <p class="polaroid-memo-text">${esc(m.content || m.title || "")}</p>
           </div>`;

      const showCaption = !!m.imageUrl;
      html += `<button class="polaroid" data-id="${esc(m.id)}"
        style="transform:rotate(${rot}deg)">
        ${tape}${photo}
        ${showCaption ? `<p class="polaroid-caption">${caption}</p>` : ""}
        <p class="polaroid-date">${m.date.slice(5).replace("-",".")}</p>
      </button>`;
    });

    html += `</div></div>`;
  });

  views.memories.innerHTML = html;
  views.memories.querySelectorAll(".polaroid").forEach(btn=>{
    btn.addEventListener("click", ()=>openDetail(btn.dataset.id));
  });
}

// ── 회상 ─────────────────────────────────────────────
function renderRecall(){
  const now = new Date();
  const mmdd = now.toISOString().slice(5,10);
  const yr = now.getFullYear();
  const records = state.records;

  let html = "";

  // 오늘의 추억
  const todayRecs = records.filter(r=>r.date.slice(5,10)===mmdd && +r.date.slice(0,4)<yr);
  html += `<p class="section-divider">오늘의 추억 — ${+mmdd.slice(0,2)}월 ${+mmdd.slice(3,5)}일</p>`;
  if(!todayRecs.length){
    html += `<p style="font-size:13px;color:var(--muted);padding:12px 0 20px">아직 이 날의 기억이 없어요.</p>`;
  } else {
    todayRecs.slice(0,3).forEach(r=>{
      const yago = yr - +r.date.slice(0,4);
      const icon = r.type==="book" ? "📚" : "📷";
      const desc = r.review || r.content || "";
      html += `<div class="recall-today-item" data-id="${esc(r.id)}" style="cursor:pointer">
        <span class="recall-badge">${yago}년 전</span>
        <div>
          <p class="recall-title">${icon} ${esc(r.title)}</p>
          ${desc ? `<p class="recall-desc">"${esc(desc)}"</p>` : ""}
        </div>
      </div>`;
    });
  }

  // 월별 요약
  const pastMonths = [
    {offset:-1, label:"지난달"},
    {offset:-12, label:"1년 전 이번달"},
    {offset:-24, label:"2년 전 이번달"},
  ];
  pastMonths.forEach(({offset,label})=>{
    const t = new Date(now.getFullYear(), now.getMonth()+offset, 1);
    const ym = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`;
    const recs = records.filter(r=>r.date.startsWith(ym));
    if(!recs.length) return;

    const bc = recs.filter(r=>r.type==="book").length;
    const pc = recs.filter(r=>r.type==="memory"&&r.imageUrl).length;
    const mc = recs.filter(r=>r.type==="memory"&&!r.imageUrl).length;
    const tags = recs.flatMap(r=>r.tags||[]);
    const focus = tags[0] ? `${tags[0]}에 마음이 머문` : "작은 순간을 붙잡은";
    const summary = `${focus} 시기였습니다.`;

    html += `<div style="margin-bottom:20px">
      <p class="section-divider">${t.getFullYear()}년 ${t.getMonth()+1}월 — ${esc(label)}</p>
      <div class="month-card">
        <div class="month-card-header">
          <span class="month-card-title">${t.getFullYear()}년 ${t.getMonth()+1}월</span>
        </div>
        <div class="month-badges">
          <span class="month-badge">📚 책 ${bc}권</span>
          <span class="month-badge">📷 사진 ${pc}장</span>
          <span class="month-badge">📝 메모 ${mc}개</span>
        </div>
        <p class="month-summary">${esc(summary)}</p>
        ${recs.slice(0,3).map(r => {
            const icon = r.type==="book" ? "📚" : r.imageUrl ? "📷" : "📝";
            const desc = r.review || r.content || "";
            return `<div data-id="${esc(r.id)}"
              style="display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:8px;
              cursor:pointer;margin-top:4px;transition:background 150ms">
              <span style="font-size:14px;flex-shrink:0">${icon}</span>
              <div style="flex:1;min-width:0">
                <p style="font-size:12px;font-weight:600;color:var(--ink);
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</p>
                ${desc ? `<p style="font-size:11px;color:var(--muted);font-style:italic;
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  "${esc(desc.slice(0,30))}${desc.length>30?"…":""}"</p>` : ""}
              </div>
            </div>`;
          }).join("")}
      </div>
    </div>`;
  });

  views.recall.innerHTML = html;

  views.recall.querySelectorAll("[data-id]").forEach(el=>{
    el.addEventListener("click", (e)=>{
      e.stopPropagation();
      openDetail(el.dataset.id);
    });
  });
}

// ── 상세 오버레이 ──────────────────────────────────────
function openDetail(id){
  const r = state.records.find(x=>x.id===id);
  if(!r) return;

  const s = seedN(r.id);
  const [c1,c2] = SPINE_COLORS[s % SPINE_COLORS.length];

  // 공통 하단 버튼 (수정 + 삭제)
  const actionBtns = `
    <div style="display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:0.5px dashed var(--line)">
      <button id="detailEditBtn" style="flex:1;padding:9px;border-radius:10px;border:0.5px solid var(--line);
        background:var(--sky-light);color:var(--sky-dark);font-size:13px;font-weight:600;
        font-family:var(--sans);cursor:pointer">✏️ 수정</button>
      <button id="detailDeleteBtn" style="flex:1;padding:9px;border-radius:10px;border:0.5px solid rgba(200,80,80,0.25);
        background:rgba(255,240,240,0.8);color:rgba(180,60,60,0.8);font-size:13px;font-weight:600;
        font-family:var(--sans);cursor:pointer">🗑 삭제</button>
    </div>`;

  let html = "";
  if(r.type==="book"){
    html = `<div class="detail-book-grid">
      <div class="detail-book-cover" style="background:linear-gradient(160deg,${c1},${c2})">
        ${r.coverUrl
          ? `<img class="detail-cover-img" src="${esc(r.coverUrl)}" alt="${esc(r.title)}"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="detail-cover-fallback" style="display:none">${esc(r.title)}</div>`
          : `<div class="detail-cover-fallback">${esc(r.title)}</div>`}
      </div>
      <div class="detail-book-body">
        <button class="detail-close-btn" id="detailCloseBtn">✕</button>
        <div>
          <p class="detail-eyebrow">완독일 · ${esc(r.finishedDate||r.date)}</p>
          <p class="detail-title">${esc(r.title)}</p>
          <p class="detail-author">${esc(r.author||"저자 미상")}</p>
        </div>
        ${r.review ? `<hr class="detail-divider">
          <div><p class="detail-section-label">한줄평</p>
          <p class="detail-review">"${esc(r.review)}"</p></div>` : ""}
        ${r.quote ? `<hr class="detail-divider">
          <div><p class="detail-section-label">기억나는 문장</p>
          <p class="detail-quote" style="border-left:2px solid ${c1}">${esc(r.quote)}</p></div>` : ""}
        ${tagsHtml(r.tags)}
        ${actionBtns}
      </div>
    </div>`;
  } else {
    html = `<div class="detail-memory">
      <div class="detail-memory-header">
        <p class="detail-memory-date">${fmt(r.date)}</p>
        <button class="detail-close-btn" id="detailCloseBtn">✕</button>
      </div>
      ${r.imageUrl ? `<img class="detail-memory-img" src="${esc(r.imageUrl)}" alt="${esc(r.title)}">` : ""}
      <p class="detail-memory-title">${esc(r.title)}</p>
      ${r.content ? `<p class="detail-memory-content">"${esc(r.content)}"</p>` : ""}
      ${tagsHtml(r.tags)}
      ${actionBtns}
    </div>`;
  }

  detailModal.innerHTML = html;
  detailOverlay.classList.remove("hidden");

  document.getElementById("detailCloseBtn").addEventListener("click", e=>{
    e.stopPropagation();
    closeDetail();
  });

  document.getElementById("detailDeleteBtn").addEventListener("click", async e=>{
    e.stopPropagation();
    if(!confirm("이 기록을 삭제할까요?")) return;
    state.records = state.records.filter(x=>x.id!==id);
    saveRecords(state.records);
    try {
      await fetch(`${SUPA_URL}/rest/v1/records?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
      });
    } catch(_){}
    closeDetail();
    renderView(state.tab);
  });

  document.getElementById("detailEditBtn").addEventListener("click", e=>{
    e.preventDefault();
    e.stopPropagation();
    if(openEditSheet(id)) closeDetail();
  });
}

function openEditSheet(id){
  const r = state.records.find(x=>x.id===id);
  if(!r) return false;

  try {
    showBottomSheet();
    if(r.type==="book"){
      renderBookForm(id, r);
    } else {
      renderMemoryForm(id, r);
    }
    return true;
  } catch(err) {
    console.error("edit sheet failed", err);
    closeSheet();
    alert("수정 화면을 여는 중 문제가 생겼어요. 새로고침 후 다시 시도해주세요.");
    return false;
  }
}

function closeDetail(){
  detailOverlay.classList.add("hidden");
}
detailOverlay.addEventListener("click", e=>{ if(e.target===detailOverlay) closeDetail(); });
detailModal.addEventListener("click", e=>e.stopPropagation());

// ── 바텀 시트 ─────────────────────────────────────────
function showBottomSheet(){
  sheetOverlay.classList.remove("hidden");
}
function openAddSheet(){
  renderPickStep();
  showBottomSheet();
}
function closeSheet(){
  stopBarcodeScanner();
  sheetOverlay.classList.add("hidden");
}
sheetOverlay.addEventListener("click", e=>{ if(e.target===sheetOverlay) closeSheet(); });

function renderPickStep(){
  sheetContent.innerHTML = `
    <div class="sheet-header"><span></span>
      <button class="sheet-close-btn" id="sheetCloseBtn">✕</button>
    </div>
    <p class="sheet-title">무엇을 담을까요?</p>
    <div class="sheet-pick-grid">
      <button class="sheet-pick-btn" id="pickBook">
        <span class="sheet-pick-icon">📚</span>
        <strong class="sheet-pick-label">책 담기</strong>
        <p class="sheet-pick-sub">읽은 책을 서가에</p>
      </button>
      <button class="sheet-pick-btn" id="pickMemory">
        <span class="sheet-pick-icon">📷</span>
        <strong class="sheet-pick-label">기억 담기</strong>
        <p class="sheet-pick-sub">사진이나 메모를</p>
      </button>
    </div>`;
  $("sheetCloseBtn").addEventListener("click", closeSheet);
  $("pickBook").addEventListener("click", ()=>renderBookForm());
  $("pickMemory").addEventListener("click", ()=>renderMemoryForm());
}

function inp(placeholder, name, small=false){
  return `<input class="form-input ${small?"":"" }" name="${name}" placeholder="${esc(placeholder)}" style="margin-bottom:10px;font-size:${small?12:14}px">`;
}
function textarea(placeholder, name, rows=3){
  return `<textarea class="form-textarea" name="${name}" placeholder="${esc(placeholder)}" rows="${rows}" style="margin-bottom:10px"></textarea>`;
}

function renderBookForm(editId=null, editRecord=null){
  sheetContent.innerHTML = `
    <div class="sheet-header">
      <button class="sheet-back-btn" id="sheetBackBtn">← 뒤로</button>
      <button class="sheet-close-btn" id="sheetCloseBtn">✕</button>
    </div>
    <p class="sheet-title">📚 책 담기</p>
    <div class="isbn-row">
      <input class="form-input isbn-input" id="isbnInput" name="isbn" placeholder="ISBN (예: 9788936433598)" inputmode="numeric" style="margin-bottom:0;font-size:14px">
      <button class="isbn-btn" id="isbnScanBtn" title="카메라로 바코드 스캔" style="background:var(--sky-light);color:var(--sky-dark);border:0.5px solid rgba(106,173,207,0.35)">📷</button>
      <button class="isbn-btn" id="isbnBtn">찾기</button>
    </div>
    <div id="scannerWrap" style="display:none;margin-bottom:10px;border-radius:10px;overflow:hidden;position:relative">
      <video id="scannerVideo" style="width:100%;height:180px;object-fit:cover;display:block"></video>
      <p style="position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:11px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.5)">책 바코드에 카메라를 맞춰주세요</p>
      <button id="scannerCloseBtn" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:28px;height:28px;font-size:14px;cursor:pointer">✕</button>
    </div>
    <div id="coverPreview" class="cover-preview" style="display:none">
      <img id="coverPreviewImg" src="" alt="표지" onerror="this.parentElement.style.display='none'">
    </div>
    <input class="form-input" id="titleInput" name="title" placeholder="제목" style="margin-bottom:10px;font-size:14px">
    <div class="form-field">
      <label class="form-label">표지 이미지 (선택)</label>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
        <label class="cover-upload-label">📷 사진 선택
          <input type="file" accept="image/*" id="coverFileInput" style="display:none">
        </label>
        <span class="cover-or">또는</span>
      </div>
      <input class="form-input" id="coverUrlInput" name="coverUrl" placeholder="이미지 URL 붙여넣기 (알라딘·교보 등)" style="margin-bottom:0;font-size:12px">
    </div>
    <input class="form-input" id="authorInput" name="author" placeholder="저자 (ISBN 찾기로 자동 입력)" style="margin-bottom:10px;font-size:14px">
    <input class="form-input" name="review" id="reviewInput" placeholder="한줄평 (선택)" style="margin-bottom:10px;font-size:14px">
    <textarea class="form-textarea" name="quote" id="quoteInput" placeholder="기억나는 문장 (선택)" rows="2" style="margin-bottom:10px"></textarea>
    <label class="form-label">완독일</label>
    <input class="form-input" type="date" id="dateInput" value="${today()}" style="margin-bottom:16px">
    <button class="submit-btn" id="bookSubmitBtn">담아두기</button>`;

  $("sheetBackBtn").addEventListener("click", editId ? closeSheet : renderPickStep);
  $("sheetCloseBtn").addEventListener("click", closeSheet);
  $("isbnBtn").addEventListener("click", lookupIsbn);
  $("isbnScanBtn").addEventListener("click", startBarcodeScanner);
  $("coverFileInput").addEventListener("change", handleCoverFile);
  $("coverUrlInput").addEventListener("input", e=>{
    const url = e.target.value.trim();
    if(url){ $("coverPreviewImg").src=url; $("coverPreview").style.display="flex"; }
    else $("coverPreview").style.display="none";
  });

  // 수정 모드면 기존 값 채우기
  if(editId && editRecord){
    $("titleInput").value = editRecord.title || "";
    $("authorInput").value = editRecord.author || "";
    $("isbnInput").value = editRecord.isbn || "";
    $("reviewInput").value = editRecord.review || "";
    $("quoteInput").value = editRecord.quote || "";
    $("dateInput").value = editRecord.finishedDate || editRecord.date || today();
    $("coverUrlInput").value = editRecord.coverUrl || "";
    if(editRecord.coverUrl){
      $("coverPreviewImg").src = editRecord.coverUrl;
      $("coverPreview").style.display = "flex";
    }
    $("bookSubmitBtn").textContent = "수정 완료";
    $("bookSubmitBtn").addEventListener("click", ()=>updateBook(editId));
  } else {
    $("bookSubmitBtn").addEventListener("click", saveBook);
  }
}

async function updateBook(id){
  const title = $("titleInput").value.trim();
  if(!title){ alert("제목을 입력해주세요."); return; }
  const r = state.records.find(x=>x.id===id);
  const updated = {
    ...r,
    title,
    author: $("authorInput").value.trim(),
    isbn: $("isbnInput").value.replaceAll("-","").trim(),
    review: $("reviewInput").value.trim(),
    quote: $("quoteInput").value.trim(),
    finishedDate: $("dateInput").value || today(),
    date: $("dateInput").value || today(),
    coverUrl: $("coverUrlInput").value.trim(),
  };
  state.records = state.records.map(x=>x.id===id ? updated : x);
  saveRecords(state.records);
  try { await supa.upsert(updated); } catch(_){}
  closeSheet();
  showToast("수정됐어요!");
  renderView(state.tab);
}

// 바코드 스캐너
let scannerStream = null;

async function startBarcodeScanner(){
  const wrap = $("scannerWrap");
  const video = $("scannerVideo");
  if(!wrap || !video) return;

  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = scannerStream;
    video.play();
    wrap.style.display = "block";

    $("scannerCloseBtn").addEventListener("click", stopBarcodeScanner);

    // BarcodeDetector API 지원 여부 확인
    if(!("BarcodeDetector" in window)){
      alert("이 브라우저는 바코드 스캔을 지원하지 않아요.\nISBN을 직접 입력해주세요.");
      stopBarcodeScanner();
      return;
    }

    const detector = new BarcodeDetector({ formats: ["ean_13","ean_8"] });
    const scan = setInterval(async ()=>{
      if(!scannerStream) { clearInterval(scan); return; }
      try {
        const barcodes = await detector.detect(video);
        if(barcodes.length > 0){
          const code = barcodes[0].rawValue;
          clearInterval(scan);
          stopBarcodeScanner();
          $("isbnInput").value = code;
          lookupIsbn();
        }
      } catch(_){}
    }, 500);
  } catch(_){
    alert("카메라 접근이 거부됐어요.\n브라우저 설정에서 카메라를 허용해주세요.");
  }
}

function stopBarcodeScanner(){
  if(scannerStream){
    scannerStream.getTracks().forEach(t=>t.stop());
    scannerStream = null;
  }
  const wrap = $("scannerWrap");
  if(wrap) wrap.style.display = "none";
}

async function lookupIsbn(){
  const isbn = $("isbnInput").value.replaceAll("-","").trim();
  if(!isbn){ alert("ISBN을 먼저 입력해주세요."); return; }
  const btn = $("isbnBtn");
  btn.textContent = "…"; btn.disabled = true;
  try {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    const data = res.ok ? await res.json() : {};
    if(data.title && !$("titleInput").value) $("titleInput").value = data.title;

    // 저자 자동
    if(data.authors && data.authors.length > 0){
      try {
        const aRes = await fetch(`https://openlibrary.org${data.authors[0].key}.json`);
        const aData = aRes.ok ? await aRes.json() : {};
        if(aData.name && !$("authorInput").value) $("authorInput").value = aData.name;
      } catch(_){}
    }
    // 표지
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    $("coverUrlInput").value = coverUrl;
    $("coverPreviewImg").src = coverUrl;
    $("coverPreview").style.display = "flex";
  } catch(_){
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    $("coverUrlInput").value = coverUrl;
    $("coverPreviewImg").src = coverUrl;
    $("coverPreview").style.display = "flex";
  } finally {
    btn.textContent = "찾기"; btn.disabled = false;
  }
}

// 책 표지 파일 선택 → 리사이즈 + 압축 후 미리보기
async function handleCoverFile(e){
  const file = e.target.files[0];
  if(!file) return;
  const btn = e.target;
  try {
    const resized = await resizeImageFile(file, 800, 0.7);
    $("coverUrlInput").value = resized;
    $("coverPreviewImg").src = resized;
    $("coverPreview").style.display = "flex";
  } catch(_){
    alert("사진을 처리하는 중 문제가 생겼어요. 다른 사진으로 시도해주세요.");
  }
}

function saveBook(){
  const title = $("titleInput").value.trim();
  const isbn = $("isbnInput").value.replaceAll("-","").trim();
  if(!title && !isbn){ alert("제목이나 ISBN을 입력해주세요."); return; }

  const record = {
    id: Date.now()+"",
    type: "book",
    title: title || `ISBN ${isbn}`,
    author: $("authorInput").value.trim(),
    isbn,
    coverUrl: $("coverUrlInput").value.trim() || (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : ""),
    review: $("reviewInput").value.trim(),
    quote: $("quoteInput").value.trim(),
    finishedDate: $("dateInput").value || today(),
    date: $("dateInput").value || today(),
    tags: ["책"],
    createdAt: new Date().toISOString(),
  };
  addRecord(record);
  closeSheet();
  showToast("책을 담았어요! 📚");
  setTab("shelf");
}

function renderMemoryForm(editId=null, editRecord=null){
  sheetContent.innerHTML = `
    <div class="sheet-header">
      <button class="sheet-back-btn" id="sheetBackBtn">← 뒤로</button>
      <button class="sheet-close-btn" id="sheetCloseBtn">✕</button>
    </div>
    <p class="sheet-title">📷 기억 담기</p>
    <div class="form-field">
      <label class="cover-upload-label" style="margin-bottom:10px">📷 사진 선택
        <input type="file" accept="image/*" id="memPhotoInput" style="display:none">
      </label>
      <div id="memPhotoPreview" style="display:none;margin-bottom:10px">
        <img id="memPhotoPreviewImg" style="width:100%;border-radius:10px;max-height:160px;object-fit:cover">
      </div>
    </div>
    <input class="form-input" id="memTitleInput" placeholder="제목 (선택)" style="margin-bottom:10px;font-size:14px">
    <textarea class="form-textarea" id="memContentInput" placeholder="메모 (선택) — 사진 없이 글만 남겨도 좋아요" rows="3" style="margin-bottom:10px"></textarea>
    <input class="form-input" id="memTagsInput" placeholder="태그 (쉼표로 구분, 예: 일상, 단상)" style="margin-bottom:10px;font-size:14px">
    <label class="form-label">날짜</label>
    <input class="form-input" type="date" id="memDateInput" value="${today()}" style="margin-bottom:16px">
    <button class="submit-btn" id="memSubmitBtn">담아두기</button>`;

  $("sheetBackBtn").addEventListener("click", editId ? closeSheet : renderPickStep);
  $("sheetCloseBtn").addEventListener("click", closeSheet);
  // 사진 선택 → 리사이즈 + 압축 후 미리보기
  $("memPhotoInput").addEventListener("change", async e=>{
    const file = e.target.files[0];
    if(!file) return;
    try {
      const resized = await resizeImageFile(file, 800, 0.7);
      $("memPhotoPreviewImg").src = resized;
      $("memPhotoPreview").style.display = "block";
    } catch(_){
      alert("사진을 처리하는 중 문제가 생겼어요. 다른 사진으로 시도해주세요.");
    }
  });

  // 수정 모드면 기존 값 채우기
  if(editId && editRecord){
    $("memTitleInput").value = editRecord.title || "";
    $("memContentInput").value = editRecord.content || "";
    $("memTagsInput").value = (editRecord.tags||[]).join(", ");
    $("memDateInput").value = editRecord.date || today();
    if(editRecord.imageUrl){
      $("memPhotoPreviewImg").src = editRecord.imageUrl;
      $("memPhotoPreview").style.display = "block";
    }
    $("memSubmitBtn").textContent = "수정 완료";
    $("memSubmitBtn").addEventListener("click", ()=>updateMemory(editId));
  } else {
    $("memSubmitBtn").addEventListener("click", saveMemory);
  }
}

async function updateMemory(id){
  const content = $("memContentInput").value.trim();
  const title = $("memTitleInput").value.trim();
  if(!title && !content){ alert("제목이나 메모를 입력해주세요."); return; }
  const r = state.records.find(x=>x.id===id);
  const preview = $("memPhotoPreview");
  const previewImg = $("memPhotoPreviewImg");
  const previewSrc = previewImg?.getAttribute("src") || previewImg?.src || "";
  const imageUrl = preview?.style.display!=="none" && previewSrc ? previewImg.src : (r?.imageUrl || "");
  const updated = {
    ...r,
    title: title || content.slice(0,20) || "기억",
    content,
    tags: $("memTagsInput").value.split(",").map(t=>t.trim()).filter(Boolean),
    date: $("memDateInput").value || today(),
    imageUrl,
  };
  state.records = state.records.map(x=>x.id===id ? updated : x);
  saveRecords(state.records);
  try { await supa.upsert(updated); } catch(_){}
  closeSheet();
  showToast("수정됐어요!");
  renderView(state.tab);
}

function saveMemory(){
  const title = $("memTitleInput").value.trim();
  const content = $("memContentInput").value.trim();
  if(!title && !content){ alert("제목이나 메모를 입력해주세요."); return; }

  const imageUrl = $("memPhotoPreviewImg").src && $("memPhotoPreview").style.display!=="none"
    ? $("memPhotoPreviewImg").src : "";

  const record = {
    id: Date.now()+"",
    type: "memory",
    title: title || content.slice(0,20) || "기억",
    content,
    imageUrl,
    date: $("memDateInput").value || today(),
    tags: $("memTagsInput").value.split(",").map(t=>t.trim()).filter(Boolean),
    createdAt: new Date().toISOString(),
  };
  addRecord(record);
  closeSheet();
  showToast("기억을 담았어요! 📷");
  setTab("memories");
}

// ── ESC 키 ────────────────────────────────────────────
document.addEventListener("keydown", e=>{
  if(e.key==="Escape"){ closeDetail(); closeSheet(); }
});

// ── 이벤트 연결 ───────────────────────────────────────
navBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>setTab(btn.dataset.tab));
});
$("addBtn").addEventListener("click", openAddSheet);

// ── 헤더 날짜 ─────────────────────────────────────────
function updateHeaderDate(){
  const now = new Date();
  const dateStr = `${now.getMonth()+1}월 ${now.getDate()}일 · 나의 작은 아카이브`;
  $("headerDate").textContent = dateStr;
  const navDate = $("navDate");
  if(navDate) navDate.textContent = dateStr;
}

(function(){
  // 사이드바 날짜 요소 생성
  const navDateEl = document.createElement("p");
  navDateEl.id = "navDate";
  navDateEl.style.cssText = "font-size:11px;color:var(--muted);padding:0 12px 12px;display:none;";
  const nav = $("appNav");
  nav.insertBefore(navDateEl, nav.firstChild);

  function checkWidth(){
    navDateEl.style.display = window.innerWidth >= 768 ? "block" : "none";
  }
  checkWidth();
  window.addEventListener("resize", checkWidth);

  // 자정마다 날짜 자동 갱신
  function scheduleNextDay(){
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1) - now;
    setTimeout(()=>{ updateHeaderDate(); scheduleNextDay(); }, msToMidnight);
  }
  updateHeaderDate();
  scheduleNextDay();
})();

// ── 서비스 워커 ───────────────────────────────────────
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}

// ── 시작 ──────────────────────────────────────────────
setTab("home");
syncFromSupabase(); // Supabase에서 최신 데이터 로드
