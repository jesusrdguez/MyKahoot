let kahootData = null;
const kahootDataMap = { '1': null, '2': null, '3': null, '4': null, '5': null };
const kahootLoaded = { '1': false, '2': false, '3': false, '4': false, '5': false };

let currentQuestion = 0;
let score = 0;
let locked = false;
let correctCount = 0;
let wrongCount = 0;
let unansweredCount = 0;
let questionStates = [];
let selectedAnswers = [];
let shuffleAnswers = false;
let answerOrders = [];

// Editor state (moved to global scope so editor functions can access them)
let editorTheme = '1';
let editing = false;
let editorWorkingCopy = null; // copy of questions for editing

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const themeToggle = document.getElementById('themeToggle');
  const openEditorBtn = document.getElementById('openEditorBtn');
  const editorScreen = document.getElementById('editorScreen');
  const startScreen = document.getElementById('startScreen');
  const closeEditorBtn = document.getElementById('closeEditorBtn');
  const editorList = document.getElementById('editorList');
  const editToggleBtn = document.getElementById('editToggleBtn');
  const saveEditsBtn = document.getElementById('saveEditsBtn');
  const cancelEditsBtn = document.getElementById('cancelEditsBtn');
  const resetThemeBtn = document.getElementById('resetThemeBtn');
  const resetAllBtn = document.getElementById('resetAllBtn');
  const exportBtn = document.getElementById('exportBtn');

  

  const applyTheme = (theme) => {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    if (themeToggle) themeToggle.textContent = (theme === 'dark') ? '☀️' : '🌙';
    try { localStorage.setItem('theme', theme); } catch(e){}
  };

  const storedTheme = (() => { try { return localStorage.getItem('theme'); } catch(e){ return null } })();
  if (storedTheme) applyTheme(storedTheme);
  else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  if (themeToggle) themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = 'Cargando preguntas...';
    const sbtn = document.getElementById('shuffleBtn');
    if (sbtn) {
      sbtn.textContent = 'Barajar Preguntas: ' + (shuffleAnswers ? 'ON' : 'OFF');
      sbtn.setAttribute('aria-pressed', String(shuffleAnswers));
      sbtn.addEventListener('click', toggleShuffle);
    }
  }

  if (openEditorBtn) openEditorBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    editorScreen.classList.remove('hidden');
    renderEditor(editorTheme);
  });
  if (closeEditorBtn) closeEditorBtn.addEventListener('click', () => {
    editorScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
  });

  document.querySelectorAll('input[name="editorTheme"]').forEach(r => r.addEventListener('change', (e) => {
    editorTheme = e.target.value;
    editing = false;
    toggleEditorButtons();
    renderEditor(editorTheme);
  }));

  if (editToggleBtn) editToggleBtn.addEventListener('click', () => { editing = true; prepareEdit(); });
  if (cancelEditsBtn) cancelEditsBtn.addEventListener('click', () => { editing = false; renderEditor(editorTheme); toggleEditorButtons(); });
  if (saveEditsBtn) saveEditsBtn.addEventListener('click', () => { saveEdits(); });
  if (resetThemeBtn) resetThemeBtn.addEventListener('click', () => { resetThemeEdits(editorTheme); });
  if (resetAllBtn) resetAllBtn.addEventListener('click', () => { resetAllEdits(); });
  if (exportBtn) exportBtn.addEventListener('click', () => { exportThemeJSON(editorTheme); });

  const files = { '1': 'questions.json', '2': 'questionsT2.json', '3': 'questionsT3.json', '4': 'questionsT4.json' };
  // include tema 5
  files['5'] = 'questionsT5.json';
  function checkStartEnabled() {
    const sel = document.querySelector('input[name="theme"]:checked')?.value || '1';
    if (sel === 'mix') {
      // mix requires all themes loaded
      if (kahootLoaded['1'] && kahootLoaded['2'] && kahootLoaded['3'] && kahootLoaded['4'] && kahootLoaded['5']) {
        startBtn.disabled = false;
        startBtn.textContent = 'Iniciar (Mix)';
        try { document.title = 'Mix: ' + (kahootDataMap['1'].title || '') + ' + ' + (kahootDataMap['2'].title || '') + ' + ' + (kahootDataMap['3'].title || '') + ' + ' + (kahootDataMap['4'].title || ''); } catch(e){}
      } else {
        startBtn.disabled = true;
        startBtn.textContent = 'Cargando preguntas...';
      }
    } else {
      if (kahootLoaded[sel]) {
        startBtn.disabled = false;
        startBtn.textContent = 'Iniciar';
        try { document.title = kahootDataMap[sel].title || document.title; } catch(e){}
      } else {
        startBtn.disabled = true;
        startBtn.textContent = 'Cargando preguntas...';
      }
    }
    const mixEl = document.getElementById('mixControls');
    if (mixEl) mixEl.style.display = (sel === 'mix') ? 'flex' : 'none';
    const qshuffle = document.getElementById('shuffleQuestionsControl');
    if (qshuffle) qshuffle.style.display = (sel === 'mix') ? 'none' : 'flex';
  }

  Object.keys(files).forEach(key => {
    fetch(files[key]).then(res => {
      if (!res.ok) throw new Error('HTTP error ' + res.status);
      return res.json();
    }).then(data => {
      try {
        if (data && Array.isArray(data.questions)) {
          data.questions.forEach(q => { if (q.tema === undefined) q.tema = Number(key); if (q.unit === undefined) q.unit = Number(key); });
        }
      } catch(e) { console.warn('No se pudo añadir tema/unit:', e); }
      kahootDataMap[key] = data;
      kahootLoaded[key] = true;
      // apply any saved edits from localStorage
      try {
        const saved = localStorage.getItem('kahoot_edits_theme_' + key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.questions)) {
            // override questions with saved version
            kahootDataMap[key].questions = parsed.questions;
          }
        }
      } catch(e) { console.warn('No se pudo aplicar edits guardados', e); }
      // update mix bounds when each file loads
      try { updateMixBounds(); } catch(e){}
      checkStartEnabled();
    }).catch(err => {
      console.warn('No se pudo cargar', files[key], err);
      kahootLoaded[key] = false;
      checkStartEnabled();
    });
  });

  document.querySelectorAll('input[name="theme"]').forEach(r => r.addEventListener('change', checkStartEnabled));
  function updateMixBounds() {
    const count = document.getElementById('mixCount');
    if (!count) return;
    const total = ((kahootDataMap['1']?.questions?.length || 0) + (kahootDataMap['2']?.questions?.length || 0) + (kahootDataMap['3']?.questions?.length || 0) + (kahootDataMap['4']?.questions?.length || 0) + (kahootDataMap['5']?.questions?.length || 0));
    count.min = 1; count.max = Math.max(1, total);
    if (Number(count.value) > total) count.value = total;
    if (Number(count.value) < 1) count.value = 1;
  }
  const origCheck = checkStartEnabled;
  const wrapped = () => { origCheck(); updateMixBounds(); };
  document.querySelectorAll('input[name="theme"]').forEach(r => r.addEventListener('change', wrapped));
  // also update editor when underlying theme selection changes
  document.querySelectorAll('input[name="editorTheme"]').forEach(r => r.addEventListener('change', () => renderEditor(editorTheme)));
});

