import { useState, useEffect, useRef } from "react";
import {
    motion,
    AnimatePresence,
} from "framer-motion";
import {
    Trophy,
    BarChart3,
} from "lucide-react";

import { useProjects } from "../hooks/useProjects";
import { supabase } from "../supabase";
import WinnerAnnouncement from "../components/WinnerAnnouncement";

// A distinct vibrant color for every rank outside the top 3,
// so no two bars ever look the same even as the leaderboard grows.
const PALETTE = [
    {
        bar: "from-[#39FF88] via-[#1FE07A] to-[#0FA968]",
        ring: "ring-[#39FF88]",
        glow: "shadow-[0_0_30px_-12px_rgba(57,255,136,0.55)]",
        badge: "bg-[#12B76A]",
    },
    {
        bar: "from-[#F472B6] via-[#EC4899] to-[#C026D3]",
        ring: "ring-[#F472B6]",
        glow: "shadow-[0_0_30px_-12px_rgba(236,72,153,0.55)]",
        badge: "bg-[#DB2777]",
    },
    {
        bar: "from-[#60A5FA] via-[#3B82F6] to-[#2563EB]",
        ring: "ring-[#60A5FA]",
        glow: "shadow-[0_0_30px_-12px_rgba(59,130,246,0.55)]",
        badge: "bg-[#2563EB]",
    },
    {
        bar: "from-[#FFE066] via-[#FFD23F] to-[#FFB000]",
        ring: "ring-[#FFD23F]",
        glow: "shadow-[0_0_30px_-12px_rgba(255,210,63,0.55)]",
        badge: "bg-[#E8A400]",
    },
    {
        bar: "from-[#B24BFF] via-[#9333EA] to-[#5A3CFF]",
        ring: "ring-[#B24BFF]",
        glow: "shadow-[0_0_30px_-12px_rgba(178,75,255,0.55)]",
        badge: "bg-[#8C4BFF]",
    },
    {
        bar: "from-[#2DD4BF] via-[#14B8A6] to-[#0E7490]",
        ring: "ring-[#2DD4BF]",
        glow: "shadow-[0_0_30px_-12px_rgba(45,212,191,0.55)]",
        badge: "bg-[#0D9488]",
    },
    {
        bar: "from-[#FB7185] via-[#F43F5E] to-[#DC2626]",
        ring: "ring-[#FB7185]",
        glow: "shadow-[0_0_30px_-12px_rgba(244,63,94,0.55)]",
        badge: "bg-[#E11D48]",
    },
    {
        bar: "from-[#A3E635] via-[#84CC16] to-[#4D7C0F]",
        ring: "ring-[#A3E635]",
        glow: "shadow-[0_0_30px_-12px_rgba(163,230,53,0.55)]",
        badge: "bg-[#65A30D]",
    },
];

/*
|--------------------------------------------------------------------------
| Premium vote reveal configuration
|--------------------------------------------------------------------------
|
| A new vote round does NOT immediately jump to the new database value.
|
| Each project:
|   1. Waits for a random amount of time.
|   2. Starts counting.
|   3. Adds votes one-by-one.
|   4. Finishes within roughly 15–20 seconds.
|
| The important part is that the animation is driven by timeouts rather
| than one giant Framer Motion animation. This keeps the page responsive.
|--------------------------------------------------------------------------
*/

const MIN_REVEAL_TIME = 15000;
const MAX_REVEAL_TIME = 20000;

const MIN_START_DELAY = 500;
const MAX_START_DELAY = 6000;

const MIN_STEP_INTERVAL = 120;
const MAX_STEP_INTERVAL = 700;

function randomBetween(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1) + min
    );
}

function getRandomRevealDuration() {
    return randomBetween(
        MIN_REVEAL_TIME,
        MAX_REVEAL_TIME
    );
}

function getRandomStartDelay() {
    return randomBetween(
        MIN_START_DELAY,
        MAX_START_DELAY
    );
}

