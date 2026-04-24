async function answerFromContent(question) {

  if (!window.extractedStudyText || window.extractedStudyText.trim() === "") {
    return {
      text: "Please upload and generate a study plan first."
    };
  }

  try {
    const response = await fetch("/api/answer", {  // ✅ FIXED
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        studyText: window.extractedStudyText
      })
    });

    const data = await response.json();

    console.log("AI RESPONSE:", data);

    // ✅ backend already sends clean { text }
    return {
      text: data.text || "No response received."
    };

  } catch (error) {
    console.error("AI assistant error:", error);
    return {
      text: "AI failed to generate answer."
    };
  }
}

window.answerFromContent = answerFromContent;