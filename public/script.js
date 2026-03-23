const form = document.getElementById('guestbook-form');
const guestNameInput = document.getElementById('guestName');
const messageInput = document.getElementById('message');
const moodInput = document.getElementById('mood');
const ratingInput = document.getElementById('rating');
const attachmentInput = document.getElementById('attachment');
const attachmentPreview = document.getElementById('attachmentPreview');
const messageList = document.getElementById('messageList');
const emptyState = document.getElementById('emptyState');
const statusLine = document.getElementById('status');
const messageCount = document.getElementById('messageCount');
const currentMoodLabel = document.getElementById('currentMoodLabel');
const rotatingLine = document.getElementById('rotatingLine');
const innHighlights = document.getElementById('innHighlights');
const brochureSummary = document.getElementById('brochureSummary');
const brochureStage = document.getElementById('brochureStage');
const brochureThumbs = document.getElementById('brochureThumbs');
const brochureProgress = document.getElementById('brochureProgress');
const brochurePrev = document.getElementById('brochurePrev');
const brochureNext = document.getElementById('brochureNext');
const suiteFilters = document.getElementById('suiteFilters');
const suiteStage = document.getElementById('suiteStage');
const suiteDots = document.getElementById('suiteDots');
const suiteCounter = document.getElementById('suiteCounter');
const suitePrev = document.getElementById('suitePrev');
const suiteNext = document.getElementById('suiteNext');
const courierScene = document.getElementById('courierScene');
const courierCopy = document.getElementById('courierCopy');

const listKey = 'guestbook';
const version = document.body.dataset.version || 'v1';
const maxAttachmentBytes = 1.5 * 1024 * 1024;
let currentAttachment = null;
let innData = null;
let rotatingLines = [
  'The hall stands ready for the next candlelit account.',
  'A folded brochure waits beside the leather-bound ledger.',
  'The owl courier circles overhead for the next sealed missive.'
];
let rotatingIndex = 0;
let brochureIndex = 0;
let suiteIndex = 0;
let suiteFilter = 'all';
let suiteTimer = null;

const moodConfig = {
  ember: {
    label: 'Ember of Hope',
    entryLabel: 'Hopeful flame',
    accent: 'Warm candlelight and golden embers',
    buttonLabel: 'Warm'
  },
  moonlit: {
    label: 'Moonlit Wonder',
    entryLabel: 'Moonlit whisper',
    accent: 'Silver hush and star-bound wonder',
    buttonLabel: 'Wonder'
  },
  storm: {
    label: 'Stormforged Resolve',
    entryLabel: 'Storm vow',
    accent: 'Steady steel beneath dark skies',
    buttonLabel: 'Resolve'
  },
  mirth: {
    label: 'Feasting Mirth',
    entryLabel: 'Festival cheer',
    accent: 'Laughter in the timbered hall',
    buttonLabel: 'Mirth'
  },
  solemn: {
    label: 'Quiet Oath',
    entryLabel: 'Quiet oath',
    accent: 'Stillness, duty, and candle smoke',
    buttonLabel: 'Oath'
  }
};

const suiteFilterMeta = [
  { key: 'ember', label: 'Warm' },
  { key: 'moonlit', label: 'Wonder' },
  { key: 'storm', label: 'Resolve' },
  { key: 'mirth', label: 'Mirth' },
  { key: 'solemn', label: 'Oath' }
];

const suiteMoodByTitle = {
  'Embermere Suite': 'ember',
  'Moonthorn Chamber': 'moonlit',
  'Willowfen Room': 'mirth',
  'Hearthstone Chamber': 'ember',
  'Starfall Loft': 'moonlit',
  'Rowanveil Suite': 'storm',
  'Thistlekeep Room': 'solemn',
  'Sable Hearth Suite': 'solemn'
};

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.style.color = isError ? '#8b2f27' : '#5e523f';
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown hour';
  }
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function starsForRating(rating) {
  return '★'.repeat(Math.max(1, Math.min(5, Number(rating) || 0)));
}

function readEntry(item) {
  if (typeof item !== 'string') {
    return item;
  }

  try {
    return JSON.parse(item);
  } catch (error) {
    return {
      guestName: 'Unknown Visitor',
      message: item,
      mood: 'solemn',
      rating: 3,
      createdAt: new Date().toISOString(),
      attachment: null,
      version: 'legacy'
    };
  }
}

