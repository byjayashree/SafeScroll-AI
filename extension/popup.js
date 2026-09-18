// ========================================
// SafeScroll AI Popup
// ========================================

const commentInput = document.getElementById("comment");
const charCount = document.getElementById("charCount");
const analyzeBtn = document.getElementById("analyzeBtn");

const result = document.getElementById("result");
const prediction = document.getElementById("prediction");
const confidence = document.getElementById("confidence");
const confidenceFill = document.getElementById("confidenceFill");
const resultIcon = document.getElementById("resultIcon");

const errorBox = document.getElementById("error");

const protectionToggle =
    document.getElementById("protectionToggle");

const scannedCount =
    document.getElementById("scannedCount");

const safeCount =
    document.getElementById("safeCount");

const offensiveCount =
    document.getElementById("offensiveCount");

const resetStatsBtn =
    document.getElementById("resetStatsBtn");

const backendStatus =
    document.getElementById("backendStatus");

// ========================================
// BACKEND STATUS CHECK
// ========================================

async function checkBackendStatus() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/",
            {
                method: "GET"
            }
        );

        if (!response.ok) {
            throw new Error("Backend unavailable");
        }

        // Backend is online
        backendStatus.textContent =
            "Backend Online";

        backendStatus.parentElement.classList
            .remove("offline");

        analyzeBtn.disabled = false;

        console.log(
            "🟢 SafeScroll backend is online"
        );

    }
    catch (error) {

        // Backend is offline
        backendStatus.textContent =
            "Backend Offline";

        backendStatus.parentElement.classList
            .add("offline");

        analyzeBtn.disabled = true;

        console.log(
            "🔴 SafeScroll backend is offline"
        );
    }
}

// ========================================
// CHARACTER COUNTER
// ========================================

commentInput.addEventListener("input", () => {
    charCount.textContent =
        commentInput.value.length;
});


// ========================================
// LOAD SETTINGS + STATS
// ========================================

chrome.storage.local.get(
    [
        "protectionEnabled",
        "scannedCount",
        "safeCount",
        "offensiveCount"
    ],
    (data) => {

        // Protection defaults to ON
        protectionToggle.checked =
            data.protectionEnabled !== false;

        // Statistics
        scannedCount.textContent =
            data.scannedCount || 0;

        safeCount.textContent =
            data.safeCount || 0;

        offensiveCount.textContent =
            data.offensiveCount || 0;
    }
);


// ========================================
// PROTECTION TOGGLE
// ========================================

protectionToggle.addEventListener(
    "change",
    () => {

        const enabled =
            protectionToggle.checked;

        chrome.storage.local.set({
            protectionEnabled: enabled
        });

        console.log(
            `🛡️ SafeScroll protection: ${
                enabled ? "ON" : "OFF"
            }`
        );
    }
);


// ========================================
// LIVE STATS UPDATE
// ========================================

// If YouTube detection updates the stats
// while this popup is open, update the UI.

chrome.storage.onChanged.addListener(
    (changes, areaName) => {

        if (areaName !== "local") {
            return;
        }

        if (changes.scannedCount) {
            scannedCount.textContent =
                changes.scannedCount.newValue || 0;
        }

        if (changes.safeCount) {
            safeCount.textContent =
                changes.safeCount.newValue || 0;
        }

        if (changes.offensiveCount) {
            offensiveCount.textContent =
                changes.offensiveCount.newValue || 0;
        }

        if (changes.protectionEnabled) {
            protectionToggle.checked =
                changes.protectionEnabled.newValue !== false;
        }
    }
);


// ========================================
// ANALYZE BUTTON
// ========================================

analyzeBtn.addEventListener(
    "click",
    () => {

        const comment =
            commentInput.value.trim();

        if (!comment) {
            showError(
                "Please enter a comment first."
            );
            return;
        }

        hideError();

        analyzeBtn.disabled = true;
        analyzeBtn.textContent =
            "⏳ Analyzing...";

        result.classList.add("hidden");


        // Send prediction request
        // through background.js

        chrome.runtime.sendMessage(
            {
                type: "PREDICT_COMMENT",
                text: comment
            },
            (response) => {

                analyzeBtn.disabled = false;

                analyzeBtn.textContent =
                    "✨ Analyze Comment";


                // Extension error

                if (chrome.runtime.lastError) {

                    console.error(
                        chrome.runtime.lastError
                    );

                    showError(
                        "Could not connect to SafeScroll backend."
                    );

                    return;
                }


                // Backend/prediction error

                if (
                    !response ||
                    !response.success
                ) {

                    showError(
                        response?.error ||
                        "Prediction failed."
                    );

                    return;
                }


                // Display result

                displayResult(
                    response.prediction,
                    response.confidence
                );


                // Update statistics

                updateStats(
                    response.prediction
                );
            }
        );
    }
);


// ========================================
// DISPLAY RESULT
// ========================================

function displayResult(label, score) {

    result.classList.remove("hidden");

    prediction.textContent =
        label;

    confidence.textContent =
        `Confidence: ${score}%`;

    confidenceFill.style.width =
        `${score}%`;


    // Choose icon

    if (label.includes("Safe")) {

        resultIcon.textContent = "🟢";

    }

    else if (
        label.includes("Offensive")
    ) {

        resultIcon.textContent = "⚠️";

    }

    else if (
        label.includes("Not Tamil")
    ) {

        resultIcon.textContent = "⚪";

    }

    else {

        resultIcon.textContent = "⚠️";
    }
}


// ========================================
// UPDATE STATISTICS
// ========================================

function updateStats(label) {

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


            // Every successful prediction
            // counts as analyzed.

            scanned++;


            // Safe prediction

            if (label.includes("Safe")) {

                safe++;
            }


            // Offensive prediction

            else if (
                label.includes("Offensive")
            ) {

                offensive++;
            }


            // Save

            chrome.storage.local.set({

                scannedCount: scanned,

                safeCount: safe,

                offensiveCount: offensive

            });


            // Update immediately

            scannedCount.textContent =
                scanned;

            safeCount.textContent =
                safe;

            offensiveCount.textContent =
                offensive;
        }
    );
}

// ========================================
// LIVE UPDATE STATISTICS
// ========================================

chrome.storage.onChanged.addListener(
    (changes, areaName) => {

        if (areaName !== "local") {
            return;
        }

        // Update analyzed count
        if (changes.scannedCount) {
            scannedCount.textContent =
                changes.scannedCount.newValue || 0;
        }

        // Update safe count
        if (changes.safeCount) {
            safeCount.textContent =
                changes.safeCount.newValue || 0;
        }

        // Update flagged count
        if (changes.offensiveCount) {
            offensiveCount.textContent =
                changes.offensiveCount.newValue || 0;
        }

    }
);

// ========================================
// ERROR HANDLING
// ========================================

function showError(message) {

    errorBox.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );
}


function hideError() {

    errorBox.classList.add(
        "hidden"
    );
}

// ========================================
// RESET STATISTICS
// ========================================

resetStatsBtn.addEventListener("click", () => {

    const confirmed = confirm(
        "Reset all SafeScroll statistics?"
    );

    if (!confirmed) {
        return;
    }

    chrome.storage.local.set({
        scannedCount: 0,
        safeCount: 0,
        offensiveCount: 0
    }, () => {

        scannedCount.textContent = "0";
        safeCount.textContent = "0";
        offensiveCount.textContent = "0";

        console.log(
            "🧹 SafeScroll statistics reset"
        );

    });

});

// ========================================
// INITIAL BACKEND STATUS CHECK
// ========================================

checkBackendStatus();