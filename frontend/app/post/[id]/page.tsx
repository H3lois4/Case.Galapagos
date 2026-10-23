import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoCompartilhar } from "@/components/rede/BotaoCompartilhar";
import type { Post } from "@/lib/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

async function buscarPost(id: string): Promise<Post | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/rede/posts/${id}/`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Post;
  } catch {
    return null;
  }
}

function resumoDoPost(post: Post): string {
  const base = post.titulo || post.texto || post.vaga_cargo || "Post no Por ELAS finance";
  return base.length > 160 ? `${base.slice(0, 157)}…` : base;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await buscarPost(id);
  if (!post) return { title: "Post não encontrado" };

  const titulo = post.titulo || `${post.autor.nome} no Por ELAS finance`;
  const descricao = resumoDoPost(post);
  return {
    title: titulo,
    description: descricao,
    openGraph: {
      title: titulo,
      description: descricao,
      type: "article",
      ...(post.imagem_url ? { images: [{ url: post.imagem_url }] } : {}),
    },
    twitter: {
      card: post.imagem_url ? "summary_large_image" : "summary",
      title: titulo,
      description: descricao,
    },
  };
}

export default async function PostPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await buscarPost(id);
  if (!post) notFound();

  const data = new Date(post.criado_em).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-8">
      <Link href="/" className="text-[14px] font-semibold text-azul-elas hover:underline">
        Por ELAS finance
      </Link>

      <article className="mt-6 rounded-card border border-borda bg-fundo p-6 shadow-[var(--sombra-card)]">
        <p className="text-[14px] font-semibold text-tinta">{post.autor.nome}</p>
        <p className="text-[12px] text-tinta-suave">{data}</p>

        {post.titulo && (
          <h1 className="mt-3 font-titulo text-[24px] font-bold text-tinta">
            {post.titulo}
          </h1>
        )}

        {post.imagem_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imagem_url}
            alt=""
            className="mt-4 w-full rounded-card object-cover"
          />
        )}

        {post.texto && (
          <p className="mt-4 whitespace-pre-line text-[16px] leading-relaxed text-tinta">
            {post.texto}
          </p>
        )}

        {post.tipo === "vaga" && (
          <div className="mt-4 rounded-card border border-azul-elas/30 bg-azul-elas-suave/50 p-3">
            <p className="font-semibold text-tinta">{post.vaga_cargo}</p>
            {post.vaga_local && <p className="text-[13px] text-tinta-suave">{post.vaga_local}</p>}
            {post.vaga_link && (
              <a
                href={post.vaga_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold text-azul-elas hover:underline"
              >
                Candidatar-se
              </a>
            )}
          </div>
        )}

        {post.fonte_url && (
          <a
            href={post.fonte_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[13px] text-tinta-suave hover:underline"
          >
            Fonte original
          </a>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-borda pt-4">
          <span className="text-[13px] text-tinta-suave">
            ❤ {post.curtidas_count} · 💬 {post.comentarios_count}
          </span>
          <BotaoCompartilhar postId={post.id} titulo={post.titulo || post.texto.slice(0, 60)} />
        </div>
      </article>

      <div className="mt-6 text-center">
        <Link
          href="/rede"
          className="inline-flex items-center justify-center rounded-botao bg-azul-elas px-5 py-3 text-[15px] font-semibold text-white hover:bg-azul-elas-escuro"
        >
          Abrir no app
        </Link>
      </div>
    </main>
  );
}
