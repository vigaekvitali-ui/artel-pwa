document.addEventListener('alpine:init', () => {
    Alpine.data('appState', () => ({
        page: 'cal',
        theme: localStorage.getItem('artel-theme') || '',
        showSettings: false,
        currentDate: new Date(),
        
        // --- ЧАТ ---
        newMessage: '',
        messages: JSON.parse(localStorage.getItem('artel-chat') || '[{"text": "Добро пожаловать в чат АРТЕЛЬ!", "self": false, "time": "12:00"}]'),
        
        sendMessage() {
            if (this.newMessage.trim() === '') return;
            this.messages.push({
                text: this.newMessage,
                self: true,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });
            this.newMessage = '';
            localStorage.setItem('artel-chat', JSON.stringify(this.messages));
            // Прокрутка вниз
            setTimeout(() => { const c = document.getElementById('chat-container'); c.scrollTop = c.scrollHeight; }, 50);
        },

        // --- СКЛАД ---
        stockFilter: 'У меня есть',
        newItemName: '',
        inventory: JSON.parse(localStorage.getItem('artel-stock') || '[]'),
        
        addItem() {
            if (this.newItemName.trim() === '') return;
            this.inventory.push({
                name: this.newItemName,
                details: 'Добавлено вручную',
                cat: this.stockFilter
            });
            this.newItemName = '';
            localStorage.setItem('artel-stock', JSON.stringify(this.inventory));
        },

        // --- OBD-II КОДЫ (Исправленный поиск) ---
        obdCode: '',
        obdDatabase: {
            "P0101": "ДМРВ: Выход сигнала из диапазона. Проверь герметичность впуска.",
            "P0300": "Множественные пропуски зажигания. Смотри свечи и катушки.",
            "P0500": "Датчик скорости автомобиля: нет сигнала.",
            "520204": "МТЗ: Низкое давление в системе смазки КПП (проверь фильтр).",
            "523450": "John Deere: Нарушение связи CAN-шины двигателя.",
            "E12": "Трактор: Ошибка датчика положения навески."
        },
        searchOBD() {
            const code = this.obdCode.trim().toUpperCase();
            return this.obdDatabase[code] || "Код не найден в базе. Попробуй Gemini AI.";
        },

        // --- ЮМОР (Смена анекдотов) ---
        jokes: [
            {text: "Инженер — это человек, который может объяснить, почему сломалось то, что по его расчетам сломаться не могло.", rating: 42},
            {text: "Синяя изолента — это не просто расходник, это фундаментальная константа мироздания.", rating: 89},
            {text: "Почему механики не любят левшей? У них резьба в голове в другую сторону.", rating: 15},
            {text: "— У вас трактор сломался. — Как узнали? — Он не дымит и не вибрирует.", rating: 56}
        ],
        currentJokeIndex: 0,
        nextJoke() {
            this.currentJokeIndex = (this.currentJokeIndex + 1) % this.jokes.length;
        },

        // --- КАЛЕНДАРЬ (Алгоритм без изменений) ---
        get monthLabel() { return new Intl.DateTimeFormat('ru-RU', {month:'long', year:'numeric'}).format(this.currentDate); },
        get daysInMonth() {
            let d = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
            return Array.from({length: d}, (_, i) => i + 1);
        },
        get blankDays() {
            let first = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1).getDay();
            return Array.from({length: first === 0 ? 6 : first - 1});
        },
        changeMonth(step) {
            this.currentDate.setMonth(this.currentDate.getMonth() + step);
            this.currentDate = new Date(this.currentDate);
        },

        // --- СПРАВОЧНИКИ ---
        refType: 'metric',
        getRefData() {
            const db = {
                metric: [{s:"M6", p:"1.0", d:"5.0"}, {s:"M8", p:"1.25", d:"6.8"}, {s:"M10", p:"1.5", d:"8.5"}],
                inch: [{s:"1/4 UNC", p:"20", d:"5.1"}, {s:"1/2 UNF", p:"20", d:"11.5"}],
                bearings: [{n:"6204", d:"20", D:"47", B:"14"}, {n:"6308", d:"40", D:"90", B:"23"}],
                seals: [{t:"TC", s:"25x47x7", a:"Ступица"}, {t:"TC", s:"80x105x12", a:"Мост МТЗ"}]
            };
            return db[this.refType] || [];
        },

        init() {
            lucide.createIcons();
            this.$watch('page', () => this.$nextTick(() => lucide.createIcons()));
            this.$watch('theme', (val) => {
                localStorage.setItem('artel-theme', val);
                document.body.className = val;
            });
            document.body.className = this.theme;
        }
    }));
});
