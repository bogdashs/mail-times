const DOMAIN = "@duchat.ru";
const LIFE_TIME = 1800000; // 30 минут в миллисекундах
let activeEmail = "";

/**
 * Получает список адресов из LocalStorage или генерирует новые
 */
function getMyAddresses() {
    let savedMails = localStorage.getItem("my_temp_mails");
    let timestamp = localStorage.getItem("mails_timestamp");
    let now = Date.now();

    // Если адреса есть и 30 минут еще не прошло — возвращаем их
    if (savedMails && timestamp && (now - timestamp < LIFE_TIME)) {
        return JSON.parse(savedMails);
    }

    // Иначе генерируем новые
    const newAddresses = [];
    const keywords = [
    "shark", "ghost", "ninja", "pixel", "storm", "cloud", "rocket", "cyber", "beast", "shadow", 
    "smoke", "toxic", "flash", "glitch", "chaos", "vortex", "phantom", "specter", "rebel", "titan", 
    "neon", "void", "zenith", "apex", "omega", "alpha", "delta", "sigma", "echo", "orbit", 
    "pulse", "raider", "ranger", "scout", "viper", "venom", "cobra", "sabre", "blade", "edge", 
    "zero", "nitro", "turbo", "static", "signal", "vector", "matrix", "vertex", "core", 
    "nexus", "proxy", "crypt", "vault", "binary", "logic", "syntax", "daemon", "root", 
    "shifter", "warden", "hunter", "stalker", "wraith", "goblin", "demon", "monk", "knight", "guard", 
    "fusion", "plasma", "quark", "atom", "neutron", "proton", "gamma", "sonar", "radar", "beam",
    "comet", "meteor", "asteroid", "nebula", "pulsar", "quasar", "stellar", "lunar", "solar", "astro",
    "warden", "sentry", "oracle", "wizard", "warlock", "rogue", "bandit", "sofa", "nomad", "drifter"
    ];

    for (let i = 0; i < 5; i++) {
        let randomWord = keywords[Math.floor(Math.random() * keywords.length)];
        let randomNumber = Math.floor(100 + Math.random() * 900);
        let email = `bg-${randomWord}${randomNumber}${DOMAIN}`;
        newAddresses.push(email);
    }

    // Сохраняем в кэш браузера
    localStorage.setItem("my_temp_mails", JSON.stringify(newAddresses));
    localStorage.setItem("mails_timestamp", now.toString());
    
    return newAddresses;
}

/**
 * Отрисовывает кнопки выбора адреса на главной
 */
function renderSelector() {
    const addresses = getMyAddresses();
    const selectorContainer = document.getElementById("address-selector");

    if (selectorContainer) {
        selectorContainer.innerHTML = '<h3 class="text-slate-500 mb-4 text-center text-xs uppercase tracking-[0.2em]">Select BG-Identity:</h3>';

        addresses.forEach((email, index) => {
            const btn = document.createElement("button");
            btn.className = "bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500 transition text-left font-mono mb-3 w-full block shadow-sm relative group";
            
            btn.innerHTML = `
                <span class="text-blue-500 mr-2">${index + 1}.</span> 
                <span>${email}</span>
                <span class="absolute right-4 opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 transition-opacity">copy</span>
            `;

            btn.onclick = () => {
                navigator.clipboard.writeText(email);
                activateEmail(email);
            };

            selectorContainer.appendChild(btn);
        });
    }
}

/**
 * Переключает интерфейс на просмотр писем для выбранного адреса
 */
function activateEmail(email) {
    activeEmail = email.toLowerCase().trim();
    
    document.getElementById("address-selector").classList.add("hidden");
    document.getElementById("mail-viewer").classList.remove("hidden");
    document.getElementById("current-address").innerText = email;
    
    startChecking();
}

/**
 * Загружает письма с сервера и фильтрует их для текущего юзера
 */
async function loadEmails() {
    // Проверка на просрочку времени жизни
    let timestamp = localStorage.getItem("mails_timestamp");
    if (Date.now() - timestamp > LIFE_TIME) {
        localStorage.removeItem("my_temp_mails");
        location.reload();
        return;
    }

    try {
        const response = await fetch("/emails.json?t=" + Date.now());
        const allEmails = await response.json();

        // Фильтруем письма, которые адресованы нам
        const myEmails = allEmails.filter(mail => 
            (mail.to || "").toLowerCase().includes(activeEmail)
        );

        const listContainer = document.getElementById("email-list");

        // Если писем нет — рисуем лоадер
        if (myEmails.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-20">
                    <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                    <p class="text-slate-500">Waiting for mail...</p>
                </div>`;
            return;
        }


// Если письма есть — рендерим список
        listContainer.innerHTML = myEmails.map(mail => `
            <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-xl mb-4 text-left animate-fade-in">
                <div class="text-[10px] text-blue-400 font-mono mb-1 uppercase">From: ${mail.from.replace("<", "&lt;")}</div>
                <div class="font-bold text-white mb-2 text-lg">${mail.subject || "(No Subject)"}</div>
                <div class="text-sm text-slate-300 bg-slate-900/50 p-4 rounded border border-slate-700/50 whitespace-pre-wrap">${mail.text}</div>
                <div class="text-[10px] text-slate-600 mt-3 text-right">${new Date(mail.date).toLocaleTimeString()}</div>
            </div>
        `).join("");

    } catch (err) {
        console.error("Ошибка загрузки почты:", err);
    }
}

/**
 * Запускает цикл проверки почты каждые 5 секунд
 */

function startTimer() {
    const timerContainer = document.getElementById("timer-container");
    const timerDisplay = document.getElementById("countdown");
    
    if (!timerContainer || !timerDisplay) return;

    const update = () => {
        // Берем метку времени прямо из хранилища внутри цикла
        const rawTimestamp = localStorage.getItem("mails_timestamp");
        
        if (!rawTimestamp) {
            timerDisplay.innerText = "30:00";
            return;
        }

        const timestamp = parseInt(rawTimestamp);
        const now = Date.now();
        const timeLeft = LIFE_TIME - (now - timestamp);

        if (timeLeft <= 0) {
            timerDisplay.innerText = "00:00";
            // Если время вышло — чистим и обновляем
            localStorage.removeItem("my_temp_mails");
            localStorage.removeItem("mails_timestamp");
            location.reload();
            return;
        }

        // Показываем контейнер, если время идет
        timerContainer.classList.remove("hidden");

        const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);

        // Обновляем текст
        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Красивый эффект, если осталось мало времени
        if (timeLeft < 300000) { // 5 минут
            timerDisplay.classList.add("text-red-500", "animate-pulse");
            timerDisplay.classList.remove("text-blue-400");
        }
    };

    update(); 
    setInterval(update, 1000);
}

function startChecking() {
    loadEmails();
    setInterval(loadEmails, 5000);
}

// Инициализация при загрузке
startTimer();
renderSelector();