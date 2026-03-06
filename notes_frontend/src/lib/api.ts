export type Note = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type NotesListResponse = {
  items: Note[];
  total: number;
};

export type TagItem = {
  id: number;
  name: string;
  note_count: number;
};

type TagsResponse = { items: TagItem[] };

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:3001";

/**
 * PUBLIC_INTERFACE
 * Fetch wrapper with consistent error handling.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API ${res.status} ${res.statusText} for ${path}${text ? `: ${text}` : ""}`
    );
  }
  return (await res.json()) as T;
}

/**
 * PUBLIC_INTERFACE
 * Notes API.
 */
export const NotesApi = {
  async list(params: {
    tag?: string;
    favorites_only?: boolean;
    limit?: number;
  }): Promise<NotesListResponse> {
    const usp = new URLSearchParams();
    if (params.tag) usp.set("tag", params.tag);
    if (params.favorites_only) usp.set("favorites_only", "true");
    if (params.limit) usp.set("limit", String(params.limit));
    const qs = usp.toString() ? `?${usp.toString()}` : "";
    return apiFetch<NotesListResponse>(`/notes${qs}`);
  },

  async search(params: {
    q: string;
    tag?: string;
    favorites_only?: boolean;
    limit?: number;
  }): Promise<NotesListResponse> {
    const usp = new URLSearchParams();
    usp.set("q", params.q);
    if (params.tag) usp.set("tag", params.tag);
    if (params.favorites_only) usp.set("favorites_only", "true");
    if (params.limit) usp.set("limit", String(params.limit));
    return apiFetch<NotesListResponse>(`/notes/search?${usp.toString()}`);
  },

  async create(payload: {
    title: string;
    content: string;
    tags: string[];
  }): Promise<Note> {
    return apiFetch<Note>(`/notes`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async update(
    id: number,
    payload: Partial<{
      title: string;
      content: string;
      tags: string[];
      is_favorite: boolean;
    }>
  ): Promise<Note> {
    return apiFetch<Note>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async remove(id: number): Promise<{ deleted: true }> {
    return apiFetch<{ deleted: true }>(`/notes/${id}`, { method: "DELETE" });
  },

  async setFavorite(id: number, is_favorite: boolean): Promise<{ id: number; is_favorite: boolean }> {
    return apiFetch<{ id: number; is_favorite: boolean }>(`/favorites/${id}`, {
      method: "PUT",
      body: JSON.stringify({ is_favorite }),
    });
  },
};

/**
 * PUBLIC_INTERFACE
 * Tags API.
 */
export const TagsApi = {
  async list(): Promise<TagsResponse> {
    return apiFetch<TagsResponse>(`/tags`);
  },
};
