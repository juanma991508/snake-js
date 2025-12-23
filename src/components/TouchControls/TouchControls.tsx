import { useEffect, useRef } from "react";
import type { Direction } from "..";

const emitDirection = (direction: Direction) => {
    window.dispatchEvent(new CustomEvent('snake:direction', { detail: direction }));
}

const TouchControls = () => {
      const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const onTouchStart = (e: TouchEvent) => {
            const t = e.touches[0];
            touchStartRef.current = { x: t.clientX, y: t.clientY };
        };

        const onTouchEnd = (e: TouchEvent) => {
            const s = touchStartRef.current;
            if (!s) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - s.x;
            const dy = t.clientY - s.y;
            const absX = Math.abs(dx), absY = Math.abs(dy);
            const threshold = 30; // px
            if (absX < threshold && absY < threshold) return;
            if (absX > absY) {
                emitDirection(dx > 0 ? "right" : "left");
            } else {
                emitDirection(dy > 0 ? "down" : "up");
            }
            touchStartRef.current = null;
        };
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchend", onTouchEnd);
        return () => {
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchend", onTouchEnd);
        };
    }, []);

    return (
        <div style={containerStyle} aria-hidden="false">
            <div style={dpadStyle}>
                <button style={btnStyle} onTouchStart={() => emitDirection("up")} onClick={() => emitDirection("up")}>▲</button>
                <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                    <button style={btnStyle} onTouchStart={() => emitDirection("left")} onClick={() => emitDirection("left")}>◄</button>
                    <button style={btnStyle} onTouchStart={() => emitDirection("right")} onClick={() => emitDirection("right")}>►</button>
                </div>
                <button style={btnStyle} onTouchStart={() => emitDirection("down")} onClick={() => emitDirection("down")}>▼</button>
            </div>
        </div>
    )
}

export default TouchControls;

const containerStyle: React.CSSProperties = {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 60,
    touchAction: "none", // prevent browser gestures from interfering
};

const dpadStyle: React.CSSProperties = {
    display: "grid",
    gap: 8,
    justifyItems: "center",
    alignItems: "center",
};

const btnStyle: React.CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: 12,
    fontSize: 18,
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
    touchAction: "none",
};