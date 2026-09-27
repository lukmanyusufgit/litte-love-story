const state = {
  currentScreen: "landing",
  currentScene: 0,
  userName: "",
  partnerName: "",
  storyTitle: "",
  specialDate: "",
  message: "",
  theme: "romantic",
  userPhoto: "",
  partnerPhoto: "",
  togetherPhoto: "",
  memoryPhotos: [],
  musicEnabled: false,
  audioReady: false,
  musicLoop: null,
  musicContext: null,
  musicGain: null,
  musicIndex: 0,
  miniGameScore: 0,
  miniGameReady: false,
  activeMemoryIndex: 0,
};

const defaultMessage = "Terima kasih sudah menjadi bagian dari hidupku.";
const defaultStoryTitle = "Our Little Adventure";

const screens = {
  landing: document.getElementById("landingScreen"),
  setup: document.getElementById("setupScreen"),
  story: document.getElementById("storyScreen"),
};

const storyStage = document.getElementById("storyStage");
const formStatus = document.getElementById("formStatus");
const toast = document.getElementById("toast");
const musicToggle = document.getElementById("musicToggle");

const audio = new Audio("assets/music/romantic.wav");
audio.loop = true;
audio.volume = 0.42;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function setScreen(name) {
  Object.keys(screens).forEach((key) => {
    screens[key].classList.toggle("active", key === name);
  });
}

function createObjectUrl(file) {
  return URL.createObjectURL(file);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue + "T00:00:00");
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function ensureValidFile(file, label) {
  if (!file) {
    return { ok: false, message: `${label} belum dipilih.` };
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  const typeOk = validTypes.includes(file.type) || file.type === "image/jpg";

  if (!typeOk) {
    return { ok: false, message: `${label} harus berupa JPG, JPEG, PNG, atau WebP.` };
  }

  if (file.size > 6 * 1024 * 1024) {
    return { ok: false, message: `${label} terlalu besar. Maksimal 6MB.` };
  }

  return { ok: true };
}

function setPreviewForSlot(key, dataUrl) {
  const previewBox = document.querySelector(`[data-preview="${key}"]`);
  const previewImg = previewBox.querySelector("img");
  const actions = previewBox.querySelector(".preview-actions");

  if (!dataUrl) {
    previewBox.classList.remove("has-image");
    previewImg.removeAttribute("src");
    previewImg.alt = "Preview foto";
    actions.classList.add("hidden");
    return;
  }

  previewBox.classList.add("has-image");
  previewImg.src = dataUrl;
  actions.classList.remove("hidden");
}

function setupMemoryGrid() {
  const grid = document.getElementById("memoryGrid");
  grid.innerHTML = "";

  if (!state.memoryPhotos.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Belum ada foto kenangan";
    grid.appendChild(empty);
    return;
  }

  state.memoryPhotos.forEach((photo, index) => {
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML = `
      <img src="${photo.dataUrl}" alt="Foto kenangan ${index + 1}" />
      <button type="button" class="remove-mem" aria-label="Hapus foto kenangan">×</button>
    `;

    item.querySelector(".remove-mem").addEventListener("click", () => {
      state.memoryPhotos.splice(index, 1);
      setupMemoryGrid();
    });

    grid.appendChild(item);
  });
}

function attachUploadButtonTrigger() {
  document.querySelectorAll(".upload-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.trigger;
      const input = document.getElementById(targetId);
      input.click();
    });
  });

  document.querySelectorAll("[data-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.reset;
      clearSlot(key);
    });
  });
}

function clearSlot(key) {
  if (key === "user") {
    state.userPhoto = "";
    document.getElementById("userPhotoInput").value = "";
    setPreviewForSlot("user", "");
  }

  if (key === "partner") {
    state.partnerPhoto = "";
    document.getElementById("partnerPhotoInput").value = "";
    setPreviewForSlot("partner", "");
  }

  if (key === "together") {
    state.togetherPhoto = "";
    document.getElementById("togetherPhotoInput").value = "";
    setPreviewForSlot("together", "");
  }
}

