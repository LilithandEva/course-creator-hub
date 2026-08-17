import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireEnrolledCourseId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_course_theory",
  title: "Search course theory",
  description:
    "Full-text search the course theory material (indexed PDF) and return the most relevant fragments. Only enrolled students can read it.",
  inputSchema: {
    query: z.string().min(1).describe("Search terms, in the course language (Spanish)."),
    limit: z.number().int().describe("Max fragments to return (default 8)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const course = await requireEnrolledCourseId(supabase, ctx.getUserId()!);

    const max = Math.min(Math.max(Number.isFinite(limit) ? limit : 8, 1), 20);
    const { data, error } = await supabase.rpc("search_course_chunks", {
      _course_id: course.id,
      _query: query,
      _limit: max,
    });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const fragments = (data ?? []).map((c) => c.content);
    return {
      content: [
        {
          type: "text",
          text: fragments.length
            ? fragments.map((f, i) => `[Fragmento ${i + 1}]\n${f}`).join("\n\n")
            : "No matching fragments in the course material.",
        },
      ],
      structuredContent: { fragments },
    };
  },
});
