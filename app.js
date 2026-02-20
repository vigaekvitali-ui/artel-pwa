// Конфигурация Supabase
const SB_URL = 'https://grsszunlfmehyykkvccj.supabase.co'; // Добавлен протокол и домен
const SB_KEY = 'ZTEGCDF4981E';

let supabaseClient;
try {
    // Исправлено: создаем клиент правильно
    supabaseClient = supabase.createClient(SB_URL, SB_KEY);
} catch (e) {
    console.error("Ошибка Supabase: работаем локально", e);
    supabaseClient = null;
}

document.addEventListener('alpine:init', () => {
    Alpine.data('artelCore', () => ({
        page: 1,
        theme: localStorage.getItem('artel_theme') || 'theme-classic',
        myId: localStorage.getItem('artel_id') || 'ART-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        username: localStorage.getItem('artel_user') || 'Инженер-' + Math.floor(Math.random() * 99),
        online: navigator.onLine,
        
        msg: '',
        messages: [],
        inventory: [],
        obdQuery: '',
        currentHoliday: '',
        dailyQuote: '',
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

        themes: [
            {name:'Изолента', val:'theme-classic'},
            {name:'Мазут', val:'theme-oil'},
            {name:'Ржавчина', val:'theme-rust'},
            {name:'Сталь', val:'theme-steel'},
            {name:'ИН-14', val:'theme-neon'}
        ],

        async init() {
            // Инициализация иконок
            lucide.createIcons();
            document.body.className = this.theme;
            this.updateCalendar();

            if (supabaseClient) {
                await this.fetchCloudData();
                // Realtime подписка
                supabaseClient.channel('artel-live')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artel_messages' }, p => {
                        this.messages.push(p.new);
                    })
                    .subscribe();
            }

            window.addEventListener('online', () => this.online = true);
            window.addEventListener('offline', () => this.online = false);
        },

        updateCalendar() {
            const quotes = ["Работает? Не трогай!", "Если не лезет — возьми кувалду.", "Синяя изолента — залог успеха."];
            this.currentHoliday = "Будни в Артели";
            this.dailyQuote = quotes[new Date().getDate() % quotes.length];
        },

        async fetchCloudData() {
            if (!supabaseClient) return;
            const { data } = await supabaseClient.from('artel_messages').select('*').limit(20);
            if (data) this.messages = data;
        },

        async sendMsg() {
            if (!this.msg.trim()) return;
            const newMsg = { text: this.msg, user_id: this.myId, username: this.username };
            
            if (supabaseClient) {
                await supabaseClient.from('artel_messages').insert([newMsg]);
            } else {
                this.messages.push(newMsg);
            }
            this.msg = '';
            setTimeout(() => { document.getElementById('pusker').checked = false; }, 500);
        },

        setTheme(t) {
            this.theme = t;
            document.body.className = t;
            localStorage.setItem('artel_theme', t);
        },

        scanOBD() {
            const codes = {"P0300":"Пропуски зажигания."};
            return codes[this.obdQuery.toUpperCase()] || "Код не найден.";
        }
    }));
});