function handleSingleUpload(event, key) {
  const file = event.target.files[0];
  if (!file) return;

  const validation = ensureValidFile(file, key === "user" ? "Foto kamu" : key === "partner" ? "Foto pasangan" : "Foto bersama");
  if (!validation.ok) {
    showToast(validation.message);
    event.target.value = "";
    return;
  }

  readFileAsDataUrl(file)
    .then((dataUrl) => {
      if (key === "user") state.userPhoto = dataUrl;
      if (key === "partner") state.partnerPhoto = dataUrl;
      if (key === "together") state.togetherPhoto = dataUrl;
      setPreviewForSlot(key, dataUrl);
      showToast("Foto berhasil dipilih.");
    })
    .catch(() => {
      showToast("Gagal memproses foto. Silakan coba lagi.");
    });
}

function handleMemoryUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const selected = [];
  for (const file of files) {
    const validation = ensureValidFile(file, "Foto kenangan");
    if (!validation.ok) {
      showToast(validation.message);
      continue;
    }
    selected.push(file);
  }

  const totalAfter = state.memoryPhotos.length + selected.length;
  if (totalAfter > 10) {
    showToast("Maksimal 10 foto kenangan. Foto tambahan akan dibuang.");
  }

  const allowed = selected.slice(0, Math.max(0, 10 - state.memoryPhotos.length));

  Promise.all(allowed.map((file) => readFileAsDataUrl(file)))
    .then((dataUrls) => {
      dataUrls.forEach((dataUrl) => {
        state.memoryPhotos.push({ dataUrl, caption: "Kenangan indah" });
      });
      setupMemoryGrid();
      event.target.value = "";
    })
    .catch(() => {
      showToast("Gagal membaca beberapa foto kenangan.");
    });
}

function bindFieldValues() {
  document.getElementById("userName").addEventListener("input", (event) => {
    state.userName = event.target.value.trim();
  });

  document.getElementById("partnerName").addEventListener("input", (event) => {
    state.partnerName = event.target.value.trim();
  });

  document.getElementById("specialDate").addEventListener("input", (event) => {
    state.specialDate = event.target.value;
  });

  document.getElementById("storyTitle").addEventListener("input", (event) => {
    state.storyTitle = event.target.value.trim();
  });

  document.getElementById("storyMessage").addEventListener("input", (event) => {
    state.message = event.target.value.trim();
  });

  document.getElementById("themeSelect").addEventListener("change", (event) => {
    state.theme = event.target.value;
    document.body.classList.toggle("anime-theme", state.theme === "anime");
  });
}

function validateForm() {
  if (!state.userPhoto) {
    return { ok: false, message: "Foto kamu wajib diisi." };
  }

  if (!state.partnerPhoto) {
    return { ok: false, message: "Foto pasangan wajib diisi." };
  }

  if (!state.userName || !state.partnerName) {
    return { ok: false, message: "Nama kamu dan nama pasangan wajib diisi." };
  }

  return { ok: true };
}

function createSynthMusic() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!state.musicContext) {
    state.musicContext = new AudioContextClass();
    state.musicGain = state.musicContext.createGain();
    state.musicGain.gain.value = 0.05;
    state.musicGain.connect(state.musicContext.destination);
  }

  return state.musicContext;
}

function playSynthNote(frequency, duration = 0.45) {
  const context = createSynthMusic();
  if (!context || !state.musicGain) return;

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(state.musicGain);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.04);
}

function startMelodyLoop() {
  if (state.musicLoop) {
    clearInterval(state.musicLoop);
  }

  const notes = [220, 261.63, 293.66, 329.63, 392, 329.63, 293.66, 261.63, 246.94, 261.63, 293.66, 349.23];

  state.musicLoop = setInterval(() => {
    if (!state.musicEnabled) return;
    const note = notes[state.musicIndex % notes.length];
    playSynthNote(note, 0.46);
    state.musicIndex += 1;
  }, 420);
}

function stopMelodyLoop() {
  if (state.musicLoop) {
    clearInterval(state.musicLoop);
    state.musicLoop = null;
  }

  if (state.musicContext && state.musicContext.state !== "closed") {
    state.musicContext.suspend();
  }
}

function startMusic() {
  if (state.musicEnabled) return;

  if (audio && audio.src) {
    audio.play().then(() => {
      state.musicEnabled = true;
      state.audioReady = true;
      musicToggle.textContent = "🔊 Music On";
      musicToggle.classList.add("is-on");
    }).catch(() => {
      const context = createSynthMusic();
      if (context) {
        context.resume();
        startMelodyLoop();
        state.musicEnabled = true;
        state.audioReady = true;
        musicToggle.textContent = "🔊 Music On";
        showToast("Musik romantis aktif via synth fallback.");
      } else {
        state.musicEnabled = false;
        state.audioReady = false;
        musicToggle.textContent = "🔊 Music Off";
        showToast("Browser memblokir autoplay. Tekan tombol musik untuk memulai.");
      }
    });
    return;
  }

  const context = createSynthMusic();
  if (context) {
    context.resume();
    startMelodyLoop();
    state.musicEnabled = true;
    state.audioReady = true;
    musicToggle.textContent = "🔊 Music On";
    showToast("Musik romantis aktif.");
  }
}

