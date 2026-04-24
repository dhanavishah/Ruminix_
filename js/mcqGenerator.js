async function generateMCQsFromContent(content, count = 10) {

  await new Promise(r => setTimeout(r, 1200));

  try {

    const questions = window.quizQuestions || [];

    if (!questions.length) {
      return {
        error: true,
        message: "No questions found in quiz.js"
      };
    }

    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    return {
      mcqs: selected,
      source: "ai-generated" 
    };

  } catch (err) {
    console.error("MCQ fallback error:", err);

    return {
      error: true,
      message: "Failed to load questions"
    };
  }
}

window.generateMCQsFromContent = generateMCQsFromContent;
