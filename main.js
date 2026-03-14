// ===============================
// CONFIGURATION (FINAL)
// ===============================

const CONFIG = Object.freeze({

  BASE_SCORE: 50,          // Starting love score
  MAX_SCORE: 200,          // Max raw score limit
  MAX_SENTIMENT: 20,       // Sentiment cap

  NIGHT_START: 22,         // Night chat start hour
  NIGHT_END: 2,            // Night chat end hour

  DEBUG: false             // Enable debug logs

});


// ===============================
// SENTIMENT WORD LISTS
// ===============================

// Positive emotional words
const POSITIVE_WORDS = Object.freeze([
  "love","luv","miss","cute","sweet","good","nice",
  "acha","accha","achi","achha","sahi","mast",
  "wow","great","awesome","beautiful","handsome",
  "thank","thanks","thx","shukriya"
]);


// Negative emotional words
const NEGATIVE_WORDS = Object.freeze([
  "hate","angry","bad","annoying","boring",
  "gussa","bura","faltu","bekar","stupid"
]);


// Pet names (strong romantic indicators)
const PET_NAMES = Object.freeze([
  "baby",
  "jaan",
  "shona",
  "cutie",
  "meri jaan"
]);


// Flirt sentences / romantic phrases
const FLIRT_LINES = Object.freeze([
  "i miss you",
  "love you",
  "thinking about you",
  "cant wait to see you"
]);

// ===============================
// HELPERS (FINAL VERSION)
// ===============================

// Debug logger
function log(...args){
  if(CONFIG.DEBUG){
    console.log("[LoveAnalyzer]", ...args);
  }
}


// Status message updater
function setStatus(msg, isErr = false){

  const el = document.getElementById("status");

  if(!el) return;

  el.textContent = msg || "";

  el.style.color = isErr ? "#ef4444" : "#022";

}


// Safe HTML escape
function esc(str){

  if(str === null || str === undefined) return "";

  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}


// Clamp number between min & max
function clamp(v, min, max){

  if(Number.isNaN(v)) return min;

  return Math.max(min, Math.min(max, v));

}


// Average calculator
function avg(arr){

  if(!Array.isArray(arr) || arr.length === 0) return null;

  let sum = 0;

  for(let i = 0; i < arr.length; i++){
    sum += arr[i];
  }

  return sum / arr.length;

}


// Emoji counter
function countEmojis(text){

  if(!text) return 0;

  try{

    const matches =
      text.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu);

    return matches ? matches.length : 0;

  }catch{

    // fallback for unsupported browsers
    const fallback = text.match(/[\u{1F300}-\u{1FAFF}]/gu);

    return fallback ? fallback.length : 0;

  }

}

// ===============================
// SENTIMENT ENGINE (BROWSER SAFE)
// ===============================

let sentiment = null;
let sentimentReady = false;


// ===============================
// INITIALIZE SENTIMENT
// ===============================

function initSentiment(){

  // If external Sentiment library exists
  if(typeof Sentiment !== "undefined"){

    try{

      sentiment = new Sentiment();
      sentimentReady = true;

      console.log("✅ Sentiment NLP loaded");

      return;

    }catch(err){

      console.warn("⚠ Sentiment initialization failed:", err);

    }

  }

  // fallback
  sentimentReady = false;

}

initSentiment();


// ===============================
// FAST REGEX BUILD
// ===============================

const POSITIVE_REGEX =
new RegExp(`\\b(${POSITIVE_WORDS.join("|")})\\b`, "gi");

const NEGATIVE_REGEX =
new RegExp(`\\b(${NEGATIVE_WORDS.join("|")})\\b`, "gi");


// ===============================
// SIMPLE SENTIMENT FALLBACK
// ===============================

function simpleSentiment(text){

  if(!text) return 0;

  const positive = [
    "love","luv","miss","cute","sweet","nice",
    "good","great","awesome","beautiful",
    "thank","thanks","wow","mast","acha"
  ];

  const negative = [
    "hate","angry","bad","annoying","boring",
    "stupid","bekar","faltu"
  ];

  let score = 0;

  const words = text.toLowerCase().split(/\s+/);

  for(const w of words){

    if(positive.includes(w)) score += 2;
    if(negative.includes(w)) score -= 2;

  }

  return score;

}


// ===============================
// FINAL SENTIMENT SCORING ENGINE
// ===============================