function toggleMusic() {
  if (state.musicEnabled) {
    if (audio && audio.src) {
      audio.pause();
    }
    stopMelodyLoop();
    state.musicEnabled = false;
    state.audioReady = false;
    musicToggle.textContent = "🔊 Music Off";
    showToast("Music dimatikan.");
    return;
  }

  startMusic();

  if (!state.musicEnabled) {
    showToast("Browser memblokir pemutaran musik. Silakan tekan lagi.");
  } else {
    showToast("Music aktif.");
  }
}

function getFallbackMemory() {
  const base = [
    { src: state.userPhoto || "", caption: `${state.userName || "Kamu"}` },
    { src: state.partnerPhoto || "", caption: `${state.partnerName || "Pasangan"}` },
    { src: state.togetherPhoto || "", caption: "Kalian bersama" },
  ].filter((item) => item.src);

  if (state.memoryPhotos.length) {
    return state.memoryPhotos.map((photo) => ({ src: photo.dataUrl, caption: photo.caption || "Kenangan indah" }));
  }

  return base;
}

function getMemoryLevelData() {
  const memoryList = getFallbackMemory();
  const seeded = [
    { title: "First Meet", text: `Saat pertama kali ${state.userName || "kamu"} dan ${state.partnerName || "pasangan"} bertemu, segalanya terasa berbeda.` },
    { title: "Getting Closer", text: `Langkah demi langkah, hati semakin dekat dan cerita mulai tumbuh dengan hangat.` },
    { title: "Little Moments", text: `Momen kecil yang sederhana ternyata menjadi bagian paling mahal dalam perjalanan cinta.` },
    { title: "Happy Memories", text: `Setiap senyum, tawa, dan kebahagiaan yang dibagikan menjadi memori yang tak terlupakan.` },
    { title: "Our Story", text: `Kini, perjalanan mereka terus berlanjut dengan cinta yang semakin kuat dan penuh harapan.` },
  ];

  return seeded.map((level, index) => ({
    ...level,
    photo: memoryList[index % memoryList.length]?.src || state.userPhoto || "",
    caption: memoryList[index % memoryList.length]?.caption || level.title,
  }));
}

function buildSharePayload() {
  return {
    userName: state.userName,
    partnerName: state.partnerName,
    title: state.storyTitle || defaultStoryTitle,
    specialDate: state.specialDate,
    theme: state.theme,
    message: state.message || defaultMessage,
  };
}

function encodeShareData(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeShareData(value) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(value))));
  } catch (error) {
    return null;
  }
}

function buildShareUrl() {
  const shareData = buildSharePayload();
  const encoded = encodeShareData(shareData);
  const url = new URL(window.location.href);
  url.search = `?story=${encoded}`;
  return url.toString();
}

function maybePopulateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const storyParam = params.get("story");
  if (!storyParam) return;

  const decoded = decodeShareData(storyParam);
  if (!decoded) return;

  const userNameField = document.getElementById("userName");
  const partnerNameField = document.getElementById("partnerName");
  const dateField = document.getElementById("specialDate");
  const titleField = document.getElementById("storyTitle");
  const themeField = document.getElementById("themeSelect");
  const messageField = document.getElementById("storyMessage");

  userNameField.value = decoded.userName || "";
  partnerNameField.value = decoded.partnerName || "";
  dateField.value = decoded.specialDate || "";
  titleField.value = decoded.title || "";
  themeField.value = decoded.theme || "romantic";
  messageField.value = decoded.message || "";

  state.userName = decoded.userName || "";
  state.partnerName = decoded.partnerName || "";
  state.specialDate = decoded.specialDate || "";
  state.storyTitle = decoded.title || "";
  state.theme = decoded.theme || "romantic";
  state.message = decoded.message || "";

  showToast("Cerita dibuka dari link. Silakan pilih foto kamu sendiri.");
}

