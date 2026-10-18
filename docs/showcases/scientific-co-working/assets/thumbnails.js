// Decorative navigation artwork. These miniatures are not measured task results.
// Each scene is an inline vector, with local gradient/filter IDs and no asset fetch.
export function thumbnail(kind) {
  const palette = {
    map: ['#557fb6', '#529a98'], chip: ['#4d9198', '#7b91bf'],
    flow: ['#5692b1', '#d69a6c'], document: ['#8c8abd', '#5b97b6'],
    crystal: ['#8586b3', '#639db9'], thermal: ['#cc945b', '#c17c6c'],
    fpga: ['#5a91ac', '#8989b7'], quantum: ['#8887b8', '#b08aa4'],
    data: ['#6b9b8b', '#6d98c0'], packets: ['#5e9b9b', '#658fb9']
  };
  const [p, q] = palette[kind];
  const id = `mini-${kind}`;
  const fill = name => `url(#${id}-${name})`;
  const circle = (x, y, r = 3, color = p) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  const paths = (lines, color = p, width = 1, extra = '') =>
    `<g fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}>${lines.map(d => `<path d="${d}"/>`).join('')}</g>`;
  const glow = body => `<g filter="${fill('glow')}">${body}</g>`;
  const iso = (x, y, w, d, h, color = p) => {
    const corners = `${x},${y} ${x+w},${y-w*.45} ${x+w+d},${y-w*.45+d*.45} ${x+d},${y+d*.45}`;
    return `<g stroke="${color}" stroke-width=".7" stroke-linejoin="round">
      <path d="M${x} ${y}v${h}l${d} ${d*.45}v-${h}" fill="#e2eaf7"/>
      <path d="M${x+d} ${y+d*.45}v${h}l${w} -${w*.45}v-${h}" fill="#ccdcec"/>
      <polygon points="${corners}" fill="${fill('surface')}"/></g>`;
  };
  const scenes = {
    map: () => {
      const roads = [];
      for (let i = 0; i < 8; i++) {
        roads.push(`M${43+i*13} ${73-i*5}l88 34`, `M${50+i*13} ${77+i*5}l89-36`);
      }
      return `<g class="mini-object">
        <path d="m39 73 91-39 94 40-89 40Z" fill="#e0eaf7" stroke="${p}" stroke-opacity=".45"/>
        ${paths(roads, '#47748d', .8, 'opacity=".65"')}
        ${iso(83,64,10,9,19)}${iso(114,52,12,10,28)}${iso(145,70,11,12,24)}
        ${iso(72,80,9,10,13)}${iso(170,63,11,9,15)}${iso(117,85,9,9,14)}
        ${glow(paths(['M57 79l26-11 30 13 42-18 42 17', 'M113 81v17'], q, 2))}
        <path class="mini-travel" d="M57 79l26-11 30 13 42-18 42 17" stroke="#376c98" stroke-width="2.4" stroke-dasharray="5 90" fill="none"/>
        ${glow(circle(57,79,3,q)+circle(155,63,3,q)+circle(197,80,3,q))}
        <g class="mini-pulse" fill="none" stroke="${q}" stroke-opacity=".55"><circle cx="155" cy="63" r="10"/><circle cx="57" cy="79" r="8"/></g>
        </g>`;
    },
    chip: () => {
      let cells = '';
      for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++)
        cells += iso(77+col*13+row*10,61-col*5.85+row*4.5,8,6,3,col===row?p:'#496a84');
      return `<g class="mini-object"><g transform="translate(0 -5)">
        <path d="m49 76 90-39 78 35v12l-90 39-78-35Z" fill="#e1eaf7" stroke="#375b6e"/>
        <path d="m49 76 90-39 78 35-90 39Z" fill="#d2e0f2" stroke="${p}" stroke-opacity=".6"/>
        ${cells}
        ${glow(paths(['M66 78l27-12 26 12 44-20 38 17','M119 78v19m44-39v-15','M94 66V54'],p,1.7))}
        ${glow(circle(66,78)+circle(119,97)+circle(163,43)+circle(201,75))}
        <path class="mini-travel" d="M66 78l27-12 26 12 44-20 38 17" stroke="#357198" stroke-width="2" stroke-dasharray="5 85" fill="none"/>
        ${paths(['M44 85l-12 5m107-61V17m88 59 14 6m-114 34v6'],q,1,'opacity=".55"')}
        </g></g>`;
    },
    flow: () => {
      const lines = [];
      for (let i = 0; i < 11; i++) {
        const y = 17+i*9, displacement = i<5?-16:i>6?16:0;
        lines.push(`M5 ${y}C52 ${y} 68 ${y+displacement} 112 ${y+displacement}S190 ${y+4} 260 ${y+4}`);
      }
      return `<ellipse cx="137" cy="61" rx="103" ry="50" fill="${fill('halo')}"/>
        ${paths(lines, p, .8, 'opacity=".47"')}
        <g class="mini-travel" stroke-dasharray="9 140">${paths(lines.filter((_,i)=>i%2===0),'#5b9bc2',1.6)}</g>
        <g class="mini-object">${glow('<ellipse cx="90" cy="60" rx="13" ry="18" fill="'+q+'" opacity=".35"/>')}
        <path d="M75 67c36-31 82-19 140 3-56-11-94-15-140-3Z" fill="${fill('metal')}" stroke="#567aa6" stroke-width="1.2"/>
        <path d="M78 69c38-10 91-5 134 4" fill="none" stroke="${q}" stroke-opacity=".7"/>
        </g>`;
    },
    document: () => `<g class="mini-object">
      <path d="m85 16 75 3 12 86-75-3Z" fill="#d3dceb" stroke="#74698e" stroke-opacity=".5"/>
      <path d="m77 12 76 4 12 87-76-4Z" fill="${fill('paper')}" stroke="#8d92b2" stroke-opacity=".8"/>
      ${paths(['M91 27l47 3','M93 39l53 3','M94 50l30 2','M97 62l51 3','M99 74l32 2','M100 85l47 3'],'#8793b2',1.4)}
      <path d="m95 40 40 3m-34 19 39 3m-36 11 22 1" stroke="#45476e" stroke-width="6"/>
      <path class="mini-scan" d="m69 58 103 6" stroke="${p}" stroke-width="1.7" filter="${fill('glow')}"/>
      <path d="M162 62l23-7 23 7v19c0 16-23 29-23 29s-23-13-23-29Z" fill="#edf3fc" stroke="${q}" stroke-width="1.2"/>
      ${glow(paths(['m174 81 8 8 15-18'],q,2.4))}
      </g>`,
    crystal: () => {
      const points = [[79,34],[117,17],[155,36],[118,53],[79,74],[117,96],[155,76],[196,55],[196,95],[155,115],[42,54],[42,94]];
      const bonds = [[0,1],[1,2],[2,3],[3,0],[0,4],[4,5],[5,6],[6,2],[3,5],[2,7],[7,8],[8,9],[9,6],[6,7],[0,10],[10,11],[11,4]];
      return `<g class="mini-object">${paths(bonds.map(([a,b])=>`M${points[a].join(' ')} ${points[b].join(' ')}`),'#7788b4',1.2)}
        ${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i===3?7:5}" fill="${fill(i%2?'atom2':'atom')}" stroke="${i%2?q:p}" stroke-width=".5"/>`).join('')}
        <circle class="mini-pulse" cx="118" cy="53" r="14" stroke="#f4c7ab" stroke-dasharray="2 3" fill="none"/>
        ${glow(circle(118,53,2,'#ffe9d8'))}
        </g>`;
    },
    thermal: () => `<g class="mini-object">
      <path d="m83 27 91 9 11 68-91-9Z" fill="#cfdfec" stroke="#679797" stroke-width="1"/>
      <path d="m74 20 91 9 11 68-91-9Z" fill="${fill('heat')}" stroke="#ffc37b" stroke-opacity=".7"/>
      <g fill="none" stroke="#ffdbad" stroke-opacity=".6">
        <path d="m85 31 69 7 8 47-69-7Z"/><path d="m98 43 45 5 5 24-45-5Z"/>
      </g>
      ${paths(['M60 37l-15-1m17 17-21-1m24 17-15-1M182 46l17 1m-14 17 21 1m-18 17 16 1'],'#89b5af',1.3)}
      <g class="mini-pulse" fill="none" stroke="${p}" stroke-opacity=".45"><path d="M109 21c-7-8 6-11 0-20m22 22c-7-8 6-11 0-20m22 22c-7-8 6-11 0-20"/></g>
      ${glow(circle(172,69,3,'#d4fff4'))}
      </g>`,
    fpga: () => {
      let tiles='',pins='';
      for(let row=0;row<7;row++)for(let col=0;col<10;col++){
        const color=col===2||col===7?q:row%3===0&&col%3===0?'#d5f6ff':p;
        tiles+=`<rect x="${86+col*8}" y="${30+row*8}" width="5.5" height="5.5" rx=".7" fill="${color}" opacity="${col===2||col===7?.85:.22+(row+col)%3*.17}"/>`;
      }
      for(let i=0;i<9;i++)pins+=`M${88+i*9} 18v-8M${88+i*9} 99v11M72 ${25+i*8}H62M183 ${25+i*8}h10`;
      return `<g class="mini-object">
        ${paths([pins],'#607a92',2)}
        <rect x="72" y="18" width="111" height="82" rx="5" fill="#dce6f5" stroke="${q}" stroke-opacity=".45"/>
        <rect x="80" y="24" width="95" height="69" rx="3" fill="#f6f9fe" stroke="${p}" stroke-opacity=".7"/>
        ${tiles}
        ${glow(paths(['M106 35v25h32v21','M90 77h33V44h38'],p,1.2))}
        <path class="mini-scan" d="M81 58h93" stroke="#6794ba" stroke-opacity=".7" filter="${fill('glow')}"/>
        </g>`;
    },
    quantum: () => `<g class="mini-object">
      <circle cx="125" cy="61" r="42" fill="${fill('halo')}" stroke="${p}" stroke-opacity=".35"/>
      <ellipse cx="125" cy="61" rx="43" ry="16" transform="rotate(-24 125 61)" stroke="${q}" stroke-opacity=".7"/>
      <ellipse cx="125" cy="61" rx="17" ry="42" transform="rotate(27 125 61)" stroke="${p}" stroke-opacity=".7"/>
      ${paths(['M40 42h181','M40 84h181'],'#706799',1.1)}
      <rect x="64" y="32" width="21" height="20" rx="3" fill="#e8e7f6" stroke="${p}"/>
      <rect x="177" y="74" width="21" height="20" rx="3" fill="#e8e7f6" stroke="${q}"/>
      ${glow(paths(['M124 42v42','M119 84h10m-5-5v10'],p,1.7)+circle(124,42,4,p))}
      <circle cx="124" cy="84" r="9" fill="none" stroke="${p}"/>
      ${glow(circle(155,30,3,'#f4c3ee')+circle(91,89,2,'#cab8ff'))}
      <ellipse class="mini-travel" cx="125" cy="61" rx="43" ry="16" transform="rotate(-24 125 61)" stroke="#a493c8" stroke-width="2" stroke-dasharray="5 125" fill="none"/>
      </g>`,
    data: () => {
      const db = (x,y,color) => `<g stroke="${color}" stroke-width="1">
        <path d="M${x-22} ${y}v34c0 11 44 11 44 0v-34" fill="#e2edf5"/>
        <ellipse cx="${x}" cy="${y}" rx="22" ry="8" fill="${fill('surface')}"/>
        <path d="M${x-22} ${y+14}c0 13 44 13 44 0M${x-22} ${y+27}c0 13 44 13 44 0" fill="none" stroke-opacity=".45"/></g>`;
      return `<g class="mini-object">
        ${paths(['M92 61h22l27-26h15','M114 61l27 27h15'],p,1.4)}
        <path class="mini-travel" d="M92 61h22l27-26h15M114 61l27 27h15" fill="none" stroke="#5e947e" stroke-width="2" stroke-dasharray="5 48"/>
        <rect x="49" y="27" width="45" height="66" rx="4" transform="rotate(-7 70 60)" fill="#d5e2ef" stroke="${q}" stroke-opacity=".45"/>
        <rect x="54" y="24" width="45" height="66" rx="4" fill="${fill('paper')}" stroke="#b3ded7" stroke-opacity=".7"/>
        ${paths(['M63 36h27m-27 10h27m-27 10h27m-27 10h16m-16 10h22'],'#6a99a1',1.4)}
        ${db(185,21,p)}${db(185,74,q)}
        ${glow(circle(114,61,4,p))}
        </g>`;
    },
    packets: () => {
      let packets='';
      for(let i=0;i<7;i++){
        packets+=`<rect x="${38+i*27}" y="31" width="12" height="11" rx="2" fill="${i%3===0?q:p}" opacity="${i===3?.25:.8}"/>
          <rect x="${45+i*27}" y="69" width="12" height="11" rx="2" fill="${i%2?q:p}" opacity="${i===1?.25:.8}"/>`;
      }
      return `<g class="mini-object">
        ${paths(['M19 36h222M19 74h222'],'#567c95',1,'opacity=".6"')}
        ${paths(['m44 42 7 27m47-27 7 27m47-27 7 27m47-27 7 27'],p,.8,'opacity=".3"')}
        ${packets}
        <path class="mini-travel" d="M19 36h222M19 74h222" fill="none" stroke="#558eae" stroke-width="2.1" stroke-dasharray="6 78"/>
        ${glow(paths(['M83 91l10 11h75l11-11'],q,1.4))}
        ${[0,1,2,3,4,5].map(i=>`<rect x="${99+i*11}" y="95" width="7" height="7" rx="1" fill="${p}" opacity="${.4+i*.1}"/>`).join('')}
        </g>`;
    }
  };
  return `<svg viewBox="0 0 260 122" fill="none" aria-hidden="true" class="miniature" focusable="false">
    <defs>
      <radialGradient id="${id}-halo"><stop stop-color="${p}" stop-opacity=".12"/><stop offset="1" stop-color="${p}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p}" stop-opacity=".55"/><stop offset="1" stop-color="#e4edf7"/></linearGradient>
      <linearGradient id="${id}-metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e7fdff"/><stop offset=".4" stop-color="#a8d0e1"/><stop offset="1" stop-color="#7b9aba"/></linearGradient>
      <linearGradient id="${id}-paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#e4edf7"/></linearGradient>
      <radialGradient id="${id}-atom" cx=".3" cy=".25"><stop stop-color="#f4f2ff"/><stop offset=".45" stop-color="${p}"/><stop offset="1" stop-color="#8f8fba"/></radialGradient>
      <radialGradient id="${id}-atom2" cx=".3" cy=".25"><stop stop-color="#f1ffff"/><stop offset=".45" stop-color="${q}"/><stop offset="1" stop-color="#7fa1b8"/></radialGradient>
      <radialGradient id="${id}-heat"><stop stop-color="#ffe9a3"/><stop offset=".28" stop-color="#ffba62"/><stop offset=".62" stop-color="#d86e5d"/><stop offset="1" stop-color="#8eabbd"/></radialGradient>
      <filter id="${id}-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation=".5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <pattern id="${id}-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0v16" stroke="${p}" stroke-opacity=".05" stroke-width=".65"/></pattern>
    </defs>
    <rect width="260" height="122" fill="#eef3fc"/>
    <ellipse cx="136" cy="68" rx="110" ry="83" fill="${fill('halo')}"/>
    <rect width="260" height="122" fill="${fill('grid')}"/>
    ${scenes[kind]()}
    <path d="M237 11h12v12M11 99v12h12" stroke="${p}" stroke-width=".8" stroke-opacity=".25"/>
  </svg>`;
}
