import { useState } from "react";
import { Check, Loader2, Minus, Plus, X } from "lucide-react";

function VoteCounter({
    value,
    onIncrement,
    onDecrement,
    onSave,
    disabled = false,
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(value));
    const [saving, setSaving] = useState(false);

    function startEditing() {
        setDraft(String(value));
        setEditing(true);
    }

    function cancelEditing() {
        setDraft(String(value));
        setEditing(false);
    }

    async function handleSave() {
        const nextValue = Number(draft);

        if (!Number.isInteger(nextValue) || nextValue < 0) {
            return;
        }

        try {
            setSaving(true);
            await onSave(nextValue);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="inline-flex items-center gap-2.5">
            <button
                type="button"
                onClick={onDecrement}
                disabled={disabled || value <= 0}
                aria-label="Decrease votes"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white text-black transition hover:bg-black/5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100 sm:h-14 sm:w-14"
            >
                <Minus className="h-5 w-5 sm:h-4 sm:w-5" />
            </button>

            {editing ? (
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        disabled={saving}
                        autoFocus
                        className="h-12 w-20 rounded-xl border border-black/20 bg-white text-center text-lg font-black tabular-nums text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-50 sm:h-14 sm:w-24 sm:text-xl"
                    />

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        aria-label="Save vote count"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:bg-black/85 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
                    >
                        {saving ? (
                            <Loader2 className="h-5 w-5 animate-spin sm:h-6 sm:w-6" />
                        ) : (
                            <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                        aria-label="Cancel editing"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white text-black transition hover:bg-black/5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
                    >
                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={startEditing}
                    disabled={disabled}
                    aria-label="Edit vote count"
                    className="flex h-12 min-w-[4.5rem] shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/[0.02] px-4 text-xl font-black tabular-nums text-black transition hover:bg-black/5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:h-14 sm:min-w-[5rem] sm:text-2xl"
                >
                    {value}
                </button>
            )}

            <button
                type="button"
                onClick={onIncrement}
                disabled={disabled}
                aria-label="Increase votes"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:bg-black/85 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:h-14 sm:w-14"
            >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
        </div>
    );
}

export default VoteCounter;