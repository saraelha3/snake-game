document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const homeScreen = document.getElementById('homeScreen');
    const gameContainer = document.getElementById('gameContainer');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startGameButton = document.getElementById('startGameButton');
    const backButton = document.getElementById('backButton');
    const pauseButton = document.getElementById('pauseButton');
    const replayButton = document.getElementById('replayButton');
    const backToMenuButton = document.getElementById('backToMenuButton');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScoreDisplay = document.getElementById('finalScore');
    const scoreDisplay = document.getElementById('score');

    // --- VARIABLES DE PERSONNALISATION ---
    let selectedBackground = { color: '#2c3e50', image: "url('https://www.transparenttextures.com/patterns/asfalt-light.png')" };
    let selectedSnakeColor = 'green';
    let selectedFoodColor = '#e74c3c';
    const snakeColorPalettes = {
        green: { main: '#2ecc71', alt: '#229954' }, blue: { main: '#3498db', alt: '#21618C' },
        orange: { main: '#e67e22', alt: '#AF601A' }, purple: { main: '#9b59b6', alt: '#633974' }
    };

    // --- VARIABLES DU JEU ---
    const gridSize = 20;
    let snake, food, score, direction, gameInterval;
    let isPaused = false;

    // --- GESTION DE L'ÉCRAN D'ACCUEIL ---
    document.querySelectorAll('#themeChoices .choice-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const currentChoice = e.currentTarget;
            document.querySelectorAll('#themeChoices .choice-item').forEach(child => child.classList.remove('selected'));
            currentChoice.classList.add('selected');
            const data = currentChoice.dataset;
            selectedBackground.color = data.bgColor; selectedBackground.image = data.bgImage;
            selectedSnakeColor = data.snakeColor; selectedFoodColor = data.foodColor;
            document.documentElement.style.setProperty('--theme-color', data.buttonColor);
        });
    });

    // --- GESTION DE LA NAVIGATION ---
    function showScreen(screen) { homeScreen.classList.add('hidden'); gameContainer.classList.add('hidden'); screen.classList.remove('hidden'); }
    startGameButton.addEventListener('click', () => { showScreen(gameContainer); startGame(); });
    backButton.addEventListener('click', () => { stopGame(); showScreen(homeScreen); });
    pauseButton.addEventListener('click', togglePause);
    backToMenuButton.addEventListener('click', () => { gameOverScreen.classList.add('hidden'); showScreen(homeScreen); });
    replayButton.addEventListener('click', () => { gameOverScreen.classList.add('hidden'); startGame(); });

    // --- LOGIQUE PRINCIPALE DU JEU ---
    function init() {
        snake = [{ x: 10, y: 10 }]; score = 0; direction = 'right'; isPaused = false;
        scoreDisplay.textContent = 'Score : 0'; gameOverScreen.classList.add('hidden');
        pauseButton.classList.remove('paused');
        generateFood();
    }

    function startGame() {
        stopGame(); init(); applyCustomizations();
        gameInterval = setInterval(update, 150);
        document.addEventListener('keydown', handleKeyPress);
    }

    function stopGame() {
        clearInterval(gameInterval);
        document.removeEventListener('keydown', handleKeyPress);
    }

    function togglePause() {
        if (gameContainer.classList.contains('hidden')) return;
        isPaused = !isPaused;
        if (isPaused) {
            clearInterval(gameInterval);
            pauseButton.classList.add('paused');
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white'; ctx.font = '50px Poppins'; ctx.textAlign = 'center';
            ctx.fillText('Pause', canvas.width / 2, canvas.height / 2);
        } else {
            pauseButton.classList.remove('paused');
            gameInterval = setInterval(update, 150);
        }
    }

    function handleKeyPress(event) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
        }
        const keyPressed = event.key;
        if (keyPressed.toLowerCase() === 'p') { togglePause(); return; }
        if (isPaused) return;
        if ((keyPressed === 'ArrowUp' || keyPressed.toLowerCase() === 'w') && direction !== 'down') direction = 'up';
        if ((keyPressed === 'ArrowDown' || keyPressed.toLowerCase() === 's') && direction !== 'up') direction = 'down';
        if ((keyPressed === 'ArrowLeft' || keyPressed.toLowerCase() === 'a') && direction !== 'right') direction = 'left';
        if ((keyPressed === 'ArrowRight' || keyPressed.toLowerCase() === 'd') && direction !== 'left') direction = 'right';
    }

    function applyCustomizations() { canvas.style.backgroundColor = selectedBackground.color; canvas.style.backgroundImage = selectedBackground.image; }

    function update() {
        const head = { ...snake[0] };
        switch (direction) {
            case 'up': head.y--; break; case 'down': head.y++; break; case 'left': head.x--; break; case 'right': head.x++; break;
        }
        if (hasCollision(head)) return gameOver();
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++; scoreDisplay.textContent = `Score : ${score}`; generateFood();
        } else { snake.pop(); }
        draw();
    }

    // --- FONCTIONS DE DESSIN ---
    function drawRoundedRect(x, y, width, height, radius) {
        ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y); ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius); ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const palette = snakeColorPalettes[selectedSnakeColor]; const cornerRadius = gridSize / 4;
        snake.forEach((segment, index) => {
            ctx.strokeStyle = '#333';
            if (index === 0) { ctx.fillStyle = palette.main; drawRoundedRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize, cornerRadius); drawSnakeEyes(segment); } 
            else { ctx.fillStyle = (index % 2 === 0) ? palette.main : palette.alt; drawRoundedRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize, cornerRadius); }
        });
        ctx.fillStyle = selectedFoodColor; ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.beginPath();
        const radius = gridSize / 2; ctx.arc(food.x * gridSize + radius, food.y * gridSize + radius, radius * 0.9, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    }

    function drawSnakeEyes(head) {
        ctx.fillStyle = 'white'; const eyeSize = gridSize / 5; let eye1_x, eye1_y, eye2_x, eye2_y;
        switch (direction) {
            case 'up': eye1_x = head.x * gridSize + eyeSize; eye1_y = head.y * gridSize + eyeSize; eye2_x = head.x * gridSize + gridSize - eyeSize * 2; eye2_y = head.y * gridSize + eyeSize; break;
            case 'down': eye1_x = head.x * gridSize + eyeSize; eye1_y = head.y * gridSize + gridSize - eyeSize * 2; eye2_x = head.x * gridSize + gridSize - eyeSize * 2; eye2_y = head.y * gridSize + gridSize - eyeSize * 2; break;
            case 'left': eye1_x = head.x * gridSize + eyeSize; eye1_y = head.y * gridSize + eyeSize; eye2_x = head.x * gridSize + eyeSize; eye2_y = head.y * gridSize + gridSize - eyeSize * 2; break;
            case 'right': eye1_x = head.x * gridSize + gridSize - eyeSize * 2; eye1_y = head.y * gridSize + eyeSize; eye2_x = head.x * gridSize + gridSize - eyeSize * 2; eye2_y = head.y * gridSize + gridSize - eyeSize * 2; break;
        }
        ctx.beginPath(); ctx.arc(eye1_x + eyeSize/2, eye1_y + eyeSize/2, eyeSize/1.5, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(eye2_x + eyeSize/2, eye2_y + eyeSize/2, eyeSize/1.5, 0, 2 * Math.PI); ctx.fill();
    }
    
    // --- AUTRES FONCTIONS DU JEU ---
    function generateFood() {
        food = { x: Math.floor(Math.random() * (canvas.width / gridSize)), y: Math.floor(Math.random() * (canvas.height / gridSize)) };
        if (snake.some(segment => segment.x === food.x && segment.y === food.y)) generateFood();
    }

    function hasCollision(head) {
        if (head.x < 0 || head.x >= (canvas.width / gridSize) || head.y < 0 || head.y >= (canvas.height / gridSize)) return true;
        for (let i = 1; i < snake.length; i++) { if (head.x === snake[i].x && head.y === snake[i].y) return true; }
        return false;
    }

    function gameOver() {
        isPaused = false; stopGame();
        finalScoreDisplay.textContent = score; gameOverScreen.classList.remove('hidden');
        const bestScore = localStorage.getItem('bestScore') || 0;
        if (score > bestScore) localStorage.setItem('bestScore', score);
    }
});