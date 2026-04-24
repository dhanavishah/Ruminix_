const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const path = require("path");

// ✅ Fix fetch for Node <18
const fetch = global.fetch || require("node-fetch");

const app = express();

app.use(express.json());

// ✅ Serve static files safely
app.use(express.static(path.join(__dirname)));

const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_KEY) {
  console.error("❌ GEMINI KEY NOT FOUND IN .env");
  process.exit(1);
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/* -------------------- ROUTES -------------------- */

// ✅ Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ Page routes (clean URLs)
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "register.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "profile.html"));
});

/* -------------------- ANSWER ROUTE -------------------- */
app.post("/api/answer", async (req, res) => {
  try {
    const { question = "", studyText = "" } = req.body;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
You are a study assistant.

Answer using ONLY the study material.

Study Material:
${studyText.slice(0, 2000)}

Question:
${question}
`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    console.log("ANSWER API RESPONSE:", data);

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No answer generated.";

    res.json({ text: raw });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ error: "Backend failed" });
  }
});

/* -------------------- TOPICS ROUTE -------------------- */
app.post("/api/topics", async (req, res) => {
  try {
    const { text = "" } = req.body;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
You are an academic study planner AI.

Analyze the study material and:

1. Identify 5–8 major topics
2. Break each into 2–4 subtopics
3. Suggest number of Pomodoro sessions

Return STRICT JSON:

[
  {
    "topic": "Topic Name",
    "subtopics": ["Sub1", "Sub2"],
    "pomodoros": 3
  }
]

Study Material:
${text.slice(0, 800)}
`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    console.log("TOPICS API RESPONSE:", data);

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // ✅ Clean markdown JSON
    let cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      res.json(JSON.parse(cleaned));
    } catch {
      res.json({ text: cleaned });
    }

  } catch (error) {
    console.error("TOPICS ROUTE ERROR:", error);
    res.status(500).json({ error: "Backend topics route failed" });
  }
});

/* -------------------- MCQ ROUTE -------------------- */
app.post("/api/mcq", async (req, res) => {
  try {
    const { content = "", count = 10 } = req.body;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
Generate ${count} MCQs.

STRICT RULES:
- Return ONLY valid JSON ARRAY
- No explanation
- Each question must test a DIFFERENT concept
- 4 options
- Only 1 correct answer

FORMAT:
[
  {
    "q": "question",
    "options": ["A","B","C","D"],
    "ans": 0,
    "tag": "subtopic"
  }
]

Study Material:
${content.slice(0, 2000)}
`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    console.log("MCQ API RESPONSE:", data);

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // ✅ Clean markdown JSON
    let cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      res.json(JSON.parse(cleaned));
    } catch {
      res.json({ text: cleaned });
    }

  } catch (error) {
    console.error("MCQ ROUTE ERROR:", error);
    res.status(500).json({ error: "Backend mcq route failed" });
  }
});

/* -------------------- TEST GEMINI -------------------- */
app.get("/test-gemini", async (req, res) => {
  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: "Say hello" }]
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      status: response.status,
      data
    });

  } catch (error) {
    console.error("TEST ROUTE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

/* -------------------- PING -------------------- */
app.get("/ping", (req, res) => {
  res.send("SERVER ROUTE WORKING");
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});