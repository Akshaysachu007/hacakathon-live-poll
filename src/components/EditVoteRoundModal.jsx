import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

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
                    entry.votes;
            }
        );

        setVotes(initialVotes);
    }, [round]);

    const totalVotes = useMemo(() => {
        return Object.values(votes).reduce(
            (total, value) =>
                total + (Number(value) || 0),
            0
        );
    }, [votes]);

    if (!round) {
        return null;
    }

    const entries =
        round.vote_round_entries ?? [];

    function handleChange(projectId, value) {
        setVotes((current) => ({
            ...current,
            [projectId]:
                value === ""
                    ? ""
                    : Math.max(
                        0,
                        Number.parseInt(
                            value,
                            10
                        ) || 0
                    ),
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/35">
                            Edit voting record
                        </p>

                        <h2 className="mt-1 text-2xl font-black">
                            Round {round.round_number}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 hover:bg-black/5"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    <div className="space-y-3">
                        {entries.map(
                            (entry, index) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center gap-4 rounded-2xl border border-black/10 bg-black/[0.02] p-4"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-xs font-black text-white">
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
                                            alt=""
                                            className="h-11 w-11 shrink-0 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="h-11 w-11 shrink-0 rounded-xl bg-black/5" />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold">
                                            {
                                                entry
                                                    .projects
                                                    ?.project_name
                                            }
                                        </p>

                                        <p className="truncate text-xs text-black/45">
                                            {
                                                entry
                                                    .projects
                                                    ?.captain_name
                                            }
                                        </p>
                                    </div>

                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={
                                            votes[
                                            entry
                                                .project_id
                                            ] ?? 0
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            handleChange(
                                                entry.project_id,
                                                event.target
                                                    .value
                                            )
                                        }
                                        disabled={loading}
                                        className="h-11 w-20 rounded-xl border border-black/15 bg-white px-3 text-center font-black outline-none focus:border-black"
                                    />
                                </div>
                            )
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-black/10 bg-black/[0.02] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-black/35">
                            Round total
                        </p>

                        <p className="text-xl font-black">
                            {totalVotes} votes
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-semibold"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading}
                            className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
                        >
                            {loading
                                ? "Saving..."
                                : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditVoteRoundModal;