const STORAGE_KEY = "memory-box-records";
const USER_KEY = "memory-box-user";
const VERSION_KEY = "memory-box-version";
const DATA_VERSION = "3";

const seedRecords = [
  {
    id: "seed-book-1",
    type: "book",
    isbn: "9788936433598",
    title: "채식주의자",
    author: "한강",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9788936433598-L.jpg",
    finishedDate: "2025-06-07",
    date: "2025-06-07",
    review: "오랫동안 머릿속을 맴돌았다.",
    quote: "다시 펼치면 다른 나를 만나게 될 것 같다.",
    tags: ["소설", "한강"],
    createdAt: "2025-06-07T09:00:00.000Z"
  },
  {
    id: "seed-memory-1",
    type: "memory",
    title: "비 오는 퇴근길",
    content: "오늘은 조금 마음이 편했다. 빗소리가 좋았어.",
    imageUrl: "",
    date: "2025-06-07",
    tags: ["일상", "비"],
    createdAt: "2025-06-07T18:30:00.000Z"
  },
  {
    id: "seed-memory-2",
    type: "memory",
    title: "요즘 자꾸 생각나는 것들",
    content: "오래된 책방. 낡은 목재 선반. 커피 냄새. 비가 오는 날.",
    imageUrl: "",
    date: "2026-06-03",
    tags: ["단상"],
    createdAt: "2026-06-03T12:00:00.000Z"
  }
];

const state = {
  activeForm: "book",
  activeView: "home",
  search: "",
  records: loadRecords(),
  user: JSON.parse(localStorage.getItem(USER_KEY) || "null")
};

const els = {
  navTabs: document.querySelectorAll(".nav-tabs button"),
  typeTabs: document.querySelectorAll(".type-tabs button"),
  form: document.querySelector("#recordForm"),
  search: document.querySelector("#searchInput"),
  csv: document.querySelector("#csvButton"),
  quickCapture: document.querySelector("#quickCapture"),
  formEyebrow: document.querySelector("#formEyebrow"),
  formTitle: document.querySelector("#formTitle"),
  formHint: document.querySelector("#formHint"),
  isbnLookup: document.querySelector("#isbnLookup"),
  detailDialog: document.querySelector("#detailDialog"),
  detailClose: document.querySelector("#detailClose"),
  detailContent: document.querySelector("#detailContent"),
  login: document.querySelector("#googleLogin"),
  logout: document.querySelector("#logoutButton"),
  loginState: document.querySelector("#loginState"),
  todayMemory: document.querySelector("#todayMemory"),
  recentList: document.querySelector("#recentList"),
  shelfList: document.querySelector("#shelfList"),
  memoryList: document.querySelector("#memoryList"),
  recallList: document.querySelector("#recallList"),
  emptyTemplate: document.querySelector("#emptyTemplate")
};

document.querySelectorAll("input[type='date']").forEach((input) => {
  input.value = new Date().toISOString().slice(0, 10);
});

els.navTabs.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

els.typeTabs.forEach((button) => {
  button.addEventListener("click", () => setForm(button.dataset.form));
});

els.isbnLookup.addEventListener("click", lookupIsbn);

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(els.form);
  const record = await buildRecord(formData);
  if (!record) return;
  state.records = [record, ...state.records];
  persist();
  els.form.reset();
  document.querySelectorAll("input[type='date']").forEach((input) => {
    input.value = new Date().toISOString().slice(0, 10);
  });
  render();
});

els.search.addEventListener("input", (event) => {
  state.search = event.target.value.trim().toLowerCase();
  render();
});

els.csv.addEventListener("click", exportCsv);

els.login.addEventListener("click", () => {
  state.user = { name: "Google 사용자", email: "demo@memory-box.local" };
  localStorage.setItem(USER_KEY, JSON.stringify(state.user));
  renderLogin();
});

els.logout.addEventListener("click", () => {
  state.user = null;
  localStorage.removeItem(USER_KEY);
  renderLogin();
});

