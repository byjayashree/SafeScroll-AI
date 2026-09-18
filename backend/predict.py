import joblib
import os
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "char_svm.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "..", "models", "char_vectorizer.pkl")

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)


label_map = {
    "Not_offensive": "🟢 Safe Comment",
    "Offensive_Targeted_Insult_Group": "🟠 Targeted Group Insult",
    "Offensive_Targeted_Insult_Individual": "🔴 Targeted Personal Insult",
    "Offensive_Targeted_Insult_Other": "🟠 Other Targeted Insult",
    "Offensive_Untargetede": "🟠 General Offensive Comment",
    "not-Tamil": "⚪ Not Tamil"
}


def predict_comment(text):

    vector = vectorizer.transform([text])

    prediction = model.predict(vector)[0]

    scores = model.decision_function(vector)

    confidence = float(np.max(scores))

    confidence = round(
        min(100, max(40, confidence * 15 + 50)),
        1
    )

    prediction = label_map.get(prediction, prediction)

    return prediction, confidence