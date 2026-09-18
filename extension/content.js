// ================================
// SafeScroll AI - YouTube Detector
// ================================

console.log(
    "🛡️ SafeScroll AI content script loaded"
);


// ============================================
// CHECK PROTECTION STATUS
// ============================================

async function isProtectionEnabled() {

    return new Promise((resolve) => {

        chrome.storage.local.get(
            ["protectionEnabled"],
            (data) => {

                // Protection is ON by default
                resolve(
                    data.protectionEnabled !== false
                );

            }
        );

    });

}


// ============================================
// ANALYZE COMMENT THROUGH BACKGROUND
// ============================================

function analyzeComment(text) {

    return new Promise((resolve) => {

        chrome.runtime.sendMessage(
            {
                type: "PREDICT_COMMENT",
                text: text
            },
            (response) => {

                if (chrome.runtime.lastError) {

                    console.error(
                        "SafeScroll extension error:",
                        chrome.runtime.lastError.message
                    );

                    resolve(null);
                    return;

                }


                if (!response) {

                    console.error(
                        "SafeScroll: No response from background"
                    );

                    resolve(null);
                    return;

                }


                if (!response.success) {

                    console.error(
                        "SafeScroll prediction failed:",
                        response.error
                    );

                    resolve(null);
                    return;

                }


                console.log(
                    "🛡️ SafeScroll prediction:",
                    response.prediction,
                    `(${response.confidence}%)`
                );


                resolve({

                    prediction:
                        response.prediction,

                    confidence:
                        response.confidence

                });

            }
        );

    });

}


// ============================================
// UPDATE STATISTICS
// ============================================

function updateStats(label) {

    chrome.runtime.sendMessage({

        type: "UPDATE_STATS",
        prediction: label

    });

}


// ============================================
// CHECK WHETHER COMMENT SHOULD BE BLURRED
// ============================================

function shouldBlurComment(prediction) {

    // Safe → do NOT blur
    if (
        prediction.includes("Safe")
    ) {
        return false;
    }


    // Not Tamil → do NOT blur
    if (
        prediction.includes("Not Tamil")
    ) {
        return false;
    }


    // Everything else is considered flagged
    return true;

}


// ============================================
// BLUR OFFENSIVE COMMENT
// ============================================

function blurComment(commentElement, result) {

    // Don't process twice
    if (
        commentElement.dataset.safescrollBlurred === "true"
    ) {
        return;
    }

    commentElement.dataset.safescrollBlurred = "true";

    const prediction =
        result.prediction || "Potentially harmful content";

    const confidence =
        result.confidence || 0;

    // ========================================
    // CREATE WARNING WRAPPER
    // ========================================

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "safescroll-warning";

    wrapper.style.cssText = `
        margin: 8px 0;
        padding: 12px 14px;
        border-radius: 10px;

        background: rgba(74, 24, 32, 0.95);
        border: 1px solid #7f2838;

        color: #ffffff;

        font-family: Arial, sans-serif;
        font-size: 13px;

        display: flex;
        flex-direction: column;
        gap: 7px;
    `;

    // ========================================
    // WARNING TITLE
    // ========================================

    const warning =
        document.createElement("div");

    warning.textContent =
        "⚠️ Potentially harmful content";

    warning.style.cssText = `
        font-weight: 700;
        font-size: 13px;
        color: #ffb4bd;
    `;

    // ========================================
    // PREDICTION
    // ========================================

    const category =
        document.createElement("div");

    category.textContent =
        prediction;

    category.style.cssText = `
        font-weight: 600;
        color: #ffffff;
    `;

    // ========================================
    // CONFIDENCE
    // ========================================

    const confidenceText =
        document.createElement("div");

    confidenceText.textContent =
        `Confidence: ${confidence}%`;

    confidenceText.style.cssText = `
        font-size: 11px;
        color: #c9aeb3;
    `;

    // ========================================
    // SHOW COMMENT BUTTON
    // ========================================

    const showButton =
        document.createElement("button");

    showButton.textContent =
        "Show comment";

    showButton.style.cssText = `
        width: fit-content;

        margin-top: 3px;
        padding: 6px 11px;

        border-radius: 7px;
        border: 1px solid #8f3a4a;

        background: #24151a;
        color: #ffffff;

        font-size: 11px;
        font-weight: 600;

        cursor: pointer;
    `;

    // ========================================
    // ADD EVERYTHING TO WARNING
    // ========================================

    wrapper.appendChild(warning);
    wrapper.appendChild(category);
    wrapper.appendChild(confidenceText);
    wrapper.appendChild(showButton);

    // ========================================
    // BLUR ORIGINAL COMMENT
    // ========================================

    commentElement.style.filter =
        "blur(7px)";

    commentElement.style.transition =
        "filter 0.25s ease";

    commentElement.style.userSelect =
        "none";

    // ========================================
    // INSERT WARNING ABOVE COMMENT
    // ========================================

    commentElement.parentElement.insertBefore(
        wrapper,
        commentElement
    );

    // ========================================
    // SHOW COMMENT
    // ========================================

    showButton.addEventListener(
        "click",
        () => {

            commentElement.style.filter =
                "none";

            commentElement.style.userSelect =
                "auto";

            wrapper.remove();

            commentElement.dataset
                .safescrollBlurred =
                "false";

        }
    );
}

