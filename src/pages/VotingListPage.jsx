import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
    Flag,
    Users,
    UserRound,
    Radio,
    RefreshCw,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { getProjects } from "../api/projects";

function stableProjectOrder(projects) {
    return [...projects].sort(
        (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime() ||
            String(a.id).localeCompare(String(b.id))
    );
}

function VotingListPage() {
    const { user, loading: authLoading } = useAuth();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    async function loadProjects(showRefresh = false) {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const data = await getProjects();

            setProjects(stableProjectOrder(data));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load teams."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        if (!user) {
            return;
        }

        void loadProjects();

        const interval = setInterval(() => {
            void loadProjects(true);
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, [user]);

    if (authLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-black" />
                    <p className="mt-4 text-sm text-black/50">
                        Checking your session...
                    </p>
                </div>
            </main>
        );
    }

    if (!user) {
        return <Navigate to="/admin" replace />;
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                        <Users className="h-5 w-5 animate-pulse" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-black/50">
                        Loading team list...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen w-screen flex-col overflow-hidden bg-[#f7f7f5] text-black">
            {/* ===================================================== */}
            {/* COMPACT TOP BAR */}
            {/* ===================================================== */}
            <header className="shrink-0 border-b border-black/10 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-[1700px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-white">
                            <Flag className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-black/40">
                                Hackathon
                            </p>
                            <h1 className="truncate text-base font-black tracking-tight">
                                Voting List
                            </h1>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/[0.02] px-2.5 py-1 sm:px-3">
                            <Radio className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span className="hidden text-[10px] font-bold uppercase tracking-wider text-black/60 sm:inline">
                                Live Presentation
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadProjects(true)}
                            disabled={refreshing}
                            aria-label="Refresh teams"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white text-black/60 transition hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </header>

            {/* ===================================================== */}
            {/* MAIN CONTENT AREA */}
            {/* ===================================================== */}
            <div className="mx-auto flex w-full max-w-[1700px] flex-1 flex-col overflow-hidden px-4 py-2.5 sm:px-6">
                {/* SUB-HEADER STATS */}
                <section className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1">
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50">
                                Active Teams
                            </span>
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-black sm:text-2xl">
                            Voting Lineup
                        </h2>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-1 shadow-sm">
                        <Users className="h-4 w-4 shrink-0 text-black/50" />
                        <p className="text-sm font-black tracking-wide text-black">
                            <span className="text-black/40">TOTAL:</span>{" "}
                            {projects.length}
                        </p>
                    </div>
                </section>

                {error && (
                    <div className="mb-2 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-1.5">
                        <p className="text-xs font-bold text-red-800">
                            Unable to load teams: {error}
                        </p>
                    </div>
                )}

                {/* ===================================================== */}
                {/* HIGH-VISIBILITY 10-TEAM LIST */}
                {/* ===================================================== */}
                {projects.length === 0 ? (
                    <section className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white p-6 text-center">
                        <div>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 text-black/40">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-lg font-black">
                                No teams registered
                            </h3>
                            <p className="mt-1 text-xs text-black/45">
                                Teams will appear here once they are added.
                            </p>
                        </div>
                    </section>
                ) : (
                    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
                        {projects.slice(0, 10).map((project, index) => {
                            const teamCode = `TEAM ${String(index + 1).padStart(2, "0")}`;

                            return (
                                <article
                                    key={project.id}
                                    className="flex flex-1 flex-col gap-3 rounded-2xl border-2 border-black/10 bg-white px-4 py-3 shadow-sm transition hover:border-black/30 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-5 sm:py-2.5"
                                >
                                    {/* TEAM NUMBER & PROJECT NAME */}
                                    <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
                                        {/* PROMINENT TEAM BADGE */}
                                        <div className="inline-flex shrink-0 items-center justify-center rounded-xl bg-black px-4 py-2 shadow-md">
                                            <span className="text-sm font-black tracking-widest text-white sm:text-base lg:text-lg">
                                                {teamCode}
                                            </span>
                                        </div>

                                        {/* PROJECT TITLE */}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-lg font-black tracking-tight text-black sm:text-xl lg:text-2xl">
                                                {project.project_name}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* CAPTAIN DETAILS & METADATA */}
                                    <div className="flex flex-wrap items-center gap-3 pl-[4.25rem] sm:shrink-0 sm:flex-nowrap sm:gap-6 sm:pl-0 lg:gap-8">
                                        {/* LARGER CAPTAIN AVATAR & NAME */}
                                        <div className="flex min-w-0 items-center gap-3">
                                            {project.captain_image ? (
                                                <img
                                                    src={project.captain_image}
                                                    alt={`${project.captain_name} captain`}
                                                    className="h-9 w-9 shrink-0 rounded-xl object-cover ring-2 ring-black/10 shadow-sm lg:h-10 lg:w-10"
                                                />
                                            ) : (
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 text-black/40 ring-1 ring-black/10 lg:h-10 lg:w-10">
                                                    <UserRound className="h-5 w-5" />
                                                </div>
                                            )}

                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-black/35">
                                                    Captain
                                                </span>
                                                <span className="truncate text-sm font-black tracking-tight text-black sm:text-base lg:text-lg">
                                                    {project.captain_name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* CATEGORY TAG */}
                                        {project.category && (
                                            <span className="hidden shrink-0 rounded-xl border border-black/10 bg-black/[0.03] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-black/60 lg:inline-block">
                                                {project.category}
                                            </span>
                                        )}

                                        {/* STATUS BADGE */}
                                        <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-700">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            Ready
                                        </span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* ===================================================== */}
                {/* FOOTER */}
                {/* ===================================================== */}
                {projects.length > 0 && (
                    <div className="mt-1.5 flex shrink-0 flex-wrap items-center justify-between gap-1 text-[10px] font-black uppercase tracking-widest text-black/40">
                        <p>
                            Displaying Top {Math.min(projects.length, 10)} Teams
                        </p>
                        <p>Live Voting List</p>
                    </div>
                )}
            </div>
        </main>
    );
}

export default VotingListPage;