const socket = io();
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

let localStream;
let peerConnection;

// Display the Room ID
document.getElementById("room-id").innerText = roomId;

// Start audio and set up WebRTC
async function start() {
    try {
        // Capture audio stream from the user's microphone
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Audio stream captured:", localStream);

        // Play the audio locally (optional, for testing)
        const localAudio = document.createElement("audio");
        localAudio.srcObject = localStream;
        localAudio.play();
        document.body.appendChild(localAudio);

        // Set up WebRTC peer connection
        createPeerConnection();
    } catch (error) {
        console.error("Error accessing microphone:", error);
    }
}

// Create a WebRTC peer connection
function createPeerConnection() {
    const configuration = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        sdpSemantics: "unified-plan", // Use unified-plan for better codec support
        offerToReceiveAudio: true, // Ensure audio is received
        offerToReceiveVideo: false, // Disable video (not needed for voice chat)
    };
    peerConnection = new RTCPeerConnection(configuration);

    // Add local audio stream to the peer connection
    localStream.getTracks().forEach(track => {
        console.log("Adding local track:", track);
        peerConnection.addTrack(track, localStream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
        console.log("Remote stream received:", event.streams[0]);
        const remoteAudio = document.createElement("audio");
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play();
        document.body.appendChild(remoteAudio);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("Sending ICE candidate:", event.candidate);
            socket.emit("signal", { to: roomId, candidate: event.candidate });
        }
    };

    // Send an offer to the other peer
    peerConnection.createOffer()
        .then(offer => {
            console.log("Created offer:", offer);
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            console.log("Sending offer:", peerConnection.localDescription);
            socket.emit("signal", { to: roomId, offer: peerConnection.localDescription });
        })
        .catch(error => console.error("Error creating offer:", error));
}

// Handle signaling (offer/answer)
socket.on("signal", async ({ from, offer, answer, candidate }) => {
    console.log("Received signal:", { from, offer, answer, candidate });

    if (offer) {
        // Set remote description and create answer
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log("Sending answer:", peerConnection.localDescription);
        socket.emit("signal", { to: from, answer: peerConnection.localDescription });
    } else if (answer) {
        // Set remote description
        await peerConnection.setRemoteDescription(answer);
    } else if (candidate) {
        // Add ICE candidate
        await peerConnection.addIceCandidate(candidate);
    }
});

// Disconnect function
function disconnect() {
    if (peerConnection) {
        console.log("Closing peer connection");
        peerConnection.close();
        peerConnection = null;
    }

    if (localStream) {
        console.log("Stopping local stream");
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // Remove all audio elements from the DOM
    document.querySelectorAll("audio").forEach(audio => audio.remove());

    // Redirect to the home page or show a disconnected message
    window.location.href = "/";
}

// Start the process
start();

// Mute/Unmute buttons
document.getElementById("mute").addEventListener("click", () => {
    localStream.getAudioTracks().forEach(track => {
        track.enabled = false;
        console.log("Muted local track:", track);
    });
});

document.getElementById("unmute").addEventListener("click", () => {
    localStream.getAudioTracks().forEach(track => {
        track.enabled = true;
        console.log("Unmuted local track:", track);
    });
});

// Disconnect button
document.getElementById("disconnect").addEventListener("click", disconnect);