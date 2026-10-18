/* A timed, schematic reconstruction of the supplied research record.
   Every displayed score comes from the original evaluations. */
(() => {
  'use strict';
  const C = {paper: '#f6f8fb', white: '#ffffff', ink: '#1a2c46', muted: '#62738a', line: '#dce4ef', blue: '#2563eb', teal: '#0b7f83', pale: '#eaf4f3', soft: '#eaf0fa'};
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  class DetectionFilm {
    constructor(canvas, data, names) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.data = data; this.names = names;
      this.keys = Object.keys(data.events[0].raw_scores);
    }
    text(value, x, y, size = 20, color = C.ink, weight = 400, align = 'left') {
      const c = this.ctx;
      c.font = `${weight} ${size}px "Showcase", system-ui, sans-serif`;
      c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(String(value), x, y);
    }
    lines(value, x, y, width, size = 20, color = C.ink, weight = 400, step = 28) {
      const c = this.ctx; c.font = `${weight} ${size}px "Showcase", system-ui, sans-serif`;
      let line = '', row = 0;
      String(value).split(' ').forEach(word => {
        const next = line ? `${line} ${word}` : word;
        if (line && c.measureText(next).width > width) { this.text(line, x, y + row * step, size, color, weight); line = word; row++; }
        else line = next;
      });
      if (line) this.text(line, x, y + row * step, size, color, weight);
    }
    box(x, y, w, h, fill = C.white, stroke = C.line, radius = 12) {
      const c = this.ctx; c.beginPath(); c.roundRect(x, y, w, h, radius);
      c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
    }
    dot(x, y, r, fill) { const c = this.ctx; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
    connector(points, progress, active = true) {
      const c = this.ctx;
      c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
      c.strokeStyle = active ? '#9abfbd' : C.line; c.lineWidth = 2; c.stroke();
      const lengths = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
      let distance = ((progress % 1) + 1) % 1 * lengths.reduce((a, b) => a + b, 0);
      for (let i = 0; i < lengths.length; i++) {
        if (distance <= lengths[i]) {
          const t = lengths[i] ? distance / lengths[i] : 0;
          if (active) this.dot(points[i][0] + (points[i + 1][0] - points[i][0]) * t, points[i][1] + (points[i + 1][1] - points[i][1]) * t, 4.5, C.teal);
          break;
        }
        distance -= lengths[i];
      }
    }
    node(label, sub, x, y, w, h, active = false) {
      this.box(x, y, w, h, active ? C.pale : C.white, active ? '#7bb0ab' : C.line, 10);
      this.text(label, x + 16, y + 29, 19, active ? C.teal : C.ink, 600);
      if (sub) this.lines(sub, x + 16, y + 53, w - 28, 15, C.muted, 400, 20);
    }
    heading(eyebrow, title, subtitle) {
      this.text(eyebrow, 44, 48, 15, C.teal, 600);
      this.text(title, 44, 94, 33, C.ink, 500);
      this.text(subtitle, 44, 128, 18, C.muted);
    }
    timeline(time) {
      const labels = ['Method', 'TTA', 'Peaks', 'DNA-FISH', 'Retrain', 'Normalize', 'Loss', 'Retune'];
      const active = time < 4 ? -1 : Math.min(7, Math.floor((time - 4) / 3));
      this.text('RECORDED SUBMISSIONS', 44, 548, 13, C.muted, 600);
      labels.forEach((label, i) => {
        const x = 44 + i * 115;
        this.box(x, 566, 104, 4, i <= active ? C.teal : C.line, null, 2);
        this.text(`${i + 1}  ${label}`, x, 594, 14, i === active ? C.teal : C.muted, i === active ? 600 : 400);
      });
    }
    introduction(time) {
      this.heading('THE RESEARCH QUESTION', 'One task. Nine kinds of images.', 'Detect fluorescence spots, evaluate the coordinates, then refine the detector.');
      this.keys.forEach((key, i) => {
        const x = 44 + i % 3 * 307, y = 164 + Math.floor(i / 3) * 74;
        const shown = ease((time - i * .09) / .5);
        this.ctx.globalAlpha = .35 + .65 * shown;
        this.box(x, y, 292, 60); this.dot(x + 23, y + 30, 4, i === 2 ? C.blue : C.teal);
        this.text(this.names[key], x + 40, y + 37, 20);
        this.ctx.globalAlpha = 1;
      });
      const labels = ['Image inputs', 'Detector', 'Spot coordinates', 'Evaluation'];
      labels.forEach((label, i) => {
        const x = 44 + i * 236;
        if (i < 3) this.connector([[x + 208, 453], [x + 236, 453]], time * .65 - i * .15);
        this.box(x, 416, 208, 74, i === Math.min(3, Math.floor(time)) ? C.pale : C.white);
        this.text(label, x + 104, 461, 20, C.ink, 500, 'center');
      });
    }
    scoreCard(index, key) {
      const event = this.data.events[index], first = this.data.events[0].raw_scores[key].F1, score = event.raw_scores[key].F1;
      const x = 630;
      this.box(610, 166, 346, 336);
      this.text(this.names[key], x, 200, 21, C.ink, 500);
      this.text('ORIGINAL EVALUATION · F1', x, 229, 13, C.muted, 600);
      this.text(score.toFixed(4), x, 287, 46, C.teal, 500);
      const delta = score - first;
      this.text(index === 0 ? 'First recorded submission' : `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(4)} from first submission`, x, 319, 17, C.muted);
      const values = this.data.events.map(e => e.raw_scores[key].F1);
      const min = Math.min(...values), max = Math.max(...values), span = Math.max(.02, max - min);
      const px = i => x + 5 + i * 40, py = v => 450 - (v - min) / span * 83;
      const c = this.ctx;
      c.beginPath(); c.moveTo(x + 5, 458); c.lineTo(x + 285, 458); c.strokeStyle = C.line; c.lineWidth = 1; c.stroke();
      c.beginPath(); values.slice(0, index + 1).forEach((v, i) => i ? c.lineTo(px(i), py(v)) : c.moveTo(px(i), py(v)));
      c.strokeStyle = C.teal; c.lineWidth = 2.5; c.stroke();
      values.forEach((v, i) => {
        this.text(String(i + 1), px(i), 482, 13, C.muted, 400, 'center');
        if (i <= index) this.dot(px(i), py(v), i === index ? 5.5 : 3.5, C.teal);
      });
      this.text('Submission', x, 350, 13, C.muted);
    }
    method(index, time) {
      this.text('METHOD SELECTION', 64, 199, 14, C.muted, 600);
      this.node('Images', 'Per instance', 64, 276, 124, 88);
      this.connector([[188, 320], [212, 320], [212, 255], [236, 255]], time * .7);
      this.connector([[188, 320], [212, 320], [212, 397], [236, 397]], time * .7 - .2, index === 0);
      this.node('U-Net', 'Learned detector', 236, 211, 164, 88, index === 3);
      this.node('LoG', 'Tuned fallback', 236, 353, 164, 88, index === 0);
      this.connector([[400, 255], [421, 255], [421, 320], [444, 320]], time * .7 - .4);
      this.connector([[400, 397], [421, 397], [421, 320], [444, 320]], time * .7 - .4, index === 0);
      this.node('Spots', 'Evaluate', 444, 276, 122, 88, true);
      this.text(index === 3 ? 'DNA-FISH switches from LoG to U-Net.' : 'Select a detector for each instance.', 64, 476, 18, C.muted);
    }
    inference(index, time) {
      this.text('INFERENCE & PEAK SELECTION', 64, 199, 14, C.muted, 600);
      const blocks = [
        ['Image views', 'Test-time augmentation'],
        ['U-Net', index === 7 ? 'Updated models' : 'Detector inference'],
        ['Peak selection', 'Per-instance thresholds'],
        ['Coordinates', 'Evaluate all datasets']
      ];
      const positions = [[64, 225], [344, 225], [344, 365], [64, 365]];
      this.connector([[254, 271], [344, 271]], time * .65);
      this.connector([[439, 317], [439, 365]], time * .65 - .2);
      this.connector([[344, 411], [254, 411]], time * .65 - .4);
      blocks.forEach(([label, sub], i) => this.node(label, sub, positions[i][0], positions[i][1], 190, 92, index === 1 ? i === 0 : index === 2 ? i === 2 : i < 3));
      this.text(index === 7 ? 'Retune inference after model updates.' : index === 2 ? 'Tune thresholds and augmentation per instance.' : 'Combine predictions from augmented views.', 64, 482, 17, C.muted);
    }
    training(index, time) {
      this.text('TRAINING & EVALUATION FEEDBACK', 64, 199, 14, C.muted, 600);
      const changes = {
        4: [['Training inputs', 'Weak instances'], ['Train longer', 'More update steps'], ['Detector', 'Regenerate spots'], ['Evaluation', 'Compare results']],
        5: [['Preprocess', 'Normalize + subtract background'], ['Training', 'Shared preprocessing'], ['Inference', 'Shared preprocessing'], ['Evaluation', 'Compare results']],
        6: [['Training inputs', 'Weak instances'], ['Weighted loss', 'Emphasize spot pixels'], ['Detector', 'Retain useful models'], ['Evaluation', 'Compare results']]
      };
      const positions = [[64, 225], [344, 225], [344, 365], [64, 365]];
      this.connector([[254, 271], [344, 271]], time * .65);
      this.connector([[439, 317], [439, 365]], time * .65 - .2);
      this.connector([[344, 411], [254, 411]], time * .65 - .4);
      this.connector([[159, 365], [159, 317]], time * .65 - .6);
      changes[index].forEach(([label, sub], i) => this.node(label, sub, positions[i][0], positions[i][1], 190, 92, index === 5 ? i < 3 : i === 1));
      this.text('Use the next evaluation to check the change.', 64, 482, 17, C.muted);
    }
    submission(index, time, key) {
      const titles = ['Combine learned detection and a fallback.', 'Add test-time augmentation.', 'Retune peaks for each instance.', 'Change the DNA-FISH detector.', 'Retrain the weaker instances.', 'Align training and inference inputs.', 'Give spot pixels more weight.', 'Retune the updated detectors.'];
      const event = this.data.events[index];
      this.heading(`SUBMISSION ${String(index + 1).padStart(2, '0')} / 08`, titles[index], `${event.elapsed_hours.toFixed(2)} hours into the recorded run · Original evaluation scores`);
      this.box(44, 166, 542, 336);
      if (index === 0 || index === 3) this.method(index, time);
      else if ([1, 2, 7].includes(index)) this.inference(index, time);
      else this.training(index, time);
      this.scoreCard(index, key);
    }
    conclusion(time) {
      const first = this.data.events[0], last = this.data.events[this.data.events.length - 1];
      this.heading('THE RESULT', 'Detection improves across all nine datasets.', 'First and final evaluations · Original per-dataset F1');
      this.box(44, 156, 912, 100, C.pale, '#bad6d2');
      this.text('AGGREGATE IMPROVEMENT', 64, 190, 14, C.teal, 600);
      this.text(`${this.data.aggregate.initial.toFixed(4)}  →  ${this.data.aggregate.final.toFixed(4)}`, 64, 232, 35, C.ink, 500);
      this.text(`+${this.data.aggregate.delta.toFixed(4)}`, 932, 203, 35, C.teal, 500, 'right');
      this.text('absolute increase', 932, 233, 16, C.muted, 400, 'right');
      this.keys.forEach((key, i) => {
        const x = 44 + i % 3 * 307, y = 276 + Math.floor(i / 3) * 77;
        this.ctx.globalAlpha = .3 + .7 * ease((time - 28 - i * .07) / .45);
        this.box(x, y, 292, 65);
        this.text(this.names[key], x + 15, y + 25, 16, C.muted, 500);
        this.text(`${first.raw_scores[key].F1.toFixed(4)}  →  ${last.raw_scores[key].F1.toFixed(4)}`, x + 15, y + 51, 20, C.teal, 500);
        this.ctx.globalAlpha = 1;
      });
      this.text('Aggregate endpoints use the confirmed correction; intermediate values are not inferred.', 44, 525, 14, C.muted);
    }
    render(time, key) {
      if (!this.ctx) return;
      const rect = this.canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round((rect.width || 1000) * dpr)), height = Math.max(1, Math.round((rect.height || 625) * dpr));
      if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
      const c = this.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.fillStyle = C.paper; c.fillRect(0, 0, width, height);
      const scale = Math.min(width / 1000, height / 625);
      c.setTransform(scale, 0, 0, scale, (width - 1000 * scale) / 2, (height - 625 * scale) / 2);
      time = Math.max(0, Math.min(32, Number(time) || 0));
      if (!this.keys.includes(key)) key = 'dna_fish';
      if (time < 4) this.introduction(time);
      else if (time < 28) this.submission(Math.min(7, Math.floor((time - 4) / 3)), time, key);
      else this.conclusion(time);
      this.timeline(time);
    }
  }
  window.DetectionFilm = DetectionFilm;
})();
