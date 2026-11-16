// LÓNG · the drawing hand: a right hand seen from above, holding the tool, drawn in flat vector. The tool's tip is at
// (0, 0); the tool points up (−y) in these coordinates and the arm goes down; the kit turns it so it points up-left.
// Tools: rotu (whiteboard marker), tiza (chalk), boli (ballpoint), lapiz (pencil), pincel (Chinese brush).

const SKIN = '#f3c7a5', SHADE = '#dfa784', LINE = '#a8694a', NAIL = '#f9e0d0';
const S = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" stroke="${LINE}" stroke-width="3.2" stroke-linejoin="round" ${extra}/>`;

const TOOLS = {
  rotu: `
    <path d="M-5,3 Q0,-2 5,3 L8,22 L-8,22 Z" fill="#202022"/>
    <path d="M-10,22 L10,22 L18,48 L-18,48 Z" fill="#3c3c40"/>
    <rect x="-18" y="48" width="36" height="300" rx="7" fill="#1d1d20"/>
    <rect x="-18" y="150" width="36" height="66" fill="#f1f1ee"/><rect x="-18" y="174" width="36" height="12" fill="#e2412f"/>
    <path d="M-10,56 L-10,340" stroke="#4a4a50" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    <rect x="-20" y="336" width="40" height="30" rx="9" fill="#e2412f"/>`,
  tiza: `
    <path d="M-14,10 Q-14,0 -4,-1 Q8,-2 14,8 L15,170 Q15,178 6,178 L-6,178 Q-15,178 -15,170 Z" fill="#f5f3ea"/>
    <path d="M-9,14 L-9,168" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    <path d="M6,30 l3,2 M-4,70 l2,3 M8,110 l-3,2 M-6,140 l3,1" stroke="#d6d2c4" stroke-width="3" stroke-linecap="round"/>`,
  boli: `
    <path d="M0,0 L5,13 L-5,13 Z" fill="#8e959c"/><rect x="-6" y="12" width="12" height="10" fill="#c9ced3"/>
    <path d="M-15,22 L15,22 L15,318 L-15,318 Z" fill="#e6eef8" opacity=".92"/>
    <path d="M-15,22 L-15,318 M15,22 L15,318 M-5,22 L-5,318 M5,22 L5,318" stroke="#b9c8da" stroke-width="2.5"/>
    <path d="M0,24 L0,300" stroke="#2350c8" stroke-width="5" stroke-linecap="round"/>
    <rect x="-16" y="312" width="32" height="20" rx="4" fill="#2350c8"/>`,
  lapiz: `
    <path d="M0,0 L5,13 L-5,13 Z" fill="#3a3a3a"/>
    <path d="M-5,13 L5,13 L17,56 L-17,56 Z" fill="#f0cf9f"/>
    <path d="M-17,56 Q-11,51 -6,56 Q0,51 6,56 Q11,51 17,56 L17,330 L-17,330 Z" fill="#f6c632"/>
    <path d="M-6,56 L-6,330 M6,56 L6,330" stroke="#dca614" stroke-width="5"/>
    <path d="M-12,60 L-12,326" stroke="#fde27a" stroke-width="4"/>
    <rect x="-18" y="328" width="36" height="28" fill="#b9bdc2"/><path d="M-18,337 L18,337 M-18,347 L18,347" stroke="#8e9398" stroke-width="2.5"/>
    <rect x="-17" y="355" width="34" height="30" rx="7" fill="#f0908c"/>`,
  pincel: `
    <path d="M0,-2 Q-6,14 -12,34 Q-15,48 -11,58 L11,58 Q15,48 12,34 Q6,14 0,-2 Z" fill="#17130f"/>
    <path d="M-3,10 Q-6,30 -7,52" stroke="#3a322a" stroke-width="2.5" fill="none"/>
    <rect x="-12" y="56" width="24" height="30" rx="3" fill="#8b6a3e"/><path d="M-12,64 L12,64 M-12,78 L12,78" stroke="#5d4527" stroke-width="2.5"/>
    <rect x="-10" y="84" width="20" height="300" rx="9" fill="#d9b878"/>
    <path d="M-10,190 L10,190 M-10,300 L10,300" stroke="#a6844a" stroke-width="5"/><path d="M-5,90 L-5,378" stroke="#ead29c" stroke-width="3"/>`,
};

// where the fingers hold each tool: the hand slides back along a long brush
const GRIP = { rotu: 0, tiza: 0, boli: 0, lapiz: 0, pincel: 70 };

export function manoSVG(tool = 'rotu', sleeve = '#2c3e66') {
  const g = GRIP[tool] || 0;
  return `
  <g class="hand" transform="translate(0,${g})">
    <!-- the forearm and the sleeve, going off towards the shoulder -->
    <path d="M-30,430 Q40,410 150,428 L230,980 L40,1000 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="M10,760 L216,740 L250,1120 L40,1140 Z" fill="${sleeve}"/>
    <path d="M10,760 L216,740 L220,784 L14,804 Z" fill="${sleeve}"/><path d="M12,784 L218,764" stroke="rgba(255,255,255,.22)" stroke-width="5"/>
    <!-- the back of the hand, the curled ring and little fingers -->
    ${S('M-44,300 Q-40,250 6,236 Q60,224 112,240 Q156,258 170,300 Q182,346 172,398 Q158,446 112,464 Q62,478 18,458 Q-24,438 -38,394 Q-48,350 -44,300 Z', SKIN)}
    ${S('M138,250 Q168,246 182,268 Q190,288 178,302 Q166,308 156,300', SKIN)}
    ${S('M162,296 Q188,296 196,318 Q200,338 186,346 Q174,350 166,340', SKIN)}
    <path d="M40,300 Q80,306 112,336 M10,360 Q56,368 92,404" stroke="${SHADE}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".7"/>
    <!-- the middle finger, under the tool -->
    ${S('M112,276 Q90,232 64,200 Q50,184 36,184 Q22,188 26,204 Q36,226 56,250 Q74,274 86,292 Z', SKIN)}
  </g>
  <g class="tool">${TOOLS[tool]}</g>
  <g class="hand" transform="translate(0,${g})">
    <!-- the thumb, pressing the near side of the tool -->
    ${S('M-8,300 Q-26,262 -34,226 Q-40,196 -40,170 Q-40,150 -28,148 Q-16,148 -14,166 Q-12,196 -2,228 Q8,256 20,280 Z', SKIN)}
    <path d="M-40,160 Q-36,148 -26,150 Q-22,158 -24,168 Q-34,172 -40,166 Z" fill="${NAIL}" stroke="${LINE}" stroke-width="2.2"/>
    <!-- the index finger along the top of the tool, its tip by the nib -->
    ${S('M64,270 Q50,226 36,190 Q26,160 16,132 Q8,110 -2,102 Q-14,96 -20,108 Q-24,122 -14,138 Q-2,162 6,190 Q14,222 22,276 Z', SKIN)}
    <path d="M-18,106 Q-12,98 -2,102 Q2,112 -4,118 Q-14,120 -18,112 Z" fill="${NAIL}" stroke="${LINE}" stroke-width="2.2"/>
    <path d="M6,150 Q18,150 24,158 M18,200 Q30,200 36,208" stroke="${SHADE}" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>`;
}