function toggleEditorButtons() {
  const editToggleBtn = document.getElementById('editToggleBtn');
  const saveEditsBtn = document.getElementById('saveEditsBtn');
  const cancelEditsBtn = document.getElementById('cancelEditsBtn');
  if (!editToggleBtn) return;
  if (editing) {
    editToggleBtn.classList.add('hidden');
    saveEditsBtn.classList.remove('hidden');
    cancelEditsBtn.classList.remove('hidden');
  } else {
    editToggleBtn.classList.remove('hidden');
    saveEditsBtn.classList.add('hidden');
    cancelEditsBtn.classList.add('hidden');
  }
}

function prepareEdit() {
  // create working copy from kahootDataMap
  const base = kahootDataMap[editorTheme];
  if (!base || !Array.isArray(base.questions)) return;
  editorWorkingCopy = base.questions.map(q => Object.assign({}, q));
  editing = true;
  toggleEditorButtons();
  renderEditor(editorTheme, true);
}

function renderEditor(theme, inEditMode = false) {
  const container = document.getElementById('editorList');
  if (!container) return;
  container.innerHTML = '';
  const data = (inEditMode && editorWorkingCopy) ? { questions: editorWorkingCopy } : kahootDataMap[theme] || { questions: [] };
  const qs = data.questions || [];
  qs.forEach((q, qi) => {
    const qDiv = document.createElement('div');
    qDiv.style.borderBottom = '1px solid rgba(0,0,0,0.04)';
    qDiv.style.padding = '8px';
    if (inEditMode && editing) {
      const qInput = document.createElement('input');
      qInput.type = 'text';
      qInput.value = editorWorkingCopy[qi].question || q.question || '';
      qInput.style.width = '100%';
      qInput.style.fontWeight = '700';
      qInput.style.marginBottom = '8px';
      qInput.addEventListener('input', (e) => {
        editorWorkingCopy[qi].question = e.target.value;
      });
      qDiv.appendChild(qInput);

      const ul = document.createElement('div');
      (editorWorkingCopy[qi].answers || []).forEach((a, ai) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.alignItems = 'center';
        row.style.marginTop = '6px';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'q_' + qi;
        radio.value = ai;
        radio.checked = (editorWorkingCopy[qi].correct === ai);
        radio.addEventListener('change', (e) => {
          const val = Number(e.target.value);
          editorWorkingCopy[qi].correct = val;
        });
        row.appendChild(radio);

        const ansInput = document.createElement('input');
        ansInput.type = 'text';
        ansInput.value = a;
        ansInput.style.flex = '1';
        ansInput.addEventListener('input', (e) => {
          editorWorkingCopy[qi].answers[ai] = e.target.value;
        });
        row.appendChild(ansInput);

        ul.appendChild(row);
      });
      qDiv.appendChild(ul);
    } else {
      const title = document.createElement('div');
      title.textContent = (qi+1) + '. ' + q.question;
      title.style.fontWeight = '700';
      qDiv.appendChild(title);
      const ul = document.createElement('div');
      q.answers.forEach((a, ai) => {
        const row = document.createElement('label');
        row.style.display = 'block';
        row.style.marginTop = '6px';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'q_' + qi;
        radio.value = ai;
        radio.disabled = true;
        if (q.correct === ai) radio.checked = true;
        row.appendChild(radio);
        const txt = document.createElement('span');
        txt.textContent = ' ' + a;
        row.appendChild(txt);
        ul.appendChild(row);
      });
      qDiv.appendChild(ul);
    }
    container.appendChild(qDiv);
  });
}

