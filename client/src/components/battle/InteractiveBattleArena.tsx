'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { PokemonDetails } from '@/types/pokemon';
import { BattleEndResult } from '@/services/gameApi';
import { getPokemonImage } from '@/utils/pokemonImage';
import { battleTheme } from './battleTheme';

const RADIUS = 44;
const ORBIT_R = 32;
const ORBIT_SPEED = 0.018;
const MAX_SPEED = 14;
const DRAG_POWER = 0.22;
const HIT_COOLDOWN_MS = 700;
const WALL_BOUNCE = 0.72;

interface FighterStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

interface Fighter {
  id: 'p1' | 'p2';
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  orbitAngle: number;
  hp: number;
  maxHp: number;
  stats: FighterStats;
  lastHitAt: number;
  name: string;
  image: string;
}

interface DamagePopup {
  id: number;
  x: number;
  y: number;
  amount: number;
  critical: boolean;
}

function extractStats(pokemon: PokemonDetails): FighterStats {
  const map: Record<string, number> = {};
  pokemon.stats?.forEach((s) => {
    map[s.stat.name.toLowerCase().replace('-', '')] = s.base_stat;
  });
  return {
    hp: map.hp || 100,
    attack: map.attack || 55,
    defense: map.defense || 55,
    speed: map.speed || 50,
  };
}

