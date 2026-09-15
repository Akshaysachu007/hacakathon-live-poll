import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    CirclePlus,
    Edit3,
    Hash,
    Save,
    Trash2,
    Trophy,
    Users,
    X,
} from "lucide-react";
import {
    Navigate,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import {
    getVoteRounds,
    updateVoteRound,
    deleteVoteRound,
} from "../api/projects";

function formatDate(dateString) {
    return new Date(dateString).toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    );
}

function EditVoteRoundModal({
    round,
    loading,
    onSave,
    onClose,
}) {
    const [votes, setVotes] = useState({});

    useEffect(() => {
        if (!round) {
            return;
        }

        const initialVotes = {};

        (round.vote_round_entries ?? []).forEach(
            (entry) => {
                initialVotes[entry.project_id] =
                    entry.votes ?? 0;
            }
        );

        setVotes(initialVotes);
    }, [round]);

    const entries =
        round?.vote_round_entries ?? [];

    const totalVotes = useMemo(() => {
        return entries.reduce(
            (total, entry) =>
                total +
                (Number(votes[entry.project_id]) || 0),
            0
        );
    }, [entries, votes]);

    if (!round) {
        return null;
    }

    function handleVoteChange(
        projectId,
        value
    ) {
        if (value === "") {
            setVotes((current) => ({
                ...current,
                [projectId]: "",
            }));

            return;
        }

        const numericValue = Math.max(
            0,
            Number.parseInt(value, 10) || 0
        );

        setVotes((current) => ({
            ...current,
            [projectId]: numericValue,
        }));
    }

    async function handleSave() {
        const entriesToSave = entries.map(
            (entry) => ({
                project_id: entry.project_id,
                votes:
                    Number(
                        votes[entry.project_id]
                    ) || 0,
            })
        );

        await onSave(
            round.id,
            entriesToSave
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4"
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-round-title"
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl sm:rounded-3xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-black/10 px-4 py-4 sm:px-8 sm:py-5">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 sm:text-xs">
                            Edit voting record
                        </p>

                        <h2
                            id="edit-round-title"
                            className="mt-1 truncate text-xl font-black tracking-tight text-black sm:text-2xl"
                        >
                            Vote Round{" "}
                            {round.round_number}
                        </h2>

                        <p className="mt-1 text-xs text-black/45 sm:text-sm">
                            Change only the votes that were
                            entered in this round.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-black/50 transition hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Project list */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-5">
                    <div className="space-y-3">
                        {entries.map(
                            (entry, index) => (
                                <div
                                    key={entry.id}
                                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-3 sm:flex-nowrap sm:gap-4 sm:p-4"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-xs font-black text-white sm:h-10 sm:w-10">
                                        #{index + 1}
                                    </div>

                                    {entry.projects
                                        ?.captain_image ? (
                                        <img
                                            src={
                                                entry
                                                    .projects
                                                    .captain_image
                                            }
                                            alt={`${entry.projects.captain_name} captain`}
                                            className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-black/10 sm:h-12 sm:w-12"
                                        />
                                    ) : (
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/5 text-black/25 sm:h-12 sm:w-12">
                                            <Hash className="h-5 w-5" />
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1 basis-32">
                                        <p className="truncate text-sm font-bold text-black sm:text-base">
                                            {
                                                entry
                                                    .projects
                                                    ?.project_name
                                            }
                                        </p>

                                        <p className="mt-0.5 truncate text-xs text-black/45 sm:text-sm">
                                            {
                                                entry
                                                    .projects
                                                    ?.captain_name
                                            }
                                        </p>
                                    </div>

                                    <div className="ml-auto shrink-0 sm:ml-0">
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            inputMode="numeric"
                                            value={
                                                votes[
                                                entry
                                                    .project_id
                                                ] ?? 0
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                handleVoteChange(
                                                    entry.project_id,
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                loading
                                            }
                                            className="h-11 w-20 rounded-xl border border-black/15 bg-white px-3 text-center text-base font-black text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-black/5 sm:w-24"
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-black/10 bg-black/[0.02] px-4 py-4 sm:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35 sm:text-xs">
                                Updated round total
                            </p>

                            <p className="mt-1 text-xl font-black tabular-nums text-black">
                                {totalVotes}{" "}
                                <span className="text-sm font-medium text-black/40">
                                    votes
                                </span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={loading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Save className="h-4 w-4" />

                                {loading
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoundCard({
    round,
    index,
    open,
    onToggle,
    onEdit,
    onDelete,
    deletingRound,
}) {
    const entries =
        round.vote_round_entries ?? [];

    const totalVotes = useMemo(() => {
        return entries.reduce(
            (total, entry) =>
                total +
                Number(entry.votes || 0),
            0
        );
    }, [entries]);

    const projectsWithVotes =
        entries.filter(
            (entry) =>
                Number(entry.votes || 0) > 0
        ).length;

    return (
        <article className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.035)] sm:rounded-3xl">
            {/* Round header */}
            <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex min-w-0 items-center gap-3 text-left sm:gap-4"
                    aria-expanded={open}
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-sm font-black text-white sm:h-12 sm:w-12">
                        #{round.round_number}
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-black text-black sm:text-lg lg:text-xl">
                                Vote Round{" "}
                                {round.round_number}
                            </h2>

                            {index === 0 && (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                    Latest
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/40">
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                {formatDate(
                                    round.created_at
                                )}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 shrink-0" />
                                {projectsWithVotes}{" "}
                                {projectsWithVotes ===
                                    1
                                    ? "project"
                                    : "projects"}{" "}
                                received votes
                            </span>
                        </div>
                    </div>
                </button>

                {/* Round actions */}
                <div className="flex items-center gap-3 border-t border-black/10 pt-4 sm:border-t-0 sm:pt-0">
                    <div className="flex-1 sm:flex-none">
                        <p className="text-2xl font-black tabular-nums text-black">
                            {totalVotes}
                        </p>

                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
                            votes added
                        </p>
                    </div>

                    <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-none sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={() =>
                                onEdit(round)
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-black/5 sm:min-h-0 sm:text-sm"
                        >
                            <Edit3 className="h-4 w-4" />
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onDelete(round)
                            }
                            disabled={
                                deletingRound ===
                                round.id
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:text-sm"
                        >
                            <Trash2 className="h-4 w-4" />

                            {deletingRound ===
                                round.id
                                ? "Deleting..."
                                : "Delete"}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onToggle}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/[0.02] text-black/40 transition hover:bg-black/5"
                        aria-label={
                            open
                                ? "Collapse round"
                                : "Expand round"
                        }
                    >
                        {open ? (
                            <ChevronUp className="h-5 w-5" />
                        ) : (
                            <ChevronDown className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Breakdown */}
            {open && (
                <div className="border-t border-black/10 bg-black/[0.015] px-4 py-4 sm:px-6 sm:py-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/30 sm:text-xs">
                                Round breakdown
                            </p>

                            <p className="mt-1 text-xs text-black/45 sm:text-sm">
                                Votes entered during this round
                            </p>
                        </div>

                        <div className="shrink-0 rounded-xl bg-black px-3 py-2 text-xs font-bold text-white">
                            {entries.length}{" "}
                            projects
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                        <div className="hidden grid-cols-[1fr_160px_120px] border-b border-black/10 bg-black/[0.02] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black/35 md:grid">
                            <span>Project</span>

                            <span>Captain</span>

                            <span className="text-right">
                                Round votes
                            </span>
                        </div>

                        <div className="divide-y divide-black/10">
                            {entries.map(
                                (
                                    entry,
                                    entryIndex
                                ) => (
                                    <div
                                        key={
                                            entry.id
                                        }
                                        className="grid gap-3 px-3 py-3 sm:px-4 sm:py-4 md:grid-cols-[1fr_160px_120px] md:items-center"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 text-[10px] font-black text-black/45">
                                                #
                                                {entryIndex +
                                                    1}
                                            </div>

                                            {entry
                                                .projects
                                                ?.captain_image ? (
                                                <img
                                                    src={
                                                        entry
                                                            .projects
                                                            .captain_image
                                                    }
                                                    alt={`${entry.projects.captain_name} captain`}
                                                    className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 text-black/25">
                                                    <Hash className="h-4 w-4" />
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-black">
                                                    {
                                                        entry
                                                            .projects
                                                            ?.project_name
                                                    }
                                                </p>

                                                {entry
                                                    .projects
                                                    ?.category && (
                                                        <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-black/35">
                                                            {
                                                                entry
                                                                    .projects
                                                                    .category
                                                            }
                                                        </p>
                                                    )}
                                            </div>
                                        </div>

                                        <div className="pl-11 text-xs text-black/45 md:pl-0">
                                            <span className="md:hidden">
                                                Captain:{" "}
                                            </span>

                                            {
                                                entry
                                                    .projects
                                                    ?.captain_name
                                            }
                                        </div>

                                        <div className="flex items-center justify-between pl-11 md:block md:pl-0 md:text-right">
                                            <span className="text-xs font-medium text-black/35 md:hidden">
                                                Added this round
                                            </span>

                                            <span
                                                className={[
                                                    "inline-flex min-w-12 items-center justify-center rounded-xl px-3 py-2 text-sm font-black tabular-nums",
                                                    Number(
                                                        entry.votes ||
                                                        0
                                                    ) > 0
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-black/5 text-black/30",
                                                ].join(" ")}
                                            >
                                                +
                                                {Number(
                                                    entry.votes ||
                                                    0
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}

function RoundHistoryPage() {
    const navigate = useNavigate();

    const {
        user,
        loading: authLoading,
        logout,
    } = useAuth();

    const [rounds, setRounds] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [editingRound, setEditingRound] =
        useState(null);

    const [savingRound, setSavingRound] =
        useState(false);

    const [deletingRound, setDeletingRound] =
        useState(null);

    const [openRounds, setOpenRounds] =
        useState({});

    useEffect(() => {
        if (!user) {
            return;
        }

        let cancelled = false;

        async function loadRounds() {
            try {
                setLoading(true);
                setError("");

                const data =
                    await getVoteRounds();

                if (!cancelled) {
                    setRounds(data);

                    // Open the newest round automatically.
                    if (data.length > 0) {
                        setOpenRounds({
                            [data[0].id]: true,
                        });
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load vote rounds."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadRounds();

        return () => {
            cancelled = true;
        };
    }, [user]);

    function toggleRound(roundId) {
        setOpenRounds((current) => ({
            ...current,
            [roundId]:
                !current[roundId],
        }));
    }

    async function handleEditRound(
        roundId,
        entries
    ) {
        try {
            setError("");
            setSavingRound(true);

            await updateVoteRound(
                roundId,
                entries
            );

            const updatedRounds =
                await getVoteRounds();

            setRounds(updatedRounds);
            setEditingRound(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update vote round."
            );
        } finally {
            setSavingRound(false);
        }
    }

    async function handleDeleteRound(
        round
    ) {
        const confirmed =
            window.confirm(
                `Delete Vote Round ${round.round_number}? This will remove all votes from this round from the project totals.This action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setDeletingRound(round.id);

            await deleteVoteRound(
                round.id
            );

            setRounds((current) =>
                current.filter(
                    (item) =>
                        item.id !==
                        round.id
                )
            );

            setOpenRounds((current) => {
                const next = {
                    ...current,
                };

                delete next[round.id];

                return next;
            });

            if (
                editingRound?.id ===
                round.id
            ) {
                setEditingRound(null);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete vote round."
            );
        } finally {
            setDeletingRound(null);
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

    const totalAllRounds = useMemo(() => {
        return rounds.reduce(
            (roundTotal, round) =>
                roundTotal +
                (
                    round.vote_round_entries ??
                    []
                ).reduce(
                    (total, entry) =>
                        total +
                        Number(
                            entry.votes || 0
                        ),
                    0
                ),
            0
        );
    }, [rounds]);

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
                        Loading round history...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white text-black">
            <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                {/* Header */}
                <header className="rounded-2xl border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.05)] sm:rounded-3xl">
                    <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-7 sm:py-5">
                        <div className="flex items-start gap-3 sm:items-center">
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/admin/dashboard"
                                    )
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-black transition hover:bg-black/5 sm:h-11 sm:w-11"
                                aria-label="Back to dashboard"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white sm:h-11 sm:w-11">
                                <CirclePlus className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40 sm:text-xs">
                                    Organizer
                                </p>

                                <h1 className="text-lg font-black leading-tight tracking-tight sm:text-xl lg:text-2xl">
                                    Vote Round History
                                </h1>

                                <p className="mt-1 text-xs text-black/45 sm:text-sm">
                                    Review and manage every manual voting round.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-black/10 pt-4 sm:flex sm:flex-wrap sm:items-center sm:border-t-0 sm:pt-0">
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/admin/dashboard"
                                    )
                                }
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-semibold transition hover:bg-black/5 sm:text-sm"
                            >
                                Back to Dashboard
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-semibold transition hover:bg-black/5 sm:text-sm"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </header>

                {/* Error */}
                {error && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 sm:mt-5">
                        <p className="font-semibold">
                            Something went wrong
                        </p>

                        <p className="mt-1">
                            {error}
                        </p>
                    </div>
                )}

                {/* Summary */}
                <section className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-3">
                    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.035)] sm:p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/35 sm:text-xs">
                            Total rounds
                        </p>

                        <p className="mt-3 text-2xl font-black tabular-nums sm:text-3xl">
                            {rounds.length}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                            Manual vote rounds
                        </p>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.035)] sm:p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/35 sm:text-xs">
                            Votes added
                        </p>

                        <p className="mt-3 text-2xl font-black tabular-nums sm:text-3xl">
                            {totalAllRounds}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                            Across all rounds
                        </p>
                    </div>

                    <div className="rounded-2xl border border-black bg-black p-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45 sm:text-xs">
                            Latest round
                        </p>

                        <p className="mt-3 truncate text-xl font-black sm:text-2xl">
                            {rounds.length
                                ? `Round ${rounds[0].round_number} `
                                : "—"}
                        </p>

                        <p className="mt-1 text-xs text-white/45">
                            {rounds.length
                                ? formatDate(
                                    rounds[0]
                                        .created_at
                                )
                                : "No rounds yet"}
                        </p>
                    </div>
                </section>

                {/* Rounds */}
                <section className="mt-6 sm:mt-8">
                    <div className="mb-4 border-b border-black/10 pb-4 sm:mb-5 sm:pb-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-black/30">
                            Audit trail
                        </p>

                        <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl lg:text-3xl">
                            All Vote Rounds
                        </h2>

                        <p className="mt-1 text-xs text-black/45 sm:text-sm">
                            Expand a round to see exactly how many
                            votes were entered for each project.
                        </p>
                    </div>

                    {rounds.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.015] px-5 py-16 text-center sm:rounded-3xl sm:px-6 sm:py-20">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 text-black/30">
                                <Trophy className="h-6 w-6" />
                            </div>

                            <h3 className="mt-5 text-lg font-black sm:text-xl">
                                No vote rounds yet
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/45">
                                Use "Add Vote Round" from the admin
                                dashboard to create your first round.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {rounds.map(
                                (
                                    round,
                                    index
                                ) => (
                                    <RoundCard
                                        key={
                                            round.id
                                        }
                                        round={
                                            round
                                        }
                                        index={
                                            index
                                        }
                                        open={
                                            !!openRounds[
                                            round.id
                                            ]
                                        }
                                        onToggle={() =>
                                            toggleRound(
                                                round.id
                                            )
                                        }
                                        onEdit={
                                            setEditingRound
                                        }
                                        onDelete={
                                            handleDeleteRound
                                        }
                                        deletingRound={
                                            deletingRound
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
                </section>

                <footer className="mt-8 border-t border-black/10 py-6 text-center text-xs font-medium text-black/35 sm:mt-10 sm:py-8">
                    AI Infuse Hackathon · Vote Round Records
                </footer>
            </div>

            {/* Edit Round Modal */}
            {editingRound && (
                <EditVoteRoundModal
                    round={editingRound}
                    loading={savingRound}
                    onSave={handleEditRound}
                    onClose={() => {
                        if (!savingRound) {
                            setEditingRound(
                                null
                            );
                        }
                    }}
                />
            )}
        </main>
    );
}

export default RoundHistoryPage;