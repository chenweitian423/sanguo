/**
 * 乱世刀锋 — 原创街机式平面乱斗（beat-em-up）
 * 纯 HTML5 Canvas + 原生 JS，无商标素材名。
 */
(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // —— 战场平面（八向移动）——
  const PLANE = {
    xMin: 40,
    xMax: 920,
    yMin: 310, // 靠近栅栏（画面上方的“远”）
    yMax: 500, // 靠近前景尖桩（画面下方的“近”）
  };
  const PLAYER_SPEED = 210;
  const DEPTH_SPEED = 150;
  const GRAVITY = 1600;
  const HITSTOP = 0.055;

  // —— 资源 ——
  const imgStage = new Image();
  const imgHero = new Image();
  let assetsReady = 0;
  const ASSET_TOTAL = 2;
  imgStage.onload = () => { assetsReady++; };
  imgHero.onload = () => { assetsReady++; };
  imgStage.onerror = () => { assetsReady++; };
  imgHero.onerror = () => { assetsReady++; };
  imgStage.src = "assets/stage-battlefield.png";
  imgHero.src = "assets/hero-spear.png";

  // 枪将精灵表：左侧大图 + 右侧 3×3
  // 1536×1024；右侧九宫约从 x≈560 起
  const SHEET = {
    // 列宽/行高粗略划分（右侧九宫）
    ox: 560,
    oy: 8,
    cw: 318,
    ch: 336,
    frame(col, row) {
      return {
        sx: this.ox + col * this.cw,
        sy: this.oy + row * this.ch,
        sw: this.cw,
        sh: this.ch,
      };
    },
  };
  // idle, attack1, attack2 / attack3, specialSlash, up / jumpAtk, jump, slam
  const FRAMES = {
    idle: SHEET.frame(0, 0),
    atk1: SHEET.frame(1, 0),
    atk2: SHEET.frame(2, 0),
    atk3: SHEET.frame(0, 1),
    special: SHEET.frame(1, 1),
    jump: SHEET.frame(1, 2),
    jumpAtk: SHEET.frame(0, 2),
    slam: SHEET.frame(2, 2),
  };

  // —— 原创英雄 ——
  const HEROES = [
    {
      id: "spear",
      name: "枪将",
      full: "秦烈 · 枪将",
      title: "破阵长枪",
      color: "#2d8a4e",
      accent: "#c9a227",
      weapon: "spear",
      hp: 110,
      speed: 1.0,
      atk: 1.05,
      specialName: "烈枪破阵",
      useSheet: true,
      desc: "长枪连突，必杀范围广",
    },
    {
      id: "blade",
      name: "刀客",
      full: "韩霜 · 刀客",
      title: "疾风双斩",
      color: "#c43c3c",
      accent: "#e8c878",
      weapon: "blade",
      hp: 100,
      speed: 1.15,
      atk: 1.0,
      specialName: "血刃回旋",
      useSheet: false,
      desc: "移速快，连斩凌厉",
    },
    {
      id: "tactician",
      name: "谋士",
      full: "沈策 · 谋士",
      title: "奇门扇阵",
      color: "#3a6ec9",
      accent: "#d4b56a",
      weapon: "fan",
      hp: 90,
      speed: 0.95,
      atk: 0.95,
      specialName: "天机扇影",
      useSheet: false,
      desc: "扇击控场，必杀聚能",
    },
  ];

  // —— 输入 ——
  const keys = Object.create(null);
  const justPressed = Object.create(null);

  window.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!keys[k]) justPressed[k] = true;
    keys[k] = true;
    if ([" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = false;
  });
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });

  function held(k) {
    return !!keys[k];
  }
  function tap(k) {
    if (justPressed[k]) {
      justPressed[k] = false;
      return true;
    }
    return false;
  }
  function clearTaps() {
    for (const k in justPressed) justPressed[k] = false;
  }

  const mouse = { x: 0, y: 0, click: false };
  canvas.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * W;
    mouse.y = ((e.clientY - r.top) / r.height) * H;
  });
  canvas.addEventListener("mousedown", () => {
    mouse.click = true;
  });

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  // —— 状态机 ——
  const Mode = { TITLE: "title", SELECT: "select", PLAY: "play", WIN: "win", LOSE: "lose" };
  let mode = Mode.TITLE;
  let titleT = 0;
  let selectIndex = 0;
  let heroDef = HEROES[0];
  let player = null;
  let enemies = [];
  let effects = [];
  let waveIndex = 0;
  let waveAnnounce = 0;
  let score = 0;
  let hitstopT = 0;
  let screenFlash = 0;
  let stageClearT = 0;

  // Wave1 ~4, Wave2 ~6 + 1 elite
  const WAVES = [
    {
      label: "第一波 · 乱兵来袭",
      spawns: [
        { kind: "grunt", n: 4 },
      ],
    },
    {
      label: "第二波 · 精锐合围",
      spawns: [
        { kind: "grunt", n: 6 },
        { kind: "elite", n: 1 },
      ],
    },
  ];

  function footY(e) {
    return e.y; // 脚底深度坐标
  }

  function makePlayer(def) {
    return {
      def,
      x: 200,
      y: 420,
      z: 0, // 跳跃离地高度
      vz: 0,
      facing: 1,
      w: 42,
      h: 78,
      hp: def.hp,
      maxHp: def.hp,
      meter: 0,
      maxMeter: 100,
      invuln: 0,
      comboStep: 0,
      comboTimer: 0,
      attackTimer: 0,
      attackKind: null, // light | special | jump
      hitbox: null,
      hitIds: new Set(),
      specialCd: 0,
      anim: "idle",
      animT: 0,
      flash: 0,
      dead: false,
      walkPhase: 0,
    };
  }

  function makeEnemy(kind, x, y) {
    const elite = kind === "elite";
    return {
      id: Math.random().toString(36).slice(2, 9),
      kind,
      elite,
      x,
      y,
      z: 0,
      vz: 0,
      facing: -1,
      w: elite ? 48 : 34,
      h: elite ? 86 : 64,
      hp: elite ? 160 : 48,
      maxHp: elite ? 160 : 48,
      dmg: elite ? 14 : 8,
      speed: elite ? 70 : 95,
      attackCd: rand(0.5, 1.2),
      attackTimer: 0,
      hitbox: null,
      stun: 0,
      knock: 0,
      invuln: 0,
      flash: 0,
      anim: "idle",
      animT: 0,
      dead: false,
      deathT: 0,
      walkPhase: rand(0, Math.PI * 2),
      showHp: 0,
    };
  }

  function spawnWave(idx) {
    const def = WAVES[idx];
    const list = [];
    for (const s of def.spawns) {
      for (let i = 0; i < s.n; i++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = side < 0 ? rand(-40, 60) : rand(W - 60, W + 40);
        const y = rand(PLANE.yMin + 20, PLANE.yMax - 10);
        list.push(makeEnemy(s.kind, x, y));
      }
    }
    enemies = list;
    waveAnnounce = 2.2;
  }

  function startPlay() {
    heroDef = HEROES[selectIndex];
    player = makePlayer(heroDef);
    enemies = [];
    effects = [];
    waveIndex = 0;
    score = 0;
    hitstopT = 0;
    screenFlash = 0;
    stageClearT = 0;
    spawnWave(0);
    mode = Mode.PLAY;
  }

  function addSlash(x, y, facing, color, life) {
    effects.push({
      type: "slash",
      x,
      y,
      facing,
      color: color || "#fff",
      t: life || 0.18,
      life: life || 0.18,
    });
  }
  function addSpark(x, y, n) {
    for (let i = 0; i < (n || 6); i++) {
      effects.push({
        type: "spark",
        x,
        y,
        vx: rand(-120, 120),
        vy: rand(-180, -40),
        t: rand(0.2, 0.45),
        life: 0.45,
        c: Math.random() < 0.5 ? "#ffe9a0" : "#ff6a3a",
      });
    }
  }
  function addDust(x, y) {
    for (let i = 0; i < 4; i++) {
      effects.push({
        type: "dust",
        x: x + rand(-10, 10),
        y: y + rand(-4, 4),
        vx: rand(-40, 40),
        vy: rand(-30, -10),
        t: 0.35,
        life: 0.35,
      });
    }
  }

  // —— 战斗 ——
  function beginLight(p) {
    if (p.attackTimer > 0 || p.dead) return;
    if (p.z > 8) {
      beginJumpAttack(p);
      return;
    }
    if (p.comboTimer <= 0) p.comboStep = 0;
    p.comboStep = Math.min(p.comboStep + 1, 3);
    p.comboTimer = 0.55;
    p.attackKind = "light";
    const step = p.comboStep;
    const dur = step === 3 ? 0.32 : 0.22;
    p.attackTimer = dur;
    p.anim = "atk" + step;
    p.animT = 0;
    p.hitIds = new Set();
    const reach = 54 + step * 8;
    const dmg = (8 + step * 5) * p.def.atk;
    p.hitbox = {
      ox: 18,
      oy: -50,
      w: reach,
      h: 46,
      dmg,
      knock: 40 + step * 18,
      stun: 0.22 + step * 0.05,
      depth: 28,
    };
    addSlash(p.x + p.facing * 40, p.y - 36 - p.z, p.facing, p.def.accent, 0.14);
  }

  function beginJumpAttack(p) {
    if (p.attackTimer > 0 || p.dead) return;
    p.attackKind = "jump";
    p.attackTimer = 0.28;
    p.anim = "jumpAtk";
    p.animT = 0;
    p.hitIds = new Set();
    p.hitbox = {
      ox: 10,
      oy: -60,
      w: 56,
      h: 50,
      dmg: 14 * p.def.atk,
      knock: 70,
      stun: 0.3,
      depth: 32,
    };
    addSlash(p.x + p.facing * 30, p.y - 40 - p.z, p.facing, "#fff0c0", 0.16);
  }

  function beginSpecial(p) {
    if (p.attackTimer > 0 || p.dead) return;
    if (p.meter < 40 && p.specialCd > 0) return;
    if (p.meter >= 40) p.meter -= 40;
    else if (p.specialCd > 0) return;
    p.specialCd = 1.4;
    p.attackKind = "special";
    p.attackTimer = 0.42;
    p.anim = "special";
    p.animT = 0;
    p.hitIds = new Set();
    p.hitbox = {
      ox: -10,
      oy: -70,
      w: 110,
      h: 70,
      dmg: 28 * p.def.atk,
      knock: 140,
      stun: 0.55,
      depth: 50,
    };
    screenFlash = 0.12;
    addSlash(p.x + p.facing * 20, p.y - 30 - p.z, p.facing, p.def.color, 0.28);
    addDust(p.x, p.y);
  }

  function hitboxWorld(owner, hb) {
    if (!hb) return null;
    const x = owner.facing === 1 ? owner.x + hb.ox : owner.x - hb.ox - hb.w;
    return {
      x,
      y: owner.y + hb.oy - (owner.z || 0),
      w: hb.w,
      h: hb.h,
      foot: owner.y,
      depth: hb.depth,
    };
  }

  function depthOverlap(aFoot, bFoot, tol) {
    return Math.abs(aFoot - bFoot) <= tol;
  }

  function tryHitEnemies(p) {
    const box = hitboxWorld(p, p.hitbox);
    if (!box) return;
    for (const e of enemies) {
      if (e.dead || e.invuln > 0) continue;
      if (p.hitIds.has(e.id)) continue;
      if (!depthOverlap(p.y, e.y, box.depth)) continue;
      const er = { x: e.x - e.w / 2, y: e.y - e.h - e.z, w: e.w, h: e.h };
      if (
        box.x < er.x + er.w &&
        box.x + box.w > er.x &&
        box.y < er.y + er.h &&
        box.y + box.h > er.y
      ) {
        p.hitIds.add(e.id);
        applyHitToEnemy(e, p.hitbox, p.facing);
        hitstopT = HITSTOP;
        p.meter = Math.min(p.maxMeter, p.meter + 12);
      }
    }
  }

  function applyHitToEnemy(e, hb, facing) {
    e.hp -= hb.dmg;
    e.stun = hb.stun;
    e.knock = facing * hb.knock;
    e.flash = 0.12;
    e.invuln = 0.08;
    e.showHp = 1.5;
    e.attackTimer = 0;
    e.hitbox = null;
    addSpark(e.x, e.y - e.h * 0.5, 8);
    if (e.hp <= 0) {
      e.dead = true;
      e.deathT = 0.55;
      e.hp = 0;
      score += e.elite ? 500 : 100;
      player.meter = Math.min(player.maxMeter, player.meter + (e.elite ? 25 : 10));
    }
  }

  function tryHitPlayer(e) {
    const p = player;
    if (!p || p.dead || p.invuln > 0) return;
    const box = hitboxWorld(e, e.hitbox);
    if (!box) return;
    if (!depthOverlap(e.y, p.y, box.depth + 8)) return;
    const pr = { x: p.x - p.w / 2, y: p.y - p.h - p.z, w: p.w, h: p.h };
    if (
      box.x < pr.x + pr.w &&
      box.x + box.w > pr.x &&
      box.y < pr.y + pr.h &&
      box.y + box.h > pr.y
    ) {
      p.hp -= e.dmg;
      p.invuln = 0.7;
      p.flash = 0.15;
      p.x += e.facing * 28;
      p.attackTimer = 0;
      p.hitbox = null;
      hitstopT = HITSTOP;
      screenFlash = 0.08;
      addSpark(p.x, p.y - 40, 6);
      e.hitbox = null;
      if (p.hp <= 0) {
        p.hp = 0;
        p.dead = true;
        mode = Mode.LOSE;
      }
    }
  }

  // —— 更新 ——
  function updatePlayer(dt) {
    const p = player;
    if (!p || p.dead) return;

    if (p.invuln > 0) p.invuln -= dt;
    if (p.flash > 0) p.flash -= dt;
    if (p.specialCd > 0) p.specialCd -= dt;
    if (p.comboTimer > 0) p.comboTimer -= dt;
    else p.comboStep = 0;

    // 攻击中限制移动
    const attacking = p.attackTimer > 0;
    if (attacking) {
      p.attackTimer -= dt;
      p.animT += dt;
      if (p.hitbox) tryHitEnemies(p);
      if (p.attackTimer <= 0) {
        p.attackTimer = 0;
        p.attackKind = null;
        p.hitbox = null;
        p.anim = p.z > 4 ? "jump" : "idle";
      }
    }

    let mx = 0;
    let my = 0;
    if (held("a") || held("ArrowLeft")) mx -= 1;
    if (held("d") || held("ArrowRight")) mx += 1;
    if (held("w") || held("ArrowUp")) my -= 1;
    if (held("s") || held("ArrowDown")) my += 1;

    if (!attacking || p.attackKind === "jump") {
      const spd = PLAYER_SPEED * p.def.speed;
      if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my) || 1;
        p.x += (mx / len) * spd * dt;
        p.y += (my / len) * DEPTH_SPEED * p.def.speed * dt;
        if (mx !== 0) p.facing = mx > 0 ? 1 : -1;
        if (p.z <= 0 && !attacking) {
          p.anim = "walk";
          p.walkPhase += dt * 10;
        }
      } else if (p.z <= 0 && !attacking) {
        p.anim = "idle";
      }
    }

    // 短跳（高度 z 向上为正，vz 向上为正）
    if ((tap(" ") || tap("Space")) && p.z <= 0 && !attacking) {
      p.vz = 420;
      p.z = 0.1;
      p.anim = "jump";
      addDust(p.x, p.y);
    }

    // 跳跃物理
    if (p.z > 0 || p.vz !== 0) {
      p.vz -= GRAVITY * dt;
      p.z += p.vz * dt;
      if (p.z <= 0) {
        p.z = 0;
        p.vz = 0;
        if (p.attackKind !== "jump") addDust(p.x, p.y);
      } else if (!attacking) {
        p.anim = "jump";
      }
    }

    p.x = clamp(p.x, PLANE.xMin, PLANE.xMax);
    p.y = clamp(p.y, PLANE.yMin, PLANE.yMax);

    if (tap("j")) beginLight(p);
    if (tap("k")) beginSpecial(p);

    // 自然回气势
    p.meter = Math.min(p.maxMeter, p.meter + dt * 4);
  }

  function updateEnemy(e, dt) {
    if (e.dead) {
      e.deathT -= dt;
      return;
    }
    if (e.flash > 0) e.flash -= dt;
    if (e.invuln > 0) e.invuln -= dt;
    if (e.showHp > 0) e.showHp -= dt;

    if (e.stun > 0) {
      e.stun -= dt;
      e.x += e.knock * dt;
      e.knock *= Math.max(0, 1 - dt * 8);
      e.anim = "stun";
      return;
    }

    const p = player;
    if (!p || p.dead) return;

    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;

    // 围攻：不完全叠在一点，加侧向偏移
    const sideBias = (e.id.charCodeAt(0) % 5) - 2;
    const tx = p.x + sideBias * 28;
    const ty = p.y + ((e.id.charCodeAt(1) % 3) - 1) * 18;
    const tdx = tx - e.x;
    const tdy = ty - e.y;
    const td = Math.hypot(tdx, tdy) || 1;

    e.attackCd -= dt;

    if (e.attackTimer > 0) {
      e.attackTimer -= dt;
      e.anim = "atk";
      if (e.attackTimer < 0.18 && e.hitbox) tryHitPlayer(e);
      if (e.attackTimer <= 0) {
        e.hitbox = null;
        e.anim = "idle";
      }
      return;
    }

    const engage = e.elite ? 58 : 46;
    if (d < engage && Math.abs(dy) < 28) {
      e.facing = dx >= 0 ? 1 : -1;
      if (e.attackCd <= 0) {
        e.attackTimer = e.elite ? 0.45 : 0.32;
        e.attackCd = e.elite ? rand(0.9, 1.4) : rand(0.7, 1.2);
        e.hitbox = {
          ox: 12,
          oy: -44,
          w: e.elite ? 52 : 40,
          h: 40,
          depth: 26,
        };
        e.anim = "atk";
      } else {
        e.anim = "idle";
      }
    } else {
      e.x += (tdx / td) * e.speed * dt;
      e.y += (tdy / td) * e.speed * 0.75 * dt;
      e.facing = tdx >= 0 ? 1 : -1;
      e.anim = "walk";
      e.walkPhase += dt * 9;
    }

    e.x = clamp(e.x, PLANE.xMin - 20, PLANE.xMax + 20);
    e.y = clamp(e.y, PLANE.yMin, PLANE.yMax);
  }

  function updateEffects(dt) {
    for (const fx of effects) {
      fx.t -= dt;
      if (fx.type === "spark" || fx.type === "dust") {
        fx.x += fx.vx * dt;
        fx.y += fx.vy * dt;
        fx.vy += 400 * dt;
      }
    }
    effects = effects.filter((f) => f.t > 0);
  }

  function updatePlay(dt) {
    if (hitstopT > 0) {
      hitstopT -= dt;
      return;
    }
    if (screenFlash > 0) screenFlash -= dt;
    if (waveAnnounce > 0) waveAnnounce -= dt;

    updatePlayer(dt);

    for (const e of enemies) updateEnemy(e, dt);
    enemies = enemies.filter((e) => !e.dead || e.deathT > 0);

    updateEffects(dt);

    // 波次推进
    const alive = enemies.some((e) => !e.dead);
    if (!alive && waveAnnounce <= 0) {
      if (waveIndex < WAVES.length - 1) {
        waveIndex++;
        spawnWave(waveIndex);
      } else if (mode === Mode.PLAY) {
        stageClearT += dt;
        if (stageClearT > 0.6) mode = Mode.WIN;
      }
    }
  }

  // —— 绘制 ——
  function drawBackground() {
    if (imgStage.complete && imgStage.naturalWidth > 0) {
      // 裁切/缩放铺满，保留战场地面在下半
      const iw = imgStage.naturalWidth;
      const ih = imgStage.naturalHeight;
      // 源矩形：略偏下半地面
      const sy = ih * 0.02;
      const sh = ih * 0.96;
      ctx.drawImage(imgStage, 0, sy, iw, sh, 0, 0, W, H);
      // 暗角与可读性
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(0,0,0,0.15)");
      g.addColorStop(0.45, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "#3a2818";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#c47a30";
      ctx.fillRect(0, 0, W, H * 0.4);
      ctx.fillStyle = "#6b4420";
      ctx.fillRect(0, PLANE.yMin - 40, W, H);
    }

    // 可行走区域暗示（淡阴影）
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(W / 2, (PLANE.yMin + PLANE.yMax) / 2, 420, (PLANE.yMax - PLANE.yMin) / 2 + 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawShadow(x, y, w) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2, w * 0.55, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStickHero(p) {
    const def = p.def;
    const x = p.x;
    const ground = p.y;
    const z = p.z;
    const f = p.facing;
    const bob = p.anim === "walk" ? Math.sin(p.walkPhase) * 2 : 0;
    const top = ground - p.h - z + bob;

    drawShadow(x, ground, p.w);

    ctx.save();
    if (p.flash > 0 || (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0)) {
      ctx.globalAlpha = 0.75;
      ctx.filter = "brightness(2)";
    }

    // 尝试枪将精灵
    if (def.useSheet && imgHero.complete && imgHero.naturalWidth > 0) {
      let fr = FRAMES.idle;
      if (p.anim === "atk1") fr = FRAMES.atk1;
      else if (p.anim === "atk2") fr = FRAMES.atk2;
      else if (p.anim === "atk3") fr = FRAMES.atk3;
      else if (p.anim === "special") fr = FRAMES.special;
      else if (p.anim === "jumpAtk") fr = FRAMES.jumpAtk;
      else if (p.anim === "jump") fr = FRAMES.jump;
      else if (p.anim === "walk") fr = FRAMES.idle;

      const dw = 110;
      const dh = 110;
      ctx.save();
      ctx.translate(x, top + dh * 0.92);
      ctx.scale(f, 1);
      ctx.drawImage(imgHero, fr.sx, fr.sy, fr.sw, fr.sh, -dw / 2, -dh, dw, dh);
      ctx.restore();
      ctx.restore();
      return;
    }

    // 像素风剪影
    drawSilhouette(x, top, p.h, f, def, p.anim, p.walkPhase, false);
    ctx.restore();
  }

  function drawSilhouette(x, top, h, facing, style, anim, phase, elite) {
    const bodyW = elite ? 28 : 22;
    const bodyH = h * 0.45;
    const legH = h * 0.32;
    const headR = elite ? 11 : 9;
    const cx = x;
    const color = style.color || "#888";
    const accent = style.accent || "#ccc";
    const weapon = style.weapon || "spear";

    const walk = anim === "walk" ? Math.sin(phase) : 0;
    const atk = String(anim).startsWith("atk") || anim === "special" || anim === "jumpAtk";

    // 腿
    ctx.fillStyle = "#2a2218";
    ctx.fillRect(cx - 10 + walk * 3, top + h - legH, 8, legH);
    ctx.fillRect(cx + 2 - walk * 3, top + h - legH, 8, legH);

    // 身甲
    ctx.fillStyle = color;
    ctx.fillRect(cx - bodyW / 2, top + headR * 2 + 2, bodyW, bodyH);
    // 披风/肩
    ctx.fillStyle = accent;
    ctx.fillRect(cx - bodyW / 2 - 4, top + headR * 2 + 4, 5, bodyH * 0.7);
    ctx.fillRect(cx + bodyW / 2 - 1, top + headR * 2 + 4, 5, bodyH * 0.55);

    // 头 + 盔
    ctx.fillStyle = "#e8c8a0";
    ctx.beginPath();
    ctx.arc(cx, top + headR + 4, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(cx - headR - 1, top + 2, headR * 2 + 2, 10);
    // 盔缨
    ctx.fillStyle = "#c03030";
    ctx.fillRect(cx - 2, top - 6, 4, 10);
    ctx.beginPath();
    ctx.arc(cx, top - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // 武器
    ctx.save();
    ctx.translate(cx, top + h * 0.45);
    ctx.scale(facing, 1);
    const swing = atk ? 1 : 0;
    if (weapon === "spear") {
      ctx.strokeStyle = "#c8b090";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, 10);
      ctx.lineTo(48 + swing * 24, -20 - swing * 10);
      ctx.stroke();
      ctx.fillStyle = "#ddd";
      ctx.beginPath();
      ctx.moveTo(48 + swing * 24, -28 - swing * 10);
      ctx.lineTo(58 + swing * 24, -16 - swing * 10);
      ctx.lineTo(46 + swing * 24, -14 - swing * 10);
      ctx.fill();
      ctx.fillStyle = "#c03030";
      ctx.fillRect(30 + swing * 10, -8, 3, 10);
    } else if (weapon === "blade") {
      ctx.fillStyle = "#bcc8d8";
      ctx.save();
      ctx.rotate(swing ? -0.9 : -0.3);
      ctx.fillRect(10, -4, 46, 7);
      ctx.fillStyle = accent;
      ctx.fillRect(8, -6, 8, 11);
      ctx.restore();
    } else {
      // fan
      ctx.fillStyle = accent;
      ctx.save();
      ctx.rotate(swing ? -0.6 : 0.2);
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(40, -18);
      ctx.quadraticCurveTo(48, 0, 40, 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 精英饰条
    if (elite) {
      ctx.fillStyle = "#e8c040";
      ctx.fillRect(cx - 14, top + headR * 2 + 8, 28, 4);
    }
  }

  function drawEnemy(e) {
    if (e.dead && e.deathT < 0.25) {
      ctx.globalAlpha = Math.max(0, e.deathT / 0.25);
    }
    const style = e.elite
      ? { color: "#6b2d8a", accent: "#e8c040", weapon: "blade" }
      : { color: "#5a5048", accent: "#8a8070", weapon: "spear" };
    const top = e.y - e.h - e.z;
    drawShadow(e.x, e.y, e.w);
    ctx.save();
    if (e.flash > 0) ctx.filter = "brightness(3)";
    drawSilhouette(e.x, top, e.h, e.facing, style, e.anim, e.walkPhase, e.elite);
    ctx.restore();
    ctx.globalAlpha = 1;

    if (e.showHp > 0 && !e.dead) {
      const bw = e.elite ? 48 : 32;
      ctx.fillStyle = "#222";
      ctx.fillRect(e.x - bw / 2, top - 10, bw, 5);
      ctx.fillStyle = e.elite ? "#c040e0" : "#d04040";
      ctx.fillRect(e.x - bw / 2, top - 10, bw * (e.hp / e.maxHp), 5);
    }
  }

  function drawEffects() {
    for (const fx of effects) {
      const a = clamp(fx.t / fx.life, 0, 1);
      if (fx.type === "slash") {
        ctx.save();
        ctx.translate(fx.x, fx.y);
        ctx.scale(fx.facing, 1);
        ctx.globalAlpha = a;
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(10, 0, 34, -0.9, 0.7);
        ctx.stroke();
        ctx.restore();
      } else if (fx.type === "spark") {
        ctx.globalAlpha = a;
        ctx.fillStyle = fx.c;
        ctx.fillRect(fx.x, fx.y, 3, 3);
        ctx.globalAlpha = 1;
      } else if (fx.type === "dust") {
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = "#a08050";
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 6 * (1 - a + 0.3), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawHUD() {
    const p = player;
    if (!p) return;

    // 面板底
    ctx.fillStyle = "rgba(10,8,6,0.72)";
    ctx.fillRect(12, 10, 280, 62);
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 1;
    ctx.strokeRect(12.5, 10.5, 279, 61);

    ctx.fillStyle = "#e8d9a8";
    ctx.font = "bold 14px Microsoft YaHei, sans-serif";
    ctx.fillText(p.def.full, 22, 28);

    // 生命
    ctx.fillStyle = "#9a9080";
    ctx.font = "12px Microsoft YaHei, sans-serif";
    ctx.fillText("体力", 22, 48);
    ctx.fillStyle = "#2a2018";
    ctx.fillRect(54, 38, 160, 12);
    ctx.fillStyle = "#d43838";
    ctx.fillRect(54, 38, 160 * clamp(p.hp / p.maxHp, 0, 1), 12);
    ctx.strokeStyle = "#6a5a40";
    ctx.strokeRect(54.5, 38.5, 159, 11);

    // 必杀槽
    ctx.fillStyle = "#9a9080";
    ctx.fillText("气势", 22, 64);
    ctx.fillStyle = "#2a2018";
    ctx.fillRect(54, 54, 160, 10);
    const mg = ctx.createLinearGradient(54, 0, 214, 0);
    mg.addColorStop(0, "#2a6ac9");
    mg.addColorStop(1, "#e8c040");
    ctx.fillStyle = mg;
    ctx.fillRect(54, 54, 160 * clamp(p.meter / p.maxMeter, 0, 1), 10);
    ctx.strokeStyle = "#6a5a40";
    ctx.strokeRect(54.5, 54.5, 159, 9);

    // 右侧：分数 / 波次
    ctx.fillStyle = "rgba(10,8,6,0.72)";
    ctx.fillRect(W - 200, 10, 188, 50);
    ctx.strokeStyle = "#c9a227";
    ctx.strokeRect(W - 199.5, 10.5, 187, 49);
    ctx.fillStyle = "#e8d9a8";
    ctx.font = "13px Microsoft YaHei, sans-serif";
    ctx.fillText("得分  " + score, W - 188, 32);
    ctx.fillText("波次  " + (waveIndex + 1) + " / " + WAVES.length, W - 188, 50);

    if (waveAnnounce > 0) {
      ctx.globalAlpha = clamp(waveAnnounce, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, H * 0.38, W, 48);
      ctx.fillStyle = "#ffe9a0";
      ctx.font = "bold 26px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(WAVES[waveIndex].label, W / 2, H * 0.38 + 34);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
    }
  }

  function drawSortedActors() {
    const list = [];
    if (player && !player.dead) list.push({ kind: "p", ref: player, y: player.y });
    else if (player) list.push({ kind: "p", ref: player, y: player.y });
    for (const e of enemies) list.push({ kind: "e", ref: e, y: e.y });
    list.sort((a, b) => a.y - b.y);
    for (const item of list) {
      if (item.kind === "p") drawStickHero(item.ref);
      else drawEnemy(item.ref);
    }
  }

  // —— 界面 ——
  function drawTitle(dt) {
    titleT += dt;
    drawBackground();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    ctx.fillStyle = "#c9a227";
    ctx.font = "bold 56px Microsoft YaHei, serif";
    ctx.shadowColor = "rgba(201,162,39,0.5)";
    ctx.shadowBlur = 18;
    ctx.fillText("乱世刀锋", W / 2, 180);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#d4c4a0";
    ctx.font = "16px Microsoft YaHei, sans-serif";
    ctx.fillText("乱世将启 · 刀锋出鞘", W / 2, 230);

    const pulse = 0.65 + Math.sin(titleT * 3) * 0.35;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#ffe9a0";
    ctx.font = "bold 20px Microsoft YaHei, sans-serif";
    ctx.fillText("按 Enter / 空格 开始", W / 2, 340);
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#8a8578";
    ctx.font = "13px Microsoft YaHei, sans-serif";
    ctx.fillText("原创街机乱斗 · 八向走位 · 连招格斗", W / 2, 480);
    ctx.textAlign = "left";

    if (tap("Enter") || tap(" ") || tap("Space") || mouse.click) {
      mouse.click = false;
      mode = Mode.SELECT;
      clearTaps();
    }
  }

  function hitSelectCard(i) {
    const cardW = 220;
    const gap = 28;
    const total = 3 * cardW + 2 * gap;
    const x0 = (W - total) / 2;
    const x = x0 + i * (cardW + gap);
    const y = 150;
    const h = 280;
    return mouse.x >= x && mouse.x <= x + cardW && mouse.y >= y && mouse.y <= y + h;
  }

  function drawSelect(dt) {
    titleT += dt;
    drawBackground();
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    ctx.fillStyle = "#c9a227";
    ctx.font = "bold 28px Microsoft YaHei, sans-serif";
    ctx.fillText("选择出战武将", W / 2, 70);
    ctx.fillStyle = "#8a8578";
    ctx.font = "13px Microsoft YaHei, sans-serif";
    ctx.fillText("← → 选择 · Enter / 空格 确认 · 或鼠标点击", W / 2, 100);

    if (tap("ArrowLeft") || tap("a")) selectIndex = (selectIndex + 2) % 3;
    if (tap("ArrowRight") || tap("d")) selectIndex = (selectIndex + 1) % 3;

    for (let i = 0; i < 3; i++) {
      if (hitSelectCard(i) && mouse.click) {
        selectIndex = i;
        mouse.click = false;
        startPlay();
        clearTaps();
        return;
      }
    }
    mouse.click = false;

    const cardW = 220;
    const gap = 28;
    const total = 3 * cardW + 2 * gap;
    const x0 = (W - total) / 2;

    for (let i = 0; i < HEROES.length; i++) {
      const h = HEROES[i];
      const x = x0 + i * (cardW + gap);
      const y = 150;
      const selected = i === selectIndex;

      ctx.fillStyle = selected ? "rgba(40,30,12,0.92)" : "rgba(16,14,12,0.85)";
      ctx.fillRect(x, y, cardW, 280);
      ctx.strokeStyle = selected ? "#c9a227" : "#4a4538";
      ctx.lineWidth = selected ? 3 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cardW - 1, 279);

      // 预览剪影
      const preview = {
        def: h,
        x: x + cardW / 2,
        y: y + 200,
        z: 0,
        facing: 1,
        w: 42,
        h: 78,
        anim: selected ? "walk" : "idle",
        walkPhase: titleT * 8,
        flash: 0,
        invuln: 0,
        attackTimer: 0,
      };
      // 局部绘制
      const top = preview.y - preview.h;
      if (h.useSheet && imgHero.complete && imgHero.naturalWidth > 0) {
        const fr = FRAMES.idle;
        ctx.save();
        ctx.translate(preview.x, top + 100);
        ctx.drawImage(imgHero, fr.sx, fr.sy, fr.sw, fr.sh, -55, -100, 110, 110);
        ctx.restore();
      } else {
        drawSilhouette(preview.x, top, preview.h, 1, h, preview.anim, preview.walkPhase, false);
      }

      ctx.fillStyle = h.color;
      ctx.font = "bold 22px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(h.name, x + cardW / 2, y + 36);
      ctx.fillStyle = "#e8d9a8";
      ctx.font = "13px Microsoft YaHei, sans-serif";
      ctx.fillText(h.full, x + cardW / 2, y + 58);
      ctx.fillStyle = "#a09070";
      ctx.font = "12px Microsoft YaHei, sans-serif";
      ctx.fillText(h.title, x + cardW / 2, y + 78);
      ctx.fillText(h.desc, x + cardW / 2, y + 260);
      ctx.fillText("必杀：" + h.specialName, x + cardW / 2, y + 278);
    }

    ctx.fillStyle = "#ffe9a0";
    ctx.font = "bold 18px Microsoft YaHei, sans-serif";
    ctx.fillText("按 Enter 出征 →", W / 2, 470);
    ctx.textAlign = "left";

    if (tap("Enter") || tap(" ") || tap("Space")) {
      startPlay();
      clearTaps();
    }
  }

  function drawEnd(win) {
    drawBackground();
    drawSortedActors();
    drawEffects();
    drawHUD();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = win ? "#c9a227" : "#d05050";
    ctx.font = "bold 42px Microsoft YaHei, sans-serif";
    ctx.fillText(win ? "关卡肃清" : "力战不敌", W / 2, 220);
    ctx.fillStyle = "#e8d9a8";
    ctx.font = "18px Microsoft YaHei, sans-serif";
    ctx.fillText("得分 " + score, W / 2, 270);
    ctx.fillText("按 Enter / 空格 返回选将", W / 2, 330);
    ctx.textAlign = "left";

    if (tap("Enter") || tap(" ") || tap("Space") || mouse.click) {
      mouse.click = false;
      mode = Mode.SELECT;
      clearTaps();
    }
  }

  function drawPlay() {
    drawBackground();
    drawSortedActors();
    drawEffects();
    drawHUD();
    if (screenFlash > 0) {
      ctx.fillStyle = "rgba(255,240,200," + clamp(screenFlash * 3, 0, 0.35) + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }

  // —— 主循环 ——
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 0.05);

    if (mode === Mode.TITLE) drawTitle(dt);
    else if (mode === Mode.SELECT) drawSelect(dt);
    else if (mode === Mode.PLAY) {
      updatePlay(dt);
      drawPlay();
    } else if (mode === Mode.WIN) drawEnd(true);
    else if (mode === Mode.LOSE) drawEnd(false);

    clearTaps();
    mouse.click = false;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
