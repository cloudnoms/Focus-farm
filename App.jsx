import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const FOCUS_DURATION = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;
const COINS_PER_SESSION = 10;
const GRID_SIZE = 8;

const CROPS = {
  tomato: { name: "Tomato", icon: "🍅", price: 20, stages: ["🌱", "🌿", "🍃", "🍅"], color: "#e74c3c" },
  corn:   { name: "Corn",   icon: "🌽", price: 30, stages: ["🌱", "🌿", "🌾", "🌽"], color: "#f1c40f" },
  potato: { name: "Potato", icon: "🥔", price: 30, stages: ["🌱", "🍃", "🌿", "🥔"], color: "#8B6914" },
  cabbage:{ name: "Cabbage",icon: "🥬", price: 40, stages: ["🌱", "🌿", "💚", "🥬"], color: "#27ae60" },
};

const ANIMALS = {
  chicken: { name: "Chicken", icon: "🐔", price: 80,  stages: ["🥚", "🐣", "🐔"], wandering: true },
  pig:     { name: "Pig",     icon: "🐷", price: 120, stages: ["🐷", "🐖"],       wandering: false },
  cow:     { name: "Cow",     icon: "🐄", price: 200, stages: ["🐂", "🐄"],       wandering: false },
};

const MILESTONES = [
  { sessions: 5,  label: "River unlocked", icon: "🏞️" },
  { sessions: 15, label: "Barn built",      icon: "🏚️" },
  { sessions: 30, label: "Orchard planted", icon: "🌳" },
  { sessions: 50, label: "Pond added",      icon: "🏝️" },
];

const ACHIEVEMENTS = [
  { id: "first_session",  label: "First Focus",    desc: "Complete your first session",  icon: "🌟", condition: (s) => s.totalSessions >= 1 },
  { id: "ten_sessions",   label: "On A Roll",       desc: "Complete 10 sessions",          icon: "🔥", condition: (s) => s.totalSessions >= 10 },
  { id: "streak_3",       label: "Streak Master",   desc: "3-day streak",                  icon: "⚡", condition: (s) => s.streak >= 3 },
  { id: "first_harvest",  label: "First Harvest",   desc: "Grow a crop to full maturity",  icon: "🌾", condition: (s) => s.harvests >= 1 },
  { id: "first_animal",   label: "Farmer",          desc: "Add an animal to your farm",    icon: "🐾", condition: (s) => s.animals >= 1 },
];

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
const defaultState = () => ({
  coins: 50,
  totalSessions: 0,
  todaySessions: 0,
  streak: 1,
  lastActiveDate: new Date().toDateString(),
  harvests: 0,
  animals: 0,
  inventory: { tomato: 2, corn: 1 },
  grid: Array(GRID_SIZE * GRID_SIZE).fill(null),
  unlockedAchievements: [],
  selectedItem: null,
});

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useLocalStorage(key, init) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? { ...init, ...JSON.parse(stored) } : init;
    } catch { return init; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

// ─── AUDIO UTILS ─────────────────────────────────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.6);
    });
  } catch {}
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function CoinDisplay({ coins, pulse }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "rgba(255,220,100,0.18)", border: "1.5px solid #f6c90e",
      borderRadius: 20, padding: "5px 14px", fontFamily: "'Fredoka One', cursive",
      fontSize: 18, color: "#b8860b", transition: "transform 0.2s",
      transform: pulse ? "scale(1.18)" : "scale(1)",
    }}>
      🪙 {coins}
    </div>
  );
}

function ProgressRing({ progress, sessionType }) {
  const r = 88;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  const colors = { focus: "#5a8a4e", break: "#6aabcc", longbreak: "#9b59b6" };
  const c = colors[sessionType] || "#5a8a4e";
  return (
    <svg width={200} height={200} style={{ filter: `drop-shadow(0 0 18px ${c}55)` }}>
      <circle cx={100} cy={100} r={r} fill="none" stroke="#e8e0d5" strokeWidth={10} />
      <circle cx={100} cy={100} r={r} fill="none" stroke={c} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s linear", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
    </svg>
  );
}

