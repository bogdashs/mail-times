const DOMAIN = "@duchat.ru";
const LIFE_TIME = 1800000; // 30 минут
let activeEmail = "";

// 1. Получаем уникальный ключ на основе IP
async function getUserKey() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return "timestamp_" + data.ip.replace(/\./g, '_');
    } catch (e) {
        return "mails_timestamp_default"; 
    }
}

// 2. Асинхронное получение адресов
async function getMyAddresses() {
    const ipKey = await getUserKey();
    let savedMails = localStorage.getItem("my_temp_mails");
    let timestamp = localStorage.getItem(ipKey);
    let now = Date.now();

    if (savedMails && timestamp && (now - parseInt(timestamp) < LIFE_TIME)) {
        return JSON.parse(savedMails);
    }

    const newAddresses = [];
    const keywords = ["shark", "ghost", "ninja", "pixel", "storm", "cloud", "rocket", "cyber", "beast", "shadow"]; // сократил для примера

    for (let i = 0; i < 5; i++) {
        let randomWord = keywords[Math.floor(Math.random() * keywords.length)];
        let randomNumber = Math.floor(100 + Math.random() * 900);
        newAddresses.push(`bg-${randomWord}${randomNumber}${DOMAIN}`);
    }

    localStorage.setItem("my_temp_mails", JSON.stringify(newAddresses));
    localStorage.setItem(ipKey, now.toString()); // ИСПРАВЛЕНО: добавили скобки ()
    
    return newAddresses;
}

// 3. Асинхронный рендеринг
async function renderSelector() {
    const addresses = await getMyAddresses(); // ИСПРАВЛЕНО: добавили await
    const selectorContainer = document.getElementById("address-selector");

    if (selectorContainer) {
        addresses.forEach((email, index) => {
            const btn = document.createElement("button");
            btn.className = "bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500 transition text-left font-mono mb-3 w-full block shadow-sm relative group text-white";
            btn.innerHTML = `<span class="text-blue-500 mr-2">${index + 1}.</span><span>${email}</span>`;
            btn.onclick = () => {
                navigator.clipboard.writeText(email);
                activateEmail(email);
            };
            selectorContainer.appendChild(btn);
        });
    }
}

function activateEmail(email) {
    activeEmail = email.toLowerCase().trim();
    document.getElementById("address-selector").classList.add("hidden");
    document.getElementById("mail-viewer").classList.remove("hidden");
    document.getElementById("current-address").innerText = email;
    startChecking();
}

async function loadEmails() {
    const ipKey = await getUserKey();
    let timestamp = localStorage.getItem(ipKey);
    if (timestamp && (Date.now() - parseInt(timestamp) > LIFE_TIME)) {
        localStorage.removeItem("my_temp_mails");
        location.reload();
        return;
    }
    // ... логика fetch писем остается такой же ...
}

// 4. Исправленный таймер
async function startTimer() {
    const ipKey = await getUserKey();
    const timerContainer = document.getElementById("timer-container");
    const timerDisplay = document.getElementById("countdown");
    
    if (!timerContainer || !timerDisplay) return;

    const update = () => {
        const rawTimestamp = localStorage.getItem(ipKey); // ИСПРАВЛЕНО: ищем по ipKey
        
        if (!rawTimestamp) {
            timerDisplay.innerText = "30:00";
            return;
        }

        const timestamp = parseInt(rawTimestamp);
        const now = Date.now();
        const timeLeft = LIFE_TIME - (now - timestamp);

        if (timeLeft <= 0) {
            timerDisplay.innerText = "00:00";
            localStorage.removeItem("my_temp_mails");
            localStorage.removeItem(ipKey);
            location.reload();
            return;
        }

        timerContainer.classList.remove("hidden");


const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft < 300000) {
            timerDisplay.classList.replace("text-slate-500", "text-orange-700");
        }
    };

    update(); 
    setInterval(update, 1000);
}

function startChecking() {
    loadEmails();
    setInterval(loadEmails, 5000);
}

// 5. Инициализация (ИСПРАВЛЕНО: добавлен вызов функций)
(async () => {
    await startTimer();
    await renderSelector();
})();