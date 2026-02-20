// КОНФИГУРАЦИЯ ОБЛАКА
const SB_URL = 'grsszunlfmehyykkvccj';
const SB_KEY = 'ZTEGCDF4981E';
const supabase = (SB_URL.includes('your-project')) ? null : supabase.createClient(SB_URL, SB_KEY);

document.addEventListener('alpine:init', () => {
    Alpine.data('artelCore', () => ({
        page: 1,
        theme: localStorage.getItem('artel_theme') || 'theme-classic',
        online: navigator.onLine,
        myId: localStorage.getItem('artel_id') || 'ART-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        username: localStorage.getItem('artel_user') || 'Инженер-' + Math.floor(Math.random() * 99),
        
        msg: '',
        messages: [],
        inventory: [],
        hasNotice: false,
        obdQuery: '',
        
        // Календарь и цитаты
        currentHoliday: '',
        dailyQuote: '',

        // ДАННЫЕ АРТЕЛИ (ТЗ)
        zapovedi: [
            "1. ТБ — не догма, а рекомендация: запасных пальцев не выдают.",
            "2. Закон лишней детали: если работает — это оптимизация веса.",
            "3. Синяя изолента — универсальный клей: лечит всё.",
            "4. Уважение к Мастодонтам: слушай ворчание деда.",
            "5. Инструмент — святое: взял чистым — верни чистым. Найди край изоленты!",
            "6. Мат — производственная необходимость: ускоритель процесса.",
            "7. «На глазок» — точнейший прибор: микрометр не нужен.",
            "8. Никогда не сдавайся: не крутится — возьми рычаг побольше.",
            "9. Делись схемами: скрывать решение — грех.",
            "10. Обмыл — значит, закрепил: иначе будет коррозия."
        ],

        // СПРАВОЧНИКИ (ТЗ: Page 4)
        rezba: [
            {m:'M6', s:'1.0', d:'5.0'}, {m:'M8', s:'1.25', d:'6.8'}, 
            {m:'M10', s:'1.5', d:'8.5'}, {m:'M12', s:'1.75', d:'10.2'},
            {m:'M14', s:'2.0', d:'12.0'}, {m:'M16', s:'2.0', d:'14.0'}
        ],

        // Темы (Минимум 5 по ТЗ)
        themes: [
            {name:'Изолента', val:'theme-classic', color:'#0047AB'},
            {name:'Мазут', val:'theme-oil', color:'#1A1A1A'},
            {name:'Ржавчина', val:'theme-rust', color:'#8B4513'},
            {name:'Сталь', val:'theme-steel', color:'#BDC3C7'},
            {name:'ИН-14 Неон', val:'theme-neon', color:'#FF5E00'}
        ],

        async init() {
            lucide.createIcons();
            document.body.className = this.theme;
            this.updateCalendar();
            this.generateQR();

            if (supabase) {
                await this.fetchCloudData();
                // Realtime подписка
                supabase.channel('artel-live')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artel_messages' }, p => {
                        this.messages.push(p.new);
                        if (p.new.user_id !== this.myId) this.hasNotice = true;
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'artel_inventory' }, () => this.fetchInventory())
                    .subscribe();
            }

            window.addEventListener('online', () => this.online = true);
            window.addEventListener('offline', () => this.online = false);
        },

        updateCalendar() {
            const holidays = {
                "01-01": "Новый год", "01-07": "Рождество (православное)",
                "05-09": "День Победы", "07-03": "День Независимости РБ",
                "11-07": "День Октябрьской революции", "12-25": "Рождество (католическое)"
            };
            const quotes = [
                "Если деталь должна подойти, она не подойдет. (Закон Мерфи)",
                "Бритва Оккама: отсекай лишнее, мотай синее.",
                "Всё, что может пойти не так, пойдет не так.",
                "Если прибор не работает, прочтите, наконец, инструкцию!"
            ];
            const now = new Date();
            const key = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
            this.currentHoliday = holidays[key] || "Будни в Артели";
            this.dailyQuote = quotes[now.getDate() % quotes.length];
        },

        async fetchCloudData() {
            const { data: msgs } = await supabase.from('artel_messages').select('*').order('created_at', { ascending: true }).limit(50);
            if (msgs) this.messages = msgs;
            this.fetchInventory();
        },

        async fetchInventory() {
            const { data } = await supabase.from('artel_inventory').select('*').order('created_at', { ascending: false });
            if (data) this.inventory = data;
        },

        async sendMsg() {
            if (!this.msg.trim() || !supabase) return;
            const newMsg = { text: this.msg, user_id: this.myId, username: this.username };
            await supabase.from('artel_messages').insert([newMsg]);
            this.msg = '';
            // Возвращаем тумблер ПУСК в исходное положение через 0.5с
            setTimeout(() => { if(document.getElementById('pusker')) document.getElementById('pusker').checked = false; }, 500);
        },

        scanOBD() {
            const codes = {
                "P0171": "Бедная смесь. Ищи подсос воздуха.",
                "P0300": "Пропуски зажигания. Проверь свечи.",
                "P0500": "Датчик скорости. Оборван провод."
            };
            return codes[this.obdQuery.toUpperCase()] || "КОД НЕ НАЙДЕН. МОТАЙ ИЗОЛЕНТУ.";
        },

        generateQR() {
            if (typeof qrcode === 'undefined') return;
            const qr = qrcode(0, 'L');
            qr.addData(window.location.href);
            qr.make();
            const container = document.getElementById('qrcode');
            if (container) container.innerHTML = qr.createImgTag(4);
        }
    }));
});
