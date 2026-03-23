import { RenderNode, EngineTicker } from './engine.js';

export class FlappyLogic {
    constructor(node) {
        this.node = node;
        this.birdNodePath = `${this.node.path}.pajaro`;
        this.scorePath = `${this.node.path}.puntuacion`;
        this.gameOverPath = `${this.node.path}.pantalla_gameover`;
        this.restartBtnPath = `${this.node.path}.pantalla_gameover.btn_reiniciar`;
        this.pipesContainerPath = `${this.node.path}.tuberias_contenedor`;

        this.birdY = 200;
        this.velocity = 0;
        this.gravity = 1500; // pixels per second squared
        this.jumpForce = -450;
        this.gameActive = false;
        this.score = 0;

        this.pipes = [];
        this.pipeSpeed = 150; // pixels per second
        this.pipeWidth = 50;
        this.pipeGap = 130;
        this.spawnTimer = 0;

        this.updateCallback = this.update.bind(this);
    }

    onMount() {
        console.log(`[App] Flappy Bird Montado en: ${this.node.path}`);

        // Listen to clicks on the entire app container for jumping
        this.node.domElement.addEventListener('click', () => this.jump());

        // Listen to restart button
        setTimeout(() => {
            const restartBtn = RenderNode.registry.get(this.restartBtnPath);
            if (restartBtn) {
                restartBtn.domElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.resetGame();
                });
            }
        }, 100);

        EngineTicker.subscribe(this.updateCallback);
        this.resetGame();
    }

    onUnmount() {
        EngineTicker.unsubscribe(this.updateCallback);
    }

    jump() {
        if (!this.gameActive && this.birdY < 400) {
            // Start game on first click
            this.gameActive = true;
            const goNode = RenderNode.registry.get(this.gameOverPath);
            if (goNode) goNode.domElement.style.display = 'none';
        }

        if (this.gameActive) {
            this.velocity = this.jumpForce;
            // Add a little flap animation using CSS
            const ala = RenderNode.registry.get(`${this.birdNodePath}.ala_pajaro`);
            if (ala) {
                ala.domElement.style.transform = 'translateY(-4px)';
                setTimeout(() => {
                    if (ala && ala.domElement) ala.domElement.style.transform = 'translateY(0)';
                }, 100);
            }
        }
    }

    resetGame() {
        this.birdY = 200;
        this.velocity = 0;
        this.score = 0;
        this.gameActive = false;
        this.pipes = [];
        this.spawnTimer = 0;

        this.updateScoreDisplay();

        const birdNode = RenderNode.registry.get(this.birdNodePath);
        if (birdNode) {
            birdNode.domElement.style.top = `${this.birdY}px`;
            birdNode.domElement.style.transform = `rotate(0deg)`;
        }

        const goNode = RenderNode.registry.get(this.gameOverPath);
        if (goNode) goNode.domElement.style.display = 'none';

        const pipesContainer = RenderNode.registry.get(this.pipesContainerPath);
        if (pipesContainer && pipesContainer.domElement) {
            pipesContainer.domElement.innerHTML = ''; // Clear DOM pipes
        }
    }

    gameOver() {
        if (!this.gameActive) return;
        this.gameActive = false;
        const goNode = RenderNode.registry.get(this.gameOverPath);
        if (goNode) goNode.domElement.style.display = 'block';
    }

    spawnPipe() {
        const pipesContainer = RenderNode.registry.get(this.pipesContainerPath);
        if (!pipesContainer || !pipesContainer.domElement) return;

        const containerHeight = pipesContainer.domElement.clientHeight;
        const minPipeHeight = 50;
        const maxTopPipeHeight = containerHeight - this.pipeGap - minPipeHeight;

        const topHeight = Math.floor(Math.random() * (maxTopPipeHeight - minPipeHeight + 1) + minPipeHeight);

        const pipeX = pipesContainer.domElement.clientWidth;

        // Create DOM elements for top and bottom pipes
        const pipeWrapper = document.createElement('div');
        pipeWrapper.style.position = 'absolute';
        pipeWrapper.style.left = `${pipeX}px`;
        pipeWrapper.style.top = '0';
        pipeWrapper.style.width = `${this.pipeWidth}px`;
        pipeWrapper.style.height = '100%';

        const topPipe = document.createElement('div');
        topPipe.style.position = 'absolute';
        topPipe.style.top = '0';
        topPipe.style.width = '100%';
        topPipe.style.height = `${topHeight}px`;
        topPipe.style.background = '#73bf2e';
        topPipe.style.border = '3px solid #543847';
        topPipe.style.borderTop = 'none';

        const bottomPipe = document.createElement('div');
        bottomPipe.style.position = 'absolute';
        bottomPipe.style.bottom = '0';
        bottomPipe.style.width = '100%';
        bottomPipe.style.height = `${containerHeight - topHeight - this.pipeGap}px`;
        bottomPipe.style.background = '#73bf2e';
        bottomPipe.style.border = '3px solid #543847';
        bottomPipe.style.borderBottom = 'none';

        pipeWrapper.appendChild(topPipe);
        pipeWrapper.appendChild(bottomPipe);
        pipesContainer.domElement.appendChild(pipeWrapper);

        this.pipes.push({
            x: pipeX,
            topHeight: topHeight,
            passed: false,
            element: pipeWrapper
        });
    }

    updateScoreDisplay() {
        const scoreNode = RenderNode.registry.get(this.scorePath);
        if (scoreNode && scoreNode.domElement) {
            scoreNode.domElement.innerText = this.score;
        }
    }

    update() {
        if (!this.gameActive) return;

        // Ticker provides roughly 16ms delta, convert to seconds
        const dt = 1/60;

        // Physics
        this.velocity += this.gravity * dt;
        this.birdY += this.velocity * dt;

        // Rotation based on velocity
        let rotation = Math.min(Math.max(this.velocity * 0.1, -25), 90);

        const birdNode = RenderNode.registry.get(this.birdNodePath);
        if (birdNode && birdNode.domElement) {
            birdNode.domElement.style.top = `${this.birdY}px`;
            birdNode.domElement.style.transform = `rotate(${rotation}deg)`;
        }

        const pipesContainer = RenderNode.registry.get(this.pipesContainerPath);
        let containerHeight = 600; // Fallback
        let containerWidth = 300;
        if (pipesContainer && pipesContainer.domElement) {
            containerHeight = pipesContainer.domElement.clientHeight;
            containerWidth = pipesContainer.domElement.clientWidth;
        }

        // Floor collision
        if (this.birdY + 24 >= containerHeight) {
            this.birdY = containerHeight - 24;
            this.gameOver();
        }

        // Ceiling collision
        if (this.birdY <= 0) {
            this.birdY = 0;
            this.velocity = 0;
        }

        // Pipe spawning
        this.spawnTimer += dt;
        if (this.spawnTimer > 1.8) {
            this.spawnPipe();
            this.spawnTimer = 0;
        }

        // Pipe updating and collision
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed * dt;

            if (pipe.element) {
                pipe.element.style.left = `${pipe.x}px`;
            }

            // AABB Collision Check
            const birdRect = {
                left: 50,
                right: 50 + 34,
                top: this.birdY,
                bottom: this.birdY + 24
            };

            const pipeRect = {
                left: pipe.x,
                right: pipe.x + this.pipeWidth
            };

            // Check X axis overlap
            if (birdRect.right > pipeRect.left && birdRect.left < pipeRect.right) {
                // Check Y axis overlap (hits top pipe OR hits bottom pipe)
                if (birdRect.top < pipe.topHeight || birdRect.bottom > (pipe.topHeight + this.pipeGap)) {
                    this.gameOver();
                }
            }

            // Scoring
            if (pipe.x + this.pipeWidth < 50 && !pipe.passed) {
                this.score++;
                pipe.passed = true;
                this.updateScoreDisplay();
            }

            // Cleanup off-screen pipes
            if (pipe.x + this.pipeWidth < 0) {
                if (pipe.element && pipe.element.parentNode) {
                    pipe.element.parentNode.removeChild(pipe.element);
                }
                this.pipes.splice(i, 1);
            }
        }
    }
}
