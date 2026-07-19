// ============================================================
// ESTADO GLOBAL
// ============================================================
let coupleData = null;      // { name, partner1Name, partner2Name }
let titles = [];            // lista de títulos vindos do Firestore
let currentUid = null;      // uid do usuário logado (mais confiável que auth.currentUser)
let currentStatusTab = "watchlist";
let unsubscribeTitles = null;
let selectedType = "filme"; // usado no modal de adicionar título
let activeDetailId = null;
let activeRateId = null;

// ============================================================
// HELPERS
// ============================================================
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return document.querySelectorAll(sel); }

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showScreen(id) {
  $all(".screen").forEach(s => s.setAttribute("hidden", ""));
  $(`#${id}`).removeAttribute("hidden");
}

function closeAllModals() {
  $all(".modal-overlay").forEach(m => m.setAttribute("hidden", ""));
}

$all("[data-close-modal]").forEach(btn => {
  btn.addEventListener("click", closeAllModals);
});
$all(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeAllModals();
  });
});

// ============================================================
// AUTENTICAÇÃO
// ============================================================
$all(".auth-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    $all(".auth-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    $("#login-form").toggleAttribute("hidden", target !== "login");
    $("#signup-form").toggleAttribute("hidden", target !== "signup");
  });
});

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  $("#login-error").textContent = "";
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    $("#login-error").textContent = traduzErro(err);
  }
});

$("#signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const coupleName = $("#signup-couple-name").value.trim();
  const partner1 = $("#signup-partner1").value.trim();
  const partner2 = $("#signup-partner2").value.trim();
  const email = $("#signup-email").value.trim();
  const password = $("#signup-password").value;
  $("#signup-error").textContent = "";

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("couples").doc(cred.user.uid).set({
      name: coupleName,
      partner1Name: partner1,
      partner2Name: partner2,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    $("#signup-error").textContent = traduzErro(err);
  }
});

$("#logout-btn").addEventListener("click", () => auth.signOut());

function traduzErro(err) {
  const map = {
    "auth/email-already-in-use": "Esse e-mail já tem uma conta de casal criada.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/weak-password": "A senha precisa ter no mínimo 6 caracteres.",
    "auth/user-not-found": "Não achamos uma conta com esse e-mail.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Espere um pouco e tente de novo."
  };
  return map[err.code] || "Algo deu errado. Tente de novo.";
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUid = user.uid;
    try {
      const doc = await db.collection("couples").doc(user.uid).get();
      if (!doc.exists) {
        // conta autenticada mas sem doc de casal (não deveria acontecer)
        coupleData = { name: "", partner1Name: "Pessoa 1", partner2Name: "Pessoa 2" };
      } else {
        coupleData = doc.data();
      }
      $("#couple-name-display").textContent = coupleData.name ? `— ${coupleData.name}` : "";
      subscribeTitles(user.uid);
      showScreen("app-screen");
    } catch (err) {
      console.error(err);
      showScreen("auth-screen");
    }
  } else {
    coupleData = null;
    titles = [];
    currentUid = null;
    if (unsubscribeTitles) { unsubscribeTitles(); unsubscribeTitles = null; }
    showScreen("auth-screen");
  }
});

// ============================================================
// FIRESTORE: TÍTULOS
// ============================================================
function titlesCollection() {
  return db.collection("couples").doc(currentUid).collection("titles");
}

function subscribeTitles(uid) {
  if (unsubscribeTitles) unsubscribeTitles();
  unsubscribeTitles = db.collection("couples").doc(uid).collection("titles")
    .onSnapshot((snap) => {
      titles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderTitles();
    }, (err) => console.error("Erro ao carregar títulos:", err));
}

// ============================================================
// TABS
// ============================================================
$all(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    $all(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentStatusTab = btn.dataset.status;
    renderTitles();
  });
});

// ============================================================
// RENDER: GRID DE TÍTULOS
// ============================================================
const EMPTY_MESSAGES = {
  watchlist: "A lista pra assistir tá vazia. Que tal adicionar o próximo filme?",
  assistindo: "Nada em andamento agora. Comece algo da lista pra assistir.",
  historico: "O histórico do casal começa aqui — assistam algo e avaliem juntos."
};

