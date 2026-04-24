function endGameReport(){
  gameRunning = false;
  quizActive = false;

  // hide quiz modal
  const quizModal = document.getElementById("quizModal");
  quizModal.style.display = "none";

  // calculate stats FIRST
  const total = correct + wrong;
  const accuracy = total ? ((correct / total) * 100).toFixed(1) : 0;

  // show report modal
  const modal = document.getElementById("reportCard");
  const report = document.getElementById("reportContent");

  modal.style.display = "flex";

  report.innerHTML = `
    <h2>Session Complete 🎉</h2>
    <p>Total Questions: ${total}</p>
    <p>Correct: ${correct}</p>
    <p>Wrong: ${wrong}</p>
    <p>Accuracy: ${accuracy}%</p>

    <br>
    <div class="game-btns">
    <button class="game-btn btn-replay" onclick="restartGame()">🔁 Replay</button>
    <button class="game-btn btn-dashboard" onclick="goToDashboard()">🏠 Dashboard</button>
  </div>
  `;
}
function closeReport(){
  document.getElementById("reportCard").style.display = "none";

  // RESET GAME STATE
  correct = 0;
  wrong = 0;
  questionsAsked = 0;
  if (typeof askedQuestionsSet !== "undefined") {
  askedQuestionsSet.clear();
}
  topicStats = {};

  quizActive = false;
  gameRunning = false;

  if (typeof navigate === "function") {
  navigate("dashboard");
}
}

function goToDashboard(){
  closeReport();
}
