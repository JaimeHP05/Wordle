document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("game-board");
    const keyboard = document.getElementById("keyboard");
    const announcer = document.getElementById("announcer");
    const loadingScreen = document.getElementById("loading-screen");
    const toastContainer = document.getElementById("toast-container");
    
    const configModal = document.getElementById("config-modal");
    const configForm = document.getElementById("config-form");
    const langSelect = document.getElementById("lang-select");
    const lengthSelect = document.getElementById("length-select");
    const sliderValue = document.getElementById("slider-value"); 

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

    const btnToggleBlog = document.getElementById("btn-toggle-blog");
    const blogPanel = document.getElementById("blog-panel");
    const btnCloseBlogMobile = document.getElementById("btn-close-blog");
    const blogMessages = document.getElementById("blog-messages");
    const blogForm = document.getElementById("blog-form");
    const blogInput = document.getElementById("blog-input");
    const btnSendBlog = document.getElementById("btn-send-blog");

    let serverIP = window.location.hostname;
    if (window.location.hostname === "") {
        serverIP = "localhost";
    }
    if (window.location.hostname === "localhost") {
        serverIP = "localhost";
    }
    const API_URL = "http://" + serverIP + ":3000/api";

    const numRows = 6;
    let numCols = 5; 
    let currentLang = "es"; 
    let currentRow = 0;
    let currentCol = 0;
    
    let currentGameDate = ""; 
    let secretWord = ""; 
    let isGameOver = false;
    let gameStartTime = 0; 
    let validWordsSet = new Set(); 
    let currentDictionary = []; 

    function normalizeWord(word) {
        return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    }

    function getTodayDate() {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(Date.now() - tzoffset)).toISOString().split("T")[0];
    }

    function getStateKey(dateStr) {
        const activeUser = JSON.parse(localStorage.getItem("wordleActiveUser"));
        let userIdentifier = "invitado";
        if (activeUser) {
            userIdentifier = activeUser.email;
        }
        return userIdentifier + "-" + dateStr + "-" + currentLang + "-" + numCols;
    }

    function getDeterministicRandom(seed) {
        let t = seed;
        t += 0x6D2B79F5;
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

    function showToast(message) {
        const existingToast = Array.from(toastContainer.children).find((t) => {
            return t.textContent.includes(message);
        });
        
        if (existingToast) {
            existingToast.classList.remove("shake");
            void existingToast.offsetWidth; 
            existingToast.classList.add("shake");
            return;
        }

        const toast = document.createElement("div");
        toast.classList.add("toast");
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000); 
    }

    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return "hsl(" + hue + ", 75%, 65%)"; 
    }

    function checkSession() {
        const activeUser = JSON.parse(localStorage.getItem("wordleActiveUser"));
        if (activeUser) {
            btnLoginModal.classList.add("hidden");
            userMenu.classList.remove("hidden");
            userGreeting.textContent = "Hola, " + activeUser.username;
            btnStats.classList.remove("hidden"); 
            blogInput.disabled = false;
            btnSendBlog.disabled = false;
            blogInput.placeholder = "Escribe un mensaje...";
        } else {
            btnLoginModal.classList.remove("hidden");
            userMenu.classList.add("hidden");
            btnStats.classList.add("hidden"); 
            blogInput.disabled = true;
            btnSendBlog.disabled = true;
            blogInput.placeholder = "Inicia sesión para escribir...";
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

        const passRegex = /^(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
        if (!passRegex.test(pass)) {
            regError.textContent = "Mín. 8 caracteres, 1 mayúscula y 1 número.";
            regError.classList.remove("hidden");
            return;
        }

        try {
            const response = await fetch(API_URL + "/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
            const response = await fetch(API_URL + "/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

    async function loadMyStats() {
        const activeUser = JSON.parse(localStorage.getItem("wordleActiveUser"));
        if (!activeUser) {
            return;
        }
        
        try {
            const res = await fetch(API_URL + "/stats/" + activeUser.email);
            const data = await res.json();
            
            document.getElementById("stat-played").textContent = data.played;
            let winPct = 0;
            if (data.played > 0) {
                winPct = Math.round((data.wins / data.played) * 100);
            }
            document.getElementById("stat-winpct").textContent = winPct + "%";

            const distContainer = document.getElementById("stat-distribution");
            distContainer.innerHTML = "";
            
            let maxVal = 1;
            for (let i = 1; i <= numRows; i++) {
                if (data.distribution[i] > maxVal) {
                    maxVal = data.distribution[i];
                }
            }

            for (let i = 1; i <= numRows; i++) {
                let count = 0;
                if (data.distribution[i]) {
                    count = data.distribution[i];
                }
                
                let widthPct = 7;
                if (count > 0) {
                    widthPct = Math.round((count / maxVal) * 100);
                }
                if (widthPct < 7) {
                    widthPct = 7;
                }
                
                let highlightClass = "";
                if (count > 0) {
                    highlightClass = "highlight";
                }
                
                distContainer.innerHTML += "<div class=\"stat-row\">" +
                    "<span>" + i + "</span>" +
                    "<div class=\"stat-bar " + highlightClass + "\" style=\"width: " + widthPct + "%;\">" + count + "</div>" +
                "</div>";
            }
        } catch (e) {
            console.error("Error stats", e);
        }
    }

    async function loadRanking() {
        try {
            const res = await fetch(API_URL + "/ranking");
            const data = await res.json();
            const tbody = document.getElementById("ranking-body");
            tbody.innerHTML = "";
            
            data.forEach((player, index) => {
                tbody.innerHTML += "<tr>" +
                    "<td>" + (index + 1) + "</td>" +
                    "<td>" + player.username + "</td>" +
                    "<td>" + player.avg_attempts.toFixed(0) + "</td>" +
                    "<td>" + player.avg_time.toFixed(2) + "s</td>" +
                "</tr>";
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
            const res = await fetch(API_URL + "/save-game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: activeUser.email, 
                    dateStr: currentGameDate, 
                    won: won, 
                    attempts: attempts, 
                    time_seconds: timeSpentSeconds 
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error);
            }
        } catch (error) { 
            console.error(error); 
        }
    }

    async function loadBlogMessages() {
        try {
            const res = await fetch(API_URL + "/blog");
            const messages = await res.json();
            blogMessages.innerHTML = "";
            
            messages.reverse().forEach((msg) => {
                const date = new Date(msg.timestamp + "Z");
                
                let min = date.getMinutes();
                if (min < 10) {
                    min = "0" + min;
                }
                const dateString = date.getHours() + ":" + min;
                
                const msgDiv = document.createElement("div");
                msgDiv.classList.add("blog-msg");
                
                const contentDiv = document.createElement("div");
                contentDiv.style.whiteSpace = "pre-wrap"; 
                contentDiv.textContent = msg.message;

                const headerDiv = document.createElement("div");
                headerDiv.classList.add("blog-msg-header");
                
                const authorSpan = document.createElement("span");
                authorSpan.classList.add("blog-msg-author");
                authorSpan.style.color = stringToColor(msg.username);
                authorSpan.textContent = msg.username;
                
                const timeSpan = document.createElement("span");
                timeSpan.textContent = dateString;
                
                headerDiv.appendChild(authorSpan);
                headerDiv.appendChild(timeSpan);
                
                msgDiv.appendChild(headerDiv);
                msgDiv.appendChild(contentDiv);
                
                blogMessages.appendChild(msgDiv);
            });
            
            blogMessages.scrollTop = blogMessages.scrollHeight;
        } catch (e) {
            console.error(e);
        }
    }

    btnToggleBlog.addEventListener("click", () => {
        blogPanel.classList.toggle("active");
        if (blogPanel.classList.contains("active")) {
            loadBlogMessages();
        }
    });

    btnCloseBlogMobile.addEventListener("click", () => {
        blogPanel.classList.remove("active");
    });

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
            const res = await fetch(API_URL + "/blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
        if (e.key === "Enter") {
            if (!e.shiftKey) {
                e.preventDefault(); 
                blogForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }
        }
    });

    function saveToArchive(dateStr) {
        let archive = JSON.parse(localStorage.getItem("wordleArchive"));
        if (!archive) {
            archive = {};
        }
        archive[getStateKey(dateStr)] = true; 
        localStorage.setItem("wordleArchive", JSON.stringify(archive));
    }

    function showHistoryPanel() {
        historyList.innerHTML = "";
        const today = new Date();
        let archive = JSON.parse(localStorage.getItem("wordleArchive"));
        if (!archive) {
            archive = {};
        }
        
        for (let i = 1; i <= 5; i++) {
            let pastDate = new Date();
            pastDate.setDate(today.getDate() - i);
            let dateKey = getFormattedDate(pastDate);
            let pastWord = getDeterministicWord(pastDate, currentDictionary);
            let dateString = pastDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
            let li = document.createElement("li");
            
            if (archive[getStateKey(dateKey)]) {
                li.innerHTML = "<span class=\"history-date\">" + dateString.toUpperCase() + "</span> <span class=\"history-word\">" + pastWord + "</span>";
            } else {
                li.innerHTML = "<span class=\"history-date\">" + dateString.toUpperCase() + "</span> <span class=\"history-word unplayed-word\">?????</span> <button class=\"btn-play-past\" data-date=\"" + dateKey + "\">Jugar</button>";
            }
            historyList.appendChild(li);
        }
        
        const playButtons = document.querySelectorAll(".btn-play-past");
        for (let i = 0; i < playButtons.length; i++) {
            playButtons[i].addEventListener("click", (e) => {
                startNewGameForDate(e.target.getAttribute("data-date"));
            });
        }
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
                const cell = document.getElementById("cell-" + r + "-" + c);
                if (cell.textContent) {
                    rowString += cell.textContent;
                } else {
                    rowString += " ";
                }
            }
            boardState.push(rowString);
        }
        
        let states = JSON.parse(localStorage.getItem("wordleStates"));
        if (!states) {
            states = {};
        }
        
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
        const parts = dateStr.split("-");
        const localDate = new Date(parts[0], parts[1] - 1, parts[2]); 
        secretWord = getDeterministicWord(localDate, currentDictionary);
        currentRow = 0; 
        currentCol = 0; 
        isGameOver = false;
        gameStartTime = Date.now(); 

        board.innerHTML = ""; 
        keyboard.innerHTML = "";
        createBoard(); 
        createKeyboard();

        let states = JSON.parse(localStorage.getItem("wordleStates"));
        if (!states) {
            states = {};
        }
        
        let saved = states[getStateKey(dateStr)];
        if (saved) {
            if (saved.lang === currentLang) {
                if (saved.cols === numCols) {
                    currentRow = saved.currentRow; 
                    currentCol = saved.currentCol; 
                    isGameOver = saved.gameOver;
                    
                    for (let r = 0; r < numRows; r++) {
                        for (let c = 0; c < numCols; c++) {
                            const char = saved.board[r][c];
                            if (char !== " ") {
                                document.getElementById("cell-" + r + "-" + c).textContent = char;
                            }
                        }
                        if (r < currentRow) {
                            evaluateSavedRow(r); 
                        }
                    }
                }
            }
        }
        
        historyModal.close();
        
        const todayStr = getFormattedDate(new Date());
        let archive = JSON.parse(localStorage.getItem("wordleArchive"));
        if (!archive) {
            archive = {};
        }
        
        if (archive[getStateKey(todayStr)]) {
            btnHistoryHeader.classList.remove("hidden");
        } else {
            btnHistoryHeader.classList.add("hidden");
        }
    }

    async function initGame() {
        const savedConfig = JSON.parse(localStorage.getItem("wordleConfig"));
        if (savedConfig) {
            currentLang = savedConfig.lang; 
            numCols = savedConfig.cols;
            langSelect.value = currentLang; 
            lengthSelect.value = numCols; 
            sliderValue.textContent = numCols;
            configModal.close();
            await fetchDictionary(currentLang, numCols);
            startNewGameForDate(getFormattedDate(new Date()));
        } else {
            configModal.showModal(); 
        }
    }

    async function fetchDictionary(lang, cols) {
        loadingScreen.classList.remove("hidden");
        try {
            let url = "";
            if (lang === "es") {
                url = "https://raw.githubusercontent.com/javierarce/palabras/master/listado-general.txt";
            } else {
                url = "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt";
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Error en red");
            }
            
            const textData = await response.text();
            validWordsSet.clear(); 
            currentDictionary = [];
            
            const allWords = textData.split("\n");
            
            for (let i = 0; i < allWords.length; i++) {
                let cleanWord = allWords[i].trim();
                if (cleanWord.length === cols) {
                    let normalized = normalizeWord(cleanWord);
                    validWordsSet.add(normalized);
                    currentDictionary.push(normalized);
                }
            }
        } catch (error) {
            loadingScreen.innerHTML = "<p>Error. <button onclick=\"location.reload()\">Reintentar</button></p>";
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
        localStorage.setItem("wordleConfig", JSON.stringify({ lang: currentLang, cols: numCols }));
        await fetchDictionary(currentLang, numCols);
        startNewGameForDate(getFormattedDate(new Date()));
    });

    function createBoard() {
        board.innerHTML = "";
        board.style.gridTemplateColumns = "repeat(" + numCols + ", minmax(0, var(--cell-size)))";
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                const cell = document.createElement("div");
                cell.classList.add("cell"); 
                cell.setAttribute("id", "cell-" + r + "-" + c);
                board.appendChild(cell);
            }
        }
    }

    function createKeyboard() {
        keyboard.innerHTML = "";
        
        let middleRow = [];
        if (currentLang === "es") {
            middleRow = ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"];
        } else {
            middleRow = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
        }
        
        const keyboardLayout = [
            ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"], 
            middleRow, 
            ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
        ];
        
        keyboardLayout.forEach(row => {
            const rowDiv = document.createElement("div"); 
            rowDiv.classList.add("key-row");
            
            row.forEach(key => {
                const button = document.createElement("button"); 
                button.textContent = key; 
                button.classList.add("key"); 
                button.setAttribute("id", "key-" + key); 
                
                if (key === "ENTER" || key === "⌫") {
                    button.classList.add("wide-key");
                }
                
                button.addEventListener("click", () => {
                    handleInput(key);
                });
                
                rowDiv.appendChild(button);
            });
            
            keyboard.appendChild(rowDiv);
        });
    }

    function evaluateSavedRow(rowIdx) {
        let guess = "";
        for (let c = 0; c < numCols; c++) {
            guess += document.getElementById("cell-" + rowIdx + "-" + c).textContent;
        }
        applyColors(guess, rowIdx);
    }

    function evaluateGuess() {
        let guess = "";
        for (let c = 0; c < numCols; c++) {
            guess += document.getElementById("cell-" + currentRow + "-" + c).textContent;
        }
        
        if (!validWordsSet.has(guess)) {
            showToast("No está en el diccionario"); 
            return false; 
        }
        
        const correctCount = applyColors(guess, currentRow);
        
        if (correctCount === numCols) {
            isGameOver = true; 
            saveToArchive(currentGameDate); 
            saveGameState();
            saveGameToDatabase(true, currentRow + 1); 
            
            setTimeout(() => { 
                showToast("¡Magnífico!"); 
                if (currentGameDate === getFormattedDate(new Date())) {
                    btnHistoryHeader.classList.remove("hidden"); 
                }
                showHistoryPanel(); 
            }, 1000);
        } else if (currentRow === numRows - 1) { 
            isGameOver = true; 
            saveToArchive(currentGameDate); 
            saveGameState();
            saveGameToDatabase(false, numRows); 
            
            setTimeout(() => { 
                showToast("Perdiste. Era: " + secretWord); 
                if (currentGameDate === getFormattedDate(new Date())) {
                    btnHistoryHeader.classList.remove("hidden"); 
                }
                showHistoryPanel(); 
            }, 1000);
        } else {
            saveGameState();
        }
        
        return true; 
    }

    function applyColors(guess, rowIdx) {
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
        
        for (let i = 0; i < numCols; i++) {
            const letter = guess[i]; 
            const status = statuses[i]; 
            const cell = document.getElementById("cell-" + rowIdx + "-" + i); 
            const keyButton = document.getElementById("key-" + letter);
            
            cell.classList.add(status);
            
            if (keyButton) {
                if (status === "correct") { 
                    keyButton.classList.remove("present", "absent"); 
                    keyButton.classList.add("correct"); 
                } else if (status === "present") {
                    if (!keyButton.classList.contains("correct")) { 
                        keyButton.classList.remove("absent"); 
                        keyButton.classList.add("present"); 
                    }
                } else if (status === "absent") {
                    if (!keyButton.classList.contains("correct")) {
                        if (!keyButton.classList.contains("present")) {
                            keyButton.classList.add("absent");
                        }
                    }
                }
            }
        }
        
        return correctCount;
    }

    function handleInput(key) {
        if (configModal.open || historyModal.open || authModal.open || statsModal.open || isGameOver || validWordsSet.size === 0) {
            return; 
        }
        
        if (key === "⌫" || key === "Backspace") {
            if (currentCol > 0) { 
                currentCol--; 
                document.getElementById("cell-" + currentRow + "-" + currentCol).textContent = ""; 
                saveGameState(); 
            }
            return;
        }
        
        if (key === "ENTER" || key === "Enter") {
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
        if (currentLang === "es") {
            isLetter = /^[a-zA-ZñÑ]$/.test(key);
        } else {
            isLetter = /^[a-zA-Z]$/.test(key);
        }
        
        if (isLetter) {
            if (currentCol < numCols) {
                if (currentRow < numRows) {
                    document.getElementById("cell-" + currentRow + "-" + currentCol).textContent = key.toUpperCase();
                    currentCol++; 
                    saveGameState(); 
                }
            }
        }
    }

    document.addEventListener("keydown", (e) => {
        if (configModal.open || historyModal.open || authModal.open || statsModal.open) {
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault(); 
        }
        handleInput(e.key);
    });
    
    initGame();
    checkSession();
    loadBlogMessages();
});
