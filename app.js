// Конфигурация Supabase
const SB_URL = 'https://grsszunlfmehyykkvccj.supabase.co';
const SB_KEY = 'ZTEGCDF4981E';

let artelCloud;
try {
    // Важно: библиотека supabase должна быть загружена через CDN в HTML
    artelCloud = supabase.createClient(SB_URL, SB_KEY);
} catch (e) {
    console.warn("Supabase не отвечает. Работаем в локальном режиме.");
    artelCloud = null;
}

document.addEventListener('alpine:init', () => {
    Alpine.data('artelCore', () => ({
        page: 1,
        theme: localStorage.getItem('artel_theme') || 'theme-classic',
        username: 'Инженер-' + Math.floor(Math.random() * 99),
        myId: Math.random().toString(36).substr(2, 9),
        
        msg: '',
        messages: [],
        obdQuery: '',
        currentHoliday: 'Будни в Артели',
        dailyQuote: 'Работает? Не трогай!',
        currentPrompt: 'Нарисуй двигатель на синей изоленте...',
        currentJoke: 'Лишних деталей не бывает, бывают запасные.',

        navIcons: ['home', 'message-circle', 'package', 'wrench', 'zap', 'brain-circuit', 'laugh', 'settings'],
        
        zapovedi: [
            "1. ТБ — не догма, а рекомендация.",
            "2. Закон лишней детали — оптимизация веса.",
            "3. Синяя изолента лечит всё.",
            "4. Уважение к Мастодонтам.",
            "5. Инструмент — святое.",
            "6. Мат — ускоритель процесса.",
            "7. «На глазок» — точнейший прибор.",
            "8. Не крутится — бери рычаг больше.",
            "9. Делись схемами.",
            "10. Обмыл — значит, закрепил."
        ],

        rezba: [
            {m:'M6', s:'1.0', d:'5.0'}, {m:'M8', s:'1.25', d:'6.8'}, {m:'M10', s:'1.5', d:'8.5'}
        ],

        async init() {
            lucide.createIcons();
            this.updateStats();
            this.generateQR();

            if (artelCloud) {
                const { data } = await artelCloud.from('artel_messages').select('*').limit(10);
                if (data) this.messages = data;

                artelCloud.channel('artel-live')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artel_messages' }, p => {
                        this.messages.push(p.new);
                    }).subscribe();
            }
        },

        updateStats() {
            const holidays = {"07-03": "День Независимости РБ", "01-01": "Новый год"};
            const day = new Date().toISOString().slice(5,10);
            this.currentHoliday = holidays[day] || "Рабочая смена в Артели";
        },

        async sendMsg() {
            if (!this.msg.trim()) return;
            const m = { text: this.msg, username: this.username, user_id: this.myId };
            if (artelCloud) {
                await artelCloud.from('artel_messages').insert([m]);
            } else {
                this.messages.push(m);
            }
            this.msg = '';
        },

        scanOBD() {
            const codes = {"P0300": "Пропуски зажигания", "P0171": "Бедная смесь"};
            return codes[this.obdQuery.toUpperCase()] || "Код не найден в справочнике";
        },

        setTheme(t) {
            this.theme = t;
            localStorage.setItem('artel_theme', t);
        },

        shufflePrompt() { this.currentPrompt = "Новая идея: Собери ЧПУ из принтера и палок."; },
        shuffleJoke() { this.currentJoke = "Вскрытие показало: пациент умер от вскрытия."; },

        generateQR() {
            const qr = qrcode(0, 'M');
            qr.addData(window.location.href);
            qr.make();
            document.getElementById('qrcode').innerHTML = qr.createImgTag(4);
        }
    }));
});
