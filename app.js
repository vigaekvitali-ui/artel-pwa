document.addEventListener('alpine:init', () => {
    Alpine.data('artelCore', () => ({
        page: 1,
        theme: localStorage.getItem('artel_theme') || 'theme-classic',
        online: navigator.onLine,
        myId: localStorage.getItem('artel_id') || 'ART-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        username: localStorage.getItem('artel_user') || 'МАСТЕР-' + Math.floor(Math.random() * 999),
        msg: '',
        messages: JSON.parse(localStorage.getItem('artel_msgs') || '[]'),
        hasNotice: false,
        noticeCount: 1,
        obdQuery: '',

        navIcons: ['home', 'message-circle', 'package', 'wrench', 'zap', 'brain-circuit', 'laugh', 'settings'],
        
        themes: [
            {name:'Изолента', val:'theme-classic', color:'#003399'},
            {name:'Мазут', val:'theme-oil', color:'#1a1a1a'},
            {name:'Ржавчина', val:'theme-rust', color:'#7c2d12'},
            {name:'Неон', val:'theme-neon', color:'#0f172a'}
        ],

        zapovedi: [
            "ТБ — не догма, а рекомендация: Но запасных пальцев не выдают.",
            "Закон лишней детали: Остались болты — машина стала легче.",
            "Синяя изолента — универсальный клей мироздания.",
            "Инструмент — святое: взял ключ — верни чистым. Взял изоленту — найди край!",
            "Мат — производственный ускоритель процессов.",
            "«На глазок» — точнейший прибор в руках мастера.",
            "Никогда не сдавайся: не крутится — бери рычаг больше.",
            "Обмыл — значит, закрепил узел. Без заземления всё сгниет."
        ],

        rezba: [
            {m:'M6', s:'1.0', d:'5.0'}, {m:'M8', s:'1.25', d:'6.8'}, 
            {m:'M10', s:'1.5', d:'8.5'}, {m:'M12', s:'1.75', d:'10.2'}
        ],

        merphyQuote: "Если деталь не лезет — возьми молоток побольше. Если она сломалась — значит, всё равно подлежала замене.",
        currentDateLabel: new Date().toLocaleDateString('ru-BY', { weekday: 'short', day: 'numeric', month: 'short' }),

        scanOBD() {
            if(!this.obdQuery) return "ОЖИДАНИЕ ВВОДА...";
            const codes = {"P0101":"ДМРВ: Неверный сигнал. Продуй фильтр.","P0300":"Пропуски зажигания. Смотри катушки.","E12":"ГИДРАВЛИКА: Давление ниже нормы."};
            return codes[this.obdQuery.toUpperCase()] || "КОД НЕ НАЙДЕН. ПРОБУЙ СИНЮЮ ИЗОЛЕНТУ.";
        },

        sendMsg() {
            if(!this.msg.trim()) return;
            this.messages.push({ text: this.msg, user_id: this.myId, username: this.username });
            this.msg = '';
            localStorage.setItem('artel_msgs', JSON.stringify(this.messages));
            
            setTimeout(() => { document.getElementById('pusker').checked = false; }, 300);
            this.$nextTick(() => { const b = document.getElementById('chat-box'); b.scrollTop = b.scrollHeight; });
        },

        generateQR() {
            const qr = qrcode(0, 'M');
            qr.addData(window.location.href + '?invite=' + this.myId);
            qr.make();
            document.getElementById('qrcode').innerHTML = qr.createImgTag(4);
        },

        init() {
            lucide.createIcons();
            this.generateQR();
            window.addEventListener('online', () => this.online = true);
            window.addEventListener('offline', () => this.online = false);

            this.$watch('page', () => {
                this.$nextTick(() => {
                    lucide.createIcons();
                    if(this.page === 8) this.generateQR();
                    if(this.page === 2) { 
                        const b = document.getElementById('chat-box'); 
                        if(b) b.scrollTop = b.scrollHeight; 
                    }
                });
            });

            this.$watch('theme', v => {
                localStorage.setItem('artel_theme', v);
                document.body.className = v;
            });
            document.body.className = this.theme;

            // Рандомное мерцание лампы
            setInterval(() => { if(Math.random() > 0.8) this.hasNotice = !this.hasNotice; }, 5000);
        }
    }));
});
