import { useEffect, useMemo, useState } from "react";
import {
    AnimatePresence,
    motion,
} from "framer-motion";
import {
    Trophy,
    Sparkles,
} from "lucide-react";

const COLORS = [
    "#FF3D68",
    "#00E5FF",
    "#39FF88",
    "#FFD23F",
    "#B24BFF",
    "#FF9346",
    "#FFFFFF",
];

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function createFireworkBurst(id) {
    const originX = randomBetween(10, 90);
    const originY = randomBetween(12, 52);

    const particleCount = Math.floor(
        randomBetween(20, 34)
    );

    const particles = Array.from(
        { length: particleCount },
        (_, index) => {
            const angle =
                (Math.PI * 2 * index) /
                particleCount +
                randomBetween(-0.08, 0.08);

            const distance = randomBetween(
                70,
                180
            );

            return {
                id: `${id}-${index}`,
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                size: randomBetween(3, 7),
                rotate: randomBetween(
                    -360,
                    360
                ),
                color:
                    COLORS[
                    Math.floor(
                        Math.random() *
                        COLORS.length
                    )
                    ],
            };
        }
    );

    return {
        id,
        originX,
        originY,
        particles,
    };
}

function FireworkBurst({ burst }) {
    return (
        <div
            className="pointer-events-none fixed z-20"
            style={{
                left: `${burst.originX}%`,
                top: `${burst.originY}%`,
            }}
        >
            {/* Bright explosion flash */}
            <motion.div
                initial={{
                    opacity: 0,
                    scale: 0,
                }}
                animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 0.8, 1.7],
                }}
                transition={{
                    duration: 0.45,
                    ease: "easeOut",
                }}
                className="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-white blur-md"
            />

            {/* Explosion ring */}
            <motion.div
                initial={{
                    opacity: 0.8,
                    scale: 0,
                }}
                animate={{
                    opacity: 0,
                    scale: 1.8,
                }}
                transition={{
                    duration: 0.7,
                    ease: "easeOut",
                }}
                className="absolute -left-4 -top-4 h-8 w-8 rounded-full border-2 border-white/80"
            />

            {/* Sparks */}
            {burst.particles.map(
                (particle) => (
                    <motion.span
                        key={particle.id}
                        initial={{
                            opacity: 0,
                            x: 0,
                            y: 0,
                            scale: 0,
                            rotate: 0,
                        }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            x: particle.x,
                            y: particle.y,
                            scale: [
                                0,
                                1.2,
                                0.9,
                                0,
                            ],
                            rotate:
                                particle.rotate,
                        }}
                        transition={{
                            duration:
                                randomBetween(
                                    0.9,
                                    1.5
                                ),
                            ease: "easeOut",
                        }}
                        style={{
                            width: particle.size,
                            height: particle.size,
                            backgroundColor:
                                particle.color,
                        }}
                        className="absolute rounded-full shadow-[0_0_8px_currentColor]"
                    />
                )
            )}
        </div>
    );
}

