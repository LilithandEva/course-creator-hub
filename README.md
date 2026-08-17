# Course Creator Hub

Quiero crear una plataforma web (TuCurso.com) para impartir mi propio curso online (tipo campus virtual). De momento solo yo voy a subir contenido como administrador; no construyas todavía nada de que otros usuarios puedan crear y vender sus propios cursos, eso vendrá en una fase posterior.

Autenticación y usuarios

Registro e inicio de sesión de alumnos (email + contraseña, y recuperación de contraseña).

Panel de administrador separado, solo accesible para mí.

Roles: administrador y alumno.

Estructura del curso

El curso se organiza en módulos, y cada módulo en lecciones.

Cada lección puede tener: vídeo, texto explicativo, y archivos descargables (PDF, plantillas).

Los alumnos solo ven las lecciones del curso al que tienen acceso.

Barra de progreso visible para el alumno mostrando % completado.

Tests (opcionales por módulo)

Al crear o editar un módulo, debe haber un interruptor "¿Añadir test a este módulo?". Si lo desactivo, ese módulo no tiene test.

Cuando sí hay test: preguntas de opción múltiple, corrección automática, nota visible al terminar, historial de resultados guardado, y opción de reintentar.

Página de venta del curso (diseño personalizable)

Una página pública de presentación del curso, editable desde mi panel de administrador: poder cambiar el color principal, la tipografía, subir fotos en formato galería/carrusel, y añadir una sección de testimonios (texto, foto y nombre de la persona).

Esta es la página que ve un visitante antes de comprar el curso.

Chatbot de dudas basado en el contenido del curso

El curso tiene un chatbot de preguntas y respuestas para los alumnos inscritos.

Yo subo un PDF largo con la teoría del curso, y el chatbot debe responder a las dudas de los alumnos basándose únicamente en ese contenido.

El chatbot aparece dentro del dashboard del curso o de cada lección.

Pagos y acceso

Integración de pago con Stripe para que un alumno compre el curso y quede inscrito automáticamente.

Poder inscribir manualmente a un alumno sin que pase por el pago (para casos especiales).

Panel de administrador con la lista de alumnos, su progreso y sus resultados de tests.

Notificaciones

Email automático al alumno cuando se inscribe.

Email automático al alumno cuando completa un test o el curso.

Email a mí cuando alguien se inscribe.

Diseño general

Diseño limpio y moderno, con mi marca (dime en el chat de Lovable tus colores/logo si quieres personalizarlo desde el primer momento).

Dashboard de alumno claro con sus cursos, progreso y resultados.

Usa Supabase para la base de datos, autenticación y almacenamiento de archivos (PDFs, descargables). Usa Stripe para los pagos. Usa Bunny Stream (u otro servicio de vídeo con API) para alojar y reproducir los vídeos — nunca guardes el vídeo directamente en el almacenamiento de Supabase.

Requisitos de seguridad (cúmplelos desde el principio)

El acceso a cada lección debe verificarse en el servidor (o mediante reglas de base de datos), no solo ocultando el contenido en la pantalla. Un alumno sin acceso no debe poder obtener el contenido aunque intente acceder directamente a la URL o a los datos.

El precio del curso debe fijarse siempre en el servidor, nunca puede venir del navegador del alumno ni ser modificable antes de enviarlo a Stripe.

Las claves secretas de Stripe deben usarse únicamente en funciones de servidor (Edge Functions/backend), nunca deben quedar expuestas en el código que se carga en el navegador.

Configura Row Level Security en Supabase para que cada alumno solo pueda leer sus propios datos, progreso y resultados — nunca los de otro alumno.

El acceso al curso debe activarse solo cuando Stripe confirme el pago de verdad (vía webhook), no simplemente al llegar el alumno a la pantalla de "gracias por tu compra".

El PDF de teoría y las respuestas del chatbot solo deben estar disponibles para alumnos inscritos en el curso, nunca de forma pública.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/21edaf90-a17f-4648-b913-e4478f03b11d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
