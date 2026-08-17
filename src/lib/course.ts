import { supabase } from "@/integrations/supabase/client";

export const COURSE_SLUG = "ecommerce-formation";

export function formatPrice(cents: number, currency = "eur") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export async function fetchCourse() {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", COURSE_SLUG)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchLanding() {
  const [{ data: course }, { data: settings }, { data: testimonials }] = await Promise.all([
    supabase.from("courses").select("*").eq("slug", COURSE_SLUG).maybeSingle(),
    supabase.from("landing_settings").select("*").limit(1).maybeSingle(),
    supabase.from("testimonials").select("*").order("position", { ascending: true }),
  ]);
  return { course, settings, testimonials: testimonials ?? [] };
}

export type ModuleWithLessons = {
  id: string;
  title: string;
  description: string;
  position: number;
  has_quiz: boolean;
  lessons: {
    id: string;
    title: string;
    position: number;
    duration_minutes: number | null;
  }[];
  quiz: { id: string; title: string; pass_score: number } | null;
};

export async function fetchCurriculum(courseId: string): Promise<ModuleWithLessons[]> {
  const { data, error } = await supabase
    .from("modules")
    .select(
      "id, title, description, position, has_quiz, lessons(id, title, position, duration_minutes), quizzes(id, title, pass_score)",
    )
    .eq("course_id", courseId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    position: m.position,
    has_quiz: m.has_quiz,
    lessons: [...(m.lessons ?? [])].sort((a, b) => a.position - b.position),
    quiz: (m.quizzes as unknown as { id: string; title: string; pass_score: number }[] | null)?.[0] ?? null,
  }));
}

export async function fetchMyProgress() {
  const { data, error } = await supabase.from("lesson_progress").select("lesson_id, completed_at");
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyEnrollment(courseId: string) {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, created_at, source")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function toggleLessonComplete(lessonId: string, completed: boolean, userId: string) {
  if (completed) {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert({ lesson_id: lessonId, user_id: userId }, { onConflict: "user_id,lesson_id" });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId);
    if (error) throw error;
  }
}

export function bunnyEmbedUrl(raw: string | null | undefined) {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("http")) return value;
  // "libraryId/videoId" shorthand for Bunny Stream
  const parts = value.split("/").filter(Boolean);
  if (parts.length === 2) return `https://iframe.mediadelivery.net/embed/${parts[0]}/${parts[1]}`;
  return null;
}