document.addEventListener("click", (event) => {
  const openRecord = event.target.closest("[data-open-record]");
  if (openRecord) {
    showRecordDetail(openRecord.dataset.openRecord);
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (!deleteButton) return;
  state.records = state.records.filter((record) => record.id !== deleteButton.dataset.delete);
  persist();
  render();
});

els.detailClose.addEventListener("click", closeBookOverlay);

document.addEventListener("click", (e) => {
  const overlay = document.getElementById("bookOverlay");
  if (e.target === overlay) closeBookOverlay();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeBookOverlay();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js?v=6").catch(() => {});
}

render();

function loadRecords() {
  if (localStorage.getItem(VERSION_KEY) !== DATA_VERSION) {
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRecords));
    return seedRecords;
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  const records = saved ? JSON.parse(saved) : seedRecords;
  return records.map(normalizeRecord);
}

function normalizeRecord(record) {
  if (record.type === "photo" || record.type === "note") {
    return {
      ...record,
      type: "memory",
      title: record.title || "기억",
      tags: record.tags || []
    };
  }
  return record;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function setView(view) {
  state.activeView = view;
  if (view !== "home") els.quickCapture.hidden = true;
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === view);
  });
  els.navTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function showCapture(form) {
  setView("home");
  els.quickCapture.hidden = false;
  setForm(form);
}

function setForm(form) {
  state.activeForm = form;
  els.typeTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.form === form);
  });
  document.querySelector(".form-book").hidden = form !== "book";
  document.querySelector(".form-memory").hidden = form !== "memory";
  if (form === "book") {
    els.formEyebrow.textContent = "책 담기";
    els.formTitle.textContent = "ISBN으로 책을 불러오기";
    els.formHint.textContent = "ISBN을 넣고 찾기를 누르면 제목, 저자, 표지 주소가 가능한 만큼 자동으로 채워져요.";
    return;
  }
  els.formEyebrow.textContent = "기억 담기";
  els.formTitle.textContent = "사진이 있어도 없어도 괜찮은 기록";
  els.formHint.textContent = "사진 한 장을 붙이거나, 짧은 문장만 남겨도 하나의 기억으로 저장돼요.";
}

async function lookupIsbn() {
  const isbnInput = els.form.elements.isbn;
  const isbn = clean(isbnInput.value).replaceAll("-", "");
  if (!isbn) {
    window.alert("ISBN을 먼저 입력해주세요.");
    return;
  }

  els.isbnLookup.textContent = "찾는 중";
  els.isbnLookup.disabled = true;
  try {
    const response = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`);
    const book = response.ok ? await response.json() : {};
    const title = book.title || "";
    const authorNames = await fetchAuthorNames(book.authors || []);

    if (title && !els.form.elements.title.value) els.form.elements.title.value = title;
    if (authorNames && !els.form.elements.author.value) els.form.elements.author.value = authorNames;
    els.form.elements.coverUrl.value = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
  } catch (error) {
    els.form.elements.coverUrl.value = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
    window.alert("제목 정보는 못 찾았지만, 표지 주소는 ISBN으로 채워두었어요.");
  } finally {
    els.isbnLookup.textContent = "찾기";
    els.isbnLookup.disabled = false;
  }
}

async function fetchAuthorNames(authors) {
  const names = await Promise.all(
    authors.slice(0, 3).map(async (author) => {
      if (!author.key) return "";
      const response = await fetch(`https://openlibrary.org${author.key}.json`);
      if (!response.ok) return "";
      const data = await response.json();
      return data.name || "";
    })
  );
  return names.filter(Boolean).join(", ");
}

