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
        this.isGameOver = false;
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
        // Clean up any dynamic pipes to avoid memory leaks if OS unmounts app
        const pipesContainer = RenderNode.registry.get(this.pipesContainerPath);
        if (pipesContainer && pipesContainer.domElement) {
            pipesContainer.domElement.innerHTML = '';
        }
        this.pipes = [];
    }

    // Engine automatically binds this to the root node if it exists
    onClick(e) {
        this.jump();
    }

    jump() {
        if (this.isGameOver) return; // Prevent jumping when game over screen is shown

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

        // Estilo común para tuberías
        const crearTuberia = (isTop, altura) => {
            const tubo = document.createElement('div');
            tubo.style.position = 'absolute';
            tubo.style.width = '100%';
            tubo.style.height = `${altura}px`;
            tubo.style.background = 'linear-gradient(90deg, #73bf2e 0%, #90d645 20%, #73bf2e 100%)';
            tubo.style.border = '3px solid #543847';

            // Borde grueso / tapa
            const tapa = document.createElement('div');
            tapa.style.position = 'absolute';
            tapa.style.width = '110%';
            tapa.style.height = '20px';
            tapa.style.left = '-5%';
            tapa.style.background = 'linear-gradient(90deg, #73bf2e 0%, #90d645 20%, #73bf2e 100%)';
            tapa.style.border = '3px solid #543847';
            tapa.style.boxSizing = 'border-box';

            if (isTop) {
                tubo.style.top = '0';
                tubo.style.borderTop = 'none';
                tapa.style.bottom = '-3px';
            } else {
                tubo.style.bottom = '0';
                tubo.style.borderBottom = 'none';
                tapa.style.top = '-3px';
            }

            tubo.appendChild(tapa);
            return tubo;
        };

        const topPipe = crearTuberia(true, topHeight);
        const bottomPipe = crearTuberia(false, containerHeight - topHeight - this.pipeGap);

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

    update(dt) {
        if (!this.gameActive) return;

        // Use real DeltaTime from engine, fallback to 1/60 if not provided
        dt = dt || 0.016;

        // Limit dt to prevent massive jumps if tab was inactive
        if (dt > 0.05) dt = 0.05;

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

        // Animar suelo y nubes
        const sueloNode = RenderNode.registry.get(`${this.node.path}.suelo`);
        if (sueloNode && sueloNode.domElement) {
            const currentPos = parseFloat(sueloNode.domElement.style.backgroundPositionX || 0);
            sueloNode.domElement.style.backgroundPositionX = `${currentPos - (this.pipeSpeed * dt)}px`;
        }

        const nubesNode = RenderNode.registry.get(`${this.node.path}.nubes`);
        if (nubesNode && nubesNode.domElement) {
            const currentPos = parseFloat(nubesNode.domElement.style.backgroundPositionX || 0);
            nubesNode.domElement.style.backgroundPositionX = `${currentPos - (this.pipeSpeed * 0.2 * dt)}px`;
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

            // AABB Collision Check with slight padding (forgiveness)
            const paddingX = 4;
            const paddingY = 4;
            const birdRect = {
                left: 50 + paddingX,
                right: 50 + 34 - paddingX,
                top: this.birdY + paddingY,
                bottom: this.birdY + 24 - paddingY
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
