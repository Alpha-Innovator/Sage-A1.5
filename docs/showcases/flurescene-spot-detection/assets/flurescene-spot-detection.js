/* Recorded evidence only: no model inference or scientific re-evaluation. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const data = window.FLURESCENE_SPOT_DETECTION_DATA;
  if (!data?.events?.length || !data.sample || !data.metrics) {
    $('#load-error').hidden = false;
    $('#load-error').textContent = 'The recorded data could not be loaded. Reload this page or download the original F1 scores below.';
    for (const control of document.querySelectorAll('.transport button, .transport input, .transport select, [data-layer]')) control.disabled = true;
    return;
  }
  const names = {
    synthetic_simple: 'Synthetic simple', synthetic_complex: 'Synthetic complex',
    dna_fish: 'DNA-FISH', hybiss: 'HybISS', merfish: 'MERFISH', smfish: 'smFISH',
    telomeres: 'Telomeres', terra: 'TERRA', synthetic_3d: 'Synthetic 3D'
  };
  const descriptions = [
    'Train a U-Net detector and retain a tuned Laplacian-of-Gaussian fallback for per-instance method selection.',
    'Add test-time augmentation to U-Net inference, regenerate spot coordinates and submit the revised predictions.',
    'Retune peak thresholds and select test-time augmentation separately for each instance.',
    'Force DNA-FISH to use U-Net instead of the LoG fallback, then evaluate the regenerated predictions.',
    'Retrain weak instances with more steps, regenerate predictions and compare the new evaluation.',
    'Share normalization and background subtraction between training and inference before the next evaluation.',
    'Train weak instances with spot-weighted loss, retaining earlier models where validation does not improve.',
    'Retune test-time augmentation and peak thresholds for the updated models, then submit the final predictions.'
  ];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const events = data.events;
  const instances = Object.keys(events[0].raw_scores);
  let selected = reducedMotion.matches ? events.length - 1 : 0;
  let dataset = 'dna_fish';
  let playing = false;
  let timer = null;
  const format = value => value.toFixed(4);
  const signed = value => `${value >= 0 ? '+' : ''}${format(value)}`;
  const number = value => String(value).padStart(2, '0');
  const svgNS = 'http://www.w3.org/2000/svg';
  function element(tag, attributes = {}, text) {
    const node = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const datasetButtons = instances.map(key => {
    const button = document.createElement('button');
    button.textContent = names[key];
    button.dataset.instance = key;
    button.addEventListener('click', () => { dataset = key; render(); });
    $('#dataset-controls').append(button);
    return button;
  });
  const steps = events.map((event, index) => {
    const button = document.createElement('button');
    button.className = 'agent-step';
    button.setAttribute('aria-label', `Submission ${event.record}: ${event.headline}`);
    const dot = document.createElement('span');
    dot.className = 'step-dot';
    dot.textContent = number(event.record);
    const copy = document.createElement('span');
    copy.className = 'step-copy';
    const title = document.createElement('strong');
    title.textContent = event.headline;
    const time = document.createElement('small');
    time.textContent = `${event.elapsed_hours.toFixed(2)} h into the run`;
    copy.append(title, time);
    button.append(dot, copy);
    button.addEventListener('click', () => { pause(); selected = index; render(); });
    $('#agent-steps').append(button);
    return button;
  });

  function drawChart() {
    const chart = $('#trajectory');
    const restoreFocus = chart.contains(document.activeElement) ? document.activeElement.dataset.record : null;
    const width = Math.max(260, $('#score-chart').clientWidth);
    const height = Math.max(340, $('#score-chart').clientHeight);
    const left = 48, right = width - 25, top = 48, bottom = height - 52;
    const scores = events.map(event => event.raw_scores[dataset].F1);
    const low = Math.max(0, Math.floor((Math.min(...scores) - .04) * 20) / 20);
    const high = Math.min(1, Math.ceil((Math.max(...scores) + .04) * 20) / 20);
    const x = index => left + index * (right - left) / (events.length - 1);
    const y = value => bottom - (value - low) * (bottom - top) / (high - low);
    chart.replaceChildren();
    chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
    chart.setAttribute('aria-label', `${names[dataset]} original F1 scores across eight submissions`);
    for (let i = 0; i <= 4; i++) {
      const value = low + i * (high - low) / 4;
      chart.append(element('line', {x1: left, y1: y(value), x2: right, y2: y(value), class: 'chart-grid'}));
      chart.append(element('text', {x: left - 10, y: y(value) + 4, 'text-anchor': 'end', class: 'chart-axis'}, value.toFixed(2)));
    }
    const points = scores.map((score, index) => `${x(index)},${y(score)}`).join(' ');
    chart.append(element('polygon', {points: `${left},${bottom} ${points} ${right},${bottom}`, class: 'chart-area'}));
    chart.append(element('polyline', {points, class: 'chart-line'}));
    chart.append(element('line', {x1: x(selected), y1: top - 15, x2: x(selected), y2: bottom, class: 'chart-selection'}));
    scores.forEach((score, index) => {
      chart.append(element('text', {x: x(index), y: bottom + 23, 'text-anchor': 'middle', class: 'chart-axis'}, String(index + 1)));
      const point = element('g', {class: 'chart-point', role: 'button', tabindex: '0', 'data-record': index, 'aria-pressed': String(index === selected), 'aria-label': `Submission ${index + 1}, ${names[dataset]} F1 ${format(score)}`});
      point.append(element('title', {}, `Submission ${index + 1} · F1 ${format(score)}`));
      point.append(element('circle', {cx: x(index), cy: y(score), r: 16, fill: 'transparent', class: 'point-focus'}));
      point.append(element('circle', {cx: x(index), cy: y(score), r: index === selected ? 6 : 4, class: 'point-dot'}));
      const choose = () => { pause(); selected = index; render(); };
      point.addEventListener('click', choose);
      point.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault(); pause();
          selected = Math.max(0, Math.min(events.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
          render();
          chart.querySelector(`[data-record="${selected}"]`)?.focus();
        }
      });
      chart.append(point);
    });
    chart.append(element('text', {x: Math.max(left + 22, Math.min(right - 22, x(selected))), y: y(scores[selected]) - 22, 'text-anchor': 'middle', class: 'chart-value'}, format(scores[selected])));
    chart.append(element('text', {x: (left + right) / 2, y: height - 8, 'text-anchor': 'middle', class: 'chart-axis'}, 'Evaluation submission'));
    if (restoreFocus !== null) chart.querySelector(`[data-record="${restoreFocus}"]`)?.focus({preventScroll: true});
  }

  function render() {
    const event = events[selected];
    const score = event.raw_scores[dataset].F1;
    $('#chart-dataset').textContent = names[dataset];
    $('#selected-submission').textContent = `${number(event.record)} / ${number(events.length)}`;
    $('#selected-f1').textContent = format(score);
    $('#selected-delta').textContent = signed(score - events[0].raw_scores[dataset].F1);
    $('#chapter-index').textContent = `${number(event.record)} / ${number(events.length)}`;
    $('#chapter-title').textContent = event.headline;
    $('#chapter-text').textContent = descriptions[selected];
    $('#seek').value = selected;
    $('#clock').textContent = `${number(event.record)} / ${number(events.length)}`;
    $('#next-submission').disabled = selected === events.length - 1;
    steps.forEach((button, index) => {
      button.classList.toggle('active', selected === index);
      button.classList.toggle('done', selected > index);
      button.setAttribute('aria-pressed', String(selected === index));
    });
    datasetButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.instance === dataset)));
    drawChart();
  }
  function pause() {
    playing = false;
    clearTimeout(timer);
    $('#play').innerHTML = '▶ <span>Play optimization</span>';
    $('#play').setAttribute('aria-label', 'Play optimization');
  }
  function schedule() {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(() => {
      if (selected < events.length - 1) { selected++; render(); }
      if (selected === events.length - 1) pause();
      else schedule();
    }, 2200 / Number($('#playback-speed').value));
  }
  function play() {
    if (selected === events.length - 1) selected = 0;
    playing = true;
    $('#play').innerHTML = 'Ⅱ <span>Pause optimization</span>';
    $('#play').setAttribute('aria-label', 'Pause optimization');
    render(); schedule();
  }
  $('#play').addEventListener('click', () => playing ? pause() : play());
  $('#hero-play').addEventListener('click', () => { if (!reducedMotion.matches) play(); });
  $('#restart').addEventListener('click', () => { pause(); selected = 0; render(); });
  $('#seek').addEventListener('input', event => { pause(); selected = Number(event.target.value); render(); });
  $('#next-submission').addEventListener('click', () => { pause(); selected = Math.min(events.length - 1, selected + 1); render(); });
  $('#playback-speed').addEventListener('change', schedule);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) pause(); });
  window.addEventListener('pagehide', pause);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); }, {threshold: 0}).observe($('#stage'));
  }
  if ('ResizeObserver' in window) new ResizeObserver(drawChart).observe($('#score-chart'));
  else window.addEventListener('resize', drawChart);
  if (document.fullscreenEnabled) {
    const button = $('#fullscreen');
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await $('#stage').requestFullscreen();
      } catch { /* The walkthrough remains available in its normal layout. */ }
    });
    document.addEventListener('fullscreenchange', () => {
      const label = document.fullscreenElement ? 'Exit full screen' : 'Enter full screen';
      button.setAttribute('aria-label', label); button.title = label;
    });
  }

  const head = document.createElement('tr');
  ['Dataset', ...events.map(event => `#${event.record}`)].forEach(label => {
    const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = label; head.append(cell);
  });
  $('#score-table thead').append(head);
  instances.forEach(key => {
    const row = document.createElement('tr');
    const label = document.createElement('th'); label.scope = 'row'; label.textContent = names[key]; row.append(label);
    events.forEach(event => { const cell = document.createElement('td'); cell.textContent = format(event.raw_scores[key].F1); row.append(cell); });
    $('#score-table tbody').append(row);
  });

  const layers = {};
  function group(name, parent, className) {
    const node = element('g', {class: className});
    layers[name] = node; $(parent).append(node); return node;
  }
  const reference = group('reference', '#reference-field', 'spot-reference');
  const matched = group('matched', '#prediction-field', 'spot-matched');
  const extra = group('extra', '#prediction-field', 'spot-extra');
  const missed = group('missed', '#prediction-field', 'spot-missed');
  const matchedTruth = new Set(data.metrics.matched_truth);
  const matchedPrediction = new Set(data.metrics.matched_prediction);
  data.sample.truth.forEach(([x, y], index) => {
    reference.append(element('circle', {cx: x, cy: y, r: 11}));
    if (!matchedTruth.has(index)) missed.append(element('path', {d: `M${x - 12} ${y}h24 M${x} ${y - 12}v24`}));
  });
  data.sample.prediction.forEach(([x, y], index) => {
    if (matchedPrediction.has(index)) matched.append(element('circle', {cx: x, cy: y, r: 11}));
    else extra.append(element('path', {d: `M${x - 10} ${y - 10}l20 20 M${x - 10} ${y + 10}l20 -20`}));
  });
  document.querySelectorAll('[data-layer]').forEach(button => {
    button.addEventListener('click', () => {
      const shown = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(shown));
      layers[button.dataset.layer].setAttribute('display', shown ? 'inline' : 'none');
    });
  });
  render();
})();
