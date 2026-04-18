import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { BLOG_CATEGORIES, BLOG_POSTS } from "@/content/blogPosts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { captureLead } from "@/lib/leadCapture";
import { toast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";

const Blog = () => {
  usePageMeta("Blog BarberFlow | Tendências, cuidados e negócio", "Conteúdo para clientes e barbeiros com foco em estilo, operação e crescimento.");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [email, setEmail] = useState("");

  const posts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return BLOG_POSTS.filter((post) => {
      const categoryMatch = category === "all" || post.category === category;
      if (!normalized) return categoryMatch;
      const text = `${post.title} ${post.excerpt}`.toLowerCase();
      return categoryMatch && text.includes(normalized);
    });
  }, [category, query]);

  return (
    <main className="container max-w-5xl py-10 space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Blog BarberFlow</h1>
        <p className="text-muted-foreground">
          Conteúdo estratégico para clientes e barbeiros: tendências, cuidados e gestão.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            placeholder="Buscar por assunto..."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={category === "all" ? "default" : "outline"} size="sm" onClick={() => setCategory("all")}>
            Todos
          </Button>
          {BLOG_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {posts.map((post) => (
          <article key={post.slug} className="glass-card p-5 space-y-2">
            <p className="text-xs uppercase tracking-wider text-primary">{post.category}</p>
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-sm text-muted-foreground">{post.excerpt}</p>
            <p className="text-xs text-muted-foreground">
              {post.readTime} • {new Date(post.publishedAt).toLocaleDateString("pt-BR")}
            </p>
            <Link className="text-primary text-sm font-semibold" to={`/blog/${post.slug}`}>
              Ler artigo
            </Link>
          </article>
        ))}
      </section>

      <section className="glass-card p-6 space-y-3">
        <h3 className="text-lg font-semibold">Receba conteúdos e ofertas no e-mail</h3>
        <p className="text-sm text-muted-foreground">Newsletter semanal com dicas práticas e oportunidades locais.</p>
        <div className="flex gap-2 max-w-md">
          <Input
            type="email"
            value={email}
            placeholder="seu@email.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            onClick={() => {
              if (!email.trim()) return;
              const record = captureLead(email, "blog_newsletter");
              if (record) {
                toast({ title: "Inscrição confirmada", description: "Você receberá conteúdos estratégicos no e-mail." });
              }
              setEmail("");
            }}
          >
            Inscrever
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Blog;

