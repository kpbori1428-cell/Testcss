import { RenderNode, EngineTicker } from './engine.js';

export class FlappyLogic {
    constructor(node) {
        this.node = node;
        this.birdNodePath = `${this.node.path}.pajaro`;
        this.scorePath = `${this.node.path}.puntuacion`;
        this.gameOverPath = `${this.node.path}.pantalla_gameover`;
        this.restartBtnPath = `${this.node.path}.pantalla_gameover.caja_gameover.btn_reiniciar`;
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
        if (pipesContainer) {
            pipesContainer.aplicarParche({ Hijos: [] });
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
            if (goNode) {
                goNode.aplicarParche({ Propiedades_Esteticas: { display: 'none' } });
            }
        }

        if (this.gameActive) {
            this.velocity = this.jumpForce;
            // Add a little flap animation using the engine's data-driven approach
            const ala = RenderNode.registry.get(`${this.birdNodePath}.ala_pajaro`);
            if (ala) {
                ala.aplicarParche({ Transform_Base: { y: -4 } });
                setTimeout(() => {
                    const alaCurrent = RenderNode.registry.get(`${this.birdNodePath}.ala_pajaro`);
                    if (alaCurrent) alaCurrent.aplicarParche({ Transform_Base: { y: 0 } });
                }, 100);
            }
        }
    }

    resetGame() {
        this.birdY = 200;
        this.velocity = 0;
        this.score = 0;
        this.gameActive = false;
        this.isGameOver = false;
        this.pipes = [];
        this.spawnTimer = 0;

        this.updateScoreDisplay();

        const birdNode = RenderNode.registry.get(this.birdNodePath);
        if (birdNode) {
            birdNode.aplicarParche({
                Propiedades_Esteticas: { top: `${this.birdY}px` },
                Transform_Base: { rz: 0 }
            });
        }

        const goNode = RenderNode.registry.get(this.gameOverPath);
        if (goNode) {
            goNode.aplicarParche({ Propiedades_Esteticas: { display: 'none' } });
        }

        const pipesContainer = RenderNode.registry.get(this.pipesContainerPath);
        if (pipesContainer) {
            // Unmount all dynamically added pipe children purely via the data model
            pipesContainer.aplicarParche({ Hijos: [] });
        }
    }

    gameOver() {
        if (!this.gameActive) return;
        this.gameActive = false;
        this.isGameOver = true;
        const goNode = RenderNode.registry.get(this.gameOverPath);
        if (goNode) {
            goNode.aplicarParche({ Propiedades_Esteticas: { display: 'flex' } });
        }
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

        // Inject the pipe purely through data manipulation
        // We push to the current children data array and patch
        const nuevosHijos = [...pipesContainer.hijosDatos, pipeData];
        pipesContainer.aplicarParche({ Hijos: nuevosHijos });

        this.pipes.push({
            id: pipeId,
            x: pipeX,
            topHeight: topHeight,
            passed: false
        });
    }

    updateScoreDisplay() {
        const scoreNode = RenderNode.registry.get(this.scorePath);
        if (scoreNode) {
            scoreNode.aplicarParche({ innerHTML: this.score.toString() });
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
        if (birdNode) {
            birdNode.aplicarParche({
                Propiedades_Esteticas: { top: `${this.birdY}px` },
                Transform_Base: { rz: rotation }
            });
        }

        // Animar suelo y nubes
        const sueloNode = RenderNode.registry.get(`${this.node.path}.suelo`);
        if (sueloNode && sueloNode.propiedadesEsteticas) {
            const currentPos = parseFloat(sueloNode.propiedadesEsteticas.backgroundPositionX || 0);
            sueloNode.aplicarParche({ Propiedades_Esteticas: { backgroundPositionX: `${currentPos - (this.pipeSpeed * dt)}px` } });
        }

        const nubesNode = RenderNode.registry.get(`${this.node.path}.nubes`);
        if (nubesNode && nubesNode.propiedadesEsteticas) {
            const currentPos = parseFloat(nubesNode.propiedadesEsteticas.backgroundPositionX || 0);
            nubesNode.aplicarParche({ Propiedades_Esteticas: { backgroundPositionX: `${currentPos - (this.pipeSpeed * 0.2 * dt)}px` } });
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
        let pipesToKeep = [];
        let didRemovePipes = false;

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed * dt;

            const pipeNode = RenderNode.registry.get(`${pipesContainer.path}.${pipe.id}`);
            if (pipeNode) {
                pipeNode.aplicarParche({ Propiedades_Esteticas: { left: `${pipe.x}px` } });
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
                didRemovePipes = true;
                this.pipes.splice(i, 1);
            } else {
                pipesToKeep.push(pipe.id);
            }
        }

        // If pipes were removed from screen, patch the container to clean up memory
        if (didRemovePipes && pipesContainer) {
            const nuevosHijos = pipesContainer.hijosDatos.filter(hijo => pipesToKeep.includes(hijo.id));
            pipesContainer.aplicarParche({ Hijos: nuevosHijos });
        }
    }
}
