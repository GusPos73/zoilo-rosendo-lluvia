// Zoilo mini-games for GitHub Pages (vanilla JS)
// Wordsearch: click/drag selection (8 directions), verify against list.

const WS = {
  size: 12,
  words: [
    "ZOILO","ROSENDO","JOHNNY","NOE","ARCA","DILUVIO","ARCOIRIS","ESPERANZA","PACIENCIA","FE","ANIMALES","LLUVIA"
  ],
  grid: [],
  placements: [],
  found: new Set(),
  selecting: false,
  path: [],
  startIdx: null,
};

function randInt(n){ return Math.floor(Math.random()*n); }
function choice(arr){ return arr[randInt(arr.length)]; }

function createEmptyGrid(size){
  return Array.from({length:size}, ()=> Array.from({length:size}, ()=> ""));
}

const DIRS = [
  [1,0],[-1,0],[0,1],[0,-1],
  [1,1],[1,-1],[-1,1],[-1,-1]
];

function canPlace(grid, word, r, c, dr, dc){
  const n = grid.length;
  for(let i=0;i<word.length;i++){
    const rr=r+dr*i, cc=c+dc*i;
    if(rr<0||cc<0||rr>=n||cc>=n) return false;
    const cur = grid[rr][cc];
    if(cur !== "" && cur !== word[i]) return false;
  }
  return true;
}

function placeWord(grid, word){
  const n = grid.length;
  for(let t=0;t<300;t++){
    const drdc = choice(DIRS);
    const dr=drdc[0], dc=drdc[1];
    const r = randInt(n);
    const c = randInt(n);
    if(!canPlace(grid, word, r, c, dr, dc)) continue;
    const coords=[];
    for(let i=0;i<word.length;i++){
      const rr=r+dr*i, cc=c+dc*i;
      grid[rr][cc]=word[i];
      coords.push([rr,cc]);
    }
    return {word, coords};
  }
  return null;
}

function fillRandom(grid){
  const letters="ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
  for(let r=0;r<grid.length;r++){
    for(let c=0;c<grid.length;c++){
      if(grid[r][c]==="") grid[r][c]=letters[randInt(letters.length)];
    }
  }
}

function wsRender(){
  const gridEl = document.getElementById("ws-grid");
  const listEl = document.getElementById("ws-wordlist");
  const scoreEl = document.getElementById("ws-score");
  const statusEl = document.getElementById("ws-status");

  gridEl.innerHTML = "";
  listEl.innerHTML = "";

  // Word chips
  WS.words.forEach(w=>{
    const chip=document.createElement("span");
    chip.className="chip" + (WS.found.has(w) ? " done" : "");
    chip.textContent=w;
    listEl.appendChild(chip);
  });

  // Grid
  gridEl.style.gridTemplateColumns = `repeat(${WS.size}, 34px)`;
  for(let r=0;r<WS.size;r++){
    for(let c=0;c<WS.size;c++){
      const cell=document.createElement("div");
      cell.className="cell";
      cell.textContent=WS.grid[r][c];
      cell.dataset.r=r; cell.dataset.c=c;
      if(WS.found.hasAny){
        // no-op
      }
      gridEl.appendChild(cell);
    }
  }

  scoreEl.textContent = `${WS.found.size} / ${WS.words.length}`;
  statusEl.textContent = "Seleccioná letras haciendo clic (o arrastrando) para formar una palabra.";
}

function wsBuild(){
  WS.grid = createEmptyGrid(WS.size);
  WS.placements = [];
  WS.found = new Set();

  // Place longer first
  const sorted = [...WS.words].sort((a,b)=>b.length-a.length);
  for(const w of sorted){
    const p = placeWord(WS.grid, w);
    if(p) WS.placements.push(p);
  }
  fillRandom(WS.grid);
  wsRender();
  wsBind();
}

function idxKey(r,c){ return `${r},${c}`; }

function wsClearSelection(){
  const gridEl = document.getElementById("ws-grid");
  gridEl.querySelectorAll(".cell.sel").forEach(el=>el.classList.remove("sel"));
  WS.path = [];
  WS.startIdx = null;
}

function wsMarkPath(cls){
  const gridEl = document.getElementById("ws-grid");
  for(const [r,c] of WS.path){
    const i = r*WS.size + c;
    gridEl.children[i].classList.add(cls);
  }
}

