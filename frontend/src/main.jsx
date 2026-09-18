import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Shield,
  LayoutDashboard,
  Rocket,
  History as HistoryIcon,
  BarChart3,
  Settings,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Database,
  Target,
  FileText,
  Trash2,
  CircleHelp,
  X,
  Zap,
  Users,
} from "lucide-react";

import "./styles.css";

const API_URL = "http://127.0.0.1:5000/predict";
const HEALTH_URL = "http://127.0.0.1:5000/health";

const LABELS = [
  ["🟢 Safe Comment", "safe"],
  ["🟠 Targeted Group Insult", "group"],
  ["🔴 Targeted Personal Insult", "individual"],
  ["🟠 Other Targeted Insult", "other"],
  ["🟠 General Offensive Comment", "offensive"],
  ["⚪ Not Tamil", "nontamil"],
];

const CLASS_ID_MAP = {
  "🟢 Safe Comment": 0,
  "🟠 Targeted Group Insult": 1,
  "🔴 Targeted Personal Insult": 2,
  "🟠 Other Targeted Insult": 3,
  "🟠 General Offensive Comment": 4,
  "⚪ Not Tamil": 5,

  "Safe Comment": 0,
  "Targeted Group Insult": 1,
  "Targeted Personal Insult": 2,
  "Other Targeted Insult": 3,
  "General Offensive Comment": 4,
  "Not Tamil": 5,
};


