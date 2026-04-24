// 🔥 IMPORTANT: uses global supabaseClient from index.html
// DO NOT create a new client here
if (typeof supabaseClient === "undefined") {
  console.error("Supabase not initialized ❌");
}
// 🔹 Get current user safely
export async function getUserId() {
  if (!supabaseClient) return null;

const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    return null;
  }

  if (!data.session) {
    console.error("No session found ❌");
    return null;
  }

  const userId = data.session.user.id;
  console.log("User ID:", userId);

  return userId;
}

// 🔹 Get today's date
function getToday() {
  return new Date().toISOString().split("T")[0];
}

// 🔹 Save session data
export async function saveSession(minutes) {
  const userId = await getUserId();
  if (!userId) return;

  const today = getToday();

  const { data: existing, error } = await supabaseClient
    .from("analytics")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  if (existing) {
    await supabaseClient
      .from("analytics")
      .update({
        focus_minutes: existing.focus_minutes + minutes,
        sessions: existing.sessions + 1
      })
      .eq("id", existing.id);

  } else {
    await supabaseClient
      .from("analytics")
      .insert([
        {
          user_id: userId,
          date: today,
          focus_minutes: minutes,
          sessions: 1
        }
      ]);
  }

  console.log("Session saved ✅");
}

// 🔹 Load total focus time
export async function loadTotalFocus() {
  const userId = await getUserId();
  if (!userId) return;

  const { data, error } = await supabaseClient
    .from("analytics")
    .select("focus_minutes")
    .eq("user_id", userId);

  if (error) {
    console.error("Error loading focus:", error);
    return;
  }

  let total = 0;
  data?.forEach(d => total += d.focus_minutes);

  const el = document.getElementById("focusTime");
  if (el) el.innerText = total + "m";

  console.log("Total focus:", total);
}

// 🔹 Calculate streak
export async function calculateStreak() {
  const userId = await getUserId();
  if (!userId) return;

  const { data, error } = await supabaseClient
    .from("analytics")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Streak error:", error);
    return;
  }

  let streak = 0;
  let currentDate = new Date();

  for (let i = 0; i < data.length; i++) {
    let d = new Date(data[i].date);

    if (d.toDateString() === currentDate.toDateString()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  const el1 = document.getElementById("streakCount");
  const el2 = document.getElementById("streakUI");

  if (el1) el1.innerText = "Day " + streak;
  if (el2) el2.innerText = "Day " + streak;

  console.log("Streak:", streak);
}

// 🔹 Load total sessions
export async function loadSessionCount() {
  const userId = await getUserId();
  if (!userId) return;

  const { data, error } = await supabaseClient
    .from("analytics")
    .select("sessions")
    .eq("user_id", userId);

  if (error) {
    console.error("Session count error:", error);
    return;
  }

  let total = 0;
  data?.forEach(d => total += d.sessions);

  const el = document.getElementById("sessionCount");
  if (el) el.innerText = total;

  console.log("Sessions:", total);
}

// 🔹 Load weekly chart
export async function loadWeeklyChart() {
  const userId = await getUserId();
  if (!userId) return;

  const { data, error } = await supabaseClient
    .from("analytics")
    .select("date, focus_minutes")
    .eq("user_id", userId);

  if (error) {
    console.error("Chart data error:", error);
    return;
  }

  let labels = [];
  let values = [];

  for (let i = 6; i >= 0; i--) {
    let d = new Date();
    d.setDate(d.getDate() - i);

    let dateStr = d.toISOString().split("T")[0];
    labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));

    let found = data.find(x => x.date === dateStr);
    values.push(found ? found.focus_minutes : 0);
  }

  const ctx = document.getElementById("analyticsChart");

if (!ctx) {
  console.error("Chart canvas not found ❌");
  return;
}

if (typeof Chart === "undefined") {
  console.error("Chart.js not loaded ❌");
  return;
}
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Focus Minutes",
        data: values,
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      }
    }
  });

  console.log("Chart loaded ✅");
}
// 🔥 MAIN FAST FUNCTION
export async function loadAllAnalytics(){

  if (!supabaseClient) return;

const { data } = await supabaseClient.auth.getUser();
  const userId = data.user?.id;

  if(!userId){
    console.error("No user");
    return;
  }

  const { data: rows, error } = await supabaseClient
    .from("analytics")
    .select("*")
    .eq("user_id", userId);

  if(error){
    console.error(error);
    return;
  }

  console.log("All analytics:", rows);

  updateTotal(rows);
  updateSessions(rows);
  updateStreak(rows);
  updateChart(rows);
}

// 🔹 TOTAL FOCUS
function updateTotal(data){
  let total = 0;
  data.forEach(d => total += d.focus_minutes);

  const el = document.getElementById("focusTime");
if (el) el.innerText = total + "m";
}

// 🔹 SESSION COUNT
function updateSessions(data){
  let total = 0;
  data.forEach(d => total += d.sessions);

  const el = document.getElementById("sessionCount");
  if(el) el.innerText = total;
}

// 🔹 STREAK
function normalize(d) {
  return new Date(d).toISOString().split("T")[0];
}

function updateStreak(data) {

  if (!data || data.length === 0) {
    setStreakUI(0);
    return;
  }

  // 🔹 normalize + sort dates DESC
  const dates = data
    .map(d => normalize(d.date))
    .sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  let current = normalize(new Date());

  // 🔥 if today not present → start from latest DB date
  if (!dates.includes(current)) {
    current = dates[0];
  }

  while (dates.includes(current)) {
    streak++;

    let prev = new Date(current);
    prev.setDate(prev.getDate() - 1);
    current = normalize(prev);
  }

  console.log("FINAL STREAK:", streak);

  setStreakUI(streak); // ✅ THIS WAS MISSING
}
function setStreakUI(streak) {
  const el1 = document.getElementById("streakCount");
  const el2 = document.getElementById("streakUI");

  if (el1) el1.innerText = "Day " + streak;
  if (el2) el2.innerText = "Day " + streak;
}


// 🔹 CHART
function updateChart(data){

  let labels = [];
  let values = [];

  for (let i = 6; i >= 0; i--) {
    let d = new Date();
    d.setDate(d.getDate() - i);

    let dateStr = d.toISOString().split("T")[0];
    labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));

    let found = data.find(x => x.date === dateStr);
    values.push(found ? found.focus_minutes : 0);
  }

  const ctx = document.getElementById("analyticsChart");

if (!ctx) return;

if (typeof Chart === "undefined") {
  console.error("Chart.js not loaded ❌");
  return;
}

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Focus Minutes",
        data: values,
        tension: 0.3
      }]
    }
  });
}