function wsGetWordFromPath(){
  return WS.path.map(([r,c])=>WS.grid[r][c]).join("");
}

function wsNormalize(word){
  return word.toUpperCase().replace(/\s+/g,"");
}

function wsTryCommit(){
  const statusEl = document.getElementById("ws-status");
  const word = wsNormalize(wsGetWordFromPath());
  const rev = word.split("").reverse().join("");

  if(WS.words.includes(word) && !WS.found.has(word)){
    WS.found.add(word);
    wsMarkPath("hit");
    statusEl.innerHTML = `<span class="ok">¡Encontraste ${word}!</span>`;
    wsRender();
    wsBind(true);
  } else if(WS.words.includes(rev) && !WS.found.has(rev)){
    WS.found.add(rev);
    wsMarkPath("hit");
    statusEl.innerHTML = `<span class="ok">¡Encontraste ${rev}!</span>`;
    wsRender();
    wsBind(true);
  } else {
    statusEl.innerHTML = `<span class="bad">Esa no era. Probá con otra combinación.</span>`;
    wsClearSelection();
  }
}

function wsBind(rebindOnly=false){
  const gridEl = document.getElementById("ws-grid");
  const cells = gridEl.querySelectorAll(".cell");

  // Remove previous listeners by cloning (simple + reliable)
  if(!rebindOnly){
    // no-op
  }

  // Pointer events for mouse/touch
  let isDown=false;

  function onDown(e){
    const t = e.target.closest(".cell");
    if(!t) return;
    isDown=true;
    wsClearSelection();
    const r=+t.dataset.r, c=+t.dataset.c;
    WS.path=[[r,c]];
    t.classList.add("sel");
    e.preventDefault();
  }

  function onMove(e){
    if(!isDown) return;
    const point = (e.touches && e.touches[0]) ? e.touches[0] : e;
    const el = document.elementFromPoint(point.clientX, point.clientY);
    const t = el ? el.closest(".cell") : null;
    if(!t) return;

    const r=+t.dataset.r, c=+t.dataset.c;
    const last = WS.path[WS.path.length-1];
    if(last && last[0]===r && last[1]===c) return;

    // Enforce straight line after 2nd cell
    if(WS.path.length===1){
      WS.path.push([r,c]);
    } else {
      const [r0,c0]=WS.path[0];
      const [r1,c1]=WS.path[1];
      const dr = Math.sign(r1-r0);
      const dc = Math.sign(c1-c0);

      const expectedR = r0 + dr*(WS.path.length);
      const expectedC = c0 + dc*(WS.path.length);

      // Allow only contiguous in same direction
      if(r===expectedR && c===expectedC){
        WS.path.push([r,c]);
      } else {
        return;
      }
    }

    // Visual update
    gridEl.querySelectorAll(".cell.sel").forEach(el=>el.classList.remove("sel"));
    for(const [rr,cc] of WS.path){
      const i=rr*WS.size+cc;
      gridEl.children[i].classList.add("sel");
    }
    e.preventDefault();
  }

  function onUp(){
    if(!isDown) return;
    isDown=false;
    if(WS.path.length>=2) wsTryCommit();
    else wsClearSelection();
  }

  gridEl.onmousedown = onDown;
  gridEl.onmousemove = onMove;
  window.onmouseup = onUp;

  gridEl.ontouchstart = onDown;
  gridEl.ontouchmove = onMove;
  window.ontouchend = onUp;
}

// --- Crossword (mini) ---
const CW = {
  size: 9,
  // layout: null = block; otherwise letter target
  // We'll create a simple cross with 4 answers:
  // V1: NOE (col 4, rows 1-3)
  // V2: ARCOIRIS (col 2, rows 0-7)
  // H3: JOHNNY (row 5, col 1-6) crossing ARCOIRIS at row5 col2 (C)
  // H4: ROSENDO (row 3, col 1-7) crossing NOE at row3 col4 (E?) Actually NOE ends at row3 col4 with E.
  // We'll place NOE at r1-3 c4. ROSENDO at r3 c1-7 makes letter at c4 = E; ROSENDO[3]=E good.
  targets: [],
  inputs: new Map(), // "r,c" -> input element
};