async function buildRecord(formData) {
  const now = new Date();
  if (state.activeForm === "book") {
    const title = clean(formData.get("title"));
    const isbn = clean(formData.get("isbn")).replaceAll("-", "");
    if (!title && !isbn) return alertAndNull("책 제목이나 ISBN 중 하나는 남겨주세요.");
    const coverUrl = clean(formData.get("coverUrl")) || (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : "");
    return {
      id: crypto.randomUUID(),
      type: "book",
      isbn,
      title: title || `ISBN ${isbn}`,
      author: clean(formData.get("author")),
      coverUrl,
      finishedDate: formData.get("finishedDate") || today(),
      date: formData.get("finishedDate") || today(),
      review: clean(formData.get("review")),
      quote: clean(formData.get("quote")),
      tags: ["책"],
      createdAt: now.toISOString()
    };
  }

  const file = formData.get("memoryFile");
  const imageUrl = file && file.size ? await readPhoto(file) : "";
  const content = clean(formData.get("memoryContent"));
  const title = clean(formData.get("memoryTitle")) || firstLine(content) || "오늘의 기억";
  if (!imageUrl && !content && !title) return alertAndNull("사진이나 짧은 메모 중 하나는 남겨주세요.");
  return {
    id: crypto.randomUUID(),
    type: "memory",
    title,
    content,
    imageUrl,
    date: formData.get("memoryDate") || today(),
    tags: splitTags(formData.get("memoryTags")),
    createdAt: now.toISOString()
  };
}

function alertAndNull(message) {
  window.alert(message);
  return null;
}