function HpBar({
  current,
  max,
  label,
  align,
}: {
  current: number;
  max: number;
  label: string;
  align: 'left' | 'right';
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const fill =
    pct > 50 ? battleTheme.hpHigh : pct > 25 ? battleTheme.hpMid : battleTheme.hpLow;

  return (
    <div className={`w-full max-w-[180px] ${align === 'right' ? 'ml-auto text-right' : ''}`}>
      <p
        className="text-[11px] font-semibold capitalize mb-1 truncate"
        style={{ color: battleTheme.buttercream }}
      >
        {label}
      </p>
      <div
        className="h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: `${battleTheme.navy}99`, border: `1px solid ${battleTheme.mist}40` }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: fill }}
        />
      </div>
      <p className="text-[10px] mt-0.5 font-mono" style={{ color: `${battleTheme.mist}cc` }}>
        {Math.max(0, current)}/{max}
      </p>
    </div>
  );
}

interface InteractiveBattleArenaProps {
  pokemon1: PokemonDetails;
  pokemon2: PokemonDetails;
  onBattleEnd: (result: BattleEndResult) => void;
  onRematch: () => void;
  onExit: () => void;
}

export default function InteractiveBattleArena({
  pokemon1,
  pokemon2,
  onBattleEnd,
  onRematch,
  onExit,
}: InteractiveBattleArenaProps) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const fightersRef = useRef<Fighter[]>([]);
  const rafRef = useRef<number>(0);
  const popupIdRef = useRef(0);
  const hitsRef = useRef(0);
  const endedRef = useRef(false);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    pointerX: number;
    pointerY: number;
  }>({ active: false, startX: 0, startY: 0, pointerX: 0, pointerY: 0 });
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const [message, setMessage] = useState('Drag your Pokémon — aim and release to attack!');
  const [isDragging, setIsDragging] = useState(false);
  const [aimEnd, setAimEnd] = useState<{ x: number; y: number } | null>(null);
  const [aimStart, setAimStart] = useState<{ x: number; y: number } | null>(null);
  const [screenShake, setScreenShake] = useState(false);

  const initFighters = useCallback((w: number, h: number): Fighter[] => {
    const s1 = extractStats(pokemon1);
    const s2 = extractStats(pokemon2);
    return [
      {
        id: 'p1',
        x: w * 0.28,
        y: h * 0.72,
        vx: 0,
        vy: 0,
        homeX: w * 0.28,
        homeY: h * 0.72,
        orbitAngle: 0,
        hp: s1.hp,
        maxHp: s1.hp,
        stats: s1,
        lastHitAt: 0,
        name: pokemon1.name,
        image: getPokemonImage(pokemon1),
      },
      {
        id: 'p2',
        x: w * 0.72,
        y: h * 0.28,
        vx: 0,
        vy: 0,
        homeX: w * 0.72,
        homeY: h * 0.28,
        orbitAngle: Math.PI,
        hp: s2.hp,
        maxHp: s2.hp,
        stats: s2,
        lastHitAt: 0,
        name: pokemon2.name,
        image: getPokemonImage(pokemon2),
      },
    ];
  }, [pokemon1, pokemon2]);

  const addPopup = (x: number, y: number, amount: number, critical: boolean) => {
    const id = ++popupIdRef.current;
    setPopups((p) => [...p, { id, x, y, amount, critical }]);
    setTimeout(() => setPopups((p) => p.filter((pp) => pp.id !== id)), 900);
  };

  const resolveCollision = (a: Fighter, b: Fighter, now: number) => {
    if (now - a.lastHitAt < HIT_COOLDOWN_MS && now - b.lastHitAt < HIT_COOLDOWN_MS) return;

    const aSpeed = Math.hypot(a.vx, a.vy);
    const bSpeed = Math.hypot(b.vx, b.vy);
    const relSpeed = Math.hypot(a.vx - b.vx, a.vy - b.vy);

    if (relSpeed < 1.5 && aSpeed < 1 && bSpeed < 1) return;

    const aIsAttacker = aSpeed >= bSpeed;
    const attacker = aIsAttacker ? a : b;
    const defender = aIsAttacker ? b : a;

    if (now - attacker.lastHitAt < HIT_COOLDOWN_MS) return;

    const damage = Math.max(
      4,
      Math.floor(
        (attacker.stats.attack * 0.35 + relSpeed * 2.2) /
          (defender.stats.defense * 0.08 + 1),
      ),
    );

    defender.hp = Math.max(0, defender.hp - damage);
    attacker.lastHitAt = now;
    defender.lastHitAt = now;
    hitsRef.current += 1;

    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    addPopup(mx, my, damage, relSpeed > 8);

    const nx = b.x - a.x || 0.01;
    const ny = b.y - a.y || 0.01;
    const len = Math.hypot(nx, ny);
    const knock = 3.5;
    a.vx -= (nx / len) * knock * (aIsAttacker ? -0.5 : 1);
    a.vy -= (ny / len) * knock * (aIsAttacker ? -0.5 : 1);
    b.vx += (nx / len) * knock * (aIsAttacker ? 1 : -0.5);
    b.vy += (ny / len) * knock * (aIsAttacker ? 1 : -0.5);

    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
    setMessage(
      `${attacker.name} collides — ${damage} damage to ${defender.name}!`,
    );
  };

  const launchAi = useCallback(() => {
    const f = fightersRef.current;
    const p2 = f.find((x) => x.id === 'p2');
    const p1 = f.find((x) => x.id === 'p1');
    if (!p2 || !p1 || endedRef.current || p2.hp <= 0) return;

    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = Math.min(MAX_SPEED, 6 + p2.stats.speed * 0.04);
    p2.vx = (dx / dist) * speed + (Math.random() - 0.5) * 2;
    p2.vy = (dy / dist) * speed + (Math.random() - 0.5) * 2;
    setMessage(`${p2.name} charges at you!`);
  }, []);

  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;

    let started = false;

    const startLoop = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 50 || h < 50 || started) return;
      started = true;
      endedRef.current = false;
      hitsRef.current = 0;

      const initial = initFighters(w, h);
      fightersRef.current = initial;
      setFighters([...initial]);

    const tick = () => {
      const arena = arenaRef.current;
      if (!arena || endedRef.current) return;

      const w = arena.clientWidth;
      const h = arena.clientHeight;
      const now = Date.now();
      const list = fightersRef.current;

      for (const f of list) {
        const speed = Math.hypot(f.vx, f.vy);
        const orbiting = speed < 0.8 && !dragRef.current.active;

        if (orbiting && f.id === 'p1' && !dragRef.current.active) {
          f.orbitAngle += ORBIT_SPEED * (f.id === 'p1' ? 1 : -1);
          const tx = f.homeX + Math.cos(f.orbitAngle) * ORBIT_R;
          const ty = f.homeY + Math.sin(f.orbitAngle) * ORBIT_R;
          f.x += (tx - f.x) * 0.08;
          f.y += (ty - f.y) * 0.08;
          f.vx *= 0.9;
          f.vy *= 0.9;
        } else if (orbiting && f.id === 'p2') {
          f.orbitAngle -= ORBIT_SPEED * 0.85;
          const tx = f.homeX + Math.cos(f.orbitAngle) * ORBIT_R;
          const ty = f.homeY + Math.sin(f.orbitAngle) * ORBIT_R;
          f.x += (tx - f.x) * 0.08;
          f.y += (ty - f.y) * 0.08;
          f.vx *= 0.9;
          f.vy *= 0.9;
        } else {
          f.x += f.vx;
          f.y += f.vy;
          f.vx *= 0.992;
          f.vy *= 0.992;
        }

        if (f.x < RADIUS) { f.x = RADIUS; f.vx = Math.abs(f.vx) * WALL_BOUNCE; }
        if (f.x > w - RADIUS) { f.x = w - RADIUS; f.vx = -Math.abs(f.vx) * WALL_BOUNCE; }
        if (f.y < RADIUS) { f.y = RADIUS; f.vy = Math.abs(f.vy) * WALL_BOUNCE; }
        if (f.y > h - RADIUS) { f.y = h - RADIUS; f.vy = -Math.abs(f.vy) * WALL_BOUNCE; }
      }

      const [a, b] = list;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < RADIUS * 2) resolveCollision(a, b, now);

      if (a.hp <= 0 || b.hp <= 0) {
        if (!endedRef.current) {
          endedRef.current = true;
          const winner = a.hp > 0 ? a : b;
          const loser = a.hp > 0 ? b : a;
          setTimeout(() => {
            onBattleEnd({
              winnerId: winner.id === 'p1' ? pokemon1.id : pokemon2.id,
              winnerName: winner.name,
              loserId: loser.id === 'p1' ? pokemon1.id : pokemon2.id,
              pokemon1Id: pokemon1.id,
              pokemon2Id: pokemon2.id,
              hits: hitsRef.current,
            });
          }, 600);
        }
      }

      setFighters([...list]);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const scheduleAi = () => {
      aiTimerRef.current = setTimeout(() => {
        launchAi();
        scheduleAi();
      }, 2200 + Math.random() * 1800);
    };
    scheduleAi();
    };

    startLoop();
    const ro = new ResizeObserver(() => startLoop());
    ro.observe(el);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [initFighters, launchAi, onBattleEnd, pokemon1, pokemon2]);

  const getArenaPoint = (clientX: number, clientY: number) => {
    const rect = arenaRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (endedRef.current) return;
    const p = getArenaPoint(e.clientX, e.clientY);
    const p1 = fightersRef.current.find((f) => f.id === 'p1');
    if (!p1) return;

    const dist = Math.hypot(p.x - p1.x, p.y - p1.y);
    if (dist > RADIUS + 20) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: p1.x,
      startY: p1.y,
      pointerX: p.x,
      pointerY: p.y,
    };
    setIsDragging(true);
    setAimStart({ x: p1.x, y: p1.y });
    setAimEnd(p);
    p1.vx = 0;
    p1.vy = 0;
    setMessage('Aim… release to launch your attack!');
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const p = getArenaPoint(e.clientX, e.clientY);
    dragRef.current.pointerX = p.x;
    dragRef.current.pointerY = p.y;
    setAimEnd(p);

    const p1 = fightersRef.current.find((f) => f.id === 'p1');
    if (p1) {
      const dx = p.x - dragRef.current.startX;
      const dy = p.y - dragRef.current.startY;
      p1.x = dragRef.current.startX + dx * 0.35;
      p1.y = dragRef.current.startY + dy * 0.35;
    }
  };

  const onPointerUp = () => {
    if (!dragRef.current.active) return;
    const p1 = fightersRef.current.find((f) => f.id === 'p1');
    if (p1) {
      const dx = dragRef.current.pointerX - dragRef.current.startX;
      const dy = dragRef.current.pointerY - dragRef.current.startY;
      const mag = Math.hypot(dx, dy);
      if (mag > 12) {
        const speed = Math.min(MAX_SPEED, mag * DRAG_POWER);
        p1.vx = (dx / mag) * speed;
        p1.vy = (dy / mag) * speed;
        setMessage(`${pokemon1.name} attacks!`);
      }
    }
    dragRef.current.active = false;
    setIsDragging(false);
    setAimEnd(null);
    setAimStart(null);
  };

  const p1 = fighters.find((f) => f.id === 'p1');
  const p2 = fighters.find((f) => f.id === 'p2');

  return (
    <div className="relative">
      <div
        ref={arenaRef}
        className={`relative touch-none select-none overflow-hidden rounded-xl mx-3 mt-3 ${screenShake ? 'animate-battle-shake' : ''}`}
        style={{
          height: 'min(52vh, 400px)',
          background: `linear-gradient(165deg, ${battleTheme.mist} 0%, ${battleTheme.buttercream} 45%, ${battleTheme.peachFuzz}55 100%)`,
          border: `3px solid ${battleTheme.classicBlue}`,
          boxShadow: `inset 0 0 60px ${battleTheme.classicBlue}22`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Orbit rings */}
        {p1 && (
          <div
            className="pointer-events-none absolute rounded-full border border-dashed opacity-40"
            style={{
              width: ORBIT_R * 2 + RADIUS,
              height: ORBIT_R * 2 + RADIUS,
              left: p1.homeX - ORBIT_R - RADIUS / 2,
              top: p1.homeY - ORBIT_R - RADIUS / 2,
              borderColor: battleTheme.oasis,
            }}
          />
        )}
        {p2 && (
          <div
            className="pointer-events-none absolute rounded-full border border-dashed opacity-30"
            style={{
              width: ORBIT_R * 2 + RADIUS,
              height: ORBIT_R * 2 + RADIUS,
              left: p2.homeX - ORBIT_R - RADIUS / 2,
              top: p2.homeY - ORBIT_R - RADIUS / 2,
              borderColor: battleTheme.livingCoral,
            }}
          />
        )}

        {/* Aim line */}
        {isDragging && aimEnd && aimStart && (
          <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full">
            <line
              x1={aimStart.x}
              y1={aimStart.y}
              x2={aimEnd.x}
              y2={aimEnd.y}
              stroke={battleTheme.livingCoral}
              strokeWidth={3}
              strokeDasharray="8 6"
              opacity={0.85}
            />
            <circle cx={aimEnd.x} cy={aimEnd.y} r={6} fill={battleTheme.livingCoral} opacity={0.6} />
          </svg>
        )}

        {/* HP overlays */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none">
          {p1 && <HpBar current={p1.hp} max={p1.maxHp} label={p1.name} align="left" />}
        </div>
        <div className="absolute top-3 right-3 z-30 pointer-events-none">
          {p2 && <HpBar current={p2.hp} max={p2.maxHp} label={p2.name} align="right" />}
        </div>

        {/* Hint */}
        <p
          className="absolute bottom-2 left-0 right-0 text-center text-[10px] sm:text-xs z-30 pointer-events-none px-4"
          style={{ color: `${battleTheme.navy}99` }}
        >
          Hold & drag your Pokémon · release to strike · works with touch
        </p>

        {/* Damage popups */}
        {popups.map((pop) => (
          <span
            key={pop.id}
            className="absolute z-40 font-black text-xl animate-damage-float pointer-events-none"
            style={{
              left: pop.x,
              top: pop.y,
              color: pop.critical ? battleTheme.livingCoral : battleTheme.classicBlue,
              textShadow: '0 1px 3px rgba(255,255,255,0.9)',
            }}
          >
            -{pop.amount}
          </span>
        ))}

        {/* Fighters */}
        {fighters.map((f) => (
          <div
            key={f.id}
            className="absolute z-10 will-change-transform"
            style={{
              left: f.x - RADIUS,
              top: f.y - RADIUS,
              width: RADIUS * 2,
              height: RADIUS * 2,
              transform: `rotate(${f.vx * 2}deg)`,
              transition: dragRef.current.active && f.id === 'p1' ? 'none' : undefined,
            }}
          >
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center"
              style={{
                background:
                  f.id === 'p1'
                    ? `radial-gradient(circle, ${battleTheme.oasis}44 0%, transparent 70%)`
                    : `radial-gradient(circle, ${battleTheme.livingCoral}44 0%, transparent 70%)`,
                boxShadow:
                  f.id === 'p1' && isDragging
                    ? `0 0 0 3px ${battleTheme.oasis}, 0 8px 24px ${battleTheme.classicBlue}44`
                    : `0 4px 16px ${battleTheme.navy}33`,
                cursor: f.id === 'p1' ? 'grab' : 'default',
              }}
            >
              <Image
                src={f.image}
                alt={f.name}
                width={RADIUS * 1.6}
                height={RADIUS * 1.6}
                className={`pointer-events-none drop-shadow-md ${f.id === 'p2' ? 'scale-x-[-1]' : ''}`}
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className="mx-3 mb-3 mt-3 rounded-xl p-4"
        style={{ backgroundColor: battleTheme.navy, borderTop: `3px solid ${battleTheme.classicBlue}` }}
      >
        <p className="text-sm capitalize min-h-[40px] flex items-center" style={{ color: battleTheme.buttercream }}>
          {message}
        </p>
        <div className="flex gap-3 mt-3">
          <button
            type="button"
            onClick={onRematch}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            style={{ backgroundColor: battleTheme.classicBlue, color: battleTheme.buttercream }}
          >
            Rematch
          </button>
          <button
            type="button"
            onClick={onExit}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            style={{ backgroundColor: battleTheme.oasis, color: battleTheme.navy }}
          >
            Exit Arena
          </button>
        </div>
      </div>
    </div>
  );
}
