import { motion } from "framer-motion";

function AnimatedVoteCount({ value }) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0.5, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.25,
                ease: "easeOut",
            }}
            className="tabular-nums"
        >
            {value}
        </motion.span>
    );
}

function Leaderboard({ projects, displayMode = false }) {
    return (
        <motion.section
            layout
            className={[
                "mx-auto flex w-full flex-col gap-4",
                displayMode ? "max-w-7xl lg:gap-5" : "max-w-5xl",
            ].join(" ")}
        >
            {projects.map((project, index) => {
                const rank = index + 1;

                const rankStyles = {
                    1: "border-yellow-400/50 bg-yellow-400/10 shadow-lg shadow-yellow-500/10",
                    2: "border-slate-300/40 bg-slate-300/10",
                    3: "border-amber-700/50 bg-amber-700/10",
                };

                return (
                    <motion.article
                        key={project.id}
                        layout
                        transition={{
                            layout: {
                                duration: 0.65,
                                ease: [0.22, 1, 0.36, 1],
                            },
                        }}
                        initial={{
                            opacity: 0,
                            y: 12,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            y: -12,
                        }}
                        className={[
                            "flex items-center rounded-2xl border backdrop-blur-md transition-shadow duration-300",
                            displayMode
                                ? "gap-7 p-6 lg:gap-10 lg:p-8"
                                : "gap-5 p-4",
                            rankStyles[rank] ??
                            "border-white/10 bg-white/[0.03]",
                        ].join(" ")}
                    >
                        {/* Ranking */}
                        <motion.div
                            layout="position"
                            className={[
                                "shrink-0 text-center",
                                displayMode
                                    ? "w-20 lg:w-24"
                                    : "w-12",
                            ].join(" ")}
                        >
                            <motion.span
                                key={rank}
                                initial={{
                                    opacity: 0.5,
                                    scale: 0.8,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                }}
                                transition={{
                                    duration: 0.3,
                                }}
                                className={[
                                    "font-black text-white",
                                    displayMode
                                        ? "text-4xl lg:text-6xl"
                                        : "text-2xl",
                                ].join(" ")}
                            >
                                #{rank}
                            </motion.span>
                        </motion.div>

                        {/* Captain image */}
                        <motion.img
                            layout="position"
                            src={project.captain_image}
                            alt={`${project.captain_name} captain`}
                            className={[
                                "shrink-0 rounded-xl object-cover ring-1 ring-white/10",
                                displayMode
                                    ? "h-28 w-28 lg:h-36 lg:w-36"
                                    : "h-20 w-20",
                            ].join(" ")}
                        />

                        {/* Project information */}
                        <motion.div
                            layout="position"
                            className="min-w-0 flex-1"
                        >
                            <h2
                                className={[
                                    "truncate font-bold text-white",
                                    displayMode
                                        ? "text-3xl lg:text-4xl"
                                        : "text-xl",
                                ].join(" ")}
                            >
                                {project.project_name}
                            </h2>

                            <p
                                className={[
                                    "text-slate-300",
                                    displayMode
                                        ? "mt-2 text-lg lg:text-xl"
                                        : "mt-1 text-sm",
                                ].join(" ")}
                            >
                                Captain: {project.captain_name}
                            </p>

                            {project.category && (
                                <span
                                    className={[
                                        "inline-block rounded-full border border-white/10 bg-white/5 text-slate-300",
                                        displayMode
                                            ? "mt-3 px-4 py-2 text-sm lg:text-base"
                                            : "mt-2 px-3 py-1 text-xs",
                                    ].join(" ")}
                                >
                                    {project.category}
                                </span>
                            )}
                        </motion.div>

                        {/* Vote count */}
                        <motion.div
                            layout="position"
                            className="shrink-0 text-right"
                        >
                            <div
                                className={[
                                    "font-black text-white",
                                    displayMode
                                        ? "text-5xl lg:text-7xl"
                                        : "text-3xl",
                                ].join(" ")}
                            >
                                <AnimatedVoteCount
                                    value={project.vote_count}
                                />
                            </div>

                            <div
                                className={[
                                    "uppercase tracking-[0.2em] text-slate-400",
                                    displayMode
                                        ? "mt-1 text-sm lg:text-base"
                                        : "text-xs",
                                ].join(" ")}
                            >
                                votes
                            </div>
                        </motion.div>
                    </motion.article>
                );
            })}
        </motion.section>
    );
}

export default Leaderboard;