function sentimentScore(text){

  if(!text) return 0;

  let score = 0;

  const lower = text.toLowerCase();


  // =====================
  // 1️⃣ NLP Sentiment
  // =====================

  if(sentimentReady && sentiment){

    try{

      const result = sentiment.analyze(lower);

      if(result && typeof result.score === "number"){
        score += result.score;
      }

    }catch(err){

      console.warn("Sentiment analyze failed:", err);

    }

  }else{

    // fallback sentiment
    score += simpleSentiment(lower);

  }


  // =====================
  // 2️⃣ Emoji sentiment
  // =====================

  score += countEmojis(text);


  // =====================
  // 3️⃣ Hindi / Hinglish
  // =====================

  const positiveMatches = lower.match(POSITIVE_REGEX);
  const negativeMatches = lower.match(NEGATIVE_REGEX);

  if(positiveMatches){
    score += positiveMatches.length * 2;
  }

  if(negativeMatches){
    score -= negativeMatches.length * 2;
  }

  return score;

}

// ===============================
// DATE PARSER (FINAL)
// ===============================

function tryParseDate(ds, ts){

  if(!ds && !ts) return null;

  const attempts = [];

  if(ds && ts) attempts.push(`${ds} ${ts}`);
  if(ds) attempts.push(ds);

  const parts = (ds || "").match(/\d+/g) || [];

  // swap day/month fallback
  if(parts.length >= 3){
    attempts.push(`${parts[1]}/${parts[0]}/${parts[2]} ${ts || ""}`);
  }

  for(const attempt of attempts){

    const parsed = Date.parse(attempt);

    if(!isNaN(parsed)){
      return new Date(parsed);
    }

  }

  return null;
}



// ===============================
// FILE READERS
// ===============================


// PDF → TEXT
async function pdfToText(file){

  if(!window.pdfjsLib){
    throw new Error("PDF.js library not loaded");
  }

  const buffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = "";

  for(let i = 1; i <= pdf.numPages; i++){

    const page = await pdf.getPage(i);

    const content = await page.getTextContent();

    const pageText = content.items
      .map(item => item.str)
      .join(" ");

    text += pageText + "\n";
  }

  return text;
}



// TXT → TEXT
async function txtToText(file){

  if(!file){
    throw new Error("TXT file missing");
  }

  return await file.text();
}



// IMAGE → TEXT (OCR)
async function imageToText(file){

  if(!window.Tesseract){
    throw new Error("Tesseract OCR library not loaded");
  }

  const result = await Tesseract.recognize(
    file,
    "eng",
    {
      logger: m => console.log(m)
    }
  );

  return result?.data?.text || "";
}



// ZIP → Extract chat
async function extractZip(file){

  if(!window.JSZip){
    throw new Error("JSZip library not loaded");
  }

  const zip = await JSZip.loadAsync(file);

  let chatText = "";

  for(const name in zip.files){

    const entry = zip.files[name];

    if(entry.dir) continue;

    const lower = name.toLowerCase();

    // find WhatsApp chat file
    if(lower.endsWith(".txt")){

      const content = await entry.async("string");

      chatText += content + "\n";

    }

  }

  return chatText;
}

// ===============================
// MESSAGE PARSER (ADVANCED FINAL)
// ===============================

// WhatsApp / generic chat patterns
const patterns = [

/(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APMapm]{2})?)\s*-\s*([^:]+):\s*(.*)$/,

/(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})\s+(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.*)$/,

/^\[?(\d{1,2}:\d{2})\]?\s*-?\s*([^:]+):\s*(.*)$/,

/^([^:]{1,140}):\s*(.*)$/

];



function parseMessages(text){

  if(!text) return [];

  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const msgs = [];

  let lastMessage = null;

  for(let i = 0; i < lines.length; i++){

    const line = lines[i];

    let matched = false;

    for(const pattern of patterns){

      const match = line.match(pattern);

      if(!match) continue;

      matched = true;

      let ds = null;
      let ts = null;
      let name = "";
      let msg = "";

      // =====================
      // Pattern decoding
      // =====================

      if(match.length >= 4){

        // date + time
        if(/\d[\/\-\.\s]\d/.test(match[1]) && /\d:\d/.test(match[2])){

          ds = match[1];
          ts = match[2];
          name = (match[3] || "").trim();
          msg = (match[4] || "").trim();

        }

        // time only
        else if(/\d:\d/.test(match[1])){

          ts = match[1];
          name = (match[2] || "").trim();
          msg = (match[3] || "").trim();

        }

        // name: message
        else{

          name = (match[1] || "").trim();
          msg = (match[2] || "").trim();

        }

      }

      const timestamp = tryParseDate(ds, ts);

      const message = {

        ts: timestamp,
        name: name || "[unknown]",
        text: msg,
        sentiment: sentimentScore(msg),
        rawIndex: i

      };

      msgs.push(message);

      lastMessage = message;

      break;
    }

    // =====================
    // Multiline message
    // =====================

    if(!matched && lastMessage){

      lastMessage.text += " " + line;

      // update sentiment after merge
      lastMessage.sentiment =
        sentimentScore(lastMessage.text);

    }

  }

  return msgs;

}

