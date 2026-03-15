const state = {
  participants: [],
  totalPoints: 0,
  winnerBalance: null,
  rotation: 0,
  spinning: false,
  displayParticipants: [],
  displayTotalPoints: 0
};

const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

async function api(url, opts = {}) {
  const res = await fetch(url, { ...opts, credentials: "include" });
  if (res.status === 401) {
    showAuth();
    throw new Error("Unauthorized");
  }
  return res;
}

const authSection = document.getElementById("authSection");
const gameSection = document.getElementById("gameSection");
const usernameEl = document.getElementById("username");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authError = document.getElementById("authError");

function showAuth() {
  authSection.hidden = false;
  gameSection.hidden = true;
}

function showGame(user) {
  authSection.hidden = true;
  gameSection.hidden = false;
  usernameEl.textContent = user.username;
  authError.textContent = "";
}

document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isLogin = tab.dataset.tab === "login";
    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;
    authError.textContent = "";
  });
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  const fd = new FormData(loginForm);
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    authError.textContent = data.message || "Ошибка входа";
    return;
  }
  showGame(data);
  await refreshState();
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  const fd = new FormData(registerForm);
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    authError.textContent = data.message || "Ошибка регистрации";
    return;
  }
  authError.textContent = data.message || "Зарегистрированы. Войдите.";
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST", credentials: "include" });
  showAuth();
});

const participantForm = document.getElementById("participantForm");
const redeemForm = document.getElementById("redeemForm");
const spinBtn = document.getElementById("spinBtn");
const participantsList = document.getElementById("participants");
const balancesList = document.getElementById("balances");
const totalPointsNode = document.getElementById("totalPoints");
const spinResult = document.getElementById("spinResult");
const winnerText = document.getElementById("winner");
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

participantForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const points = Number(document.getElementById("points").value);

  await api("/api/participants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, points })
  });

  participantForm.reset();
  await refreshState();
});

spinBtn.addEventListener("click", async () => {
  if (state.spinning || state.participants.length === 0) return;

  spinBtn.disabled = true;
  state.spinning = true;
  state.displayParticipants = [...state.participants];
  state.displayTotalPoints = state.totalPoints;

  const response = await api("/api/spin", { method: "POST" });
  const data = await response.json();

  if (!response.ok) {
    spinResult.textContent = data.message;
    state.spinning = false;
    spinBtn.disabled = false;
    return;
  }

  spinResult.textContent = "Крутится...";
  const targetRotation = Math.PI * 2 * 6 - (data.pointer / state.displayTotalPoints) * Math.PI * 2;
  await animateWheel(targetRotation);
  spinResult.textContent = `Победитель: ${data.name}, выигрыш: ${data.wonPoints} очков`;

  await refreshState();
  state.spinning = false;
  spinBtn.disabled = false;
});

redeemForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!state.winnerBalance) {
    winnerText.textContent = "Сначала нужно определить победителя.";
    return;
  }

  const prizeCost = Number(document.getElementById("prizeCost").value);
  const response = await api("/api/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ winnerId: state.winnerBalance.participantId, prizeCost })
  });

  const data = await response.json();
  if (!response.ok) {
    winnerText.textContent = data.message;
    return;
  }

  redeemForm.reset();
  await refreshState();
});

async function refreshState() {
  const response = await api("/api/state");
  const data = await response.json();

  state.participants = data.participants;
  state.totalPoints = data.totalPoints;
  state.winnerBalance = data.winnerBalance;

  render();
}

function render() {
  totalPointsNode.textContent = String(state.totalPoints);
  participantsList.innerHTML = state.participants
    .map((p) => `<li>${p.name}: ${p.points} очков</li>`)
    .join("");

  const balanceItems = state.participants.map((p) => `${p.name}: ${p.points} очков`);
  if (state.winnerBalance) {
    balanceItems.push(`${state.winnerBalance.name}: ${state.winnerBalance.balance} очков (победитель)`);
  }
  balancesList.innerHTML = balanceItems.length
    ? balanceItems.map((b) => `<li>${b}</li>`).join("")
    : "<li class=\"muted\">Пока нет</li>";

  winnerText.textContent = state.winnerBalance
    ? `Победитель: ${state.winnerBalance.name}, баланс: ${state.winnerBalance.balance} очков`
    : "Победитель пока не определён.";

  if (!state.spinning) {
    state.displayParticipants = [...state.participants];
    state.displayTotalPoints = state.totalPoints;
  }
  drawWheel();
}

function drawWheel() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 8;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const participants = state.displayParticipants;
  const totalPoints = state.displayTotalPoints;

  if (participants.length === 0 || totalPoints === 0) {
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1e293b";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Нет участников", centerX, centerY);
    return;
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(state.rotation);
  ctx.translate(-centerX, -centerY);

  let startAngle = -Math.PI / 2;

  participants.forEach((participant, index) => {
    const slice = (participant.points / totalPoints) * Math.PI * 2;
    const endAngle = startAngle + slice;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    const textAngle = startAngle + slice / 2;
    const textX = centerX + Math.cos(textAngle) * (radius * 0.62);
    const textY = centerY + Math.sin(textAngle) * (radius * 0.62);

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(textAngle + Math.PI / 2);
    ctx.fillStyle = "#0f172a";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(participant.name, 0, 0);
    ctx.restore();

    startAngle = endAngle;
  });

  ctx.restore();
}

function animateWheel(targetRotation) {
  const duration = 4000;
  const startRotation = state.rotation;
  const startTime = performance.now();

  return new Promise((resolve) => {
    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      state.rotation = startRotation + (targetRotation - startRotation) * ease;
      drawWheel();

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        state.rotation = startRotation + targetRotation;
        state.rotation = state.rotation % (Math.PI * 2);
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

(async () => {
  const res = await fetch("/api/me", { credentials: "include" });
  const user = await res.json().catch(() => null);
  if (user?.username) {
    showGame(user);
    await refreshState();
  } else {
    showAuth();
  }
})();
