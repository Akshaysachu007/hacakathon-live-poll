import { useEffect, useState } from "react";
import {
    ImagePlus,
    Loader2,
    User,
    Vote,
} from "lucide-react";
import { supabase } from "../supabase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const FIELD_CLASS =
    "w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-black outline-none transition placeholder:text-black/30 focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-40";

const LABEL_CLASS =
    "mb-2 flex items-center gap-1.5 text-sm font-medium text-black/70";

function ProjectForm({
    project = null,
    onSuccess,
    onCancel,
}) {
    const isEditing = Boolean(project);

    const [projectName, setProjectName] = useState(
        project?.project_name ?? ""
    );

    const [captainName, setCaptainName] = useState(
        project?.captain_name ?? ""
    );

    const [description, setDescription] = useState(
        project?.description ?? ""
    );

    const [category, setCategory] = useState(
        project?.category ?? ""
    );

    const [voteCount, setVoteCount] = useState(
        String(project?.vote_count ?? 0)
    );

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(
        project?.captain_image ?? ""
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /*
     * Keep the form synchronized when the selected project changes.
     * This is useful when clicking Edit on different projects.
     */
    useEffect(() => {
        setProjectName(project?.project_name ?? "");
        setCaptainName(project?.captain_name ?? "");
        setDescription(project?.description ?? "");
        setCategory(project?.category ?? "");
        setVoteCount(
            String(project?.vote_count ?? 0)
        );

        setImageFile(null);
        setImagePreview(project?.captain_image ?? "");
        setError("");
    }, [project]);

    /*
     * Clean up temporary object URLs created for image previews.
     */
    useEffect(() => {
        return () => {
            if (
                imagePreview &&
                imagePreview.startsWith("blob:")
            ) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    function handleImageChange(event) {
        const file = event.target.files?.[0] ?? null;

        setError("");

        if (!file) {
            setImageFile(null);
            setImagePreview(
                project?.captain_image ?? ""
            );
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setError(
                "Please select a JPG, PNG, or WebP image."
            );

            event.target.value = "";
            setImageFile(null);
            setImagePreview(
                project?.captain_image ?? ""
            );

            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setError(
                "Image must be smaller than 5 MB."
            );

            event.target.value = "";
            setImageFile(null);
            setImagePreview(
                project?.captain_image ?? ""
            );

            return;
        }

        const previewUrl = URL.createObjectURL(file);

        setImageFile(file);
        setImagePreview(previewUrl);
    }

    async function uploadImage(file, projectId) {
        const extension =
            file.name.split(".").pop()?.toLowerCase() ||
            "jpg";

        const filePath = `${projectId}/captain.${extension}`;

        const { error: uploadError } =
            await supabase.storage
                .from("captain-images")
                .upload(filePath, file, {
                    upsert: true,
                    contentType: file.type,
                    cacheControl: "3600",
                });

        if (uploadError) {
            throw new Error(
                `Image upload failed: ${uploadError.message}`
            );
        }

        const {
            data: { publicUrl },
        } = supabase.storage
            .from("captain-images")
            .getPublicUrl(filePath);

        if (!publicUrl) {
            throw new Error(
                "Image uploaded, but its public URL could not be generated."
            );
        }

        /*
         * Add a cache-busting query parameter so a replaced image
         * is immediately visible in the browser.
         */
        return `${publicUrl}?v=${Date.now()}`;
    }

    async function createProject() {
        const { data, error: insertError } =
            await supabase
                .from("projects")
                .insert({
                    project_name: projectName.trim(),
                    captain_name: captainName.trim(),
                    description:
                        description.trim() || null,
                    category:
                        category.trim() || null,
                    vote_count: Number(voteCount),
                    captain_image: "pending",
                })
                .select()
                .single();

        if (insertError) {
            throw new Error(
                `Failed to create project: ${insertError.message}`
            );
        }

        return data;
    }

    async function updateProject(
        projectId,
        captainImage
    ) {
        const { data, error: updateError } =
            await supabase
                .from("projects")
                .update({
                    project_name: projectName.trim(),
                    captain_name: captainName.trim(),
                    description:
                        description.trim() || null,
                    category:
                        category.trim() || null,
                    vote_count: Number(voteCount),
                    captain_image: captainImage,
                    updated_at:
                        new Date().toISOString(),
                })
                .eq("id", projectId)
                .select()
                .single();

        if (updateError) {
            throw new Error(
                `Failed to save project: ${updateError.message}`
            );
        }

        return data;
    }



    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        const trimmedProjectName =
            projectName.trim();

        const trimmedCaptainName =
            captainName.trim();

        const votes = Number(voteCount);

        if (!trimmedProjectName) {
            setError(
                "Project name is required."
            );
            return;
        }

        if (!trimmedCaptainName) {
            setError(
                "Captain name is required."
            );
            return;
        }

        if (
            !Number.isInteger(votes) ||
            votes < 0
        ) {
            setError(
                "Vote count must be a non-negative whole number."
            );
            return;
        }

        if (!isEditing && !imageFile) {
            setError(
                "Captain image is required for a new project."
            );
            return;
        }

        try {
            setLoading(true);

            let projectId = project?.id;
            let captainImage =
                project?.captain_image ?? "";

            /*
             * Create the database record first so we have
             * a stable project ID for the Storage path.
             */
            if (!isEditing) {
                const createdProject =
                    await createProject();

                projectId = createdProject.id;
            }

            /*
             * Upload a new image when one has been selected.
             */
            if (imageFile) {
                captainImage = await uploadImage(
                    imageFile,
                    projectId
                );
            }

            /*
             * Never allow "pending" to remain as the final image
             * for a new project.
             */
            if (!captainImage) {
                throw new Error(
                    "Captain image is required."
                );
            }

            const savedProject =
                await updateProject(
                    projectId,
                    captainImage
                );

            onSuccess(savedProject);
        } catch (err) {
            /*
             * If a new project was created but something failed
             * afterward, the project may remain in the database.
             * We leave cleanup for the next service-layer refactor
             * rather than hiding the actual error from the organizer.
             */
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save project."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] sm:p-8"
        >
            <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                        {isEditing
                            ? "Edit"
                            : "New project"}
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-black">
                        {isEditing
                            ? "Edit Project"
                            : "Add Project"}
                    </h2>

                    <p className="mt-1 text-sm text-black/45">
                        Enter the project information and organizer-managed vote count.
                    </p>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
                {/* Project name */}
                <div className="lg:col-span-2">
                    <label
                        htmlFor="project-name"
                        className={LABEL_CLASS}
                    >
                        Project name
                    </label>

                    <input
                        id="project-name"
                        type="text"
                        value={projectName}
                        onChange={(event) =>
                            setProjectName(
                                event.target.value
                            )
                        }
                        placeholder="e.g. Smart Campus"
                        maxLength={150}
                        required
                        disabled={loading}
                        className={FIELD_CLASS}
                    />
                </div>

                {/* Captain name */}
                <div>
                    <label
                        htmlFor="captain-name"
                        className={LABEL_CLASS}
                    >
                        <User className="h-3.5 w-3.5 text-black/40" />
                        Captain name
                    </label>

                    <input
                        id="captain-name"
                        type="text"
                        value={captainName}
                        onChange={(event) =>
                            setCaptainName(
                                event.target.value
                            )
                        }
                        placeholder="e.g. Rahul Kumar"
                        maxLength={150}
                        required
                        disabled={loading}
                        className={FIELD_CLASS}
                    />
                </div>

                {/* Category */}
                <div>
                    <label
                        htmlFor="category"
                        className={LABEL_CLASS}
                    >
                        Category
                    </label>

                    <input
                        id="category"
                        type="text"
                        value={category}
                        onChange={(event) =>
                            setCategory(
                                event.target.value
                            )
                        }
                        placeholder="e.g. AI / Web / IoT"
                        maxLength={100}
                        disabled={loading}
                        className={FIELD_CLASS}
                    />
                </div>

                {/* Description */}
                <div className="lg:col-span-2">
                    <label
                        htmlFor="description"
                        className={LABEL_CLASS}
                    >
                        Description
                    </label>

                    <textarea
                        id="description"
                        value={description}
                        onChange={(event) =>
                            setDescription(
                                event.target.value
                            )
                        }
                        placeholder="Brief project description..."
                        maxLength={1000}
                        rows={4}
                        disabled={loading}
                        className={`${FIELD_CLASS} resize-none`}
                    />
                </div>

                {/* Vote count */}
                <div>
                    <label
                        htmlFor="vote-count"
                        className={LABEL_CLASS}
                    >
                        <Vote className="h-3.5 w-3.5 text-black/40" />
                        Vote count
                    </label>

                    <input
                        id="vote-count"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={voteCount}
                        onChange={(event) =>
                            setVoteCount(
                                event.target.value
                            )
                        }
                        required
                        disabled={loading}
                        className={FIELD_CLASS}
                    />

                    <p className="mt-2 text-xs text-black/40">
                        Votes cannot be negative.
                    </p>
                </div>

                {/* Image */}
                <div>
                    <label
                        htmlFor="captain-image"
                        className={LABEL_CLASS}
                    >
                        <ImagePlus className="h-3.5 w-3.5 text-black/40" />
                        Captain image
                    </label>

                    <input
                        id="captain-image"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        required={!isEditing}
                        disabled={loading}
                        className="block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm text-black/60 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-black/80 disabled:opacity-40"
                    />

                    <p className="mt-2 text-xs text-black/40">
                        JPG, PNG, or WebP. Maximum 5 MB.
                    </p>
                </div>
            </div>

            {/* Image preview */}
            {imagePreview && (
                <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                    <p className="mb-3 text-sm font-semibold text-black/70">
                        {imageFile
                            ? "New image preview"
                            : "Current image"}
                    </p>

                    <img
                        src={imagePreview}
                        alt={`${captainName || "Captain"} preview`}
                        className="h-40 w-40 rounded-2xl object-cover ring-1 ring-black/10"
                    />
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-black/10 pt-6 sm:flex-row sm:justify-end">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Cancel
                    </button>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {loading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {loading
                        ? "Saving..."
                        : isEditing
                            ? "Save changes"
                            : "Add project"}
                </button>
            </div>
        </form>
    );
}

export default ProjectForm;