// ===============================
// AI LOVE MODEL (ADVANCED)
// ===============================

let loveModel = null;
let modelReady = false;

async function initLoveAI(){

  try{

    loveModel = tf.sequential({

      layers:[

        tf.layers.dense({
          inputShape:[8],
          units:32,
          activation:'relu'
        }),

        tf.layers.dropout({rate:0.15}),

        tf.layers.dense({
          units:16,
          activation:'relu'
        }),

        tf.layers.dropout({rate:0.1}),

        tf.layers.dense({
          units:8,
          activation:'relu'
        }),

        tf.layers.dense({
          units:1,
          activation:'sigmoid'
        })

      ]

    });

    loveModel.compile({

      optimizer:tf.train.adam(0.001),

      loss:'binaryCrossentropy',

      metrics:['accuracy']

    });

    modelReady = true;

    log("AI Love Model initialized");

  }catch(err){

    console.warn("AI model initialization failed",err);

    modelReady = false;

  }

}

initLoveAI();

// ===============================
// ADVANCED FEATURE EXTRACTION
// ===============================

function extractAdvancedFeatures(msgs, targetKey, users){

  const u = users[targetKey];

  if(!u){
    return new Float32Array(8).fill(0);
  }

  const safeCount = Math.max(1,u.count);

  const avgReply = avg(u.replyTimes) || 60;

  // ======================
  // Feature Engineering
  // ======================

  const messageDepth =
    clamp((u.words / safeCount) / 25,0,1);

  const emojiRatio =
    clamp(u.emojis / safeCount,0,1);

  const flirtingRatio =
    clamp(u.flirting / safeCount,0,1);

  const careRatio =
    clamp(u.caring / safeCount,0,1);

  const nightRatio =
    clamp(u.night / safeCount,0,1);

  const consistency =
    clamp(u.days.size / 30,0,1);

  const replySpeed =
    clamp(1 / avgReply,0,1);

  const chatVolume =
    clamp(u.words / 1500,0,1);

  // ======================
  // Feature Vector
  // ======================

  const features = new Float32Array([

    replySpeed,
    emojiRatio,
    messageDepth,
    flirtingRatio,
    careRatio,
    nightRatio,
    consistency,
    chatVolume

  ]);

  return features;

}

// ===============================
// MAIN LOVE ANALYSIS ENGINE (FINAL)
// ===============================

