document.addEventListener("DOMContentLoaded", () => {
    const chatIcon = document.getElementById("chatbot-icon");
    const chatWindow = document.getElementById("chatbot-window");
    const chatSend = document.getElementById("chatbot-send");
    const chatInput = document.getElementById("chatbot-input");
    const chatBody = document.getElementById("chatbot-body");

    let isTyping = false;

    // Toggle chatbot window with animation
    chatIcon.addEventListener("click", () => {
        if (chatWindow.classList.contains("hidden")) {
            chatWindow.classList.remove("hidden");
            chatWindow.style.display = "flex";
            chatWindow.style.animation = "fadeIn 0.3s forwards";
            // Delay focus until animation completes
            setTimeout(() => {
                chatInput.focus();
            }, 300);
        } else {
            chatWindow.style.animation = "fadeOut 0.3s forwards";
            setTimeout(() => {
                chatWindow.classList.add("hidden");
                chatWindow.style.display = "none";
            }, 300);
        }
    });

    // Function to add message to chat
    function addMessage(sender, text, isTypingIndicator = false) {
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message", sender);
        if (isTypingIndicator) {
            msgDiv.innerHTML = `<p><b>Bot:</b> Typing...</p>`;
        } else {
            msgDiv.innerHTML = `<p><b>${sender === "bot" ? "Bot" : "You"}:</b> ${text}</p>`;
        }
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Send message
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || isTyping) return;

        addMessage("user", message);
        chatInput.value = "";
        chatInput.disabled = true;
        chatSend.disabled = true;
        isTyping = true;
        addMessage("bot", "", true);  // Show typing indicator

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });
            if (!response.ok) throw new Error("Network error");
            const data = await response.json();
            // Remove typing indicator (more robust selector)
            const typingDivs = chatBody.querySelectorAll(".message.bot");
            const lastTypingDiv = typingDivs[typingDivs.length - 1];
            if (lastTypingDiv && lastTypingDiv.innerHTML.includes("Typing...")) {
                lastTypingDiv.remove();
            }
            addMessage("bot", data.reply);
        } catch (err) {
            console.error("Fetch error:", err);
            const typingDivs = chatBody.querySelectorAll(".message.bot");
            const lastTypingDiv = typingDivs[typingDivs.length - 1];
            if (lastTypingDiv && lastTypingDiv.innerHTML.includes("Typing...")) {
                lastTypingDiv.remove();
            }
            addMessage("bot", "Sorry, I couldn't process your message. Try again!");
        } finally {
            chatInput.disabled = false;
            chatSend.disabled = false;
            chatInput.focus();
            isTyping = false;
        }
    }

    // Event listeners for send button and Enter key
    chatSend.addEventListener("click", sendMessage);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {  // Allow Shift+Enter for new lines in textarea
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize for textarea (multi-line)
    chatInput.addEventListener("input", () => {
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + "px";
    });
});