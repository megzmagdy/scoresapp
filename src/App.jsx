import { useState, useRef } from "react";
import logo from "./assets/logo.png";


const initialPlayers = [
  { id: 1, name: "Behery", score: 2000 },
  { id: 2, name: "Eyad", score: 2000 },
  { id: 3, name: "Seif", score: 1550 },
  { id: 4, name: "Deep", score: 1500 },
  { id: 5, name: "Karim", score: 1250 },
  { id: 6, name: "Kimo", score: 1000 },
  { id: 7, name: "Alfy", score: 1000 },
  { id: 8, name: "Mohsena", score: 1000 },
  { id: 9, name: "Hamdy", score: 1000 },
  { id: 10, name: "Khamisy", score: 1000 },
  { id: 11, name: "Rahim", score: 1000 },
  { id: 12, name: "Body", score: 800 },
  { id: 13, name: "Y Ashraf", score: 800 },
  { id: 14, name: "M Masry", score: 800 },
  { id: 15, name: "Amir", score: 750 },
  { id: 16, name: "Karim K", score: 750 },
  { id: 17, name: "Amr Yasser", score: 750 },
  { id: 18, name: "Mozen", score: 750 },
  { id: 19, name: "Adham", score: 650 },
  { id: 20, name: "M. Emam", score: 650 },
  { id: 21, name: "Gizawy", score: 650 },
  { id: 22, name: "Sasaya", score: 550 },
  { id: 23, name: "Megahed", score: 550 },
  { id: 24, name: "Yehya", score: 500 },
  { id: 25, name: "Shady", score: 500 },
  { id: 26, name: "Hisham", score: 500 },
  { id: 27, name: "Mamdoh", score: 500 },
  { id: 28, name: "Aziz", score: 500 },
  { id: 29, name: "Agamy", score: 500 },
  { id: 30, name: "A Hamam", score: 500 },
  { id: 31, name: "Yasser", score: 500 },
  { id: 32, name: "Sonic", score: 500 },
  { id: 33, name: "Dida", score: 350 },
  { id: 34, name: "Selim", score: 250 },
  { id: 35, name: "Shabory", score: 250 },
  { id: 36, name: "Bondok", score: 200 },
  { id: 37, name: "Hassan", score: 150 },
  { id: 38, name: "Eyad F", score: 150 },
  { id: 39, name: "Pato", score: 150 },
  { id: 40, name: "Omar Hany", score: 150 },
  { id: 41, name: "Adham Shedid", score: 100 },
  { id: 42, name: "A. Abdely", score: 100 },
  { id: 43, name: "Amar", score: 50 },
  { id: 44, name: "Sa3ed", score: 50 },
  { id: 45, name: "Sama", score: 50 },
  { id: 46, name: "Malak", score: 50 },
  { id: 47, name: "Nada Karim", score: 50 },
  { id: 48, name: "M. Samy", score: 50 },
  { id: 49, name: "Ali Emam", score: 50 },
  { id: 50, name: "Eyad Farid", score: 50 },
  { id: 51, name: "Yosef Sabry", score: 50 },
  { id: 52, name: "M Hisham", score: 50 },
  { id: 53, name: "Saif", score: 50 },
  { id: 54, name: "Karim Farhat", score: 50 },
  { id: 55, name: "Y. Ragab", score: 25 },
  { id: 56, name: "Basel", score: 25 },
  { id: 57, name: "Hossin", score: 25 },
  { id: 58, name: "A. Fathy", score: 25 },
  { id: 59, name: "A. Khalid", score: 25 },
  { id: 60, name: "Omar Baz", score: 25 },
  { id: 61, name: "M. Khaled", score: 25 },
  { id: 62, name: "M. Hisham", score: 25 },
];

const COLORS = {
  primary: "#93c834",
  black: "#000000",
  dark: "#181818",
  soft: "#222222",
  border: "#2e2e2e",
  text: "#e5e5e5",
  muted: "#777",
};

const maxScore = Math.max(...initialPlayers.map((p) => p.score));

