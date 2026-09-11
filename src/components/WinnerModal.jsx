
import { AnimatePresence, motion } from "framer-motion";

function WinnerModal({ project, onClose }) {
    return (
        <AnimatePresence>
            {project && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Background glow */}
                    <motion.div
                        className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-yellow-400/10 blur-3xl"
                        initial={{
                            scale: 0.5,
                            opacity: 0,
                        }}
                        animate={{
                            scale: 1.2,
                            opacity: 1,
                        }}
                        transition={{
                            duration: 1,
                        }}
                    />

                    {/* Celebration particles */}
                    {Array.from({ length: 20 }).map(
                        (_, index) => (
                            <motion.div
                                key={index}
                                className="pointer-events-none absolute h-2 w-2 rounded-full bg-yellow-300"
                                initial={{
                                    opacity: 0,
                                    x: 0,
                                    y: 0,
                                    scale: 0,
                                }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    x:
                                        Math.cos(
                                            index * 1.8
                                        ) * 320,
                                    y:
                                        Math.sin(
                                            index * 1.8
                                        ) * 260,
                                    scale: [
                                        0,
                                        1.2,
                                        0,
                                    ],
                                }}
                                transition={{
                                    duration: 1.8,
                                    delay:
                                        index * 0.03,
                                    ease: "easeOut",
                                }}
                            />
                        )
                    )}

                    {/* Main winner card */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.65,
                            y: 40,
                            rotateX: 12,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            rotateX: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.8,
                            y: 20,
                        }}
                        transition={{
                            duration: 0.7,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-yellow-400/30 bg-zinc-950 shadow-[0_0_100px_rgba(250,204,21,0.15)]"
                    >
                        {/* Top glow */}
                        <motion.div
                            animate={{
                                opacity: [
                                    0.2,
                                    0.5,
                                    0.2,
                                ],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                            }}
                            className="absolute inset-x-0 top-0 h-32 bg-yellow-400/10 blur-3xl"
                        />

                        <div className="relative px-6 pb-8 pt-10 text-center sm:px-10">
                            {/* Winner label */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: -15,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    delay: 0.25,
                                    duration: 0.5,
                                }}
                                className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-2 text-xs font-black uppercase tracking-[0.3em] text-yellow-300"
                            >
                                <motion.span
                                    animate={{
                                        scale: [
                                            1,
                                            1.3,
                                            1,
                                        ],
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                    }}
                                >
                                    ★
                                </motion.span>

                                Winner
                            </motion.div>

                            {/* Trophy */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    rotate: [
                                        -8,
                                        8,
                                        -4,
                                        4,
                                        0,
                                    ],
                                }}
                                transition={{
                                    delay: 0.35,
                                    duration: 0.8,
                                }}
                                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-yellow-300/30 bg-yellow-400/10 text-4xl"
                            >
                                🏆
                            </motion.div>

                            {/* Captain image */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0.5,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                }}
                                transition={{
                                    delay: 0.5,
                                    duration: 0.6,
                                }}
                                className="mx-auto mb-6 h-40 w-40 overflow-hidden rounded-full border-4 border-yellow-300/60 bg-black shadow-[0_0_50px_rgba(250,204,21,0.25)]"
                            >
                                <img
                                    src={project.captain_image}
                                    alt={`${ project.captain_name } captain`}
                                    className="h-full w-full object-cover"
                                />
                            </motion.div>

                            {/* Captain */}
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
                                    delay: 0.55,
                                }}
                                className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300/70"
                            >
                                Congratulations
                            </motion.p>

                            <motion.h2
                                initial={{
                                    opacity: 0,
                                    y: 15,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    delay: 0.6,
                                }}
                                className="mt-2 text-2xl font-semibold text-white sm:text-3xl"
                            >
                                {project.captain_name}
                            </motion.h2>

                            {/* Project */}
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
                                    delay: 0.7,
                                }}
                                className="mt-2 text-xl font-medium text-white/60 sm:text-2xl"
                            >
                                {project.project_name}
                            </motion.p>

                            {project.category && (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        y: 10,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        delay: 0.75,
                                    }}
                                    className="mt-4"
                                >
                                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                                        {project.category}
                                    </span>
                                </motion.div>
                            )}

                            {/* Votes */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0.75,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                }}
                                transition={{
                                    delay: 0.85,
                                    duration: 0.5,
                                }}
                                className="mt-8"
                            >
                                <div className="text-6xl font-black tracking-tight text-yellow-300 sm:text-7xl">
                                    {project.vote_count}
                                </div>

                                <div className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-white/40">
                                    Final Votes
                                </div>
                            </motion.div>

                            {/* Close */}
                            <motion.button
                                type="button"
                                onClick={onClose}
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                }}
                                transition={{
                                    delay: 1,
                                }}
                                className="mt-8 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                                Close
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default WinnerModal;

