"use client";

import React, { useEffect, useMemo, useState } from "react";
import { NotesApi, TagsApi, Note, TagItem } from "@/lib/api";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";

type EditorMode = "create" | "edit";

function splitTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function joinTags(tags: string[]): string {
  return tags.join(", ");
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);

  const [tags, setTags] = useState<TagItem[]>([]);
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsCsv, setTagsCsv] = useState("");

  const activeFiltersLabel = useMemo(() => {
    const parts: string[] = [];
    if (favoritesOnly) parts.push("Favorites");
    if (activeTag) parts.push(`#${activeTag}`);
    if (query.trim()) parts.push(`"${query.trim()}"`);
    return parts.length ? parts.join(" · ") : "All notes";
  }, [favoritesOnly, activeTag, query]);

  async function refreshTags() {
    const res = await TagsApi.list();
    setTags(res.items);
  }

  async function refreshNotes() {
    setLoading(true);
    setError(null);
    try {
      const limit = 200;
      const q = query.trim();

      if (q) {
        setIsSearching(true);
        const res = await NotesApi.search({
          q,
          tag: activeTag,
          favorites_only: favoritesOnly,
          limit,
        });
        setNotes(res.items);
        setTotal(res.total);
      } else {
        setIsSearching(false);
        const res = await NotesApi.list({
          tag: activeTag,
          favorites_only: favoritesOnly,
          limit,
        });
        setNotes(res.items);
        setTotal(res.total);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshTags();
    void refreshNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void refreshNotes();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTag, favoritesOnly, query]);

  function openCreate() {
    setEditorMode("create");
    setEditingId(null);
    setTitle("");
    setContent("");
    setTagsCsv("");
    setEditorOpen(true);
  }

  function openEdit(n: Note) {
    setEditorMode("edit");
    setEditingId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setTagsCsv(joinTags(n.tags));
    setEditorOpen(true);
  }

  async function saveNote() {
    setLoading(true);
    setError(null);
    try {
      const tagNames = splitTags(tagsCsv);

      if (editorMode === "create") {
        await NotesApi.create({ title: title.trim(), content: content.trim(), tags: tagNames });
      } else if (editingId != null) {
        await NotesApi.update(editingId, { title: title.trim(), content: content.trim(), tags: tagNames });
      }

      setEditorOpen(false);
      await refreshTags();
      await refreshNotes();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(id: number) {
    setLoading(true);
    setError(null);
    try {
      await NotesApi.remove(id);
      await refreshTags();
      await refreshNotes();
      if (editingId === id) setEditorOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(n: Note) {
    try {
      // Optimistic UI
      setNotes((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_favorite: !x.is_favorite } : x)));
      await NotesApi.setFavorite(n.id, !n.is_favorite);
      await refreshNotes();
    } catch (e) {
      setError((e as Error).message);
      await refreshNotes();
    }
  }

  return (
    <main className="min-h-screen bg-[color:var(--color-background)] text-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 ring-1 ring-slate-200" />
            <div>
              <div className="text-sm font-semibold">Smart Notes</div>
              <div className="text-xs text-slate-500">{activeFiltersLabel}</div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="w-[min(520px,55vw)]">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              aria-label="Search notes"
            />
          </div>

          <Button onClick={openCreate} className="whitespace-nowrap">
            New note
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-4 px-4 py-6">
        {/* Left filters */}
        <aside className="col-span-12 md:col-span-3">
          <Card className="p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</div>

            <button
              className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                favoritesOnly ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "hover:bg-slate-50"
              }`}
              onClick={() => setFavoritesOnly((v) => !v)}
            >
              Favorites only
            </button>

            <div className="mt-3 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</div>

            <button
              className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                !activeTag ? "bg-slate-100 ring-1 ring-slate-200" : "hover:bg-slate-50"
              }`}
              onClick={() => setActiveTag(undefined)}
            >
              All tags
            </button>

            <div className="flex flex-col gap-1">
              {tags.map((t) => (
                <button
                  key={t.id}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    activeTag?.toLowerCase() === t.name.toLowerCase()
                      ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => setActiveTag(t.name)}
                >
                  <span className="truncate">{t.name}</span>
                  <span className="text-xs text-slate-500">{t.note_count}</span>
                </button>
              ))}
              {!tags.length && <div className="text-sm text-slate-500">No tags yet.</div>}
            </div>
          </Card>
        </aside>

        {/* Notes list */}
        <section className="col-span-12 md:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {loading ? "Loading…" : `${total} note${total === 1 ? "" : "s"}${isSearching ? " found" : ""}`}
            </div>
            <Button variant="ghost" onClick={() => void refreshNotes()} disabled={loading}>
              Refresh
            </Button>
          </div>

          {error && (
            <Card className="mb-3 border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </Card>
          )}

          <div className="flex flex-col gap-3">
            {notes.map((n) => (
              <Card key={n.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void toggleFavorite(n)}
                        className={`rounded-lg px-2 py-1 text-xs font-medium ring-1 transition ${
                          n.is_favorite
                            ? "bg-blue-50 text-blue-700 ring-blue-200 hover:bg-blue-100"
                            : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100"
                        }`}
                        aria-label={n.is_favorite ? "Unfavorite note" : "Favorite note"}
                        title={n.is_favorite ? "Unfavorite" : "Favorite"}
                      >
                        {n.is_favorite ? "★ Favorite" : "☆ Favorite"}
                      </button>

                      <div className="truncate text-lg font-semibold">{n.title}</div>
                    </div>

                    <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">
                      {n.content}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {n.tags.map((t) => (
                        <Badge key={t} tone="accent">
                          {t}
                        </Badge>
                      ))}
                      {!n.tags.length && <Badge>No tags</Badge>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <Button variant="ghost" onClick={() => openEdit(n)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => void deleteNote(n.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {!notes.length && !loading && (
              <Card className="p-8 text-center">
                <div className="text-lg font-semibold">No notes yet</div>
                <div className="mt-1 text-sm text-slate-600">
                  Create your first note to get started.
                </div>
                <div className="mt-4">
                  <Button onClick={openCreate}>New note</Button>
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* Editor panel */}
        <aside className="col-span-12 md:col-span-3">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">
                {editorOpen ? (editorMode === "create" ? "Create note" : "Edit note") : "Quick create"}
              </div>
              {editorOpen ? (
                <Button variant="ghost" onClick={() => setEditorOpen(false)}>
                  Close
                </Button>
              ) : null}
            </div>

            {!editorOpen ? (
              <div className="text-sm text-slate-600">
                Use the button below to open the editor.
                <div className="mt-3">
                  <Button onClick={openCreate} className="w-full">
                    New note
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Content</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write something…"
                    rows={10}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Tags</label>
                  <Input value={tagsCsv} onChange={(e) => setTagsCsv(e.target.value)} placeholder="comma, separated, tags" />
                  <div className="mt-1 text-xs text-slate-500">Tags are case-insensitive for filtering.</div>
                </div>

                <Button
                  onClick={() => void saveNote()}
                  disabled={loading || !title.trim() || !content.trim()}
                  className="w-full"
                >
                  {editorMode === "create" ? "Create" : "Save changes"}
                </Button>
              </div>
            )}
          </Card>

          <div className="mt-3 text-xs text-slate-500">
            Configure backend URL via <code className="rounded bg-slate-100 px-1 py-0.5">NEXT_PUBLIC_API_BASE_URL</code>.
          </div>
        </aside>
      </div>
    </main>
  );
}
