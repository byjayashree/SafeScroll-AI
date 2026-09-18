// ========================================
// SafeScroll AI - Background Service Worker
// ========================================

console.log(
    "🛡️ SafeScroll AI background service worker loaded"
);

const API_URL =
    "http://127.0.0.1:5000/predict";


// ========================================
// MESSAGE HANDLER
// ========================================

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        // ========================================
        // PREDICT COMMENT
        // ========================================

        if (message.type === "PREDICT_COMMENT") {

            console.log(
                "🔍 SafeScroll prediction request:",
                message.text
            );

            fetch(API_URL, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    text: message.text
                })
            })

            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `Backend returned HTTP ${response.status}`
                    );

                }

                return response.json();

            })

            .then(data => {

                console.log(
                    "🛡️ SafeScroll backend response:",
                    data
                );

                sendResponse({
                    success: true,
                    prediction: data.prediction,
                    confidence: data.confidence
                });

            })

            .catch(error => {

                console.error(
                    "❌ SafeScroll API error:",
                    error
                );

                sendResponse({
                    success: false,
                    error: error.message
                });

            });

            return true;
        }


       // ========================================
// UPDATE STATISTICS
// ========================================

if (message.type === "UPDATE_STATS") {

    const prediction = message.prediction || "";

    chrome.storage.local.get(
        [
            "scannedCount",
            "safeCount",
            "offensiveCount"
        ],
        (data) => {

            let scanned =
                data.scannedCount || 0;

            let safe =
                data.safeCount || 0;

            let offensive =
                data.offensiveCount || 0;


            // ========================================
            // EVERY PREDICTION = ANALYZED
            // ========================================

            scanned++;


            // ========================================
            // SAFE COMMENT
            // ========================================

            if (
                prediction.includes("Safe")
            ) {

                safe++;

            }


            // ========================================
            // NOT TAMIL
            // Don't count as Safe
            // Don't count as Flagged
            // ========================================

            else if (
                prediction.includes("Not Tamil")
            ) {

                // Do nothing

            }


            // ========================================
            // ALL OTHER MODEL CLASSES = FLAGGED
            // ========================================

            else {

                offensive++;

            }


            // ========================================
            // SAVE
            // ========================================

            chrome.storage.local.set({

                scannedCount: scanned,

                safeCount: safe,

                offensiveCount: offensive

            });


            // ========================================
            // DEBUG
            // ========================================

            console.log(
                "📊 SafeScroll stats updated:",
                {
                    prediction: prediction,
                    scanned: scanned,
                    safe: safe,
                    offensive: offensive
                }
            );

            sendResponse({
                success: true
            });

        }
    );

    return true;
}

    }
);