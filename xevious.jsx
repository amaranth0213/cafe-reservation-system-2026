"use client";
import React, { useRef, useEffect, useState } from "react";

const W = 384;
const H = 512;

const COLORS = {
  ground: "#1a3020",
  player: "#00ffcc",
  air1: "#ff6633",
  air2: "#ffaa00",
  ground1: "#cc3300",
  boss: "#ff00ff",
  playerShot: "#ffffff",
  bombExplode: "#ffff00",
  enemyShot: "#ff3333",
  ui: "#00ff88",
};

const AIR_TYPES = {
  zoshi: { name: "ゾシー", score: 100, color: COLORS.air1, hp: 1 },
  bacuras: { name: "バクラス", score: 200, color: COLORS.air2, hp: 1 },
  toroid: { name: "トーロイド", score: 150, color: COLORS.air1, hp: 1 },
};

const GROUND_TYPES = {
  gaidaal: { name: "ガイダール", score: 300, color: COLORS.ground1, hp: 2, shoots: true },
  domogram: { name: "ドモグラム", score: 200, color: "#995522", hp: 1, shoots: false },
};

function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const keysRef = useRef(new Set());
  const [scene, setScene] = useState("title"); // title | playing | gameover
  const [scoreDisplay, setScoreDisplay] = useState(0);

  const stateRef = useRef(null);

  function createState() {
    return {
      player: { x: W / 2 - 8, y: H - 60, w: 16, h: 16, alive: true },
      lives: 3,
      score: 0,
      frame: 0,
      groundOffset: 0,
      groundFeatures: [],
      airEnemies: [],
      groundEnemies: [],
      playerShots: [],
      bombs: [],
      explosions: [],
      enemyShots: [],
      boss: null,
      bossDefeated: false,
      bombCooldown: 0,
      shotCooldown: 0,
      invuln: 0,
    };
  }

  // Initialize ground features
  function initGroundFeatures(state) {
    for (let i = 0; i < 10; i++) {
      state.groundFeatures.push({
        x: Math.random() * W,
        y: Math.random() * H * 3 - H * 2,
        w: 20 + Math.random() * 30,
        h: 20 + Math.random() * 30,
      });
    }
  }

  function startGame() {
    const s = createState();
    initGroundFeatures(s);
    stateRef.current = s;
    setScoreDisplay(0);
    setScene("playing");
  }

  // Key handling
  useEffect(() => {
    function down(e) {
      keysRef.current.add(e.code);
      if (e.code === "Space" || e.code === "Enter") {
        if (scene === "title") {
          startGame();
        } else if (scene === "gameover") {
          setScene("title");
        }
      }
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","KeyZ"].includes(e.code)) {
        e.preventDefault();
      }
    }
    function up(e) {
      keysRef.current.delete(e.code);
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [scene]);

  // Game loop
  useEffect(() => {
    if (scene !== "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let rafId;

    function spawnAirFormation(state) {
      const types = Object.keys(AIR_TYPES);
      const type = types[Math.floor(Math.random() * types.length)];
      const count = 4 + Math.floor(Math.random() * 5);
      const startX = 30 + Math.random() * (W - 60 - count * 24);
      for (let i = 0; i < count; i++) {
        state.airEnemies.push({
          type,
          x: startX + i * 24,
          y: -20 - i * 24,
          w: 14,
          h: 14,
          phase: Math.random() * Math.PI * 2,
          hp: AIR_TYPES[type].hp,
        });
      }
    }

    function spawnGroundEnemy(state) {
      const types = Object.keys(GROUND_TYPES);
      const type = types[Math.floor(Math.random() * types.length)];
      state.groundEnemies.push({
        type,
        x: 20 + Math.random() * (W - 60),
        y: -30,
        w: 24,
        h: 24,
        hp: GROUND_TYPES[type].hp,
        shotCooldown: 60 + Math.random() * 60,
      });
    }

    function update() {
      const state = stateRef.current;
      const keys = keysRef.current;
      state.frame++;

      // Scroll ground
      state.groundOffset += 2;
      state.groundFeatures.forEach((f) => {
        f.y += 2;
        if (f.y > H + 50) {
          f.y -= H * 3;
          f.x = Math.random() * W;
          f.w = 20 + Math.random() * 30;
          f.h = 20 + Math.random() * 30;
        }
      });

      // Player movement
      const p = state.player;
      const speed = 3;
      if (keys.has("ArrowLeft")) p.x -= speed;
      if (keys.has("ArrowRight")) p.x += speed;
      if (keys.has("ArrowUp")) p.y -= speed;
      if (keys.has("ArrowDown")) p.y += speed;
      p.x = Math.max(0, Math.min(W - p.w, p.x));
      p.y = Math.max(0, Math.min(H - p.h, p.y));

      // Shooting
      if (state.shotCooldown > 0) state.shotCooldown--;
      if (keys.has("Space") && state.shotCooldown === 0) {
        state.playerShots.push({
          x: p.x + p.w / 2 - 2,
          y: p.y - 8,
          w: 4,
          h: 12,
        });
        state.shotCooldown = 8;
      }

      // Bombing
      if (state.bombCooldown > 0) state.bombCooldown--;
      if (keys.has("KeyZ") && state.bombCooldown === 0) {
        state.bombs.push({
          x: p.x + p.w / 2 - 3,
          y: p.y,
          w: 6,
          h: 6,
          vy: -3,
          targetY: p.y + 80,
          startY: p.y,
        });
        state.bombCooldown = 30;
      }

      // Update player shots
      state.playerShots.forEach((s) => (s.y -= 6));
      state.playerShots = state.playerShots.filter((s) => s.y + s.h > 0);

      // Update bombs (parabolic arc to ground)
      state.bombs.forEach((b) => {
        b.y += 4;
      });
      state.bombs.forEach((b) => {
        if (b.y >= b.targetY) {
          state.explosions.push({ x: b.x - 10, y: b.y - 10, r: 2, maxR: 24 });
          b.done = true;
        }
      });
      state.bombs = state.bombs.filter((b) => !b.done);

      // Explosions grow then fade
      state.explosions.forEach((e) => (e.r += 2));
      state.explosions = state.explosions.filter((e) => e.r < e.maxR);

      // Spawn air enemies
      if (state.frame % 90 === 0 && !state.boss) {
        spawnAirFormation(state);
      }
      // Spawn ground enemies
      if (state.frame % 130 === 0 && !state.boss) {
        spawnGroundEnemy(state);
      }

      // Update air enemies
      state.airEnemies.forEach((e) => {
        e.phase += 0.05;
        if (e.type === "zoshi") {
          e.y += 2;
        } else if (e.type === "bacuras") {
          e.y += 1.5;
          e.x += Math.sin(e.phase) * 2;
        } else if (e.type === "toroid") {
          e.y += 1.5;
          const dx = p.x - e.x;
          e.x += Math.sign(dx) * 1.2;
        }
      });
      state.airEnemies = state.airEnemies.filter((e) => e.y < H + 30 && e.hp > 0);

      // Update ground enemies (scroll with background)
      state.groundEnemies.forEach((e) => {
        e.y += 2;
        if (e.shotCooldown > 0) e.shotCooldown--;
        if (GROUND_TYPES[e.type].shoots && e.shotCooldown <= 0 && e.y > 0 && e.y < H) {
          const dx = p.x + p.w / 2 - (e.x + e.w / 2);
          const dy = p.y + p.h / 2 - (e.y + e.h / 2);
          const dist = Math.hypot(dx, dy) || 1;
          state.enemyShots.push({
            x: e.x + e.w / 2,
            y: e.y + e.h / 2,
            w: 6,
            h: 6,
            vx: (dx / dist) * 2,
            vy: (dy / dist) * 2,
          });
          e.shotCooldown = 90;
        }
      });
      state.groundEnemies = state.groundEnemies.filter((e) => e.y < H + 30 && e.hp > 0);

      // Update enemy shots
      state.enemyShots.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
      });
      state.enemyShots = state.enemyShots.filter(
        (s) => s.x > -10 && s.x < W + 10 && s.y > -10 && s.y < H + 10
      );

      // Boss spawn
      if (!state.boss && !state.bossDefeated && state.score >= 5000) {
        state.boss = {
          x: W / 2 - 30,
          y: -80,
          w: 60,
          h: 60,
          hp: 10,
          maxHp: 10,
          vx: 1.5,
          shotCooldown: 60,
        };
      }
      if (state.boss) {
        const boss = state.boss;
        if (boss.y < 60) boss.y += 1;
        else {
          boss.x += boss.vx;
          if (boss.x < 10 || boss.x + boss.w > W - 10) boss.vx *= -1;
        }
        boss.shotCooldown--;
        if (boss.shotCooldown <= 0 && boss.y >= 60) {
          for (let a = 0; a < 5; a++) {
            const ang = (Math.PI / 4) + (a * (Math.PI / 2)) / 4;
            state.enemyShots.push({
              x: boss.x + boss.w / 2,
              y: boss.y + boss.h / 2,
              w: 6,
              h: 6,
              vx: Math.cos(ang) * 2,
              vy: Math.sin(ang) * 2,
            });
          }
          boss.shotCooldown = 75;
        }
      }

      // Collisions: player shots vs air enemies
      state.playerShots.forEach((s) => {
        state.airEnemies.forEach((e) => {
          if (e.hp > 0 && aabb(s, e)) {
            e.hp -= 1;
            s.hit = true;
            if (e.hp <= 0) {
              state.score += AIR_TYPES[e.type].score;
              state.explosions.push({ x: e.x - 5, y: e.y - 5, r: 2, maxR: 18 });
            }
          }
        });
      });

      // Collisions: player shots vs boss
      if (state.boss) {
        state.playerShots.forEach((s) => {
          if (aabb(s, state.boss)) {
            state.boss.hp -= 1;
            s.hit = true;
            if (state.boss.hp <= 0) {
              state.score += 1000;
              state.explosions.push({
                x: state.boss.x + state.boss.w / 2 - 20,
                y: state.boss.y + state.boss.h / 2 - 20,
                r: 5,
                maxR: 60,
              });
              state.boss = null;
              state.bossDefeated = true;
            }
          }
        });
      }
      state.playerShots = state.playerShots.filter((s) => !s.hit);

      // Collisions: bomb explosions vs ground enemies
      state.explosions.forEach((ex) => {
        state.groundEnemies.forEach((e) => {
          if (e.hp > 0) {
            const cx = ex.x + 10;
            const cy = ex.y + 10;
            const dx = cx - (e.x + e.w / 2);
            const dy = cy - (e.y + e.h / 2);
            if (Math.hypot(dx, dy) < ex.r + 12 && !e.scored) {
              e.hp -= 5;
              if (e.hp <= 0 && !e.scored) {
                state.score += GROUND_TYPES[e.type].score;
                e.scored = true;
              }
            }
          }
        });
      });

      // Collisions: player vs enemy shots / enemies
      if (state.invuln > 0) state.invuln--;
      if (state.invuln === 0) {
        let hit = false;
        state.enemyShots.forEach((s) => {
          if (aabb(p, s)) hit = true;
        });
        state.airEnemies.forEach((e) => {
          if (e.hp > 0 && aabb(p, e)) hit = true;
        });
        state.groundEnemies.forEach((e) => {
          if (e.hp > 0 && aabb(p, e)) hit = true;
        });
        if (state.boss && aabb(p, state.boss)) hit = true;
        if (hit) {
          state.lives -= 1;
          state.invuln = 90;
          state.explosions.push({ x: p.x - 5, y: p.y - 5, r: 2, maxR: 20 });
          if (state.lives <= 0) {
            setScene("gameover");
          }
        }
      }

      setScoreDisplay(state.score);
    }

    function draw() {
      const state = stateRef.current;
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(0, 0, W, H);

      // Ground features
      ctx.fillStyle = "#2d4a2d";
      state.groundFeatures.forEach((f) => {
        ctx.fillRect(f.x, f.y, f.w, f.h);
      });

      // Ground enemies
      state.groundEnemies.forEach((e) => {
        ctx.fillStyle = GROUND_TYPES[e.type].color;
        ctx.fillRect(e.x, e.y, e.w, e.h);
      });

      // Boss
      if (state.boss) {
        const b = state.boss;
        ctx.fillStyle = COLORS.boss;
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = "#333333";
        ctx.fillRect(W / 2 - 60, 10, 120, 8);
        ctx.fillStyle = COLORS.boss;
        ctx.fillRect(W / 2 - 60, 10, 120 * (b.hp / b.maxHp), 8);
      }

      // Air enemies
      state.airEnemies.forEach((e) => {
        ctx.fillStyle = AIR_TYPES[e.type].color;
        ctx.beginPath();
        ctx.moveTo(e.x + e.w / 2, e.y);
        ctx.lineTo(e.x + e.w, e.y + e.h);
        ctx.lineTo(e.x, e.y + e.h);
        ctx.closePath();
        ctx.fill();
      });

      // Player shots
      ctx.fillStyle = COLORS.playerShot;
      state.playerShots.forEach((s) => {
        ctx.fillRect(s.x, s.y, s.w, s.h);
      });

      // Bombs
      ctx.fillStyle = "#aaaaaa";
      state.bombs.forEach((b) => {
        ctx.fillRect(b.x, b.y, b.w, b.h);
      });

      // Enemy shots
      ctx.fillStyle = COLORS.enemyShot;
      state.enemyShots.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Explosions
      state.explosions.forEach((ex) => {
        ctx.strokeStyle = COLORS.bombExplode;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ex.x + 10, ex.y + 10, ex.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Player (Solvalou)
      const p = state.player;
      if (state.invuln === 0 || state.frame % 6 < 3) {
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.moveTo(p.x + p.w / 2, p.y);
        ctx.lineTo(p.x + p.w, p.y + p.h);
        ctx.lineTo(p.x + p.w / 2, p.y + p.h - 4);
        ctx.lineTo(p.x, p.y + p.h);
        ctx.closePath();
        ctx.fill();
      }

      // UI
      ctx.fillStyle = COLORS.ui;
      ctx.font = "16px monospace";
      ctx.fillText(`SCORE: ${String(state.score).padStart(6, "0")}`, 10, 20);
      ctx.fillText(`LIVES: ${"♦".repeat(Math.max(0, state.lives))}`, 10, 40);
    }

    function loop() {
      update();
      draw();
      if (stateRef.current && scene === "playing" && stateRef.current.lives > 0) {
        rafId = requestAnimationFrame(loop);
      }
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [scene]);

  // Title / GameOver rendering
  useEffect(() => {
    if (scene === "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a3020";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COLORS.ui;
    ctx.textAlign = "center";
    ctx.font = "28px monospace";
    if (scene === "title") {
      ctx.fillText("XEVIOUS", W / 2, H / 2 - 40);
      ctx.font = "14px monospace";
      ctx.fillText("PRESS SPACE TO START", W / 2, H / 2 + 10);
    } else if (scene === "gameover") {
      const s = stateRef.current;
      ctx.fillText("GAME OVER", W / 2, H / 2 - 40);
      ctx.font = "16px monospace";
      ctx.fillText(`SCORE: ${String(s ? s.score : 0).padStart(6, "0")}`, W / 2, H / 2);
      ctx.font = "14px monospace";
      ctx.fillText("PRESS SPACE TO RETURN", W / 2, H / 2 + 40);
    }
    ctx.textAlign = "left";
  }, [scene]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#000",
        minHeight: "100vh",
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ border: "2px solid #00ff88", background: "#1a3020" }}
      />
    </div>
  );
}
