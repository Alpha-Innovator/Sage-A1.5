/* Discovery page interactions. Scientific values are read from the supplied data. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const data = window.FLURESCENE_SPOT_DETECTION_DATA;
  if (!data?.events?.length || !window.DetectionFilm) {
    $('#load-error').hidden = false;
    $('#load-error').textContent = 'The research display could not be loaded. Reload the page, or download the evaluation scores below.';
    $$('[data-play-film], [data-preview-play], [data-preview-toggle], [data-preview-seek], [data-restart-film]').forEach(control => { control.disabled = true; });
    return;
  }
  const names = {synthetic_simple: 'Synthetic simple', synthetic_complex: 'Synthetic complex', dna_fish: 'DNA-FISH', hybiss: 'HybISS', merfish: 'MERFISH', smfish: 'smFISH', telomeres: 'Telomeres', terra: 'TERRA', synthetic_3d: 'Synthetic 3D'};
  const descriptions = [
    'Combine a trained U-Net detector with a tuned Laplacian-of-Gaussian fallback, selecting the method for each instance.',
    'Add test-time augmentation to U-Net inference, regenerate spot coordinates and evaluate the revised predictions.',
    'Retune peak thresholds and choose test-time augmentation separately for each instance.',
    'Switch DNA-FISH from the LoG fallback to U-Net, then evaluate the regenerated predictions.',
    'Retrain weak instances with more steps and compare the resulting predictions with the earlier evaluation.',
    'Align normalization and background subtraction between training and inference before evaluating again.',
    'Train weak instances with spot-weighted loss, retaining earlier models where validation does not improve.',
    'Retune test-time augmentation and peak thresholds for the updated models, then submit the final predictions.'
  ];
  const events = data.events, instances = Object.keys(events[0].raw_scores);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0, dataset = 'dna_fish', activeTab = 'scores';
  const fmt = value => value.toFixed(4);
  const signed = value => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(4)}`;
  const number = value => String(value).padStart(2, '0');
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const svgNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attributes = {}, text) {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function goTo(target) {
    const header = $('.a15-site-header').getBoundingClientRect().height;
    window.scrollTo({top: Math.max(0, scrollY + target.getBoundingClientRect().top - header - 18), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  }

  // Match the reference page's evidence tabs and its keyboard behavior.
  const tabPanels = {datasets: '#evidence-datasets', scores: '#evidence-scores', comparison: '#comparison', gallery: '#evidence-gallery'};
  function openTab(name, move = false) {
    activeTab = name;
    $$('[data-evidence]').forEach(button => {
      const active = button.dataset.evidence === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    Object.entries(tabPanels).forEach(([key, selector]) => { $(selector).hidden = key !== name; });
    if (name === 'scores') requestAnimationFrame(drawChart);
    if (move) goTo($('.evidence-deck'));
  }
  const tabs = $$('[data-evidence]');
  tabs.forEach((button, index) => {
    button.addEventListener('click', () => openTab(button.dataset.evidence));
    button.addEventListener('keydown', event => {
      const direction = {ArrowRight: 1, ArrowLeft: -1}[event.key];
      if (!direction && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + direction + tabs.length) % tabs.length;
      openTab(tabs[next].dataset.evidence); tabs[next].focus();
    });
  });
  $$('[data-open-gallery]').forEach(button => button.addEventListener('click', () => openTab('gallery', true)));
  $$('[data-open-comparison]').forEach(button => button.addEventListener('click', () => openTab('comparison', true)));
  $$('[data-open-scores]').forEach(button => button.addEventListener('click', () => openTab('scores', true)));
  const sourceDialog = $('#details');
  $$('[data-source]').forEach(button => button.addEventListener('click', () => { pauseFilm(); sourceDialog.showModal(); }));
  $('[data-close-source]').addEventListener('click', () => sourceDialog.close());
  sourceDialog.addEventListener('click', event => {
    if (event.target !== sourceDialog) return;
    const rect = sourceDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) sourceDialog.close();
  });
  function resolveHash() {
    if (location.hash === '#comparison') openTab('comparison', true);
    else if (location.hash === '#scores') { openTab('scores', true); $('#scores').open = true; }
    else if (location.hash === '#details') sourceDialog.showModal();
    else if (location.hash === '#evidence-gallery') openTab('gallery', true);
  }
  window.addEventListener('hashchange', resolveHash);

  // One selected dataset is shared by the research record, animation and chart.
  const datasetButtons = instances.map(key => {
    const option = el('option', names[key]); option.value = key; $('#workspace-dataset').append(option);
    const button = el('button', names[key]); button.dataset.instance = key;
    button.addEventListener('click', () => { dataset = key; renderSelection(); paintFilm(); });
    $('#dataset-controls').append(button); return button;
  });
  $('#workspace-dataset').addEventListener('change', event => { dataset = event.target.value; renderSelection(); paintFilm(); });
  const recordButtons = events.map((event, index) => {
    const button = el('button', undefined, 'workspace-file record-button');
    button.setAttribute('aria-label', `Submission ${event.record}: ${event.headline}`);
    const info = el('span', undefined, 'file-info');
    info.append(el('strong', event.headline, 'file-name'), el('span', `${event.elapsed_hours.toFixed(2)} hours into the run`, 'file-summary'));
    const arrow = el('i', '↗'); arrow.setAttribute('aria-hidden', 'true');
    button.append(el('span', number(event.record), 'file-type'), info, arrow);
    button.addEventListener('click', () => { pauseFilm(); selected = index; elapsed = 4 + index * 3; renderSelection(); paintFilm(); });
    $('#workspace-records').append(button); return button;
  });
  const noRecords = el('p', 'No recorded changes match your search.', 'record-empty'); noRecords.hidden = true; $('#workspace-records').append(noRecords);
  $('#record-search').addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase(); let count = 0;
    recordButtons.forEach((button, index) => { button.hidden = !`${events[index].record} ${events[index].headline} ${descriptions[index]}`.toLowerCase().includes(query); if (!button.hidden) count++; });
    noRecords.hidden = count > 0;
  });

  function drawChart() {
    if (activeTab !== 'scores') return;
    const chart = $('#trajectory'), focus = chart.contains(document.activeElement) ? document.activeElement.dataset.record : null;
    const width = Math.max(250, $('#score-chart').clientWidth), height = 335;
    const left = 43, right = width - 25, top = 40, bottom = height - 48;
    const scores = events.map(event => event.raw_scores[dataset].F1);
    const low = Math.max(0, Math.floor((Math.min(...scores) - .04) * 20) / 20), high = Math.min(1, Math.ceil((Math.max(...scores) + .04) * 20) / 20);
    const x = i => left + i * (right - left) / (events.length - 1), y = value => bottom - (value - low) * (bottom - top) / (high - low);
    chart.replaceChildren(); chart.setAttribute('viewBox', `0 0 ${width} ${height}`); chart.setAttribute('aria-label', `${names[dataset]} original F1 scores across eight submissions`);
    for (let i = 0; i <= 4; i++) {
      const value = low + i * (high - low) / 4;
      chart.append(svg('line', {x1: left, x2: right, y1: y(value), y2: y(value), class: 'chart-grid'}), svg('text', {x: left - 8, y: y(value) + 4, 'text-anchor': 'end', class: 'chart-axis'}, value.toFixed(2)));
    }
    const points = scores.map((score, i) => `${x(i)},${y(score)}`).join(' ');
    chart.append(svg('polygon', {points: `${left},${bottom} ${points} ${right},${bottom}`, class: 'chart-area'}), svg('polyline', {points, class: 'chart-line'}));
    chart.append(svg('line', {x1: x(selected), x2: x(selected), y1: top - 12, y2: bottom, class: 'chart-selection'}));
    scores.forEach((score, index) => {
      chart.append(svg('text', {x: x(index), y: bottom + 22, 'text-anchor': 'middle', class: 'chart-axis'}, String(index + 1)));
      const point = svg('g', {class: 'chart-point', role: 'button', tabindex: 0, 'data-record': index, 'aria-pressed': String(index === selected), 'aria-label': `Submission ${index + 1}, ${names[dataset]} F1 ${fmt(score)}`});
      point.append(svg('title', {}, `Submission ${index + 1} · F1 ${fmt(score)}`), svg('circle', {cx: x(index), cy: y(score), r: 15, fill: 'transparent', class: 'point-focus'}), svg('circle', {cx: x(index), cy: y(score), r: selected === index ? 6 : 4, class: 'point-dot'}));
      point.addEventListener('click', () => { pauseFilm(); selected = index; renderSelection(); });
      point.addEventListener('keydown', event => {
        if (['Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault(); pauseFilm();
          selected = Math.max(0, Math.min(7, index + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0)));
          renderSelection(); chart.querySelector(`[data-record="${selected}"]`)?.focus({preventScroll: true});
        }
      });
      chart.append(point);
    });
    chart.append(svg('text', {x: Math.max(left + 22, Math.min(right - 22, x(selected))), y: y(scores[selected]) - 22, 'text-anchor': 'middle', class: 'chart-value'}, fmt(scores[selected])));
    chart.append(svg('text', {x: (left + right) / 2, y: height - 5, 'text-anchor': 'middle', class: 'chart-axis'}, 'Evaluation submission'));
    if (focus !== null) chart.querySelector(`[data-record="${focus}"]`)?.focus({preventScroll: true});
  }
  function renderSelection() {
    const event = events[selected], score = event.raw_scores[dataset].F1;
    $('#chart-dataset').textContent = names[dataset];
    $('#selected-submission').textContent = `SUBMISSION ${number(selected + 1)} / 08`;
    $('#selected-headline').textContent = event.headline;
    $('#selected-description').textContent = descriptions[selected];
    $('#selected-f1').textContent = fmt(score); $('#selected-delta').textContent = signed(score - events[0].raw_scores[dataset].F1);
    $('#record-selection-title').textContent = `Submission ${number(selected + 1)} · ${event.headline}`;
    $('#record-selection-score').textContent = `${names[dataset]} · F1 ${fmt(score)}`;
    $('#workspace-dataset').value = dataset;
    datasetButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.instance === dataset)));
    recordButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === selected)));
    $('#previous-submission').disabled = selected === 0; $('#next-submission').disabled = selected === 7;
    drawChart();
  }
  $('#previous-submission').addEventListener('click', () => { pauseFilm(); selected = Math.max(0, selected - 1); renderSelection(); });
  $('#next-submission').addEventListener('click', () => { pauseFilm(); selected = Math.min(7, selected + 1); renderSelection(); });
  $('#inspect-animation').addEventListener('click', () => { elapsed = 4 + selected * 3; goTo($('#workspace')); playFilm(); });
  if ('ResizeObserver' in window) new ResizeObserver(drawChart).observe($('#score-chart'));
  else window.addEventListener('resize', drawChart);

  const head = el('tr');
  ['Dataset', ...events.map(event => `#${event.record}`)].forEach(label => { const th = el('th', label); th.scope = 'col'; head.append(th); });
  $('#score-table thead').append(head);
  instances.forEach(key => {
    const row = el('tr'), label = el('th', names[key]); label.scope = 'row'; row.append(label);
    events.forEach(event => row.append(el('td', fmt(event.raw_scores[key].F1)))); $('#score-table tbody').append(row);
    const first = events[0].raw_scores[key].F1, last = events[7].raw_scores[key].F1;
    const card = el('button', undefined, 'dataset-result'); card.setAttribute('aria-label', `Inspect ${names[key]}: first F1 ${fmt(first)}, final F1 ${fmt(last)}`);
    card.append(el('h4', names[key]));
    const values = el('div', undefined, 'dataset-values'); values.append(el('span', fmt(first)), el('span', '→'), el('strong', fmt(last))); card.append(values);
    const bars = el('div', undefined, 'dataset-bars'); bars.setAttribute('aria-hidden', 'true');
    [first, last].forEach(value => { const bar = el('i'); bar.style.setProperty('--score', `${value * 100}%`); bars.append(bar); });
    card.append(bars, el('span', `${signed(last - first)} F1 · Inspect submissions ↗`));
    card.addEventListener('click', () => { pauseFilm(); dataset = key; selected = 7; openTab('scores'); renderSelection(); paintFilm(); });
    $('#dataset-results').append(card);
  });

  // Original coordinates and precomputed match indices; no inference in the browser.
  function annotationLayers(parent, sample = data.sample, metrics = data.metrics, include = ['reference', 'matched', 'extra', 'missed']) {
    const groups = Object.fromEntries(include.map(name => [name, svg('g', {class: `spot-${name}`})]));
    const radius = sample.instance === 'dna_fish' ? 11 : Math.min(sample.width, sample.height) / 160;
    const mt = new Set(metrics.matched_truth), mp = new Set(metrics.matched_prediction);
    sample.truth.forEach(([x, y], index) => {
      if (groups.reference) groups.reference.append(svg('circle', {cx: x, cy: y, r: radius}));
      if (groups.missed && !mt.has(index)) {
        const d = radius * 12 / 11;
        groups.missed.append(svg('path', {d: `M${x - d} ${y}h${2 * d} M${x} ${y - d}v${2 * d}`}));
      }
    });
    sample.prediction.forEach(([x, y], index) => {
      if (mp.has(index)) {
        if (groups.matched) groups.matched.append(svg('circle', {cx: x, cy: y, r: radius}));
      } else if (groups.extra) {
        const d = radius * 10 / 11;
        groups.extra.append(svg('path', {d: `M${x - d} ${y - d}l${2 * d} ${2 * d} M${x - d} ${y + d}l${2 * d} ${-2 * d}`}));
      }
    });
    Object.entries(groups).forEach(([name, group]) => {
      group.style.strokeWidth = radius * (name === 'extra' || name === 'missed' ? 4 : 3) / 11;
      parent.append(group);
    });
    return groups;
  }
  const heroLayers = annotationLayers($('#hero-field'));
  function heroView(view) {
    Object.entries(heroLayers).forEach(([name, group]) => { group.style.display = (view === 'reference' ? name === 'reference' : view === 'agreement' ? name !== 'reference' : false) ? '' : 'none'; });
    $$('[data-hero-view]').forEach(button => { const active = button.dataset.heroView === view; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    const label = {raw: 'Original image', reference: 'Reference annotations', agreement: 'Prediction agreement'}[view];
    $('#hero-layer-label').textContent = label; $('#hero-field').setAttribute('aria-label', `Full DNA-FISH image: ${label.toLowerCase()}`);
  }
  $$('[data-hero-view]').forEach(button => button.addEventListener('click', () => heroView(button.dataset.heroView)));
  // The comparison gallery is independent of the optimization dataset selector.
  const gallery = window.FLURESCENE_SPOT_GALLERY;
  const comparisonSamples = new Map([
    ['dna_fish', {id: 'dna_fish', name: 'DNA-FISH', sample: data.sample, metrics: data.metrics,
      image: 'assets/dna-fish.png', figure: 'assets/flurescene-spot-detection-comparison.svg',
      download: 'assets/flurescene-spot-detection-data.json'}],
    ...(gallery?.samples || []).map(entry => [entry.id, {...entry, download: 'assets/spot-gallery-data.json'}])
  ]);
  let comparisonLayers = {}, comparisonRequest = 0;
  function renderComparison(entry) {
    const {sample, metrics, name} = entry;
    const reference = $('#reference-field'), prediction = $('#prediction-field');
    [reference, prediction].forEach(field => {
      field.replaceChildren(svg('image', {href: entry.image, width: sample.width, height: sample.height}));
      field.setAttribute('viewBox', `0 0 ${sample.width} ${sample.height}`);
    });
    comparisonLayers = {
      ...annotationLayers(reference, sample, metrics, ['reference']),
      ...annotationLayers(prediction, sample, metrics, ['matched', 'extra', 'missed'])
    };
    reference.setAttribute('aria-label', `Full ${name} field, ${sample.sample}, with ${sample.truth.length} reference spots`);
    prediction.setAttribute('aria-label', `Full ${name} field, ${sample.sample}: ${metrics.tp} matched predictions, ${metrics.fp} unmatched predictions and ${metrics.fn} missed reference spots`);
    $('#comparison-reference-count').textContent = `${sample.truth.length} annotated spots`;
    $('#comparison-prediction-count').textContent = `${sample.prediction.length} predicted spots`;
    const counts = {reference: sample.truth.length, matched: metrics.tp, extra: metrics.fp, missed: metrics.fn};
    const labels = {reference: 'Reference', matched: 'Matched', extra: 'Unmatched', missed: 'Missed'};
    $$('[data-layer]').forEach(button => {
      const layer = button.dataset.layer;
      $('span', button).textContent = `${labels[layer]} · ${counts[layer]}`;
      comparisonLayers[layer].style.display = button.getAttribute('aria-pressed') === 'true' ? '' : 'none';
    });
    ['f1', 'precision', 'recall'].forEach(key => { $(`#comparison-${key}`).textContent = fmt(metrics[key]); });
    $('#comparison-boundary').textContent = `Hungarian one-to-one matching with a 3-pixel cutoff. Both panels show the full ${sample.width} × ${sample.height} image with identical contrast (image minimum to the 99.8th percentile). These metrics describe this image only.`;
    $('#comparison-figure-link').href = entry.figure;
    $('#comparison-image-link').href = entry.image;
    $('#comparison-data-link').href = entry.download;
    $$('[data-comparison]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.comparison === entry.id)));
    $('#comparison-status').textContent = `${name} · ${sample.sample} · First test image`;
    $('#comparison-status').dataset.state = 'ready';
  }
  const loadedImages = new Map();
  function loadComparisonImage(path) {
    if (!loadedImages.has(path)) {
      const request = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve; image.onerror = () => reject(new Error('Image unavailable'));
        image.src = path;
      });
      loadedImages.set(path, request);
      request.catch(() => loadedImages.delete(path));
    }
    return loadedImages.get(path);
  }
  $$('[data-comparison]').forEach(button => {
    const entry = comparisonSamples.get(button.dataset.comparison);
    button.disabled = !entry;
    button.addEventListener('click', async () => {
      if (!entry) return;
      const request = ++comparisonRequest;
      $('#comparison-images').setAttribute('aria-busy', 'true');
      $('#comparison-status').textContent = `Loading ${entry.name}…`;
      $('#comparison-status').dataset.state = 'loading';
      try {
        await loadComparisonImage(entry.image);
        if (request === comparisonRequest) renderComparison(entry);
      } catch {
        if (request === comparisonRequest) {
          $('#comparison-status').textContent = `${entry.name} could not be loaded. Select it again to retry; the previous field is still shown.`;
          $('#comparison-status').dataset.state = 'error';
        }
      } finally {
        if (request === comparisonRequest) $('#comparison-images').setAttribute('aria-busy', 'false');
      }
    });
  });
  $$('[data-layer]').forEach(button => button.addEventListener('click', () => {
    const shown = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', String(shown));
    comparisonLayers[button.dataset.layer].style.display = shown ? '' : 'none';
  }));
  renderComparison(comparisonSamples.get('dna_fish'));
  if (!gallery?.samples?.length) {
    $('#comparison-status').textContent = 'DNA-FISH is shown. Reload the page to load the additional comparisons.';
    $('#comparison-status').dataset.state = 'error';
  }

  // A real, timed multi-scene reconstruction, separate from the static evidence chart.
  const film = new window.DetectionFilm($('#workflow-preview'), data, names);
  const duration = 32;
  let elapsed = 0, playing = false, visible = true, frame = 0, lastTime = 0, lastPaint = 0;
  const clock = time => `00:${number(Math.floor(time))}`;
  function paintFilm() {
    film.render(elapsed, dataset);
    $('[data-preview-seek]').value = elapsed; $('[data-preview-time]').textContent = `${clock(elapsed)} / ${clock(duration)}`;
    const caption = elapsed < 4 ? 'Find fluorescence spots across nine datasets, then use evaluation feedback to refine the detector.' : elapsed >= 28 ? 'The final evaluation improves F1 in all nine datasets. Aggregate improvement rises from -0.0469 to 0.1158.' : `Submission ${Math.min(8, Math.floor((elapsed - 4) / 3) + 1)}. ${descriptions[Math.min(7, Math.floor((elapsed - 4) / 3))]}`;
    if ($('#workflow-caption').textContent !== caption) $('#workflow-caption').textContent = caption;
  }
  function syncFilm() {
    $('#process-player').classList.toggle('paused', !playing);
    $('[data-preview-toggle]').textContent = playing ? 'Ⅱ' : '▶';
    $('[data-preview-toggle]').setAttribute('aria-label', playing ? 'Pause the process animation' : 'Play the process animation');
  }
  function tick(now) {
    frame = 0;
    if (!playing || !visible || document.hidden) { lastTime = 0; return; }
    if (lastTime) elapsed = Math.min(duration, elapsed + Math.min(.1, (now - lastTime) / 1000));
    lastTime = now;
    const record = elapsed < 4 ? 0 : Math.min(7, Math.floor((elapsed - 4) / 3));
    if (record !== selected) { selected = record; renderSelection(); }
    if (now - lastPaint >= 1000 / 30 || elapsed === duration) { paintFilm(); lastPaint = now; }
    if (elapsed >= duration) { playing = false; syncFilm(); }
    else frame = requestAnimationFrame(tick);
  }
  function resumeFrame() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; if (playing && visible && !document.hidden) frame = requestAnimationFrame(tick); }
  function pauseFilm() { playing = false; syncFilm(); resumeFrame(); }
  function playFilm(restart = false) {
    if (restart || elapsed >= duration) elapsed = 0;
    selected = elapsed < 4 ? 0 : Math.min(7, Math.floor((elapsed - 4) / 3));
    playing = true; renderSelection(); paintFilm(); syncFilm(); resumeFrame();
  }
  $$('[data-play-film]').forEach(button => button.addEventListener('click', () => { goTo($('#workspace')); playFilm(true); }));
  $('[data-preview-play]').addEventListener('click', () => playFilm());
  $('[data-preview-toggle]').addEventListener('click', () => playing ? pauseFilm() : playFilm());
  $('[data-restart-film]').addEventListener('click', () => playFilm(true));
  $('[data-preview-seek]').addEventListener('input', event => {
    pauseFilm(); elapsed = Math.max(0, Math.min(duration, Number(event.target.value)));
    selected = elapsed < 4 ? 0 : Math.min(7, Math.floor((elapsed - 4) / 3)); renderSelection(); paintFilm();
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resumeFrame(); }, {threshold: .15}).observe($('#workflow-preview'));
  if ('ResizeObserver' in window) new ResizeObserver(paintFilm).observe($('#workflow-preview'));
  else window.addEventListener('resize', paintFilm);
  document.addEventListener('visibilitychange', resumeFrame);
  window.addEventListener('pagehide', pauseFilm);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) pauseFilm(); });
  if (document.fullscreenEnabled) {
    const button = $('[data-film-fullscreen]'); button.hidden = false;
    button.addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('#process-player').requestFullscreen(); } catch { /* Inline playback remains usable. */ } });
    document.addEventListener('fullscreenchange', () => { button.setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen' : 'Enter full screen'); paintFilm(); });
  }
  heroView('agreement'); renderSelection(); paintFilm(); syncFilm(); resolveHash();
  if (document.fonts) document.fonts.ready.then(paintFilm);
})();
