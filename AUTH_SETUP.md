# 🔐 Configuración de Autenticación con Supabase

## ✅ Implementación Completada

La autenticación con Supabase ha sido completamente implementada en la aplicación.

## 📋 Características Implementadas

### 1. **Registro de Usuarios (Sign Up)**
- Formulario de registro con nombre completo, email y contraseña
- Validación de contraseña mínima (6 caracteres)
- Almacenamiento del nombre completo en user_metadata
- Confirmación de cuenta vía email

### 2. **Inicio de Sesión (Sign In)**
- Formulario de login con email y contraseña
- Autenticación con Supabase
- Redirección automática al dashboard
- Mensajes de error descriptivos

### 3. **Protección de Rutas (Middleware)**
- Middleware que protege rutas privadas
- Rutas protegidas:
  - `/dashboard`
  - `/create-session`
  - `/session/*`
  - `/trip/*`
- Redirección automática a `/auth` si no está autenticado
- Redirección a `/dashboard` si ya está autenticado y accede a `/auth`

### 4. **Gestión de Sesión**
- Context API de React para estado global de autenticación
- Persistencia de sesión con cookies
- Refresh automático de tokens
- Estado de carga durante operaciones

### 5. **Cerrar Sesión (Logout)**
- Dropdown menu en el Header
- Muestra iniciales del usuario
- Muestra nombre y email
- Botón de cerrar sesión
- Redirección a landing page

## 🗂️ Estructura de Archivos

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts          # Cliente de Supabase para browser
│       └── server.ts          # Cliente de Supabase para server
├── contexts/
│   └── AuthContext.tsx        # Context de autenticación
├── components/
│   ├── providers.tsx          # Providers wrapper (incluye AuthProvider)
│   └── Header.tsx             # Header con user menu y logout
├── app/
│   └── auth/
│       └── page.tsx           # Página de login/signup
└── middleware.ts              # Middleware de protección de rutas

.env.local                      # Variables de entorno
```

## 🔑 Variables de Entorno

El archivo `.env.local` contiene:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jtnukzkvwsrsbvedrwsl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 Uso del Hook de Autenticación

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, session, loading, signIn, signUp, signOut } = useAuth();

  // user: Objeto del usuario actual (null si no está autenticado)
  // session: Sesión actual de Supabase
  // loading: true mientras se verifica la autenticación
  // signIn: Función para iniciar sesión
  // signUp: Función para registrarse
  // signOut: Función para cerrar sesión
}
```

## 📊 Flujo de Autenticación

### Registro de Usuario
1. Usuario completa formulario de registro
2. Se llama a `signUp(email, password, name)`
3. Supabase crea la cuenta y envía email de confirmación
4. Usuario es redirigido a `/dashboard`

### Inicio de Sesión
1. Usuario completa formulario de login
2. Se llama a `signIn(email, password)`
3. Supabase valida credenciales
4. Usuario es redirigido a `/dashboard`
5. Session se guarda en cookies

### Protección de Rutas
1. Usuario intenta acceder a ruta protegida
2. Middleware verifica si hay sesión válida
3. Si no hay sesión → redirige a `/auth`
4. Si hay sesión → permite acceso

### Cerrar Sesión
1. Usuario hace click en "Cerrar sesión"
2. Se llama a `signOut()`
3. Supabase limpia la sesión
4. Usuario es redirigido a landing page

## 🎨 Componentes UI

### Página de Autenticación (`/auth`)
- Tabs para alternar entre Login y Signup
- Validación de formularios
- Estados de carga (loading spinners)
- Mensajes de error con toast notifications
- Botón de volver al inicio

### Header Component
- Dropdown menu con avatar
- Muestra iniciales del usuario
- Información del usuario (nombre y email)
- Botón de cerrar sesión

## ⚡ Estados de la Aplicación

### Loading States
- `loading`: Durante verificación inicial de sesión
- `isLoading`: Durante login/signup

### User States
- `user === null`: Usuario no autenticado
- `user !== null`: Usuario autenticado
- `user.user_metadata.full_name`: Nombre del usuario
- `user.email`: Email del usuario

## 🔒 Seguridad

- Contraseñas hasheadas por Supabase
- Tokens JWT para autenticación
- Cookies seguras httpOnly
- Middleware server-side para protección
- Row Level Security (RLS) disponible en Supabase

## 📝 Próximos Pasos (Opcional)

Si deseas extender la funcionalidad:

1. **Password Recovery**: Implementar "¿Olvidaste tu contraseña?"
2. **Email Verification**: Página de confirmación de email
3. **OAuth Providers**: Google, GitHub, etc.
4. **Profiles Table**: Tabla de perfiles de usuario en Supabase
5. **Role-Based Access**: Roles y permisos de usuario

## 🧪 Testing

Para probar la autenticación:

1. **Registro**:
   ```
   - Ir a /auth
   - Click en "Registrarse"
   - Llenar formulario
   - Verificar email en bandeja
   ```

2. **Login**:
   ```
   - Ir a /auth
   - Ingresar credenciales
   - Debe redirigir a /dashboard
   ```

3. **Protección de Rutas**:
   ```
   - Sin login, intentar acceder a /dashboard
   - Debe redirigir a /auth
   ```

4. **Logout**:
   ```
   - Con sesión activa
   - Click en avatar → Cerrar sesión
   - Debe redirigir a landing
   ```

## 📚 Recursos

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side/nextjs)
