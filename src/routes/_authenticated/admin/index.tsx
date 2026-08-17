import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { fetchCourse } from "@/lib/course";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminStudents,
});

function AdminStudents() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: course } = useQuery({ queryKey: ["course"], queryFn: fetchCourse });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-students", course?.id],
    enabled: !!course?.id,
    queryFn: async () => {
      const [profiles, enrollments, lessons, progress, attempts] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, created_at"),
        supabase.from("enrollments").select("id, user_id, source, created_at"),
        supabase.from("lessons").select("id"),
        supabase.from("lesson_progress").select("user_id, lesson_id"),
        supabase
          .from("quiz_attempts")
          .select("id, user_id, quiz_id, score, passed, created_at")
          .order("created_at", { ascending: false }),
      ]);
      return {
        profiles: profiles.data ?? [],
        enrollments: enrollments.data ?? [],
        totalLessons: (lessons.data ?? []).length,
        progress: progress.data ?? [],
        attempts: attempts.data ?? [],
      };
    },
  });

  const enroll = useMutation({
    mutationFn: async (targetEmail: string) => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", targetEmail.trim())
        .maybeSingle();
      if (error) throw error;
      if (!profile) throw new Error("No existe ninguna cuenta con ese email. Pídele que se registre primero.");
      const { error: insertError } = await supabase
        .from("enrollments")
        .insert({ user_id: profile.id, course_id: course!.id, source: "manual" });
      if (insertError) {
        throw new Error(
          insertError.code === "23505"
            ? "Ese alumno ya está inscrito."
            : insertError.message,
        );
      }
    },
    onSuccess: () => {
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      toast.success("Alumno inscrito manualmente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data?.profiles ?? []).map((p) => {
    const enrollment = (data?.enrollments ?? []).find((e) => e.user_id === p.id);
    const done = (data?.progress ?? []).filter((x) => x.user_id === p.id).length;
    const pct = data?.totalLessons ? Math.round((done / data.totalLessons) * 100) : 0;
    const userAttempts = (data?.attempts ?? []).filter((a) => a.user_id === p.id);
    return { profile: p, enrollment, pct, done, attempts: userAttempts };
  });

  const enrolledCount = rows.filter((r) => r.enrollment).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-foreground">Panel de administración</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Alumnos</h1>
        </div>
        <div className="flex gap-4">
          <div className="surface px-5 py-3 text-center">
            <p className="font-display text-2xl font-bold">{rows.length}</p>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </div>
          <div className="surface px-5 py-3 text-center">
            <p className="font-display text-2xl font-bold">{enrolledCount}</p>
            <p className="text-xs text-muted-foreground">Inscritos</p>
          </div>
        </div>
      </div>

      <section className="surface p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <UserPlus className="size-5" /> Inscribir manualmente
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Da acceso al curso a una cuenta ya registrada, sin pasar por el pago.
        </p>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) enroll.mutate(email);
          }}
        >
          <div className="min-w-64 flex-1">
            <Label htmlFor="enroll-email">Email del alumno</Label>
            <Input
              id="enroll-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alumno@email.com"
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={enroll.isPending}>
            Dar acceso
          </Button>
        </form>
      </section>

      <section className="surface overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <Users className="size-5" />
          <h2 className="font-display text-lg font-bold">Listado y progreso</h2>
        </div>
        {isLoading ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Todavía no hay alumnos.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Acceso</TableHead>
                <TableHead className="w-56">Progreso</TableHead>
                <TableHead>Tests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.profile.id}>
                  <TableCell>
                    <p className="font-medium">{r.profile.full_name || "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground">{r.profile.email}</p>
                  </TableCell>
                  <TableCell>
                    {r.enrollment ? (
                      <Badge variant={r.enrollment.source === "manual" ? "secondary" : "default"}>
                        {r.enrollment.source === "manual" ? "Manual" : "Pago"}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin acceso</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.pct} className="h-2" />
                      <span className="w-10 text-right text-xs text-muted-foreground">
                        {r.pct}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.attempts.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {r.attempts.slice(0, 4).map((a) => (
                          <Badge key={a.id} variant={a.passed ? "default" : "secondary"}>
                            {a.score}%
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