function renderTitles() {
  const filtered = titles
    .filter(t => t.status === currentStatusTab)
    .sort((a, b) => {
      if (currentStatusTab === "historico") {
        return (b.watchedAt?.seconds || 0) - (a.watchedAt?.seconds || 0);
      }
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

  $("#content-count").textContent = `${filtered.length} título${filtered.length === 1 ? "" : "s"}`;

  const grid = $("#titles-grid");
  const emptyState = $("#empty-state");

  if (filtered.length === 0) {
    grid.innerHTML = "";
    emptyState.removeAttribute("hidden");
    $("#empty-text").textContent = EMPTY_MESSAGES[currentStatusTab];
    return;
  }
  emptyState.setAttribute("hidden", "");

  grid.innerHTML = filtered.map(t => renderCard(t)).join("");

  grid.querySelectorAll(".title-card").forEach(card => {
    card.addEventListener("click", () => openDetailModal(card.dataset.id));
  });
}

function renderCard(t) {
  const posterEl = t.posterUrl
    ? `<img class="title-poster" src="${escapeHtml(t.posterUrl)}" alt="" onerror="this.outerHTML='<div class=&quot;title-poster&quot;>${escapeHtml((t.titulo || '?')[0])}</div>'">`
    : `<div class="title-poster">${escapeHtml((t.titulo || "?")[0].toUpperCase())}</div>`;

  let extra = "";
  if (t.status === "historico" && t.rating) {
    extra = `
      <div class="title-ratings">
        <span class="rating-chip dot-a">${t.rating.a.toFixed(1)}</span>
        <span class="rating-chip dot-b">${t.rating.b.toFixed(1)}</span>
        <span class="rating-chip avg">★ ${t.rating.media.toFixed(1)}</span>
      </div>`;
  } else if (t.status === "assistindo" && t.tipo === "serie") {
    const { watched, total } = seriesProgress(t);
    const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
    extra = `
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="title-meta">${watched}/${total} episódios</div>`;
  }

  return `
    <div class="title-card" data-id="${t.id}">
      ${posterEl}
      <div class="title-info">
        <div class="title-name">${escapeHtml(t.titulo)}</div>
        <div class="title-meta">
          <span class="badge badge-${t.tipo}">${t.tipo === "filme" ? "Filme" : "Série"}</span>
          ${t.ano ? `<span>${t.ano}</span>` : ""}
        </div>
        ${extra}
      </div>
    </div>`;
}

function seriesProgress(t) {
  let watched = 0, total = 0;
  (t.seasons || []).forEach(s => {
    s.episodios.forEach(ep => {
      total++;
      if (ep.assistido) watched++;
    });
  });
  return { watched, total };
}

// ============================================================
// MODAL: ADICIONAR TÍTULO
// ============================================================
$("#add-title-btn").addEventListener("click", () => {
  $("#add-title-form").reset();
  $("#add-title-error").textContent = "";
  selectedType = "filme";
  $all(".type-btn").forEach(b => b.classList.toggle("active", b.dataset.type === "filme"));
  $("#add-modal").removeAttribute("hidden");
});

$all(".type-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedType = btn.dataset.type;
    $all(".type-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

$("#add-title-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const titulo = $("#new-title").value.trim();
  const ano = $("#new-year").value ? parseInt($("#new-year").value, 10) : null;
  const posterUrl = $("#new-poster").value.trim() || null;

  if (!titulo) return;

  try {
    await titlesCollection().add({
      tipo: selectedType,
      titulo,
      ano,
      posterUrl,
      status: "watchlist",
      seasons: [],
      rating: null,
      watchedAt: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeAllModals();
  } catch (err) {
    $("#add-title-error").textContent = "Não deu pra adicionar. Tente de novo.";
    console.error(err);
  }
});

// ============================================================
// MODAL: DETALHE
// ============================================================
function openDetailModal(id) {
  activeDetailId = id;
  renderDetailModal();
  $("#detail-modal").removeAttribute("hidden");
}

function renderDetailModal() {
  const t = titles.find(x => x.id === activeDetailId);
  if (!t) { closeAllModals(); return; }

  const posterEl = t.posterUrl
    ? `<img class="detail-poster" src="${escapeHtml(t.posterUrl)}" alt="">`
    : `<div class="detail-poster">${escapeHtml((t.titulo || "?")[0].toUpperCase())}</div>`;

  let seasonsHtml = "";
  if (t.tipo === "serie") {
    seasonsHtml = (t.seasons || []).map((s, sIdx) => `
      <div class="season-block">
        <div class="season-title">
          <span>Temporada ${s.numero}</span>
          <span>${s.episodios.filter(e => e.assistido).length}/${s.episodios.length}</span>
        </div>
        <div class="episode-grid">
          ${s.episodios.map((ep, eIdx) => `
            <div class="episode-chip ${ep.assistido ? "watched" : ""}"
                 data-season="${sIdx}" data-ep="${eIdx}">
              E${ep.numero}
            </div>`).join("")}
        </div>
      </div>
    `).join("");

    if (t.status !== "historico") {
      seasonsHtml += `
        <div class="season-block">
          <form id="add-season-form" class="add-season-form">
            <label>Nova temporada
              <input type="number" id="new-season-episodes" min="1" max="60" placeholder="nº de episódios" required>
            </label>
            <button type="submit" class="btn btn-ghost btn-small">+ Adicionar temporada</button>
          </form>
        </div>`;
    }
  }

  let ratingHtml = "";
  if (t.status === "historico" && t.rating) {
    const dataStr = t.watchedAt?.seconds
      ? new Date(t.watchedAt.seconds * 1000).toLocaleDateString("pt-BR")
      : "";
    ratingHtml = `
      <div class="history-ratings-block">
        <div class="history-rating-pill a">
          <div class="val">${t.rating.a.toFixed(1)}</div>
          <div class="lbl">${escapeHtml(coupleData.partner1Name)}</div>
        </div>
        <div class="history-rating-pill b">
          <div class="val">${t.rating.b.toFixed(1)}</div>
          <div class="lbl">${escapeHtml(coupleData.partner2Name)}</div>
        </div>
        <div class="history-rating-pill avg">
          <div class="val">★ ${t.rating.media.toFixed(1)}</div>
          <div class="lbl">Média</div>
        </div>
      </div>
      ${dataStr ? `<p class="detail-meta" style="margin-top:10px;">Assistido em ${dataStr}</p>` : ""}
    `;
  }

  let actionsHtml = "";
  if (t.status === "watchlist") {
    actionsHtml = `
      <button class="btn btn-primary" id="detail-start-btn">Começar a assistir</button>
      <button class="btn btn-ghost" id="detail-delete-btn">Remover</button>`;
  } else if (t.status === "assistindo") {
    actionsHtml = `
      <button class="btn btn-primary" id="detail-finish-btn">Avaliar e mover pro histórico</button>
      <button class="btn btn-ghost" id="detail-delete-btn">Remover</button>`;
  } else {
    actionsHtml = `<button class="btn btn-ghost" id="detail-delete-btn">Remover do histórico</button>`;
  }

  $("#detail-content").innerHTML = `
    <div class="detail-header">
      ${posterEl}
      <div>
        <h2 class="detail-title">${escapeHtml(t.titulo)}</h2>
        <div class="detail-meta">
          <span class="badge badge-${t.tipo}">${t.tipo === "filme" ? "Filme" : "Série"}</span>
          ${t.ano ? ` · ${t.ano}` : ""}
        </div>
      </div>
    </div>
    ${seasonsHtml}
    ${ratingHtml}
    <div class="detail-actions">${actionsHtml}</div>
  `;

  // listeners
  $("#detail-content").querySelectorAll(".episode-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      toggleEpisode(t.id, parseInt(chip.dataset.season, 10), parseInt(chip.dataset.ep, 10));
    });
  });

  const seasonForm = $("#add-season-form");
  if (seasonForm) {
    seasonForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const count = parseInt($("#new-season-episodes").value, 10);
      if (count > 0) addSeason(t.id, count);
    });
  }

  const startBtn = $("#detail-start-btn");
  if (startBtn) startBtn.addEventListener("click", () => updateStatus(t.id, "assistindo"));

  const finishBtn = $("#detail-finish-btn");
  if (finishBtn) finishBtn.addEventListener("click", () => {
    closeAllModals();
    openRateModal(t.id);
  });

  const deleteBtn = $("#detail-delete-btn");
  if (deleteBtn) deleteBtn.addEventListener("click", () => deleteTitle(t.id));
}

