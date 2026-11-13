// Builds the Spelling Stars icon (letter tiles + star) as SVG layers. Render the SVGs to 1024px PNGs in assets/icon.
const fs=require('fs');
function starPath(cx,cy,R,r,n=5){let d='';for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,rad=i%2?r:R;d+=(i?'L':'M')+(cx+Math.cos(a)*rad).toFixed(1)+' '+(cy+Math.sin(a)*rad).toFixed(1);}return d+'Z';}
function sparkle(x,y,s,o=1){return `<path transform="translate(${x} ${y}) scale(${s})" opacity="${o}" d="M0 -40 C4 -12 12 -4 40 0 C12 4 4 12 0 40 C-4 12 -12 4 -40 0 C-12 -4 -4 -12 0 -40Z" fill="#fff"/>`;}
const defs=`<defs>
 <radialGradient id="bg" cx=".5" cy=".32" r=".85"><stop offset="0" stop-color="#a78bfa"/><stop offset=".45" stop-color="#7c3aed"/><stop offset="1" stop-color="#2e1065"/></radialGradient>
 <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fef08a" stop-opacity=".75"/><stop offset=".5" stop-color="#fde047" stop-opacity=".25"/><stop offset="1" stop-color="#fde047" stop-opacity="0"/></radialGradient>
 <linearGradient id="star" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff59d"/><stop offset=".45" stop-color="#fcd34d"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
 <linearGradient id="starIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#fde047" stop-opacity="0"/></linearGradient>
 <linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#fdecc0"/></linearGradient>
 <linearGradient id="side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#c2410c"/></linearGradient>
 <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <linearGradient id="rays" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
 <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="22" stdDeviation="20" flood-color="#1e1033" flood-opacity=".55"/></filter>
</defs>`;
function background(){
  let rays='';for(let i=0;i<14;i++){const a=i*360/14;rays+=`<path transform="translate(512 300) rotate(${a})" d="M-34 0 L34 0 L120 900 L-120 900Z" fill="url(#rays)"/>`;}
  const dots=[[150,170,9],[880,140,7],[95,520,6],[930,470,8],[200,930,7],[860,920,9],[740,60,5],[300,80,6]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".7"/>`).join('');
  return `<rect width="1024" height="1024" fill="url(#bg)"/><g opacity=".9">${rays}</g>${dots}
   ${sparkle(190,330,.9,.95)}${sparkle(850,300,1.1,.95)}${sparkle(120,760,.6,.7)}${sparkle(905,690,.7,.8)}
   <rect width="1024" height="1024" fill="none"/>`;
}
function tile(x,y,rot,letter,color){
  const w=250,h=260,r=46,depth=26;
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#shadow)">
   <rect x="${-w/2}" y="${-h/2+depth}" width="${w}" height="${h}" rx="${r}" fill="url(#side)"/>
   <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${r}" fill="url(#face)" stroke="#f59e0b" stroke-width="10"/>
   <rect x="${-w/2+22}" y="${-h/2+22}" width="${w-44}" height="${h-44}" rx="${r-18}" fill="none" stroke="#fbbf24" stroke-opacity=".45" stroke-width="5"/>
   <path d="M${-w/2+30} ${-h/2+26} H${w/2-30} Q${w/2-18} ${-h/2+26} ${w/2-22} ${-h/2+70} Q0 ${-h/2+40} ${-w/2+22} ${-h/2+70} Q${-w/2+18} ${-h/2+26} ${-w/2+30} ${-h/2+26}Z" fill="url(#gloss)" opacity=".85"/>
   <text y="74" text-anchor="middle" font-family="Inter Display" font-weight="900" font-size="208" fill="#000" opacity=".13" transform="translate(6 8)">${letter}</text>
   <text y="74" text-anchor="middle" font-family="Inter Display" font-weight="900" font-size="208" fill="${color}">${letter}</text>
  </g>`;
}
function foreground(){
  return `<ellipse cx="512" cy="300" rx="250" ry="230" fill="url(#glow)"/>
  <g filter="url(#shadow)">
   <path d="${starPath(512,300,190,84)}" fill="url(#star)" stroke="#b45309" stroke-width="20" stroke-linejoin="round"/>
   <path d="${starPath(512,302,150,64)}" fill="url(#starIn)" opacity=".7" stroke-linejoin="round"/>
   <ellipse cx="470" cy="230" rx="44" ry="26" transform="rotate(-25 470 230)" fill="#fff" opacity=".75"/>
  </g>
  ${sparkle(712,170,.75)}${sparkle(320,175,.5)}
  ${tile(262,705,-9,'A','#1e1b4b')}${tile(762,705,9,'C','#db2777')}${tile(512,672,0,'B','#7c3aed')}`;
}
const svg=(body,bgFill='')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${defs}${bgFill}${body}</svg>`;
fs.writeFileSync('/tmp/icons/full.svg',svg(background()+foreground()));
// Android adaptive icon: foreground shrunk into the safe zone; background separate.
fs.writeFileSync('/tmp/icons/fg.svg',svg(`<g transform="translate(512 512) scale(.68) translate(-512 -490)">${foreground()}</g>`));
fs.writeFileSync('/tmp/icons/bgonly.svg',svg(background()));
fs.writeFileSync('/tmp/icons/splash.svg',svg(`<g transform="translate(512 512) scale(.95) translate(-512 -490)">${foreground()}</g>`));
