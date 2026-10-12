import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

const PIXEL_DATABASE = [
  "0011100",
  "0111110",
  "1100011",
  "1100011",
  "1111111",
  "1100011",
  "1100011",
  "1111111",
  "1100011",
  "0111110",
];

export default function SpaceBackdrop() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="space-backdrop" aria-hidden="true">
      <div className="space-orbit">
        <span className="space-orbit-core" />
      </div>
      <div className="pixel-database">
        <LazyMotion features={domAnimation}>
          <div className="pixel-database-grid">
            {PIXEL_DATABASE.flatMap((row, rowIndex) =>
              [...row].map((pixel, columnIndex) => {
                const index = rowIndex * PIXEL_DATABASE[0].length + columnIndex;

                return pixel === "1" ? (
                  <m.span
                    className="pixel-database-cell"
                    key={`${rowIndex}-${columnIndex}`}
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : { opacity: [0.45, 1, 0.45], scale: [0.92, 1, 0.92] }
                    }
                    transition={{
                      duration: 2.8,
                      delay: (index % 9) * 0.09,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ) : (
                  <span
                    className="pixel-database-cell is-empty"
                    key={`${rowIndex}-${columnIndex}`}
                  />
                );
              }),
            )}
          </div>
        </LazyMotion>
        <span className="pixel-database-caption">PERIGEE / SIGNAL ARRAY</span>
        <span className="pixel-database-readout">720 READINGS · 7 CHANNELS</span>
      </div>
    </div>
  );
}
