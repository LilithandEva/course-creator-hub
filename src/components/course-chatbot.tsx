import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { askCourseBot } from "@/lib/chat.functions";

export function CourseChatbot({ courseId }: { courseId: string | undefined }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const ask = useServerFn(askCourseBot);

  const { data: messages } = useQuery({
    queryKey: ["chat-messages"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .order("created_at", { ascending: true })
        .limit(100);
      return data ?? [];
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  const send = useMutation({
    mutationFn: async (q: string) => ask({ data: { courseId: courseId!, question: q } }),
    onSuccess: () => {
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!courseId) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="size-5" />
        Resolver dudas
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex h-[32rem] w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <header className="ink-panel flex items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-foreground">
          <Bot className="size-4 text-accent" /> Tutor del curso
        </span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar chat">
          <X className="size-4 text-ink-foreground" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {(messages ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            Pregúntame cualquier duda sobre la teoría del curso. Solo respondo con el material
            oficial.
          </p>
        )}
        {(messages ?? []).map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
            }`}
          >
            {m.content}
          </div>
        ))}
        {send.isPending && (
          <p className="text-xs text-muted-foreground">El tutor está escribiendo…</p>
        )}
      </div>

      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) send.mutate(question.trim());
        }}
      >
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Escribe tu duda…"
          disabled={send.isPending}
        />
        <Button type="submit" size="icon" disabled={send.isPending || !question.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