function setupForm() {
  document.getElementById("newStoryBtn").addEventListener("click", () => {
    setScreen("setup");
  });

  document.getElementById("startStoryBtn").addEventListener("click", () => {
    const validation = validateForm();
    if (!validation.ok) {
      formStatus.textContent = validation.message;
      showToast(validation.message);
      return;
    }

    formStatus.textContent = "";
    setScreen("story");
    state.currentScene = 0;
    state.miniGameScore = 0;
    state.miniGameReady = false;
    renderScene();
    startMusic();
  });

  document.getElementById("backToSetupBtn").addEventListener("click", () => {
    setScreen("setup");
    formStatus.textContent = "";
  });

  musicToggle.addEventListener("click", toggleMusic);

  document.getElementById("userPhotoInput").addEventListener("change", (event) => handleSingleUpload(event, "user"));
  document.getElementById("partnerPhotoInput").addEventListener("change", (event) => handleSingleUpload(event, "partner"));
  document.getElementById("togetherPhotoInput").addEventListener("change", (event) => handleSingleUpload(event, "together"));
  document.getElementById("memoryPhotoInput").addEventListener("change", handleMemoryUpload);

  attachUploadButtonTrigger();
  bindFieldValues();
  maybePopulateFromUrl();
  setupMemoryGrid();
}

function shuffleHearts(container, count = 10) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const heart = document.createElement("span");
    heart.className = "heart-particle";
    heart.textContent = "❤";
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.top = `${Math.random() * 100}%`;
    heart.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
    heart.style.fontSize = `${12 + Math.random() * 18}px`;
    fragment.appendChild(heart);
  }

  container.innerHTML = "";
  container.appendChild(fragment);
}

function createStars(target) {
  if (!target) return;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 24; i += 1) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    fragment.appendChild(star);
  }
  target.appendChild(fragment);
}

function renderOpeningScene() {
  return `
    <div class="story-card opening-scene">
      <div class="stars" aria-hidden="true"></div>
      <div class="floating-hearts-scene" aria-hidden="true"></div>
      <div class="scene-content">
        <div class="scene-quote">Di dunia yang begitu luas...</div>
        <div class="scene-quote" style="animation-delay:0.4s;">Dari sekian banyak orang...</div>
        <div class="scene-quote" style="animation-delay:0.8s;">Aku menemukan seseorang yang begitu berarti.</div>
        <div class="scene-actions">
          <button class="primary-btn story-nav" type="button" data-action="next">MULAI CERITA →</button>
        </div>
      </div>
    </div>
  `;
}

function renderPhotoScene(type) {
  const captions = {
    user: {
      title: state.userName || "Kamu",
      text1: `Ini adalah ${state.userName || "Kamu"}...`,
      text2: "Seseorang yang sedang menulis cerita baru.",
      photo: state.userPhoto,
    },
    partner: {
      title: state.partnerName || "Pasangan",
      text1: `Dan ini adalah ${state.partnerName || "Pasanganmu"}... ❤️`,
      text2: "Seseorang yang membuat hari-hari menjadi lebih berarti.",
      photo: state.partnerPhoto,
    },
  };

  const info = captions[type];
  return `
    <div class="story-card photo-scene">
      <div class="photo-wrap ${type === "user" ? "portrait-photo" : ""}">
        <img src="${info.photo}" alt="${info.title}" />
      </div>
      <div class="photo-copy">
        <h3>${info.text1}</h3>
        <p>${info.text2}</p>
        <div class="scene-actions">
          <button class="primary-btn story-nav" type="button" data-action="next">LANJUT →</button>
        </div>
      </div>
    </div>
  `;
}

function renderTogetherScene() {
  const leftPhoto = state.togetherPhoto || state.userPhoto;
  const rightPhoto = state.togetherPhoto ? state.partnerPhoto : state.partnerPhoto;

  return `
    <div class="story-card together-scene">
      <div class="scene-content">
        <h3 class="scene-quote">Dua orang...</h3>
        <h3 class="scene-quote" style="animation-delay:0.3s;">Dengan cerita yang terus bertambah.</h3>
        <div class="together-grid">
          <div class="together-frame">
            <img src="${leftPhoto}" alt="Foto kamu" />
          </div>
          <div class="together-frame">
            <img src="${rightPhoto}" alt="Foto pasangan" />
          </div>
        </div>
        <div class="scene-actions">
          <button class="primary-btn story-nav" type="button" data-action="next">LIHAT PERJALANAN KITA →</button>
        </div>
      </div>
    </div>
  `;
}

