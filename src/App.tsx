import React, { useState } from "react";
import StartMenu from "./components/StartMenu/StartMenu";
import HighScores from "./components/HighScores/HighScores";
import GameCanvas from "./components/GameCanvas/GameCanvas";
import { useScore } from "./hooks";
import TouchControls from "./components/TouchControls/TouchControls";

export default function App() {
  const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  const { addScore } = useScore();
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("snake:username"));
  const [view, setView] = useState<"menu"|"game"|"scores">("menu");

  const start = (name: string) => { setUsername(name); setView("game"); };
  const onGameOver = (score: number) => {
    if (username) addScore({ name: username, score, date: new Date().toISOString() });
    setView("scores");
  };

  if (view === "menu") return <StartMenu onStart={start} onShowScores={() => setView("scores")} />;
  if (view === "scores") return <HighScores onClose={() => setView("menu")} />;
  return (<><GameCanvas onGameOver={onGameOver} />
    {isTouchDevice && <TouchControls />}</>);
}