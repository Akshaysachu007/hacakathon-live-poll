import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
    CirclePlus,
    AlertTriangle,
    CheckCircle2,
    Flag,
    LogOut,
    Pencil,
    Plus,
    Trash2,
    Trophy,
    UserRound,
    RotateCcw,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import VoteRoundModal from "../components/VoteRoundModal";
import {
    getProjects,
    updateProjectVotes,
    incrementProjectVotes,
    decrementProjectVotes,
    deleteProject,
    announceWinner,
    cancelWinnerAnnouncement,
    submitVoteRound,
    resetHackathon,
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md sm:p-6"
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
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl"
            >
                {/* Modal header */}
                <div className="border-b border-black/10 px-5 py-5 sm:px-8 sm:py-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                            <Trophy className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 sm:text-xs">
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

                {/* Modal body */}
                <div className="px-5 py-5 sm:px-8 sm:py-6">
                    <p className="text-sm leading-6 text-black/60">
                        This will immediately show the selected
                        project on the public{" "}
                        <span className="font-semibold text-black">
                            /charts
                        </span>{" "}
                        screen.
                    </p>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02]">
                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                            <div className="flex min-w-0 flex-1 items-center gap-4">
                                {project.captain_image ? (
                                    <img
                                        src={
                                            project.captain_image
                                        }
                                        alt={`${project.captain_name} captain`}
                                        className="h-14 w-14 shrink-0 rounded-2xl object-cover sm:h-16 sm:w-16"
                                    />
                                ) : (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black/5 text-black/30 sm:h-16 sm:w-16">
                                        <UserRound className="h-6 w-6 sm:h-7 sm:w-7" />
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-black/35 sm:text-xs">
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

                            <div className="flex items-center justify-between border-t border-black/10 pt-3 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
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
                    </div>

                    <p className="mt-4 text-xs leading-5 text-black/35">
                        Make sure voting is complete before
                        confirming the announcement.
                    </p>
                </div>

                {/* Modal footer */}
                <div className="flex flex-col-reverse gap-2 border-t border-black/10 bg-black/[0.015] px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
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

function ResetHackathonModal({
    loading,
    onConfirm,
    onCancel,
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md sm:p-6"
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
                aria-labelledby="reset-hackathon-title"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl"
            >
                {/* Modal header */}
                <div className="border-b border-black/10 px-5 py-5 sm:px-8 sm:py-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                <AlertTriangle className="h-6 w-6" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 sm:text-xs">
                                    Danger zone
                                </p>

                                <h2
                                    id="reset-hackathon-title"
                                    className="mt-1 text-xl font-bold text-black sm:text-2xl"
                                >
                                    Reset Hackathon?
                                </h2>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-black/50 transition hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Close"
                        >
                            <span className="text-xl leading-none">X</span>
                        </button>
                    </div>
                </div>

                {/* Modal body */}
                <div className="px-5 py-5 sm:px-8 sm:py-6">
                    <p className="text-sm leading-6 text-black/60">
                        This will permanently clear the current hackathon
                        data and return the dashboard to a fresh state.
                    </p>

                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-bold text-red-800">
                            The following will be deleted:
                        </p>

                        <div className="mt-3 space-y-2 text-xs leading-5 text-red-700 sm:text-sm">
                            <p>• All projects</p>
                            <p>• All voting rounds</p>
                            <p>• All round vote entries</p>
                            <p>• All winner announcements</p>
                        </div>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-black/35">
                        This action cannot be undone. Make sure you have
                        finished the current hackathon before continuing.
                    </p>
                </div>

                {/* Modal footer */}
                <div className="flex flex-col-reverse gap-2 border-t border-black/10 bg-black/[0.015] px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
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
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                    >
                        <RotateCcw
                            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                        />
                        {loading ? "Resetting..." : "Reset Hackathon"}
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

    const [showVoteRound, setShowVoteRound] =
        useState(false);

    const [submittingVoteRound, setSubmittingVoteRound] =
        useState(false);

    const [showResetHackathon, setShowResetHackathon] =
        useState(false);

    const [resettingHackathon, setResettingHackathon] =
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
                    setProjects(
                        stableProjectOrder(data)
                    );
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
                (project) =>
                    project.id === savedProject.id
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

            return [
                ...current,
                savedProject,
            ];
        });

        setShowForm(false);
        setEditingProject(null);
        setError("");
    }

    async function handleIncrement(projectId) {
        try {
            setError("");

            const updatedProject =
                await incrementProjectVotes(
                    projectId
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
                    : "Failed to increase votes."
            );
        }
    }

    async function handleDecrement(projectId) {
        try {
            setError("");

            const updatedProject =
                await decrementProjectVotes(
                    projectId
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
                    (item) =>
                        item.id !== projectId
                )
            );

            if (
                editingProject?.id ===
                projectId
            ) {
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

    async function handleSubmitVoteRound(entries) {
        try {
            setError("");
            setSubmittingVoteRound(true);

            await submitVoteRound(entries);

            const updatedProjects =
                await getProjects();

            setProjects(
                stableProjectOrder(
                    updatedProjects
                )
            );

            setShowVoteRound(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to submit vote round."
            );
        } finally {
            setSubmittingVoteRound(false);
        }
    }

    async function handleResetHackathon() {
        try {
            setError("");
            setResettingHackathon(true);

            await resetHackathon();

            setProjects([]);
            setWinnerCandidate(null);
            setWinnerActive(false);
            setShowForm(false);
            setEditingProject(null);
            setShowVoteRound(false);
            setShowResetHackathon(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to reset the hackathon."
            );
        } finally {
            setResettingHackathon(false);
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

    const totalVotes = projects.reduce(
        (sum, project) => sum + (project.vote_count || 0),
        0
    );

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
        return (
            <Navigate
                to="/admin"
                replace
            />
        );
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
        <main className="min-h-screen bg-[#f7f7f5] text-black">
            {/* ===================================================== */}
            {/* TOP BAR */}
            {/* ===================================================== */}

            <div className="sticky top-0 z-30 border-b border-black/10 bg-white/85 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                            <Flag className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-black/35">
                                Organizer Console
                            </p>
                            <h1 className="text-lg font-black leading-tight tracking-tight sm:text-xl">
                                Hackathon Admin
                            </h1>
                        </div>
                    </div>

                    {/* Actions — compact stacked layout below lg, single row from lg up */}
                    <div className="flex flex-col gap-2 lg:hidden">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setError("");
                                    setShowVoteRound(true);
                                }}
                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                            >
                                <Trophy className="h-4 w-4" />
                                Vote Round
                            </button>

                            <button
                                type="button"
                                onClick={handleAddProject}
                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-black px-3 text-xs font-bold text-white transition hover:bg-black/85"
                            >
                                <Plus className="h-4 w-4" />
                                Add Project
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex flex-1 items-center gap-1 rounded-xl border border-black/10 bg-black/[0.02] p-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/leaderboard")
                                    }
                                    className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold text-black/70 transition hover:bg-white hover:text-black hover:shadow-sm"
                                >
                                    <Trophy className="h-4 w-4" />
                                    Leaders
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/admin/rounds")
                                    }
                                    className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold text-black/70 transition hover:bg-white hover:text-black hover:shadow-sm"
                                >
                                    <CirclePlus className="h-4 w-4" />
                                    Rounds
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setError("");
                                    setShowResetHackathon(true);
                                }}
                                aria-label="Reset hackathon"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                aria-label="Sign out"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white text-black/60 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="hidden flex-wrap items-center gap-2 lg:flex">
                        <div className="flex items-center gap-1 rounded-xl border border-black/10 bg-black/[0.02] p-1">
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/leaderboard"
                                    )
                                }
                                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-black/70 transition hover:bg-white hover:text-black hover:shadow-sm sm:text-sm"
                            >
                                <Trophy className="h-4 w-4" />
                                Leaderboard
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/admin/rounds"
                                    )
                                }
                                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-black/70 transition hover:bg-white hover:text-black hover:shadow-sm sm:text-sm"
                            >
                                <CirclePlus className="h-4 w-4" />
                                Round History
                            </button>
                        </div>

                        <div className="mx-1 h-6 w-px bg-black/10" />

                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setShowVoteRound(
                                    true
                                );
                            }}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-100 sm:text-sm"
                        >
                            <Trophy className="h-4 w-4" />
                            Add Vote Round
                        </button>

                        <button
                            type="button"
                            onClick={handleAddProject}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-black px-3 text-xs font-bold text-white transition hover:bg-black/85 sm:text-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Add Project
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setShowResetHackathon(true);
                            }}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100 sm:text-sm"
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span>Reset</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            aria-label="Sign out"
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 text-xs font-semibold text-black/60 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:text-sm"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Sign out</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1500px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">

                {/* ===================================================== */}
                {/* ERROR */}
                {/* ===================================================== */}

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-bold text-red-800">
                                    Something went wrong
                                </p>

                                <p className="mt-1 text-xs leading-5 text-red-700 sm:text-sm">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================================================== */}
                {/* OVERVIEW STRIP */}
                {/* ===================================================== */}

                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-black/10 rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.035)]">
                    <div className="p-4 sm:p-5 lg:p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">
                            Projects
                        </p>
                        <p className="mt-2 text-2xl font-black tabular-nums text-black sm:text-3xl">
                            {projects.length}
                        </p>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">
                            Total votes
                        </p>
                        <p className="mt-2 text-2xl font-black tabular-nums text-black sm:text-3xl">
                            {totalVotes}
                        </p>
                    </div>

                    <div className="col-span-2 p-4 sm:p-5 lg:col-span-1 lg:p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">
                            Current leader
                        </p>
                        {currentLeader ? (
                            <div className="mt-2 flex items-center gap-2">
                                <p className="truncate text-base font-black text-black sm:text-lg">
                                    {currentLeader.project_name}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-2 text-base font-semibold text-black/30">
                                No votes yet
                            </p>
                        )}
                    </div>

                    <div className="col-span-2 flex items-center justify-between gap-3 border-t border-black/10 p-4 sm:p-5 lg:col-span-1 lg:justify-center lg:border-t-0 lg:p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35 lg:hidden">
                            Announcement status
                        </p>

                        {winnerActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Winner live
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-bold text-black/45">
                                Not announced
                            </span>
                        )}
                    </div>
                </section>

                {/* ===================================================== */}
                {/* LEADER / WINNER ACTION BAR */}
                {/* ===================================================== */}

                {(currentLeader || winnerActive) && (
                    <section className="mt-4">
                        {winnerActive ? (
                            <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm leading-5 text-emerald-900">
                                        The winner celebration screen
                                        is currently showing on{" "}
                                        <span className="font-semibold">
                                            /charts
                                        </span>
                                        .
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCancelWinner}
                                    disabled={cancellingWinner}
                                    className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-xl bg-black px-5 text-xs font-bold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:text-sm"
                                >
                                    {cancellingWinner
                                        ? "Closing..."
                                        : "Close Winner Screen"}
                                </button>
                            </div>
                        ) : (
                            currentLeader && (
                                <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                                            <Trophy className="h-5 w-5" />
                                        </div>
                                        <p className="min-w-0 truncate text-sm leading-5 text-black/70">
                                            <span className="font-semibold text-black">
                                                {currentLeader.project_name}
                                            </span>{" "}
                                            is currently ahead with{" "}
                                            <span className="font-semibold text-black">
                                                {currentLeader.vote_count}
                                            </span>{" "}
                                            votes.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openWinnerConfirmation(
                                                currentLeader
                                            )
                                        }
                                        className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-5 text-xs font-black text-black shadow-sm transition hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 hover:shadow-md sm:w-auto sm:text-sm"
                                    >
                                        <Trophy className="h-4 w-4" />
                                        Make Winner
                                    </button>
                                </div>
                            )
                        )}
                    </section>
                )}

                {/* ===================================================== */}
                {/* ADD / EDIT PROJECT FORM */}
                {/* ===================================================== */}

                {showForm && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-md sm:p-6"
                        role="presentation"
                        onMouseDown={(event) => {
                            if (
                                event.target === event.currentTarget
                            ) {
                                handleFormCancel();
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="project-form-title"
                            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl sm:rounded-3xl"
                        >
                            {/* Modal header */}
                            <div className="flex items-start justify-between gap-3 border-b border-black/10 px-4 py-4 sm:px-7 sm:py-5">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 sm:text-xs">
                                        Project management
                                    </p>

                                    <h2
                                        id="project-form-title"
                                        className="mt-1 truncate text-lg font-black tracking-tight text-black sm:text-2xl"
                                    >
                                        {editingProject
                                            ? "Edit Project"
                                            : "Add Project"}
                                    </h2>

                                    <p className="mt-1 text-xs text-black/45 sm:text-sm">
                                        {editingProject
                                            ? "Update the project details."
                                            : "Add a new hackathon project."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleFormCancel}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-black/50 transition hover:bg-black/5 hover:text-black sm:h-10 sm:w-10"
                                    aria-label="Close"
                                >
                                    <span className="text-xl leading-none">
                                        ×
                                    </span>
                                </button>
                            </div>

                            {/* Form */}
                            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-7 sm:py-6">
                                <ProjectForm
                                    project={editingProject}
                                    onSuccess={handleFormSuccess}
                                    onCancel={handleFormCancel}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================================================== */}
                {/* PROJECTS */}
                {/* ===================================================== */}

                <section className="mt-8">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-black sm:text-2xl">
                                Projects
                            </h2>
                            <p className="mt-1 text-xs text-black/45 sm:text-sm">
                                Ranked by votes. Positions stay
                                fixed by submission order while
                                counts update live.
                            </p>
                        </div>

                        <div className="self-start rounded-full border border-black/10 bg-white px-3 py-1.5 text-[10px] font-bold text-black/45 sm:self-auto sm:text-xs">
                            {projects.length}{" "}
                            {projects.length === 1
                                ? "project"
                                : "projects"}
                        </div>
                    </div>

                    {projects.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-black/15 bg-white px-5 py-14 text-center sm:px-6 sm:py-16">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 text-black/40">
                                <Plus className="h-6 w-6" />
                            </div>

                            <h3 className="mt-5 text-lg font-bold text-black sm:text-xl">
                                No projects yet
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-black/50 sm:text-sm">
                                Add the first hackathon project to
                                start managing the leaderboard.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleAddProject
                                }
                                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/85 sm:w-auto"
                            >
                                <Plus className="h-4 w-4" />
                                Add first project
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.035)]">
                            {/* Column headings — desktop only */}
                            <div className="hidden border-b border-black/10 bg-black/[0.015] px-6 py-3 lg:grid lg:grid-cols-[3rem_minmax(0,2fr)_minmax(0,1.1fr)_auto] lg:items-center lg:gap-5">
                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                                    #
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                                    Project
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                                    Votes
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                                    Actions
                                </span>
                            </div>

                            <div className="divide-y divide-black/[0.06]">
                                {projects.map(
                                    (
                                        project,
                                        index
                                    ) => (
                                        <article
                                            key={
                                                project.id
                                            }
                                            className="px-3 py-4 transition hover:bg-black/[0.012] sm:px-6 sm:py-5 lg:grid lg:grid-cols-[3rem_minmax(0,2fr)_minmax(0,1.1fr)_auto] lg:items-center lg:gap-5"
                                        >
                                            {/* Rank — desktop */}
                                            <div className="hidden text-sm font-black text-black/30 lg:block">
                                                {index + 1}
                                            </div>

                                            {/* Identity */}
                                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                                {project.captain_image ? (
                                                    <img
                                                        src={
                                                            project.captain_image
                                                        }
                                                        alt={`${project.captain_name} captain`}
                                                        className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-black/10 sm:h-14 sm:w-14"
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/5 text-black/30 sm:h-14 sm:w-14">
                                                        <UserRound className="h-5 w-5 sm:h-6 sm:w-6" />
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-black/5 text-[10px] font-black text-black/50 lg:hidden">
                                                            {index + 1}
                                                        </span>

                                                        <h3 className="min-w-0 truncate text-sm font-bold text-black sm:text-base">
                                                            {
                                                                project.project_name
                                                            }
                                                        </h3>
                                                    </div>

                                                    <p className="mt-0.5 truncate text-xs text-black/50 sm:text-sm">
                                                        {
                                                            project.captain_name
                                                        }
                                                    </p>

                                                    {project.category && (
                                                        <span className="mt-1.5 inline-flex max-w-full truncate rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black/50 sm:text-[10px]">
                                                            {
                                                                project.category
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Vote counter */}
                                            <div className="mt-3 flex justify-center overflow-x-auto rounded-xl bg-black/[0.02] p-2 lg:mt-0 lg:justify-start lg:overflow-visible lg:bg-transparent lg:p-0">
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
                                            <div className="mt-3 grid grid-cols-3 gap-2 lg:mt-0 lg:flex lg:shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openWinnerConfirmation(
                                                            project
                                                        )
                                                    }
                                                    aria-label="Make winner"
                                                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 lg:h-9 lg:w-9 lg:px-0"
                                                >
                                                    <Trophy className="h-4 w-4 shrink-0" />
                                                    <span className="lg:hidden">
                                                        Winner
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEditProject(
                                                            project
                                                        )
                                                    }
                                                    aria-label="Edit project"
                                                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-black/15 bg-white px-2 py-2 text-[11px] font-semibold text-black transition hover:bg-black/5 lg:h-9 lg:w-9 lg:px-0"
                                                >
                                                    <Pencil className="h-4 w-4 shrink-0" />
                                                    <span className="lg:hidden">
                                                        Edit
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            project.id
                                                        )
                                                    }
                                                    aria-label="Delete project"
                                                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2 py-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 lg:h-9 lg:w-9 lg:px-0"
                                                >
                                                    <Trash2 className="h-4 w-4 shrink-0" />
                                                    <span className="lg:hidden">
                                                        Delete
                                                    </span>
                                                </button>
                                            </div>
                                        </article>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* ===================================================== */}
                {/* MODALS */}
                {/* ===================================================== */}

                {showResetHackathon && (
                    <ResetHackathonModal
                        loading={resettingHackathon}
                        onConfirm={handleResetHackathon}
                        onCancel={() => {
                            if (!resettingHackathon) {
                                setShowResetHackathon(false);
                            }
                        }}
                    />
                )}

                <WinnerConfirmModal
                    project={winnerCandidate}
                    loading={announcingWinner}
                    onConfirm={
                        confirmWinnerAnnouncement
                    }
                    onCancel={
                        closeWinnerConfirmation
                    }
                />

                {showVoteRound && (
                    <VoteRoundModal
                        projects={projects}
                        loading={
                            submittingVoteRound
                        }
                        onSubmit={
                            handleSubmitVoteRound
                        }
                        onClose={() => {
                            if (
                                !submittingVoteRound
                            ) {
                                setShowVoteRound(
                                    false
                                );
                            }
                        }}
                    />
                )}
            </div>
        </main>
    );
}

export default AdminDashboardPage;