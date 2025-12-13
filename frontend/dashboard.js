function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => {
        sec.classList.add("hidden");
    });
    document.getElementById(id).classList.remove("hidden");
}

function logout() {
    window.location.href = "login.html";
}

async function classifySMS() {
    const text = document.getElementById("smsText").value;
    const resultBox = document.getElementById("resultBox");

    if (!text) {
        alert("Enter an SMS");
        return;
    }

    // Mock result (replace with backend API)
    const isSpam = text.toLowerCase().includes("win");
    const confidence = isSpam ? 0.95 : 0.98;

    resultBox.innerHTML = `
        <p><strong>Result:</strong> ${isSpam ? "SPAM 🚨" : "HAM ✅"}</p>
        <p><strong>Confidence:</strong> ${(confidence * 100).toFixed(2)}%</p>
    `;
}