// Fireworks pop continuously for as long as the modal stays open.
function Fireworks() {
    const [bursts, setBursts] = useState(
        () => [
            createFireworkBurst("initial-1"),
            createFireworkBurst("initial-2"),
            createFireworkBurst("initial-3"),
        ]
    );

    useEffect(() => {
        let cancelled = false;
        let timeoutId;

        function launchNext() {
            if (cancelled) {
                return;
            }

            setBursts((current) => [
                ...current.slice(-5),
                createFireworkBurst(
                    `burst-${Date.now()}-${Math.random()}`
                ),
            ]);

            timeoutId = window.setTimeout(
                launchNext,
                randomBetween(550, 950)
            );
        }

        timeoutId = window.setTimeout(
            launchNext,
            400
        );

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
            <AnimatePresence>
                {bursts.map((burst) => (
                    <FireworkBurst
                        key={burst.id}
                        burst={burst}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

// Falls continuously in a celebratory loop (mixed circles + ribbons
// for a less uniform, more natural look).
function FallingConfetti() {
    const pieces = useMemo(
        () =>
            Array.from(
                { length: 60 },
                (_, index) => ({
                    id: index,
                    left:
                        Math.random() * 100,
                    delay:
                        Math.random() * 1.4,
                    duration:
                        3.2 +
                        Math.random() * 2.6,
                    drift:
                        Math.random() * 140 -
                        70,
                    rotate:
                        Math.random() * 720,
                    shape:
                        Math.random() > 0.5
                            ? "circle"
                            : "bar",
                    opacity:
                        0.7 +
                        Math.random() * 0.3,
                    color:
                        COLORS[
                        index %
                        COLORS.length
                        ],
                })
            ),
        []
    );

    return (
        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
            {pieces.map((piece) => (
                <motion.span
                    key={piece.id}
                    initial={{
                        y: "-10vh",
                        opacity: 0,
                        rotate: 0,
                    }}
                    animate={{
                        y: "115vh",
                        x: piece.drift,
                        opacity: [
                            0,
                            piece.opacity,
                            piece.opacity,
                            0,
                        ],
                        rotate: piece.rotate,
                    }}
                    transition={{
                        duration:
                            piece.duration,
                        delay: piece.delay,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        left: `${piece.left}%`,
                        backgroundColor:
                            piece.color,
                    }}
                    className={
                        piece.shape === "circle"
                            ? "absolute top-0 h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5"
                            : "absolute top-0 h-3 w-1.5 rounded-sm sm:h-4 sm:w-2"
                    }
                />
            ))}
        </div>
    );
}

// A single bright pulse on reveal, like a camera flash catching the moment.
function RevealFlash() {
    return (
        <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-30 bg-white"
        />
    );
}

function WinnerAnnouncement({
    project,
    onClose,
}) {
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [onClose]);

    // Lock background scroll while the modal is open so the page
    // behind it can't scroll (and doesn't grow a scrollbar) underneath.
    useEffect(() => {
        if (!project) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [project]);

    return (
        <AnimatePresence>
            {project && (
                <motion.div
                    key="winner-overlay"
                    className="fixed inset-0 z-[9999] h-[100dvh] w-screen overflow-hidden bg-[radial-gradient(ellipse_at_center,#1a1608_0%,#000000_70%)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    onClick={onClose} // <-- Added to allow closing when clicking outside
                >
                    <RevealFlash />

                    {/* Ambient center glow */}
                    <motion.div
                        animate={{
                            opacity: [
                                0.12,
                                0.28,
                                0.12,
                            ],
                            scale: [
                                1,
                                1.12,
                                1,
                            ],
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="pointer-events-none fixed left-1/2 top-1/2 h-[55vw] w-[55vw] max-h-[850px] max-w-[850px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/15 blur-[100px]"
                    />

                    {/* One-time celebratory fireworks */}
                    <Fireworks />

                    {/* One-time celebratory confetti sweep */}
                    <FallingConfetti />

                    {/* Winner content */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.7,
                            y: 50,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.8,
                            ease: [
                                0.22,
                                1,
                                0.36,
                                1,
                            ],
                        }}
                        className="relative z-50 flex h-full w-full items-center justify-center px-4 py-4 sm:px-8"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()} // <-- Prevents clicks inside the modal from closing it
                            className="flex h-full max-h-[100dvh] w-full max-w-5xl flex-col items-center justify-center overflow-hidden rounded-[clamp(1.5rem,3vh,2.5rem)] border border-white/10 bg-white/[0.035] px-[clamp(1.25rem,4vw,3.5rem)] py-[clamp(1rem,3vh,2.5rem)] text-center shadow-[0_40px_140px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                        >
                            {/* Label */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: -20,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    delay: 0.15,
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-[clamp(0.6rem,1.6vw,1rem)] py-[clamp(0.3rem,0.9vh,0.5rem)] text-[clamp(0.55rem,1.3vh,0.75rem)] font-black uppercase tracking-[0.3em] text-yellow-300"
                            >
                                <Sparkles className="h-4 w-4" />
                                Official Result
                            </motion.div>

                            {/* Trophy */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0,
                                    rotate: -35,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    rotate: [
                                        -10,
                                        10,
                                        -6,
                                        6,
                                        0,
                                    ],
                                }}
                                transition={{
                                    delay: 0.25,
                                    duration: 0.9,
                                }}
                                className="mt-[clamp(0.5rem,1.5vh,1rem)] flex h-[clamp(2.5rem,7vh,4.5rem)] w-[clamp(2.5rem,7vh,4.5rem)] items-center justify-center rounded-full border border-yellow-300/30 bg-yellow-300/10 text-yellow-300 shadow-[0_0_70px_rgba(250,204,21,0.25)]"
                            >
                                <Trophy className="h-[45%] w-[45%]" />
                            </motion.div>

                            {/* Winner heading - ADDED TROPHY ICONS HERE */}
                            <motion.h1
                                initial={{
                                    opacity: 0,
                                    scale: 0.5,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: [
                                        0.8,
                                        1.1,
                                        1,
                                    ],
                                }}
                                transition={{
                                    delay: 0.42,
                                    duration: 0.75,
                                }}
                                className="mt-4 flex items-center justify-center gap-3 text-5xl font-black uppercase tracking-tight text-white sm:gap-4 sm:text-7xl lg:text-8xl"
                            >
                                <Trophy className="h-10 w-10 text-yellow-400 sm:h-14 sm:w-14 lg:h-16 lg:w-16" fill="currentColor" />
                                Winner
                                <Trophy className="h-10 w-10 text-yellow-400 sm:h-14 sm:w-14 lg:h-16 lg:w-16" fill="currentColor" />
                            </motion.h1>

                            {/* Captain image */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0.45,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                }}
                                transition={{
                                    delay: 0.6,
                                    duration: 0.7,
                                }}
                                className="relative mt-5 h-32 w-32 sm:h-44 sm:w-44 lg:h-56 lg:w-56"
                            >
                                <motion.div
                                    animate={{
                                        scale: [
                                            1,
                                            1.1,
                                            1,
                                        ],
                                        opacity: [
                                            0.35,
                                            0.8,
                                            0.35,
                                        ],
                                    }}
                                    transition={{
                                        duration: 1.7,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="absolute -inset-4 rounded-full bg-yellow-300/20 blur-xl"
                                />

                                <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-yellow-300/80 bg-black shadow-[0_0_80px_rgba(250,204,21,0.3)]">
                                    {project.captain_image ? (
                                        <img
                                            src={
                                                project.captain_image
                                            }
                                            alt={`${project.captain_name} captain`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-4xl text-white/25">
                                            ?
                                        </div>
                                    )}
                                </div>

                                {/* ADDED TROPHY BADGE HERE */}
                                <div className="absolute -bottom-1 -right-1 z-10 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-black bg-gradient-to-br from-yellow-300 to-yellow-500 text-black shadow-lg sm:h-14 sm:w-14 sm:border-4">
                                    <Trophy className="h-5 w-5 sm:h-7 sm:w-7" fill="currentColor" />
                                </div>
                            </motion.div>

                            {/* Captain */}
                            <motion.p
                                initial={{
                                    opacity: 0,
                                    y: 15,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    delay: 0.76,
                                }}
                                className="mt-5 text-3xl font-semibold text-white sm:text-5xl"
                            >
                                {project.project_name}
                            </motion.p>

                            {/* Project */}
                            <motion.p
                                initial={{
                                    opacity: 0,
                                    y: 10,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    delay: 0.86,
                                }}
                                className="mt-2 max-w-3xl text-lg text-white/50 sm:text-2xl lg:text-3xl"
                            >
                                {project.captain_name}
                            </motion.p>

                            {/* Category */}
                            {project.category && (
                                <motion.span
                                    initial={{
                                        opacity: 0,
                                        scale: 0.8,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                    }}
                                    transition={{
                                        delay: 0.95,
                                    }}
                                    className="mt-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45 sm:text-xs"
                                >
                                    {project.category}
                                </motion.span>
                            )}

                            {/* Final votes */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0.7,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                }}
                                transition={{
                                    delay: 1.05,
                                    duration: 0.55,
                                }}
                                className="mt-5 border-t border-white/10 pt-4 sm:mt-7 sm:pt-5"
                            >
                                <motion.div
                                    animate={{
                                        scale: [
                                            1,
                                            1.04,
                                            1,
                                        ],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="text-5xl font-black tabular-nums text-yellow-300 sm:text-7xl lg:text-8xl"
                                >
                                    {project.vote_count}
                                </motion.div>

                                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.35em] text-white/35 sm:text-xs">
                                    Final Votes
                                </p>
                            </motion.div>

                            {/* The "Back to leaderboard" button was removed from here */}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default WinnerAnnouncement;