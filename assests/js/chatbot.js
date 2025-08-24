// chatbot.js

document.addEventListener("DOMContentLoaded", () => {
  const chatIcon = document.getElementById("chatbot-icon");
  const chatWindow = document.getElementById("chatbot-window");
  const closeBtn = document.getElementById("chatbot-close");
  const sendBtn = document.getElementById("chatbot-send");
  const inputField = document.getElementById("chatbot-input");
  const chatBody = document.getElementById("chatbot-body");

  // Toggle Chat Window
  chatIcon.addEventListener("click", () => {
    chatWindow.style.display =
      chatWindow.style.display === "flex" ? "none" : "flex";
  });

  closeBtn.addEventListener("click", () => {
    chatWindow.style.display = "none";
  });

  // Add message to chat
  function addMessage(sender, msg) {
    const p = document.createElement("p");
    p.innerHTML = `<b>${sender}:</b> ${msg}`;
    chatBody.appendChild(p);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Handle send
  function sendMessage() {
    const userMsg = inputField.value.trim();
    if (!userMsg) return;

    addMessage("You", userMsg);
    inputField.value = "";

    botReply(userMsg);
  }

  // Bot replies (for now: static Q&A)
  function botReply(userMsg) {
    let reply = "Hmm, I’m not sure about that 🤔";
    const lower = userMsg.toLowerCase();

    if (lower.includes("hello") || lower.includes("hi"))
      reply = "Hey 👋 I’m Kalyan’s portfolio bot!";
    else if (lower.includes("who are you"))
      reply = "I’m a bot built to guide you through Kalyan’s portfolio 🚀";
    else if (lower.includes("projects"))
      reply = "Check out the Projects section — MoodCanvas & Bangalore House Price Prediction!";
    else if (lower.includes("skills"))
      reply = "Kalyan is skilled in Python, Flask, Django, React, ML, and more 💻";

    addMessage("Bot", reply);
  }

  // Events
  sendBtn.addEventListener("click", sendMessage);
  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});
