import { supabase } from "../supabase";

const PROJECTS_TABLE = "projects";

export async function getProjects({ sortByVotes = true } = {}) {
    let query = supabase
        .from(PROJECTS_TABLE)
        .select(`
            id,
            captain_name,
            captain_image,
            project_name,
            description,
            category,
            vote_count,
            created_at,
            updated_at
        `);

    if (sortByVotes) {
        query = query
            .order("vote_count", { ascending: false })
            .order("id", { ascending: true });
    } else {
        // Stable order for the admin voting screen.
        // Projects never move when their vote count changes.
        query = query
            .order("created_at", { ascending: true })
            .order("id", { ascending: true });
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return data ?? [];
}

export async function updateProjectVotes(projectId, voteCount) {
    if (!Number.isInteger(voteCount) || voteCount < 0) {
        throw new Error("Vote count must be a non-negative integer.");
    }

    const { data, error } = await supabase
        .from(PROJECTS_TABLE)
        .update({
            vote_count: voteCount,
            updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function incrementProjectVotes(projectId) {
    const { data, error } = await supabase.rpc(
        "increment_project_votes",
        {
            project_id: projectId,
            amount: 1,
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function decrementProjectVotes(projectId) {
    const { data, error } = await supabase.rpc(
        "decrement_project_votes",
        {
            project_id: projectId,
            amount: 1,
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    return data;
}


export function subscribeToProjects(callback) {
    const channel = supabase
        .channel("projects-live")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "projects",
            },
            async () => {
                try {
                    const projects = await getProjects();
                    callback(projects);
                } catch (error) {
                    console.error(
                        "Failed to refresh projects:",
                        error
                    );
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}


export async function deleteProject(projectId) {
    const { error } = await supabase
        .from(PROJECTS_TABLE)
        .delete()
        .eq("id", projectId);

    if (error) {
        throw new Error(error.message);
    }
}


export async function announceWinner(projectId) {
    const { data, error } = await supabase.rpc(
        "announce_winner",
        {
            winner_project_id: projectId,
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function cancelWinnerAnnouncement() {
    const { data, error } = await supabase.rpc(
        "cancel_winner_announcement"
    );

    if (error) {
        throw new Error(error.message);
    }

    return data;
}


export async function submitVoteRound(roundEntries) {
    if (!Array.isArray(roundEntries)) {
        throw new Error("Round entries must be an array.");
    }

    const cleanedEntries = roundEntries.map((entry) => {
        const votes = Number(entry.votes);

        if (!entry.project_id) {
            throw new Error("Project ID is required.");
        }

        if (!Number.isInteger(votes) || votes < 0) {
            throw new Error(
                "Each project's round vote count must be a non-negative integer."
            );
        }

        return {
            project_id: entry.project_id,
            votes,
        };
    });

    const { data, error } = await supabase.rpc(
        "submit_vote_round",
        {
            round_entries: cleanedEntries,
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    return data;
}



export async function getVoteRounds() {
    const { data, error } = await supabase
        .from("vote_rounds")
        .select(`
            id,
            round_number,
            created_at,
            created_by,
            vote_round_entries (
                id,
                project_id,
                votes,
                created_at,
                projects (
                    id,
                    project_name,
                    captain_name,
                    captain_image,
                    category,
                    vote_count
                )
            )
        `)
        .order("round_number", {
            ascending: false,
        });

    if (error) {
        throw new Error(error.message);
    }

    return data ?? [];
}

export async function getVoteRound(roundId) {
    const { data, error } = await supabase
        .from("vote_rounds")
        .select(`
            id,
            round_number,
            created_at,
            created_by,
            vote_round_entries (
                id,
                project_id,
                votes,
                created_at,
                projects (
                    id,
                    project_name,
                    captain_name,
                    captain_image,
                    category,
                    vote_count
                )
            )
        `)
        .eq("id", roundId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}



export async function updateVoteRound(
    roundId,
    roundEntries
) {
    if (!roundId) {
        throw new Error("Round ID is required.");
    }

    if (!Array.isArray(roundEntries)) {
        throw new Error(
            "Round entries must be an array."
        );
    }

    const cleanedEntries = roundEntries.map((entry) => {
        const votes = Number(entry.votes);

        if (!entry.project_id) {
            throw new Error("Project ID is required.");
        }

        if (!Number.isInteger(votes) || votes < 0) {
            throw new Error(
                "Each project's vote count must be a non-negative integer."
            );
        }

        return {
            project_id: entry.project_id,
            votes,
        };
    });

    const { data, error } = await supabase.rpc(
        "update_vote_round",
        {
            target_round_id: roundId,
            updated_entries: cleanedEntries,
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function deleteVoteRound(roundId) {
    if (!roundId) {
        throw new Error("Round ID is required.");
    }

    const { data, error } = await supabase.rpc(
        "delete_vote_round",
        {
            target_round_id: roundId,
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    return data;
}



export async function resetHackathon() {
    const { data, error } = await supabase.rpc("reset_hackathon");

    if (error) {
        throw new Error(error.message);
    }

    return data;
}