function renderAttachmentPreview(file, dataUrl) {
  attachmentPreview.hidden = false;
  if (file.type.startsWith('image/')) {
    attachmentPreview.innerHTML = `
      <img src="${dataUrl}" alt="Attachment preview" />
      <div>
        <strong>${escapeHtml(file.name)}</strong>
        <p class="field-hint">Image keepsake ready for the seal.</p>
      </div>`;
  } else {
    attachmentPreview.innerHTML = `
      <audio controls src="${dataUrl}"></audio>
      <div>
        <strong>${escapeHtml(file.name)}</strong>
        <p class="field-hint">Audio keepsake ready for the owl courier.</p>
      </div>`;
  }
}

function clearAttachmentPreview() {
  attachmentPreview.hidden = true;
  attachmentPreview.innerHTML = '';
  currentAttachment = null;
}

attachmentInput?.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    clearAttachmentPreview();
    return;
  }

  if (!(file.type.startsWith('image/') || file.type.startsWith('audio/'))) {
    attachmentInput.value = '';
    clearAttachmentPreview();
    setStatus('Only image and audio keepsakes may be bound into the chronicle.', true);
    return;
  }

  if (file.size > maxAttachmentBytes) {
    attachmentInput.value = '';
    clearAttachmentPreview();
    setStatus('Choose a keepsake smaller than 1.5 MB.', true);
    return;
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });

  currentAttachment = {
    name: file.name,
    type: file.type,
    dataUrl
  };

  renderAttachmentPreview(file, dataUrl);
  setStatus('Keepsake attached and ready for the wax crest.');
});

function buildInnCard(item) {
  return `
    <article class="inn-card">
      <img src="${item.image}" alt="${escapeHtml(item.title)} at the Shire Inn" />
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.detail)}</p>
    </article>`;
}

function getSuiteMoodKey(room) {
  return room.filter || suiteMoodByTitle[room.title] || 'moonlit';
}

function buildPaletteMarkup(paletteText) {
  const items = String(paletteText || '').split(',').map((item) => item.trim()).filter(Boolean);
  return items.map((item) => `<span>${escapeHtml(item)}</span>`).join('');
}

function getFilteredRooms() {
  const rooms = innData?.rooms || [];
  if (suiteFilter === 'all') {
    return rooms;
  }
  return rooms.filter((room) => getSuiteMoodKey(room) === suiteFilter);
}

function renderSuiteFilters() {
  if (!suiteFilters) {
    return;
  }

  suiteFilters.innerHTML = suiteFilterMeta.map((item) => `
    <button
      type="button"
      class="suite-filter-chip ${suiteFilter === item.key ? 'active' : ''} ${item.key}"
      data-filter="${item.key}"
      aria-pressed="${suiteFilter === item.key}"
    >${item.label}</button>`).join('');

  suiteFilters.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.filter;
      suiteFilter = suiteFilter === key ? 'all' : key;
      suiteIndex = 0;
      renderSuiteFilters();
      renderSuiteShowcase('next');
      startSuiteTimer();
    });
  });
}

function renderSuiteShowcase(direction = 'next') {
  if (!suiteStage || !suiteDots || !suiteCounter) {
    return;
  }

  const rooms = getFilteredRooms();
  if (!rooms.length) {
    suiteStage.innerHTML = '<div class="suite-empty">No suite currently matches that mood.</div>';
    suiteDots.innerHTML = '';
    suiteCounter.textContent = '';
    return;
  }

  suiteIndex = ((suiteIndex % rooms.length) + rooms.length) % rooms.length;
  const room = rooms[suiteIndex];
  const moodKey = getSuiteMoodKey(room);
  const moodLabel = moodConfig[moodKey]?.buttonLabel || 'Wonder';
  const animationClass = direction === 'prev' ? 'slide-prev' : 'slide-next';

  suiteStage.innerHTML = `
    <article class="suite-spotlight ${animationClass} mood-${moodKey}">
      <div class="suite-image-frame">
        <div class="suite-progress-bar"><span></span></div>
        <img src="${room.image}" alt="${escapeHtml(room.title)} at the Shire Inn" />
        <div class="suite-image-glow"></div>
      </div>
      <div class="suite-copy-panel">
        <div class="suite-overline">${escapeHtml(moodLabel)} • Storybook Suite</div>
        <h4>${escapeHtml(room.title)}</h4>
        <p class="suite-mood-line">${escapeHtml(room.mood)}</p>
        <p class="suite-detail">${escapeHtml(room.detail)}</p>
        <div class="suite-palette-swatches">${buildPaletteMarkup(room.palette)}</div>
      </div>
    </article>`;

  suiteDots.innerHTML = rooms.map((item, index) => `
    <button
      type="button"
      class="suite-dot ${index === suiteIndex ? 'active' : ''}"
      data-index="${index}"
      aria-label="Show ${escapeHtml(item.title)}"
    ></button>`).join('');

  suiteDots.querySelectorAll('[data-index]').forEach((dot) => {
    dot.addEventListener('click', () => {
      suiteIndex = Number(dot.dataset.index || 0);
      renderSuiteShowcase('next');
      startSuiteTimer();
    });
  });

  suiteCounter.textContent = `${String(suiteIndex + 1).padStart(2, '0')} / ${String(rooms.length).padStart(2, '0')} • ${moodLabel}`;
}

