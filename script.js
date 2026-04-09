document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("game-board");
    const keyboard = document.getElementById("keyboard");
    const announcer = document.getElementById("announcer");
    const loadingScreen = document.getElementById("loading-screen");
    
    const configModal = document.getElementById("config-modal");
    const configForm = document.getElementById("config-form");
    const langSelect = document.getElementById("lang-select");
    const lengthSelect = document.getElementById("length-select");
    const sliderValue = document.getElementById("slider-value"); 

    const numRows = 6;
    let numCols = 5; 
    let currentLang = 'es'; 
    let currentRow = 0;
    let currentCol = 0;
    
    let secretWord = ""; 
    let isGameOver = false;
    let validWordsSet = new Set(); 

    const dicUrls = {
        es: "https://raw.githubusercontent.com/javierarce/palabras/master/listado-general.txt",
        en: "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt"
    };

    function normalizeWord(word) {
        return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    }

    function getTodayDate() {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
    }

    function saveGameState() {
        const boardState = [];
        for (let r = 0; r < numRows; r++) {
            let rowString = "";
            for (let c = 0; c < numCols; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);
                rowString += cell.textContent || " ";
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
                        const cell = document.getElementById(`cell-${r}-${c}`);
                        cell.textContent = char;
                    }
                }
                if (r < currentRow) {
                    evaluateSavedRow(r);
                }
            }

            if (isGameOver) {
                announcer.textContent = "Ya has completado el Wordle de hoy.";
                setTimeout(() => alert("Ya has jugado hoy. ¡Vuelve mañana para una nueva palabra!"), 500);
            }
            return true;
        }
        return false;
    }
    
    async function fetchDictionary(lang, cols) {
        loadingScreen.classList.remove("hidden");
        try {
            const response = await fetch(dicUrls[lang]);
            const textData = await response.text();
            
            validWordsSet.clear();
            const allWords = textData.split('\n');
            const filteredWords = [];
            
            for (let word of allWords) {
                let cleanWord = word.trim();
                if (cleanWord.length === cols) {
                    let normalized = normalizeWord(cleanWord);
                    validWordsSet.add(normalized);
                    filteredWords.push(normalized);
                }
            }

            if (filteredWords.length === 0) throw new Error("Diccionario vacío");
            
            if (!secretWord) {
                secretWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
                console.log("Palabra secreta:", secretWord);
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

        board.innerHTML = '';
        keyboard.innerHTML = '';

        await fetchDictionary(currentLang, numCols);
        
        createBoard();
        createKeyboard();
        saveGameState();
        
        announcer.textContent = `Partida iniciada. Palabra de ${numCols} letras.`;
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
        const middleRow = currentLang === 'es' 
            ? ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ']
            : ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];

        const keyboardLayout = [
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
                button.setAttribute("id", `key-${key}`); 
                if (key === 'ENTER' || key === '⌫') button.classList.add("wide-key");
                button.addEventListener("click", () => handleInput(key));
                rowDiv.appendChild(button);
            });
            keyboard.appendChild(rowDiv);
        });
    }

    function evaluateSavedRow(rowIdx) {
        let guess = "";
        for (let c = 0; c < numCols; c++) guess += document.getElementById(`cell-${rowIdx}-${c}`).textContent;
        applyColors(guess, rowIdx);
    }

    function evaluateGuess() {
        let guess = "";
        for (let c = 0; c < numCols; c++) guess += document.getElementById(`cell-${currentRow}-${c}`).textContent;

        if (!validWordsSet.has(guess)) {
            alert("La palabra no está en el diccionario.");
            return false;
        }

        const correctCount = applyColors(guess, currentRow);

        if (correctCount === numCols) {
            isGameOver = true;
            setTimeout(() => alert("¡Felicidades! Has adivinado la palabra."), 500);
        } else if (currentRow === numRows - 1) { 
            isGameOver = true;
            setTimeout(() => alert(`¡Oh no! Has perdido. La palabra era: ${secretWord}`), 500);
        }

        saveGameState();
        return true; 
    }

    function applyColors(guess, rowIdx) {
        let secretLettersCount = {};
        for (let char of secretWord) secretLettersCount[char] = (secretLettersCount[char] || 0) + 1;

        let statuses = Array(numCols).fill("absent");
        let correctCount = 0; 

        for (let i = 0; i < numCols; i++) {
            if (guess[i] === secretWord[i]) {
                statuses[i] = "correct";
                secretLettersCount[guess[i]]--;
                correctCount++;
            }
        }

        for (let i = 0; i < numCols; i++) {
            if (statuses[i] !== "correct" && secretLettersCount[guess[i]] > 0) {
                statuses[i] = "present";
                secretLettersCount[guess[i]]--;
            }
        }

        for (let i = 0; i < numCols; i++) {
            const letter = guess[i];
            const status = statuses[i];
            const cell = document.getElementById(`cell-${rowIdx}-${i}`);
            const keyButton = document.getElementById(`key-${letter}`);

            cell.classList.add(status);
            
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
        return correctCount;
    }

    function handleInput(key) {
        if (configModal.open || isGameOver || validWordsSet.size === 0) return; 

        if (key === '⌫' || key === 'Backspace') {
            if (currentCol > 0) {
                currentCol--;
                document.getElementById(`cell-${currentRow}-${currentCol}`).textContent = '';
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

        const isLetter = currentLang === 'es' ? /^[a-zA-ZñÑ]$/.test(key) : /^[a-zA-Z]$/.test(key);
        if (isLetter && currentCol < numCols && currentRow < numRows) {
            document.getElementById(`cell-${currentRow}-${currentCol}`).textContent = key.toUpperCase();
            currentCol++;
            saveGameState();
        }
    }

    document.addEventListener("keydown", (e) => handleInput(e.key));
    initGame();
});
