import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
    AlertTriangle,
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

function stableProjectOrder(projects) {
    return [...projects].sort(
        (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime() ||
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !loading
                ) {
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
                <div className="border-b border-black/10 px-5 py-5 sm:px-8 sm:py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                            <Trophy className="h-6 w-6" />
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">
                                Winner announcement
                            </p>

                            <h2
                                id="winner-modal-title"
                                className="mt-1 text-xl font-bold text-black sm:text-2xl"
                            >
                                Ready to announce?
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-5 sm:px-8 sm:py-6">
                    <p className="text-sm leading-6 text-black/60">
                        This will immediately show the selected
                        project on the public{" "}
                        <span className="font-semibold text-black">
                            /charts
                        </span>{" "}
                        screen.
                    </p>

                    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-black/10 bg-black/[0.02] p-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4 sm:flex-1">
                            {project.captain_image ? (
                                <img
                                    src={project.captain_image}
                                    alt={`${project.captain_name} captain`}
                                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                                />
                            ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black/5 text-black/30">
                                    <UserRound className="h-7 w-7" />
                                </div>
                            )}

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-black/35">
                                    Selected winner
                                </p>

                                <h3 className="mt-1 truncate text-base font-bold text-black sm:text-lg">
                                    {project.project_name}
                                </h3>

                                <p className="mt-1 truncate text-sm text-black/50">
                                    {project.captain_name}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-black/10 pt-4 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/35 sm:hidden">
                                Final Votes
                            </p>
                            <div>
                                <p className="text-2xl font-black tabular-nums text-black">
                                    {project.vote_count}
                                </p>
                                <p className="hidden text-[10px] font-bold uppercase tracking-widest text-black/35 sm:block">
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

                <div className="flex flex-col-reverse gap-3 border-t border-black/10 bg-black/[0.015] px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="w-full rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="w-full rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
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

    const navigate = useNavigate();

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
                setLoading(true);
                setError("");

                const data = await getProjects();

                if (!cancelled) {
                    setProjects(stableProjectOrder(data));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load projects."
                    );
                }
            } finally {
                if (!cancelled) {
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
        setProjects((current) => {
            const exists = current.some(
                (project) => project.id === savedProject.id
            );

            if (exists) {
                return current.map((project) =>
                    project.id === savedProject.id
                        ? {
                            ...project,
                            ...savedProject,
                        }
                        : project
                );
            }

            return [...current, savedProject];
        });

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
                current.map((project) =>
                    project.id === projectId
                        ? {
                            ...project,
                            ...updatedProject,
                        }
                        : project
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
                current.map((project) =>
                    project.id === projectId
                        ? {
                            ...project,
                            ...updatedProject,
                        }
                        : project
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
                current.map((project) =>
                    project.id === projectId
                        ? {
                            ...project,
                            ...updatedProject,
                        }
                        : project
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
        if (!project) {
            return;
        }
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

    const currentLeader =
        projects.length > 0
            ? projects.reduce(
                (leader, project) =>
                    project.vote_count >
                        leader.vote_count
                        ? project
                        : leader,
                projects[0]
            )
            : null;

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

    return (
        <main className="min-h-screen bg-white text-black">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="rounded-3xl border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col gap-6 px-5 py-5 lg:flex-row lg:items-center lg:justify-between sm:px-7">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white">
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

                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                            <button
                                type="button"
                                onClick={() => navigate("/leaderboard")}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-blue-700 hover:text-amber-50 sm:w-auto"
                            >
                                <Trophy className="h-4 w-4" />
                                View Leaderboard
                            </button>

                            <button
                                type="button"
                                onClick={handleAddProject}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 sm:w-auto"
                            >
                                <Plus className="h-4 w-4" />
                                Add Project
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-red-400 hover:text-white hover:border-red-400 sm:w-auto"
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
                            <p className="font-semibold">Something went wrong</p>
                            <p className="mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Current leader + winner announcement */}
                {(currentLeader || winnerActive) && (
                    <div className={`mt-5 grid gap-4 ${currentLeader && winnerActive ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                        {currentLeader && (
                            <section className="flex flex-col gap-5 rounded-2xl border border-black/10 border-l-4 border-l-amber-400 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 sm:h-10 sm:w-10">
                                        <Trophy className="h-6 w-6 sm:h-5 sm:w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-wider text-black/40">
                                            Current leader
                                        </p>
                                        <p className="mt-1 truncate font-semibold text-black">
                                            {currentLeader.project_name}
                                        </p>
                                        <p className="truncate text-sm text-black/45">
                                            {currentLeader.captain_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col shrink-0 gap-4 sm:flex-row sm:items-center">
                                    <div className="flex items-center justify-between border-t border-black/10 pt-3 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/35 sm:hidden">
                                            Votes
                                        </p>
                                        <div>
                                            <p className="text-2xl font-black tabular-nums text-black">
                                                {currentLeader.vote_count}
                                            </p>
                                            <p className="hidden text-[10px] font-bold uppercase tracking-widest text-black/35 sm:block">
                                                votes
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => openWinnerConfirmation(currentLeader)}
                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-4 py-2.5 text-sm font-bold text-black shadow-sm transition hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 hover:shadow-md sm:w-auto"
                                    >
                                        <Trophy className="h-4 w-4" />
                                        Make Winner
                                    </button>
                                </div>
                            </section>
                        )}

                        {winnerActive && (
                            <section className="flex flex-col gap-4 rounded-2xl border border-black/10 border-l-4 border-l-emerald-400 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:h-10 sm:w-10">
                                        <CheckCircle2 className="h-6 w-6 sm:h-5 sm:w-5" />
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
                                    className="w-full rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                                >
                                    {cancellingWinner ? "Closing..." : "Close Winner Screen"}
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
                                {projects.length} {projects.length === 1 ? "project" : "projects"} registered
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
                                Add the first hackathon project to start managing the leaderboard.
                            </p>
                            <button
                                type="button"
                                onClick={handleAddProject}
                                className="mt-6 inline-flex w-full justify-center rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/85 sm:w-auto"
                            >
                                Add first project
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {projects.map((project, index) => (
                                <article
                                    key={project.id}
                                    className="rounded-2xl border border-black/10 bg-white p-4 transition hover:border-black/20 hover:shadow-md sm:p-5 lg:p-6"
                                >
                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                        {/* Project identity */}
                                        <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
                                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 text-sm font-black text-black/50 sm:flex">
                                                #{index + 1}
                                            </div>

                                            {project.captain_image ? (
                                                <img
                                                    src={project.captain_image}
                                                    alt={`${project.captain_name} captain`}
                                                    className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-black/10 sm:h-14 sm:w-14"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-black/5 text-black/30 sm:h-14 sm:w-14">
                                                    <UserRound className="h-7 w-7 sm:h-6 sm:w-6" />
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-[10px] font-black text-black/50 sm:hidden">
                                                        {index + 1}
                                                    </span>
                                                    <h3 className="truncate text-base font-bold text-black sm:text-lg">
                                                        {project.project_name}
                                                    </h3>
                                                </div>
                                                <p className="mt-1 truncate text-sm text-black/50 sm:mt-0.5">
                                                    {project.captain_name}
                                                </p>
                                                {project.category && (
                                                    <span className="mt-2 inline-flex rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black/50">
                                                        {project.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Vote controls + actions */}
                                        <div className="flex flex-col gap-4 border-t border-black/10 pt-4 md:flex-row md:items-center md:justify-between xl:w-auto xl:gap-6 xl:border-t-0 xl:pt-0">
                                            <div className="flex justify-center rounded-2xl bg-black/[0.03] px-3 py-2 md:justify-start">
                                                <VoteCounter
                                                    value={project.vote_count}
                                                    onIncrement={() => handleIncrement(project.id)}
                                                    onDecrement={() => handleDecrement(project.id)}
                                                    onSave={(value) => handleDirectSave(project.id, value)}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center xl:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => openWinnerConfirmation(project)}
                                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 sm:w-auto sm:px-3.5 sm:py-2"
                                                >
                                                    <Trophy className="h-4 w-4" />
                                                    Make Winner
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleEditProject(project)}
                                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-black/5 sm:w-auto sm:px-3.5 sm:py-2"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(project.id)}
                                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 sm:w-auto sm:px-3.5 sm:py-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
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