function getStepInterval(delta, duration) {
    if (delta <= 0) {
        return 0;
    }

    const interval =
        Math.floor(
            (duration - 1000) / delta
        );

    return Math.min(
        MAX_STEP_INTERVAL,
        Math.max(
            MIN_STEP_INTERVAL,
            interval
        )
    );
}

function ChartLeaderboardPage() {
    const {
        projects,
        loading,
        error,
    } = useProjects();

    /*
    |--------------------------------------------------------------------------
    | displayVotes
    |--------------------------------------------------------------------------
    |
    | This is the number actually shown to viewers.
    |
    | The API/database value remains inside `projects`.
    |--------------------------------------------------------------------------
    */

    const [displayVotes, setDisplayVotes] =
        useState({});

    /*
    |--------------------------------------------------------------------------
    | Animation state
    |--------------------------------------------------------------------------
    */

    const [animatingProjects, setAnimatingProjects] =
        useState({});

    /*
    |--------------------------------------------------------------------------
    | Refs
    |--------------------------------------------------------------------------
    |
    | Refs prevent animation callbacks from becoming stale when Supabase
    | sends another update during an existing animation.
    |--------------------------------------------------------------------------
    */

    const displayVotesRef = useRef({});

    const targetVotesRef = useRef({});

    const animationIdsRef = useRef({});

    const timersRef = useRef({});

    const initializedRef = useRef(false);

    /*
    |--------------------------------------------------------------------------
    | Keep displayVotesRef synchronized
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        displayVotesRef.current = displayVotes;
    }, [displayVotes]);

    /*
    |--------------------------------------------------------------------------
    | Cleanup all animation timers
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        return () => {
            Object.values(timersRef.current).forEach(
                (timerSet) => {
                    timerSet.forEach((timer) =>
                        clearTimeout(timer)
                    );
                }
            );

            timersRef.current = {};
            animationIdsRef.current = {};
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Initialize / detect vote changes
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!projects || projects.length === 0) {
            if (!initializedRef.current) {
                setDisplayVotes({});
                displayVotesRef.current = {};
            }

            return;
        }

        /*
        --------------------------------------------------------------
        FIRST LOAD
        --------------------------------------------------------------
        Never animate the initial leaderboard.

        This is important because refreshing /charts should always show
        the actual current database values.
        --------------------------------------------------------------
        */

        if (!initializedRef.current) {
            const initialVotes = {};

            projects.forEach((project) => {
                initialVotes[project.id] =
                    Number(project.vote_count) || 0;

                targetVotesRef.current[project.id] =
                    Number(project.vote_count) || 0;
            });

            initializedRef.current = true;

            displayVotesRef.current =
                initialVotes;

            setDisplayVotes(initialVotes);

            return;
        }

        /*
        --------------------------------------------------------------
        CHECK FOR NEW / CHANGED PROJECTS
        --------------------------------------------------------------
        */

        projects.forEach((project) => {
            const id = project.id;

            const newTarget =
                Number(project.vote_count) || 0;

            const oldTarget =
                targetVotesRef.current[id];

            /*
            New project:
            Show its actual current vote count immediately.
            */

            if (
                oldTarget === undefined
            ) {
                targetVotesRef.current[id] =
                    newTarget;

                displayVotesRef.current[id] =
                    newTarget;

                setDisplayVotes((current) => ({
                    ...current,
                    [id]: newTarget,
                }));

                return;
            }

            /*
            No change.
            */

            if (oldTarget === newTarget) {
                return;
            }

            /*
            Store the latest real database target.
            */

            targetVotesRef.current[id] =
                newTarget;

            /*
            Only animate upward changes.

            If votes somehow decrease, immediately synchronize the
            display rather than making viewers watch a fake countdown.
            */

            const currentDisplayed =
                Number(
                    displayVotesRef.current[id]
                ) || 0;

            if (newTarget <= currentDisplayed) {
                displayVotesRef.current[id] =
                    newTarget;

                setDisplayVotes((current) => ({
                    ...current,
                    [id]: newTarget,
                }));

                return;
            }

            /*
            Start the premium reveal.
            */

            startVoteReveal(
                id,
                currentDisplayed,
                newTarget
            );
        });

        /*
        --------------------------------------------------------------
        Remove deleted projects from the displayed state.
        --------------------------------------------------------------
        */

        const currentIds = new Set(
            projects.map((project) => project.id)
        );

        setDisplayVotes((current) => {
            const next = {};

            Object.entries(current).forEach(
                ([id, value]) => {
                    if (currentIds.has(id)) {
                        next[id] = value;
                    }
                }
            );

            displayVotesRef.current = next;

            return next;
        });
    }, [projects]);

    /*
    |--------------------------------------------------------------------------
    | Start premium vote reveal
    |--------------------------------------------------------------------------
    */

    function startVoteReveal(
        projectId,
        startValue,
        targetValue
    ) {
        /*
        Cancel any previous animation for this project.
        */

        const existingTimers =
            timersRef.current[projectId];

        if (existingTimers) {
            existingTimers.forEach((timer) =>
                clearTimeout(timer)
            );
        }

        timersRef.current[projectId] = [];

        /*
        Generate a new animation ID.

        This prevents an old animation callback from modifying the
        display after a newer database update has arrived.
        */

        const animationId =
            `${Date.now()}-${Math.random()}`;

        animationIdsRef.current[projectId] =
            animationId;

        /*
        Latest target.
        */

        targetVotesRef.current[projectId] =
            targetValue;

        /*
        Number of votes that need to be revealed.
        */

        const delta =
            targetValue - startValue;

        if (delta <= 0) {
            return;
        }

        /*
        Each project receives a different reveal duration.

        This makes the leaderboard feel less mechanical.
        */

        const revealDuration =
            getRandomRevealDuration();

        /*
        Each project gets its own random start position.

        Therefore five projects receiving votes will not all start
        counting at the exact same moment.
        */

        const startDelay =
            getRandomStartDelay();

        /*
        Calculate how quickly individual votes should appear.

        Large vote totals automatically use a smaller interval.
        Small vote totals use a slower interval.
        */

        const stepInterval =
            getStepInterval(
                delta,
                revealDuration
            );

        setAnimatingProjects((current) => ({
            ...current,
            [projectId]: true,
        }));

        /*
        --------------------------------------------------------------
        Start delay
        --------------------------------------------------------------
        */

        const startTimer = setTimeout(() => {
            /*
            Ignore this animation if a newer one has started.
            */

            if (
                animationIdsRef.current[
                projectId
                ] !== animationId
            ) {
                return;
            }

            /*
            Count one vote at a time.
            */

            let currentValue =
                Number(
                    displayVotesRef.current[
                    projectId
                    ]
                ) || 0;

            function revealNextVote() {
                /*
                Check animation validity.
                */

                if (
                    animationIdsRef.current[
                    projectId
                    ] !== animationId
                ) {
                    return;
                }

                /*
                Always use the latest database target.

                This means if another round/update arrives while this
                animation is running, the animation will continue
                toward the new target instead of getting stuck.
                */

                const latestTarget =
                    Number(
                        targetVotesRef.current[
                        projectId
                        ]
                    ) || 0;

                if (
                    currentValue >=
                    latestTarget
                ) {
                    finishVoteReveal(
                        projectId,
                        animationId,
                        latestTarget
                    );

                    return;
                }

                /*
                Increase exactly ONE vote.
                */

                currentValue += 1;

                displayVotesRef.current[
                    projectId
                ] = currentValue;

                setDisplayVotes((current) => ({
                    ...current,
                    [projectId]:
                        currentValue,
                }));

                /*
                If we've reached the target, finish.
                */

                if (
                    currentValue >=
                    latestTarget
                ) {
                    finishVoteReveal(
                        projectId,
                        animationId,
                        latestTarget
                    );

                    return;
                }

                /*
                Schedule the next individual vote.
                */

                const nextTimer =
                    setTimeout(
                        revealNextVote,
                        stepInterval
                    );

                timersRef.current[
                    projectId
                ]?.push(nextTimer);
            }

            /*
            Start the actual count.
            */

            revealNextVote();
        }, startDelay);

        timersRef.current[
            projectId
        ].push(startTimer);
    }

    /*
    |--------------------------------------------------------------------------
    | Finish animation safely
    |--------------------------------------------------------------------------
    */

    function finishVoteReveal(
        projectId,
        animationId,
        finalValue
    ) {
        if (
            animationIdsRef.current[
            projectId
            ] !== animationId
        ) {
            return;
        }

        displayVotesRef.current[
            projectId
        ] = finalValue;

        setDisplayVotes((current) => ({
            ...current,
            [projectId]: finalValue,
        }));

        setAnimatingProjects((current) => {
            const next = {
                ...current,
            };

            delete next[projectId];

            return next;
        });

        /*
        Clear timers for this animation.
        */

        const timerSet =
            timersRef.current[projectId];

        if (timerSet) {
            timerSet.forEach((timer) =>
                clearTimeout(timer)
            );
        }

        timersRef.current[projectId] = [];
    }

    /*
    |--------------------------------------------------------------------------
    | Winner announcement
    |--------------------------------------------------------------------------
    */

    const [winner, setWinner] =
        useState(null);

    useEffect(() => {
        async function loadWinner() {
            const { data, error } =
                await supabase
                    .from(
                        "winner_announcements"
                    )
                    .select(
                        `
id,
    project_id,
    announced_at,
    active,
    projects(
        id,
        captain_name,
        captain_image,
        project_name,
        description,
        category,
        vote_count
    )
        `
                    )
                    .eq("active", true)
                    .order(
                        "announced_at",
                        {
                            ascending: false,
                        }
                    )
                    .limit(1)
                    .maybeSingle();

            if (!error) {
                if (data?.projects) {
                    setWinner(
                        data.projects
                    );
                } else {
                    setWinner(null);
                }
            }
        }

        loadWinner();

        const channel = supabase
            .channel(
                "winner-announcement"
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table:
                        "winner_announcements",
                },
                async () => {
                    await loadWinner();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table:
                        "winner_announcements",
                },
                async (payload) => {
                    /*
                    When admin cancels the announcement,
                    immediately close the winner modal.
                    */

                    if (
                        payload.new?.active ===
                        false
                    ) {
                        setWinner(null);
                        return;
                    }

                    await loadWinner();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table:
                        "winner_announcements",
                },
                async () => {
                    await loadWinner();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(
                channel
            );
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="flex min-h-screen items-center justify-center px-6">
                    <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-sm">
                            <BarChart3 className="h-6 w-6 animate-pulse" />
                        </div>

                        <p className="mt-5 text-sm font-medium text-gray-500">
                            Loading live leaderboard...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Error
    |--------------------------------------------------------------------------
    */

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center">
                    <h1 className="text-2xl font-bold">
                        Unable to load rankings
                    </h1>

                    <p className="mt-3 text-neutral-400">
                        {error}
                    </p>
                </div>
            </main>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | maxVotes uses the REAL database values, not displayVotes.
    |
    | This allows the chart scale to already know where the final
    | leaderboard is heading while the individual bars slowly reveal
    | their vote counts.
    |--------------------------------------------------------------------------
    */

    const maxVotes = Math.max(
        ...projects.map(
            (project) =>
                Number(
                    project.vote_count
                ) || 0
        ),
        1
    );

    return (
        <main className="min-h-screen w-full overflow-x-hidden bg-black px-3 py-8 text-white sm:px-5 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <header className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs text-neutral-400">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#39FF88] opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#39FF88]" />
                        </span>

                        Live rankings
                    </div>

                    <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Ai Infuse Leaderboard
                    </h1>

                    <p className="mt-3 text-neutral-400">
                        Live vote comparison
                    </p>
                </header>

                {projects.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 p-12 text-center">
                        <p className="text-neutral-400">
                            No projects available.
                        </p>
                    </div>
                ) : (
                    <div
                        className="grid w-full items-end gap-2 px-1 pb-0 sm:gap-3"
                        style={{
                            gridTemplateColumns:
                                `repeat(${projects.length}, minmax(0, 1fr))`,
                        }}
                    >
                        {projects.map(
                            (
                                project,
                                index
                            ) => {
                                const rank =
                                    index + 1;

                                /*
                                ------------------------------------------------
                                Use the animated displayed value.
                                ------------------------------------------------
                                */

                                const visibleVotes =
                                    displayVotes[
                                    project.id
                                    ] ??
                                    Number(
                                        project.vote_count
                                    ) ??
                                    0;

                                /*
                                ------------------------------------------------
                                Bar height is based on the animated value.
                                ------------------------------------------------
                                */

                                const barHeight =
                                    Math.max(
                                        (visibleVotes /
                                            maxVotes) *
                                        420,
                                        150
                                    );

                                /*
                                ------------------------------------------------
                                Is this project currently revealing votes?
                                ------------------------------------------------
                                */

                                const isAnimating =
                                    Boolean(
                                        animatingProjects[
                                        project.id
                                        ]
                                    );

                                /*
                                ------------------------------------------------
                                Rank styling
                                ------------------------------------------------
                                */

                                const rankStyle =
                                    rank === 1
                                        ? {
                                            bar: "from-[#FF3D68] via-[#FF5F6D] to-[#FF9346]",
                                            ring: "ring-[#FF3D68]",
                                            glow: "shadow-[0_0_45px_-8px_rgba(255,61,104,0.65)]",
                                            badge: "bg-[#FF3D68]",
                                        }
                                        : rank === 2
                                            ? {
                                                bar: "from-[#00E5FF] via-[#22B8FF] to-[#3E7BFF]",
                                                ring: "ring-[#00E5FF]",
                                                glow: "shadow-[0_0_40px_-10px_rgba(0,229,255,0.55)]",
                                                badge: "bg-[#00B8D4]",
                                            }
                                            : rank === 3
                                                ? {
                                                    bar: "from-[#FFC93C] via-[#FFA53C] to-[#FF7A3C]",
                                                    ring: "ring-[#FFA53C]",
                                                    glow: "shadow-[0_0_40px_-10px_rgba(255,165,60,0.55)]",
                                                    badge: "bg-[#FF8F3C]",
                                                }
                                                : PALETTE[
                                                (rank - 4) %
                                                PALETTE.length
                                                ];

                                return (
                                    <motion.div
                                        key={
                                            project.id
                                        }
                                        layout
                                        initial={{
                                            opacity: 0,
                                            y: 30,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        transition={{
                                            layout: {
                                                duration: 0.7,
                                                ease: [
                                                    0.22,
                                                    1,
                                                    0.36,
                                                    1,
                                                ],
                                            },
                                        }}
                                        className="flex min-w-0 w-full flex-col items-center"
                                    >
                                        {/* Captain image */}

                                        <motion.div
                                            layout
                                            className="relative z-30 mb-[-20px] sm:mb-[-24px]"
                                        >
                                            <img
                                                src={
                                                    project.captain_image
                                                }
                                                alt={`${project.captain_name} captain`}
                                                className={[
                                                    "h-12 w-12 rounded-full object-cover",
                                                    "border-3 border-black bg-black ring-2",
                                                    rankStyle.ring,
                                                    rankStyle.glow,
                                                    smImageClass(
                                                        rank
                                                    ),
                                                ].join(
                                                    " "
                                                )}
                                            />

                                            {rank ===
                                                1 && (
                                                    <motion.span
                                                        className="absolute inset-0 -z-10 rounded-full bg-[#FF3D68]"
                                                        animate={{
                                                            scale: [
                                                                1,
                                                                1.5,
                                                                1,
                                                            ],
                                                            opacity: [
                                                                0.5,
                                                                0,
                                                                0.5,
                                                            ],
                                                        }}
                                                        transition={{
                                                            duration: 2.2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                        }}
                                                    />
                                                )}

                                            <div
                                                className={[
                                                    "absolute -bottom-2 left-1/2 flex h-6 min-w-6 -translate-x-1/2 items-center justify-center gap-1 rounded-full px-1.5 sm:h-7 sm:min-w-7 sm:px-2",
                                                    "text-[9px] font-black text-white shadow-lg sm:text-xs",
                                                    rankStyle.badge,
                                                ].join(
                                                    " "
                                                )}
                                            >
                                                {rank ===
                                                    1 ? (
                                                    <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                ) : (
                                                    `#${rank}`
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Bar */}

                                        <motion.div
                                            layout
                                            className={[
                                                "relative z-0 flex w-full min-w-0 items-end justify-center overflow-hidden rounded-t-xl border-x border-t border-white/10 sm:rounded-t-2xl",
                                                "bg-gradient-to-t",
                                                rankStyle.bar,
                                            ].join(
                                                " "
                                            )}
                                            initial={{
                                                height: 0,
                                            }}
                                            animate={{
                                                height:
                                                    barHeight,
                                            }}
                                            transition={{
                                                height: {
                                                    duration: 0.35,
                                                    ease: "easeOut",
                                                },
                                            }}
                                        >
                                            {/* 
                                            Premium reveal glow.

                                            This is intentionally subtle so it
                                            doesn't cause heavy animation or
                                            lag while the number is counting.
                                            */}

                                            <AnimatePresence>
                                                {isAnimating && (
                                                    <motion.div
                                                        key="reveal-glow"
                                                        initial={{
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            opacity: [
                                                                0,
                                                                0.22,
                                                                0,
                                                            ],
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                        }}
                                                        transition={{
                                                            duration: 1.1,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                        }}
                                                        className="pointer-events-none absolute inset-0 z-10 bg-white"
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {/* Vote count */}

                                            <div className="absolute bottom-4 left-0 right-0 z-20 text-center text-black sm:bottom-5">
                                                <AnimatePresence
                                                    mode="popLayout"
                                                >
                                                    <motion.div
                                                        key={
                                                            visibleVotes
                                                        }
                                                        initial={{
                                                            scale: 0.92,
                                                            opacity: 0.6,
                                                        }}
                                                        animate={{
                                                            scale: 1,
                                                            opacity: 1,
                                                        }}
                                                        transition={{
                                                            duration: 0.16,
                                                            ease: "easeOut",
                                                        }}
                                                        className="text-xl font-black leading-none sm:text-3xl lg:text-4xl"
                                                    >
                                                        {
                                                            visibleVotes
                                                        }
                                                    </motion.div>
                                                </AnimatePresence>

                                                <div className="mt-1 text-[8px] font-bold leading-none text-black/70 sm:text-[10px]">
                                                    votes
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Project details */}

                                        <div className="mt-3 w-full min-w-0 text-center sm:mt-5">
                                            <h2 className="truncate text-xs font-black text-white sm:text-lg lg:text-xl">
                                                {
                                                    project.project_name
                                                }
                                            </h2>

                                            <p className="mt-1 truncate text-[10px] text-neutral-400 sm:text-sm">
                                                {
                                                    project.captain_name
                                                }
                                            </p>

                                            {project.category && (
                                                <span className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-white/15 px-2 py-1 text-[8px] text-neutral-400 sm:px-3 sm:text-xs">
                                                    {
                                                        project.category
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            }
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {winner && (
                    <WinnerAnnouncement
                        project={winner}
                        onClose={() =>
                            setWinner(
                                null
                            )
                        }
                    />
                )}
            </AnimatePresence>
        </main>
    );
}

function smImageClass(rank) {
    return rank <= 3
        ? "sm:h-20 sm:w-20 lg:h-24 lg:w-24"
        : "sm:h-16 sm:w-16 lg:h-20 lg:w-20";
}

export default ChartLeaderboardPage;