function readPhoto(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function clean(value) {
  return String(value || "").trim();
}

function firstLine(value) {
  return clean(value).split(/\n|\. /)[0].slice(0, 24);
}

function splitTags(value) {
  return clean(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function render() {
  renderLogin();
  const records = filteredRecords();
  renderStats();
  renderRecent(records);
  renderShelf(records);
  renderMemories(records);
  renderRecall(records);
}

function renderLogin() {
  if (state.user) {
    els.loginState.textContent = `${state.user.name}로 보관 중`;
    els.login.hidden = true;
    els.logout.hidden = false;
    return;
  }
  els.loginState.textContent = "Google 로그인 준비됨";
  els.login.hidden = false;
  els.logout.hidden = true;
}

function filteredRecords() {
  if (!state.search) return [...state.records].sort(byDateDesc);
  return state.records
    .filter((record) => {
      const haystack = [
        record.type,
        record.title,
        record.author,
        record.content,
        record.review,
        record.quote,
        record.isbn,
        ...(record.tags || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(state.search);
    })
    .sort(byDateDesc);
}

function byDateDesc(a, b) {
  return new Date(b.date) - new Date(a.date);
}

function renderStats() {
  renderTodayMemory(state.records);
}

function buildSummary(records) {
  if (!records.length) return "아직 이번 달의 결을 찾는 중이에요.";
  const bookCount = records.filter((record) => record.type === "book").length;
  const memoryCount = records.filter((record) => record.type === "memory").length;
  const photoCount = records.filter((record) => record.type === "memory" && record.imageUrl).length;
  const memoCount = records.filter((record) => record.type === "memory" && !record.imageUrl).length;
  const tags = records.flatMap((record) => record.tags || []);
  const focus = tags[0] ? `${tags[0]}에 마음이 머문` : "작은 순간을 붙잡은";
  return `읽은 책 ${bookCount}권, 사진 ${photoCount}장, 메모 ${memoCount}개. ${focus} 시기였습니다.`;
}

function renderTodayMemory(records) {
  const now = new Date();
  const monthDay = now.toISOString().slice(5, 10);
  const memories = records.filter((record) => record.date.slice(5, 10) === monthDay && record.date.slice(0, 4) !== String(now.getFullYear()));
  const record = memories[0] || records.sort(byDateDesc)[0];
  if (!record) {
    els.todayMemory.innerHTML = emptyHtml();
    return;
  }
  const years = now.getFullYear() - Number(record.date.slice(0, 4));
  els.todayMemory.innerHTML = `
    <h3>${years > 0 ? `${years}년 전 오늘` : "최근의 기억"}</h3>
    <p>${iconFor(record)} ${escapeHtml(titleFor(record))}</p>
    <span>${escapeHtml(descriptionFor(record))}</span>
  `;
}

function renderRecent(records) {
  renderList(els.recentList, records.slice(0, 6));
}

function renderShelf(records) {
  const books = records.filter((record) => record.type === "book");
  if (!books.length) {
    els.shelfList.innerHTML = emptyHtml();
    return;
  }
  const grouped = groupBy(books, (book) => (book.finishedDate || book.date).slice(0, 4));
  els.shelfList.innerHTML = Object.entries(grouped)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, yearBooks]) => `
      <div class="shelf-year">
        <div class="shelf-year-label">
          <h3>${year}년</h3>
          <span>${yearBooks.length}권</span>
        </div>
        <div class="shelf-frame">
          <div class="book-rail">
            ${yearBooks.map(bookCover).join("")}
          </div>
        </div>
      </div>
    `)
    .join("");
}

// 책 표지 색상 팔레트 — 서재 느낌의 따뜻한 톤들
const SPINE_COLORS = [
  ["#8b5e3c","#6b4428"], ["#4a7c6f","#2f5c52"], ["#7a5c7e","#5a3c5e"],
  ["#5c7a9e","#3c5a7e"], ["#8e7050","#6e5030"], ["#6b8a5c","#4b6a3c"],
  ["#9e6060","#7e4040"], ["#607890","#405870"], ["#7a6e5a","#5a4e3a"],
  ["#4e6e8a","#2e4e6a"], ["#8a6e4a","#6a4e2a"], ["#5e7a6e","#3e5a4e"],
];

function bookCover(book) {
  // 책마다 일관된 랜덤값 — id 기반으로 고정
  const seed = book.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const colorPair = SPINE_COLORS[seed % SPINE_COLORS.length];
  const bookW = 38 + (seed % 5) * 6;    // 38~62px — 두꺼운 책등
  const bookH = 130 + (seed % 6) * 16;  // 130~210px
  const styleVars = `--book-w:${bookW}px; --book-h:${bookH}px;`;
  const fontSize = bookW >= 52 ? "13px" : bookW >= 44 ? "12px" : "11px";

  const coverInner = book.coverUrl
    ? `<img class="book-cover" src="${escapeAttr(book.coverUrl)}"
         alt="${escapeAttr(book.title)} 표지" loading="lazy"
         style="width:${bookW}px; height:${bookH}px;"
         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
       <div class="book-cover-text" style="display:none; width:${bookW}px; height:${bookH}px;
         font-size:${fontSize};
         background:linear-gradient(160deg,${colorPair[0]},${colorPair[1]});">
         ${escapeHtml(book.title)}
       </div>`
    : `<div class="book-cover-text"
         style="width:${bookW}px; height:${bookH}px;
         font-size:${fontSize};
         background:linear-gradient(160deg,${colorPair[0]},${colorPair[1]});">
         ${escapeHtml(book.title)}
       </div>`;

  return `
    <button class="book-spine" type="button"
      data-open-record="${escapeAttr(book.id)}"
      title="${escapeAttr(book.title)}"
      style="${styleVars}">
      ${coverInner}
      <small>${escapeHtml(book.title)}</small>
    </button>
  `;
}

function showRecordDetail(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;
  const overlay = document.getElementById("bookOverlay");
  const modal = document.getElementById("bookModal");
  const inner = document.getElementById("bookModalInner");
  inner.innerHTML = record.type === "book" ? bookDetail(record) : memoryDetail(record);
  modal.classList.remove("open");
  overlay.classList.add("show");
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add("open")));
}

function closeBookOverlay() {
  const overlay = document.getElementById("bookOverlay");
  const modal = document.getElementById("bookModal");
  modal.classList.remove("open");
  setTimeout(() => overlay.classList.remove("show"), 300);
}

