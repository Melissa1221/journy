# 🗄️ Database Schema - Journi (TripSplit)

## 📋 Tabla de Contenidos
- [Resumen General](#resumen-general)
- [Tablas y Relaciones](#tablas-y-relaciones)
- [SQL Scripts](#sql-scripts-supabase)
- [Políticas de Seguridad (RLS)](#políticas-de-seguridad-row-level-security)
- [Índices y Optimizaciones](#índices-y-optimizaciones)

---

## 📊 Resumen General

Esta base de datos está diseñada para soportar todas las funcionalidades actuales de Journi:

### Features Soportadas:
1. ✅ Autenticación de usuarios (Supabase Auth)
2. ✅ Creación y gestión de viajes/sesiones
3. ✅ Sistema de códigos para unirse
4. ✅ Participantes múltiples por viaje
5. ✅ Registro de gastos con descripción
6. ✅ Cálculo automático de balances
7. ✅ Chat grupal con bot
8. ✅ Álbum de fotos compartido
9. ✅ Ubicaciones y mapa de recuerdos
10. ✅ Historial de viajes pasados

### Tablas Principales:
- `users` - Usuarios de la aplicación
- `trips` - Viajes/sesiones creadas
- `trip_participants` - Relación muchos a muchos (usuarios ↔ viajes)
- `expenses` - Gastos registrados en cada viaje
- `expense_splits` - División de gastos entre participantes
- `chat_messages` - Mensajes del chat grupal
- `photos` - Álbum de fotos del viaje
- `locations` - Lugares visitados (para el mapa)

---

## 🏗️ Tablas y Relaciones

### Diagrama de Relaciones
```
users (auth.users - Supabase Auth)
  ↓
  ├─→ trips (1:N - creador)
  │     ↓
  │     ├─→ trip_participants (N:N con users)
  │     ├─→ expenses (1:N)
  │     │     ↓
  │     │     └─→ expense_splits (1:N)
  │     ├─→ chat_messages (1:N)
  │     ├─→ photos (1:N)
  │     └─→ locations (1:N)
  │
  └─→ expenses (1:N - quien pagó)
```

---

## 📋 Definición de Tablas

### 1. `users` (Perfil de Usuario)
**Extiende**: `auth.users` de Supabase

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos**:
- `id` (UUID, PK) - ID del usuario de Supabase Auth
- `full_name` (TEXT) - Nombre completo del usuario
- `email` (TEXT) - Email único del usuario
- `avatar_url` (TEXT, nullable) - URL de la foto de perfil
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Última actualización

**Usado en**:
- Dashboard: Mostrar nombre y avatar
- Header: Avatar y menú desplegable
- Participantes: Mostrar lista de viajeros

---

### 2. `trips` (Viajes/Sesiones)

```sql
CREATE TABLE public.trips (
  id BIGSERIAL PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subtitle TEXT,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image_url TEXT,
  session_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos**:
- `id` (BIGSERIAL, PK) - ID único del viaje
- `creator_id` (UUID, FK) - Usuario que creó el viaje
- `name` (TEXT) - Nombre del viaje (ej: "Aventura en Chile")
- `subtitle` (TEXT, nullable) - Subtítulo (ej: "Santiago & Valparaíso")
- `location` (TEXT, nullable) - Ubicación principal
- `start_date` (DATE) - Fecha de inicio
- `end_date` (DATE) - Fecha de fin
- `cover_image_url` (TEXT, nullable) - Imagen de portada
- `session_code` (TEXT, UNIQUE) - Código de 6 caracteres para unirse
- `status` (TEXT) - Estado: active, completed, cancelled
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Última actualización

**Usado en**:
- Dashboard: Hero card del viaje actual
- Dashboard: Lista de viajes pasados
- Create Session: Crear nuevo viaje
- Session Page: Header con detalles del viaje

**Índices**:
```sql
CREATE INDEX idx_trips_creator_id ON trips(creator_id);
CREATE INDEX idx_trips_session_code ON trips(session_code);
CREATE INDEX idx_trips_status ON trips(status);
```

---

### 3. `trip_participants` (Participantes del Viaje)

```sql
CREATE TABLE public.trip_participants (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);
```

**Campos**:
- `id` (BIGSERIAL, PK) - ID único
- `trip_id` (BIGINT, FK) - ID del viaje
- `user_id` (UUID, FK) - ID del usuario
- `role` (TEXT) - Rol: admin (creador) o member
- `joined_at` (TIMESTAMP) - Cuándo se unió al viaje

**Usado en**:
- Dashboard: Mostrar participantes con avatares
- Session: Lista de viajeros
- Permissions: Verificar quién tiene acceso al viaje

**Índices**:
```sql
CREATE INDEX idx_trip_participants_trip_id ON trip_participants(trip_id);
CREATE INDEX idx_trip_participants_user_id ON trip_participants(user_id);
```

---

### 4. `expenses` (Gastos)

```sql
CREATE TABLE public.expenses (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT,
  expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos**:
- `id` (BIGSERIAL, PK) - ID único del gasto
- `trip_id` (BIGINT, FK) - ID del viaje
- `paid_by_user_id` (UUID, FK) - Quién pagó el gasto
- `description` (TEXT) - Descripción (ej: "Almuerzo en el restaurante")
- `amount` (DECIMAL) - Monto total del gasto
- `category` (TEXT, nullable) - Categoría: comida, transporte, hotel, etc.
- `expense_date` (TIMESTAMP) - Cuándo se realizó el gasto
- `created_at` (TIMESTAMP) - Cuándo se registró
- `updated_at` (TIMESTAMP) - Última actualización

**Usado en**:
- Session: Lista de gastos
- Session: Gasto por persona
- Dashboard: Quick Stats (total gastado)
- Chatbot: Registro y visualización de gastos

**Índices**:
```sql
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_paid_by_user_id ON expenses(paid_by_user_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
```

---

### 5. `expense_splits` (División de Gastos)

```sql
CREATE TABLE public.expense_splits (
  id BIGSERIAL PRIMARY KEY,
  expense_id BIGINT NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  is_settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);
```

**Campos**:
- `id` (BIGSERIAL, PK) - ID único
- `expense_id` (BIGINT, FK) - ID del gasto
- `user_id` (UUID, FK) - Para quién es esta parte del gasto
- `amount` (DECIMAL) - Cuánto le corresponde a esta persona
- `is_settled` (BOOLEAN) - Si ya pagó su parte
- `created_at` (TIMESTAMP) - Cuándo se creó

**Usado en**:
- Session: Cálculo de "quién debe a quién"
- Dashboard: Balance individual (debes/te deben)
- Resumen de Deudas: Transacciones pendientes

**Índices**:
```sql
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX idx_expense_splits_is_settled ON expense_splits(is_settled);
```

**Lógica de División**:
```
Ejemplo: Gasto de S/100 entre 4 personas
- expense_id: 1, user_id: A, amount: 25
- expense_id: 1, user_id: B, amount: 25
- expense_id: 1, user_id: C, amount: 25
- expense_id: 1, user_id: D, amount: 25

Si A pagó el gasto completo (S/100):
- A tiene balance: +75 (pagó 100, le toca 25)
- B tiene balance: -25 (debe 25)
- C tiene balance: -25 (debe 25)
- D tiene balance: -25 (debe 25)
```

---

### 6. `chat_messages` (Mensajes del Chat)

```sql
CREATE TABLE public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_bot_message BOOLEAN DEFAULT FALSE,
  related_expense_id BIGINT REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos**:
- `id` (BIGSERIAL, PK) - ID único del mensaje
- `trip_id` (BIGINT, FK) - ID del viaje
- `user_id` (UUID, FK, nullable) - Quién envió (NULL si es bot)
- `message` (TEXT) - Contenido del mensaje
- `is_bot_message` (BOOLEAN) - Si es mensaje del bot
- `related_expense_id` (BIGINT, FK, nullable) - Si el mensaje está relacionado con un gasto
- `created_at` (TIMESTAMP) - Cuándo se envió

**Usado en**:
- Session: Chat grupal
- Chatbot: Conversación con el bot
- Historial: Registro de todas las interacciones

**Índices**:
```sql
CREATE INDEX idx_chat_messages_trip_id ON chat_messages(trip_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
```

**Ejemplo de flujo**:
```
1. Usuario: "Pagué 50 soles por el almuerzo"
   - user_id: 123, is_bot_message: false

2. Bot: "✅ Registrado: Juan pagó S/50 por almuerzo. Dividido entre 4 personas."
   - user_id: NULL, is_bot_message: true, related_expense_id: 456
```

---

### 7. `photos` (Álbum de Fotos)

```sql
CREATE TABLE public.photos (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  location_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos**:
- `id` (BIGSERIAL, PK) - ID único de la foto
- `trip_id` (BIGINT, FK) - ID del viaje
- `uploaded_by_user_id` (UUID, FK) - Quién subió la foto
- `photo_url` (TEXT) - URL de la foto (Supabase Storage)
- `caption` (TEXT, nullable) - Descripción de la foto
- `location_name` (TEXT, nullable) - Nombre del lugar
- `latitude` (DECIMAL, nullable) - Coordenada GPS
- `longitude` (DECIMAL, nullable) - Coordenada GPS
- `taken_at` (TIMESTAMP, nullable) - Cuándo se tomó la foto
- `created_at` (TIMESTAMP) - Cuándo se subió

**Usado en**:
- Dashboard: Quick Stats (contador de fotos)
- Álbum: Galería de fotos del viaje
- Mapa: Mostrar fotos en ubicaciones específicas

**Índices**:
```sql
CREATE INDEX idx_photos_trip_id ON photos(trip_id);
CREATE INDEX idx_photos_uploaded_by_user_id ON photos(uploaded_by_user_id);
```

---

### 8. `locations` (Lugares Visitados)

```sql
CREATE TABLE public.locations (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  category TEXT,
  visited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos**:
- `id` (BIGSERIAL, PK) - ID único del lugar
- `trip_id` (BIGINT, FK) - ID del viaje
- `added_by_user_id` (UUID, FK) - Quién agregó el lugar
- `name` (TEXT) - Nombre del lugar
- `description` (TEXT, nullable) - Descripción
- `latitude` (DECIMAL) - Coordenada GPS
- `longitude` (DECIMAL) - Coordenada GPS
- `category` (TEXT, nullable) - Tipo: restaurante, hotel, atracción, etc.
- `visited_at` (TIMESTAMP, nullable) - Cuándo se visitó
- `created_at` (TIMESTAMP) - Cuándo se agregó

**Usado en**:
- Dashboard: Quick Stats (lugares visitados)
- Mapa: Marcadores de lugares visitados
- Timeline: Cronología del viaje

**Índices**:
```sql
CREATE INDEX idx_locations_trip_id ON locations(trip_id);
CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);
```

---

## 🔐 Políticas de Seguridad (Row Level Security)

### Habilitar RLS en todas las tablas:
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
```

### Políticas para `users`:
```sql
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);
```

### Políticas para `trips`:
```sql
-- Usuarios pueden ver viajes donde son participantes
CREATE POLICY "Users can view trips they participate in"
  ON public.trips
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = trips.id AND user_id = auth.uid()
    )
  );

-- Usuarios pueden crear viajes
CREATE POLICY "Users can create trips"
  ON public.trips
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Solo el creador puede actualizar el viaje
CREATE POLICY "Only creator can update trip"
  ON public.trips
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Solo el creador puede eliminar el viaje
CREATE POLICY "Only creator can delete trip"
  ON public.trips
  FOR DELETE
  USING (auth.uid() = creator_id);
```

### Políticas para `trip_participants`:
```sql
-- Usuarios pueden ver participantes de sus viajes
CREATE POLICY "Users can view trip participants"
  ON public.trip_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_participants tp
      WHERE tp.trip_id = trip_participants.trip_id
        AND tp.user_id = auth.uid()
    )
  );

-- Usuarios pueden unirse a viajes
CREATE POLICY "Users can join trips"
  ON public.trip_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Políticas para `expenses`:
```sql
-- Usuarios pueden ver gastos de sus viajes
CREATE POLICY "Users can view trip expenses"
  ON public.expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = expenses.trip_id AND user_id = auth.uid()
    )
  );

-- Participantes pueden crear gastos
CREATE POLICY "Participants can create expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = expenses.trip_id AND user_id = auth.uid()
    )
  );

-- Solo quien pagó puede actualizar/eliminar el gasto
CREATE POLICY "Only payer can update expense"
  ON public.expenses
  FOR UPDATE
  USING (auth.uid() = paid_by_user_id);

CREATE POLICY "Only payer can delete expense"
  ON public.expenses
  FOR DELETE
  USING (auth.uid() = paid_by_user_id);
```

### Políticas similares para las demás tablas...
(Seguir el mismo patrón de "solo participantes del viaje pueden ver/modificar")

---

## 🔍 Vistas y Funciones Útiles

### Vista: Balance por Usuario en un Viaje
```sql
CREATE OR REPLACE VIEW user_trip_balances AS
SELECT
  tp.trip_id,
  tp.user_id,
  u.full_name,
  COALESCE(SUM(CASE WHEN e.paid_by_user_id = tp.user_id THEN e.amount ELSE 0 END), 0) AS total_paid,
  COALESCE(SUM(es.amount), 0) AS total_owed,
  COALESCE(SUM(CASE WHEN e.paid_by_user_id = tp.user_id THEN e.amount ELSE 0 END), 0)
    - COALESCE(SUM(es.amount), 0) AS balance
FROM trip_participants tp
JOIN users u ON tp.user_id = u.id
LEFT JOIN expenses e ON e.trip_id = tp.trip_id
LEFT JOIN expense_splits es ON es.user_id = tp.user_id
GROUP BY tp.trip_id, tp.user_id, u.full_name;
```

**Uso**:
```sql
-- Ver balance de todos los usuarios en un viaje
SELECT * FROM user_trip_balances WHERE trip_id = 1;

-- Balance positivo = le deben dinero
-- Balance negativo = debe dinero
```

### Función: Calcular días del viaje
```sql
CREATE OR REPLACE FUNCTION get_trip_duration(trip_id_param BIGINT)
RETURNS TABLE(
  total_days INTEGER,
  current_day INTEGER,
  days_left INTEGER,
  progress_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (end_date - start_date + 1)::INTEGER AS total_days,
    LEAST((CURRENT_DATE - start_date + 1)::INTEGER, (end_date - start_date + 1)::INTEGER) AS current_day,
    GREATEST((end_date - CURRENT_DATE)::INTEGER, 0) AS days_left,
    ROUND(
      (LEAST((CURRENT_DATE - start_date + 1)::NUMERIC, (end_date - start_date + 1)::NUMERIC)
      / (end_date - start_date + 1)::NUMERIC) * 100,
      1
    ) AS progress_percent
  FROM trips
  WHERE id = trip_id_param;
END;
$$ LANGUAGE plpgsql;
```

**Uso**:
```sql
SELECT * FROM get_trip_duration(1);
```

### Función: Calcular resumen de deudas
```sql
CREATE OR REPLACE FUNCTION calculate_debt_summary(trip_id_param BIGINT)
RETURNS TABLE(
  debtor_id UUID,
  debtor_name TEXT,
  creditor_id UUID,
  creditor_name TEXT,
  amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH balances AS (
    SELECT * FROM user_trip_balances WHERE trip_id = trip_id_param
  )
  SELECT
    debtor.user_id AS debtor_id,
    debtor.full_name AS debtor_name,
    creditor.user_id AS creditor_id,
    creditor.full_name AS creditor_name,
    LEAST(ABS(debtor.balance), creditor.balance) AS amount
  FROM balances debtor
  CROSS JOIN balances creditor
  WHERE debtor.balance < 0
    AND creditor.balance > 0
    AND debtor.trip_id = creditor.trip_id
  ORDER BY amount DESC;
END;
$$ LANGUAGE plpgsql;
```

**Uso**:
```sql
-- Ver quién debe a quién en el viaje
SELECT * FROM calculate_debt_summary(1);
```

---

## 📊 Queries Útiles para el Frontend

### Dashboard: Obtener viaje activo del usuario
```sql
SELECT
  t.*,
  COUNT(DISTINCT tp.user_id) AS participant_count,
  COALESCE(SUM(e.amount), 0) AS total_spent,
  COUNT(DISTINCT p.id) AS photo_count,
  COUNT(DISTINCT l.id) AS location_count,
  get_trip_duration(t.id) AS duration_info
FROM trips t
LEFT JOIN trip_participants tp ON t.id = tp.trip_id
LEFT JOIN expenses e ON t.id = e.trip_id
LEFT JOIN photos p ON t.id = p.trip_id
LEFT JOIN locations l ON t.id = l.trip_id
WHERE t.status = 'active'
  AND EXISTS (
    SELECT 1 FROM trip_participants
    WHERE trip_id = t.id AND user_id = auth.uid()
  )
GROUP BY t.id
ORDER BY t.start_date DESC
LIMIT 1;
```

### Session: Obtener todos los gastos con divisiones
```sql
SELECT
  e.*,
  u.full_name AS payer_name,
  u.avatar_url AS payer_avatar,
  json_agg(
    json_build_object(
      'user_id', es.user_id,
      'amount', es.amount,
      'is_settled', es.is_settled
    )
  ) AS splits
FROM expenses e
JOIN users u ON e.paid_by_user_id = u.id
LEFT JOIN expense_splits es ON e.id = es.expense_id
WHERE e.trip_id = $1
GROUP BY e.id, u.full_name, u.avatar_url
ORDER BY e.expense_date DESC;
```

### Session: Gasto por persona
```sql
SELECT
  u.id,
  u.full_name,
  COALESCE(SUM(e.amount), 0) AS total_spent,
  COUNT(e.id) AS expense_count
FROM trip_participants tp
JOIN users u ON tp.user_id = u.id
LEFT JOIN expenses e ON e.paid_by_user_id = u.id AND e.trip_id = tp.trip_id
WHERE tp.trip_id = $1
GROUP BY u.id, u.full_name
ORDER BY total_spent DESC;
```

---

## 🚀 Script de Inicialización Completo

```sql
-- ============================================
-- JOURNI DATABASE SCHEMA
-- ============================================

-- 1. Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Crear tablas
-- (Ver secciones anteriores para cada CREATE TABLE)

-- 3. Habilitar RLS
-- (Ver sección de políticas)

-- 4. Crear índices
-- (Ver cada tabla)

-- 5. Crear vistas y funciones
-- (Ver sección de vistas)

-- 6. Insertar datos de ejemplo (opcional, para testing)
-- Ver siguiente sección
```

---

## 🎯 Datos de Ejemplo (Para Testing)

```sql
-- Ejemplo de viaje con gastos
INSERT INTO trips (creator_id, name, subtitle, location, start_date, end_date, session_code, cover_image_url)
VALUES (
  auth.uid(),
  'Aventura en Chile',
  'Santiago & Valparaíso',
  'Chile',
  '2024-10-10',
  '2024-10-17',
  'ABC123',
  '/assets/trip-chile.png'
);

-- Agregar participantes
-- (Insertar después de que los usuarios se registren)

-- Ejemplo de gasto
INSERT INTO expenses (trip_id, paid_by_user_id, description, amount, category)
VALUES (
  1,
  auth.uid(),
  'Almuerzo en el restaurante',
  50.00,
  'comida'
);

-- División del gasto entre 4 personas
-- (Insertar automáticamente cuando se crea el gasto)
```

---

## ✅ Checklist de Implementación

### Pasos para configurar la BD en Supabase:

1. ✅ **Crear proyecto en Supabase**
   - Ya tienes las credenciales en `.env.local`

2. ⬜ **Ejecutar scripts de schema**
   - SQL Editor → Copiar y ejecutar cada CREATE TABLE
   - Ejecutar en orden: users → trips → trip_participants → expenses → expense_splits → chat_messages → photos → locations

3. ⬜ **Configurar RLS**
   - Habilitar RLS en cada tabla
   - Crear políticas de seguridad

4. ⬜ **Crear índices**
   - Ejecutar todos los CREATE INDEX

5. ⬜ **Crear vistas y funciones**
   - Ejecutar CREATE VIEW y CREATE FUNCTION

6. ⬜ **Configurar Storage**
   - Crear bucket para fotos: `trip-photos`
   - Configurar políticas de acceso

7. ⬜ **Testing**
   - Insertar datos de ejemplo
   - Probar queries desde el frontend

---

## 📚 Recursos Adicionales

### Supabase Docs:
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)
- [Realtime](https://supabase.com/docs/guides/realtime) - Para chat en tiempo real

### Optimizaciones Futuras:
- Agregar trigger para auto-crear expense_splits cuando se crea un gasto
- Agregar función para auto-calcular balances
- Implementar notificaciones en tiempo real con Supabase Realtime
- Agregar soft deletes (deleted_at) en lugar de DELETE CASCADE

---

**Creado**: 2024-11-29
**Última actualización**: 2024-11-29
**Versión**: 1.0
**Autor**: Claude Code Assistant