function saveEdits() {
  if (!editorWorkingCopy) return;
  const payload = { title: kahootDataMap[editorTheme]?.title || '', questions: editorWorkingCopy };
  try {
    localStorage.setItem('kahoot_edits_theme_' + editorTheme, JSON.stringify(payload));
    // apply to in-memory map
    kahootDataMap[editorTheme].questions = editorWorkingCopy.map(q => Object.assign({}, q));
    editing = false;
    toggleEditorButtons();
    renderEditor(editorTheme);
    alert('Cambios guardados en el almacenamiento local.');
  } catch(e) {
    console.error('Error guardando edits', e);
    alert('No se pudo guardar los cambios.');
  }
}

function resetThemeEdits(theme) {
  if (!confirm('¿Resetear los cambios de este tema a su estado original?')) return;
  try {
    localStorage.removeItem('kahoot_edits_theme_' + theme);
    // reload original file by re-fetching
    const fileMap = { '1': 'questions.json', '2': 'questionsT2.json', '3': 'questionsT3.json', '4': 'questionsT4.json' };
    fetch(fileMap[theme]).then(r => r.json()).then(data => {
      kahootDataMap[theme] = data;
      kahootLoaded[theme] = true;
      renderEditor(theme);
      alert('Tema reseteado.');
    }).catch(e => { console.warn(e); alert('No se pudo recargar el tema.'); });
  } catch(e) { console.warn(e); }
}

