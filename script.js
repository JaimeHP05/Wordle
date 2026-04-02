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

    configModal.showModal();

    lengthSelect.addEventListener("input", (e) => {
        sliderValue.textContent = e.target.value;
    });
    
    // Configuración inicial
    configForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        configModal.close();
        
        currentLang = langSelect.value;
        numCols = parseInt(lengthSelect.value);

        loadingScreen.classList.remove("hidden");
        board.innerHTML = '';
        keyboard.innerHTML = '';

        try {
            const response = await fetch(dicUrls[currentLang]);
            const textData = await response.text();

            validWordsSet.clear();
            const allWords = textData.split('\n');
            
            const filteredWords = [];
            for (let word of allWords) {
                let cleanWord = word.trim();
                if (cleanWord.length === numCols) {
                    let normalized = normalizeWord(cleanWord);
                    validWordsSet.add(normalized);
                    filteredWords.push(normalized);
                }
            }

            if (filteredWords.length === 0) {
                throw new Error("No se encontraron palabras de esa longitud en el diccionario.");
            }

            secretWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
            console.log("Palabra secreta (solo para ti, desarrollador):", secretWord);

            currentRow = 0;
            currentCol = 0;
            isGameOver = false;
            loadingScreen.classList.add("hidden");

            createBoard();
            createKeyboard();
            announcer.textContent = `Partida iniciada. Diccionario cargado con éxito. Palabra de ${numCols} letras.`;

        } catch (error) {
            console.error(error);
            loadingScreen.innerHTML = "<p>Error al cargar el diccionario. Recarga la página.</p>";
        }
    });

    // Tablero
    function createBoard() {
        board.style.gridTemplateColumns = `repeat(${numCols}, minmax(0, var(--cell-size)))`;
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.setAttribute("id", `cell-${r}-${c}`);
                cell.setAttribute("role", "gridcell");
                cell.setAttribute("aria-label", "Casilla vacía");
                board.appendChild(cell);
            }
        }
    }

    // Teclado
    function createKeyboard() {
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

                if (key === 'ENTER') {
                    button.classList.add("wide-key");
                    button.setAttribute("aria-label", "Enviar intento");
                } else if (key === '⌫') {
                    button.classList.add("wide-key");
                    button.setAttribute("aria-label", "Borrar letra");
                } else {
                    button.setAttribute("aria-label", `Letra ${key}`);
                }
                
                button.addEventListener("click", () => handleInput(key));
                rowDiv.appendChild(button);
            });
            keyboard.appendChild(rowDiv);
        });
    }

    function evaluateGuess() {
        let guess = "";
        const currentCells = [];
        
        for (let c = 0; c < numCols; c++) {
            const cell = document.getElementById(`cell-${currentRow}-${c}`);
            guess += cell.textContent;
            currentCells.push(cell);
        }

        if (!validWordsSet.has(guess)) {
            alert("La palabra no está en el diccionario.");
            announcer.textContent = "La palabra no está en el diccionario.";
            return false;
        }

        let secretLettersCount = {};
        for (let char of secretWord) {
            secretLettersCount[char] = (secretLettersCount[char] || 0) + 1;
        }

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

        let resultAnnouncement = "Resultado: ";
        for (let i = 0; i < numCols; i++) {
            const letter = guess[i];
            const status = statuses[i];
            const cell = currentCells[i];
            const keyButton = document.getElementById(`key-${letter}`);

            cell.classList.add(status);
            
            let ariaStatus = status === "correct" ? "correcta" : (status === "present" ? "presente en otra posición" : "incorrecta");
            cell.setAttribute("aria-label", `Letra ${letter}, ${ariaStatus}`);
            resultAnnouncement += `Letra ${letter} ${ariaStatus}. `;

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

        announcer.textContent = resultAnnouncement;

        if (correctCount === numCols) {
            isGameOver = true;
            setTimeout(() => alert("¡Felicidades! Has adivinado la palabra."), 500);
        } else if (currentRow === numRows - 1) { 
            isGameOver = true;
            setTimeout(() => alert(`Has perdido. La palabra era: ${secretWord}`), 500);
        }

        return true; 
    }
    
    // Manejador de teclado
    function handleInput(key) {
        if (configModal.open || isGameOver || validWordsSet.size === 0) return; 
        // Borrar
        if (key === '⌫' || key === 'Backspace') {
            if (currentCol > 0) {
                currentCol--;
                const cell = document.getElementById(`cell-${currentRow}-${currentCol}`);
                cell.textContent = '';
            }
            return;
        }

        // Enter bloquea la fila
        if (key === 'ENTER' || key === 'Enter') {
            if (currentCol === numCols) {
                const isValidAttempt = evaluateGuess();
                if (isValidAttempt) {
                    currentRow++;
                    currentCol = 0;
                }
            }
            return;
        }

        // Introducir letras sin pasarse del límite
        const isLetter = currentLang === 'es' ? /^[a-zA-ZñÑ]$/.test(key) : /^[a-zA-Z]$/.test(key);
        if (isLetter && currentCol < numCols && currentRow < numRows) {
            const letterUpper = key.toUpperCase();
            const cell = document.getElementById(`cell-${currentRow}-${currentCol}`);
            cell.textContent = letterUpper;
            currentCol++;
        }
    }

    // Teclado físico
    document.addEventListener("keydown", (e) => {
        handleInput(e.key);
    });
});