function cwBuild(){
  const n=CW.size;
  // init blocks
  CW.targets = Array.from({length:n}, ()=> Array.from({length:n}, ()=> null));

  function setWord(word, r, c, dr, dc){
    for(let i=0;i<word.length;i++){
      CW.targets[r+dr*i][c+dc*i] = word[i];
    }
  }

  setWord("ARCOIRIS", 0, 2, 1, 0);
  setWord("JOHNNY", 3, 1, 0, 1);
  setWord("NOE", 3, 4, 1, 0);
  setWord("ROSENDO", 7, 0, 0, 1);

  const gridEl=document.getElementById("cw-grid");
  gridEl.innerHTML="";
  CW.inputs.clear();

  for(let r=0;r<n;r++){
    for(let c=0;c<n;c++){
      const cell=document.createElement("div");
      cell.className="cwCell" + (CW.targets[r][c] ? "" : " block");
      if(CW.targets[r][c]){
        const inp=document.createElement("input");
        inp.maxLength=1;
        inp.autocomplete="off";
        inp.inputMode="text";
        inp.ariaLabel=`Fila ${r+1}, columna ${c+1}`;
        inp.addEventListener("input", ()=>{
          inp.value = inp.value.toUpperCase();
          // auto-advance to next cell in row
          const next = cwNext(r,c);
          if(inp.value && next) next.focus();
        });
        cell.appendChild(inp);
        CW.inputs.set(idxKey(r,c), inp);
      }
      gridEl.appendChild(cell);
    }
  }

  // numbering
  const nums = [
    {n:1, r:3, c:4},
    {n:2, r:0, c:2},
    {n:3, r:3, c:1},
    {n:4, r:7, c:0},,
  ];
  nums.forEach(({n,r,c})=>{
    const i=r*CW.size+c;
    const cell=gridEl.children[i];
    if(cell && !cell.classList.contains("block")){
      const tag=document.createElement("div");
      tag.className="cwNum";
      tag.textContent=n;
      cell.appendChild(tag);
    }
  });

  document.getElementById("cw-msg").textContent="Tip: todo va en MAYÚSCULAS (como cuando Rosendo grita, pero con cariño).";
}

function cwNext(r,c){
  // next input in reading order
  const n=CW.size;
  for(let i=r*n + c + 1; i<n*n; i++){
    const rr=Math.floor(i/n), cc=i%n;
    const k=idxKey(rr,cc);
    if(CW.inputs.has(k)) return CW.inputs.get(k);
  }
  return null;
}

function cwReset(){
  const gridEl=document.getElementById("cw-grid");
  gridEl.querySelectorAll(".cwCell").forEach(el=>el.classList.remove("cwOk","cwBad"));
  CW.inputs.forEach(inp=>inp.value="");
  document.getElementById("cw-msg").textContent="Reiniciado.";
}

function cwCheck(){
  const gridEl=document.getElementById("cw-grid");
  let ok=0, total=0;
  for(let r=0;r<CW.size;r++){
    for(let c=0;c<CW.size;c++){
      const target = CW.targets[r][c];
      if(!target) continue;
      total++;
      const inp=CW.inputs.get(idxKey(r,c));
      const val=(inp.value||"").toUpperCase();
      const i=r*CW.size+c;
      const cell=gridEl.children[i];
      cell.classList.remove("cwOk","cwBad");
      if(val===target){
        ok++;
        cell.classList.add("cwOk");
      } else {
        cell.classList.add("cwBad");
      }
    }
  }
  const msg = ok===total
    ? "¡Perfecto! Te ganaste un rayito de sol."
    : `Vas ${ok}/${total}. Pista: ARCOIRIS tiene 8 letras; el resto, paciencia.`;
  document.getElementById("cw-msg").textContent = msg;
}

// --- Trivia ---
const TR = {
  questions: [
    {q:"¿Dónde ocurre la historia?", a:"Campo Alegre", opts:["Campo Alegre","Ciudad Nube","Monte Arcoíris","Granja Azul"]},
    {q:"¿Quién es el toro rojo gruñón pero adorable?", a:"Rosendo", opts:["Zoilo","Rosendo","Noé","Johnny"]},
    {q:"¿Quién cuenta la historia antigua?", a:"Johnny", opts:["Rosendo","Zoilo","Johnny","Noé"]},
    {q:"¿Qué construyó Noé?", a:"Un arca", opts:["Un puente","Un arca","Un molino","Una casa"]},
    {q:"¿Qué apareció en el cielo cuando la lluvia paró?", a:"Un arcoíris", opts:["Un cometa","Un arcoíris","Una luna gigante","Un globo"]},
    {q:"¿Cuántos animales de cada especie subieron al arca?", a:"Dos", opts:["Uno","Dos","Tres","Muchos"]},
  ],
  score: 0
};

