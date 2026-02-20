// КОНФИГУРАЦИЯ ОБЛАКА
const SB_URL = 'grsszunlfmehyykkvccj';
const SB_KEY = 'ZTEGCDF4981E';
// Инициализация Supabase (исправлено условие)
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
        inventory: [], // Склад под верстаком
        
        hasNotice: false,
        obdQuery: '',
        navIcons: ['home', 'message-circle', 'package', 'wrench', 'zap', 'brain-circuit', 'laugh', 'settings'],

        // --- ДАННЫЕ АРТЕЛИ (ТЗ) ---
        zapovedi: [
            "1. ТБ — не догма, а рекомендация.",
            "2. Закон лишней детали: это оптимизация веса.",
            "3. Синяя изолента лечит всё: от радиатора до сердца.",
            "4. Уважение к Мастодонтам: слушай ворчание деда.",
            "5. Инструмент — святое: взял чистым — верни чистым.",
            "6. Мат — производственная необходимость.",
            "7. «На глазок» — точнейший прибор.",
            "8. Никогда не сдавайся: возьми рычаг побольше.",
            "9. Делись схемами: скрытность — грех.",
            "10. Обмыл — значит, закрепил."
        ],
        
        // Справочник ГОСТов
        gosts: [
            {id: '001', title: 'О матюках', desc: 'Разрешены для М24 и выше.'},
            {id: '002', title: 'О точности', desc: '«Втирочку» и «Норм» — официальные величины.'},
            {id: '003', title: 'Об изоленте', desc: 'Синий — база. Черный — траур.'}
        ],

        // Справочник резьб
        rezba: [
            {m:'M6', s:'1.0', d:'5.0'}, 
            {m:'M8', s:'1.25', d:'6.8'}, 
            {m:'M10', s:'1.5', d:'8.5'},
            {m:'M12', s:'1.75', d:'10.2'}
        ],

        // Темы оформления (минимум 5 по ТЗ)
        themes: [
            {name:'Изолента', val:'theme-classic', color:'#0047AB'}, 
            {name:'Мазут', val:'theme-oil', color:'#1A1A1A'}, 
            {name:'Ржавчина', val:'theme-rust', color:'#8B4513'},
            {name:'Сталь', val:'theme-steel', color:'#BDC3C7'},
            {name:'Неон ИН-14', val:'theme-neon', color:'#FF5E00'}
        ],

        // --- ЛОГИКА КАЛЕНДАРЯ И ЦИТАТ ---
        currentHoliday: '',
        dailyQuote: '',
        
        async init() {
            lucide.createIcons();
            document.body.className = this.theme;
            this.generateQR();
            this.updateCalendar();

            // 1. Загрузка данных из облака
            await this.fetchCloudData();

            // 2. Подписка на Realtime
            if (supabase) {
                supabase.channel('artel-live')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artel_messages' }, payload => {
                        this.messages.push(payload.new);
                        if (payload.new.user_id !== this.myId) {
                            this.hasNotice = true;
                            this.playNeonSound(); // Опционально: звук лампы ИН-14
                        }
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'artel_inventory' }, () => {
                        this.fetchInventory();
                    })
                    .subscribe();
            }

            window.addEventListener('online', () => this.online = true);
            window.addEventListener('offline', () => this.online = false);
        },

        updateCalendar() {
            const holidays = {
                "01-01": "Новый год", "01-07": "Рождество (православное)",
                "03-08": "День женщин", "05-01": "Праздник труда",
                "05-09": "День Победы", "07-03": "День Независимости РБ",
                "11-07": "День Октябрьской революции", "12-25": "Рождество (католическое)"
            };
            const murphy = [
                "Если деталь должна подойти, она не подойдет.",
                "Из всех неприятностей произойдет самая затратная.",
                "Бритва Оккама: не плоди сущностей, мотай изоленту.",
                "Работает? Не трогай!"
            ];
            
            const today = new Date();
            const key = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            this.currentHoliday = holidays[key] || "Будни в Артели";
            this.dailyQuote = murphy[today.getDate() % murphy.length];
        },

        // --- РАБОТА С КЛАУДОМ ---
        async fetchCloudData() {
            if (!supabase) return;
            const { data: msgs } = await supabase.from('artel_messages').select('*').order('created_at', { ascending: true }).limit(50);
            if (msgs) this.messages = msgs;
            this.fetchInventory();
        },

        async fetchInventory() {
            if (!supabase) return;
            const { data } = await supabase.from('artel_inventory').select('*').order('created_at', { ascending: false });
            if (data) this.inventory = data;
        },

        async sendMsg() {
            if (!this.msg.trim()) return;
            const newMsg = { text: this.msg, user_id: this.myId, username: this.username };
            
            if (supabase) {
                await supabase.from('artel_messages').insert([newMsg]);
            } else {
                this.messages.push(newMsg); // Offline fallback
            }

            this.msg = '';
            // Анимация тумблера "ПУСК"
            setTimeout(() => { 
                const btn = document.getElementById('pusker');
                if(btn) btn.checked = false; 
            }, 500);
        },

        setTheme(t) {
            this.theme = t;
            localStorage.setItem('artel_theme', t);
            document.body.className = t;
        },

        generateQR() {
            if (typeof qrcode === 'undefined') return;
            const qr = qrcode(0, 'M');
            qr.addData(window.location.href);
            qr.make();
            const el = document.getElementById('qrcode');
            if (el) el.innerHTML = qr.createImgTag(4);
        },

        scanOBD() {
            const codes = {
                "P0101": "Нарушение работы ДМРВ.",
                "P0300": "Пропуски зажигания. Проверь провода.",
                "P0420": "Эффективность катализатора низкая. Вырезай.",
                "P0500": "Датчик скорости сдох."
            };
            return codes[this.obdQuery.toUpperCase()] || "КОД НЕ НАЙДЕН. ИЩИ ПОДСОС ВОЗДУХА.";
        }
    }));
});
