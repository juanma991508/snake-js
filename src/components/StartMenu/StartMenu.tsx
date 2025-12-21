import React, { useState } from "react";
import type { StartMenuProps } from ".";
import styles from "./StartMenu.module.css";


const StartMenu = ({ onStart, onShowScores }: StartMenuProps) => {
 const [name, setName] = useState<string>(() => {
    try {
      return localStorage.getItem("snake:username") || "";
    } catch {
      return "";
    }
  });

  const handleStart = () => {
    const user = name.trim() || "Anon";
    localStorage.setItem("snake:username", user);
    onStart(user);
  };
      return (
    <div className={styles.root}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.panel}>
        <h1 className={styles.title}>Snake</h1>
        <input
          className={styles.input}
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className={styles.controls}>
          <button onClick={handleStart}>Iniciar</button>
          <button onClick={onShowScores}>Puntuaciones</button>
        </div>
      </div>
    </div>
  );
}

export default StartMenu;