function trRender(){
  const box=document.getElementById("triviaBox");
  const scoreEl=document.getElementById("tr-score");
  const statusEl=document.getElementById("tr-status");
  box.innerHTML="";
  TR.score=0;

  TR.questions.forEach((qq, idx)=>{
    const card=document.createElement("div");
    card.className="q";
    const h=document.createElement("h3");
    h.textContent = `${idx+1}. ${qq.q}`;
    card.appendChild(h);

    const opts=document.createElement("div");
    opts.className="opts";

    qq.opts.forEach((o, j)=>{
      const label=document.createElement("label");
      label.className="opt";
      const radio=document.createElement("input");
      radio.type="radio";
      radio.name=`q${idx}`;
      radio.value=o;

      radio.addEventListener("change", ()=>{
        // lock question after answer
        const all = card.querySelectorAll("input[type=radio]");
        all.forEach(r=>r.disabled=true);
        // mark
        const labels = card.querySelectorAll(".opt");
        labels.forEach(l=>{
          const v = l.querySelector("input").value;
          if(v===qq.a) l.classList.add("good");
          if(v===o && v!==qq.a) l.classList.add("bad");
        });
        if(o===qq.a) TR.score++;
        scoreEl.textContent = `${TR.score} / ${TR.questions.length}`;
        statusEl.textContent = TR.score===TR.questions.length
          ? "¡Excelente! Rosendo aprueba (con cara seria)."
          : "Seguimos: después de la tormenta, llega el acierto.";
      });

      const span=document.createElement("span");
      span.textContent=o;

      label.appendChild(radio);
      label.appendChild(span);
      opts.appendChild(label);
    });

    card.appendChild(opts);
    box.appendChild(card);
  });

  scoreEl.textContent = `0 / ${TR.questions.length}`;
  statusEl.textContent = "Elegí una opción por pregunta.";
}

// --- Busca y encuentra ---
function normalizeText(s){
  return (s||"")
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu,"");
}

function bfReset(){
  document.getElementById("bf1").value="";
  document.getElementById("bf2").value="";
  document.getElementById("bf3").value="";
  document.getElementById("bf4").value="";
  document.getElementById("bf-status").textContent="Completá y verificá.";
  document.getElementById("bf-score").textContent="0 / 4";
}

function bfCheck(){
  let ok=0;
  const a1 = normalizeText(document.getElementById("bf1").value);
  const a2 = normalizeText(document.getElementById("bf2").value);
  const a3 = normalizeText(document.getElementById("bf3").value);
  const a4 = normalizeText(document.getElementById("bf4").value);

  if(a1==="CAMPO ALEGRE" || a1==="CAMPOALEGRE") ok++;
  if(a2==="ZOILO") ok++;
  if(a3==="ARCA" || a3==="UN ARCA" || a3==="EL ARCA") ok++;
  if(a4==="DOS") ok++;

  document.getElementById("bf-score").textContent = `${ok} / 4`;

  const statusEl=document.getElementById("bf-status");
  if(ok===4){
    statusEl.innerHTML = '<span class="ok">¡Perfecto! Ahora sí: que salga el sol… con ganas.</span>';
  } else {
    statusEl.innerHTML = `<span class="bad">Vas ${ok}/4. Pista: Zoilo no se desespera… y vos tampoco.</span>`;
  }
}

// --- Init ---
document.addEventListener("DOMContentLoaded", ()=>{
  // Wordsearch
  document.getElementById("ws-new").addEventListener("click", wsBuild);
  wsBuild();

  // Crossword
  cwBuild();
  document.getElementById("cw-check").addEventListener("click", cwCheck);
  document.getElementById("cw-reset").addEventListener("click", cwReset);

  // Trivia
  trRender();
  document.getElementById("tr-retry").addEventListener("click", trRender);

  // Busca y encuentra
  document.getElementById("bf-check").addEventListener("click", bfCheck);
  document.getElementById("bf-reset").addEventListener("click", bfReset);
});
