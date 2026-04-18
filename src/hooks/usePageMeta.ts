import { useEffect } from "react";

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (!description) return;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
      return;
    }
    const tag = document.createElement("meta");
    tag.name = "description";
    tag.content = description;
    document.head.appendChild(tag);
  }, [description, title]);
}