function renderMemoryJourneyScene() {
  const levels = getMemoryLevelData();
  const active = levels[state.activeMemoryIndex] || levels[0];

  return `
    <div class="story-card">
      <div class="scene-content">
        <h3 class="scene-quote">Our Memories ❤️</h3>
      </div>
      <div class="memory-journey">
        <div class="memory-levels">
          ${levels.map((level, index) => `
            <button class="memory-level ${index === state.activeMemoryIndex ? "active" : ""}" type="button" data-level-index="${index}">
              <strong>${level.title}</strong>
              <span>${level.text}</span>
            </button>
          `).join("")}
        </div>

        <div class="memory-detail">
          <img class="detail-image" src="${active.photo || state.userPhoto}" alt="${active.title}" />
          <h4>${active.title}</h4>
          <p>${active.text}</p>
        </div>
      </div>
      <div class="scene-actions">
        <button class="secondary-btn story-nav" type="button" data-action="back">← Kembali</button>
        <button class="primary-btn story-nav" type="button" data-action="next">LANJUT →</button>
      </div>
    </div>
  `;
}

function renderMiniGameScene() {
  const targetCount = 5;
  const hearts = [];
  for (let i = 0; i < targetCount; i += 1) {
    hearts.push({
      left: 8 + Math.random() * 72,
      top: 10 + Math.random() * 62,
      size: 26 + Math.random() * 16,
    });
  }

  return `
    <div class="story-card">
      <div class="scene-content">
        <h3 class="scene-quote">Collect The Love ❤️</h3>
        <p class="scene-copy">Kumpulkan 5 hati untuk membuka pesan spesial.</p>

        <div class="game-area" id="miniGameArea">
          ${hearts.map((heart, index) => `
            <button type="button" class="heart-target" data-heart-index="${index}" style="left:${heart.left}%; top:${heart.top}%; font-size:${heart.size}px; animation-delay:${(index * 0.2).toFixed(1)}s;">❤</button>
          `).join("")}
        </div>

        <div class="game-score">
          <strong>Skor: <span id="miniGameScore">${state.miniGameScore}</span>/5</strong>
          <button class="secondary-btn" type="button" id="restartMiniGame">Ulangi</button>
        </div>

        <div class="scene-actions">
          <button class="primary-btn story-nav" type="button" data-action="next" id="miniGameNext" ${state.miniGameScore >= 5 ? "" : "disabled"}>LANJUT →</button>
        </div>
      </div>
    </div>
  `;
}

function renderSlideshowScene() {
  const photos = state.memoryPhotos.length ? state.memoryPhotos : [{ dataUrl: state.userPhoto || state.partnerPhoto || state.togetherPhoto || "", caption: "Our Story" }];
  const current = photos[state.currentScene % photos.length] || photos[0];

  return `
    <div class="story-card">
      <div class="scene-content">
        <h3 class="scene-quote">Our Little Memories ❤️</h3>
        <div class="slideshow">
          <div class="slideshow-frame">
            <img src="${current.dataUrl}" alt="Kenangan" />
            <div class="caption">${current.caption || "Kenangan indah"}</div>
          </div>
        </div>
        <div class="scene-actions">
          <button class="secondary-btn story-nav" type="button" data-action="back">← Kembali</button>
          <button class="primary-btn story-nav" type="button" data-action="next">LANJUT KE PESAN TERAKHIR →</button>
        </div>
      </div>
    </div>
  `;
}

function renderLetterScene() {
  const userPhoto = state.userPhoto || state.partnerPhoto;
  const partnerPhoto = state.partnerPhoto || state.userPhoto;
  const message = state.message || defaultMessage;

  return `
    <div class="story-card letter-scene">
      <div class="letter-window">
        <div class="letter-header">
          <img src="${userPhoto}" alt="${state.userName || "Kamu"}" />
          <img src="${partnerPhoto}" alt="${state.partnerName || "Pasangan"}" />
        </div>
        <div class="letter-message">
          <span class="big-line">${state.storyTitle || "Our Little Adventure"}</span>
          ${message}
          <br /><br />
          “Aku mungkin tidak selalu sempurna...”
          <br />
          “Aku mungkin tidak selalu bisa memberikan hal terbaik...”
          <br />
          “Tapi aku ingin terus membuat cerita bersama kamu.”
        </div>
      </div>
      <div class="scene-actions" style="margin-top:20px;">
        <button class="primary-btn story-nav" type="button" data-action="next">LANJUT →</button>
      </div>
    </div>
  `;
}

