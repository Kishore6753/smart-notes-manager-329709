"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createNote,
  deleteNote,
  listNotes,
  Note,
  searchNotes,
  setFavorite,
  updateNote
} from "@/lib/api";
import { MarkdownEditor, type MarkdownViewMode } from "@/components/MarkdownEditor";

type LoadState = "idle" | "loading" | "error";

function nowIso(): string {
  return new Date().toISOString();
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatNoteSubtitle(note: Note): string {
  const tags = note.tags?.length ? `${note.tags.length} tag(s)` : "no tags";
  const fav = note.is_favorite ? "★ favorite" : "☆ not favorite";
  return `${fav} • ${tags}`;
}

// PUBLIC_INTERFACE
export default function HomePage() {
  /** Notes home page: list/search + create/edit with Markdown preview. */
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [notesState, setNotesState] = useState<LoadState>("idle");
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);

  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);

  // Editor fields (local draft)
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftFavorite, setDraftFavorite] = useState(false);
  const [editorMode, setEditorMode] = useState<MarkdownViewMode>("split");

  const [saving, setSaving] = useState(false);
  const [mutatingError, setMutatingError] = useState<string | null>(null);

  const selectedNote: Note | null = useMemo(() => {
    if (selectedId === null || selectedId === "new") return null;
    return notes.find((n) => n.id === selectedId) ?? null;
  }, [notes, selectedId]);

  const refresh = useCallback(async () => {
    setNotesState("loading");
    setNotesError(null);

    try {
      const data =
        query.trim().length > 0
          ? await searchNotes({ q: query.trim(), favorites_only: favoritesOnly, limit: 200 })
          : await listNotes({ favorites_only: favoritesOnly, limit: 200 });

      setNotes(data.items);
      setTotal(data.total);
      setNotesState("idle");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setNotesState("error");
      setNotesError(msg);
    }
  }, [query, favoritesOnly]);

  // Load notes initially and on search/favorite filters.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Sync editor draft when selection changes.
  useEffect(() => {
    setMutatingError(null);

    if (selectedId === "new") {
      setDraftTitle("");
      setDraftTags("");
      setDraftContent(`# New note\n\nCreated: ${nowIso()}\n\n`);
      setDraftFavorite(false);
      return;
    }

    if (!selectedNote) return;

    setDraftTitle(selectedNote.title ?? "");
    setDraftTags((selectedNote.tags ?? []).join(", "));
    setDraftContent(selectedNote.content ?? "");
    setDraftFavorite(Boolean(selectedNote.is_favorite));
  }, [selectedId, selectedNote]);

  const onNewNote = useCallback(() => {
    setSelectedId("new");
  }, []);

  const onSelectNote = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const onToggleFavorite = useCallback(
    async (note: Note) => {
      setMutatingError(null);
      try {
        const updated = await setFavorite(note.id, !note.is_favorite);
        // Keep local list in sync.
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, is_favorite: updated.is_favorite } : n))
        );
        // If currently editing this note, sync draft checkbox.
        if (selectedId === note.id) setDraftFavorite(updated.is_favorite);
      } catch (e) {
        setMutatingError(e instanceof Error ? e.message : "Failed to update favorite");
      }
    },
    [selectedId]
  );

  const onSave = useCallback(async () => {
    setSaving(true);
    setMutatingError(null);

    try {
      const payload = {
        title: draftTitle.trim() || "Untitled",
        content: draftContent,
        tags: parseTags(draftTags)
      };

      if (selectedId === "new") {
        const created = await createNote(payload);
        setSelectedId(created.id);
      } else if (typeof selectedId === "number") {
        await updateNote(selectedId, {
          title: payload.title,
          content: payload.content,
          tags: payload.tags,
          is_favorite: draftFavorite
        });
      } else {
        // Nothing selected; treat as new
        const created = await createNote(payload);
        setSelectedId(created.id);
      }

      await refresh();
    } catch (e) {
      setMutatingError(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setSaving(false);
    }
  }, [draftTitle, draftContent, draftTags, draftFavorite, selectedId, refresh]);

  const onDelete = useCallback(async () => {
    if (typeof selectedId !== "number") return;

    setSaving(true);
    setMutatingError(null);

    try {
      await deleteNote(selectedId);
      setSelectedId(null);
      await refresh();
    } catch (e) {
      setMutatingError(e instanceof Error ? e.message : "Failed to delete note");
    } finally {
      setSaving(false);
    }
  }, [selectedId, refresh]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner container">
          <div className="brand" aria-label="App title">
            <div className="brand-title">Smart Notes</div>
            <div className="brand-subtitle">Markdown notes with preview</div>
          </div>

          <div className="search" role="search" aria-label="Search notes">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title + content…"
              aria-label="Search query"
            />
            <button className="btn" type="button" onClick={() => void refresh()} title="Search">
              Search
            </button>
          </div>

          <button className="btn" type="button" onClick={() => setFavoritesOnly((v) => !v)} aria-pressed={favoritesOnly}>
            {favoritesOnly ? "Favorites: ON" : "Favorites: OFF"}
          </button>

          <button className="btn btn-primary" type="button" onClick={onNewNote}>
            + New
          </button>
        </div>
      </header>

      <main className="container main">
        <section className="panel" aria-label="Notes list">
          <div className="panel-header">
            <div className="panel-title">Notes</div>
            <div className="small">
              {notesState === "loading" ? "Loading…" : `${total} total`}
            </div>
          </div>

          <div className="panel-body">
            {notesError && <div className="error">{notesError}</div>}

            <div className="note-list">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="note-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectNote(note.id)}
                  onKeyDown={(e) => (e.key === "Enter" ? onSelectNote(note.id) : null)}
                  aria-label={`Open note ${note.title}`}
                  style={{
                    outline:
                      selectedId === note.id ? "2px solid rgba(59, 130, 246, 0.55)" : "none"
                  }}
                >
                  <div className="note-card-title">
                    <span>{note.title || "Untitled"}</span>
                    <button
                      className="btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void onToggleFavorite(note);
                      }}
                      aria-label={note.is_favorite ? "Unfavorite note" : "Favorite note"}
                      title="Toggle favorite"
                    >
                      {note.is_favorite ? "★" : "☆"}
                    </button>
                  </div>
                  <div className="note-card-meta">
                    <span className="small">{formatNoteSubtitle(note)}</span>
                    {(note.tags ?? []).slice(0, 6).map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                    {(note.tags ?? []).length > 6 && <span className="small">+ more</span>}
                  </div>
                </div>
              ))}

              {notes.length === 0 && notesState !== "loading" && (
                <div className="small">No notes found. Create one with “New”.</div>
              )}
            </div>
          </div>
        </section>

        <section className="panel" aria-label="Editor">
          <div className="panel-header">
            <div className="panel-title">
              {selectedId === "new" ? "New note" : selectedNote ? `Edit: ${selectedNote.title}` : "Editor"}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="btn"
                type="button"
                onClick={() => setDraftFavorite((v) => !v)}
                aria-pressed={draftFavorite}
                title="Favorite state (stored in backend)"
                disabled={saving}
              >
                {draftFavorite ? "★ Favorite" : "☆ Favorite"}
              </button>

              <button className="btn btn-primary" type="button" onClick={() => void onSave()} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>

              <button
                className="btn btn-danger"
                type="button"
                onClick={() => void onDelete()}
                disabled={saving || typeof selectedId !== "number"}
                title="Delete note"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="panel-body">
            {mutatingError && <div className="error">{mutatingError}</div>}

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div className="small">Title</div>
                <input
                  className="input"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Note title"
                  aria-label="Note title"
                />
              </div>

              <div>
                <div className="small">Tags (comma separated)</div>
                <input
                  className="input"
                  value={draftTags}
                  onChange={(e) => setDraftTags(e.target.value)}
                  placeholder="e.g. work, ideas, personal"
                  aria-label="Note tags"
                />
              </div>

              <MarkdownEditor
                value={draftContent}
                onChange={setDraftContent}
                mode={editorMode}
                onModeChange={setEditorMode}
                textareaLabel="Note content (Markdown)"
              />

              <div className="small">
                Markdown is stored in <code>content</code> as plain text, so existing backend CRUD/search remains compatible.
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