function computeLove(msgs, targetName){

  if(!Array.isArray(msgs) || !msgs.length){
    return { targetKey:null };
  }

  const targetNorm = (targetName || "").toLowerCase().trim();

  const users = {};
  const hourly = new Array(24).fill(0);

  const flirtWords = [
    "love you","miss you","baby","jaan","shona","cutie","dear"
  ];

  const careWords = [
    "khana khaya",
    "take care",
    "so gaye",
    "drive safe",
    "reach home",
    "good night",
    "good morning"
  ];

  const flirtEmoji = ["😘","😍","🥰","❤️","💋","😉","💕","💞","🎉","😃","😏","🤒"];

  // ==========================
  // BUILD USER DATA
  // ==========================

  for(const m of msgs){

    const name = (m.name || "").trim() || "[unknown]";

    if(!users[name]){

      users[name] = {
        name,
        count:0,
        words:0,
        emojis:0,
        replyTimes:[],
        days:new Set(),
        flirting:0,
        caring:0,
        night:0
      };

    }

    const u = users[name];

    const text = m.text || "";

    u.count++;

    u.words += text.split(/\s+/).length;

    u.emojis += countEmojis(text);

    if(m.ts){

      const h = m.ts.getHours();

      hourly[h]++;

      u.days.add(m.ts.toDateString());

      if(h >= CONFIG.NIGHT_START || h < CONFIG.NIGHT_END){
        u.night++;
      }

    }

    const txt = text.toLowerCase();

    // flirting keywords
    for(const w of flirtWords){
      if(txt.includes(w)) u.flirting++;
    }

    // caring signals
    for(const w of careWords){
      if(txt.includes(w)) u.caring++;
    }

    // flirting emoji
    for(const e of flirtEmoji){
      if(txt.includes(e)) u.flirting++;
    }

    // pet names
    for(const p of PET_NAMES){
      if(txt.includes(p)) u.flirting += 2;
    }

    // flirt lines
    for(const p of FLIRT_LINES){
      if(txt.includes(p)) u.flirting += 2;
    }

  }


  // ==========================
  // FIND TARGET USER
  // ==========================

  const targetKey = Object.keys(users).find(k=>{

    const name = k.toLowerCase();

    return name === targetNorm || name.includes(targetNorm);

  });

  if(!targetKey){
    return { targetKey:null };
  }

  const t = users[targetKey];

  const others = Object.keys(users).filter(k=>k!==targetKey);

  const youKey =
    others.sort((a,b)=>users[b].count-users[a].count)[0];

  const you = users[youKey] || {count:1};


  // ==========================
  // REPLY SPEED
  // ==========================

  for(let i=0;i<msgs.length-1;i++){

    const a = msgs[i];
    const b = msgs[i+1];

    if(!a.ts || !b.ts) continue;

    if(a.name !== b.name){

      const mins = (b.ts - a.ts) / 60000;

      if(b.name === targetKey){
        t.replyTimes.push(mins);
      }

    }

  }

  const avgReply = avg(t.replyTimes) || 60;

  let R = 3;

  if(avgReply < 1) R = 15;
  else if(avgReply < 5) R = 12;
  else if(avgReply < 15) R = 9;
  else if(avgReply < 60) R = 6;


  // ==========================
  // MESSAGE BALANCE
  // ==========================

  const ratio =
    Math.min(t.count,you.count) /
    Math.max(t.count,you.count);

  const B = clamp(ratio * 15,0,15);


  // ==========================
  // MESSAGE DEPTH
  // ==========================

  const avgWords = t.words / Math.max(1,t.count);

  let D = 3;

  if(avgWords > 12) D = 12;
  else if(avgWords > 8) D = 9;
  else if(avgWords > 5) D = 6;


  // ==========================
  // FLIRTING SIGNALS
  // ==========================

  const F = clamp(t.flirting * 2,0,15);


  // ==========================
  // ATTACHMENT SIGNALS
  // ==========================

  const A = clamp(t.caring * 2,0,10);


  // ==========================
  // CONSISTENCY
  // ==========================

  const timestamps = msgs
    .filter(m=>m.ts)
    .map(m=>m.ts.getTime());

  let C = 0;

  if(timestamps.length){

    const spanDays = Math.max(
      1,
      Math.ceil(
        (Math.max(...timestamps) -
        Math.min(...timestamps)) / 86400000
      )
    );

    C = clamp((t.days.size / spanDays) * 10,0,10);

  }


  // ==========================
  // NIGHT CHAT BONDING
  // ==========================

  const N = clamp(t.night / 10,0,10);


  // ==========================
  // SENTIMENT
  // ==========================

  let sentimentTotal = 0;

  for(const m of msgs){
    if(m.name === targetKey){
      sentimentTotal += m.sentiment || 0;
    }
  }

  const S =
    clamp(sentimentTotal / (t.count * 1.5),0,10);


  // ==========================
  // SESSION DETECTION
  // ==========================

  let longSessions = 0;
  let session = 1;

  for(let i=1;i<msgs.length;i++){

    const prev = msgs[i-1];
    const cur = msgs[i];

    if(prev.ts && cur.ts){

      const gap = (cur.ts - prev.ts) / 60000;

      if(gap < 10){
        session++;
      }
      else{

        if(session > 20) longSessions++;

        session = 1;

      }

    }

  }

  if(session > 20) longSessions++;

  const sessionScore = clamp(longSessions * 2,0,10);


  // ==========================
  // FINAL SCORE
  // ==========================

  const behaviorScore =
    R + B + D + F + A + C + N + S + sessionScore;

  const lovePercent =
    Math.round(clamp(behaviorScore,0,100));


  return {

    users,
    hourly,
    targetKey,

    components:{
      replySpeed:R,
      balance:B,
      depth:D,
      flirting:F,
      attachment:A,
      consistency:C,
      nightBonding:N,
      sentiment:S,
      sessionBonding:sessionScore
    },

    lovePercent

  };

}

// ===============================
// AI LOVE PREDICTION (ADVANCED)
// ===============================

async function predictLoveAI(msgs, targetKey, users){

  if(!loveModel || !modelReady){
    return 0;
  }

  try{

    const features =
      extractAdvancedFeatures(msgs,targetKey,users);

    if(!features || features.length !== 8){
      return 0;
    }

    const predictionValue = tf.tidy(()=>{

      const input =
        tf.tensor2d([Array.from(features)], [1,8]);

      const output =
        loveModel.predict(input);

      const value =
        output.dataSync()[0];

      return value;

    });

    const percent =
      Math.round(clamp(predictionValue * 100,0,100));

    return percent;

  }catch(err){

    console.warn("AI prediction failed",err);

    return 0;

  }

}



