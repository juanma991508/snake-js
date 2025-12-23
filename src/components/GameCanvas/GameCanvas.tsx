import { useEffect, useRef } from "react";
import type { Direction, GameCanvasProps, Point } from ".";

const GameCanvas = ({ onGameOver }: GameCanvasProps) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const stateRef = useRef({
        cols: Math.floor(window.innerWidth / 16),
        rows: Math.floor(window.innerHeight / 16),
        snake: [{ x: 5, y: 5 }, { x: 6, y: 5 }] as Point[],
        dir: "right" as Direction,
        nextDir: null as Direction | null,
        paused: false,
        alive: true,
        food: { x: 10, y: 10 } as Point,
        score: 0,
        debug: false,
    });

    const placeFood = () => {
        const state = stateRef.current;
        const occupied = new Set(state.snake.map(p => `${p.x},${p.y}`));
        let fx = 0, fy = 0;
        do {
            fx = Math.floor(Math.random() * state.cols);
            fy = Math.floor(Math.random() * state.rows);
        } while (occupied.has(`${fx},${fy}`));
        state.food = { x: fx, y: fy };
    };

    const clamp = (v:number,a:number,b:number) => Math.max(a, Math.min(b, v));

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const map: Record<string, Direction> = {
                ArrowUp: "up",
                ArrowDown: "down",
                ArrowLeft: "left",
                ArrowRight: "right",
                w: "up",
                s: "down",
                a: "left",
                d: "right",
            };
            // F3 toggle debug overlay (dev only)
            if (e.key === 'F3') {
                stateRef.current.debug = !stateRef.current.debug;
                return;
            }
            const d = map[e.key] || map[e.key.toLowerCase()];
            if (!d) return;
            const state = stateRef.current;
            if ((state.dir === "up" && d === "down") || (state.dir === "down" && d === "up") ||
                (state.dir === "left" && d === "right") || (state.dir === "right" && d === "left")) {
                return;
            }
            state.nextDir = d;
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);


    useEffect(() => {
        const onDir = (e: Event) => {
            const dir = (e as CustomEvent).detail as Direction;
            if (!dir) return;
            const s = stateRef.current;
            // same prevention of reverse turns:
            if ((s.dir === "up" && dir === "down") || (s.dir === "down" && dir === "up") ||
                (s.dir === "left" && dir === "right") || (s.dir === "right" && dir === "left")) {
                return;
            }
            s.nextDir = dir;
        };
        window.addEventListener("snake:direction", onDir as EventListener);
        return () => window.removeEventListener("snake:direction", onDir as EventListener);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let raf = 0;
        const container = canvas.parentElement ?? document.documentElement;
        const baseTile = 16;
        // ensure canvas behaves as a block and doesn't cause its container to grow unexpectedly
        canvas.style.display = "block";
        canvas.style.maxWidth = "100vw";
        canvas.style.maxHeight = "100vh";

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;
            // Force canvas to fill the viewport (prevents parent layout constraints)
            const cssW = Math.max(100, Math.floor(viewportW));
            const cssH = Math.max(100, Math.floor(viewportH));
            // calcular cols/rows según tile fijo
            const cols = Math.max(6, Math.floor(cssW / baseTile));
            const rows = Math.max(6, Math.floor(cssH / baseTile));

            // actualizar canvas CSS y buffer (DPR-aware)
            canvas.style.width = "100vw";
            canvas.style.height = "100vh";
            canvas.style.maxWidth = "100vw";
            canvas.style.maxHeight = "100vh";
            canvas.width = Math.floor(cssW * dpr);
            canvas.height = Math.floor(cssH * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // actualizar estado del juego con bounds nuevos
            const s = stateRef.current;
            const oldCols = s.cols, oldRows = s.rows;
            s.cols = cols;
            s.rows = rows;
            // si el grid se reduce, recenter la serpiente para evitar colapso
            if (oldCols && oldRows && (cols < oldCols || rows < oldRows)) {
                const dx = Math.floor((cols - oldCols) / 2);
                const dy = Math.floor((rows - oldRows) / 2);
                s.snake = s.snake.map(p => ({
                    x: clamp(p.x + dx, 0, cols - 1),
                    y: clamp(p.y + dy, 0, rows - 1),
                }));
                if (s.food.x >= cols || s.food.y >= rows) placeFood();
            } else {
                // small clamp fallback
                s.snake = s.snake.map((p) => ({
                    x: Math.min(Math.max(0, p.x), cols - 1),
                    y: Math.min(Math.max(0, p.y), rows - 1),
                }));
                if (s.food.x >= cols || s.food.y >= rows) {
                    placeFood();
                }
            }

        };
        let resizeTimer: number | undefined;
        const ro = new ResizeObserver(() => {
            if (resizeTimer) window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                resize();
                resizeTimer = undefined;
            }, 100);
        });
        ro.observe(container);
        window.addEventListener("orientationchange", resize);
        resize();


        let last = performance.now();
        let acc = 0;
        const ticksPerSecond = 6;
        const interval = 1000 / ticksPerSecond;

        const tick = () => {
            const s = stateRef.current;
            if (!s.alive || s.paused) return;
            if (s.nextDir) { s.dir = s.nextDir; s.nextDir = null; }
            const head = { ...s.snake[s.snake.length - 1] };
            if (s.dir === "up") head.y -= 1;
            if (s.dir === "down") head.y += 1;
            if (s.dir === "left") head.x -= 1;
            if (s.dir === "right") head.x += 1;
            const willGrow = (head.x === s.food.x && head.y === s.food.y);
            // bounds check
            if (head.x < 0 || head.x >= s.cols || head.y < 0 || head.y >= s.rows) {
                s.alive = false;
                onGameOver?.(s.score);
                return;
            }
            const bodyToCheck = willGrow ? s.snake : s.snake.slice(1);
            if (bodyToCheck.some(p => p.x === head.x && p.y === head.y)) {
                s.alive = false;
                onGameOver?.(s.score);
                return;
            }
            s.snake.push(head);
            if (willGrow) {
                s.score += 1;
                placeFood();
            } else {
                s.snake.shift();
            }
        };


        const render = () => {
            const dpr = window.devicePixelRatio || 1;
            const cssW = canvas.width / dpr;
            const cssH = canvas.height / dpr;
            if (!stateRef.current.alive) {
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(0, 0, cssW, cssH);
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.font = "bold 36px sans-serif";
                ctx.fillText("GAME OVER", cssW / 2, cssH / 2);
                ctx.font = "16px sans-serif";
                ctx.fillText(`Score: ${stateRef.current.score}`, cssW / 2, cssH / 2 + 36);
                return;
            }
            const now = performance.now();
            const dt = now - last;
            last = now;
            acc += dt;
            while (acc >= interval) {
                tick();
                acc -= interval;
            }
            // draw background
            ctx.fillStyle = "#0b0b0b";
            ctx.fillRect(0, 0, cssW, cssH);
            // draw snake
            ctx.fillStyle = "#7efc7e";
            for (const p of stateRef.current.snake) {
                ctx.fillRect(p.x * baseTile, p.y * baseTile, baseTile - 1, baseTile - 1);
            }
            // draw food
            ctx.fillStyle = "#ff4d4d";
            ctx.fillRect(stateRef.current.food.x * baseTile, stateRef.current.food.y * baseTile, baseTile - 1, baseTile - 1);
            //HUD
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.font = "16px monospace";
            ctx.fillText(`Score: ${stateRef.current.score}`, 10, 8);

            // debug overlay (toggle with 'D')
            const s = stateRef.current;
            if (s.debug) {
                ctx.save();
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                const boxW = 200;
                ctx.fillRect(cssW - boxW - 8, 8, boxW, 64);
                ctx.fillStyle = "#fff";
                ctx.textAlign = "right";
                ctx.font = "12px monospace";
                ctx.fillText(`css: ${Math.round(cssW)}x${Math.round(cssH)}`, cssW - 12, 12);
                ctx.fillText(`cols: ${s.cols} rows: ${s.rows}`, cssW - 12, 28);
                ctx.fillText(`viewport: ${window.innerWidth}x${window.innerHeight}`, cssW - 12, 44);
                ctx.restore();
            }

            raf = requestAnimationFrame(render);
        };

        raf = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            if (resizeTimer) window.clearTimeout(resizeTimer);
            window.removeEventListener("orientationchange", resize);
        }
    }, []);

    return <canvas ref={canvasRef} />;
};

export default GameCanvas;