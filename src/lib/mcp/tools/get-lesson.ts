import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireEnrolledCourseId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_lesson",
  title: "Get lesson content",
  description:
    "Read the written content of one lesson (title, text and downloadable resource names) for the signed-in enrolled student.",
  inputSchema: { lesson_id: z.string().describe("Lesson id from get_curriculum.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ lesson_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    await requireEnrolledCourseId(supabase, ctx.getUserId()!);

    const { data, error } = await supabase
      .from("lessons")
      .select("id, title, content, video_url, modules(title), lesson_resources(name)")
      .eq("id", lesson_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return { content: [{ type: "text", text: "Lesson not found or not accessible." }], isError: true };
    }

    const lesson = {
      id: data.id,
      title: data.title,
      module: (data.modules as { title: string } | null)?.title ?? null,
      content: data.content,
      has_video: Boolean(data.video_url),
      resources: (data.lesson_resources ?? []).map((r) => r.name),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(lesson, null, 2) }],
      structuredContent: { lesson },
    };
  },
});