// ===============================
// HYBRID FINAL PREDICTION
// ===============================

async function computeLoveAdvanced(msgs,target){

  const result = computeLove(msgs,target);

  if(!result || !result.targetKey){
    return result;
  }

  try{

    const aiScore =
      await predictLoveAI(
        msgs,
        result.targetKey,
        result.users
      );

    const behaviorScore =
      result.lovePercent;

    // hybrid scoring
    const finalScore = Math.round(

      behaviorScore * 0.85 +
      aiScore * 0.15

    );

    result.lovePercent =
      clamp(finalScore,0,100);

    result.aiScore = aiScore;

  }catch(err){

    console.warn("AI fallback activated",err);

  }

  return result;

}

// ===============================
// ULTIMATE LOVE SCORE (ADVANCED)
// ===============================

async function computeUltimateLove(msgs,target){

  const result =
    await computeLoveAdvanced(msgs,target);

  if(!result || !result.targetKey){
    return result;
  }

  try{

    const chemistry =
      conversationChemistry(
        result.users,
        result.targetKey
      );

    const compatibility =
      compatibilityScore(
        result.users,
        result.targetKey
      );

    // hybrid weighted scoring
    const finalScore = Math.round(

      result.lovePercent * 0.60 +
      chemistry * 0.25 +
      compatibility * 0.15

    );

    result.lovePercent =
      clamp(finalScore,0,100);

    result.chemistry =
      clamp(chemistry,0,100);

    result.compatibility =
      clamp(compatibility,0,100);

  }catch(err){

    console.warn(
      "Ultimate score fallback",
      err
    );

  }

  return result;

}



// ===============================
// UI PREVIEW (ADVANCED)
// ===============================

function renderPreview(msgs){

  const box =
    document.getElementById("preview");

  if(!box) return;

  box.innerHTML = "";

  if(!Array.isArray(msgs) || !msgs.length){

    box.innerHTML =
      "<div class='small'>No messages parsed.</div>";

    return;

  }

  const table =
    document.createElement("table");

  table.innerHTML =
    `<thead>
      <tr>
        <th>#</th>
        <th>Time</th>
        <th>Name</th>
        <th>Message</th>
      </tr>
     </thead>`;

  const tbody =
    document.createElement("tbody");


  // limit preview for performance
  const previewLimit = Math.min(msgs.length,200);

  for(let i=0;i<previewLimit;i++){

    const m = msgs[i];

    const tr =
      document.createElement("tr");

    const time =
      m.ts
        ? new Date(m.ts).toLocaleString()
        : "";

    const text =
      esc((m.text || "").slice(0,120));

    tr.innerHTML =
      `<td>${i+1}</td>
       <td>${time}</td>
       <td>${esc(m.name)}</td>
       <td>${text}</td>`;

    tbody.appendChild(tr);

  }

  table.appendChild(tbody);

  box.appendChild(table);

}

// ===============================
// CHART ENGINE (PREMIUM)
// ===============================

function renderDominance(users){

  const canvas =
    document.getElementById("dominanceChart");

  if(!canvas) return null;

  const ctx = canvas.getContext("2d");

  // destroy old chart safely
  if(canvas.chart){
    canvas.chart.destroy();
  }

  const names = Object.keys(users);
  const counts = names.map(n => users[n].count);

  const total =
    Math.max(1, counts.reduce((a,b)=>a+b,0));

  // premium color palette
  const colors = [
    "#06b6d4",
    "#10b981",
    "#6366f1",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
    "#ef4444"
  ];

  const backgroundColors =
    names.map((_,i)=>colors[i % colors.length]);

  const chart = new Chart(ctx,{

    type:"doughnut",

    data:{

      labels:names,

      datasets:[{

        data:counts,

        backgroundColor:backgroundColors,

        borderColor:"#ffffff",

        borderWidth:2,

        hoverOffset:12

      }]

    },

    options:{

      responsive:true,

      maintainAspectRatio:false,

      cutout:"65%",

      animation:{
        animateRotate:true,
        duration:1200,
        easing:"easeOutQuart"
      },

      plugins:{

        legend:{
          position:"bottom",

          labels:{
            padding:18,
            usePointStyle:true,
            pointStyle:"circle",
            font:{
              size:13
            }
          }

        },

        tooltip:{

          backgroundColor:"#0f172a",

          titleColor:"#fff",

          bodyColor:"#fff",

          padding:12,

          callbacks:{

            label(context){

              const value = context.raw;

              const percent =
                ((value / total) * 100)
                .toFixed(1);

              return `${context.label}: ${value} messages (${percent}%)`;

            }

          }

        }

      }

    }

  });

  canvas.chart = chart;

  return chart;

}

