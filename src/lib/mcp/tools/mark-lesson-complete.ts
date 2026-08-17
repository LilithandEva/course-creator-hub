import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireEnrolledCourseId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "mark_lesson_complete",
  title: "Mark lesson complete",
  description:
    "Mark a lesson as completed (or pending) for the signed-in enrolled student, updating their progress bar.",
  inputSchema: {
    lesson_id: z.string().describe("Lesson id from get_curriculum."),
    completed: z.boolean().describe("true to mark completed, false to mark pending."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ lesson_id, completed }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId()!;
    await requireEnrolledCourseId(supabase, userId);

    if (completed) {
      const { error } = await supabase
        .from("lesson_progress")
        .upsert({ user_id: userId, lesson_id }, { onConflict: "user_id,lesson_id" });
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    } else {
      const { error } = await supabase
        .from("lesson_progress")
        .delete()
        .eq("lesson_id", lesson_id)
        .eq("user_id", userId);
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: completed ? "Lesson marked as completed." : "Lesson marked as pending." }],
      structuredContent: { lesson_id, completed },
    };
  },
});
