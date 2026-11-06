
// ==========================================
// BRAIN MIRROR — MAIN JAVASCRIPT
// ==========================================

const STORAGE_KEY = "brainMirrorData";

const defaultData = {
    score: 0,
    tests: 0,
    correct: 0,
    totalQuestions: 0,
    history: []
};

let data = loadData();

function loadData() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Array.isArray(saved.history)) {
            return { ...defaultData, ...saved };
        }
    } catch (error) {
        console.warn("Saqlangan ma'lumotlarni o'qib bo'lmadi.");
    }
    return { ...defaultData, history: [] };
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ==========================================
// ELEMENTS
// ==========================================

const $ = id => document.getElementById(id);

const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");

const testNames = {
    logic: "Mantiqiy fikrlash",
    memory: "Xotira sinovi",
    attention: "Diqqat sinovi",
    speed: "Tezkor fikrlash"
};

let currentTest = "";
let questionIndex = 0;
let correctAnswers = 0;
let gameFinished = false;
let memorySequence = "";
let memoryRound = 0;
let attentionTarget = "";
let speedTimer = null;
let speedSeconds = 0;

// ==========================================
// NAVIGATION
// ==========================================

function showPage(pageName) {
    pages.forEach(page => {
        page.classList.toggle("active", page.id === pageName);
    });

    navItems.forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.page === pageName
        );
    });

    const names = {
        home: "Bosh sahifa",
        tests: "Sinovlar",
        progress: "Natijalar",
        about: "Loyiha haqida",
        game: "Sinov jarayoni",
        result: "Sinov natijasi"
    };

    $("pageName").textContent = names[pageName] || pageName;

    if (pageName === "progress") {
        renderHistory();
        updateStats();
    }

    $("sidebar").classList.remove("open");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

navItems.forEach(item => {
    item.addEventListener("click", () => {
        showPage(item.dataset.page);
    });
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.goto);
    });
});

$("menuBtn").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
});

$("startBtn").addEventListener("click", () => {
    showPage("tests");
});

$("homeBtn").addEventListener("click", () => {
    showPage("home");
});

// ==========================================
// STATISTICS
// ==========================================

function getLevel(score) {
    if (score >= 1000) return { level: 6, name: "Tafakkur ustasi" };
    if (score >= 600) return { level: 5, name: "Ekspert" };
    if (score >= 350) return { level: 4, name: "Tajribali" };
    if (score >= 150) return { level: 3, name: "Izlanuvchi" };
    if (score >= 50) return { level: 2, name: "Faol o'quvchi" };
    return { level: 1, name: "Boshlovchi" };
}

function updateStats() {
    const accuracy = data.totalQuestions
        ? Math.round(data.correct / data.totalQuestions * 100)
        : 0;

    const level = getLevel(data.score);

    $("totalScore").textContent = data.score;
    $("totalTests").textContent = data.tests;
    $("accuracy").textContent = accuracy + "%";
    $("level").textContent = level.level;
    $("levelName").textContent = level.name;

    $("progressScore").textContent = data.score;
    $("progressTests").textContent = data.tests;
    $("progressAccuracy").textContent = accuracy + "%";
}

// ==========================================
// QUESTIONS
// ==========================================

const logicQuestions = [
    {
        q: "Ketma-ketlikni davom ettiring: 2, 4, 8, 16, ?",
        options: ["24", "30", "32", "36"],
        answer: "32"
    },
    {
        q: "Bir haftada necha soat bor?",
        options: ["148", "168", "178", "188"],
        answer: "168"
    },
    {
        q: "3 ta mushuk 3 ta sichqonni 3 daqiqada tutsa, 6 ta mushuk 6 ta sichqonni necha daqiqada tutadi?",
        options: ["3 daqiqa", "6 daqiqa", "9 daqiqa", "12 daqiqa"],
        answer: "3 daqiqa"
    },
    {
        q: "Qaysi son ortiqcha: 4, 9, 16, 25, 30, 36?",
        options: ["9", "25", "30", "36"],
        answer: "30"
    },
    {
        q: "Agar barcha atirgullar gul bo'lsa, qaysi fikr to'g'ri?",
        options: [
            "Barcha gullar atirgul",
            "Atirgullar gullar turiga kiradi",
            "Atirgullar daraxt",
            "Gullar atirgul emas"
        ],
        answer: "Atirgullar gullar turiga kiradi"
    }
];

