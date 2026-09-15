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
| A new vote round does NOT immediately jump to the new database values.
|
| Bars never move position - they stand exactly where they are - but for
| ~15 seconds every bar's height/number flickers up and down at random.
| The swing gradually narrows as the window closes, so it feels like the
| board is "settling" rather than just glitching. Then, all at once, every
| bar snaps to its real value and fires a boom.
|
| The animation is driven by timeouts rather than one giant Framer Motion
| animation, so the page stays responsive.
|--------------------------------------------------------------------------
*/

const SUSPENSE_DURATION = 15000; // total flicker window, ~15s

const MIN_TICK_INTERVAL = 450; // fastest a single bar can flicker
const MAX_TICK_INTERVAL = 900; // slowest a single bar can flicker

// A soft, "buttery" cubic-bezier used everywhere a value glides toward
// its target, instead of a linear/easeOut snap.
const BUTTER_EASE = [0.45, 0, 0.15, 1];

const BOOM_DURATION = 900; // how long the boom burst stays on screen

function randomBetween(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1) + min
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
    | This is the number actually shown to viewers - during the suspense
    | window it randomly flickers, the API/database value stays in
    | `projects`/`targetVotesRef`.
    |--------------------------------------------------------------------------
    */

    const [displayVotes, setDisplayVotes] =
        useState({});

    /*
    |--------------------------------------------------------------------------
    | Animation state
    |--------------------------------------------------------------------------
    */

    const [isRevealing, setIsRevealing] =
        useState(false);

    const [boomingProjects, setBoomingProjects] =
        useState({});

    /*
    |--------------------------------------------------------------------------
    | Refs
    |--------------------------------------------------------------------------
    |
    | Refs prevent animation callbacks from becoming stale when Supabase
    | sends another update during an existing suspense round.
    |--------------------------------------------------------------------------
    */

    const displayVotesRef = useRef({});

    const targetVotesRef = useRef({});

    const jitterTimersRef = useRef({});

    const roundStopTimerRef = useRef(null);

    const boomClearTimerRef = useRef(null);

    const roundIdRef = useRef(0);

    const roundStartRef = useRef(0);

    const revealingRef = useRef(false);

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
            Object.values(
                jitterTimersRef.current
            ).forEach((timerList) => {
                timerList.forEach((timer) =>
                    clearTimeout(timer)
                );
            });

            jitterTimersRef.current = {};

            if (roundStopTimerRef.current) {
                clearTimeout(
                    roundStopTimerRef.current
                );
            }

            if (boomClearTimerRef.current) {
                clearTimeout(
                    boomClearTimerRef.current
                );
            }
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

            displayVotesRef.current = initialVotes;

            setDisplayVotes(initialVotes);

            return;
        }

        /*
        --------------------------------------------------------------
        CHECK FOR NEW / CHANGED PROJECTS
        --------------------------------------------------------------
        */

        let hasIncrease = false;

        projects.forEach((project) => {
            const id = project.id;

            const newTarget =
                Number(project.vote_count) || 0;

            const oldTarget =
                targetVotesRef.current[id];

            /*
            New project: show its actual current vote count immediately,
            no suspense just for showing up.
            */

            if (oldTarget === undefined) {
                targetVotesRef.current[id] = newTarget;

                displayVotesRef.current[id] = newTarget;

                setDisplayVotes((current) => ({
                    ...current,
                    [id]: newTarget,
                }));

                if (revealingRef.current) {
                    // Join the round already in progress.
                    startJitterLoop(
                        id,
                        roundIdRef.current
                    );
                }

                return;
            }

            if (newTarget > oldTarget) {
                hasIncrease = true;
            }

            targetVotesRef.current[id] = newTarget;

            /*
            If votes somehow decrease, immediately synchronize the
            display rather than making viewers watch a fake countdown.
            */

            const currentDisplayed =
                Number(
                    displayVotesRef.current[id]
                ) || 0;

            if (
                newTarget < currentDisplayed &&
                !revealingRef.current
            ) {
                displayVotesRef.current[id] = newTarget;

                setDisplayVotes((current) => ({
                    ...current,
                    [id]: newTarget,
                }));
            }
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

        Object.keys(targetVotesRef.current).forEach(
            (id) => {
                if (!currentIds.has(id)) {
                    delete targetVotesRef.current[id];
                }
            }
        );

        /*
        --------------------------------------------------------------
        Kick off the board-wide suspense round.
        --------------------------------------------------------------
        Every bar currently on the board joins in, whether or not its
        own value changed - that's what makes the reveal feel like a
        single, cohesive "moment" instead of isolated bar updates.
        --------------------------------------------------------------
        */

        if (hasIncrease && !revealingRef.current) {
            startSuspenseRound(
                Array.from(currentIds)
            );
        }
    }, [projects]);

    /*
    |--------------------------------------------------------------------------
    | Start the board-wide suspense round
    |--------------------------------------------------------------------------
    */

    function startSuspenseRound(ids) {
        Object.values(
            jitterTimersRef.current
        ).forEach((timerList) => {
            timerList.forEach((timer) =>
                clearTimeout(timer)
            );
        });

        jitterTimersRef.current = {};

        if (roundStopTimerRef.current) {
            clearTimeout(roundStopTimerRef.current);
        }

        if (boomClearTimerRef.current) {
            clearTimeout(boomClearTimerRef.current);
        }

        const roundId = ++roundIdRef.current;

        roundStartRef.current = Date.now();
        revealingRef.current = true;

        setIsRevealing(true);
        setBoomingProjects({});

        ids.forEach((id) => {
            startJitterLoop(id, roundId);
        });

        roundStopTimerRef.current = setTimeout(() => {
            finishSuspenseRound(roundId);
        }, SUSPENSE_DURATION);
    }

    /*
    |--------------------------------------------------------------------------
    | Per-bar flicker loop
    |--------------------------------------------------------------------------
    |
    | Each bar ticks on its own random cadence so the whole board doesn't
    | flicker in lockstep - that's what makes it feel alive instead of
    | mechanical. The swing narrows toward the real value as the round
    | approaches its end, like the board is settling before the reveal.
    |--------------------------------------------------------------------------
    */

    function startJitterLoop(id, roundId) {
        jitterTimersRef.current[id] =
            jitterTimersRef.current[id] || [];

        tick();

        function tick() {
            if (roundIdRef.current !== roundId) {
                return;
            }

            const maxVotes = Math.max(
                ...Object.values(
                    targetVotesRef.current
                ),
                1
            );

            const target =
                targetVotesRef.current[id] ?? 0;

            const elapsed = Math.min(
                1,
                (Date.now() -
                    roundStartRef.current) /
                SUSPENSE_DURATION
            );

            // Wide swing early on, narrowing down to a gentle wobble
            // by the time the round is about to end.
            const spread = Math.max(
                maxVotes * 0.06,
                maxVotes * (1 - elapsed) * 0.85
            );

            const low = Math.max(
                0,
                Math.round(target - spread)
            );

            const high = Math.min(
                maxVotes,
                Math.round(target + spread)
            );

            const value = randomBetween(
                low,
                Math.max(low, high)
            );

            displayVotesRef.current[id] = value;

            setDisplayVotes((current) => ({
                ...current,
                [id]: value,
            }));

            const nextTick = randomBetween(
                MIN_TICK_INTERVAL,
                MAX_TICK_INTERVAL
            );

            const timer = setTimeout(
                tick,
                nextTick
            );

            jitterTimersRef.current[id].push(
                timer
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Finish the round - snap to real values and boom, all together
    |--------------------------------------------------------------------------
    */

    function finishSuspenseRound(roundId) {
        if (roundIdRef.current !== roundId) {
            return;
        }

        Object.values(
            jitterTimersRef.current
        ).forEach((timerList) => {
            timerList.forEach((timer) =>
                clearTimeout(timer)
            );
        });

        jitterTimersRef.current = {};

        const finalVotes = {};

        Object.keys(
            targetVotesRef.current
        ).forEach((id) => {
            finalVotes[id] =
                targetVotesRef.current[id];
        });

        displayVotesRef.current = finalVotes;

        setDisplayVotes(finalVotes);
        setIsRevealing(false);

        revealingRef.current = false;

        const boomFlags = {};

        Object.keys(finalVotes).forEach((id) => {
            boomFlags[id] = true;
        });

        setBoomingProjects(boomFlags);

        boomClearTimerRef.current = setTimeout(() => {
            setBoomingProjects({});
        }, BOOM_DURATION);
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
    | leaderboard is heading while the bars flicker through the
    | suspense window.
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
                                Is this bar currently mid-boom?
                                ------------------------------------------------
                                */

                                const isBooming =
                                    Boolean(
                                        boomingProjects[
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
                                                    duration: 0.85,
                                                    ease: BUTTER_EASE,
                                                },
                                            }}
                                        >
                                            {/*
                                            Suspense flicker glow.

                                            Subtle pulsing overlay shown on
                                            every bar while the board is
                                            settling toward the reveal.
                                            */}

                                            <AnimatePresence>
                                                {isRevealing && (
                                                    <motion.div
                                                        key="flicker-glow"
                                                        initial={{
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            opacity: [
                                                                0,
                                                                0.2,
                                                                0,
                                                            ],
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                        }}
                                                        transition={{
                                                            duration: 1.4,
                                                            repeat: Infinity,
                                                            ease: BUTTER_EASE,
                                                        }}
                                                        className="pointer-events-none absolute inset-0 z-10 bg-white"
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {/*
                                            Boom burst.

                                            Fires once, the instant the true
                                            value snaps into place.
                                            */}

                                            <AnimatePresence>
                                                {isBooming && (
                                                    <motion.div
                                                        key="boom-ring"
                                                        initial={{
                                                            scale: 0.6,
                                                            opacity: 0.95,
                                                        }}
                                                        animate={{
                                                            scale: 2.4,
                                                            opacity: 0,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                        }}
                                                        transition={{
                                                            duration: 0.8,
                                                            ease: "easeOut",
                                                        }}
                                                        className={[
                                                            "pointer-events-none absolute inset-0 z-20 rounded-t-xl border-4 sm:rounded-t-2xl",
                                                            rankStyle.ring,
                                                        ].join(
                                                            " "
                                                        )}
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {/* Vote count */}

                                            <div className="absolute bottom-4 left-0 right-0 z-30 text-center text-black sm:bottom-5">
                                                <AnimatePresence
                                                    mode="popLayout"
                                                >
                                                    <motion.div
                                                        key={
                                                            visibleVotes
                                                        }
                                                        initial={{
                                                            scale: isBooming
                                                                ? 0.4
                                                                : 0.92,
                                                            opacity: isBooming
                                                                ? 0
                                                                : 0.6,
                                                        }}
                                                        animate={{
                                                            scale: isBooming
                                                                ? [
                                                                    1.6,
                                                                    1,
                                                                ]
                                                                : 1,
                                                            opacity: 1,
                                                        }}
                                                        transition={{
                                                            duration: isBooming
                                                                ? 0.6
                                                                : 0.32,
                                                            ease: BUTTER_EASE,
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