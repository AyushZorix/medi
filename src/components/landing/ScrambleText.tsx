import { useCallback, useRef, useState, useEffect } from "react";

import { cn } from "@/lib/utils";

const CHARS = "!%#?*+-$=<>";

type ScrambleTextProps = {
  children: string;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  trigger?: boolean;
};

export function ScrambleText({ children, className, as: Tag = "span", trigger }: ScrambleTextProps) {
  const [display, setDisplay] = useState(children);
  const frameRef = useRef(0);
  const widthRef = useRef<number | null>(null);
  const elRef = useRef<HTMLElement | null>(null);

  const scramble = useCallback(() => {
    if (widthRef.current === null && elRef.current) {
      widthRef.current = elRef.current.offsetWidth;
      elRef.current.style.width = `${widthRef.current}px`;
    }
    cancelAnimationFrame(frameRef.current);
    const target = children;
    let frame = 0;
    const total = 28;

    const tick = () => {
      frame++;
      const progress = frame / total;
      const revealed = Math.floor(progress * target.length);
      let out = "";
      for (let i = 0; i < target.length; i++) {
        if (i < revealed) out += target[i];
        else out += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      setDisplay(out);
      if (frame < total) frameRef.current = requestAnimationFrame(tick);
      else setDisplay(target);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [children]);

  const reset = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    setDisplay(children);
    if (elRef.current) elRef.current.style.width = "";
    widthRef.current = null;
  }, [children]);

  useEffect(() => {
    if (trigger !== undefined) {
      if (trigger) {
        scramble();
      } else {
        reset();
      }
    }
  }, [trigger, scramble, reset]);

  return (
    <Tag
      ref={elRef as never}
      className={cn("inline-block hover-scramble-text", className)}
      onMouseEnter={scramble}
      onMouseLeave={reset}
    >
      {display}
    </Tag>
  );
}