const speedQuestions = [
    {
        q: "15 + 27 = ?",
        options: ["32", "42", "45", "52"],
        answer: "42"
    },
    {
        q: "9 × 7 = ?",
        options: ["56", "63", "72", "69"],
        answer: "63"
    },
    {
        q: "100 ning 25 foizi nechaga teng?",
        options: ["15", "20", "25", "30"],
        answer: "25"
    },
    {
        q: "144 ning kvadrat ildizi nechaga teng?",
        options: ["10", "11", "12", "14"],
        answer: "12"
    },
    {
        q: "45 - 18 + 7 = ?",
        options: ["32", "34", "36", "38"],
        answer: "34"
    }
];

// ==========================================
// TEST START
// ==========================================

document.querySelectorAll("[data-test]").forEach(card => {
    card.addEventListener("click", () => {
        startTest(card.dataset.test);
    });
});

$("dailyBtn").addEventListener("click", () => {
    const types = ["logic", "memory", "attention", "speed"];
    const today = new Date().getDate();
    startTest(types[today % types.length]);
});

function startTest(type) {
    currentTest = type;
    questionIndex = 0;
    correctAnswers = 0;
    gameFinished = false;
    memoryRound = 0;

    clearInterval(speedTimer);

    $("gameCategory").textContent = testNames[type].toUpperCase();

    showPage("game");

    if (type === "logic") {
        renderChoiceQuestion(logicQuestions);
    } else if (type === "speed") {
        speedSeconds = 0;
        startSpeedTimer();
        renderChoiceQuestion(speedQuestions);
    } else if (type === "memory") {
        renderMemory();
    } else if (type === "attention") {
        renderAttention();
    }
}

// ==========================================
// PROGRESS BAR
// ==========================================

function updateGameProgress() {
    $("progressBar").style.width =
        ((questionIndex + 1) / 5 * 100) + "%";

    $("questionCount").textContent =
        Math.min(questionIndex + 1, 5) + " / 5";
}

// ==========================================
// LOGIC AND SPEED QUESTIONS
// ==========================================

function renderChoiceQuestion(questions) {
    if (questionIndex >= 5) {
        finishTest();
        return;
    }

    gameFinished = false;
    updateGameProgress();

    const question = questions[questionIndex];

    $("gameContent").innerHTML = `
        <h2 class="question-title">${question.q}</h2>
        <p class="question-subtitle">
            To'g'ri javobni tanlang.
        </p>

        <div class="answer-grid">
            ${question.options.map(option => `
                <button class="answer-btn"
                    data-answer="${option}">
                    ${option}
                </button>
            `).join("")}
        </div>

        <div class="feedback" id="feedback"></div>
        <button class="primary-btn next-btn"
            id="nextQuestion" hidden>
            KEYINGI SAVOL →
        </button>
    `;

    document.querySelectorAll(".answer-btn").forEach(button => {
        button.addEventListener("click", () => {
            checkChoiceAnswer(button, question.answer);
        });
    });
}

function checkChoiceAnswer(button, correctAnswer) {
    if (gameFinished) return;

    gameFinished = true;

    const buttons = document.querySelectorAll(".answer-btn");

    buttons.forEach(item => {
        item.disabled = true;

        if (item.dataset.answer === correctAnswer) {
            item.classList.add("correct");
        }
    });

    const feedback = $("feedback");

    if (button.dataset.answer === correctAnswer) {
        correctAnswers++;
        feedback.textContent = "✓ Ajoyib! To'g'ri javob.";
        feedback.className = "feedback good";
    } else {
        button.classList.add("wrong");
        feedback.textContent = "✕ Noto'g'ri. To'g'ri javob: " + correctAnswer;
        feedback.className = "feedback bad";
    }

    $("nextQuestion").hidden = false;

    $("nextQuestion").addEventListener("click", () => {
        questionIndex++;

        if (currentTest === "logic") {
            renderChoiceQuestion(logicQuestions);
        } else {
            renderChoiceQuestion(speedQuestions);
        }
    }, { once: true });
}

// ==========================================
// MEMORY TEST
// ==========================================