function bookDetail(book) {
  const seed = book.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const colorPair = SPINE_COLORS[seed % SPINE_COLORS.length];
  const coverHtml = book.coverUrl
    ? `<img src="${escapeAttr(book.coverUrl)}" alt="${escapeAttr(book.title)} 표지"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
       <div class="book-modal-cover-fallback" style="display:none;background:linear-gradient(160deg,${colorPair[0]},${colorPair[1]});">${escapeHtml(book.title)}</div>`
    : `<div class="book-modal-cover-fallback" style="background:linear-gradient(160deg,${colorPair[0]},${colorPair[1]});">${escapeHtml(book.title)}</div>`;

  let sections = "";
  if (book.review) sections += `
    <div class="book-modal-section">
      <span class="book-modal-label">한줄평</span>
      <p class="book-modal-review">"${escapeHtml(book.review)}"</p>
    </div><hr class="book-modal-divider">`;
  if (book.quote) sections += `
    <div class="book-modal-section">
      <span class="book-modal-label">기억나는 문장</span>
      <p class="book-modal-quote" style="border-color:${colorPair[0]};">${escapeHtml(book.quote)}</p>
    </div><hr class="book-modal-divider">`;

  return `
    <div class="book-modal-cover" style="background:linear-gradient(160deg,${colorPair[0]},${colorPair[1]});">
      ${coverHtml}
    </div>
    <div class="book-modal-body">
      <p class="book-modal-eyebrow">${book.finishedDate ? `완독일 · ${escapeHtml(book.finishedDate)}` : "읽은 책"}</p>
      <h2 class="book-modal-title">${escapeHtml(book.title)}</h2>
      <p class="book-modal-author">${escapeHtml(book.author || "저자 미상")}</p>
      <hr class="book-modal-divider">
      ${sections}
      ${tagHtml(book)}
    </div>`;
}

function memoryDetail(memory) {
  return `
    <article class="detail-layout">
      ${memory.imageUrl ? `<img class="detail-cover" src="${escapeAttr(memory.imageUrl)}" alt="${escapeAttr(memory.title)}" />` : `<div class="detail-cover placeholder">◍</div>`}
      <div class="detail-copy">
        <p class="eyebrow">${escapeHtml(memory.date)}</p>
        <h2>${escapeHtml(memory.title)}</h2>
        <p>${escapeHtml(memory.content || "사진으로 남겨둔 기억")}</p>
        ${tagHtml(memory)}
      </div>
    </article>
  `;
}

function renderMemories(records) {
  const memories = records.filter((record) => record.type === "memory");
  if (!memories.length) {
    els.memoryList.innerHTML = emptyHtml();
    return;
  }
  els.memoryList.innerHTML = memories
    .map((memory) => `
      <article class="memory-note ${memory.imageUrl ? "has-photo" : ""}">
        ${memory.imageUrl ? `<img src="${memory.imageUrl}" alt="${escapeAttr(memory.title)}" loading="lazy" />` : `<div class="paper-preview">${escapeHtml(memory.date)}</div>`}
        <div>
          <h3>${iconFor(memory)} ${escapeHtml(memory.title)}</h3>
          <strong class="memory-kind">${memory.imageUrl ? "사진 기억" : "메모"}</strong>
          <p>${escapeHtml(memory.content || "사진으로 남겨둔 기억")}</p>
          ${tagHtml(memory)}
        </div>
      </article>
    `)
    .join("");
}

