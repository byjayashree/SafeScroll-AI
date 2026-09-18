from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict_comment

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "SafeScroll Backend Running!"


# ============================================
# BACKEND HEALTH CHECK
# ============================================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok"
    })


# ============================================
# PREDICTION
# ============================================

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    comment = data["text"]

    print(comment)

    prediction, confidence = predict_comment(comment)

    return jsonify({
        "prediction": prediction,
        "confidence": confidence
    })


# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    app.run(debug=True)