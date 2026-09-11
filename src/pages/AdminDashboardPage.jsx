import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
    AlertTriangle,
    Award,
    CheckCircle2,
    Flag,
    LogOut,
    Pencil,
    Plus,
    Trash2,
    Trophy,
    UserRound,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import {
    getProjects,
    updateProjectVotes,
    incrementProjectVotes,
    decrementProjectVotes,
    deleteProject,
    announceWinner,
    cancelWinnerAnnouncement,
} from "../api/projects";

import VoteCounter from "../components/VoteCounter";
import ProjectForm from "../components/ProjectForm";

function sortProjects(projects) {
    return [...projects].sort(
        (a, b) =>
            b.vote_count - a.vote_count ||
            a.id.localeCompare(b.id)
    );
}

function WinnerConfirmModal({
    project,
    loading,
    onConfirm,
    onCancel,
}) {
    if (!project) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) {
                    onCancel();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="winner-modal-title"
                className="w-full max-w-lg overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl"
            >
                <div className="border-b border-black/10 px-6 py-6 sm:px-8">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                            <Trophy className="h-6 w-6" />
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">
                                Winner announcement
                            </p>

                            <h2
                                id="winner-modal-title"
                                className="mt-1 text-2xl font-bold text-black"
                            >
                                Ready to announce?
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-6 sm:px-8">
                    <p className="text-sm leading-6 text-black/60">
                        This will immediately show the current #1
                        project on the public{" "}
                        <span className="font-semibold text-black">
                            /charts
                        </span>{" "}
                        screen.
                    </p>

                    <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                        <div className="flex items-center gap-4">
                            {project.captain_image ? (
                                <img
                                    src={project.captain_image}
                                    alt={`${project.captain_name} captain`}
                                    className="h-16 w-16 rounded-2xl object-cover"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5 text-black/30">
                                    <UserRound className="h-7 w-7" />
                                </div>
                            )}

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-black/35">
                                    Current #1
                                </p>

                                <h3 className="mt-1 truncate text-lg font-bold text-black">
                                    {project.project_name}
                                </h3>

                                <p className="mt-1 truncate text-sm text-black/50">
                                    {project.captain_name}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-2xl font-black tabular-nums text-black">
                                    {project.vote_count}
                                </p>

                                <p className="text-[10px] font-bold uppercase tracking-widest text-black/35">
                                    votes
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="mt-4 text-xs text-black/35">
                        Make sure voting is complete before
                        confirming the announcement.
                    </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-black/10 bg-black/[0.015] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {loading
                            ? "Announcing..."
                            : "Confirm winner"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdminDashboardPage() {
    const {
        user,
        loading: authLoading,
        logout,
    } = useAuth();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    const [winnerCandidate, setWinnerCandidate] =
        useState(null);

    const [winnerActive, setWinnerActive] =
        useState(false);

    const [cancellingWinner, setCancellingWinner] =
        useState(false);

    const [announcingWinner, setAnnouncingWinner] =
        useState(false);

    useEffect(() => {
        if (!user) {
            return;
        }

        let cancelled = false;

        async function load() {
            try {
                const data = await getProjects();

                if (!cancelled) {
                    setProjects(sortProjects(data));
                    setError("");
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load projects."
                    );
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [user]);

    function handleAddProject() {
        setEditingProject(null);
        setShowForm(true);
        setError("");
    }

    function handleEditProject(project) {
        setEditingProject(project);
        setShowForm(true);
        setError("");
    }

    function handleFormCancel() {
        setShowForm(false);
        setEditingProject(null);
    }

    function handleFormSuccess(savedProject) {
        setProjects((current) =>
            sortProjects([
                ...current.filter(
                    (project) =>
                        project.id !== savedProject.id
                ),
                savedProject,
            ])
        );

        setShowForm(false);
        setEditingProject(null);
        setError("");
    }

    async function handleIncrement(projectId) {
        try {
            setError("");

            const updatedProject =
                await incrementProjectVotes(projectId);

            setProjects((current) =>
                sortProjects(
                    current.map((project) =>
                        project.id === projectId
                            ? {
                                ...project,
                                ...updatedProject,
                            }
                            : project
                    )
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to increase votes."
            );
        }
    }

    async function handleDecrement(projectId) {
        try {
            setError("");

            const updatedProject =
                await decrementProjectVotes(projectId);

            setProjects((current) =>
                sortProjects(
                    current.map((project) =>
                        project.id === projectId
                            ? {
                                ...project,
                                ...updatedProject,
                            }
                            : project
                    )
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to decrease votes."
            );
        }
    }

    async function handleDirectSave(
        projectId,
        voteCount
    ) {
        try {
            setError("");

            const updatedProject =
                await updateProjectVotes(
                    projectId,
                    voteCount
                );

            setProjects((current) =>
                sortProjects(
                    current.map((project) =>
                        project.id === projectId
                            ? {
                                ...project,
                                ...updatedProject,
                            }
                            : project
                    )
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update votes."
            );

            throw err;
        }
    }

    async function handleDelete(projectId) {
        const project = projects.find(
            (item) => item.id === projectId
        );

        if (!project) {
            return;
        }

        try {
            setError("");

            await deleteProject(projectId);

            setProjects((current) =>
                current.filter(
                    (item) => item.id !== projectId
                )
            );

            if (editingProject?.id === projectId) {
                setEditingProject(null);
                setShowForm(false);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete project."
            );
        }
    }

    function openWinnerConfirmation(project) {
        setError("");
        setWinnerCandidate(project);
    }

    function closeWinnerConfirmation() {
        if (announcingWinner) {
            return;
        }

        setWinnerCandidate(null);
    }

    async function confirmWinnerAnnouncement() {
        if (!winnerCandidate) {
            return;
        }

        try {
            setError("");
            setAnnouncingWinner(true);

            await announceWinner(
                winnerCandidate.id
            );

            setWinnerActive(true);
            setWinnerCandidate(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to announce winner."
            );
        } finally {
            setAnnouncingWinner(false);
        }
    }

    async function handleCancelWinner() {
        try {
            setError("");
            setCancellingWinner(true);

            await cancelWinnerAnnouncement();

            setWinnerActive(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to cancel winner announcement."
            );
        } finally {
            setCancellingWinner(false);
        }
    }




    async function handleLogout() {
        try {
            await logout();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to log out."
            );
        }
    }

    if (authLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white px-6">
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
            <main className="flex min-h-screen items-center justify-center bg-white px-6">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-black" />

                    <p className="mt-4 text-sm text-black/50">
                        Loading projects...
                    </p>
                </div>
            </main>
        );
    }

    const winner = projects[0] ?? null;

    return (
        <main className="min-h-screen bg-white text-black">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="rounded-3xl border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col gap-6 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                                <Flag className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-black/40">
                                    Organizer
                                </p>

                                <h1 className="text-xl font-black tracking-tight text-black sm:text-2xl">
                                    Hackathon Admin
                                </h1>

                                <p className="mt-1 text-sm text-black/45">
                                    Manage projects and official vote counts.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleAddProject}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black/85"
                            >
                                <Plus className="h-4 w-4" />
                                Add Project
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-black/5"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </header>

                {/* Error */}
                {error && (
                    <div
                        role="alert"
                        className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
                    >
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                        <div>
                            <p className="font-semibold">
                                Something went wrong
                            </p>

                            <p className="mt-1">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* Status row: current leader + live winner, side by side on larger screens */}
                {(winner || winnerActive) && (
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        {winner && (
                            <section className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 border-l-4 border-l-amber-400 bg-white px-5 py-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                        <Trophy className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-wider text-black/40">
                                            Current leader
                                        </p>

                                        <p className="mt-1 truncate font-semibold text-black">
                                            {winner.project_name}
                                        </p>

                                        <p className="truncate text-sm text-black/45">
                                            {winner.captain_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0 text-right">
                                    <p className="text-2xl font-black tabular-nums text-black">
                                        {winner.vote_count}
                                    </p>

                                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/35">
                                        votes
                                    </p>
                                </div>
                            </section>
                        )}

                        {winnerActive && (
                            <section className="flex flex-col gap-4 rounded-2xl border border-black/10 border-l-4 border-l-emerald-400 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-black/40">
                                            Winner announcement live
                                        </p>

                                        <p className="mt-1 text-sm text-black/60">
                                            Showing on the projector.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCancelWinner}
                                    disabled={cancellingWinner}
                                    className="rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {cancellingWinner
                                        ? "Closing..."
                                        : "Close Winner Screen"}
                                </button>
                            </section>
                        )}
                    </div>
                )}

                {/* Add/Edit form */}
                {showForm && (
                    <section className="mt-6">
                        <ProjectForm
                            project={editingProject}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </section>
                )}

                {/* Projects */}
                <section className="mt-6">
                    <div className="mb-4 flex items-end justify-between border-b border-black/10 pb-4">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-black">
                                Projects
                            </h2>

                            <p className="mt-1 text-sm text-black/45">
                                {projects.length}{" "}
                                {projects.length === 1
                                    ? "project"
                                    : "projects"}{" "}
                                registered
                            </p>
                        </div>
                    </div>

                    {projects.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-black/15 bg-white px-6 py-16 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 text-black/40">
                                <Plus className="h-6 w-6" />
                            </div>

                            <h3 className="mt-5 text-lg font-bold text-black">
                                No projects yet
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">
                                Add the first hackathon project to
                                start managing the leaderboard.
                            </p>

                            <button
                                type="button"
                                onClick={handleAddProject}
                                className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/85"
                            >
                                Add first project
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map(
                                (project, index) => (
                                    <article
                                        key={project.id}
                                        className="rounded-2xl border border-black/10 bg-white p-4 transition hover:border-black/20 hover:shadow-md sm:p-5"
                                    >
                                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                            {/* Project identity */}
                                            <div className="flex min-w-0 flex-1 items-center gap-4">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 text-sm font-black text-black/50">
                                                    #{index + 1}
                                                </div>

                                                {project.captain_image ? (
                                                    <img
                                                        src={
                                                            project.captain_image
                                                        }
                                                        alt={`${project.captain_name} captain`}
                                                        className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-black/10"
                                                    />
                                                ) : (
                                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-black/5 text-black/30">
                                                        <UserRound className="h-6 w-6" />
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <h3 className="truncate text-base font-bold text-black sm:text-lg">
                                                        {
                                                            project.project_name
                                                        }
                                                    </h3>

                                                    <p className="mt-0.5 truncate text-sm text-black/50">
                                                        {
                                                            project.captain_name
                                                        }
                                                    </p>

                                                    {project.category && (
                                                        <span className="mt-2 inline-flex rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black/50">
                                                            {
                                                                project.category
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Vote controls + actions, grouped together */}
                                            <div className="flex flex-col gap-4 border-t border-black/10 pt-4 lg:flex-row lg:items-center lg:gap-6 lg:border-t-0 lg:pt-0">
                                                {/* Enlarged vote counter */}
                                                <div className="flex justify-center rounded-2xl bg-black/[0.03] px-3 py-2 lg:justify-start">
                                                    <VoteCounter
                                                        value={
                                                            project.vote_count
                                                        }
                                                        onIncrement={() =>
                                                            handleIncrement(
                                                                project.id
                                                            )
                                                        }
                                                        onDecrement={() =>
                                                            handleDecrement(
                                                                project.id
                                                            )
                                                        }
                                                        onSave={(
                                                            value
                                                        ) =>
                                                            handleDirectSave(
                                                                project.id,
                                                                value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openWinnerConfirmation(
                                                                project
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                                                    >
                                                        <Trophy className="h-4 w-4" />
                                                        Make Winner
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEditProject(
                                                                project
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 bg-white px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                project.id
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* Winner confirmation modal */}
            <WinnerConfirmModal
                project={winnerCandidate}
                loading={announcingWinner}
                onConfirm={confirmWinnerAnnouncement}
                onCancel={closeWinnerConfirmation}
            />
        </main>
    );
}

export default AdminDashboardPage;