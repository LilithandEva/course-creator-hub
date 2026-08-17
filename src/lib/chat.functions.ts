import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ChatInput = { courseId: string; question: string };

export const askCourseBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ChatInput) => {
    if (!data?.courseId) throw new Error("Falta el curso");
    const question = (data.question ?? "").trim();
    if (!question) throw new Error("Escribe una pregunta");
    if (question.length > 1000) throw new Error("La pregunta es demasiado larga");
    return { courseId: data.courseId, question };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Access is enforced server-side: no enrollment, no answers.
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", data.courseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!enrollment) {
      throw new Error("Necesitas estar inscrito en el curso para usar el chat.");
    }

    const { data: chunks, error: searchError } = await supabase.rpc("search_course_chunks", {
      _course_id: data.courseId,
      _query: data.question,
      _limit: 8,
    });
    if (searchError) throw new Error(searchError.message);

    const context_text = (chunks ?? [])
      .map((c: { content: string }, i: number) => `[Fragmento ${i + 1}]\n${c.content}`)
      .join("\n\n");

    if (!context_text) {
      const fallback =
        "No encuentro nada sobre eso en el material del curso. Prueba a reformular la pregunta usando términos que aparezcan en la teoría.";
      await supabase.from("chat_messages").insert([
        { user_id: userId, course_id: data.courseId, role: "user", content: data.question },
        { user_id: userId, course_id: data.courseId, role: "assistant", content: fallback },
      ]);
      return { answer: fallback };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env['LOVABLE_API_KEY']}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Eres el tutor virtual del curso. Responde SIEMPRE en español, de forma clara y breve, y ÚNICAMENTE con la información de los fragmentos del material del curso que te doy. Si la respuesta no está en los fragmentos, di que ese contenido no aparece en el material del curso. No inventes datos ni uses conocimiento externo.",
          },
          {
            role: "user",
            content: `Material del curso:\n\n${context_text}\n\nPregunta del alumno: ${data.question}`,
          },
        ],
      }),
    });

    if (response.status === 429) throw new Error("Demasiadas preguntas seguidas. Inténtalo en un minuto.");
    if (response.status === 402) throw new Error("Se han agotado los créditos de IA del espacio de trabajo.");
    if (!response.ok) throw new Error("El tutor no está disponible ahora mismo.");

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer = payload.choices?.[0]?.message?.content?.trim() ?? "No he podido generar respuesta.";

    await supabase.from("chat_messages").insert([
      { user_id: userId, course_id: data.courseId, role: "user", content: data.question },
      { user_id: userId, course_id: data.courseId, role: "assistant", content: answer },
    ]);

    return { answer };
  });