async function updateStatus(id, status) {
  try {
    await titlesCollection().doc(id).update({ status });
    closeAllModals();
  } catch (err) { console.error(err); }
}

async function deleteTitle(id) {
  if (!confirm("Remover este título? Essa ação não pode ser desfeita.")) return;
  try {
    await titlesCollection().doc(id).delete();
    closeAllModals();
  } catch (err) { console.error(err); }
}

async function addSeason(id, episodeCount) {
  const t = titles.find(x => x.id === id);
  const seasons = t.seasons ? [...t.seasons] : [];
  const numero = seasons.length + 1;
  const episodios = Array.from({ length: episodeCount }, (_, i) => ({ numero: i + 1, assistido: false }));
  seasons.push({ numero, episodios });
  try {
    await titlesCollection().doc(id).update({ seasons });
    // a re-renderização acontece via onSnapshot -> renderDetailModal precisa ser re-chamada
  } catch (err) { console.error(err); }
}

async function toggleEpisode(id, seasonIdx, epIdx) {
  const t = titles.find(x => x.id === id);
  const seasons = JSON.parse(JSON.stringify(t.seasons));
  seasons[seasonIdx].episodios[epIdx].assistido = !seasons[seasonIdx].episodios[epIdx].assistido;
  try {
    await titlesCollection().doc(id).update({ seasons });
  } catch (err) { console.error(err); }
}

