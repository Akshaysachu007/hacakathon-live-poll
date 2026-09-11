import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadSession() {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (mounted) {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        }

        loadSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    async function logout() {
        await supabase.auth.signOut();
    }

    return {
        user,
        loading,
        logout,
    };
}