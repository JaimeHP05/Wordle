document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("board");
    
    // Configuración base (luego lo haremos modular)
    const numRows = 6;
    let numCols = 5; 

    function createBoard() {
        // Le decimos cuántas columnas necesitamos
        board.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
        // (6 filas * 5 columnas = 30 casillas)
        for (let i = 0; i < numRows * numCols; i++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            // ID único para cada celda
            cell.setAttribute("id", `cell-${i}`);
            board.appendChild(cell);
        }
    }
    createBoard();
});