function App() {
  const [page, setPage] = useState("Dashboard");
  const [comment, setComment] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Start as offline until the health check confirms backend is alive.
  const [backendOnline, setBackendOnline] = useState(false);

  const [showHelp, setShowHelp] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);


  // ============================================
  // BACKEND HEALTH CHECK
  // ============================================

  useEffect(() => {

    const checkBackend = async () => {

      try {

        const response = await fetch(
          HEALTH_URL,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Backend health check failed");
        }

        const data = await response.json();

        if (data.status === "ok") {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }

      } catch (error) {

        console.log("Backend offline");

        setBackendOnline(false);

      }

    };


    // Check immediately when the app starts.
    checkBackend();


    // Check every 3 seconds.
    const interval = setInterval(
      checkBackend,
      3000
    );


    // Stop checking when component is removed.
    return () => {
      clearInterval(interval);
    };

  }, []);


  // ============================================
  // ANALYZE COMMENT
  // ============================================

  const analyze = async () => {

    const text = comment.trim();

    if (!text || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);

    try {

      const response = await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            text,
          }),
        }
      );


      if (!response.ok) {
        throw new Error(
          `Backend returned HTTP ${response.status}`
        );
      }


      const data = await response.json();


      const prediction = {
        label: data.prediction || "Unknown",

        confidence:
          Number(data.confidence) || 0,

        classId:
          CLASS_ID_MAP[data.prediction] ?? 0,

        text,

        timestamp:
          new Date().toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
      };


      setResult(prediction);


      setHistory((previous) => [
        prediction,
        ...previous,
      ].slice(0, 50));


    } catch (error) {

      console.error(
        "SafeScroll prediction error:",
        error
      );

      /*
       * IMPORTANT:
       * Do NOT manually set backendOnline(false) here.
       *
       * The health-check system is responsible
       * for determining whether the backend is online.
       */

      setResult(null);

    } finally {

      setIsAnalyzing(false);

    }

  };


  // ============================================
  // CLEAR HISTORY
  // ============================================

  const clearHistory = () => {

    setHistory([]);

    setResult(null);

  };


  // ============================================
  // NAVIGATION
  // ============================================

  const navigate = (targetPage) => {

    setPage(targetPage);

  };


  return (
    <div className="app-shell">


      {/* ========================================
          SIDEBAR
      ======================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">

            <img
              src="/safescroll-logo.png"
              alt="SafeScroll AI"
            />

          </div>


          <div>

            <div className="brand-name">
              SafeScroll <span>AI</span>
            </div>

            <div className="brand-sub">
              Hate Speech Detection
            </div>

          </div>

        </div>


        <nav className="nav">

          {[
            [LayoutDashboard, "Dashboard"],
            [Rocket, "Analyzer"],
            [HistoryIcon, "History"],
            [BarChart3, "Statistics"],
            [Settings, "Settings"],
            [Info, "About"],
          ].map(([Icon, label]) => (

            <button
              key={label}
              className={`nav-item ${
                page === label ? "active" : ""
              }`}
              onClick={() =>
                navigate(label)
              }
            >

              <Icon size={18} />

              <span>{label}</span>

            </button>

          ))}

        </nav>


        {/* MODEL STATUS */}

        <div className="model-card">

          <div className="eyebrow">
            MODEL STATUS
          </div>


          <div className="model-title">

            <span className="status-dot"></span>

            Character TF-IDF + SVM

            <span className="version">
              v1.0
            </span>

          </div>


          <div className="muted">
            6 Classes • Tamil + English
          </div>


          <div className="metric-row">

            <span>
              Test accuracy
            </span>

            <b>
              75.31%
            </b>

          </div>


          <div className="progress">

            <span
              style={{
                width: "75.31%",
              }}
            />

          </div>

        </div>

      </aside>


      {/* ========================================
          MAIN
      ======================================== */}

      <main className="main">


        {/* TOP BAR */}

        <header className="topbar">

          <div>

            <h1>
              SafeScroll <span>AI</span>
            </h1>

            <p>
              AI-Powered Tamil Hate Speech Detection
              & Moderation System
            </p>

          </div>


          <div className="top-actions">


            {/* REAL BACKEND STATUS */}

            <div
              className={`backend ${
                backendOnline
                  ? "online"
                  : "offline"
              }`}
            >

              <span
                className={`status-dot ${
                  backendOnline
                    ? ""
                    : "offline"
                }`}
              />

              Backend{" "}

              {backendOnline
                ? "Online"
                : "Offline"}

            </div>


            <button
              className="help"
              onClick={() =>
                setShowHelp(true)
              }
            >

              <CircleHelp size={17} />

              How it works?

            </button>

          </div>

        </header>


        {/* ========================================
            PAGE CONTENT
        ======================================== */}


        {page === "Dashboard" && (

          <Dashboard
            comment={comment}
            setComment={setComment}
            analyze={analyze}
            result={result}
            history={history}
            setPage={setPage}
            isAnalyzing={isAnalyzing}
          />

        )}


        {page === "Analyzer" && (

          <section className="page-card">

            <div className="section-head">

              <div>

                <h2>
                  Comment Analyzer
                </h2>

                <p>
                  Analyze Tamil, English and
                  Tamil-English code-mixed comments.
                </p>

              </div>

              <Rocket />

            </div>


            <Analyzer
              comment={comment}
              setComment={setComment}
              analyze={analyze}
              isAnalyzing={isAnalyzing}
            />


            <div className="standalone-result">

              <PredictionResult
                result={result}
              />

            </div>

          </section>

        )}


        {page === "History" && (

          <section className="page-card">

            <div className="section-head">

              <div>

                <h2>
                  Analysis History
                </h2>

                <p>
                  Comments analyzed during
                  this session.
                </p>

              </div>


              {history.length > 0 && (

                <button
                  className="danger-btn"
                  onClick={clearHistory}
                >

                  <Trash2 size={15} />

                  Clear History

                </button>

              )}

            </div>


            {history.length ? (

              <HistoryList
                history={history}
              />

            ) : (

              <Empty
                title="No history yet"
                text="Analyze a comment to create your first history entry."
              />

            )}

          </section>

        )}


        {page === "Statistics" && (

          <Statistics
            history={history}
          />

        )}


        {page === "Settings" && (

          <SettingsPage
            backendOnline={backendOnline}
          />

        )}


        {page === "About" && <About />}


      </main>


      {/* ========================================
          HOW IT WORKS MODAL
      ======================================== */}

      {showHelp && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowHelp(false)
          }
        >

          <div
            className="help-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  How SafeScroll Works
                </h2>

                <p>
                  From comment to moderation result.
                </p>

              </div>


              <button
                className="modal-close"
                onClick={() =>
                  setShowHelp(false)
                }
              >

                <X size={19} />

              </button>

            </div>


            <div className="workflow">

              <WorkflowStep
                number="01"
                icon={
                  <FileText size={20} />
                }
                title="Comment Input"
                text="A Tamil, English, or Tamil-English code-mixed comment is submitted."
              />


              <WorkflowStep
                number="02"
                icon={
                  <Zap size={20} />
                }
                title="Text Processing"
                text="The input is cleaned and transformed into character-level TF-IDF features."
              />


              <WorkflowStep
                number="03"
                icon={
                  <Target size={20} />
                }
                title="Classification"
                text="The Linear SVM classifier predicts one of six categories."
              />


              <WorkflowStep
                number="04"
                icon={
                  <Shield size={20} />
                }
                title="Moderation Result"
                text="SafeScroll returns the predicted category and confidence score."
              />

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


// ==================================================
// DASHBOARD
// ==================================================

function Dashboard({
  comment,
  setComment,
  analyze,
  result,
  history,
  setPage,
  isAnalyzing,
}) {

  return (
    <>

      <div className="grid-main">


        {/* ANALYZER */}

        <section className="panel analyzer-panel">

          <div className="section-head">

            <div>

              <h2>
                Analyze a Comment
              </h2>

              <p>
                Enter any Tamil, English, or
                Tamil-English code-mixed comment.
              </p>

            </div>

          </div>


          <Analyzer
            comment={comment}
            setComment={setComment}
            analyze={analyze}
            isAnalyzing={isAnalyzing}
          />

        </section>


        {/* DETECTION GUIDE */}

        <section className="panel guide">

          <div className="section-head">

            <div>

              <h2>
                💡 Detection Guide
              </h2>

            </div>

          </div>


          <p>
            SafeScroll classifies comments
            into six categories.
          </p>


          <div className="legend">

            {LABELS.map(
              ([name, cls]) => (

                <div key={name}>

                  <span
                    className={`legend-dot ${cls}`}
                  />

                  {name.replace(
                    /^[^\w]+ /,
                    ""
                  )}

                </div>

              )
            )}

          </div>

        </section>


        {/* RESULT */}

        <section className="panel result-panel">

          <div className="section-head">

            <div>

              <h2>
                Prediction Result
              </h2>

              <p>
                AI Analysis Results
              </p>

            </div>


            {result && (

              <span
                className={`pill ${
                  result.classId === 0
                    ? "safe-pill"
                    : result.classId === 5
                    ? "neutral-pill"
                    : "danger-pill"
                }`}
              >

                {result.classId === 0
                  ? "Safe"
                  : result.classId === 5
                  ? "Not Tamil"
                  : "Review"}

              </span>

            )}

          </div>


          <div className="result-content">

            <PredictionResult
              result={result}
            />

            <Confidence
              result={result}
            />

          </div>

        </section>


        {/* HISTORY */}

        <section className="panel recent">

          <div className="section-head">

            <div>

              <h2>
                🕘 Recent History
              </h2>

            </div>

          </div>


          {history.length ? (

            <HistoryList
              history={history.slice(0, 4)}
            />

          ) : (

            <Empty
              title="No history yet"
              text="Your analyzed comments will appear here."
            />

          )}


          <button
            className="outline-btn"
            onClick={() =>
              setPage("History")
            }
          >

            View All History →

          </button>

        </section>

      </div>


      <Analytics
        history={history}
      />

    </>
  );
}


// ==================================================
// ANALYZER
// ==================================================

function Analyzer({
  comment,
  setComment,
  analyze,
  isAnalyzing,
}) {

  const handleKeyDown = (event) => {

    if (
      event.key === "Enter" &&
      event.ctrlKey
    ) {

      analyze();

    }

  };


  return (
    <div className="analyzer">

      <div className="textarea-wrap">

        <textarea
          value={comment}
          maxLength={500}
          onChange={(event) =>
            setComment(
              event.target.value
            )
          }
          onKeyDown={handleKeyDown}
          placeholder="Type or paste your comment here..."
        />


        <span>
          {comment.length} / 500
        </span>

      </div>


      <div className="analyzer-controls">

        <div className="language-info">

          <span className="language-dot"></span>

          <span>
            Tamil + English + Code-mixed
          </span>

        </div>


        <button
          className="analyze-btn"
          onClick={analyze}
          disabled={
            isAnalyzing ||
            !comment.trim()
          }
        >

          <Sparkles size={18} />

          {isAnalyzing
            ? "Analyzing..."
            : "Analyze Comment"}

        </button>

      </div>


      <div className="keyboard-hint">

        Tip: Press <kbd>Ctrl</kbd> +
        <kbd>Enter</kbd> to analyze

      </div>

    </div>
  );
}


// ==================================================
// PREDICTION RESULT
// ==================================================

function PredictionResult({ result }) {

  if (!result) {

    return (
      <div className="result-main">

        <div className="result-icon">

          <Shield size={54} />

        </div>


        <h3>
          No prediction yet
        </h3>


        <p>
          Enter a comment and click
          "Analyze Comment".
        </p>

      </div>
    );

  }


  const isSafe =
    result.classId === 0;

  const isNotTamil =
    result.classId === 5;


  return (
    <div className="result-main">

      <div
        className={`result-icon ${
          isSafe
            ? "safe-glow"
            : isNotTamil
            ? "neutral-glow"
            : "danger-glow"
        }`}
      >

        {isSafe ? (

          <CheckCircle2 size={54} />

        ) : isNotTamil ? (

          <Info size={54} />

        ) : (

          <AlertTriangle size={54} />

        )}

      </div>


      <h3>
        {result.label}
      </h3>


      <p>

        {isSafe
          ? "No offensive content detected."
          : isNotTamil
          ? "The input does not appear to be Tamil content."
          : "Potentially offensive content detected."}

      </p>

    </div>
  );
}


// ==================================================
// CONFIDENCE
// ==================================================

function Confidence({ result }) {

  const value =
    result?.confidence ?? 0;


  return (
    <div className="confidence-card">

      <h3>
        Confidence Score
      </h3>


      <div
        className="ring"
        style={{
          "--p": `${value * 3.6}deg`,
        }}
      >

        <div>

          <b>

            {result
              ? value.toFixed(1)
              : "--"}

          </b>

          <small>%</small>

        </div>

      </div>


      <p>
        Confidence in prediction
      </p>


      <div className="model-info">

        <h3>
          Model Info
        </h3>


        <div>

          <span>

            <Database size={14} />

            Model

          </span>


          <b>
            TF-IDF + Linear SVM
          </b>

        </div>


        <div>

          <span>

            <Users size={14} />

            Classes

          </span>


          <b>
            6 Categories
          </b>

        </div>


        <div>

          <span>

            <Target size={14} />

            Accuracy

          </span>


          <b>
            75.31%
          </b>

        </div>

      </div>

    </div>
  );
}


// ==================================================
// ANALYTICS
// ==================================================

function Analytics({ history }) {

  const total =
    history.length;


  const safe =
    history.filter(
      (item) =>
        item.classId === 0
    ).length;


  const notTamil =
    history.filter(
      (item) =>
        item.classId === 5
    ).length;


  const flagged =
    total - safe - notTamil;


  return (
    <section className="panel analytics">

      <div className="section-head">

        <div>

          <h2>
            Session Overview
          </h2>

          <p>
            Activity from the current session.
          </p>

        </div>


        <button
          className="session-badge"
          type="button"
        >

          Current Session

        </button>

      </div>


      <div className="analytics-grid">

        <StatCard
          title="Total Analyzed"
          value={total}
          label="This session"
          icon={<FileText />}
        />


        <StatCard
          title="Safe Comments"
          value={safe}
          label="This session"
          icon={<CheckCircle2 />}
          success
        />


        <StatCard
          title="Flagged"
          value={flagged}
          label="This session"
          icon={<AlertTriangle />}
          danger
        />


        <StatCard
          title="Not Tamil"
          value={notTamil}
          label="This session"
          icon={<Info />}
        />

      </div>

    </section>
  );
}


// ==================================================
// STAT CARD
// ==================================================

function StatCard({
  title,
  value,
  label,
  icon,
  danger,
  success,
}) {

  return (
    <div
      className={`stat-card ${
        danger ? "danger" : ""
      } ${
        success ? "success" : ""
      }`}
    >

      <div>

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {label}
        </small>

      </div>


      <div className="stat-icon">

        {icon}

      </div>

    </div>
  );
}


// ==================================================
// HISTORY LIST
// ==================================================

function HistoryList({
  history,
}) {

  return (
    <div className="history-list">

      {history.map(
        (item, index) => {

          const isSafe =
            item.classId === 0;

          const isNotTamil =
            item.classId === 5;


          return (
            <div
              className="history-row"
              key={`${item.timestamp}-${index}`}
            >

              <div
                className={`mini-icon ${
                  isSafe
                    ? "safe-mini"
                    : isNotTamil
                    ? "neutral-mini"
                    : "danger-mini"
                }`}
              >

                {isSafe ? (

                  <CheckCircle2 size={17} />

                ) : isNotTamil ? (

                  <Info size={17} />

                ) : (

                  <AlertTriangle size={17} />

                )}

              </div>


              <div className="history-text">

                <b>
                  {item.label}
                </b>

                <span>
                  {item.text}
                </span>

              </div>


              <div className="history-confidence">

                {Number(
                  item.confidence
                ).toFixed(1)}%


                <small>
                  {item.timestamp}
                </small>

              </div>

            </div>
          );

        }
      )}

    </div>
  );
}


// ==================================================
// EMPTY STATE
// ==================================================

function Empty({
  title,
  text,
}) {

  return (
    <div className="empty">

      <FileText size={42} />

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

    </div>
  );
}


// ==================================================
// STATISTICS PAGE
// ==================================================

function Statistics({
  history,
}) {

  const counts =
    LABELS.map(
      ([name, cls]) => {

        const cleanName =
          name.replace(
            /^[^\w]+ /,
            ""
          );


        const count =
          history.filter(
            (item) =>
              item.classId ===
              LABELS.findIndex(
                ([label]) =>
                  label === name
              )
          ).length;


        return {
          name: cleanName,
          cls,
          count,
        };

      }
    );


  const maximum =
    Math.max(
      ...counts.map(
        (item) =>
          item.count
      ),
      1
    );


  return (
    <section className="page-card">

      <div className="section-head">

        <div>

          <h2>
            Statistics
          </h2>

          <p>
            Current-session prediction breakdown.
          </p>

        </div>


        <BarChart3 />

      </div>


      <div className="stats-summary">

        <div>

          <strong>
            {history.length}
          </strong>

          <span>
            Total analyzed
          </span>

        </div>


        <div>

          <strong>

            {
              history.filter(
                (x) =>
                  x.classId === 0
              ).length
            }

          </strong>

          <span>
            Safe
          </span>

        </div>


        <div>

          <strong>

            {
              history.filter(
                (x) =>
                  x.classId !== 0 &&
                  x.classId !== 5
              ).length
            }

          </strong>

          <span>
            Flagged
          </span>

        </div>

      </div>


      <div className="stats-large">

        {counts.map(
          (item) => (

            <div
              className="bar-row"
              key={item.name}
            >

              <span>
                {item.name}
              </span>


              <div>

                <i
                  className={item.cls}
                  style={{
                    width: `${
                      (item.count /
                        maximum) *
                      100
                    }%`,
                  }}
                />

              </div>


              <b>
                {item.count}
              </b>

            </div>

          )
        )}

      </div>

    </section>
  );
}


// ==================================================
// SETTINGS
// ==================================================

function SettingsPage({
  backendOnline,
}) {

  return (
    <section className="page-card">

      <div className="section-head">

        <div>

          <h2>
            Settings
          </h2>

          <p>
            SafeScroll system configuration.
          </p>

        </div>


        <Settings />

      </div>


      <div className="settings-grid">

        <div className="setting">

          <div className="setting-icon">

            <Database size={18} />

          </div>


          <div className="setting-content">

            <b>
              Backend API
            </b>

            <span>
              {API_URL}
            </span>

          </div>


          <span
            className={`pill ${
              backendOnline
                ? "safe-pill"
                : "danger-pill"
            }`}
          >

            {backendOnline
              ? "Online"
              : "Offline"}

          </span>

        </div>


        <div className="setting">

          <div className="setting-icon">

            <Target size={18} />

          </div>


          <div className="setting-content">

            <b>
              Detection Model
            </b>

            <span>
              Character TF-IDF + Linear SVM
            </span>

          </div>


          <span className="pill safe-pill">
            Ready
          </span>

        </div>


        <div className="setting">

          <div className="setting-icon">

            <Users size={18} />

          </div>


          <div className="setting-content">

            <b>
              Language Coverage
            </b>

            <span>
              Tamil • English • Tamil-English
              code-mixed
            </span>

          </div>


          <span className="pill safe-pill">
            Active
          </span>

        </div>


        <div className="setting">

          <div className="setting-icon">

            <BarChart3 size={18} />

          </div>


          <div className="setting-content">

            <b>
              Classification
            </b>

            <span>
              Six-category offensive-language
              classification
            </span>

          </div>


          <span className="pill safe-pill">
            6 Classes
          </span>

        </div>

      </div>

    </section>
  );
}


// ==================================================
// ABOUT
// ==================================================

function About() {

  return (
    <section className="page-card">

      <div className="section-head">

        <div>

          <h2>
            About SafeScroll AI
          </h2>

          <p>
            AI-assisted moderation for Tamil
            internet comments.
          </p>

        </div>


        <div className="about-brand-icon">

          <img
            src="/safescroll-logo.png"
            alt="SafeScroll AI"
          />

        </div>

      </div>


      <div className="about-grid">

        <div>

          <Zap />

          <h3>
            Why SafeScroll?
          </h3>

          <p>
            Tamil-English code-mixed comments
            create a challenge for conventional
            English-focused moderation systems.
            SafeScroll focuses on detecting and
            classifying these comments.
          </p>

        </div>


        <div>

          <Database />

          <h3>
            Machine Learning Pipeline
          </h3>

          <p>
            Comment → preprocessing →
            character TF-IDF features →
            Linear SVM → category +
            confidence score.
          </p>

        </div>


        <div>

          <Rocket />

          <h3>
            Browser Integration
          </h3>

          <p>
            The same prediction API powers the
            SafeScroll Chrome extension for
            real-time YouTube comment analysis.
          </p>

        </div>

      </div>

    </section>
  );
}


// ==================================================
// WORKFLOW STEP
// ==================================================

function WorkflowStep({
  number,
  icon,
  title,
  text,
}) {

  return (
    <div className="workflow-step">

      <div className="workflow-number">
        {number}
      </div>


      <div className="workflow-icon">
        {icon}
      </div>


      <div>

        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>

      </div>

    </div>
  );
}


// ==================================================
// ROOT
// ==================================================

createRoot(
  document.getElementById("root")
).render(
  <App />
);