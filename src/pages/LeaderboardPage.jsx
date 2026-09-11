import Leaderboard from "../components/Leaderboard";
import { useProjects } from "../hooks/useProjects";

function LeaderboardPage() {
    const {
        projects,
        loading,
        error,
    } = useProjects();

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center px-6">
                <p className="text-lg text-slate-400">
                    Loading leaderboard...
                </p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center px-6">
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center">
                    <h1 className="text-xl font-bold text-white">
                        Unable to load leaderboard
                    </h1>

                    <p className="mt-2 text-sm text-red-200">
                        {error}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <header className="mb-10 text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">
                        Live Hackathon Results
                    </p>

                    <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                        Hackathon Live Poll
                    </h1>

                    <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                        Real-time project rankings based on organizer-entered votes.
                    </p>
                </header>

                {projects.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
                        <p className="text-slate-400">
                            No projects have been added yet.
                        </p>
                    </div>
                ) : (
                    <Leaderboard projects={projects} />
                )}
            </div>
        </main>
    );
}

export default LeaderboardPage;