function TimerScreen({ appState, setAppState, onSessionComplete }) {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [running, setRunning] = useState(false);
  const [sessionType, setSessionType] = useState("focus");
  const [sessionCount, setSessionCount] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const intervalRef = useRef(null);

  const durations = { focus: FOCUS_DURATION, break: SHORT_BREAK, longbreak: LONG_BREAK };
  const total = durations[sessionType];
  const progress = (total - timeLeft) / total;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, sessionType]);

  function handleComplete() {
    playChime();
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2200);
    if (sessionType === "focus") {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      onSessionComplete(newCount);
      const next = newCount % 4 === 0 ? "longbreak" : "break";
      setTimeout(() => { setSessionType(next); setTimeLeft(durations[next]); }, 1800);
    } else {
      setTimeout(() => { setSessionType("focus"); setTimeLeft(FOCUS_DURATION); }, 1200);
    }
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const label = sessionType === "focus" ? "Focus Time" : sessionType === "break" ? "Short Break" : "Long Break";

  const sessionTypeColors = {
    focus: { bg: "linear-gradient(160deg, #f0ece3 0%, #e8f5e0 100%)", accent: "#5a8a4e" },
    break: { bg: "linear-gradient(160deg, #e8f4fb 0%, #ddeeff 100%)", accent: "#6aabcc" },
    longbreak: { bg: "linear-gradient(160deg, #f3eeff 0%, #e8ddf8 100%)", accent: "#9b59b6" },
  };
  const theme = sessionTypeColors[sessionType];

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)", background: theme.bg,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 32, transition: "background 0.8s ease",
    }}>
      {celebrate && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 99 }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${10 + Math.random() * 80}%`,
              top: "-10%",
              fontSize: 28,
              animation: `fall${i % 3} 2s ease-in forwards`,
              animationDelay: `${Math.random() * 0.6}s`,
            }}>
              {["🌟", "✨", "🍀", "🌸", "💛", "🪙"][i % 6]}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 13, letterSpacing: 3, color: theme.accent, textTransform: "uppercase", marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 13, color: "#999", letterSpacing: 1 }}>
          Session {sessionCount + 1} • Streak 🔥 {appState.streak}
        </div>
      </div>

      <div style={{ position: "relative", width: 200, height: 200, margin: "16px 0" }}>
        <ProgressRing progress={progress} sessionType={sessionType} />
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 46, color: "#3a3020", lineHeight: 1,
            textShadow: "0 2px 8px rgba(0,0,0,0.07)",
          }}>
            {mins}:{secs}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button onClick={() => setRunning(r => !r)} style={{
          background: theme.accent, color: "#fff",
          border: "none", borderRadius: 24, padding: "13px 36px",
          fontFamily: "'Fredoka One', cursive", fontSize: 18,
          cursor: "pointer", boxShadow: `0 4px 18px ${theme.accent}44`,
          transition: "transform 0.1s, box-shadow 0.1s",
          transform: "scale(1)",
        }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          {running ? "⏸ Pause" : "▶ Start"}
        </button>
        <button onClick={() => { setRunning(false); setTimeLeft(durations[sessionType]); }} style={{
          background: "transparent", border: `1.5px solid ${theme.accent}`,
          color: theme.accent, borderRadius: 24, padding: "13px 22px",
          fontFamily: "'Fredoka One', cursive", fontSize: 16, cursor: "pointer",
        }}>
          ↺ Reset
        </button>
        {sessionType !== "focus" && (
          <button onClick={() => { setRunning(false); setSessionType("focus"); setTimeLeft(FOCUS_DURATION); }} style={{
            background: "transparent", border: `1.5px solid ${theme.accent}`,
            color: theme.accent, borderRadius: 24, padding: "13px 18px",
            fontFamily: "'Fredoka One', cursive", fontSize: 14, cursor: "pointer",
          }}>
            ⏭ Skip
          </button>
        )}
      </div>

      <div style={{ marginTop: 32, display: "flex", gap: 8 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: "50%",
            background: i < sessionCount % 4 ? theme.accent : "#ddd",
            transition: "background 0.4s",
          }} />
        ))}
      </div>

      <div style={{ marginTop: 20, fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#aaa" }}>
        Complete a session to earn <span style={{ color: "#b8860b" }}>🪙 10 coins</span> & grow your farm
      </div>

      <style>{`
        @keyframes fall0 { to { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
        @keyframes fall1 { to { transform: translateY(110vh) rotate(-200deg); opacity: 0; } }
        @keyframes fall2 { to { transform: translateY(110vh) rotate(520deg); opacity: 0; } }
      `}</style>
    </div>
  );
}

function FarmTile({ tile, index, isSelected, onPlace, onHover }) {
  const [hovered, setHovered] = useState(false);

  const getDisplay = () => {
    if (!tile) return null;
    if (tile.type === "crop") {
      const crop = CROPS[tile.id];
      return crop?.stages[Math.min(tile.stage, crop.stages.length - 1)];
    }
    if (tile.type === "animal") {
      const animal = ANIMALS[tile.id];
      return animal?.stages[Math.min(tile.stage, animal.stages.length - 1)];
    }
    if (tile.type === "decor") return tile.icon;
    return null;
  };

  const emoji = getDisplay();
  const isEmpty = !tile;
  const isHarvest = tile?.type === "crop" && CROPS[tile.id] && tile.stage >= CROPS[tile.id].stages.length - 1;
  const isFullGrown = tile?.type === "animal" && ANIMALS[tile.id] && tile.stage >= ANIMALS[tile.id].stages.length - 1;

  return (
    <div
      onClick={() => onPlace(index)}
      onMouseEnter={() => { setHovered(true); onHover && onHover(index); }}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", aspectRatio: "1",
        background: isEmpty
          ? hovered && isSelected
            ? "rgba(90,138,78,0.25)"
            : "#c8a96e22"
          : isHarvest
            ? "rgba(255,200,50,0.18)"
            : isFullGrown
              ? "rgba(100,200,100,0.15)"
              : "rgba(255,255,255,0.12)",
        border: isEmpty && hovered && isSelected
          ? "2px dashed #5a8a4e"
          : isHarvest
            ? "2px solid #f6c90e88"
            : "1.5px solid rgba(139,100,20,0.12)",
        borderRadius: 10,
        cursor: isSelected && isEmpty ? "pointer" : "default",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "clamp(16px, 3vw, 26px)",
        transition: "background 0.2s, transform 0.15s",
        transform: hovered && isSelected && isEmpty ? "scale(1.05)" : "scale(1)",
        position: "relative",
        userSelect: "none",
      }}
    >
      {emoji && (
        <span style={{
          animation: tile?.type === "animal" ? "sway 3s ease-in-out infinite" : tile?.type === "crop" ? "cropSway 4s ease-in-out infinite" : "none",
          display: "block",
        }}>
          {emoji}
        </span>
      )}
      {isHarvest && (
        <div style={{
          position: "absolute", top: -4, right: -4, width: 12, height: 12,
          background: "#f6c90e", borderRadius: "50%", border: "2px solid #fff",
          animation: "pulse 1.5s infinite",
        }} />
      )}
    </div>
  );
}

function FarmScreen({ appState, setAppState }) {
  const { grid, inventory, selectedItem, coins } = appState;
  const [notification, setNotification] = useState(null);

  function handleSelectItem(id, type) {
    setAppState(s => ({ ...s, selectedItem: s.selectedItem?.id === id ? null : { id, type } }));
  }

  function handlePlaceTile(index) {
    if (!selectedItem) return;
    if (grid[index]) return;

    const itemKey = selectedItem.id;
    const inv = appState.inventory;
    if (!inv[itemKey] || inv[itemKey] < 1) {
      showNotif("No more in inventory!");
      return;
    }

    const newGrid = [...grid];
    newGrid[index] = { type: selectedItem.type, id: itemKey, stage: 0, placedAt: Date.now() };

    const newInv = { ...inv, [itemKey]: inv[itemKey] - 1 };
    if (newInv[itemKey] <= 0) delete newInv[itemKey];

    const newAnimals = selectedItem.type === "animal" ? appState.animals + 1 : appState.animals;

    setAppState(s => ({
      ...s, grid: newGrid, inventory: newInv,
      selectedItem: null, animals: newAnimals,
    }));
    showNotif(`${(CROPS[itemKey] || ANIMALS[itemKey])?.name} planted! 🌱`);
  }

  function showNotif(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2200);
  }

  const unlocked = MILESTONES.filter(m => appState.totalSessions >= m.sessions);

  const inventoryItems = Object.entries(inventory).map(([id, qty]) => {
    const crop = CROPS[id];
    const animal = ANIMALS[id];
    return { id, qty, ...(crop || animal), type: crop ? "crop" : "animal" };
  });

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "linear-gradient(160deg, #e8f5e0 0%, #f5efe0 100%)", padding: 20 }}>
      {notification && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          background: "#fff", border: "1.5px solid #5a8a4e", borderRadius: 16,
          padding: "10px 22px", fontFamily: "'Fredoka One', cursive", fontSize: 15,
          color: "#5a8a4e", zIndex: 200, boxShadow: "0 4px 20px #00000022",
          animation: "fadeIn 0.2s ease",
        }}>
          {notification}
        </div>
      )}

      {/* Milestones banner */}
      {unlocked.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {unlocked.map(m => (
            <div key={m.sessions} style={{
              background: "rgba(255,255,255,0.7)", borderRadius: 12,
              padding: "4px 12px", fontSize: 12, fontFamily: "'Nunito', sans-serif",
              color: "#5a8a4e", border: "1px solid #5a8a4e33",
            }}>
              {m.icon} {m.label}
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gap: 4,
        background: "linear-gradient(135deg, #c8a96e44, #a0784022)",
        borderRadius: 20,
        padding: 12,
        border: "2px solid rgba(139,100,20,0.18)",
        boxShadow: "inset 0 2px 12px rgba(139,100,20,0.08), 0 4px 24px rgba(0,0,0,0.06)",
        maxWidth: 480, margin: "0 auto 20px",
      }}>
        {grid.map((tile, i) => (
          <FarmTile
            key={i} tile={tile} index={i}
            isSelected={!!selectedItem}
            onPlace={handlePlaceTile}
          />
        ))}
      </div>

      {/* Inventory */}
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 16, color: "#6b4c1e", marginBottom: 8 }}>
          🎒 Inventory
          {selectedItem && <span style={{ fontSize: 12, color: "#5a8a4e", marginLeft: 8 }}>Tap a tile to place {(CROPS[selectedItem.id] || ANIMALS[selectedItem.id])?.name}</span>}
        </div>
        {inventoryItems.length === 0 ? (
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: "#aaa", padding: "16px 0" }}>
            Your inventory is empty. Visit the Shop! 🛒
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {inventoryItems.map(item => (
              <div key={item.id}
                onClick={() => handleSelectItem(item.id, item.type)}
                style={{
                  background: selectedItem?.id === item.id ? "#5a8a4e" : "#fff",
                  border: selectedItem?.id === item.id ? "2px solid #5a8a4e" : "1.5px solid #ddd",
                  borderRadius: 14, padding: "10px 16px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "'Fredoka One', cursive",
                  color: selectedItem?.id === item.id ? "#fff" : "#444",
                  transition: "all 0.15s",
                  transform: selectedItem?.id === item.id ? "scale(1.04)" : "scale(1)",
                }}
              >
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>×{item.qty}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes sway { 0%,100%{transform:translateX(-2px)} 50%{transform:translateX(2px)} }
        @keyframes cropSway { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translate(-50%,-8px)} to{opacity:1;transform:translate(-50%,0)} }
      `}</style>
    </div>
  );
}

