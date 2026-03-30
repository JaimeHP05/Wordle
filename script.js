document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("game-board");
    const keyboard = document.getElementById("keyboard");
    const announcer = document.getElementById("announcer");

    const configModal = document.getElementById("config-modal");
    const configForm = document.getElementById("config-form");
    const langSelect = document.getElementById("lang-select");
    const lengthSelect = document.getElementById("length-select");
    const sliderValue = document.getElementById("slider-value");

    configModal.showModal();

    lengthSelect.addEventListener("input", (e) => {
        sliderValue.textContent = e.target.value;
    });

    const numRows = 6;
    let numCols = 5; 
    let currentLang = 'es'; 
    let currentRow = 0;
    let currentCol = 0;

    // Configuración inicial
    configForm.addEventListener("submit", (e) => {
        currentLang = langSelect.value;
        numCols = parseInt(lengthSelect.value);

        board.innerHTML = '';
        keyboard.innerHTML = '';

        currentRow = 0;
        currentCol = 0;

        createBoard();
        createKeyboard();
        
        announcer.textContent = `Partida iniciada. Palabra de ${numCols} letras en ${currentLang === 'es' ? 'español' : 'inglés'}.`;
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

    // Manejador de teclado
    function handleInput(key) {
        if (configModal.open) return;
        // Borrar
        if (key === '⌫' || key === 'Backspace') {
            if (currentCol > 0) {
                currentCol--;
                const cell = document.getElementById(`cell-${currentRow}-${currentCol}`);
                cell.textContent = '';
                cell.setAttribute("aria-label", "Casilla vacía");
                announcer.textContent = "Letra borrada";
            }
            return;
        }

        // Enter bloquea la fila
        if (key === 'ENTER' || key === 'Enter') {
            if (currentCol === numCols) {
                // Pasamos a la siguiente fila (validación real en Sprint 2)
                announcer.textContent = "Intento enviado";
                currentRow++;
                currentCol = 0;
            } else {
                announcer.textContent = "Faltan letras para completar la palabra";
            }
            return;
        }

        // Introducir letras sin pasarse del límite
        const isLetter = currentLang === 'es' ? /^[a-zA-ZñÑ]$/.test(key) : /^[a-zA-Z]$/.test(key);
        if (isLetter && currentCol < numCols && currentRow < numRows) {
            const letterUpper = key.toUpperCase();
            const cell = document.getElementById(`cell-${currentRow}-${currentCol}`);
            cell.textContent = letterUpper;
            cell.setAttribute("aria-label", `Casilla con letra ${letterUpper}`);
            announcer.textContent = letterUpper;
            currentCol++;
        }
    }

    // Teclado físico
    document.addEventListener("keydown", (e) => {
        handleInput(e.key);
    });
});
