import { z } from "zod";
import { getApiBaseUrl } from "@/env";

const NoteSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).default([]),
  is_favorite: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const NotesListSchema = z.object({
  items: z.array(NoteSchema),
  total: z.number().int()
});

const NoteVersionSummarySchema = z.object({
  note_id: z.number().int(),
  version_id: z.string(),
  created_at: z.string(),
  message: z.string().default("")
});

const NoteVersionsListSchema = z.object({
  items: z.array(NoteVersionSummarySchema)
});

export type Note = z.infer<typeof NoteSchema>;
export type NotesList = z.infer<typeof NotesListSchema>;
export type NoteVersionSummary = z.infer<typeof NoteVersionSummarySchema>;
export type NoteVersionsList = z.infer<typeof NoteVersionsListSchema>;

export type NoteCreate = {
  title: string;
  content: string;
  tags: string[];
};

export type NoteUpdate = {
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  is_favorite?: boolean | null;
};

async function http<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status} ${res.statusText} on ${path}${text ? `: ${text}` : ""}`);
  }

  const json = (await res.json()) as unknown;
  return schema ? schema.parse(json) : (json as T);
}

// PUBLIC_INTERFACE
export async function listNotes(params: {
  tag?: string;
  favorites_only?: boolean;
  limit?: number;
}): Promise<NotesList> {
  /** List notes from backend. */
  const usp = new URLSearchParams();
  if (params.tag) usp.set("tag", params.tag);
  if (params.favorites_only) usp.set("favorites_only", "true");
  if (params.limit) usp.set("limit", String(params.limit));
  const suffix = usp.toString() ? `?${usp.toString()}` : "";
  return http(`/notes${suffix}`, undefined, NotesListSchema);
}

// PUBLIC_INTERFACE
export async function searchNotes(params: {
  q: string;
  tag?: string;
  favorites_only?: boolean;
  limit?: number;
}): Promise<NotesList> {
  /** Search notes by title/content. */
  const usp = new URLSearchParams();
  usp.set("q", params.q);
  if (params.tag) usp.set("tag", params.tag);
  if (params.favorites_only) usp.set("favorites_only", "true");
  if (params.limit) usp.set("limit", String(params.limit));
  return http(`/notes/search?${usp.toString()}`, undefined, NotesListSchema);
}

// PUBLIC_INTERFACE
export async function getNote(noteId: number): Promise<Note> {
  /** Fetch a single note by id. */
  return http(`/notes/${noteId}`, undefined, NoteSchema);
}

// PUBLIC_INTERFACE
export async function createNote(payload: NoteCreate): Promise<Note> {
  /** Create a note. */
  return http(
    `/notes`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    NoteSchema
  );
}

// PUBLIC_INTERFACE
export async function updateNote(noteId: number, payload: NoteUpdate): Promise<Note> {
  /** Update a note (partial update semantics via backend NoteUpdate model). */
  return http(
    `/notes/${noteId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload)
    },
    NoteSchema
  );
}

// PUBLIC_INTERFACE
export async function deleteNote(noteId: number): Promise<{ deleted: boolean }> {
  /** Delete a note by id. */
  return http(`/notes/${noteId}`, { method: "DELETE" }, z.object({ deleted: z.boolean() }));
}

// PUBLIC_INTERFACE
export async function setFavorite(noteId: number, isFavorite: boolean): Promise<{ id: number; is_favorite: boolean }> {
  /** Set favorite state for a note. */
  return http(
    `/favorites/${noteId}`,
    { method: "PUT", body: JSON.stringify({ is_favorite: isFavorite }) },
    z.object({ id: z.number().int(), is_favorite: z.boolean() })
  );
}

// PUBLIC_INTERFACE
export async function saveNoteVersion(noteId: number, message?: string): Promise<NoteVersionSummary> {
  /** Manually save a version snapshot for the given note id. */
  return http(
    `/notes/${noteId}/versions`,
    {
      method: "POST",
      body: JSON.stringify({ message: message ?? "" })
    },
    NoteVersionSummarySchema
  );
}

// PUBLIC_INTERFACE
export async function listNoteVersions(noteId: number): Promise<NoteVersionsList> {
  /** List saved versions for a note (newest first). */
  return http(`/notes/${noteId}/versions`, undefined, NoteVersionsListSchema);
}

// PUBLIC_INTERFACE
export async function restoreNoteVersion(noteId: number, versionId: string): Promise<{ note: Note }> {
  /** Restore a note from a saved version snapshot. */
  return http(
    `/notes/${noteId}/versions/${encodeURIComponent(versionId)}/restore`,
    { method: "POST" },
    z.object({ note: NoteSchema })
  );
}

// PUBLIC_INTERFACE
export async function getNoteVersion(noteId: number, versionId: string): Promise<{ version: Note }> {
  /**
   * Fetch the full note snapshot for a given version.
   *
   * Contract:
   * - Input: noteId + versionId
   * - Output: { version: Note } where Note contains content/title/tags snapshot
   *
   * Note: This requires backend support for GET /notes/{noteId}/versions/{versionId}.
   */
  return http(
    `/notes/${noteId}/versions/${encodeURIComponent(versionId)}`,
    undefined,
    z.object({ version: NoteSchema })
  );
}
