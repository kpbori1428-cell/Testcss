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
            // Clean up old V4 RenderNodes properly instead of just innerHTML
            for (const pipeData of this.pipes) {
                if (pipeData.renderNode) {
                    pipeData.renderNode.unmount();
                }
            }
            pipesContainer.children = [];
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

        const pipeId = `pipe_${Math.random().toString(36).substr(2, 9)}`;

        // Generar la tubería formalmente como un V4 JSON Node Data
        const pipeData = {
            "id": pipeId,
            "Propiedades_Esteticas": {
                "position": "absolute",
                "left": `${pipeX}px`,
                "top": "0",
                "width": `${this.pipeWidth}px`,
                "height": "100%"
            },
            "Hijos": [
                {
                    "id": `top_${pipeId}`,
                    "Propiedades_Esteticas": {
                        "position": "absolute",
                        "top": "0",
                        "width": "100%",
                        "height": `${topHeight}px`,
                        "background": "linear-gradient(90deg, #73bf2e 0%, #90d645 20%, #73bf2e 100%)",
                        "border": "3px solid #543847",
                        "borderTop": "none",
                        "boxSizing": "border-box"
                    },
                    "Hijos": [
                        {
                            "id": `cap_top_${pipeId}`,
                            "Propiedades_Esteticas": {
                                "position": "absolute",
                                "width": "110%",
                                "height": "20px",
                                "left": "-5%",
                                "bottom": "-3px",
                                "background": "linear-gradient(90deg, #73bf2e 0%, #90d645 20%, #73bf2e 100%)",
                                "border": "3px solid #543847",
                                "boxSizing": "border-box"
                            }
                        }
                    ]
                },
                {
                    "id": `bottom_${pipeId}`,
                    "Propiedades_Esteticas": {
                        "position": "absolute",
                        "bottom": "0",
                        "width": "100%",
                        "height": `${containerHeight - topHeight - this.pipeGap}px`,
                        "background": "linear-gradient(90deg, #73bf2e 0%, #90d645 20%, #73bf2e 100%)",
                        "border": "3px solid #543847",
                        "borderBottom": "none",
                        "boxSizing": "border-box"
                    },
                    "Hijos": [
                        {
                            "id": `cap_bottom_${pipeId}`,
                            "Propiedades_Esteticas": {
                                "position": "absolute",
                                "width": "110%",
                                "height": "20px",
                                "left": "-5%",
                                "top": "-3px",
                                "background": "linear-gradient(90deg, #73bf2e 0%, #90d645 20%, #73bf2e 100%)",
                                "border": "3px solid #543847",
                                "boxSizing": "border-box"
                            }
                        }
                    ]
                }
            ]
        };

        // Instanciar el Nodo formalmente y agregarlo al árbol V4
        const pipeNode = new RenderNode(pipeData, pipesContainer.domElement, pipesContainer.path, pipesContainer.level + 1, pipesContainer.children.length);
        pipeNode.mount();
        pipesContainer.children.push(pipeNode);

        this.pipes.push({
            x: pipeX,
            topHeight: topHeight,
            passed: false,
            renderNode: pipeNode
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

            if (pipe.renderNode && pipe.renderNode.domElement) {
                pipe.renderNode.domElement.style.left = `${pipe.x}px`;
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

            // Cleanup off-screen pipes via V4 Unmount
            if (pipe.x + this.pipeWidth < 0) {
                if (pipe.renderNode) {
                    pipe.renderNode.unmount();
                    // Remove from parent children array to fully release memory
                    if (pipesContainer && pipesContainer.children) {
                        const index = pipesContainer.children.indexOf(pipe.renderNode);
                        if (index > -1) pipesContainer.children.splice(index, 1);
                    }
                }
                this.pipes.splice(i, 1);
            }
        }
    }
}
