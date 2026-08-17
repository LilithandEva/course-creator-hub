import { defineTool } from "@lovable.dev/mcp-js";
import { requireEnrolledCourseId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_progress",
  title: "Get my progress",
  description:
    "Return the signed-in student's course progress: percentage completed, completed lessons and quiz attempt history.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const course = await requireEnrolledCourseId(supabase, ctx.getUserId()!);

    const { data: modules } = await supabase
      .from("modules")
      .select("id, lessons(id, title)")
      .eq("course_id", course.id);
    const lessons = (modules ?? []).flatMap((m) => m.lessons ?? []);

    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed_at");
    const done = new Set((progress ?? []).map((p) => p.lesson_id));

    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, score, correct_count, total_questions, passed, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const summary = {
      course: course.title,
      total_lessons: lessons.length,
      completed_lessons: lessons.filter((l) => done.has(l.id)).length,
      percent_complete: lessons.length
        ? Math.round((lessons.filter((l) => done.has(l.id)).length / lessons.length) * 100)
        : 0,
      completed_lesson_titles: lessons.filter((l) => done.has(l.id)).map((l) => l.title),
      quiz_attempts: attempts ?? [],
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
