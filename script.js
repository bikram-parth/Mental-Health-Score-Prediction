const API_URL = 'https://mental-health-score-prediction-qor6.onrender.com/predict';

const form = document.getElementById('predictForm');
const formPanel = document.getElementById('formPanel');
const loadingPanel = document.getElementById('loadingPanel');
const resultPanel = document.getElementById('resultPanel');
const submitBtn = document.getElementById('submitBtn');
const formError = document.getElementById('formError');
const retryBtn = document.getElementById('retryBtn');

const loadingMessages = [
  'Reading the signals…',
  'Weighing screen time against sleep…',
  'Almost there…'
];

function numberFields() {
  return ['Age', 'Avg_Daily_Usage_Hours', 'Daily_Unlocks', 'Study_Hours', 'Physical_Activity_Hours', 'Sleep_Hours_Per_Night'];
}

function buildPayload(formData) {
  const payload = {};
  const numeric = numberFields();
  for (const [key, value] of formData.entries()) {
    payload[key] = numeric.includes(key) ? Number(value) : value;
  }
  return payload;
}

function showState(state) {
  formPanel.hidden = state !== 'form';
  loadingPanel.hidden = state !== 'loading';
  resultPanel.hidden = state !== 'result';
}

function cycleLoadingText() {
  let i = 0;
  const el = document.getElementById('loadingText');
  return setInterval(() => {
    i = (i + 1) % loadingMessages.length;
    el.textContent = loadingMessages[i];
  }, 1400);
}

function noteForScore(score) {
  if (score >= 75) return 'Things look steady. Keep an eye on the habits that are working for you.';
  if (score >= 50) return 'A mixed picture — a few small changes to routine could help.';
  if (score >= 25) return 'Some strain is showing up. Consider easing up on screen time or catching up on sleep.';
  return 'The signals suggest real strain. It may help to talk to someone you trust.';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';

  if (!form.checkValidity()) {
    formError.textContent = 'Please fill in every field before continuing.';
    form.reportValidity();
    return;
  }

  const payload = buildPayload(new FormData(form));

  submitBtn.disabled = true;
  showState('loading');
  const textInterval = cycleLoadingText();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const rawScore = data.Mental_health_prediction_score ?? data.mental_health_prediction_score ?? data;
    const score = Math.max(0, Math.min(100, Math.round(Number(rawScore))));

    document.getElementById('resultScore').textContent = score;
    document.getElementById('resultNote').textContent = noteForScore(score);
    const fill = document.getElementById('resultMeterFill');
    fill.style.width = '0%';

    showState('result');
    requestAnimationFrame(() => { fill.style.width = `${score}%`; });

  } catch (err) {
    showState('form');
    formError.textContent = 'Something went wrong reaching the prediction service. Check that the API is running and try again.';
    console.error(err);
  } finally {
    clearInterval(textInterval);
    submitBtn.disabled = false;
  }
});

retryBtn.addEventListener('click', () => {
  showState('form');
});