function renderMemory() {
    if (questionIndex >= 5) {
        finishTest();
        return;
    }

    updateGameProgress();

    memoryRound = questionIndex;
    const length = 4 + questionIndex;

    memorySequence = "";

    for (let i = 0; i < length; i++) {
        memorySequence += Math.floor(Math.random() * 10);
    }

    $("gameContent").innerHTML = `
        <h2 class="question-title">
            Raqamlarni eslab qoling!
        </h2>

        <p class="question-subtitle" id="memoryInstruction">
            Raqamlarni diqqat bilan kuzating.
        </p>

        <div class="sequence-display" id="sequenceDisplay">
            ${memorySequence}
        </div>

        <div class="timer" id="memoryTimer">3</div>

        <div id="memoryInputArea"></div>
    `;

    let time = 3;

    const timer = setInterval(() => {
        time--;

        if ($("memoryTimer")) {
            $("memoryTimer").textContent = time;
        }

        if (time <= 0) {
            clearInterval(timer);
            showMemoryInput();
        }
    }, 1000);
}

function showMemoryInput() {
    $("sequenceDisplay").textContent = "● ● ● ●";
    $("memoryTimer").textContent = "JAVOB VAQTI";
    $("memoryInstruction").textContent =
        "Ko'rgan raqamlaringizni kiriting.";

    $("memoryInputArea").innerHTML = `
        <input class="number-input"
            id="memoryAnswer"
            type="text"
            inputmode="numeric"
            maxlength="9"
            placeholder="Raqamlarni kiriting">

        <button class="primary-btn next-btn"
            id="checkMemory">
            TEKSHIRISH →
        </button>

        <div class="feedback" id="feedback"></div>
    `;

    $("memoryAnswer").focus();

    $("checkMemory").addEventListener("click", checkMemory);

    $("memoryAnswer").addEventListener("keydown", event => {
        if (event.key === "Enter") checkMemory();
    });
}

function checkMemory() {
    if (gameFinished) return;

    const answer = $("memoryAnswer").value.trim();

    if (!answer) {
        showToast("Avval javobni kiriting!");
        return;
    }

    gameFinished = true;

    const feedback = $("feedback");

    if (answer === memorySequence) {
        correctAnswers++;
        feedback.textContent = "✓ Ajoyib! Barcha raqamlar to'g'ri.";
        feedback.className = "feedback good";
    } else {
        feedback.textContent =
            "✕ To'g'ri javob: " + memorySequence;
        feedback.className = "feedback bad";
    }

    $("memoryAnswer").disabled = true;
    $("checkMemory").disabled = true;

    const next = document.createElement("button");
    next.className = "primary-btn next-btn";
    next.textContent = "KEYINGI BOSQICH →";

    $("memoryInputArea").appendChild(next);

    next.addEventListener("click", () => {
        questionIndex++;
        gameFinished = false;
        renderMemory();
    }, { once: true });
}

// ==========================================
// ATTENTION TEST
// ==========================================

const attentionSymbols = [
    { target: "★", other: "☆" },
    { target: "●", other: "○" },
    { target: "▲", other: "△" },
    { target: "■", other: "□" },
    { target: "◆", other: "◇" }
];

function renderAttention() {
    if (questionIndex >= 5) {
        finishTest();
        return;
    }

    updateGameProgress();

    const round = attentionSymbols[questionIndex];
    attentionTarget = round.target;

    const symbols = Array(9).fill(round.other);
    const correctPosition = Math.floor(Math.random() * 9);

    symbols[correctPosition] = round.target;

    $("gameContent").innerHTML = `
        <h2 class="question-title">Belgini tez toping!</h2>
        <p class="question-subtitle">
            Boshqa belgilardan farq qiluvchi belgini tanlang.
        </p>

        <div class="target-symbol">${round.target}</div>

        <div class="memory-grid">
            ${symbols.map((symbol, index) => `
                <button data-position="${index}"
                    data-symbol="${symbol}">
                    ${symbol}
                </button>
            `).join("")}
        </div>

        <div class="feedback" id="feedback"></div>
        <button class="primary-btn next-btn"
            id="nextAttention" hidden>
            KEYINGI BOSQICH →
        </button>
    `;

    document.querySelectorAll(".memory-grid button").forEach(button => {
        button.addEventListener("click", () => {
            checkAttention(button, correctPosition);
        });
    });
}