// ===============================
// CHAT CHEMISTRY ANALYSIS (ADVANCED)
// ===============================

function conversationChemistry(users, targetKey){

  const u = users?.[targetKey];

  if(!u){
    return 0;
  }

  const safeCount =
    Math.max(1, u.count);

  const depth =
    clamp((u.words / safeCount) / 20, 0, 1);

  const emotion =
    clamp((u.flirting + u.caring) / safeCount, 0, 1);

  const energy =
    clamp(u.emojis / safeCount, 0, 1);

  const chemistry =
    Math.round((depth + emotion + energy) / 3 * 100);

  return clamp(chemistry,0,100);

}



// ===============================
// FLIRTING DETECTOR (ADVANCED)
// ===============================

const FLIRT_PATTERNS = [

  "love you",
  "miss you",
  "thinking about you",
  "come here",
  "baby",
  "jaan",
  "cutie"

];

function detectFlirting(msgs, targetKey){

  if(!Array.isArray(msgs)) return 0;

  let count = 0;

  for(const m of msgs){

    if(m.name !== targetKey) continue;

    const txt =
      (m.text || "").toLowerCase();

    for(const p of FLIRT_PATTERNS){

      if(txt.includes(p)){
        count++;
      }

    }

  }

  const score =
    Math.round((count / 10) * 100);

  return clamp(score,0,100);

}



// ===============================
// COMPATIBILITY ENGINE (ADVANCED)
// ===============================

function compatibilityScore(users, targetKey){

  const u = users?.[targetKey];

  if(!u){
    return 0;
  }

  const safeCount =
    Math.max(1, u.count);

  const emotional =
    clamp(u.caring / safeCount, 0, 1);

  const romantic =
    clamp(u.flirting / safeCount, 0, 1);

  const engagement =
    clamp((u.words / safeCount) / 20, 0, 1);

  const compatibility =
    Math.round(
      (emotional + romantic + engagement) / 3 * 100
    );

  return clamp(compatibility,0,100);

}

// ===============================
// MAIN APP (PRODUCTION VERSION)
// ===============================

let chartInstances = [];

