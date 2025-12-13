function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    // Demo credentials (replace with backend auth)
    if (user === "admin" && pass === "admin123") {
        window.location.href = "dashboard.html";
    } else {
        document.getElementById("error").innerText = "Invalid credentials";
    }
}
