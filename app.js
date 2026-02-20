document.addEventListener('alpine:init', () => {
    Alpine.data('appState', () => ({
        page: 'cal',
        theme: localStorage.getItem('artel-theme') || '',
        showSettings: false,
        currentDate: new Date(),
        obdCode: '',
        stockFilter: 'У меня есть',
        refType: 'metric',
        
        tabs: [
            {id: 'cal', title: 'Даты', icon: 'calendar'},
            {id: 'chat', title: 'Чат', icon: 'message-circle'},
            {id: 'stock', title: 'Склад', icon: 'package'},
            {id: 'ref', title: 'Инфо', icon: 'book-open'},
            {id: 'obd', title: 'OBD', icon: 'activity'},
            {id: 'ai', title: 'AI', icon: 'cpu'},
            {id: 'joke', title: 'Юмор', icon: 'laugh'}
        ],

        // --- Календарь ---
        get monthLabel() {
            return new Intl.DateTimeFormat('ru-RU', {month:'long', year:'numeric'}).format(this.currentDate);
        },
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
        getDayClass(day) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const isToday = new Date().toDateString() === date.toDateString();
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const dateStr = `${String(date.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isHoliday = ['01-01','01-07','03-08','05-01','05-09','07-03','11-07','12-25'].includes(dateStr);

            if (isToday) return 'bg-blue-600 text-white font-bold shadow-lg';
            if (isHoliday || isWeekend) return 'text-red-500 font-bold bg-red-50';
            return 'opacity-80';
        },

        // --- Справочники ---
        getRefData() {
            const db = {
                metric: [
                    {s:"M6", p:"1.0", d:"5.0"}, {s:"M8", p:"1.25", d:"6.8"}, 
                    {s:"M10", p:"1.5", d:"8.5"}, {s:"M12", p:"1.75", d:"10.2"},
                    {s:"M16", p:"2.0", d:"14.0"}, {s:"M20", p:"2.5", d:"17.5"}
                ],
                inch: [
                    {s:"1/4 UNC", p:"20", d:"5.1"}, {s:"5/16 UNC", p:"18", d:"6.6"},
                    {s:"3/8 UNC", p:"16", d:"8.0"}, {s:"1/2 UNF", p:"20", d:"11.5"}
                ],
                bearings: [
                    {n:"6204", d:"20", D:"47", B:"14"}, {n:"6205", d:"25", D:"52", B:"15"},
                    {n:"6206", d:"30", D:"62", B:"16"}, {n:"6308", d:"40", D:"90", B:"23"}
                ],
                seals: [
                    {t:"TC", s:"25x47x7", a:"Ступица перед."}, {t:"TC", s:"30x52x10", a:"Коленвал (перед)"},
                    {t:"SC", s:"40x60x7", a:"Редуктор"}, {t:"TC", s:"80x105x12", a:"Задний мост МТЗ"}
                ]
            };
            return db[this.refType] || [];
        },

        // --- OBD ---
        searchOBD() {
            const codes = {
                "P0101": "ДМРВ: Неверный диапазон сигнала. Проверь патрубки!",
                "P0300": "Случайные пропуски зажигания. Смотри свечи/катушки.",
                "P0420": "Низкая эффективность катализатора.",
                "520204": "МТЗ: Ошибка датчика давления масла КПП.",
                "523450": "John Deere: Нарушение связи CAN-шины двигателя.",
                "E12": "Трактор: Ошибка датчика положения навески."
            };
            return codes[this.obdCode.toUpperCase()] || "Код не найден. Попробуй поиск через AI раздел.";
        },

        // --- Контент ---
        dailyQuote: "Если кажется, что всё хорошо, значит, вы чего-то не заметили. (Закон Мерфи)",
        inventory: [
            {name: "Динамометрический ключ", details: "10-110 Нм, KingTony", cat: "У меня есть"},
            {name: "Набор экстракторов", details: "M3-M18", cat: "Могу поделиться"},
            {name: "Масло 10W-40 (5л)", details: "Нужно для ТО", cat: "Мне нужно"}
        ],
        jokes: [
            {text: "Инженер — это человек, который может объяснить, почему сломалось то, что по его расчетам сломаться не могло.", rating: 42},
            {text: "— Почему ты всегда используешь синюю изоленту? — Потому что на ней держится мир. Черная — это просто декор.", rating: 89}
        ],

        // --- Жесты (Свайпы) ---
        touchStartX: 0,
        handleTouchStart(e) { this.touchStartX = e.changedTouches[0].screenX; },
        handleTouchEnd(e) {
            const endX = e.changedTouches[0].screenX;
            if (this.touchStartX - endX > 80) this.changeMonth(1);
            if (endX - this.touchStartX > 80) this.changeMonth(-1);
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