document.getElementById("analyze").addEventListener("click", async () => {

  const fileInput = document.getElementById("file");
  const targetInput = document.getElementById("target");

  const files = Array.from(fileInput.files || []);
  const target = (targetInput.value || "").trim();

  const preview = document.getElementById("preview");
  const report = document.getElementById("report");
  const badge = document.getElementById("badge");

  // ===============================
  // UI RESET
  // ===============================

  preview.innerHTML = "";
  badge.textContent = "Love —";
  report.style.display = "none";

  chartInstances.forEach(c=>{
    try{ c.destroy(); }catch{}
  });
  chartInstances = [];

  document.querySelectorAll(".dynamic-card").forEach(el=>el.remove());

  // ===============================
  // VALIDATION
  // ===============================

  if(!files.length){
    setStatus("Please upload a chat file.",true);
    return;
  }

  if(!target){
    setStatus("Enter target name.",true);
    return;
  }

  setStatus("Preparing files...");

  try{

    let combinedText = "";

    // ===============================
    // FILE PROCESSOR
    // ===============================

    const processFile = async(file)=>{

      const name = (file.name || "").toLowerCase();

      try{

        if(name.endsWith(".zip")){
          setStatus(`Extracting ${file.name}`);
          return await extractZip(file);
        }

        if(name.endsWith(".pdf") || file.type === "application/pdf"){
          setStatus(`Reading ${file.name}`);
          return await pdfToText(file);
        }

        if(name.endsWith(".txt") || file.type === "text/plain"){
          return await txtToText(file);
        }

        if(/\.(png|jpg|jpeg|webp)$/i.test(name)){
          setStatus(`OCR scanning ${file.name}`);
          return await imageToText(file);
        }

        return "";

      }catch(err){

        console.warn("File processing failed:",file.name);
        return "";

      }

    };

    // ===============================
    // READ FILES
    // ===============================

    const texts =
      await Promise.all(files.map(processFile));

    combinedText =
      texts.join("\n");

    if(!combinedText.trim()){
      setStatus("No readable chat text found.",true);
      return;
    }

    // ===============================
    // PARSE CHAT
    // ===============================

    setStatus("Parsing chat...");

    const msgs =
      parseMessages(combinedText);

    if(!msgs.length){
      setStatus("Chat parsing failed.",true);
      return;
    }

    renderPreview(msgs);

    // ===============================
    // ANALYSIS
    // ===============================

    setStatus(`Running analysis on ${msgs.length} messages...`);

    const result =
      await computeLoveAdvanced(msgs,target);

    if(!result || !result.targetKey){
      setStatus("Target name not found.",true);
      return;
    }

    // ===============================
    // PREMIUM METRICS
    // ===============================

    const emotionalIntensity =
      clamp(result.components.flirting +
      result.components.attachment,0,25);

    const conversationQuality =
      clamp(result.components.depth +
      result.components.sentiment,0,20);

    const responseConsistency =
      clamp(result.components.replySpeed +
      result.components.consistency,0,20);

    // ===============================
    // SHOW REPORT
    // ===============================

    report.style.display="block";

    chartInstances.push(
      renderDominance(result.users)
    );

    // ===============================
    // LOVE SCORE BADGE
    // ===============================

    badge.innerHTML = `
    <div style="font-size:24px;font-weight:700">
      ❤️ Love Score: ${result.lovePercent}%
    </div>
    <div style="font-size:13px;margin-top:2px;margin-left:25px">
      ${getLoveMeaning(result.lovePercent)}
    </div>
    `;

    // ===============================
    // HELPER CARD FUNCTION
    // ===============================

    function addCard(title,content){

      const card =
        document.createElement("div");

      card.className="card dynamic-card";
      card.style.marginTop="15px";

      card.innerHTML =
      `<h3>${title}</h3>${content}`;

      report.appendChild(card);

    }

    // ===============================
    // CARDS
    // ===============================

    addCard(
      "💡 Love Score Breakdown",
      `
      Reply Speed: ${result.components.replySpeed}/15 <br>
      Message Balance: ${result.components.balance}/15 <br>
      Message Depth: ${result.components.depth}/12 <br>
      Flirting Signals: ${result.components.flirting}/15 <br>
      Attachment Signals: ${result.components.attachment}/10 <br>
      Consistency: ${result.components.consistency}/10 <br>
      Night Bonding: ${result.components.nightBonding}/10 <br>
      Sentiment: ${result.components.sentiment}/10
      `
    );

    addCard(
      "⭐ Premium Relationship Insights",
      `
      Emotional Intensity: ${emotionalIntensity}/25 <br>
      Conversation Quality: ${conversationQuality}/20 <br>
      Response Consistency: ${responseConsistency}/20
      `
    );

    addCard(
      "🧠 Relationship Stage",
      `<p>${relationshipStage(result.lovePercent)}</p>`
    );

    const flirting =
      Math.min(100,
      Math.round(result.lovePercent*1.25));

    addCard(
      "❤️ Flirting Probability",
      `<p style="font-size:18px;font-weight:600">${flirting}%</p>`
    );

    addCard(
      "🤝 Attachment Level",
      `<p>${attachmentLevel(result.components.attachment)}</p>`
    );

    addCard(
      "💗 Relationship Health",
      `<p>${relationshipHealth(result.lovePercent)}</p>`
    );

    addCard(
      "📊 Relationship Stability",
      `<p>${relationshipStability(result.lovePercent)}</p>`
    );
    
    addCard(
      "⚠ Breakup Risk",
      `<p>${breakupRisk(result.lovePercent)}</p>`
    );

    addCard(
       "🚦 Relationship Signals",
       `
       <ul style="margin:0;padding-left:18px;line-height:1.6">

        <li>
            ${result.components.replySpeed > 10
            ? "⚡ Very fast replies — strong engagement"
            : result.components.replySpeed > 6
            ? "🙂 Reasonably quick replies"
            : "⚠ Slow reply behavior"}
        </li>

        <li>
           ${result.components.flirting > 10
           ? "💘 Heavy flirting signals detected"
           : result.components.flirting > 6
           ? "😊 Moderate flirting behavior"
           : "👋 Minimal flirting interaction"}
        </li>

        <li>
           ${result.components.attachment > 7
           ? "🤝 Strong caring & emotional support"
           : result.components.attachment > 4
           ? "🙂 Some caring behavior detected"
           : "❄️ Limited emotional signals"}
        </li>

        <li>
           ${result.components.nightBonding > 5
           ? "🌙 Frequent late-night conversations"
           : "🕒 Mostly daytime chatting"}
        </li>

        <li>
           ${result.components.sentiment > 6
           ? "💬 Highly positive emotional tone"
           : result.components.sentiment > 3
           ? "🙂 Neutral conversation tone"
           : "⚠ Negative sentiment detected"}
        </li>

       </ul>
        `
    );

    setStatus("Prediction complete ✅");

  }catch(error){

    console.error("Analysis failed:",error);

    setStatus("Unexpected error occurred.",true);

  }

});

// ===============================
// ATTACHMENT LEVEL (ADVANCED)
// ===============================

