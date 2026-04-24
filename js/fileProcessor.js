// ===============================
// GLOBAL STUDY TEXT STORAGE
// ===============================
window.extractedStudyText = "";
window.studyContent = "";

// ===============================
// MAIN FILE PROCESSOR
// ===============================
async function processUploadedFiles() {

  const input = document.querySelector("input[type='file']");
  // ✅ null safety fix
  if (!input) {
    console.error("File input not found");
    return [];
  }
  const files = input.files;

  if (!files.length) {
    alert("Please upload at least one file.");
    return [];
  }

  let fullText = "";
  window.extractedStudyText = "";

  for (let file of files) {
    const text = await extractText(file);
    fullText += "\n" + text;
  }

  // 🔥 Save extracted text globally for AI assistant
  window.extractedStudyText = fullText;
  window.studyContent = fullText;

  // Send combined text to AI for topic planning
  return await identifyTopics(fullText);
}


// ===============================
// MASTER TEXT EXTRACTION ROUTER
// ===============================
async function extractText(file) {

  if (file.type === "text/plain") {
    return await file.text();
  }

  if (file.type === "application/pdf") {
    return await extractPDF(file);
  }

  if (file.type.includes("wordprocessingml")) {
    return await extractDOCX(file);
  }

  if (file.type.includes("presentationml")) {
    return await extractPPTX(file);
  }

  return "";
}


// ===============================
// PDF EXTRACTION (PDF.js)
// ===============================
async function extractPDF(file) {

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    content.items.forEach(item => {
      text += item.str + " ";
    });
  }

  return text;
}


// ===============================
// DOCX EXTRACTION (Mammoth.js)
// ===============================
async function extractDOCX(file) {

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return result.value;
}


// ===============================
// PPTX EXTRACTION (JSZip)
// ===============================
async function extractPPTX(file) {

  const zip = await JSZip.loadAsync(file);
  let text = "";

  const slideFiles = Object.keys(zip.files).filter(name =>
    name.startsWith("ppt/slides/slide")
  );

  for (let slide of slideFiles) {

    const content = await zip.files[slide].async("text");

    const matches = content.match(/<a:t>(.*?)<\/a:t>/g);

    if (matches) {
      matches.forEach(m => {
        text += m.replace(/<\/?a:t>/g, "") + " ";
      });
    }
  }

  return text;
}


// ===============================
// AI TOPIC + PLAN GENERATION
// ===============================
async function identifyTopics(text) {

  const response = await fetch("/api/topics", {  // ✅ FIXED
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text
    })
  });

  const data = await response.json();

  console.log("TOPICS RESPONSE:", data);

  if (data.error) {
    console.error("API ERROR:", data.error);
    alert("AI quota exceeded. Please wait and try again.");
    return [];
  }

  // ✅ backend already returns parsed JSON
  if (Array.isArray(data)) {
    return data;
  }

  // fallback (if parsing failed backend side)
  if (data.text) {
    try {
      return JSON.parse(data.text);
    } catch {
      console.error("Fallback parsing failed:", data.text);
      return [];
    }
  }

  return [];
}
