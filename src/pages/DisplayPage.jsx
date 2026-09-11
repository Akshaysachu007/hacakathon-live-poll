import Leaderboard from "../components/Leaderboard";
import { useProjects } from "../hooks/useProjects";

function DisplayPage() {
    const {
        projects,
        loading,
        error,
    } = useProjects();

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                <p className="text-2xl text-slate-400">
                    Loading live leaderboard...
                </p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
                <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-10 text-center">
                    <h1 className="text-3xl font-bold">
                        Leaderboard unavailable
                    </h1>

                    <p className="mt-3 text-red-200">
                        {error}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-10">
            <div className="mx-auto max-w-7xl">
                <header className="mb-10 flex flex-col items-center text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.4em] text-sky-400">
                        Live Results
                    </p>

                    <h1 className="mt-3 text-5xl font-black tracking-tight lg:text-7xl">
                        Hackathon Live
                    </h1>

                    <p className="mt-4 text-lg text-slate-400 lg:text-2xl">
                        Project Leaderboard
                    </p>
                </header>

                {projects.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-16 text-center">
                        <p className="text-2xl text-slate-400">
                            No projects available yet.
                        </p>
                    </div>
                ) : (
                        <Leaderboard
                            projects={projects}
                            displayMode={true}
                        />
                )}
            </div>
        </main>
    );
}

export default DisplayPage;