function renderDeclarationScene() {
  return `
    <div class="story-card declare-scene">
      <div class="scene-content">
        <div class="scene-copy">Ada satu hal yang ingin aku katakan...</div>
        <div class="big-heart">❤</div>
        <div class="declare-text">Aku sayang kamu. ❤️</div>
        <div class="declare-text" style="font-size:clamp(1.2rem, 2.5vw, 1.8rem);">Aku ingin terus berjalan bersamamu.</div>
        <div class="declare-photos">
          <img src="${state.userPhoto || ""}" alt="Kamu" />
          <img src="${state.partnerPhoto || ""}" alt="Pasangan" />
        </div>
        <div class="scene-actions">
          <button class="primary-btn story-nav" type="button" data-action="next">BUKA PESAN TERAKHIR 💌</button>
        </div>
      </div>
    </div>
  `;
}

function renderQuestionScene() {
  return `
    <div class="story-card question-card">
      <div class="scene-content">
        <h3 class="scene-quote">Jadi...</h3>
        <h3 class="scene-quote" style="animation-delay:0.3s;">Apakah kamu mau terus membuat cerita bersamaku?</h3>
        <div class="answer-group">
          <button class="answer-btn" type="button" id="acceptLoveBtn">MAU ❤️</button>
          <button class="answer-btn" type="button" id="acceptLoveBtnBig">MAU BANGET ❤️❤️</button>
        </div>
      </div>
    </div>
  `;
}

function renderEndingScene() {
  const dateText = state.specialDate ? `Since ${formatDate(state.specialDate)}` : "";
  const shareUrl = buildShareUrl();

  return `
    <div class="ending-card">
      <div class="ending-photos">
        <img src="${state.userPhoto || ""}" alt="${state.userName || "Kamu"}" />
        <img src="${state.partnerPhoto || ""}" alt="${state.partnerName || "Pasangan"}" />
      </div>
      <h2>OUR STORY CONTINUES ❤️</h2>
      <p class="summary">Terima kasih sudah menjadi bagian dari cerita ini.</p>
      <div class="partner-line">${state.userName || "Kamu"} ❤️ ${state.partnerName || "Pasangan"}</div>
      ${dateText ? `<p class="summary">${dateText}</p>` : ""}
      <p class="summary">${state.message || defaultMessage}</p>

      <div class="final-actions">
        <button class="primary-btn" type="button" id="playAgainBtn">MAIN LAGI 🔄</button>
        <button class="secondary-btn" type="button" id="newStoryFromEndBtn">BUAT CERITA BARU ❤️</button>
        <button class="share-btn" type="button" id="shareGameBtn">BAGIKAN GAME 🔗</button>
      </div>

      <div class="final-actions" style="margin-top: 10px;">
        <button class="export-btn" type="button" id="exportStoryBtn">EXPORT LOVE STORY</button>
      </div>

      <div class="helper-box" style="margin-top:18px;">
        <strong>Catatan privasi:</strong>
        <p>Link dibagikan hanya berisi teks cerita agar aman. Foto tidak dikirim ke server; penerima perlu memilih foto sendiri jika ingin ikut bermain.</p>
      </div>
    </div>
  `;
}

function renderScene() {
  const scenes = [
    renderOpeningScene,
    () => renderPhotoScene("user"),
    () => renderPhotoScene("partner"),
    () => renderTogetherScene(),
    () => renderMemoryJourneyScene(),
    () => renderMiniGameScene(),
    () => renderSlideshowScene(),
    () => renderLetterScene(),
    () => renderDeclarationScene(),
    () => renderQuestionScene(),
    () => renderEndingScene(),
  ];

  if (state.currentScene < 0) state.currentScene = 0;
  if (state.currentScene >= scenes.length) state.currentScene = scenes.length - 1;

  storyStage.innerHTML = scenes[state.currentScene]();

  if (state.currentScene === 4) {
    bindMemoryLevelClicks();
  }

  if (state.currentScene === 5) {
    bindMiniGame();
  }

  if (state.currentScene === 9) {
    bindFinalButtons();
  }

  bindNavigationButtons();
  if (state.currentScene === 0) {
    createStars(document.querySelector(".story-card .stars"));
    shuffleHearts(document.querySelector(".story-card .floating-hearts-scene"), 16);
  }
}

