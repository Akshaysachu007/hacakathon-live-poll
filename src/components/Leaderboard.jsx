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

                // Subtle, premium color tints for the top 3 spots
                const rankStyles = {
                    1: "border-yellow-200 bg-gradient-to-r from-yellow-50/50 to-white shadow-sm ring-1 ring-yellow-100",
                    2: "border-gray-200 bg-gradient-to-r from-gray-50/80 to-white shadow-sm",
                    3: "border-orange-200 bg-gradient-to-r from-orange-50/50 to-white shadow-sm",
                };

                const rankTextStyles = {
                    1: "text-yellow-600",
                    2: "text-gray-400",
                    3: "text-orange-600",
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
                            "flex items-center rounded-2xl border transition-shadow duration-300",
                            displayMode
                                ? "gap-6 p-6 lg:gap-8 lg:p-8"
                                : "gap-4 p-4 sm:gap-5",
                            rankStyles[rank] ??
                            "border-gray-100 bg-white hover:shadow-md",
                        ].join(" ")}
                    >
                        {/* Ranking */}
                        <motion.div
                            layout="position"
                            className={[
                                "shrink-0 text-center",
                                displayMode
                                    ? "w-16 lg:w-20"
                                    : "w-10 sm:w-12",
                            ].join(" ")}
                        >
                            <motion.span
                                key={rank}
                                initial={{ opacity: 0.5, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={[
                                    "font-bold",
                                    rankTextStyles[rank] ?? "text-gray-300",
                                    displayMode
                                        ? "text-3xl lg:text-5xl"
                                        : "text-xl sm:text-2xl",
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
                                "shrink-0 rounded-xl object-cover ring-1 ring-gray-100 shadow-sm",
                                displayMode
                                    ? "h-24 w-24 lg:h-32 lg:w-32"
                                    : "h-16 w-16 sm:h-20 sm:w-20",
                            ].join(" ")}
                        />

                        {/* Project information */}
                        <motion.div
                            layout="position"
                            className="min-w-0 flex-1"
                        >
                            <h2
                                className={[
                                    "truncate font-bold text-gray-900",
                                    displayMode
                                        ? "text-2xl lg:text-3xl"
                                        : "text-lg sm:text-xl",
                                ].join(" ")}
                            >
                                {project.project_name}
                            </h2>

                            <p
                                className={[
                                    "font-medium text-gray-500",
                                    displayMode
                                        ? "mt-2 text-lg lg:text-xl"
                                        : "mt-1 text-xs sm:text-sm",
                                ].join(" ")}
                            >
                                Captain: {project.captain_name}
                            </p>

                            {project.category && (
                                <span
                                    className={[
                                        "inline-block rounded-md border border-gray-200 bg-gray-50 font-medium text-gray-600",
                                        displayMode
                                            ? "mt-3 px-3 py-1.5 text-sm lg:text-base"
                                            : "mt-2 px-2.5 py-1 text-[11px] sm:text-xs",
                                    ].join(" ")}
                                >
                                    {project.category}
                                </span>
                            )}
                        </motion.div>

                        {/* Vote count */}
                        <motion.div
                            layout="position"
                            className="shrink-0 text-right pr-2"
                        >
                            <div
                                className={[
                                    "font-extrabold tracking-tight text-gray-900",
                                    displayMode
                                        ? "text-4xl lg:text-6xl"
                                        : "text-2xl sm:text-3xl",
                                ].join(" ")}
                            >
                                <AnimatedVoteCount
                                    value={project.vote_count}
                                />
                            </div>

                            <div
                                className={[
                                    "font-semibold uppercase tracking-widest text-gray-400",
                                    displayMode
                                        ? "mt-1.5 text-xs lg:text-sm"
                                        : "mt-1 text-[10px] sm:text-xs",
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