function renderRecall(records) {
  if (!records.length) {
    els.recallList.innerHTML = emptyHtml();
    return;
  }
  const grouped = groupBy(records, (record) => record.date.slice(0, 7));
  els.recallList.innerHTML = Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, monthRecords]) => {
      const counts = countTypes(monthRecords);
      return `
        <section class="recall-month">
          <div class="recall-summary">
            <div>
              <p class="eyebrow">${formatMonth(month)}</p>
              <h3>AI 회상 요약</h3>
              <p>${escapeHtml(buildSummary(monthRecords))}</p>
            </div>
            <div class="recall-counts">
              <span>▤ 책 ${counts.books}권</span>
              <span>◉ 사진 ${counts.photos}장</span>
              <span>◍ 메모 ${counts.memos}개</span>
            </div>
          </div>
          <div class="recall-items">
            ${monthRecords.sort(byDateDesc).map(recallItem).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function recallItem(record) {
  return `
    <article class="record-card recall-card">
      <div class="time-label">${escapeHtml(record.date)}</div>
      <div class="record-meta">
        <h3>${iconFor(record)} ${escapeHtml(titleFor(record))}</h3>
        <p>${escapeHtml(descriptionFor(record))}</p>
        ${tagHtml(record)}
      </div>
    </article>
  `;
}

function countTypes(records) {
  return {
    books: records.filter((record) => record.type === "book").length,
    photos: records.filter((record) => record.type === "memory" && record.imageUrl).length,
    memos: records.filter((record) => record.type === "memory" && !record.imageUrl).length
  };
}

function formatMonth(month) {
  const [year, monthNumber] = month.split("-");
  return `${year}년 ${Number(monthNumber)}월`;
}

function renderList(target, records) {
  if (!records.length) {
    target.innerHTML = emptyHtml();
    return;
  }
  target.innerHTML = records.map(recordCard).join("");
}

function recordCard(record) {
  const image = imageFor(record);
  return `
    <article class="record-card">
      ${image}
      <div class="record-meta">
        <h3>${iconFor(record)} ${escapeHtml(titleFor(record))}</h3>
        <p>${escapeHtml(descriptionFor(record))}</p>
        ${tagHtml(record)}
      </div>
      <button class="delete-button" data-delete="${record.id}" title="삭제" aria-label="삭제">×</button>
    </article>
  `;
}

function imageFor(record) {
  const image = record.coverUrl || record.imageUrl;
  if (image) return `<img class="record-thumb" src="${escapeAttr(image)}" alt="${escapeAttr(titleFor(record))}" loading="lazy" />`;
  return `<div class="record-thumb note-thumb">${iconFor(record)}</div>`;
}

function titleFor(record) {
  return record.title || (record.type === "book" ? "책" : "기억");
}

function descriptionFor(record) {
  if (record.type === "book") return record.review || record.quote || record.author || record.finishedDate || "읽은 책";
  return record.content || record.date;
}

function iconFor(record) {
  if (record.type === "book") return "▤";
  return record.imageUrl ? "◉" : "◍";
}

function tagHtml(record) {
  if (!record.tags || !record.tags.length) return "";
  return `<div class="tag-row">${record.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function groupBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}

function emptyHtml() {
  return els.emptyTemplate.innerHTML;
}

function exportCsv() {
  const headers = ["id", "type", "isbn", "title", "content", "date", "tags", "author", "finishedDate", "review", "quote", "coverUrl", "imageUrl"];
  const rows = state.records.map((record) => headers.map((header) => csvCell(Array.isArray(record[header]) ? record[header].join("|") : record[header] || "")).join(","));
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `memory-box-${today()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

// ── 기억: 폴라로이드 월별 렌더링 ──
function renderMemories(records) {
  const memories = records.filter((record) => record.type === "memory");
  if (!memories.length) {
    els.memoryList.innerHTML = emptyHtml();
    return;
  }

  // 월별 그룹핑
  const byMonth = {};
  memories.forEach(m => {
    const month = m.date.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(m);
  });

  els.memoryList.innerHTML = Object.entries(byMonth)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, mems]) => {
      const [year, mon] = month.split('-');
      const monthLabel = `${year}년 ${parseInt(mon)}월`;
      return `
        <div class="memory-section">
          <div class="memory-section-title">${monthLabel}</div>
          <div class="polaroid-grid">
            ${mems.map(m => renderPolaroid(m)).join('')}
          </div>
        </div>
      `;
    })
    .join('');
}

function renderPolaroid(memory) {
  const photoHtml = memory.imageUrl
    ? `<img class="polaroid-photo" src="${escapeAttr(memory.imageUrl)}" alt="${escapeAttr(memory.title)}" loading="lazy" />`
    : `<div class="polaroid-memo-area">📝</div>`;

  const captionHtml = memory.content
    ? `<p class="polaroid-caption">"${escapeHtml(memory.content)}"</p>`
    : `<p class="polaroid-caption" style="opacity:0.4;">${escapeHtml(memory.title)}</p>`;

  const tagsHtml = memory.tags && memory.tags.length
    ? `<div class="polaroid-tags">${memory.tags.map(t => `<span class="ptag">#${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  return `
    <div class="polaroid" data-open-record="${escapeAttr(memory.id)}">
      ${photoHtml}
      ${captionHtml}
      <p class="polaroid-date">${memory.date}</p>
      ${tagsHtml}
    </div>
  `;
}

// ── 회상: 월별 요약 ──
function renderRecall(records) {
  if (!records.length) {
    els.recallList.innerHTML = emptyHtml();
    return;
  }

  const now = new Date();
  const today = now.toISOString().slice(5, 10);
  const thisYear = now.getFullYear();
  const thisMonth = (now.getMonth() + 1).toString().padStart(2, '0');

  // 오늘의 추억
  const todayMemories = records.filter(r => r.date.slice(5, 10) === today && r.date.slice(0, 4) !== String(thisYear));

  let html = `<div class="recall-section">
    <div class="recall-section-title">오늘의 추억 — ${parseInt(today.slice(0, 2))}월 ${parseInt(today.slice(3, 5))}일</div>
    <div>`;

  if (todayMemories.length) {
    todayMemories.slice(0, 3).forEach(r => {
      const yearsAgo = thisYear - parseInt(r.date.slice(0, 4));
      const badgeText = yearsAgo > 0 ? `${yearsAgo}년 전` : '올해';
      const icon = r.type === 'book' ? '📚' : '📷';
      const desc = r.type === 'book' ? (r.review || r.quote || '') : (r.content || '');
      html += `
        <div class="today-memory" data-open-record="${escapeAttr(r.id)}">
          <span class="today-badge">${badgeText}</span>
          <div class="today-content">
            <h3><span>${icon}</span> ${escapeHtml(r.title)}</h3>
            ${desc ? `<p>"${escapeHtml(desc)}"</p>` : ''}
          </div>
        </div>`;
    });
  } else {
    html += `<p style="padding:12px;color:var(--muted);font-size:12px;">아직 이 날의 기억이 없어요.</p>`;
  }
  html += `</div></div>`;

  // 월별 과거 (지난달, 1년 전 이번달, 2년 전 이번달)
  const pastMonths = [
    { offset: -1, label: '지난달' },
    { offset: -12, label: '1년 전 이번달' },
    { offset: -24, label: '2년 전 이번달' }
  ];

  pastMonths.forEach(({ offset, label }) => {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    const monthRecs = records.filter(r => r.date.startsWith(targetMonth));

    if (monthRecs.length) {
      const monthDisplay = `${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월`;
      const monthsAgo = Math.abs(offset);
      const monthsAgoText = monthsAgo === 1 ? '1개월 전' : monthsAgo === 12 ? '1년 전' : `${Math.floor(monthsAgo / 12)}년 전`;

      const bookCount = monthRecs.filter(r => r.type === 'book').length;
      const photoCount = monthRecs.filter(r => r.type === 'memory' && r.imageUrl).length;
      const memoCount = monthRecs.filter(r => r.type === 'memory' && !r.imageUrl).length;

      const summary = buildSummary(monthRecs);

      html += `
        <div class="recall-section">
          <div class="recall-section-title">${monthDisplay} — ${label}</div>
          <div class="month-card">
            <div class="month-header">
              <h3>${monthDisplay}</h3>
              <span class="month-elapsed">${monthsAgoText}</span>
            </div>
            <div class="count-badges">
              <span class="count-badge">📚 책 ${bookCount}권</span>
              <span class="count-badge">📷 사진 ${photoCount}장</span>
              <span class="count-badge">📝 메모 ${memoCount}개</span>
            </div>
            <p class="ai-summary">${escapeHtml(summary)}</p>
          </div>
        </div>`;
    }
  });

  els.recallList.innerHTML = html;
}

// ── 바텀 시트 ──
function openBottomSheet(formType) {
  const overlay = document.getElementById('bottomSheetOverlay');
  const sheet = document.getElementById('bottomSheet');
  const form = document.getElementById('bottomSheetForm');

  if (formType === 'book') {
    form.innerHTML = `
      <div class="section-head compact">
        <h2>책 담기</h2>
        <p>ISBN으로 책을 불러오세요.</p>
      </div>
      <form id="bottomForm" class="record-form">
        <div class="form-grid">
          <label>ISBN
            <div class="inline-field">
              <input name="isbn" inputmode="numeric" placeholder="예: 9788936433598" />
              <button type="button" id="isbnLookupBtn" class="soft-button">찾기</button>
            </div>
          </label>
          <label>제목<input name="title" placeholder="예: 모순" /></label>
          <label>저자<input name="author" placeholder="예: 양귀자" /></label>
          <label>완독일<input name="finishedDate" type="date" /></label>
          <label class="wide">한줄평<input name="review" placeholder="선택사항" /></label>
          <label class="wide">기억나는 문장<textarea name="quote" rows="2" placeholder="선택사항"></textarea></label>
        </div>
        <div class="form-actions">
          <button class="primary-button" type="submit">담아두기</button>
        </div>
      </form>`;

    document.getElementById('isbnLookupBtn').addEventListener('click', lookupIsbn);
    document.getElementById('bottomForm').addEventListener('submit', handleBottomFormSubmit);
  } else if (formType === 'memory') {
    form.innerHTML = `
      <div class="section-head compact">
        <h2>기억 담기</h2>
        <p>사진이 있어도, 없어도 괜찮습니다.</p>
      </div>
      <form id="bottomForm" class="record-form">
        <div class="form-grid">
          <label class="wide">사진 선택
            <input name="memoryFile" type="file" accept="image/*" />
          </label>
          <label>제목<input name="memoryTitle" placeholder="예: 비 오는 퇴근길" /></label>
          <label class="wide">메모<textarea name="memoryContent" rows="3" placeholder="선택사항 · 사진 없이 글만 남겨도 좋습니다."></textarea></label>
          <label>날짜<input name="memoryDate" type="date" /></label>
          <label class="wide">태그<input name="memoryTags" placeholder="일상, 사진, 단상" /></label>
        </div>
        <div class="form-actions">
          <button class="primary-button" type="submit">담아두기</button>
        </div>
      </form>`;

    document.getElementById('bottomForm').addEventListener('submit', handleBottomFormSubmit);
  }

  overlay.classList.add('show');
  sheet.classList.add('show');
}

function closeBottomSheet() {
  const overlay = document.getElementById('bottomSheetOverlay');
  const sheet = document.getElementById('bottomSheet');
  overlay.classList.remove('show');
  sheet.classList.remove('show');
}

async function handleBottomFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const record = await buildRecord(formData);
  if (!record) return;
  state.records = [record, ...state.records];
  persist();
  render();
  closeBottomSheet();
}

// 이벤트 위임
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-open-record]')) {
    const id = e.target.closest('[data-open-record]').dataset.openRecord;
    showRecordDetail(id);
  }
});

// 바텀 시트 닫기
document.getElementById('bottomSheetClose').addEventListener('click', closeBottomSheet);
document.getElementById('bottomSheetOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('bottomSheetOverlay')) closeBottomSheet();
});

// 네비게이션 + 버튼
const addButton = document.createElement('button');
addButton.className = 'nav-add-button';
addButton.innerHTML = '<span>＋</span>';
addButton.addEventListener('click', (e) => {
  e.stopPropagation();
  // 책/기억 선택 모달 또는 직접 열기
  // 일단 선택 없이 기억부터 열어보기
  openBottomSheet('memory');
});

