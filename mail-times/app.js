const DOMAIN = "@duchat.ru";
const LIFE_TIME = 1800000; // 30 минут
let activeEmail = "";
let userIpKey = ""; // Кэшируем ключ здесь

// 1. Получаем уникальный ключ один раз
async function getUserKey() {
    if (userIpKey) return userIpKey; // Если уже получали — возвращаем
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIpKey = "timestamp_" + data.ip.replace(/\./g, '_');
    } catch (e) {
        userIpKey = "mails_timestamp_default"; 
    }
    return userIpKey;
}

// 2. Получение адресов
async function getMyAddresses() {
    const ipKey = await getUserKey();
    let savedMails = localStorage.getItem("my_temp_mails");
    let timestamp = localStorage.getItem(ipKey);
    let now = Date.now();

    if (savedMails && timestamp && (now - parseInt(timestamp) < LIFE_TIME)) {
        return JSON.parse(savedMails);
    }

    const newAddresses = [];
    const keywords = ["shark", "ghost", "ninja", "pixel", "storm", "rocket", "cyber", "beast", "shadow", "neon"];

    for (let i = 0; i < 5; i++) {
        let randomWord = keywords[Math.floor(Math.random() * keywords.length)];
        let randomNumber = Math.floor(100 + Math.random() * 900);
        newAddresses.push(`bg-${randomWord}${randomNumber}${DOMAIN}`);
    }

    localStorage.setItem("my_temp_mails", JSON.stringify(newAddresses));
    localStorage.setItem(ipKey, now.toString());
    
    return newAddresses;
}

// 3. Рендеринг селектора
async function renderSelector() {
    const addresses = await getMyAddresses();
    const selectorContainer = document.getElementById("address-selector");

    if (selectorContainer) {
        selectorContainer.innerHTML = ""; // Очищаем перед рендером
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

// 4. Загрузка писем
async function loadEmails() {
    const ipKey = await getUserKey();
    let timestamp = localStorage.getItem(ipKey);
    
    if (timestamp && (Date.now() - parseInt(timestamp) > LIFE_TIME)) {
        localStorage.clear();
        location.reload();
        return;
    }

    try {
        const response = await fetch("/emails.json?t=" + Date.now());
        const allEmails = await response.json();

        const myEmails = allEmails.filter(mail => 
            (mail.to || "").toLowerCase().includes(activeEmail)
        );

        const listContainer = document.getElementById("email-list");
        if (!listContainer) return;

        if (myEmails.length === 0) {
            listContainer.innerHTML = `<div class="text-center py-20"><div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div><p class="text-slate-500">Waiting for mail...</p></div>`;
            return;
        }

        listContainer.innerHTML = myEmails.map(mail => `
            <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-xl mb-4 text-left">
                <div class="text-[10px] text-blue-400 font-mono mb-1 uppercase">From: ${mail.from.replace("<", "&lt;")}</div>
                <div class="font-bold text-white mb-2 text-lg">${


mail.subject || "(No Subject)"}</div>
                <div class="text-sm text-slate-300 bg-slate-900/50 p-4 rounded border border-slate-700/50 whitespace-pre-wrap">${mail.text}</div>
                <div class="text-[10px] text-slate-600 mt-3 text-right">${new Date(mail.date).toLocaleTimeString()}</div>
            </div>
        `).join("");
    } catch (err) {
        console.error("Ошибка загрузки почты:", err);
    }
}

// 5. Таймер
async function startTimer() {
    const ipKey = await getUserKey();
    const timerDisplay = document.getElementById("countdown");
    if (!timerDisplay) return;

    const update = () => {
        const rawTimestamp = localStorage.getItem(ipKey);
        if (!rawTimestamp) return;

        const timeLeft = LIFE_TIME - (Date.now() - parseInt(rawTimestamp));

        if (timeLeft <= 0) {
            localStorage.clear();
            location.reload();
            return;
        }

        const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft < 300000) {
            timerDisplay.classList.add("text-orange-700");
        }
    };

    update(); 
    setInterval(update, 1000);
}

function startChecking() {
    loadEmails();
    setInterval(loadEmails, 5000);
}

// Запуск
(async () => {
    await renderSelector();
    await startTimer();
})();
