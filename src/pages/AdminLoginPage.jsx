import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "../supabase";

function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setError("Invalid email or password.");
            return;
        }

        window.location.href = "/admin/dashboard";
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-white px-4">
            <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-black tracking-tight text-black">
                        HACA
                    </h1>

                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                        Admin Login
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-3"
                >
                    <div>
                        <label
                            htmlFor="email"
                            className="sr-only"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            placeholder="Email"
                            required
                            disabled={loading}
                            className="w-full rounded-lg border border-black/15 bg-black/[0.02] px-3.5 py-2.5 text-sm text-black outline-none transition placeholder:text-black/40 focus:border-black/40 focus:bg-white focus:ring-1 focus:ring-black/10 disabled:opacity-40"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="sr-only"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Password"
                            required
                            disabled={loading}
                            className="w-full rounded-lg border border-black/15 bg-black/[0.02] px-3.5 py-2.5 text-sm text-black outline-none transition placeholder:text-black/40 focus:border-black/40 focus:bg-white focus:ring-1 focus:ring-black/10 disabled:opacity-40"
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {loading && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-black/40">
                    Organizer access only.
                </p>
            </div>
        </main>
    );
}

export default AdminLoginPage;