function checkAttention(button, correctPosition) {
    if (gameFinished) return;

    gameFinished = true;

    const buttons = document.querySelectorAll(".memory-grid button");

    buttons.forEach(item => {
        item.disabled = true;

        if (Number(item.dataset.position) === correctPosition) {
            item.classList.add("correct");
        }
    });

    const feedback = $("feedback");

    if (Number(button.dataset.position) === correctPosition) {
        correctAnswers++;
        feedback.textContent = "✓ To'g'ri! Kerakli belgini topdingiz.";
        feedback.className = "feedback good";
    } else {
        button.classList.add("wrong");
        feedback.textContent = "✕ Bu safar topilmadi.";
        feedback.className = "feedback bad";
    }

    $("nextAttention").hidden = false;

    $("nextAttention").addEventListener("click", () => {
        questionIndex++;
        renderAttention();
    }, { once: true });
}

// ==========================================
// SPEED TIMER
// ==========================================

function startSpeedTimer() {
    speedSeconds = 0;

    speedTimer = setInterval(() => {
        speedSeconds++;
    }, 1000);
}

// ==========================================
// FINISH TEST
// ==========================================

function finishTest() {
    clearInterval(speedTimer);

    const score = correctAnswers * 20;
    const accuracy = Math.round(correctAnswers / 5 * 100);

    const result = {
        type: currentTest,
        name: testNames[currentTest],
        score: score,
        correct: correctAnswers,
        total: 5,
        date: new Date().toLocaleString("uz-UZ")
    };

    data.score += score;
    data.tests++;
    data.correct += correctAnswers;
    data.totalQuestions += 5;

    data.history.unshift(result);
    data.history = data.history.slice(0, 50);

    saveData();
    updateStats();
    renderHistory();

    $("finalScore").textContent = score;
    $("finalCorrect").textContent = correctAnswers + "/5";
    $("finalAccuracy").textContent = accuracy + "%";

    let message = "Yaxshi natija! Mashq qilishda davom et.";

    if (accuracy === 100) {
        message = "Ajoyib! Barcha savollarga to'g'ri javob berding!";
    } else if (accuracy >= 60) {
        message = "Yaxshi ishlading! Natijangni yanada yaxshilashing mumkin.";
    } else if (accuracy === 0) {
        message = "Bu mashqni yana bir bor sinab ko'r!";
    }

    $("resultSubtitle").textContent = message;

    showPage("result");
}

$("againBtn").addEventListener("click", () => {
    showPage("tests");
});

// ==========================================
// HISTORY
// ==========================================

function renderHistory() {
    const container = $("historyList");

    if (!data.history.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span>◈</span>
                <p>Hozircha natijalar mavjud emas.</p>
                <small>Birinchi sinovingni bajar!</small>
            </div>
        `;
        return;
    }

    container.innerHTML = data.history.map(item => `
        <div class="history-row">
            <div>
                <div class="history-name">${item.name}</div>
                <div class="history-date">${item.date}</div>
            </div>
            <div class="history-points">
                ${item.score} ball
            </div>
        </div>
    `).join("");
}

// ==========================================
// CLEAR HISTORY
// ==========================================

$("clearHistory").addEventListener("click", () => {
    const confirmed = confirm(
        "Barcha natijalarni o'chirishni xohlaysizmi?"
    );

    if (!confirmed) return;

    data = {
        ...defaultData,
        history: []
    };

    saveData();
    updateStats();
    renderHistory();

    showToast("Natijalar tozalandi!");
});

// ==========================================
// EXIT GAME
// ==========================================

$("exitGame").addEventListener("click", () => {
    clearInterval(speedTimer);

    if (confirm("Sinovdan chiqmoqchimisiz? Natija saqlanmaydi.")) {
        showPage("tests");
    }
});

// ==========================================
// TOAST MESSAGE
// ==========================================

let toastTimeout;

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// ==========================================
// INITIALIZATION
// ==========================================

function init() {
    updateStats();
    renderHistory();
    showPage("home");

    console.log(
        "%c BRAIN MIRROR SYSTEM ONLINE ",
        "background:#ffd21f;color:#080808;font-size:16px;font-weight:bold;padding:10px;"
    );
}

init();
