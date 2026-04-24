window.quizActive = false;
window.gameRunning = false;
window.gameLoop = gameLoop;
let correct = 0;
let wrong = 0;
let topicStats = {}; // {subtopic: {c:0, w:0}}

window.questionsAsked = questionsAsked;
const MAX_QUESTIONS = 10;

let questions = [];     // ✅ stores all MCQs
window.currentQ = 0;       // ✅ pointer to current question

let askedQuestionsSet = new Set(); // (optional now, but kept)

// ================= SAFE JSON PARSE =================
function safeParse(txt){
  if(!txt) return null;

  // If it's already an object/array
if(typeof txt === "object") return txt;
  // Clean markdown
  let cleaned = txt
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch(e) {}

  // Extract JSON array
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if(start !== -1 && end !== -1){
    try{
      return JSON.parse(cleaned.slice(start, end + 1));
    }catch(e){}
  }

  console.error("❌ PARSE FAILED:", cleaned);
  return null;
}

// ================= GENERATE ALL QUESTIONS (ONE API CALL) =================
async function generateAllQuestions(topic){
  try{
    const content = window.studyContent || "";
    const parsed = null;

    if(false){ 

  questions = parsed
    .filter(q =>
      q.q &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.ans === "number"
    )
    .slice(0, MAX_QUESTIONS);

  if(questions.length > 0) return;
}

  }catch(e){
    console.error("❌ Batch MCQ generation failed:", e);
  }

  // fallback
  // fallback (REPLACED WITH REAL MCQs)
questions = [
  {
    q: "A function mainly returns:",
    options: ["Multiple values", "A single value", "No value", "Only text"],
    ans: 1,
    tag: "Functions & Procedures"
  },
  {
    q: "A procedure is used to:",
    options: ["Return a value", "Perform a task without returning a value", "Store data", "Create forms"],
    ans: 1,
    tag: "Functions & Procedures"
  },
  {
    q: "Which method is used to display a form?",
    options: ["Open()", "Show()", "Start()", "DisplayNow()"],
    ans: 1,
    tag: "Managing Forms"
  },
  {
    q: "Which event occurs when a form is first loaded?",
    options: ["Click", "Load", "Close", "Resize"],
    ans: 1,
    tag: "Managing Forms"
  },
  {
    q: "SDI stands for:",
    options: ["Single Document Interface", "Simple Data Interface", "System Data Integration", "Standard Document Input"],
    ans: 0,
    tag: "SDI vs MDI"
  },
  {
    q: "In MDI, multiple documents are:",
    options: ["Opened in separate windows", "Opened inside a parent window", "Not allowed", "Stored in database"],
    ans: 1,
    tag: "SDI vs MDI"
  },
  {
    q: "A control array is used to:",
    options: ["Store numbers", "Group similar controls together", "Create menus", "Design forms"],
    ans: 1,
    tag: "Control Arrays"
  },
  {
    q: "Controls in a control array share the same:",
    options: ["Color", "Event procedure", "Size", "Position"],
    ans: 1,
    tag: "Control Arrays"
  },
  {
    q: "Menus are mainly used for:",
    options: ["Data storage", "Navigation and commands", "Drawing graphics", "Debugging code"],
    ans: 1,
    tag: "Menu Management"
  },
  {
    q: "Which component is used to create menus?",
    options: ["Button", "Menu Editor", "Textbox", "Label"],
    ans: 1,
    tag: "Menu Management"
  }
];
}
// ================= TRIGGER QUIZ =================
function triggerQuiz(){

  if(window.currentQ >= questions.length) return;
  quizActive = true
  const q = questions[window.currentQ];
  window.currentQ++;
  window.questionsAsked++;

  const modal = document.getElementById("quizModal");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  showQuestion(q);
}

// ================= SHOW QUESTION =================
function showQuestion(q){
  const box = document.getElementById("quizContent");

  box.innerHTML = `<h2 style="margin-bottom:12px;">${q.q}</h2>`;

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.className = "primary";
    btn.style.display = "block";
    btn.style.margin = "10px 0";

    btn.onclick = () => {

  if(btn.disabled) return;

  document.querySelectorAll("#quizContent button")
    .forEach(b => b.disabled = true);
      const tag = q.tag || "General";

      if(!topicStats[tag]){
        topicStats[tag] = {c:0, w:0};
      }

      if(i === q.ans){
        correct++;
        topicStats[tag].c++;
        showNotification("Correct ✅");
      } else {
        wrong++;
        topicStats[tag].w++;
        showNotification("Wrong ❌");
      }

      if(window.questionsAsked >= MAX_QUESTIONS){
        window.gameRunning = false;
        window.quizActive = false;

        closeQuiz(true); // 👈 important
        endGameReport();
      } else {
        closeQuiz();
      }
    };

    box.appendChild(btn);
  });
}

// ================= CLOSE QUIZ =================
function closeQuiz(skipResume = false){
  const modal = document.getElementById("quizModal");

  modal.style.display = "none";
  document.body.style.overflow = "auto";

  const canvas = document.getElementById("gameCanvas");
  if(canvas) canvas.style.filter = "none";
  
  if(!skipResume){
    quizActive = false;
    gameRunning = true;
    requestAnimationFrame(window.gameLoop);
  }
}
function resetQuizState(){
  correct = 0;
  wrong = 0;
  topicStats = {};
  window.currentQ = 0;
  window.questionsAsked = 0;
}
window.triggerQuiz = triggerQuiz;