const TIERS = [
  { label: "LEGEND", min: Math.floor(maxScore * 0.75), color: "#FFD700" },
  { label: "ELITE", min: Math.floor(maxScore * 0.5), color: "#C0C0C0" },
  { label: "PRO", min: Math.floor(maxScore * 0.25), color: "#CD7F32" },
  { label: "ROOKIE", min: 0, color: "#5eead4" },
];
const getTier = (s) => TIERS.find((t) => s >= t.min) || TIERS[3];

const AVATAR_COLORS = [
  // "#f87171",
  // "#fb923c",
  // "#facc15",
  "#4ade80",
  // "#34d399",
  // "#22d3ee",
  "#60a5fa",
  // "#a78bfa",
  // "#f472b6",
  // "#e879f9",
];
const getAC = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];
const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function App() {
  const [players, setPlayers] = useState(initialPlayers);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [flash, setFlash] = useState({});
  const [addName, setAddName] = useState("");
  const [addScore, setAddScore] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filterTier, setFilterTier] = useState("ALL");

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const getRank = (id) => sorted.findIndex((p) => p.id === id) + 1;

  const displayed = sorted.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchTier =
      filterTier === "ALL" || getTier(p.score).label === filterTier;
    return matchSearch && matchTier;
  });

  function updateScore(id, val) {
    const num = parseInt(val);
    if (isNaN(num) || num < 0) {
      setEditing(null);
      return;
    }
    const old = players.find((p) => p.id === id)?.score;
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, score: num } : p))
    );
    const dir = num > old ? "up" : num < old ? "down" : null;
    if (dir) {
      setFlash((f) => ({ ...f, [id]: dir }));
      setTimeout(() => setFlash((f) => ({ ...f, [id]: null })), 1400);
    }
    setEditing(null);
  }

  function addPlayer() {
    if (!addName.trim()) return;
    const id = Date.now();
    setPlayers((prev) => [
      ...prev,
      { id, name: addName.trim(), score: parseInt(addScore) || 0 },
    ]);
    setAddName("");
    setAddScore("");
    setShowAdd(false);
    setFlash((f) => ({ ...f, [id]: "new" }));
    setTimeout(() => setFlash((f) => ({ ...f, [id]: null })), 1500);
  }

  const top3 = sorted.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(90deg, #020617 10%, #1e293b 60%, #93c834 140%)",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
        color: COLORS.text,
        paddingBottom: 60,
      }}
      // style={{
      //   minHeight: "100vh",
      //   background: COLORS.dark,
      //   fontFamily: "'Segoe UI',system-ui,sans-serif",
      //   color: COLORS.text,
      //   paddingBottom: 60,
      // }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 16px 20px" }}>
        <img
          src={logo}
          alt="Logo"
          style={{
            width: 90,
            marginBottom: 12,
          }}
        />

        <div
          style={{
            fontSize: 14,
            letterSpacing: "0.35em",
            color: "#93c834",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          SEASON RANKINGS
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2rem,6vw,3rem)",
            fontWeight: 700,
            color: "#93c834",
          }}
        >
          LEADERBOARD
        </h1>
      </div>

      {/* Podium */}
      <div
        style={{
          maxWidth: 460,
          margin: "0 auto",
          padding: "0 16px 32px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 10,
        }}
      >
        {[top3[1], top3[0], top3[2]].map((p, i) => {
          if (!p) return <div key={i} style={{ flex: 1 }} />;
          const isCenter = i === 1;
          const rankIdx = i === 1 ? 0 : i === 0 ? 1 : 2;
          const heights = [138, 100, 82];
          const avatarSizes = [62, 48, 42];
          return (
            <div
              key={p.id}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              {rankIdx === 0 && <div style={{ fontSize: 30 }}>👑</div>}
              <div
                style={{
                  width: avatarSizes[rankIdx],
                  height: avatarSizes[rankIdx],
                  borderRadius: "50%",
                  background: getAC(p.id),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: avatarSizes[rankIdx] * 0.50,
                  color: "#000",
                  border: `0px solid ${medalColors[rankIdx]}`,
                  boxShadow: `0 0 18px ${medalColors[rankIdx]}60`,
                }}
              >
                {p.name[0].toUpperCase()}
              </div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 14,
                  textAlign: "center",
                  color: "#ffffff",
                  maxWidth: 80,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  color: medalColors[rankIdx],
                }}
              >
                {p.score.toLocaleString()}
              </div>

                {/* #1,#2,#3 */}
              <div
                style={{
                  width: "100%",
                  height: heights[rankIdx],
                  borderRadius: "20px 4px 20px 4px",
                  background: `linear-gradient(200deg,${medalColors[rankIdx]}70,${medalColors[rankIdx]}0a)`,
                  border: `2px solid ${medalColors[rankIdx]}90`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 900,
                  color: medalColors[rankIdx],
                }}
              >
                #{rankIdx + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 14px 16px" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 140,
              background: "#0c1726",
              border: "1px solid #1e3a5f",
              borderRadius: 13,
              padding: "9px 14px",
              color: "#e2e8f0",
              fontSize: 14,
              outline: "none",
            }}
          />
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            style={{
              background: "#0c1726",
              border: "1px solid #1e3a5f",
              borderRadius: 10,
              color: "#e2e8f0",
              padding: "9px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Tiers</option>
            {TIERS.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
          {/* <button
            onClick={() => setShowAdd((v) => !v)}
            style={{
              background: showAdd ? "#22d3ee22" : "#0c1726",
              border: `1px solid ${showAdd ? "#22d3ee" : "#1e3a5f"}`,
              borderRadius: 10,
              color: showAdd ? "#22d3ee" : "#94a3b8",
              padding: "10px 18px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            Add New Player
          </button> */}

          {/* Add player button */}
        </div>

        {showAdd && (
          <div
            style={{
              background: "#0c1726",
              border: "1px solid #22d3ee33",
              borderRadius: 50,
              padding: 14,
              marginBottom: 12,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <input
              placeholder="Name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              style={{
                flex: 2,
                minWidth: 110,
                background: "#030810",
                border: "1px solid #1e3a5f",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#e2e8f0",
                fontSize: 13,
                outline: "none",
              }}
            />
            <input
              placeholder="Score"
              value={addScore}
              onChange={(e) => setAddScore(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              type="number"
              style={{
                flex: 1,
                minWidth: 70,
                background: "#030810",
                border: "1px solid #1e3a5f",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#e2e8f0",
                fontSize: 13,
                outline: "none",
              }}
            />
            {/* <button
              onClick={addPlayer}
              style={{
                background: "linear-gradient(135deg,#22d3ee,#06b6d4)",
                border: "none",
                borderRadius: 8,
                color: "#000",
                padding: "8px 18px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Add
            </button> */}
          </div>
        )}

        {/* Tier filter pills */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {["ALL", ...TIERS.map((t) => t.label)].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTier(t)}
              style={{
                background: filterTier === t ? "#22d3ee22" : "transparent",
                border: `1px solid ${filterTier === t ? "#5f9ca5" : "rgb(138, 138, 138)"}`,
                borderRadius: 50,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 500,
                color: filterTier === t ? "#22d3ee" : "#ffffff",
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              {t}
            </button>
          ))}
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: "#ffffff",
              alignSelf: "center",
            }}
          >
            {displayed.length} players
          </span>
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {displayed.map((player) => {
            const rank = getRank(player.id);
            const tier = getTier(player.score);
            const isUp = flash[player.id] === "up";
            const isDown = flash[player.id] === "down";
            const isNew = flash[player.id] === "new";
            const isEd = editing?.id === player.id;
            const bdr =
              rank === 1
                ? "#FFD70044"
                : rank === 2
                ? "#C0C0C033"
                : rank === 3
                ? "#CD7F3233"
                : isUp
                ? "#22d3ee44"
                : isDown
                ? "#f8717144"
                : "#1e293b";

            return (
              <div
                key={player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,

                  background: isNew
                    ? "#4ade8009"
                    : rank <= 3
                    ? `linear-gradient(90deg,${
                        medalColors[rank - 1]
                      }0d,#0a1628)`
                    : "#0a1628",

                  border: `1px solid ${bdr}`,
                  borderRadius: 25,
                  padding: "8px 12px",
                  transition: "all 0.35s",
                }}
              >
                <div
                  style={{
                    width: 30,
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: rank <= 3 ? 15 : 13,
                    color: rank <= 3 ? medalColors[rank - 1] : "#334155",
                    flexShrink: 0,
                  }}
                >
                  {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
                </div>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: getAC(player.id),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#000",
                    flexShrink: 0,
                  }}
                >
                  {player.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {player.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: tier.color,
                      opacity: 0.6,
                    }}
                  >
                    {tier.label}
                  </div>
                </div>
                {isEd ? (
                  <input
                    autoFocus
                    type="number"
                    defaultValue={player.score}
                    // readOnly
                    // onBlur={(e) => updateScore(player.id, e.target.value)}
                    // onKeyDown={(e) => {
                    //   if (e.key === "Enter")
                    //     updateScore(player.id, e.target.value);
                    //   if (e.key === "Escape") setEditing(null);
                    // }}
                    // style={{
                    //   width: 85,
                    //   background: "#020d1a",
                    //   border: "1px solid #22d3ee",
                    //   borderRadius: 7,
                    //   color: "#22d3ee",
                    //   fontSize: 14,
                    //   fontWeight: 700,
                    //   textAlign: "right",
                    //   padding: "3px 9px",
                    //   outline: "none",
                    // }}
                  />
                ) : (
                  <div
                    // onClick={() => setEditing({ id: player.id })}
                    //title="Click to edit"
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: isUp ? "#4ade80" : isDown ? "#f87171" : tier.color,
                      cursor: "pointer",
                      textAlign: "right",
                      minWidth: 65,
                      // padding: "3px 0",
                      // borderBottom: "1px dashed transparent",
                      // transition: "all 0.35s",
                    }}
                    // onMouseEnter={(e) =>
                    //   (e.currentTarget.style.borderBottomColor = "#ffffff33")
                    // }
                    // onMouseLeave={(e) =>
                    //   (e.currentTarget.style.borderBottomColor = "transparent")
                    // }
                  >
                    {/* {isUp && (
                      <span style={{ fontSize: 10, marginRight: 2 }}>▲</span>
                    )}
                    {isDown && (
                      <span style={{ fontSize: 10, marginRight: 2 }}>▼</span>
                    )} */}
                    {player.score.toLocaleString()}
                    <span
                      style={{ fontSize: 10, color: "#475569", marginLeft: 2 }}
                    >
                      pts
                    </span>
                  </div>
                )}
                {/* <button
                  onClick={() =>
                    setPlayers((p) => p.filter((x) => x.id !== player.id))
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: "#1e293b",
                    cursor: "pointer",
                    fontSize: 16,
                    padding: "1px 4px",
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#f87171")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#1e293b")
                  }
                >
                  ×
                </button> */}
              </div>
            );
          })}
        </div>

        {displayed.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#334155",
              padding: "40px 0",
              fontSize: 14,
            }}
          >
            No players found
          </div>
        )}

        {/* Tier Legend */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 28,
            padding: "14px",
            background: "#0a1628",
            borderRadius: 10,
            border: "1px solid #1e293b",
          }}
        >
          {TIERS.map((t) => (
            <div
              key={t.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: t.color,
                }}
              />

              <span style={{ color: t.color, fontWeight: 700 }}>{t.label}</span>
              <span style={{ color: "#334155", fontSize: 12 }}>
                {Math.round((t.min / maxScore) * 100)}%+
              </span>
            </div>
          ))}
        </div>
        {/* <div
          style={{
            textAlign: "center",
            color: "#334155",
            fontSize: 11,
            marginTop: 10,
          }}
        >
          Click any score to edit • + to add a player • × to remove
        </div> */}
      </div>
    </div>
  );
}
