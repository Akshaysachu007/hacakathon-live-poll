import { supabase } from "../supabase";

const PROJECTS_TABLE = "projects";

export async function getProjects() {
    const { data, error } = await supabase
        .from(PROJECTS_TABLE)
        .select(
            `
      id,
      captain_name,
      captain_image,
      project_name,
      description,
      category,
      vote_count,
      created_at,
      updated_at
      `
        )
        .order("vote_count", { ascending: false })
        .order("id", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

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