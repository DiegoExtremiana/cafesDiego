# Contador de cafés

Aplicación web para registrar y analizar el consumo de café durante la jornada laboral. Cada usuario dispone de su propio historial, estadísticas completas, gráficos interactivos, sistema de logros y un perfil público compartible.

## Tecnologías

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (tipado estricto)
- [Vite 6](https://vite.dev/)
- [Supabase](https://supabase.com/) (autenticación y base de datos PostgreSQL con RLS)
- [TailwindCSS 4](https://tailwindcss.com/)
- [React Router 7](https://reactrouter.com/) (HashRouter, compatible con GitHub Pages)
- [Recharts](https://recharts.org/) para los gráficos
- [Lucide React](https://lucide.dev/) para los iconos

## Funcionalidades

- Registro, inicio de sesión y recuperación de sesión con Supabase Auth.
- Botón principal para registrar un café con la hora actual, además de alta manual, edición y borrado de cafés de cualquier fecha.
- Panel con cafés de hoy, tiempo desde el último café, ritmo de consumo, media entre cafés, estimación del siguiente café y barra de progreso sobre el máximo recomendado.
- Estadísticas de hoy, semana, mes (con comparación con el mes anterior) e histórico.
- Gráficos interactivos: evolución diaria, semanal y mensual, cafés por hora, histograma de intervalos, promedio mensual y calendario anual tipo GitHub.
- Estadísticas curiosas: café más temprano y más tardío, hora favorita, intervalos extremos, día más constante e irregular, entre otras.
- Sistema de logros por número de cafés y días registrados.
- Exportación de todos los datos a CSV y JSON.
- Perfil público de solo lectura en `/#/u/<usuario>` con opciones de privacidad por sección.
- Configuración personal: horario laboral, días laborables y máximo recomendado de cafés.

## Estructura del proyecto

```
src/
  components/     Componentes reutilizables (ui, layout, coffee, dashboard, charts, stats, achievements, settings)
  contexts/       AuthContext y CoffeesContext
  hooks/          useAuth, useCoffees, useNow
  lib/            Cliente de Supabase
  pages/          Una página por ruta
  router/         Rutas protegidas
  services/       Acceso a datos (única capa que habla con Supabase)
  types/          Tipos de dominio y de base de datos
  utils/          Fechas, estadísticas, gráficos, logros, exportación
supabase/
  schema.sql      Esquema completo: tablas, trigger de perfil y políticas RLS
```

## Instalación

Requisitos: Node.js 20 o superior.

```bash
git clone <url-del-repositorio>
cd cafesDiego
npm install
```

## Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com/dashboard).
2. Abre **SQL Editor**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo. Esto crea las tablas `profiles` y `coffees`, el trigger que genera el perfil al registrarse y todas las políticas de seguridad (RLS).
3. En **Project Settings → API** copia la *Project URL* y la *anon/publishable key*.
4. Opcional: en **Authentication → Sign In / Providers → Email**, desactiva *Confirm email* si no quieres exigir confirmación por correo durante el desarrollo.

### Variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

La clave anon es pública por diseño; la seguridad de los datos la garantizan las políticas RLS del esquema.

## Desarrollo

```bash
npm run dev
```

Abre http://localhost:5173.

## Compilación

```bash
npm run build      # typecheck + build de producción en dist/
npm run preview    # sirve dist/ en local para probar
```

## Despliegue en GitHub Pages

El repositorio incluye un workflow en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) que compila y publica automáticamente en cada push a `main`.

1. En GitHub, ve a **Settings → Pages** y en *Build and deployment* selecciona **GitHub Actions** como fuente.
2. En **Settings → Secrets and variables → Actions** crea dos *repository secrets*:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Haz push a `main`. La aplicación quedará publicada en `https://<usuario>.github.io/<repositorio>/`.

La aplicación usa rutas con hash (`/#/...`) y `base: './'`, por lo que funciona en GitHub Pages sin configuración adicional ni trucos de 404.

## Privacidad del perfil público

Al activar el perfil público, las políticas RLS permiten la lectura anónima de los cafés del usuario; las opciones de visibilidad (historial, gráficos, logros, estadísticas avanzadas) controlan qué secciones se muestran en la página pública. Si se desactiva el perfil público, ningún dato es accesible sin sesión.

## Ampliaciones previstas

La arquitectura (servicios separados, estadísticas como funciones puras, componentes pequeños) deja preparado el terreno para: notificaciones del siguiente café, PWA, comparación entre usuarios, objetivos y rachas, importación de datos y una API pública.
