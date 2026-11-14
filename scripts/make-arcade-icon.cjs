const fs=require('fs');
const star=(cx,cy,R,r)=>{let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r:R;d+=(i?'L':'M')+(cx+Math.cos(a)*q).toFixed(1)+' '+(cy+Math.sin(a)*q).toFixed(1);}return d+'Z';};
const sparkle=(x,y,s,o=1,c='#fff')=>`<path transform="translate(${x} ${y}) scale(${s})" opacity="${o}" d="M0 -40 C4 -12 12 -4 40 0 C12 4 4 12 0 40 C-4 12 -12 4 -40 0 C-12 -4 -4 -12 0 -40Z" fill="${c}"/>`;
function defs(p){return `<defs>
<radialGradient id="bg" cx=".5" cy=".28" r=".9"><stop offset="0" stop-color="${p.bg1}"/><stop offset=".5" stop-color="${p.bg2}"/><stop offset="1" stop-color="${p.bg3}"/></radialGradient>
<linearGradient id="front" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.c2}"/><stop offset=".55" stop-color="${p.c1}"/><stop offset="1" stop-color="${p.c2}"/></linearGradient>
<linearGradient id="side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.c3}"/><stop offset="1" stop-color="${p.c2}"/></linearGradient>
<linearGradient id="marq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.m1}"/><stop offset="1" stop-color="${p.m2}"/></linearGradient>
<radialGradient id="scr" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#3730a3"/><stop offset=".7" stop-color="#1e1b4b"/><stop offset="1" stop-color="#0b0a24"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7b0"/><stop offset=".5" stop-color="#fcd34d"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
<linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.p1}"/><stop offset="1" stop-color="${p.p2}"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".35" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="2" fill="#000" opacity=".22"/></pattern>
<radialGradient id="floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="bigglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="sh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#12082b" flood-opacity=".55"/></filter>
</defs>`;}
function background(p){
  let rays='';for(let i=0;i<16;i++)rays+=`<path transform="translate(512 360) rotate(${i*22.5})" d="M-30 0 L30 0 L110 900 L-110 900Z" fill="#fff" opacity=".05"/>`;
  return `<rect width="1024" height="1024" fill="url(#bg)"/>${rays}
  ${[[120,150,9],[900,120,7],[80,520,6],[950,470,8],[150,940,7],[880,930,9],[760,70,5],[280,70,6]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".75"/>`).join('')}
  ${sparkle(150,330,.7,.9)}${sparkle(880,300,.85,.9)}${sparkle(105,780,.5,.7)}${sparkle(925,720,.55,.8)}`;
}
// Cabinet in slight 3/4 view: front face plus a side panel on the right.
function cabinet(p,screen,marquee){
  const L=300,R=700,S=60; // front x range, side depth
  return `<ellipse cx="530" cy="930" rx="300" ry="44" fill="url(#floor)"/>
  <g filter="url(#sh)">
  <!-- side panel -->
  <path d="M${R} 150 L${R+S} 120 L${R+S} 886 L${R} 916 Z" fill="url(#side)"/>
  <path d="M${R+S} 120 L${R+S} 886" stroke="#000" stroke-opacity=".25" stroke-width="4"/>
  ${p.sideArt||''}
  <!-- top -->
  <path d="M${L} 150 L${L+S} 120 L${R+S} 120 L${R} 150 Z" fill="${p.c3}"/>
  <!-- front body -->
  <path d="M${L} 150 H${R} V916 H${L} Z" fill="url(#front)"/>
  <!-- trim edges -->
  <path d="M${L} 150 V916 M${R} 150 V916" stroke="${p.trim}" stroke-width="12"/>
  <!-- marquee -->
  <rect x="${L+14}" y="164" width="${R-L-28}" height="112" rx="16" fill="url(#marq)"/>
  ${Array.from({length:11},(_,i)=>`<circle cx="${L+40+i*32}" cy="178" r="6" fill="#fff7b0" filter="url(#glow)"/><circle cx="${L+40+i*32}" cy="262" r="6" fill="#fff7b0" filter="url(#glow)"/>`).join('')}
  ${marquee}
  <!-- screen bezel tilted back -->
  <path d="M${L+6} 292 H${R-6} L${R-20} 600 H${L+20} Z" fill="#111827"/>
  <path d="M${L+30} 312 H${R-30} L${R-42} 580 H${L+42} Z" fill="url(#scr)"/>
  <g>${screen}</g>
  <path d="M${L+30} 312 H${R-30} L${R-42} 580 H${L+42} Z" fill="url(#scan)"/>
  <path d="M${L+30} 312 H${R-30} L${R-42} 580 H${L+42} Z" fill="url(#glass)"/>
  <!-- control panel, angled -->
  <path d="M${L-16} 612 H${R+16} L${R} 700 H${L} Z" fill="url(#panel)"/>
  <path d="M${L} 700 H${R} V720 H${L} Z" fill="${p.p2}" opacity=".7"/>
  <!-- joystick -->
  <ellipse cx="${L+92}" cy="655" rx="36" ry="12" fill="#111827"/>
  <rect x="${L+85}" y="600" width="14" height="56" rx="6" fill="#4b5563"/>
  <circle cx="${L+92}" cy="596" r="26" fill="#ef4444"/><circle cx="${L+84}" cy="588" r="8" fill="#fff" opacity=".6"/>
  <!-- buttons -->
  ${[[L+200,'#fde047'],[L+262,'#22d3ee'],[L+324,'#4ade80']].map(([x,c])=>`<ellipse cx="${x}" cy="660" rx="26" ry="11" fill="#111827"/><ellipse cx="${x}" cy="654" rx="24" ry="10" fill="${c}"/><ellipse cx="${x-6}" cy="651" rx="8" ry="3" fill="#fff" opacity=".6"/>`).join('')}
  <!-- coin door -->
  <rect x="${L+110}" y="760" width="${R-L-220}" height="118" rx="14" fill="${p.p2}" stroke="${p.trim}" stroke-width="5"/>
  <rect x="${(L+R)/2-58}" y="784" width="40" height="60" rx="8" fill="#111827"/><rect x="${(L+R)/2-44}" y="796" width="12" height="36" rx="4" fill="#fde047" filter="url(#glow)"/>
  <rect x="${(L+R)/2+18}" y="784" width="40" height="60" rx="8" fill="#111827"/><rect x="${(L+R)/2+32}" y="796" width="12" height="36" rx="4" fill="#fde047" filter="url(#glow)"/>
  <!-- kick plate -->
  <rect x="${L}" y="890" width="${R-L}" height="26" fill="#111827" opacity=".55"/>
  </g>`;
}
const tileMini=(x,y,l,col,rot=0,s=1)=>`<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><rect x="-38" y="-30" width="76" height="76" rx="14" fill="#c2410c"/><rect x="-38" y="-38" width="76" height="76" rx="14" fill="#fffdf5" stroke="#f59e0b" stroke-width="5"/><text y="22" text-anchor="middle" font-family="Inter Display" font-weight="900" font-size="56" fill="${col}">${l}</text></g>`;

// ---- A2 "Royal Purple" final, with extra polish ----
const p={bg1:'#c4b5fd',bg2:'#6d28d9',bg3:'#1e1b4b',c1:'#8b5cf6',c2:'#5b21b6',c3:'#3b0764',trim:'#fbbf24',m1:'#1e1b4b',m2:'#312e81',p1:'#4c1d95',p2:'#2e1065',
 sideArt:`<path d="M705 300 L755 280 L755 860 L705 880Z" fill="none" stroke="#fbbf24" stroke-width="6"/>
  <path d="${star(730,470,22,9)}" fill="#fbbf24"/><path d="${star(730,560,14,6)}" fill="#fbbf24" opacity=".8"/><path d="${star(730,630,10,4)}" fill="#fbbf24" opacity=".6"/>
  <path d="M705 300 L755 280" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>`};
const marquee=`<rect x="330" y="186" width="340" height="68" rx="12" fill="#0f0d2e" opacity=".6"/>
 ${sparkle(400,220,.32,1,'#fde047')}${sparkle(600,220,.32,1,'#fde047')}
 <path d="${star(500,220,52,22)}" fill="url(#gold)" stroke="#b45309" stroke-width="6" stroke-linejoin="round" filter="url(#glow)"/>
 <path d="${star(500,220,52,22)}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" transform="translate(-3 -3)"/>`;
const screen=`<ellipse cx="500" cy="455" rx="150" ry="70" fill="#818cf8" opacity=".25" filter="url(#bigglow)"/>
 ${tileMini(398,470,'A','#1e1b4b',-9)}${tileMini(500,448,'B','#7c3aed',0,1.12)}${tileMini(602,470,'C','#db2777',9)}
 <path d="${star(440,358,15,6)}" fill="#fde047" filter="url(#glow)"/><path d="${star(566,348,11,4.5)}" fill="#fde047" filter="url(#glow)"/><path d="${star(612,384,7,3)}" fill="#fff"/>
 <circle cx="372" cy="372" r="3" fill="#fff" opacity=".8"/><circle cx="520" cy="372" r="2.5" fill="#fff" opacity=".7"/>
 <rect x="372" y="548" width="256" height="9" rx="4.5" fill="#312e81"/><rect x="372" y="548" width="170" height="9" rx="4.5" fill="#fbbf24"/>`;
const halo=`<ellipse cx="520" cy="470" rx="300" ry="360" fill="#e9d5ff" opacity=".22" filter="url(#bigglow)"/>`;
const fg=()=>halo+cabinet(p,screen,marquee);
const svg=b=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${defs(p)}${b}</svg>`;
const out=process.argv[2]||'/tmp/a2';
fs.writeFileSync(out+'/full.svg',svg(background(p)+`<g transform="translate(512 520) scale(1.04) translate(-525 -530)">${fg()}</g>`));
fs.writeFileSync(out+'/fg.svg',svg(`<g transform="translate(512 512) scale(.62) translate(-525 -530)">${fg()}</g>`));
fs.writeFileSync(out+'/bgonly.svg',svg(background(p)));
fs.writeFileSync(out+'/splash.svg',svg(`<g transform="translate(512 512) scale(.92) translate(-525 -530)">${fg()}</g>`));