// ============================================
// ADD SAFE RESULT BADGE
// ============================================

function addResult(commentElement, result) {

    // Don't add duplicate result
    if (
        commentElement.querySelector(
            ".safescroll-result"
        )
    ) {
        return;
    }


    const box =
        document.createElement("div");


    box.className =
        "safescroll-result";


    const prediction =
        result.prediction ||
        "Unknown";


    const confidence =
        result.confidence ||
        0;


    const isSafe =
        prediction.includes("Safe");


    const isNotTamil =
        prediction.includes("Not Tamil");


    let background =
        "#4a1820";

    let textColor =
        "#ff6b81";

    let borderColor =
        "#7f2838";


    // Safe
    if (isSafe) {

        background =
            "#123d2b";

        textColor =
            "#4ade80";

        borderColor =
            "#246b4a";

    }


    // Not Tamil
    else if (isNotTamil) {

        background =
            "#292929";

        textColor =
            "#ffffff";

        borderColor =
            "#555555";

    }


    box.textContent =
        `🛡️ SafeScroll: ${prediction} (${confidence}%)`;


    box.style.cssText = `

        margin-top: 6px;

        padding: 6px 10px;

        border-radius: 8px;

        font-size: 12px;

        font-weight: 600;

        background: ${background};

        color: ${textColor};

        border: 1px solid ${borderColor};

        display: inline-block;

    `;


    commentElement.appendChild(box);

}


// ============================================
// FIND YOUTUBE COMMENTS
// ============================================

async function scanComments() {

    // Check protection
    const enabled =
        await isProtectionEnabled();


    if (!enabled) {

        console.log(
            "⏸️ SafeScroll protection is OFF"
        );

        return;

    }


    const comments =
        document.querySelectorAll(
            "#content-text"
        );


    for (const comment of comments) {

        // Already analyzed
        if (
            comment.dataset
                .safescrollChecked ===
            "true"
        ) {
            continue;
        }


        const text =
            comment.innerText
                .trim();


        // Ignore empty comments
        if (!text) {
            continue;
        }


        // Mark checked
        comment.dataset
            .safescrollChecked =
            "true";


        console.log(
            "🔍 SafeScroll analyzing:",
            text
        );


        // Ask background
        const result =
            await analyzeComment(text);


        if (!result) {
            continue;
        }


        // YouTube comment container
        const container =
            comment.parentElement;


        // Add SafeScroll badge
        addResult(
            container,
            result
        );


        // Update statistics
        updateStats(
            result.prediction
        );


        // Blur offensive comments
        if (
            shouldBlurComment(
                result.prediction
            )
        ) {

            blurComment(
                comment,
                result
            );

        }

    }

}


// ============================================
// INITIAL SCAN
// ============================================

setTimeout(() => {

    console.log(
        "🔎 SafeScroll starting initial scan..."
    );

    scanComments();

}, 3000);


// ============================================
// WATCH FOR DYNAMICALLY LOADED COMMENTS
// ============================================

const observer =
    new MutationObserver(() => {

        scanComments();

    });


observer.observe(
    document.body,
    {
        childList: true,
        subtree: true
    }
);


// ============================================
// WATCH PROTECTION TOGGLE
// ============================================

chrome.storage.onChanged.addListener(
    (changes, areaName) => {

        if (
            areaName !== "local"
        ) {
            return;
        }


        if (
            changes.protectionEnabled
        ) {

            const enabled =
                changes.protectionEnabled
                    .newValue !== false;


            if (enabled) {

                console.log(
                    "▶️ SafeScroll protection enabled"
                );


                scanComments();

            }
            else {

                console.log(
                    "⏸️ SafeScroll protection disabled"
                );

            }

        }

    }
);


console.log(
    "✅ SafeScroll AI YouTube detector is ready!"
);