function nextSuite() {
  const rooms = getFilteredRooms();
  if (!rooms.length) {
    return;
  }
  suiteIndex = (suiteIndex + 1) % rooms.length;
  renderSuiteShowcase('next');
}

function prevSuite() {
  const rooms = getFilteredRooms();
  if (!rooms.length) {
    return;
  }
  suiteIndex = (suiteIndex - 1 + rooms.length) % rooms.length;
  renderSuiteShowcase('prev');
}

function startSuiteTimer() {
  window.clearInterval(suiteTimer);
  suiteTimer = window.setInterval(nextSuite, 6800);
}

function renderBrochureViewer(direction = 'next') {
  if (!brochureStage || !brochureThumbs || !brochureProgress || !innData?.brochurePanels?.length) {
    return;
  }

  const panels = innData.brochurePanels;
  brochureIndex = ((brochureIndex % panels.length) + panels.length) % panels.length;
  const panel = panels[brochureIndex];
  const animationClass = direction === 'prev' ? 'turn-prev' : 'turn-next';

  brochureStage.innerHTML = `
    <div class="brochure-page ${animationClass}">
      <div class="brochure-image-wrap">
        <img src="${panel.image}" alt="${escapeHtml(panel.title)}" />
      </div>
      <div class="brochure-page-copy">
        <span class="brochure-page-kicker">Panel ${brochureIndex + 1}</span>
        <h4>${escapeHtml(panel.title)}</h4>
        <p>${escapeHtml(panel.caption)}</p>
        <div class="brochure-page-note">Click the parchment to turn the next panel.</div>
      </div>
    </div>`;

  brochureThumbs.innerHTML = panels.map((item, index) => `
    <button
      type="button"
      class="brochure-thumb ${index === brochureIndex ? 'active' : ''}"
      data-index="${index}"
      aria-label="Open ${escapeHtml(item.title)}"
    >
      <img src="${item.image}" alt="" />
      <span>${escapeHtml(item.title)}</span>
    </button>`).join('');

  brochureThumbs.querySelectorAll('[data-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextIndex = Number(button.dataset.index || 0);
      const nextDirection = nextIndex < brochureIndex ? 'prev' : 'next';
      brochureIndex = nextIndex;
      renderBrochureViewer(nextDirection);
    });
  });

  brochureProgress.textContent = `Panel ${brochureIndex + 1} of ${panels.length} • ${panel.title}`;
}

function nextBrochure() {
  const panels = innData?.brochurePanels || [];
  if (!panels.length) {
    return;
  }
  brochureIndex = (brochureIndex + 1) % panels.length;
  renderBrochureViewer('next');
}

function prevBrochure() {
  const panels = innData?.brochurePanels || [];
  if (!panels.length) {
    return;
  }
  brochureIndex = (brochureIndex - 1 + panels.length) % panels.length;
  renderBrochureViewer('prev');
}

function renderInnData(data) {
  if (!data) {
    return;
  }

  if (brochureSummary && data.brochureIntro?.summary) {
    brochureSummary.textContent = data.brochureIntro.summary;
  }

  if (data.highlights && innHighlights) {
    innHighlights.innerHTML = data.highlights.map(buildInnCard).join('');
  }

  if (Array.isArray(data.rotatingLines) && data.rotatingLines.length) {
    rotatingLines = data.rotatingLines;
    rotatingLine.textContent = rotatingLines[0];
  }

  renderSuiteFilters();
  renderSuiteShowcase('next');
  renderBrochureViewer('next');
  startSuiteTimer();
}

async function loadInnData() {
  try {
    const response = await fetch('/api/inn');
    if (!response.ok) {
      throw new Error('Unable to load inn details');
    }
    innData = await response.json();
    renderInnData(innData);
  } catch (error) {
    console.error(error);
  }
}