function ShopScreen({ appState, setAppState }) {
  const [tab, setTab] = useState("crops");
  const [bought, setBought] = useState(null);

  function buy(id, price, type) {
    if (appState.coins < price) {
      setBought({ id, success: false });
      setTimeout(() => setBought(null), 1500);
      return;
    }
    setAppState(s => ({
      ...s,
      coins: s.coins - price,
      inventory: { ...s.inventory, [id]: (s.inventory[id] || 0) + 1 },
    }));
    setBought({ id, success: true });
    setTimeout(() => setBought(null), 1200);
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "linear-gradient(160deg, #fef9f0 0%, #f0ece3 100%)", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: "#6b4c1e", margin: 0 }}>🌿 Seed Shop</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", color: "#999", fontSize: 14, margin: "4px 0 0" }}>Spend your coins to grow your farm</p>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
        {["crops", "animals"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? "#5a8a4e" : "#fff",
            color: tab === t ? "#fff" : "#5a8a4e",
            border: "1.5px solid #5a8a4e", borderRadius: 20,
            padding: "8px 22px", fontFamily: "'Fredoka One', cursive",
            fontSize: 15, cursor: "pointer",
          }}>
            {t === "crops" ? "🌱 Seeds" : "🐾 Animals"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, maxWidth: 560, margin: "0 auto" }}>
        {Object.entries(tab === "crops" ? CROPS : ANIMALS).map(([id, item]) => {
          const inInv = appState.inventory[id] || 0;
          const canBuy = appState.coins >= item.price;
          const wasBought = bought?.id === id;
          return (
            <div key={id} style={{
              background: "#fff", borderRadius: 20,
              padding: 20, textAlign: "center",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              border: wasBought ? `2px solid ${bought.success ? "#5a8a4e" : "#e74c3c"}` : "1.5px solid #eee",
              transition: "all 0.2s",
              transform: wasBought ? "scale(1.04)" : "scale(1)",
            }}>
              <div style={{ fontSize: 42 }}>{item.icon}</div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 16, color: "#3a3020", margin: "8px 0 2px" }}>{item.name}</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#aaa", marginBottom: 10 }}>
                In inventory: {inInv}
              </div>
              <button onClick={() => buy(id, item.price, tab === "crops" ? "crop" : "animal")} style={{
                background: canBuy ? "#5a8a4e" : "#ddd",
                color: canBuy ? "#fff" : "#999",
                border: "none", borderRadius: 16,
                padding: "8px 16px",
                fontFamily: "'Fredoka One', cursive", fontSize: 14,
                cursor: canBuy ? "pointer" : "not-allowed",
                width: "100%",
              }}>
                {wasBought && bought.success ? "✓ Added!" : wasBought ? "💸 No coins" : `🪙 ${item.price}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorldMapScreen({ totalSessions }) {
  const worlds = [
    { id: "farm",     name: "Your Farm",         icon: "🏡", unlockAt: 0,  desc: "Where it all begins" },
    { id: "zen",      name: "Zen Garden",         icon: "🎋", unlockAt: 10, desc: "Bamboo, koi & calm" },
    { id: "rice",     name: "Rice Fields",        icon: "🌾", unlockAt: 25, desc: "Japanese countryside" },
    { id: "vineyard", name: "Italian Vineyard",   icon: "🍇", unlockAt: 45, desc: "Grapes & olive trees" },
    { id: "tropical", name: "Tropical Island",    icon: "🏝️", unlockAt: 70, desc: "Coconuts & parrots" },
  ];
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "linear-gradient(160deg, #e0f0ff 0%, #f0ece3 100%)", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: "#2c5f8a", margin: 0 }}>🗺️ World Map</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", color: "#999", fontSize: 14, margin: "4px 0 0" }}>Unlock new worlds through focus</p>
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        {worlds.map((w, i) => {
          const unlocked = totalSessions >= w.unlockAt;
          return (
            <div key={w.id} style={{
              background: unlocked ? "#fff" : "#f5f5f5",
              borderRadius: 20, padding: "18px 22px",
              boxShadow: unlocked ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
              border: unlocked ? "1.5px solid #ddd" : "1.5px dashed #ddd",
              display: "flex", alignItems: "center", gap: 16,
              opacity: unlocked ? 1 : 0.55,
              transition: "all 0.3s",
            }}>
              <div style={{ fontSize: 40, filter: unlocked ? "none" : "grayscale(1)" }}>{w.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 17, color: unlocked ? "#3a3020" : "#aaa" }}>{w.name}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#aaa" }}>{w.desc}</div>
              </div>
              {unlocked ? (
                <div style={{ background: "#5a8a4e22", color: "#5a8a4e", borderRadius: 12, padding: "4px 12px", fontFamily: "'Fredoka One', cursive", fontSize: 13 }}>
                  Unlocked ✓
                </div>
              ) : (
                <div style={{ background: "#f0e8d8", color: "#b8860b", borderRadius: 12, padding: "4px 12px", fontFamily: "'Fredoka One', cursive", fontSize: 12 }}>
                  {w.unlockAt - totalSessions} more sessions
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ maxWidth: 480, margin: "24px auto 0", background: "#fff8ee", borderRadius: 16, padding: 16, border: "1.5px solid #f6c90e44" }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", color: "#b8860b", marginBottom: 6, fontSize: 14 }}>🏅 Milestones</div>
        {MILESTONES.map(m => (
          <div key={m.sessions} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", opacity: totalSessions >= m.sessions ? 1 : 0.4 }}>
            <span style={{ fontSize: 20 }}>{m.icon}</span>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#555" }}>{m.label}</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: totalSessions >= m.sessions ? "#5a8a4e" : "#aaa" }}>
              {totalSessions >= m.sessions ? "✓" : `${m.sessions} sessions`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsScreen({ appState }) {
  const unlocked = ACHIEVEMENTS.filter(a => appState.unlockedAchievements.includes(a.id));
  const locked = ACHIEVEMENTS.filter(a => !appState.unlockedAchievements.includes(a.id));
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "linear-gradient(160deg, #fef9f0 0%, #f0ece3 100%)", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: "#6b4c1e", margin: 0 }}>🏅 Achievements</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", color: "#999", fontSize: 14, margin: "4px 0 0" }}>
          {unlocked.length}/{ACHIEVEMENTS.length} unlocked
        </p>
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {[...unlocked, ...locked].map(a => {
          const isUnlocked = appState.unlockedAchievements.includes(a.id);
          return (
            <div key={a.id} style={{
              background: isUnlocked ? "#fff" : "#f5f5f5",
              borderRadius: 16, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 14,
              border: isUnlocked ? "1.5px solid #f6c90e66" : "1.5px solid #eee",
              opacity: isUnlocked ? 1 : 0.5,
            }}>
              <div style={{ fontSize: 32, filter: isUnlocked ? "none" : "grayscale(1)" }}>{a.icon}</div>
              <div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 15, color: "#3a3020" }}>{a.label}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#aaa" }}>{a.desc}</div>
              </div>
              {isUnlocked && <div style={{ marginLeft: "auto", color: "#f6c90e", fontSize: 20 }}>⭐</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavigationBar({ activeTab, setActiveTab, coins, coinPulse }) {
  const tabs = [
    { id: "timer", icon: "⏱", label: "Focus" },
    { id: "farm",  icon: "🌾", label: "Farm" },
    { id: "shop",  icon: "🛒", label: "Shop" },
    { id: "world", icon: "🗺️", label: "World" },
    { id: "awards",icon: "🏅", label: "Awards" },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(255,252,245,0.96)",
      borderTop: "1.5px solid rgba(139,100,20,0.12)",
      backdropFilter: "blur(12px)",
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
      zIndex: 100,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          padding: "4px 12px",
          color: activeTab === t.id ? "#5a8a4e" : "#aaa",
          transition: "color 0.2s, transform 0.1s",
          transform: activeTab === t.id ? "scale(1.12)" : "scale(1)",
        }}>
          <span style={{ fontSize: 22 }}>{t.icon}</span>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 11 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

function TopBar({ coins, coinPulse, streak, totalSessions }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(255,252,245,0.95)", backdropFilter: "blur(12px)",
      borderBottom: "1.5px solid rgba(139,100,20,0.10)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 20px",
    }}>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: "#5a8a4e" }}>
        🌿 FocusFarm
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 13, color: "#888" }}>
          🔥 {streak}
        </div>
        <CoinDisplay coins={coins} pulse={coinPulse} />
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useLocalStorage("focusfarm_v1", defaultState());
  const [activeTab, setActiveTab] = useState("timer");
  const [coinPulse, setCoinPulse] = useState(false);

  // Check daily streak
  useEffect(() => {
    const today = new Date().toDateString();
    if (appState.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = appState.lastActiveDate === yesterday ? appState.streak : 1;
      setAppState(s => ({ ...s, streak: newStreak, lastActiveDate: today, todaySessions: 0 }));
    }
  }, []);

  function handleSessionComplete(count) {
    setAppState(s => {
      const newTotal = s.totalSessions + 1;
      const newToday = s.todaySessions + 1;

      // Coin bonuses
      let earned = COINS_PER_SESSION;
      if (count % 4 === 0) earned += 25;
      if (s.streak > 0 && newToday === 1) earned += 10; // first session of day bonus

      // Advance grid growth
      const newGrid = s.grid.map(tile => {
        if (!tile) return null;
        const maxStage = tile.type === "crop"
          ? (CROPS[tile.id]?.stages.length ?? 4) - 1
          : tile.type === "animal"
            ? (ANIMALS[tile.id]?.stages.length ?? 2) - 1
            : 0;
        if (tile.stage < maxStage) return { ...tile, stage: tile.stage + 1 };
        return tile;
      });

      // Count harvests
      const newHarvests = newGrid.reduce((acc, tile) => {
        if (!tile || tile.type !== "crop") return acc;
        const max = (CROPS[tile.id]?.stages.length ?? 4) - 1;
        return tile.stage === max ? acc + 1 : acc;
      }, 0);

      // Check achievements
      const newState = {
        ...s,
        coins: s.coins + earned,
        totalSessions: newTotal,
        todaySessions: newToday,
        grid: newGrid,
        harvests: newHarvests,
      };
      const newUnlocked = ACHIEVEMENTS
        .filter(a => !s.unlockedAchievements.includes(a.id) && a.condition(newState))
        .map(a => a.id);
      if (newUnlocked.length) newState.unlockedAchievements = [...s.unlockedAchievements, ...newUnlocked];

      return newState;
    });

    setCoinPulse(true);
    setTimeout(() => setCoinPulse(false), 600);
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{ paddingTop: 60, paddingBottom: 70 }}>
        <TopBar
          coins={appState.coins}
          coinPulse={coinPulse}
          streak={appState.streak}
          totalSessions={appState.totalSessions}
        />

        {activeTab === "timer" && (
          <TimerScreen
            appState={appState}
            setAppState={setAppState}
            onSessionComplete={handleSessionComplete}
          />
        )}
        {activeTab === "farm" && (
          <FarmScreen appState={appState} setAppState={setAppState} />
        )}
        {activeTab === "shop" && (
          <ShopScreen appState={appState} setAppState={setAppState} />
        )}
        {activeTab === "world" && (
          <WorldMapScreen totalSessions={appState.totalSessions} />
        )}
        {activeTab === "awards" && (
          <AchievementsScreen appState={appState} />
        )}

        <NavigationBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          coins={appState.coins}
          coinPulse={coinPulse}
        />
      </div>
    </>
  );
}
