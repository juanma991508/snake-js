export type GameCanvasProps = {
  onGameOver?: (score: number) => void;
};

export type Point = {
    x: number;
    y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';