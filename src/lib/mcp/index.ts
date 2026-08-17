import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getCurriculumTool from "./tools/get-curriculum";
import getLessonTool from "./tools/get-lesson";
import getProgressTool from "./tools/get-progress";
import markLessonCompleteTool from "./tools/mark-lesson-complete";
import searchTheoryTool from "./tools/search-theory";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "course-creator-hub",
  title: "Course Creator Hub",
  version: "0.1.0",
  instructions:
    "Tools for the TuCurso.com virtual campus (course 'eCommerce Formation'). The caller signs in as a student. Use `get_curriculum` to list modules and lessons, `get_lesson` to read one lesson, `search_course_theory` to answer questions strictly from the indexed course material, `get_my_progress` for completion and quiz history, and `mark_lesson_complete` to update progress. All content is in Spanish and only available to enrolled students.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getCurriculumTool,
    getLessonTool,
    searchTheoryTool,
    getProgressTool,
    markLessonCompleteTool,
  ] as unknown as Parameters<typeof defineMcp>[0]["tools"],
});
