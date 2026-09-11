import { useEffect, useState } from "react";
import {
    getProjects,
    subscribeToProjects,
} from "../api/projects";

export function useProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await getProjects();

                if (!cancelled) {
                    setProjects(data);
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
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToProjects((data) => {
            setProjects(data);
            setError("");
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return {
        projects,
        loading,
        error,
    };
}