// Re-render do modal de detalhe quando os dados mudam (ex: episódio marcado)
const originalRenderTitles = renderTitles;
renderTitles = function () {
  originalRenderTitles();
  if (activeDetailId && !$("#detail-modal").hasAttribute("hidden")) {
    renderDetailModal();
  }
};

// ============================================================
// MODAL: AVALIAR
// ============================================================
function openRateModal(id) {
  activeRateId = id;
  const t = titles.find(x => x.id === id);
  $("#rate-title-name").textContent = t.titulo;
  $("#rate-name-a").textContent = coupleData.partner1Name;
  $("#rate-name-b").textContent = coupleData.partner2Name;
  $("#rate-score-a").value = 7;
  $("#rate-score-b").value = 7;
  updateGauge();
  $("#rate-modal").removeAttribute("hidden");
}

function updateGauge() {
  const a = parseFloat($("#rate-score-a").value);
  const b = parseFloat($("#rate-score-b").value);
  $("#rate-value-a").textContent = a.toFixed(1);
  $("#rate-value-b").textContent = b.toFixed(1);
  const avg = (a + b) / 2;
  $("#gauge-avg").textContent = avg.toFixed(1);

  const arcA = $(".gauge-arc-a");
  const arcB = $(".gauge-arc-b");
  const lenA = a * 15.7; // aprox. comprimento do arco (raio 100, quarto de círculo ~157)
  const lenB = b * 15.7;
  arcA.setAttribute("stroke-dasharray", `${lenA} 999`);
  arcB.setAttribute("stroke-dasharray", `${lenB} 999`);
}

$("#rate-score-a").addEventListener("input", updateGauge);
$("#rate-score-b").addEventListener("input", updateGauge);

$("#rate-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const a = parseFloat($("#rate-score-a").value);
  const b = parseFloat($("#rate-score-b").value);
  const media = (a + b) / 2;
  try {
    await titlesCollection().doc(activeRateId).update({
      status: "historico",
      rating: { a, b, media },
      watchedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeAllModals();
  } catch (err) { console.error(err); }
});


