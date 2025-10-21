from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from rag import initialize_rag, retrieve_and_rerank, build_prompt, call_llm, collection

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests from JS

# Initialize RAG DB if empty
if collection.count() == 0:
    print("Initializing RAG database...")
    initialize_rag()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    try:
        user_message = request.json.get("message", "").strip()
        if not user_message:
            return jsonify({"reply": "Please enter a message."}), 400
        context = retrieve_and_rerank(user_message)
        prompt = build_prompt(user_message, context)
        reply = call_llm(prompt)
        return jsonify({"reply": reply})
    except Exception as e:
        print(f"Error in chat: {e}")
        return jsonify({"reply": "Sorry, an error occurred. Please try again."}), 500

if __name__ == "__main__":
    app.run(debug=True)