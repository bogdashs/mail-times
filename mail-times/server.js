const SMTPServer = require("smtp-server").SMTPServer;
const simpleParser = require("mailparser").simpleParser;
const fs = require("fs");

const MAIL_DIR = "/var/www/duchat/emails.json";

const server = new SMTPServer({
    authOptional: true,
    disabledCommands: ['AUTH'],
    onData(stream, session, callback) {
        simpleParser(stream, (err, parsed) => {
            if (err) return console.log("Error:", err);

            // Чистим адрес получателя
            const rawTo = parsed.to ? (Array.isArray(parsed.to) ? parsed.to[0].text : parsed.to.text) : "";
            const cleanTo = rawTo.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || rawTo;

            const newEmail = {
                id: Date.now(),
                from: parsed.from?.text || "Unknown",
                to: cleanTo.toLowerCase().trim(),
                subject: parsed.subject || "(Без темы)",
                text: parsed.text || "",
                date: new Date()
            };

            let emails = [];
            if (fs.existsSync(MAIL_DIR)) {
                try {
                    emails = JSON.parse(fs.readFileSync(MAIL_DIR));
                } catch (e) { emails = []; }
            }

            emails.unshift(newEmail);

            // Удаляем письма старше 30 минут
            const now = Date.now();
            const filteredEmails = emails.filter(mail => (now - new Date(mail.date).getTime()) < 30 * 60 * 1000);

            fs.writeFileSync(MAIL_DIR, JSON.stringify(filteredEmails.slice(0, 100)));
            console.log(`[OK] Письмо получено для: ${cleanTo}`);
            callback();
        });
    }
});

// Запуск на порту 25
server.listen(25, "0.0.0.0", () => {
    console.log("=== СЕРВЕР ЗАПУЩЕН И ГОТОВ ПРИНИМАТЬ ПИСЬМА ===");
})