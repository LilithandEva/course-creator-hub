import { defineTool } from "@lovable.dev/mcp-js";
import { requireEnrolledCourseId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_curriculum",
  title: "Get course curriculum",
  description:
    "List the modules and lessons of the course for the signed-in enrolled student, including which lessons are already completed.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId()!;
    const course = await requireEnrolledCourseId(supabase, userId);

    const { data: modules, error } = await supabase
      .from("modules")
      .select("id, title, description, position, has_quiz, lessons(id, title, position, duration_minutes)")
      .eq("course_id", course.id)
      .order("position", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const { data: progress } = await supabase.from("lesson_progress").select("lesson_id");
    const done = new Set((progress ?? []).map((p) => p.lesson_id));

    const result = (modules ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      has_quiz: m.has_quiz,
      lessons: [...(m.lessons ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((l) => ({
          id: l.id,
          title: l.title,
          duration_minutes: l.duration_minutes,
          completed: done.has(l.id),
        })),
    }));

    return {
      content: [{ type: "text", text: JSON.stringify({ course: course.title, modules: result }, null, 2) }],
      structuredContent: { course: course.title, modules: result },
    };
  },
});
