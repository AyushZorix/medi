import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { soundManager } from "./SoundManager";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorText, setCursorText] = useState("VISAIQ • EXPLORE • ");
  const [isHovered, setIsHovered] = useState(false);
  const [isClickable, setIsClickable] = useState(false);

  // Mouse Coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Eased Spring Coordinates for the Outer Ring
  const springConfig = { damping: 40, stiffness: 250, mass: 0.5 };
  const ringX = useSpring(mouseX, springConfig);
  const ringY = useSpring(mouseY, springConfig);

  // Eased Spring Coordinates for the Inner Dot (must be defined top-level to satisfy Rules of Hooks)
  const dotX = useSpring(mouseX, { damping: 15, stiffness: 400 });
  const dotY = useSpring(mouseY, { damping: 15, stiffness: 400 });

  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable custom cursor on touch screens
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 40); // Offset by half of width (80px / 2)
      mouseY.set(e.clientY - 40);
    };

    const handlePointerOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Check if target or parent has custom cursor text
      const hoverEl = target.closest("[data-cursor-text]");
      if (hoverEl) {
        const text = hoverEl.getAttribute("data-cursor-text") || "";
        setCursorText(text.toUpperCase() + " • ");
        setIsHovered(true);
        // Play hover tick sound
        soundManager.playHover();
        return;
      }

      // Check if target is a link/button/clickable
      const clickableEl = target.closest("a, button, [role='button'], .landing-card");
      if (clickableEl) {
        setIsClickable(true);
        soundManager.playHover();
      } else {
        setIsHovered(false);
        setIsClickable(false);
        setCursorText("VISAIQ • EXPLORE • ");
      }
    };

    const handleMouseDown = () => {
      soundManager.playClick();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("pointerover", handlePointerOver, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("pointerover", handlePointerOver);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [mouseX, mouseY]);

  if (!isVisible) return null;

  // Outer circle scale animation states
  const outerScale = isHovered ? 1.4 : isClickable ? 1.1 : 0.8;
  const opacity = isHovered || isClickable ? 1 : 0.45;

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed inset-0 z-50 mix-blend-screen overflow-hidden"
    >
      {/* Outer Eased Circle with Circular Text */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          width: 80,
          height: 80,
        }}
        animate={{
          scale: outerScale,
          opacity: opacity,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative flex items-center justify-center rounded-full border border-white/10 bg-black/10 backdrop-blur-[1px]"
      >
        {/* SVG TextPath for rotating label */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <defs>
            <path
              id="cursorCirclePath"
              d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
            />
          </defs>
          <text className="text-[7.5px] font-mono tracking-[0.1em] fill-white/80 uppercase">
            <textPath href="#cursorCirclePath" startOffset="0%">
              {cursorText}
              {cursorText}
              {cursorText}
            </textPath>
          </text>
        </motion.svg>

        {/* Outer subtle glow indicator */}
        <div className="absolute inset-2 rounded-full border border-[var(--landing-accent)]/20 animate-pulse" />
      </motion.div>

      {/* Inner Dot locked directly to pointer */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-[var(--landing-accent)] shadow-[0_0_8px_rgba(200,230,80,0.8)]"
        style={{
          x: dotX,
          y: dotY,
          left: 36, // Centered inside 80px outer box (80-8)/2
          top: 36,
        }}
        animate={{
          scale: isHovered ? 0.5 : isClickable ? 1.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      />
    </div>
  );
}