function resetAllEdits() {
  if (!confirm('¿Resetear todos los cambios de todos los temas?')) return;
  try {
    ['1','2','3','4'].forEach(k => localStorage.removeItem('kahoot_edits_theme_' + k));
    // reload all files
    const fileMap = { '1': 'questions.json', '2': 'questionsT2.json', '3': 'questionsT3.json', '4': 'questionsT4.json' };
    Object.keys(fileMap).forEach(k => {
      fetch(fileMap[k]).then(r => r.json()).then(data => { kahootDataMap[k] = data; kahootLoaded[k] = true; }).catch(()=>{});
    });
    renderEditor(editorTheme);
    alert('Todos los temas han sido reseteados.');
  } catch(e) { console.warn(e); }
}

function exportThemeJSON(theme) {
  const data = kahootDataMap[theme];
  if (!data) { alert('No hay datos para exportar'); return; }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `questionsT${theme}_edited.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function startGame() {
  const sel = document.querySelector('input[name="theme"]:checked')?.value || '1';
  if (sel === 'mix') {
    if (!(kahootLoaded['1'] && kahootLoaded['2'] && kahootLoaded['3'])) {
      alert('Las preguntas seleccionadas no se han cargado todavía. Espera un momento.');
      return;
    }
    const lists = ['1','2','3','4'].map(k => (kahootDataMap[k]?.questions || []).slice());
    let combined = [].concat(...lists).map(q => Object.assign({}, q));
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = combined[i]; combined[i] = combined[j]; combined[j] = tmp;
    }
    const countEl = document.getElementById('mixCount');
    const total = combined.length;
    let take = countEl ? Number(countEl.value) || 0 : 0;
    if (!Number.isFinite(take) || take <= 0) take = Math.min(10, total);
    take = Math.max(1, Math.min(take, total));
    kahootData = { title: 'Mix', questions: combined.slice(0, take) };
  } else {
    const base = kahootDataMap[sel];
    if (!base || !Array.isArray(base.questions)) {
      kahootData = base; // will be caught by the check below
    } else {
      const copied = base.questions.map(q => Object.assign({}, q));
      const shuffleQ = document.getElementById('shuffleQuestionsChk')?.checked;
      if (shuffleQ) {
        for (let i = copied.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = copied[i]; copied[i] = copied[j]; copied[j] = tmp;
        }
      }
      kahootData = { title: base.title || '', questions: copied };
    }
  }
  if (!kahootData || !kahootData.questions) {
    alert('Las preguntas seleccionadas no se han cargado todavía. Espera un momento.');
    return;
  }
  currentQuestion = 0;
  score = 0;
  locked = false;
  correctCount = 0;
  wrongCount = 0;
  unansweredCount = 0;
  const totalQ = kahootData.questions.length;
  questionStates = new Array(totalQ).fill('unanswered');
  selectedAnswers = new Array(totalQ).fill(null);
  answerOrders = new Array(totalQ).fill(null);
  updateCountersDisplay();

  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('quizScreen').classList.remove('hidden');
  document.getElementById('total').textContent = kahootData.questions.length;
  const qb = document.getElementById('quitBtn');
  if (qb) qb.classList.remove('hidden');
  const sb = document.getElementById('skipBtn');
  if (sb) sb.classList.remove('hidden');
  const pb = document.getElementById('prevBtn');
  if (pb) pb.classList.remove('hidden');
  showQuestion();
}

function showQuestion() {
  if (!kahootData || !kahootData.questions) return;
  locked = false;
  const q = kahootData.questions[currentQuestion];

  const banner = document.getElementById('questionBanner');
  const bannerQuestion = document.getElementById('bannerQuestion');
  if (banner && bannerQuestion) {
    bannerQuestion.textContent = q.question;
    banner.classList.remove('hidden');
  }

  document.getElementById('current').textContent = currentQuestion + 1;

  const answersDiv = document.getElementById('answers');
  // determine order for this question (displayedIndex -> originalIndex)
  let order = null;
  const n = q.answers.length;
  if (shuffleAnswers) {
    if (!answerOrders[currentQuestion] || answerOrders[currentQuestion].length !== n) {
      const arr = Array.from({length: n}, (_, i) => i);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      answerOrders[currentQuestion] = arr;
    }
    order = answerOrders[currentQuestion];
  } else {
    answerOrders[currentQuestion] = null;
  }

  answersDiv.innerHTML = '';
  for (let d = 0; d < n; d++) {
    const orig = order ? order[d] : d;
    const html = `<div class="answer" onclick="selectAnswer(this, ${d})">${q.answers[orig]}</div>`;
    answersDiv.insertAdjacentHTML('beforeend', html);
  }

  const prevState = questionStates[currentQuestion];
  const prevSelected = selectedAnswers[currentQuestion]; // stored as originalIndex
  const answerEls = answersDiv.querySelectorAll('.answer');

  const displayedCorrect = order ? order.indexOf(q.correct) : q.correct;
  if ((prevState === 'correct' || prevState === 'wrong') && answerEls[displayedCorrect]) {
    answerEls[displayedCorrect].classList.add('correct');
  }

  if (prevState === 'correct' && typeof prevSelected === 'number') {
    const dispPrev = order ? order.indexOf(prevSelected) : prevSelected;
    answerEls[dispPrev]?.classList.add('correct-anim');
  }
  if (prevState === 'wrong' && typeof prevSelected === 'number') {
    const dispPrev = order ? order.indexOf(prevSelected) : prevSelected;
    answerEls[dispPrev]?.classList.add('wrong', 'wrong-anim');
  }

  const sb = document.getElementById('skipBtn');
  if (sb) {
    if (currentQuestion >= kahootData.questions.length - 1) sb.classList.add('hidden');
    else sb.classList.remove('hidden');
  }
  const pb = document.getElementById('prevBtn');
  if (pb) {
    if (currentQuestion === 0) pb.classList.add('hidden'); else pb.classList.remove('hidden');
  }
}

function selectAnswer(element, index) {
  if (locked) return;
  locked = true;
  const q = kahootData.questions[currentQuestion];
  const answers = document.querySelectorAll('.answer');
  const order = answerOrders[currentQuestion] || null; // displayed -> original

  const prevState = questionStates[currentQuestion];
  const prevSelected = selectedAnswers[currentQuestion];

  answers.forEach(a => { a.classList.remove('correct', 'wrong', 'correct-anim', 'wrong-anim'); });

  if (prevState === 'correct') { correctCount = Math.max(0, correctCount - 1); score = Math.max(0, score - 1); }
  if (prevState === 'wrong') { wrongCount = Math.max(0, wrongCount - 1); }
  if (prevState === 'skipped') { unansweredCount = Math.max(0, unansweredCount - 1); }

  const displayedCorrect = order ? order.indexOf(q.correct) : q.correct;
  if (answers[displayedCorrect]) answers[displayedCorrect].classList.add('correct');

  const origIndex = order ? order[index] : index;
  if (origIndex === q.correct) {
    score++;
    correctCount++;
    questionStates[currentQuestion] = 'correct';
    selectedAnswers[currentQuestion] = origIndex;
    if (answers[index]) answers[index].classList.add('correct-anim');
  } else {
    wrongCount++;
    questionStates[currentQuestion] = 'wrong';
    selectedAnswers[currentQuestion] = origIndex;
    if (answers[index]) { answers[index].classList.add('wrong-anim'); answers[index].classList.add('wrong'); }
  }

  updateCountersDisplay();

  setTimeout(() => {
    currentQuestion++;
    if (currentQuestion < kahootData.questions.length) showQuestion();
    else endGame();
  }, 900);
}

function skipQuestion() {
  if (locked) return;
  const prevState = questionStates[currentQuestion];
  if (prevState === 'correct') { correctCount = Math.max(0, correctCount - 1); score = Math.max(0, score - 1); }
  if (prevState === 'wrong') { wrongCount = Math.max(0, wrongCount - 1); }
  if (prevState !== 'skipped') {
    unansweredCount++;
    questionStates[currentQuestion] = 'skipped';
    selectedAnswers[currentQuestion] = null;
  }
  updateCountersDisplay();
  currentQuestion++;
  if (currentQuestion < kahootData.questions.length) showQuestion();
  else endGame();
}

function prevQuestion() {
  if (currentQuestion <= 0) return;
  currentQuestion--;
  showQuestion();
}

function endGame() {
  const total = kahootData.questions.length;
  const computedUnanswered = Math.max(0, total - (correctCount + wrongCount + unansweredCount));
  const finalUnanswered = unansweredCount + computedUnanswered;

  document.getElementById('quizScreen').classList.add('hidden');
  document.getElementById('endScreen').classList.remove('hidden');
  document.getElementById('score').textContent = `${score} / ${kahootData.questions.length}`;
  const correctEl = document.getElementById('correctFinal');
  const wrongEl = document.getElementById('wrongFinal');
  const unansEl = document.getElementById('unansweredFinal');
  if (correctEl) correctEl.textContent = correctCount;
  if (wrongEl) wrongEl.textContent = wrongCount;
  if (unansEl) unansEl.textContent = finalUnanswered;
  const qb = document.getElementById('quitBtn');
  if (qb) qb.classList.add('hidden');
  const sb = document.getElementById('skipBtn');
  if (sb) sb.classList.add('hidden');
  const banner = document.getElementById('questionBanner');
  if (banner) banner.classList.add('hidden');
}

function restart() {
  currentQuestion = 0;
  score = 0;
  document.getElementById('endScreen').classList.add('hidden');
  document.getElementById('startScreen').classList.remove('hidden');
  const qb = document.getElementById('quitBtn');
  if (qb) qb.classList.add('hidden');
  const sb = document.getElementById('skipBtn');
  if (sb) sb.classList.add('hidden');
  const banner = document.getElementById('questionBanner');
  if (banner) banner.classList.add('hidden');
}
function quitQuiz() {
  if (!confirm('¿Quieres abandonar el juego?')) return;
  endGame();
}

function endAttempt() {
  if (!confirm('¿Quieres terminar el intento y ver los resultados?')) return;
  endGame();
}

function toggleShuffle() {
  shuffleAnswers = !shuffleAnswers;
  const btn = document.getElementById('shuffleBtn');
  if (btn) {
    btn.textContent = 'Barajar Preguntas: ' + (shuffleAnswers ? 'ON' : 'OFF');
    btn.setAttribute('aria-pressed', String(shuffleAnswers));
  }
  answerOrders = new Array(answerOrders.length).fill(null);
  showQuestion();
}

function updateCountersDisplay() {
  const c = document.getElementById('correctCount');
  const w = document.getElementById('wrongCount');
  const u = document.getElementById('unansweredCount');
  if (c) c.textContent = correctCount;
  if (w) w.textContent = wrongCount;
  if (u) u.textContent = unansweredCount;
}
