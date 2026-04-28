const translations = {
    es: {
        logout: "Salir", login_tab: "Iniciar Sesión", register_tab: "Registrarse",
        password: "Contraseña:", user: "Usuario:", login_btn: "Entrar", register_btn: "Crear Cuenta",
        cancel: "Cancelar", my_panel: "Mi Panel", ranking_tab: "Ranking Global",
        stat_played: "Jugadas", stat_wins: "Victorias", stat_streak: "Racha Act.", stat_max: "Mejor Racha",
        share_btn: "Compartir Resultado", dist_title: "Distribución de Intentos", chart_bar: "Barras",
        chart_pie: "Círculo", close: "Cerrar", player: "Jugador", attempts: "Intentos Medios",
        time: "Tiempo Medio", history_title: "Histórico de Palabras", history_desc: "Palabras de los últimos 5 días:",
        config_title: "Configuración", lang_label: "Idioma:", length_label: "Número de letras:",
        a11y_title: "Accesibilidad", theme_label: "Modo Claro:", anim_label: "Reducir Animaciones:",
        colorblind_label: "Alto Contraste:", dyslexic_label: "Fuente para Dislexia:", save_play: "Guardar y Jugar",
        community_title: "Comunidad", send: "Enviar", loading: "Descargando diccionario, por favor espera...",
        blog_placeholder: "Inicia sesión para escribir...\n(Pulsa Enter para enviar)",
        blog_placeholder_guest: "Inicia sesión para comentar...",
        msg_not_in_dic: "No está en el diccionario", msg_win: "¡Magnífico!", msg_lose: "Perdiste. Era: ",
        msg_copied: "¡Copiado al portapapeles!", msg_chat_sent: "Resultado enviado al chat.", dict_link: "Ver definición"
    },
    en: {
        logout: "Logout", login_tab: "Log In", register_tab: "Sign Up",
        password: "Password:", user: "Username:", login_btn: "Sign In", register_btn: "Create Account",
        cancel: "Cancel", my_panel: "Dashboard", ranking_tab: "Global Ranking",
        stat_played: "Played", stat_wins: "Wins", stat_streak: "Current Streak", stat_max: "Best Streak",
        share_btn: "Share Result", dist_title: "Guess Distribution", chart_bar: "Bars",
        chart_pie: "Pie Chart", close: "Close", player: "Player", attempts: "Avg. Attempts",
        time: "Avg. Time", history_title: "Word History", history_desc: "Words from the last 5 days:",
        config_title: "Settings", lang_label: "Language:", length_label: "Word Length:",
        a11y_title: "Accessibility", theme_label: "Light Mode:", anim_label: "Reduce Animations:",
        colorblind_label: "High Contrast:", dyslexic_label: "Dyslexia Font:", save_play: "Save and Play",
        community_title: "Community", send: "Send", loading: "Downloading dictionary, please wait...",
        blog_placeholder: "Log in to write...\n(Press Enter to send)",
        blog_placeholder_guest: "Log in to comment...",
        msg_not_in_dic: "Not in word list", msg_win: "Splendid!", msg_lose: "You lost. It was: ",
        msg_copied: "Copied to clipboard!", msg_chat_sent: "Result sent to chat.", dict_link: "View definition"
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("game-board");
    const keyboard = document.getElementById("keyboard");
    const loadingScreen = document.getElementById("loading-screen");
    const toastContainer = document.getElementById("toast-container");
    const announcer = document.getElementById("announcer"); 
    
    const configModal = document.getElementById("config-modal");
    const configForm = document.getElementById("config-form");
    const langSelect = document.getElementById("lang-select");
    const lengthSelect = document.getElementById("length-select");
    const sliderValue = document.getElementById("slider-value"); 
    
    const themeToggle = document.getElementById("theme-toggle");
    const animToggle = document.getElementById("anim-toggle");
    const colorblindToggle = document.getElementById("colorblind-toggle");
    const dyslexicToggle = document.getElementById("dyslexic-toggle");

    const historyModal = document.getElementById("history-modal");
    const closeHistoryBtn = document.getElementById("close-history");
    const btnHistoryHeader = document.getElementById("btn-history");
    const historyList = document.getElementById("history-list");
    const btnConfigHeader = document.getElementById("btn-config");

    const authModal = document.getElementById("auth-modal");
    const btnLoginModal = document.getElementById("btn-login-modal");
    const closeAuthBtn = document.getElementById("close-auth");
    const userMenu = document.getElementById("user-menu");
    const userGreeting = document.getElementById("user-greeting");
    const btnLogout = document.getElementById("btn-logout");
    
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");
    const loginError = document.getElementById("login-error");
    const regError = document.getElementById("reg-error");

    const btnStats = document.getElementById("btn-stats");
    const statsModal = document.getElementById("stats-modal");
    const closeStatsBtn = document.getElementById("close-stats");
    const tabMystats = document.getElementById("tab-mystats");
    const tabRanking = document.getElementById("tab-ranking");
    const mystatsView = document.getElementById("mystats-view");
    const rankingView = document.getElementById("ranking-view");

    const btnChartBar = document.getElementById("btn-chart-bar");
    const btnChartPie = document.getElementById("btn-chart-pie");
    const statDistribution = document.getElementById("stat-distribution");
    const statPieContainer = document.getElementById("stat-pie-container");
    const statPie = document.getElementById("stat-pie");
    const statLegend = document.getElementById("stat-legend");
    const btnShare = document.getElementById("btn-share");
    let currentDistribution = {}; 

    const btnToggleBlog = document.getElementById("btn-toggle-blog");
    const blogPanel = document.getElementById("blog-panel");
    const btnCloseBlogMobile = document.getElementById("btn-close-blog");
    const blogMessages = document.getElementById("blog-messages");
    const blogForm = document.getElementById("blog-form");
    const blogInput = document.getElementById("blog-input");
    const btnSendBlog = document.getElementById("btn-send-blog");

    let serverIP = window.location.hostname;
    if (window.location.hostname === '' || window.location.hostname === 'localhost') {
        serverIP = 'localhost';
    }
    const API_URL = `http://${serverIP}:3000/api`; 

    const numRows = 6;
    let numCols = 5; 
    let currentLang = 'es'; 
    let currentRow = 0;
    let currentCol = 0;
    
    let currentGameDate = ""; 
    let secretWord = ""; 
    let isGameOver = false;
    let gameStartTime = 0; 
    let validWordsSet = new Set(); 
    let currentDictionary = []; 

    function updateLanguageUI() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (translations[currentLang][key]) {
                el.textContent = translations[currentLang][key];
            }
        });
        checkSession(); 
    }

    function showToast(message, isPersistent = false) {
        const existingToast = Array.from(toastContainer.children).find(t => t.textContent.includes(message));
        
        if (existingToast) {
            existingToast.classList.remove("shake");
            void existingToast.offsetWidth; 
            existingToast.classList.add("shake");
            return existingToast;
        }

        const toast = document.createElement("div");
        toast.classList.add("toast");
        toast.textContent = message;
        
        if (!isPersistent) {
            toast.style.animation = "fadeInOut 3s forwards";
            setTimeout(() => toast.remove(), 3000); 
        } else {
            toast.style.animation = "none";
        }
        
        toastContainer.appendChild(toast);
        return toast;
    }

    function announceToScreenReader(message) {
        announcer.textContent = ""; 
        setTimeout(() => announcer.textContent = message, 100); 
    }

    function applyA11yPreferences() {
        document.body.classList.toggle("colorblind-mode", colorblindToggle.checked);
        document.body.classList.toggle("dyslexic-mode", dyslexicToggle.checked);
        document.body.classList.toggle("light-mode", themeToggle.checked);
        document.body.classList.toggle("no-animations", animToggle.checked);
    }

    themeToggle.addEventListener("change", applyA11yPreferences);
    animToggle.addEventListener("change", applyA11yPreferences);
    colorblindToggle.addEventListener("change", applyA11yPreferences);
    dyslexicToggle.addEventListener("change", applyA11yPreferences);

    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 75%, 65%)`; 
    }

    function normalizeWord(word) {
        return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    }
    
    function getFormattedDate(dateObj) {
        const tzoffset = dateObj.getTimezoneOffset() * 60000;
        return (new Date(dateObj.getTime() - tzoffset)).toISOString().split('T')[0];
    }
    
    function getStateKey(dateStr) {
        const activeUser = JSON.parse(localStorage.getItem("wordleActiveUser"));
        let userIdentifier = "invitado";
        if (activeUser) {
            userIdentifier = activeUser.email;
        }
        return `${userIdentifier}-${dateStr}-${currentLang}-${numCols}`;
    }
    
    function getDeterministicRandom(seed) {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    
    function getDeterministicWord(dateObj, wordList) {
        const tzoffset = dateObj.getTimezoneOffset() * 60000;
        const localDate = new Date(dateObj.getTime() - tzoffset);
        const epochDays = Math.floor(localDate.getTime() / 86400000);
        const seed = epochDays + wordList.length;
        const randomFraction = getDeterministicRandom(seed);
        const randomIndex = Math.floor(randomFraction * wordList.length);
        return wordList[randomIndex];
    }

    function checkSession() {
        const activeUser = JSON.parse(localStorage.getItem("wordleActiveUser"));
        
        if (activeUser) {
            btnLoginModal.classList.add("hidden");
            userMenu.classList.remove("hidden");
            userGreeting.textContent = `Hola, ${activeUser.username}`;
            btnStats.classList.remove("hidden"); 
            blogInput.disabled = false;
            btnSendBlog.disabled = false; 
            blogInput.placeholder = translations[currentLang].blog_placeholder;
        } else {
            btnLoginModal.classList.remove("hidden");
            userMenu.classList.add("hidden");
            btnStats.classList.add("hidden"); 
            blogInput.disabled = true;
            btnSendBlog.disabled = true; 
            blogInput.placeholder = translations[currentLang].blog_placeholder_guest;
        }
    }

    tabLogin.addEventListener("click", () => {
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        formLogin.classList.remove("hidden");
        formRegister.classList.add("hidden");
        loginError.classList.add("hidden");
    });
    
    tabRegister.addEventListener("click", () => {
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
        formRegister.classList.remove("hidden");
        formLogin.classList.add("hidden");
        regError.classList.add("hidden");
    });
    
    btnLoginModal.addEventListener("click", () => {
        authModal.showModal();
    });
    
    closeAuthBtn.addEventListener("click", () => {
        authModal.close();
    });
    
    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("wordleActiveUser");
        checkSession();
        showToast("Sesión cerrada.");
        startNewGameForDate(getFormattedDate(new Date()));
    });

    formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = document.getElementById("reg-user").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const pass = document.getElementById("reg-password").value;
        
        if (!/^(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/.test(pass)) {
            regError.textContent = "Mín. 8 chars, 1 mayús, 1 num";
            regError.classList.remove("hidden");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, email: email, password: pass })
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error);
            }
            
            localStorage.setItem("wordleActiveUser", JSON.stringify(data.user));
            authModal.close();
            checkSession();
            formRegister.reset();
            showToast("¡Cuenta creada con éxito!");
            startNewGameForDate(getFormattedDate(new Date()));
        } catch (error) {
            regError.textContent = error.message;
            regError.classList.remove("hidden");
        }
    });

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const pass = document.getElementById("login-password").value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: pass })
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error);
            }
            
            localStorage.setItem("wordleActiveUser", JSON.stringify(data.user));
            authModal.close();
            checkSession();
            formLogin.reset();
            showToast("Sesión iniciada");
            startNewGameForDate(getFormattedDate(new Date()));
        } catch (error) {
            loginError.textContent = error.message;
            loginError.classList.remove("hidden");
        }
    });

    tabMystats.addEventListener("click", () => {
        tabMystats.classList.add("active");
        tabRanking.classList.remove("active");
        mystatsView.classList.remove("hidden");
        rankingView.classList.add("hidden");
    });
    
    tabRanking.addEventListener("click", () => {
        tabRanking.classList.add("active");
        tabMystats.classList.remove("active");
        rankingView.classList.remove("hidden");
        mystatsView.classList.add("hidden");
        loadRanking();
    });
    
    btnStats.addEventListener("click", async () => {
        statsModal.showModal();
        await loadMyStats();
    });
    
    closeStatsBtn.addEventListener("click", () => {
        statsModal.close();
    });

    btnChartBar.addEventListener("click", () => {
        btnChartBar.classList.add("active");
        btnChartPie.classList.remove("active");
        statDistribution.classList.remove("hidden");
        statPieContainer.classList.add("hidden");
    });
    
    btnChartPie.addEventListener("click", () => {
        btnChartPie.classList.add("active");
        btnChartBar.classList.remove("active");
        statPieContainer.classList.remove("hidden");
        statDistribution.classList.add("hidden");
        renderPieChart();
    });

    function renderPieChart() {
        let total = Object.values(currentDistribution).reduce((a,b) => a+b, 0);
        statLegend.innerHTML = '';
        
        if (total === 0) {
            statPie.style.background = 'transparent';
            return;
        }
        
        let currentAngle = 0;
        let conicParts = [];
        const colors = ['#f5793a', '#a95aa1', '#85c0f9', '#f1c40f', '#538d4e', '#e74c3c']; 
        
        for (let i = 1; i <= numRows; i++) {
            let count = currentDistribution[i] || 0;
            if (count > 0) {
                let percentage = (count / total) * 100;
                conicParts.push(`${colors[i-1]} ${currentAngle}% ${currentAngle + percentage}%`);
                currentAngle += percentage;
                statLegend.innerHTML += `
                    <div class="legend-item">
                        <span class="legend-color" style="background:${colors[i-1]}"></span>
                        ${i} (${count})
                    </div>
                `;
            }
        }
        statPie.style.background = `conic-gradient(${conicParts.join(', ')})`;
    }

    async function loadMyStats() {
        const activeUser = JSON.parse(localStorage.getItem("wordleActiveUser"));
        if (!activeUser) {
            return;
        }
        
        const todayStr = getFormattedDate(new Date());
        const state = JSON.parse(localStorage.getItem("wordleStates"))?.[getStateKey(todayStr)];
        
        if (state && state.gameOver) {
            btnShare.classList.remove("hidden");
        } else {
            btnShare.classList.add("hidden");
        }

        try {
            const res = await fetch(`${API_URL}/stats/${activeUser.email}`);
            const data = await res.json();
            
            document.getElementById("stat-played").textContent = data.played;
            
            let winPct = 0;
            if (data.played > 0) {
                winPct = Math.round((data.wins / data.played) * 100);
            }
            
            document.getElementById("stat-winpct").textContent = `${winPct}%`;
            document.getElementById("stat-streak").textContent = data.currentStreak || 0;
            document.getElementById("stat-max-streak").textContent = data.maxStreak || 0;

            currentDistribution = data.distribution; 
            const distContainer = document.getElementById("stat-distribution");
            distContainer.innerHTML = '';
            
            const maxVal = Math.max(...Object.values(currentDistribution), 1); 

            for (let i = 1; i <= numRows; i++) {
                const count = currentDistribution[i] || 0;
                const widthPct = Math.max(7, Math.round((count / maxVal) * 100)); 
                
                let highlightClass = "";
                if (count > 0) {
                    highlightClass = "highlight";
                }
                
                distContainer.innerHTML += `
                    <div class="stat-row">
                        <span>${i}</span>
                        <div class="stat-bar ${highlightClass}" style="width: ${widthPct}%;">${count}</div>
                    </div>
                `;
            }
            
            if (btnChartPie.classList.contains("active")) {
                renderPieChart();
            }
        } catch (e) {
            console.error("Error stats", e);
        }
    }

    async function loadRanking() {
        try {
            const res = await fetch(`${API_URL}/ranking`);
            const data = await res.json();
            const tbody = document.getElementById("ranking-body");
            tbody.innerHTML = '';
            
            data.forEach((player, index) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${player.username}</td>
                        <td>${player.avg_attempts.toFixed(0)}</td>
                        <td>${player.avg_time.toFixed(2)}s</td>
                    </tr>
                `;
            });
        } catch (e) {
            console.error("Error ranking", e);
        }
    }

    async function saveGameToDatabase(won, attempts) {
        const activeUser = JSON.parse(localStorage.getItem("wordleActiveUser"));
        
        if (!activeUser) {
            return;
        }
        
        const timeSpentSeconds = (Date.now() - gameStartTime) / 1000;
        
        try {
            await fetch(`${API_URL}/save-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: activeUser.email, dateStr: currentGameDate, won: won, attempts: attempts, time_seconds: timeSpentSeconds })
            });
        } catch (error) {
            console.error(error);
        }
    }

    function getEmojisForGuess(guess, secret) {
        let secretLettersCount = {};
        for (let i = 0; i < secret.length; i++) {
            let char = secret[i];
            if (!secretLettersCount[char]) {
                secretLettersCount[char] = 0;
            }
            secretLettersCount[char] = secretLettersCount[char] + 1;
        }
        
        let statuses = [];
        for (let i = 0; i < numCols; i++) {
            statuses.push("absent");
        }
        
        for (let i = 0; i < numCols; i++) {
            if (guess[i] === secret[i]) {
                statuses[i] = "correct";
                secretLettersCount[guess[i]]--;
            }
        }
        
        for (let i = 0; i < numCols; i++) {
            if (statuses[i] !== "correct") {
                if (secretLettersCount[guess[i]] > 0) {
                    statuses[i] = "present";
                    secretLettersCount[guess[i]]--;
                }
            }
        }
        
        const isColorblind = document.body.classList.contains("colorblind-mode");
        let emojiString = "";
        
        for (let i = 0; i < statuses.length; i++) {
            let s = statuses[i];
            if (s === "correct") {
                if (isColorblind) {
                    emojiString += "🟧";
                } else {
                    emojiString += "🟩";
                }
            } else if (s === "present") {
                if (isColorblind) {
                    emojiString += "🟦";
                } else {
                    emojiString += "🟨";
                }
            } else {
                emojiString += "⬛";
            }
        }
        
        return emojiString;
    }

    btnShare.addEventListener("click", async () => {
        const dateStr = getFormattedDate(new Date());
        const state = JSON.parse(localStorage.getItem("wordleStates"))?.[getStateKey(dateStr)];
        
        if (!state || !state.gameOver) {
            return;
        }

        let shareText = `Wordle ${currentLang.toUpperCase()} - ${dateStr} - ${state.currentRow}/${numRows}\n\n`;
        
        for (let r = 0; r < state.currentRow; r++) {
            shareText += getEmojisForGuess(state.board[r], state.secret) + "\n";
        }

        try {
            await navigator.clipboard.writeText(shareText);
            showToast(translations[currentLang].msg_copied);
        } catch (e) {
            showToast(translations[currentLang].msg_chat_sent);
        }
        
        if (!blogInput.disabled) {
            blogInput.value = shareText;
            if (!blogPanel.classList.contains("active")) {
                blogPanel.classList.add("active");
                loadBlogMessages();
            }
            blogInput.focus();
        }
        statsModal.close();
    });

    function toggleBlog() {
        blogPanel.classList.toggle("active");
        if (blogPanel.classList.contains("active")) {
            loadBlogMessages();
        }
    }
    
    btnToggleBlog.addEventListener("click", toggleBlog);
    
    btnCloseBlogMobile.addEventListener("click", () => {
        blogPanel.classList.remove("active");
    });

    async function loadBlogMessages() {
        try {
            const res = await fetch(`${API_URL}/blog`);
            const messages = await res.json();
            blogMessages.innerHTML = '';
            
            messages.reverse().forEach(msg => {
                const date = new Date(msg.timestamp + 'Z');
                const dateString = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const msgDiv = document.createElement("div");
                msgDiv.classList.add("blog-msg");
                
                const contentDiv = document.createElement("div");
                contentDiv.style.whiteSpace = "pre-wrap"; 
                contentDiv.textContent = msg.message;

                msgDiv.innerHTML = `
                    <div class="blog-msg-header">
                        <span class="blog-msg-author" style="color: ${stringToColor(msg.username)}">${msg.username}</span>
                        <span>${dateString}</span>
                    </div>
                `;
                msgDiv.appendChild(contentDiv);
                blogMessages.appendChild(msgDiv);
            });
            
            blogMessages.scrollTop = blogMessages.scrollHeight;
        } catch (e) {
            console.error("Error cargando blog", e);
        }
    }

    blogForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const activeUser = JSON.parse(localStorage.getItem("wordleActiveUser"));
        
        if (!activeUser) {
            return;
        }
        
        const text = blogInput.value.trim();
        
        if (!text) {
            return;
        }

        try {
            btnSendBlog.disabled = true;
            const res = await fetch(`${API_URL}/blog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: activeUser.username, message: text })
            });
            
            if (!res.ok) {
                throw new Error("Error");
            }
            
            blogInput.value = "";
            await loadBlogMessages(); 
        } catch (e) {
            showToast("No se pudo enviar");
        } finally {
            btnSendBlog.disabled = false;
            blogInput.focus();
        }
    });

    blogInput.addEventListener("keydown", (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            blogForm.dispatchEvent(new Event("submit", {cancelable: true, bubbles: true}));
        }
    });

    loadBlogMessages();

    function saveToArchive(dateStr) {
        let archive = JSON.parse(localStorage.getItem("wordleArchive")) || {};
        archive[getStateKey(dateStr)] = true;
        localStorage.setItem("wordleArchive", JSON.stringify(archive));
    }

    function showHistoryPanel() {
        historyList.innerHTML = "";
        const today = new Date();
        const archive = JSON.parse(localStorage.getItem("wordleArchive")) || {};
        
        let localeCode = "en-US";
        if (currentLang === "es") {
            localeCode = "es-ES";
        }
        
        for (let i = 1; i <= 5; i++) {
            let pastDate = new Date();
            pastDate.setDate(today.getDate() - i);
            let dateKey = getFormattedDate(pastDate);
            let pastWord = getDeterministicWord(pastDate, currentDictionary);
            let dateString = pastDate.toLocaleDateString(localeCode, { weekday: 'short', day: 'numeric', month: 'short' });
            
            let li = document.createElement("li");
            
            if (archive[getStateKey(dateKey)]) {
                li.innerHTML = `
                    <span class="history-date">${dateString.toUpperCase()}</span> 
                    <span class="history-word">${pastWord}</span>
                `;
            } else {
                li.innerHTML = `
                    <span class="history-date">${dateString.toUpperCase()}</span> 
                    <span class="history-word unplayed-word">?????</span> 
                    <button class="btn-play-past" data-date="${dateKey}">Jugar</button>
                `;
            }
            historyList.appendChild(li);
        }
        
        document.querySelectorAll(".btn-play-past").forEach(btn => {
            btn.addEventListener("click", (e) => startNewGameForDate(e.target.getAttribute("data-date")));
        });
        
        btnHistoryHeader.classList.remove("hidden");
        historyModal.showModal(); 
    }

    closeHistoryBtn.addEventListener("click", () => {
        historyModal.close();
    });
    
    btnHistoryHeader.addEventListener("click", () => {
        showHistoryPanel();
    });
    
    btnConfigHeader.addEventListener("click", () => {
        configModal.showModal();
    });

    function saveGameState() {
        const boardState = [];
        for (let r = 0; r < numRows; r++) {
            let rowString = "";
            for (let c = 0; c < numCols; c++) {
                rowString += document.getElementById(`cell-${r}-${c}`).textContent || " ";
            }
            boardState.push(rowString);
        }
        
        let states = JSON.parse(localStorage.getItem("wordleStates")) || {};
        states[getStateKey(currentGameDate)] = {
            lang: currentLang,
            cols: numCols,
            secret: secretWord,
            board: boardState,
            currentRow: currentRow,
            currentCol: currentCol,
            gameOver: isGameOver
        };
        localStorage.setItem("wordleStates", JSON.stringify(states));
    }

    function startNewGameForDate(dateStr) {
        currentGameDate = dateStr;
        const parts = dateStr.split('-');
        const localDate = new Date(parts[0], parts[1] - 1, parts[2]); 
        secretWord = getDeterministicWord(localDate, currentDictionary);
        currentRow = 0;
        currentCol = 0;
        isGameOver = false;
        gameStartTime = Date.now(); 

        board.innerHTML = ''; 
        keyboard.innerHTML = '';
        toastContainer.innerHTML = '';
        
        createBoard();
        createKeyboard();

        let states = JSON.parse(localStorage.getItem("wordleStates")) || {};
        let saved = states[getStateKey(dateStr)];
        
        if (saved && saved.lang === currentLang && saved.cols === numCols) {
            currentRow = saved.currentRow;
            currentCol = saved.currentCol;
            isGameOver = saved.gameOver;
            
            for (let r = 0; r < numRows; r++) {
                for (let c = 0; c < numCols; c++) {
                    const char = saved.board[r][c];
                    if (char !== " ") {
                        document.getElementById(`cell-${r}-${c}`).textContent = char;
                    }
                }
                if (r < currentRow) {
                    evaluateSavedRow(r, true);
                }
            }
        }
        
        historyModal.close();
        const todayStr = getFormattedDate(new Date());
        const archive = JSON.parse(localStorage.getItem("wordleArchive")) || {};
        
        if (archive[getStateKey(todayStr)]) {
            btnHistoryHeader.classList.remove("hidden");
        } else {
            btnHistoryHeader.classList.add("hidden");
        }
    }

    async function initGame() {
        const savedConfig = JSON.parse(localStorage.getItem("wordleConfig"));
        
        if (savedConfig) {
            currentLang = savedConfig.lang || 'es'; 
            numCols = savedConfig.cols || 5;
            langSelect.value = currentLang;
            lengthSelect.value = numCols;
            sliderValue.textContent = numCols;
            
            themeToggle.checked = savedConfig.themeLight || false;
            animToggle.checked = savedConfig.noAnims || false;
            colorblindToggle.checked = savedConfig.colorblind || false;
            dyslexicToggle.checked = savedConfig.dyslexic || false;
            
            applyA11yPreferences();
            updateLanguageUI();

            configModal.close();
            await fetchDictionary(currentLang, numCols);
            startNewGameForDate(getFormattedDate(new Date()));
        } else {
            configModal.showModal();
        }
    }

    const dicUrls = {
        es: "https://raw.githubusercontent.com/words/an-array-of-spanish-words/master/index.json",
        en: "https://raw.githubusercontent.com/words/an-array-of-english-words/master/index.json"
    };

    async function fetchDictionary(lang, cols) {
        loadingScreen.classList.remove("hidden");
        
        try {
            const response = await fetch(dicUrls[lang]);
            if (!response.ok) {
                throw new Error("Error en red");
            }
            
            const allWords = await response.json();
            validWordsSet.clear();
            currentDictionary = [];
            
            for (let i = 0; i < allWords.length; i++) {
                let cleanWord = allWords[i].trim();
                if (cleanWord.length === cols) {
                    let normalized = normalizeWord(cleanWord);
                    validWordsSet.add(normalized);
                    currentDictionary.push(normalized);
                }
            }
        } catch (error) {
            loadingScreen.innerHTML = `<p>Error. <button onclick="location.reload()">Reintentar</button></p>`;
        } finally {
            if (currentDictionary.length > 0) {
                loadingScreen.classList.add("hidden");
            }
        }
    }

    lengthSelect.addEventListener("input", (e) => {
        sliderValue.textContent = e.target.value;
    });
    
    configForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        configModal.close();
        
        currentLang = langSelect.value;
        numCols = parseInt(lengthSelect.value);
        
        localStorage.setItem("wordleConfig", JSON.stringify({ 
            lang: currentLang,
            cols: numCols, 
            themeLight: themeToggle.checked,
            noAnims: animToggle.checked,
            colorblind: colorblindToggle.checked,
            dyslexic: dyslexicToggle.checked 
        }));
        
        applyA11yPreferences();
        updateLanguageUI();

        await fetchDictionary(currentLang, numCols); 
        startNewGameForDate(currentGameDate); 
    });

    function createBoard() {
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${numCols}, minmax(0, var(--cell-size)))`;
        
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.setAttribute("id", `cell-${r}-${c}`);
                board.appendChild(cell);
            }
        }
    }

    function createKeyboard() {
        keyboard.innerHTML = '';
        
        let keyboardLayout = [];
        
        if (currentLang === 'es') {
            keyboardLayout = [
                ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
                ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
            ];
        } else {
            keyboardLayout = [
                ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
            ];
        }
              
        keyboardLayout.forEach(row => {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("key-row");
            
            row.forEach(key => {
                const button = document.createElement("button");
                button.textContent = key;
                button.classList.add("key");
                button.setAttribute("id", `key-${key}`); 
                
                if (key === 'ENTER' || key === '⌫') {
                    button.classList.add("wide-key");
                }
                
                button.addEventListener("click", () => handleInput(key));
                rowDiv.appendChild(button);
            });
            keyboard.appendChild(rowDiv);
        });
    }

    function evaluateSavedRow(rowIdx, isLoad = false) {
        let guess = "";
        for (let c = 0; c < numCols; c++) {
            guess += document.getElementById(`cell-${rowIdx}-${c}`).textContent;
        }
        applyColors(guess, rowIdx, isLoad);
    }

    function getWordUrl(word) {
        const cleanWord = word.trim().toLowerCase();
        if (currentLang === 'es') {
            return `https://dle.rae.es/${cleanWord}`;
        } else {
            return `https://www.dictionary.com/browse/${cleanWord}`;
        }
    }

    function endGame(isWin) {
        isGameOver = true; 
        saveToArchive(currentGameDate); 
        saveGameState(); 
        
        let attemptsUsed = numRows;
        if (isWin) {
            attemptsUsed = currentRow + 1;
        }
        saveGameToDatabase(isWin, attemptsUsed);
        
        setTimeout(() => {
            let msg = "";
            if (isWin) {
                msg = translations[currentLang].msg_win;
            } else {
                msg = translations[currentLang].msg_lose + " " + secretWord;
            }
            
            const toast = showToast(msg, true);
            
            const link = document.createElement("a");
            link.href = getWordUrl(secretWord);
            link.target = "_blank";
            link.textContent = translations[currentLang].dict_link;
            
            toast.appendChild(document.createElement("br"));
            toast.appendChild(link);

            if (currentGameDate === getFormattedDate(new Date())) {
                btnHistoryHeader.classList.remove("hidden");
            }
            showHistoryPanel(); 
        }, 1500);
    }

    function triggerVictoryAnimation() {
        if (animToggle.checked) {
            return;
        }
        
        for (let i = 0; i < numCols; i++) {
            setTimeout(() => {
                document.getElementById(`cell-${currentRow}-${i}`).classList.add("bounce");
            }, i * 100);
        }
    }

    function evaluateGuess() {
        let guess = "";
        for (let c = 0; c < numCols; c++) {
            guess += document.getElementById(`cell-${currentRow}-${c}`).textContent;
        }
        
        if (!validWordsSet.has(guess)) {
            showToast(translations[currentLang].msg_not_in_dic); 
            announceToScreenReader(translations[currentLang].msg_not_in_dic); 
            return false; 
        }
        
        const correctCount = applyColors(guess, currentRow, false);
        
        if (correctCount === numCols) {
            triggerVictoryAnimation();
            endGame(true);
        } else if (currentRow === numRows - 1) {
            endGame(false);
        } else {
            saveGameState();
        }
        
        return true; 
    }

    function applyColors(guess, rowIdx, isLoad = false) {
        let secretLettersCount = {};
        for (let i = 0; i < secretWord.length; i++) {
            let char = secretWord[i];
            if (!secretLettersCount[char]) {
                secretLettersCount[char] = 0;
            }
            secretLettersCount[char] = secretLettersCount[char] + 1;
        }
        
        let statuses = [];
        for (let i = 0; i < numCols; i++) {
            statuses.push("absent");
        }
        
        let correctCount = 0; 
        
        for (let i = 0; i < numCols; i++) {
            if (guess[i] === secretWord[i]) {
                statuses[i] = "correct";
                secretLettersCount[guess[i]]--;
                correctCount++;
            }
        }
        
        for (let i = 0; i < numCols; i++) {
            if (statuses[i] !== "correct") {
                if (secretLettersCount[guess[i]] > 0) {
                    statuses[i] = "present";
                    secretLettersCount[guess[i]]--;
                }
            }
        }

        let announcerString = `Fila ${rowIdx + 1} evaluada: `; 

        for (let i = 0; i < numCols; i++) {
            const letter = guess[i];
            const status = statuses[i];
            const cell = document.getElementById(`cell-${rowIdx}-${i}`);
            const keyButton = document.getElementById(`key-${letter}`);
            
            if (!isLoad && !animToggle.checked) {
                setTimeout(() => cell.classList.add("flip", status), i * 150);
            } else {
                cell.classList.add(status);
            }
            
            let statusEs = "";
            if (status === "correct") {
                statusEs = "correcta";
            } else if (status === "present") {
                statusEs = "presente en otro lugar";
            } else {
                statusEs = "ausente";
            }
            
            announcerString += `Letra ${letter}, ${statusEs}. `;

            if (keyButton) {
                if (status === "correct") {
                    keyButton.classList.remove("present", "absent");
                    keyButton.classList.add("correct");
                } else if (status === "present" && !keyButton.classList.contains("correct")) {
                    keyButton.classList.remove("absent");
                    keyButton.classList.add("present");
                } else if (status === "absent" && !keyButton.classList.contains("correct") && !keyButton.classList.contains("present")) {
                    keyButton.classList.add("absent");
                }
            }
        }
        
        if (!isLoad) {
            setTimeout(() => announceToScreenReader(announcerString), 1000);
        }
        
        return correctCount;
    }

    function handleInput(key) {
        if (configModal.open || historyModal.open || authModal.open || statsModal.open || isGameOver || validWordsSet.size === 0) {
            return;
        }
        
        if (key === '⌫' || key === 'Backspace') {
            if (currentCol > 0) {
                currentCol--;
                document.getElementById(`cell-${currentRow}-${currentCol}`).textContent = '';
                saveGameState();
                announceToScreenReader("Borrar");
            }
            return;
        }
        
        if (key === 'ENTER' || key === 'Enter') {
            if (currentCol === numCols) {
                if (evaluateGuess()) {
                    currentRow++;
                    currentCol = 0;
                    saveGameState();
                }
            }
            return;
        }
        
        let isLetter = false;
        if (currentLang === 'es') {
            isLetter = /^[a-zA-ZñÑ]$/.test(key);
        } else {
            isLetter = /^[a-zA-Z]$/.test(key);
        }
        
        if (isLetter && currentCol < numCols && currentRow < numRows) {
            document.getElementById(`cell-${currentRow}-${currentCol}`).textContent = key.toUpperCase();
            currentCol++;
            saveGameState(); 
            announceToScreenReader(key.toUpperCase()); 
        }
    }

    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        if (configModal.open || historyModal.open || authModal.open || statsModal.open) {
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault(); 
        }
        handleInput(e.key);
    });
    
    initGame();
    checkSession();
});
