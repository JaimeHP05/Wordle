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

    const API_URL = "http://localhost:3000/api";

    const numRows = 6;
    let numCols = 5; 
    let currentLang = 'es'; 
    let currentRow = 0;
    let currentCol = 0;
    
    let secretWord = ""; 
    let isGameOver = false;
    let validWordsSet = new Set(); 
    let currentDictionary = []; 

    function normalizeWord(word) {
        return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    }

    function getTodayDate() {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
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
        return wordList[epochDays % wordList.length];
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

    function checkSession() {
        const activeUser = JSON.parse(localStorage.getItem("wordleActiveUser"));
        if (activeUser) {
            btnLoginModal.classList.add("hidden");
            userMenu.classList.remove("hidden");
            userGreeting.textContent = "Hola, " + activeUser.username;
        } else {
            btnLoginModal.classList.remove("hidden");
            userMenu.classList.add("hidden");
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
            showToast("¡Registro completado!");
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
        } catch (error) {
            loginError.textContent = error.message;
            loginError.classList.remove("hidden");
        }
    });

    function showHistoryPanel() {
        historyList.innerHTML = "";
        const today = new Date();
        
        for (let i = 1; i <= 5; i++) {
            let pastDate = new Date();
            pastDate.setDate(today.getDate() - i);
            
            let pastWord = getDeterministicWord(pastDate, currentDictionary);
            let dateString = pastDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
            
            let li = document.createElement("li");
            li.innerHTML = "<span class=\"history-date\">" + dateString.toUpperCase() + "</span> <span class=\"history-word\">" + pastWord + "</span>";
            historyList.appendChild(li);
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

        const gameState = {
            date: getTodayDate(),
            lang: currentLang,
            cols: numCols,
            secret: secretWord,
            board: boardState,
            currentRow: currentRow,
            currentCol: currentCol,
            gameOver: isGameOver
        };
        localStorage.setItem("wordleState", JSON.stringify(gameState));
    }

    async function loadGameState() {
        const saved = JSON.parse(localStorage.getItem("wordleState"));
        const today = getTodayDate();

        if (saved && saved.date === today) {
            currentLang = saved.lang;
            numCols = saved.cols;
            secretWord = saved.secret;
            currentRow = saved.currentRow;
            currentCol = saved.currentCol;
            isGameOver = saved.gameOver;

            configModal.close();
            
            await fetchDictionary(currentLang, numCols);
            createBoard();
            createKeyboard();

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

            if (isGameOver) {
                btnHistoryHeader.classList.remove("hidden");
                announcer.textContent = "Ya has completado el Wordle de hoy.";
                setTimeout(() => {
                    showToast("Ya has jugado hoy. ¡Vuelve mañana para una nueva palabra!");
                    showHistoryPanel();
                }, 500);
            }
            return true;
        }
        return false;
    }
    
    async function fetchDictionary(lang, cols) {
        loadingScreen.classList.remove("hidden");
        try {
            let url = "";
            if (lang === 'es') {
                url = "https://raw.githubusercontent.com/javierarce/palabras/master/listado-general.txt";
            } else {
                url = "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt";
            }

            const response = await fetch(url);
            const textData = await response.text();
            
            validWordsSet.clear();
            currentDictionary = [];
            const allWords = textData.split('\n');
            
            for (let i = 0; i < allWords.length; i++) {
                let cleanWord = allWords[i].trim();
                if (cleanWord.length === cols) {
                    let normalized = normalizeWord(cleanWord);
                    validWordsSet.add(normalized);
                    currentDictionary.push(normalized);
                }
            }

            if (currentDictionary.length === 0) {
                throw new Error("Diccionario vacío");
            }
            
            if (secretWord === "") {
                secretWord = getDeterministicWord(new Date(), currentDictionary);
                console.log("Palabra secreta de hoy:", secretWord);
            }
        } catch (error) {
            console.error(error);
            loadingScreen.innerHTML = "<p>Error de conexión. Recarga la página.</p>";
        } finally {
            loadingScreen.classList.add("hidden");
        }
    }

    async function initGame() {
        const hasSavedGame = await loadGameState();
        if (!hasSavedGame) {
            configModal.showModal(); 
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
        secretWord = ""; 
        currentRow = 0;
        currentCol = 0;
        isGameOver = false;
        btnHistoryHeader.classList.add("hidden");

        board.innerHTML = '';
        keyboard.innerHTML = '';

        await fetchDictionary(currentLang, numCols);
        
        createBoard();
        createKeyboard();
        saveGameState(); 
        
        announcer.textContent = "Partida iniciada. Palabra de " + numCols + " letras.";
    });

    function createBoard() {
        board.innerHTML = '';
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
        keyboard.innerHTML = '';
        
        let middleRow = [];
        if (currentLang === 'es') {
            middleRow = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'];
        } else {
            middleRow = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
        }
        
        let keyboardLayout = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], 
            middleRow, 
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
        ];

        keyboardLayout.forEach(row => {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("key-row");
            row.forEach(key => {
                const button = document.createElement("button");
                button.textContent = key;
                button.classList.add("key");
                button.setAttribute("id", "key-" + key); 
                if (key === 'ENTER' || key === '⌫') {
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
            showToast("La palabra no está en el diccionario.");
            return false;
        }

        const correctCount = applyColors(guess, currentRow);

        if (correctCount === numCols) {
            isGameOver = true;
            setTimeout(() => {
                showToast("¡Felicidades! Has adivinado la palabra.");
                showHistoryPanel();
            }, 500);
        } else if (currentRow === numRows - 1) { 
            isGameOver = true;
            setTimeout(() => {
                showToast("¡Oh no! Has perdido. La palabra era: " + secretWord);
                showHistoryPanel();
            }, 500);
        }

        saveGameState(); 
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
        if (configModal.open || historyModal.open || authModal.open || isGameOver || validWordsSet.size === 0) {
            return;
        }

        if (key === '⌫' || key === 'Backspace') {
            if (currentCol > 0) {
                currentCol--;
                document.getElementById("cell-" + currentRow + "-" + currentCol).textContent = '';
                saveGameState(); 
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
        handleInput(e.key);
    });
    
    initGame();
    checkSession();
});