function bindNavigationButtons() {
  document.querySelectorAll("[data-action='next']").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentScene += 1;
      renderScene();
    });
  });

  document.querySelectorAll("[data-action='back']").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentScene -= 1;
      renderScene();
    });
  });
}

function bindMemoryLevelClicks() {
  document.querySelectorAll(".memory-level").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeMemoryIndex = Number(button.dataset.levelIndex);
      renderScene();
    });
  });
}

function bindMiniGame() {
  const area = document.getElementById("miniGameArea");
  const scoreLabel = document.getElementById("miniGameScore");
  const nextBtn = document.getElementById("miniGameNext");
  const restartBtn = document.getElementById("restartMiniGame");

  if (!area) return;

  const hearts = area.querySelectorAll(".heart-target");

  hearts.forEach((heart) => {
    heart.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      heart.remove();
      state.miniGameScore += 1;
      scoreLabel.textContent = state.miniGameScore;

      if (state.miniGameScore >= 5) {
        nextBtn.disabled = false;
        showToast("Love collected! ❤️");
      }
    });
  });

  restartBtn.addEventListener("click", () => {
    state.miniGameScore = 0;
    renderScene();
  });

  nextBtn.disabled = state.miniGameScore < 5;
}

function bindFinalButtons() {
  const acceptBtn = document.getElementById("acceptLoveBtn");
  const acceptBtnBig = document.getElementById("acceptLoveBtnBig");

  const celebrate = () => {
    renderConfetti();
    document.body.classList.add("winning");
    showToast("Akan ada cerita indah yang akan terus kita jalani. ❤️");
    state.currentScene = 10;
    renderScene();
  };

  if (acceptBtn) acceptBtn.addEventListener("click", celebrate);
  if (acceptBtnBig) acceptBtnBig.addEventListener("click", celebrate);
}

function renderConfetti() {
  const container = document.createElement("div");
  container.className = "particles";
  container.setAttribute("aria-hidden", "true");

  for (let i = 0; i < 30; i += 1) {
    const piece = document.createElement("span");
    piece.className = "heart-particle";
    piece.textContent = "❤";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${Math.random() * 100}%`;
    piece.style.fontSize = `${16 + Math.random() * 18}px`;
    piece.style.animation = `drift ${3 + Math.random() * 3}s linear forwards`;
    container.appendChild(piece);
  }

  storyStage.appendChild(container);
  setTimeout(() => container.remove(), 3000);
}

function setupEndingActions() {
  document.addEventListener("click", (event) => {
    const playAgainBtn = event.target.closest("#playAgainBtn");
    const resetStoryBtn = event.target.closest("#newStoryFromEndBtn");
    const shareGameBtn = event.target.closest("#shareGameBtn");
    const exportStoryBtn = event.target.closest("#exportStoryBtn");

    if (playAgainBtn) {
      state.currentScene = 0;
      renderScene();
      return;
    }

    if (resetStoryBtn) {
      setScreen("setup");
      return;
    }

    if (shareGameBtn) {
      shareGame();
      return;
    }

    if (exportStoryBtn) {
      exportStoryConfig();
    }
  });
}

async function shareGame() {
  const url = buildShareUrl();
  const shareText = `${state.userName || "Kamu"} dan ${state.partnerName || "pasangan"} ingin berbagi cerita cinta. ${url}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: state.storyTitle || "Our Little Love Story",
        text: shareText,
        url,
      });
      showToast("Link berhasil dibagikan.");
      return;
    } catch (error) {
      console.log("Share dibatalkan.");
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast("Link berhasil disalin ke clipboard.");
  } catch (error) {
    showToast(`Bagikan link ini: ${url}`);
  }
}

function exportStoryConfig() {
  const payload = buildSharePayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const fileUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = "love-story-config.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileUrl);
  showToast("File konfigurasi cerita berhasil diunduh.");
}

function initialize() {
  setScreen("landing");
  setupForm();
  setupEndingActions();
  document.body.classList.toggle("anime-theme", state.theme === "anime");

  const musicDisabledMessage = "File musik tidak tersedia di folder /assets/music. Game tetap berjalan dengan musik off.";
  if (!audio.src) {
    showToast(musicDisabledMessage);
  }
}

initialize();