function attachmentLevel(score){

  score = clamp(Number(score) || 0,0,100);

  if(score >= 90)
    return "💞 Deep emotional attachment — strong caring signals detected";

  if(score >= 70)
    return "❤️ High emotional care — partner shows consistent concern";

  if(score >= 50)
    return "🙂 Moderate emotional connection — occasional care signals";

  if(score >= 30)
    return "👋 Light emotional interaction — limited caring behaviour";

  return "❄️ Very weak attachment — almost no emotional signals";
}


// ===============================
// LOVE SCORE MEANING
// ===============================

function getLoveMeaning(score){

  score = clamp(Number(score) || 0,0,100);

  if(score >= 90)
    return "🔥 Extremely strong romantic attraction";

  if(score >= 80)
    return "💘 Very high romantic interest";

  if(score >= 70)
    return "❤️ Clear romantic attraction";

  if(score >= 60)
    return "😊 Strong emotional interest";

  if(score >= 50)
    return "🙂 Possible attraction";

  if(score >= 40)
    return "🤝 Friendly interaction";

  if(score >= 30)
    return "👋 Mostly casual conversation";

  return "❄️ Very low emotional interest";
}


// ===============================
// RELATIONSHIP STAGE
// ===============================

function relationshipStage(score){

  score = clamp(Number(score) || 0,0,100);

  if(score >= 90)
    return "💍 Deep Romantic Stage";

  if(score >= 80)
    return "💘 Strong Romantic Stage";

  if(score >= 70)
    return "❤️ Developing Romantic Bond";

  if(score >= 60)
    return "💬 Active Flirting Stage";

  if(score >= 50)
    return "🙂 Emotional Connection Stage";

  if(score >= 40)
    return "👫 Friendly Stage";

  if(score >= 30)
    return "👋 Casual Interaction Stage";

  return "🚫 Low Interaction Stage";
}


// ===============================
// RELATIONSHIP HEALTH
// ===============================

function relationshipHealth(score){

  score = clamp(Number(score) || 0,0,100);

  if(score >= 90)
    return "💎 Exceptional relationship health — very strong emotional and conversational bond";

  if(score >= 80)
    return "💞 Very healthy relationship — strong emotional balance";

  if(score >= 70)
    return "❤️ Healthy interaction — positive communication pattern";

  if(score >= 60)
    return "🙂 Stable emotional connection — moderate bonding";

  if(score >= 50)
    return "🤝 Average relationship health";

  if(score >= 40)
    return "⚠ Weak emotional connection";

  return "❄️ Unhealthy relationship dynamics";
}


// ===============================
// RELATIONSHIP STABILITY INDEX
// ===============================

function relationshipStability(score){

  score = clamp(Number(score) || 0,0,100);

  if(score >= 85)
    return "🟢 Extremely stable connection";

  if(score >= 70)
    return "🟢 Stable relationship pattern";

  if(score >= 55)
    return "🟡 Moderately stable interaction";

  if(score >= 40)
    return "🟠 Unstable communication pattern";

  return "🔴 Very unstable interaction";
}


// ===============================
// BREAKUP RISK DETECTOR
// ===============================

function breakupRisk(score){

  score = clamp(Number(score) || 0,0,100);

  if(score >= 80)
    return "🟢 Very low breakup risk";

  if(score >= 65)
    return "🟢 Stable relationship";

  if(score >= 50)
    return "🟡 Moderate stability";

  if(score >= 40)
    return "🟠 Relationship instability";

  return "🔴 High breakup probability";
}

// ===============================
// SMART ENTER ANALYZE TRIGGER
// ===============================

(function(){

  const ANALYZE_ID = "analyze";
  const TARGET_INPUT_ID = "target";

  let lastTrigger = 0;

  document.addEventListener("keydown",(e)=>{

    // only Enter key
    if(e.key !== "Enter") return;

    // prevent repeated trigger
    const now = Date.now();
    if(now - lastTrigger < 500) return;

    const active = document.activeElement;

    // ignore textarea
    if(active && active.tagName === "TEXTAREA") return;

    // allow only specific inputs
    if(active){

      const allowedInputs = ["INPUT"];

      if(!allowedInputs.includes(active.tagName)) return;

      // if input exists but not target input
      if(active.id !== TARGET_INPUT_ID) return;

    }

    const btn = document.getElementById(ANALYZE_ID);

    if(!btn) return;

    // ignore disabled buttons
    if(btn.disabled) return;

    e.preventDefault();

    lastTrigger = now;

    // visual feedback
    btn.classList.add("active-enter-trigger");

    setTimeout(()=>{
      btn.classList.remove("active-enter-trigger");
    },150);

    btn.click();

  });

})();