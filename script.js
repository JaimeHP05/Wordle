document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("game-board");
    const keyboard = document.getElementById("keyboard");
    
    const numRows = 6;
    let numCols = 5; 
    
    // Donde estamos escribiendo
    let currentRow = 0;
    let currentCol = 0;

    // Tablero
    function createBoard() {
        board.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.setAttribute("id", `cell-${r}-${c}`);
                board.appendChild(cell);
            }
        }
    }

    // Teclado visual
    const keyboardLayout = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
    ];

    // Teclado
    function createKeyboard() {
        keyboardLayout.forEach(row => {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("key-row");
            
            row.forEach(key => {
                const button = document.createElement("button");
                button.textContent = key;
                button.classList.add("key");
                
                if (key === 'ENTER' || key === '⌫') {
                    button.classList.add("wide-key");
                }
                
                button.addEventListener("click", () => handleInput(key));
                rowDiv.appendChild(button);
            });
            keyboard.appendChild(rowDiv);
        });
    }

    // Manejador de teclado
    function handleInput(key) {
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
                // Pasamos a la siguiente fila (validación real en Sprint 2)
                currentRow++;
                currentCol = 0;
            }
            return;
        }

        // Introducir letras sin pasarse del límite
        const isLetter = /^[a-zA-ZñÑ]$/.test(key);
        if (isLetter && currentCol < numCols && currentRow < numRows) {
            const cell = document.getElementById(`cell-${currentRow}-${currentCol}`);
            cell.textContent = key.toUpperCase();
            currentCol++;
        }
    }

    // Teclado físico
    document.addEventListener("keydown", (e) => {
        handleInput(e.key);
    });

    createBoard();
    createKeyboard();
});
