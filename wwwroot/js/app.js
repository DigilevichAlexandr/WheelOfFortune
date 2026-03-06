const state = {
  participants: [],
  totalPoints: 0,
  winnerBalance: null,
  rotation: 0,
  isSpinning: false
};

const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

const participantForm = document.getElementById("participantForm");
const redeemForm = document.getElementById("redeemForm");
const spinBtn = document.getElementById("spinBtn");
const participantsList = document.getElementById("participants");
const totalPointsNode = document.getElementById("totalPoints");
const spinResult = document.getElementById("spinResult");
const winnerText = document.getElementById("winner");
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

participantForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const points = Number(document.getElementById("points").value);

  await fetch("/api/participants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, points })
  });

  participantForm.reset();
  await refreshState();
});

spinBtn.addEventListener("click", async () => {
<<<<<<< codex/create-prize-wheel-application-in-.net-s2kksc
  if (state.isSpinning) {
    return;
  }

  const snapshotParticipants = [...state.participants];
  const snapshotTotalPoints = state.totalPoints;
  if (snapshotParticipants.length === 0 || snapshotTotalPoints === 0) {
    spinResult.textContent = "Добавьте хотя бы одного участника, чтобы крутить колесо.";
    return;
  }

=======
>>>>>>> main
  const response = await fetch("/api/spin", { method: "POST" });
  const data = await response.json();

  if (!response.ok) {
    spinResult.textContent = data.message;
    return;
  }

<<<<<<< codex/create-prize-wheel-application-in-.net-s2kksc
  spinResult.textContent = "Колесо крутится...";
  state.isSpinning = true;
  spinBtn.disabled = true;

  const targetRotation = calculateTargetRotation(snapshotParticipants, snapshotTotalPoints, data.participantId);
  await animateSpin(targetRotation);

  spinResult.textContent = `Победитель: ${data.name}, выигрыш: ${data.wonPoints} очков`;

  state.isSpinning = false;
  spinBtn.disabled = false;
=======
  spinResult.textContent = `Победитель: ${data.name}, выигрыш: ${data.wonPoints} очков`;
>>>>>>> main
  await refreshState();
});

redeemForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!state.winnerBalance) {
    winnerText.textContent = "Сначала нужно определить победителя.";
    return;
  }

  const prizeCost = Number(document.getElementById("prizeCost").value);
  const response = await fetch("/api/redeem", {
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
  const response = await fetch("/api/state");
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

  winnerText.textContent = state.winnerBalance
    ? `Победитель: ${state.winnerBalance.name}, баланс: ${state.winnerBalance.balance} очков`
    : "Победитель пока не определён.";

  drawWheel();
}

function drawWheel() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 8;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state.participants.length === 0 || state.totalPoints === 0) {
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

  let startAngle = -Math.PI / 2;

  state.participants.forEach((participant, index) => {
    const slice = (participant.points / state.totalPoints) * Math.PI * 2;
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
}

<<<<<<< codex/create-prize-wheel-application-in-.net-s2kksc
function calculateTargetRotation(participants, totalPoints, winnerId) {
  let startAngle = -Math.PI / 2;

  for (const participant of participants) {
    const slice = (participant.points / totalPoints) * Math.PI * 2;
    const endAngle = startAngle + slice;

    if (participant.id === winnerId) {
      const winnerCenter = startAngle + slice / 2;
      const normalize = (angle) => ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const currentNormalized = normalize(state.rotation);
      const desiredNormalized = normalize(-Math.PI / 2 - winnerCenter);
      const delta = normalize(desiredNormalized - currentNormalized);
      const extraSpins = 6 + Math.floor(Math.random() * 3);
      return state.rotation + extraSpins * Math.PI * 2 + delta;
    }

    startAngle = endAngle;
  }

  return state.rotation + 6 * Math.PI * 2;
}

function animateSpin(targetRotation) {
  return new Promise((resolve) => {
    canvas.style.transition = "transform 4.5s cubic-bezier(0.12, 0.8, 0.2, 1)";
    canvas.style.transform = `rotate(${(targetRotation * 180) / Math.PI}deg)`;

    const finish = () => {
      canvas.removeEventListener("transitionend", finish);
      canvas.style.transition = "none";
      state.rotation = targetRotation;
      resolve();
    };

    canvas.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 4700);
  });
}

=======
>>>>>>> main
refreshState();