function renderMessages(items) {
  const entries = [...items].map(readEntry).reverse();
  messageCount.textContent = String(entries.length);
  emptyState.hidden = entries.length > 0;

  if (!entries.length) {
    messageList.innerHTML = '';
    currentMoodLabel.textContent = 'Awaiting a visitor';
    return;
  }

  currentMoodLabel.textContent = moodConfig[entries[0].mood]?.label || 'Awaiting a visitor';

  messageList.innerHTML = entries.map((entry, index) => {
    const mood = moodConfig[entry.mood] || moodConfig.solemn;
    let attachmentMarkup = '';

    if (entry.attachment?.dataUrl && entry.attachment?.type) {
      if (entry.attachment.type.startsWith('image/')) {
        attachmentMarkup = `
          <div class="entry-attachment">
            <div class="attachment-label">Attached keepsake • ${escapeHtml(entry.attachment.name || 'image')}</div>
            <img src="${entry.attachment.dataUrl}" alt="Attached keepsake from ${escapeHtml(entry.guestName || 'visitor')}" />
          </div>`;
      } else if (entry.attachment.type.startsWith('audio/')) {
        attachmentMarkup = `
          <div class="entry-attachment">
            <div class="attachment-label">Attached keepsake • ${escapeHtml(entry.attachment.name || 'audio')}</div>
            <audio controls src="${entry.attachment.dataUrl}"></audio>
          </div>`;
      }
    }

    return `
      <li class="message-card mood-${escapeHtml(entry.mood || 'solemn')}" style="animation-delay:${index * 80}ms">
        <div class="entry-topline">
          <span class="entry-name">${escapeHtml(entry.guestName || 'Unknown Visitor')}</span>
          <span class="entry-mood ${escapeHtml(entry.mood || 'solemn')}">${escapeHtml(mood.entryLabel)}</span>
        </div>
        <p class="entry-text">“${escapeHtml(entry.message || '')}”</p>
        <div class="entry-bottomline">
          <span class="entry-meta">${escapeHtml(formatDate(entry.createdAt))}</span>
          <span class="entry-rating">${starsForRating(entry.rating)} • ${escapeHtml(mood.accent)}</span>
        </div>
        ${attachmentMarkup}
      </li>`;
  }).join('');
}

async function loadMessages() {
  try {
    setStatus('Opening the chronicle and gathering earlier entries…');
    const response = await fetch(`/entries/${listKey}`);
    if (!response.ok) {
      throw new Error('Unable to fetch entries');
    }

    const items = await response.json();
    renderMessages(items);
    setStatus(`The chronicle is open. ${items.length} entr${items.length === 1 ? 'y' : 'ies'} displayed.`);
  } catch (error) {
    renderMessages([]);
    setStatus('The chronicle could not be opened just now.', true);
  }
}

function rotateLine() {
  if (!rotatingLines.length) {
    return;
  }
  rotatingIndex = (rotatingIndex + 1) % rotatingLines.length;
  rotatingLine.textContent = rotatingLines[rotatingIndex];
}

function playCourierSequence(guestName) {
  if (!courierScene) {
    return Promise.resolve();
  }

  courierScene.classList.add('active');
  if (courierCopy) {
    courierCopy.textContent = `Wax pressed for ${guestName || 'the realm'} — the Iron Quill courier gathers the letter and takes wing.`;
  }

  return new Promise((resolve) => {
    window.setTimeout(() => {
      courierScene.classList.remove('active');
      resolve();
    }, 4300);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const guestName = guestNameInput.value.trim();
  const message = messageInput.value.trim();
  const mood = moodInput.value;
  const rating = ratingInput.value;

  if (!guestName || !message || !mood || !rating) {
    setStatus('Name, message, mood, and rating must all be recorded before the wax is pressed.', true);
    return;
  }

  const payload = {
    guestName,
    message,
    mood,
    rating: Number(rating),
    createdAt: new Date().toISOString(),
    attachment: currentAttachment,
    version
  };

  try {
    setStatus('Pressing the crest and summoning the owl courier…');
    const response = await fetch(`/entries/${listKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Unable to save entry');
    }

    const items = await response.json();
    renderMessages(items);
    await playCourierSequence(guestName);
    form.reset();
    clearAttachmentPreview();
    rotateLine();
    setStatus('Your letter has entered the chronicle and flown into legend.');
  } catch (error) {
    setStatus('The seal broke before dispatch. Try your entry again.', true);
  }
});

brochurePrev?.addEventListener('click', prevBrochure);
brochureNext?.addEventListener('click', nextBrochure);
brochureStage?.addEventListener('click', nextBrochure);
suitePrev?.addEventListener('click', () => {
  prevSuite();
  startSuiteTimer();
});
suiteNext?.addEventListener('click', () => {
  nextSuite();
  startSuiteTimer();
});

suiteStage?.addEventListener('mouseenter', () => window.clearInterval(suiteTimer));
suiteStage?.addEventListener('mouseleave', startSuiteTimer);

window.setInterval(rotateLine, 5400);
loadInnData();
loadMessages();
