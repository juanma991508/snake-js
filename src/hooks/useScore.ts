export type Score = { name: string; score: number; date: string };
const KEY = 'snake:scores';

const readScores = (): Score[] => {
    try {
        const data = localStorage.getItem(KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const saveScore = (newScore: Score): void => {
    const arr = readScores();
    arr.push(newScore);
    arr.sort((a, b) => b.score - a.score);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 50)));
};

const clearScores = (): void => {
    localStorage.removeItem(KEY);
};

export const useScore = () => {

    return {
        getScores: readScores,
        addScore: saveScore,
        clearScores
    }
};