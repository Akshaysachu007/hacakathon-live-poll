import { Activity, BarChart3, Radio, Trophy } from "lucide-react";
import Leaderboard from "../components/Leaderboard";
import { useProjects } from "../hooks/useProjects";

function LeaderboardPage() {
    const { projects, loading, error } = useProjects();

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 text-gray-900">
                <div className="flex min-h-screen items-center justify-center px-6">
                    <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-sm">
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

    if (error) {
        return (
            <main className="min-h-screen bg-gray-50 text-gray-900">
                <div className="flex min-h-screen items-center justify-center px-6">
                    <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg shadow-red-500/5">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                            <Activity className="h-6 w-6" />
                        </div>
                        <h1 className="mt-5 text-xl font-bold tracking-tight text-gray-900">
                            Unable to load leaderboard
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            {error}
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    const totalVotes = projects.reduce(
        (total, project) => total + Number(project.vote_count || 0),
        0
    );

    const leader =
        projects.length > 0
            ? projects.reduce(
                (currentLeader, project) =>
                    Number(project.vote_count || 0) >
                        Number(currentLeader.vote_count || 0)
                        ? project
                        : currentLeader,
                projects[0]
            )
            : null;

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 selection:bg-gray-900 selection:text-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                {/* Top navigation / brand */}
                <header className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-6 px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
                        {/* Brand */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
                                <Trophy className="h-5 w-5" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                                        AI Infuse
                                    </h1>
                                    <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                        Live
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs font-medium text-gray-500 sm:text-sm">
                                    Official hackathon leaderboard
                                </p>
                            </div>
                        </div>

                        {/* Live indicator */}
                        <div className="inline-flex items-center gap-3 self-start rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 lg:self-auto">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            </span>

                            <div>
                                <p className="text-xs font-semibold text-gray-900">
                                    Live updates enabled
                                </p>
                                <p className="text-[11px] font-medium text-gray-500">
                                    Results update in real time
                                </p>
                            </div>
                            <Radio className="ml-2 h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="py-16 text-center sm:py-20 lg:py-24">
                    <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live Hackathon Results
                    </div>

                    <h2 className="mx-auto mt-8 max-w-4xl text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                        The projects.
                        <br />
                        <span className="text-gray-300">The votes.</span>
                    </h2>

                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-500">
                        Watch the competition unfold in real time. Every organizer-entered vote is reflected instantly on the leaderboard.
                    </p>
                </section>

                {/* Stats */}
                {projects.length > 0 && (
                    <section className="mb-10 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Projects
                                </p>
                                <BarChart3 className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums text-gray-900">
                                {projects.length}
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                Competing projects
                            </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Total Votes
                                </p>
                                <Activity className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums text-gray-900">
                                {totalVotes}
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                Votes recorded so far
                            </p>
                        </div>

                        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-white shadow-lg shadow-gray-900/5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Current Leader
                                </p>
                                <Trophy className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="mt-4 truncate text-2xl font-bold tracking-tight">
                                {leader?.project_name || "—"}
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-400">
                                {leader
                                    ? `${leader.vote_count} votes`
                                    : "No votes yet"}
                            </p>
                        </div>
                    </section>
                )}

                {/* Leaderboard Section */}
                <section>
                    <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                Standings
                            </p>
                            <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                                Live Leaderboard
                            </h3>
                        </div>

                        {projects.length > 0 && (
                            <div className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 sm:self-auto">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Updating live
                            </div>
                        )}
                    </div>

                    {projects.length === 0 ? (
                        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-24 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-400">
                                <Trophy className="h-8 w-8" />
                            </div>
                            <h3 className="mt-6 text-xl font-bold text-gray-900">
                                No projects yet
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                                The leaderboard will appear here as soon as projects are added by the organizer.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                            <Leaderboard projects={projects} />
                        </div>
                    )}
                </section>

                {/* Footer */}
                <footer className="mt-12 flex flex-col gap-4 border-t border-gray-200 pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                    <p className="text-sm font-medium text-gray-500">
                        AI Infuse Hackathon
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 sm:justify-end">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live results
                    </div>
                </footer>
            </div>
        </main>
    );
}

export default LeaderboardPage;