import { Link, Navigate, useParams } from "react-router-dom";
import { BLOG_POSTS } from "@/content/blogPosts";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find((item) => item.slug === slug);
  usePageMeta(post?.seoTitle ?? "Blog BarberFlow", post?.seoDescription);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <main className="container max-w-3xl py-10 space-y-6">
      <Link to="/blog" className="text-sm text-primary">
        Voltar ao blog
      </Link>
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-primary">{post.category}</p>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <p className="text-sm text-muted-foreground">
          {post.readTime} • {new Date(post.publishedAt).toLocaleDateString("pt-BR")}
        </p>
      </header>
      <article className="space-y-4 text-foreground/90">
        {post.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
      <footer className="glass-card p-5 space-y-2">
        <h2 className="font-semibold">Próximo passo</h2>
        <p className="text-sm text-muted-foreground">
          Transforme o conteúdo em ação com agendamento rápido e suporte em poucos cliques.
        </p>
        <div className="flex gap-2">
          <Link to="/cliente/novo-agendamento">
            <Button>Agendar agora</Button>
          </Link>
          <Link to="/suporte">
            <Button variant="outline">Falar com suporte</Button>
          </Link>
        </div>
      </footer>
    </main>
  );
};

export default BlogPost;

