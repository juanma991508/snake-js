import type { HighScoresProps } from ".";
import { useScore, type Score } from "../../hooks/useScore";

const HighScores: React.FC<HighScoresProps> = ({ onClose }) => {
  const { getScores } = useScore();
  const scores = getScores();
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(scores, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "snake-scores.json"; a.click(); URL.revokeObjectURL(url);
  };

    return (
    <div style={{ padding: 24 }}>
      <h2>Puntuaciones</h2>
      {scores.length === 0 ? <p>No hay puntuaciones aún.</p> : (
        <ol>
          {scores.map((s: Score, i) => (
            <li key={i}>
              <strong>{s.name}</strong> — {s.score} — {new Date(s.date).toLocaleString()}
            </li>
          ))}
        </ol>
      )}
      <div style={{ marginTop: 12 }}>
        <button onClick={onClose}>Volver</button>
        <button onClick={exportJson} style={{ marginLeft: 8 }}>Exportar</button>
      </div>
    </div>
  );
}

export default HighScores;