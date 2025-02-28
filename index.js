document.getElementById("join").addEventListener("click", () => {
    const roomId = document.getElementById("room").value.trim();
    if (roomId) {
        window.location.href = `/chat.html?room=${roomId}`;
    } else {
        alert("Please enter a valid Room ID");
    }
});