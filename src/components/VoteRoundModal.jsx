import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    Hash,
    X,
} from "lucide-react";

function VoteRoundModal({
    projects,
    loading,
    onSubmit,
    onClose,
}) {
    const [votes, setVotes] = useState({});

    useEffect(() => {
        const initialVotes = {};

        projects.forEach((project) => {
            initialVotes[project.id] = 0;
        });

        setVotes(initialVotes);
    }, [projects]);

    const totalRoundVotes = useMemo(() => {
        return Object.values(votes).reduce(
            (total, value) =>
                total + (Number(value) || 0),
            0
        );
    }, [votes]);

    function handleVoteChange(projectId, value) {
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

    async function handleSubmit() {
        const entries = projects.map((project) => ({
            project_id: project.id,
            votes: Number(votes[project.id]) || 0,
        }));

        await onSubmit(entries);
    }

    if (!projects.length) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !loading
                ) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="vote-round-title"
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-black/10 px-6 py-5 sm:px-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/35">
                            Manual voting
                        </p>

                        <h2
                            id="vote-round-title"
                            className="mt-1 text-2xl font-black tracking-tight text-black"
                        >
                            Add Vote Round
                        </h2>

                        <p className="mt-1 text-sm text-black/45">
                            Enter votes for this round. Current
                            totals are not shown here.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-black/50 transition hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Project list */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
                    <div className="space-y-3">
                        {projects.map((project, index) => (
                            <div
                                key={project.id}
                                className="flex items-center gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-3 sm:gap-4 sm:p-4"
                            >
                                {/* Position */}
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-xs font-black text-white sm:h-10 sm:w-10">
                                    #{index + 1}
                                </div>

                                {/* Image */}
                                {project.captain_image ? (
                                    <img
                                        src={
                                            project.captain_image
                                        }
                                        alt={`${project.captain_name} captain`}
                                        className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-black/10 sm:h-12 sm:w-12"
                                    />
                                ) : (
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/5 text-black/30 sm:h-12 sm:w-12">
                                        <Hash className="h-5 w-5" />
                                    </div>
                                )}

                                {/* Project name */}
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-sm font-bold text-black sm:text-base">
                                        {project.project_name}
                                    </h3>

                                    <p className="mt-0.5 truncate text-xs text-black/45 sm:text-sm">
                                        {project.captain_name}
                                    </p>
                                </div>

                                {/* Round votes */}
                                <div className="flex shrink-0 items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        inputMode="numeric"
                                        value={
                                            votes[project.id] ?? 0
                                        }
                                        onChange={(event) =>
                                            handleVoteChange(
                                                project.id,
                                                event.target.value
                                            )
                                        }
                                        disabled={loading}
                                        className="h-11 w-20 rounded-xl border border-black/15 bg-white px-3 text-center text-base font-black text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-black/5 sm:w-24"
                                    />

                                    <span className="hidden text-xs font-semibold text-black/35 sm:block">
                                        votes
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-black/10 bg-black/[0.02] px-6 py-4 sm:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/35">
                                This round
                            </p>

                            <div className="mt-1 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                                <span className="text-lg font-black tabular-nums text-black">
                                    {totalRoundVotes}
                                </span>

                                <span className="text-sm font-medium text-black/40">
                                    total votes
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
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
                                onClick={handleSubmit}
                                disabled={loading}
                                className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {loading
                                    ? "Submitting..."
                                    : "Submit Vote Round"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VoteRoundModal;