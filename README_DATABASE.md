# 🗄️ Database Setup - Journi

## 📂 Estructura de Archivos

```
my-app/
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql      # Crea 8 tablas + índices
│       ├── 002_rls_policies.sql        # Políticas de seguridad
│       └── 003_views_and_functions.sql # Vistas y funciones útiles
├── DATABASE_SETUP_GUIDE.md             # Guía paso a paso
├── MIGRATION_STRATEGY.md               # Estrategia de migración
└── DATABASE_SCHEMA.md                  # Schema completo (deprecated)
```

## 🚀 Quick Start (3 pasos)

### 1️⃣ Obtener Connection String
Ve a tu [Supabase Dashboard](https://supabase.com/dashboard/project/jtnukzkvwsrsbvedrwsl/settings/database) y copia tu **PostgreSQL Connection String**.

### 2️⃣ Ejecutar Migraciones
1. Abre el [SQL Editor de Supabase](https://supabase.com/dashboard/project/jtnukzkvwsrsbvedrwsl/sql)
2. Ejecuta cada archivo **en orden**:
   ```
   ✅ supabase/migrations/001_initial_schema.sql
   ✅ supabase/migrations/002_rls_policies.sql
   ✅ supabase/migrations/003_views_and_functions.sql
   ```

### 3️⃣ Configurar Backend (Opcional)
Añade a `backend/.env`:
```bash
SUPABASE_DB_URL=postgresql://postgres.jtnukzkvwsrsbvedrwsl:[PASSWORD]@...
```

## ✅ Resultado

Después de ejecutar las migraciones tendrás:

- **8 tablas**: users, trips, trip_participants, expenses, expense_splits, chat_messages, photos, locations
- **35 políticas RLS**: Seguridad automática
- **14 índices**: Performance optimizada
- **6 funciones**: Cálculos de balance, deudas, códigos de sesión, etc.
- **2 vistas**: Balance por usuario, estadísticas de viajes
- **Auto expense splits**: Los gastos se dividen automáticamente

## 🔒 Seguridad

Row Level Security (RLS) está habilitado. Los usuarios solo pueden:
- ✅ Ver sus propios viajes
- ✅ Ver gastos de viajes donde participan
- ✅ Crear/editar solo sus propios gastos
- ✅ Ver perfiles solo de co-viajeros

## 💡 Características Automáticas

### 1. División Automática de Gastos
Cuando creas un gasto, se divide automáticamente entre todos los participantes:
```sql
INSERT INTO expenses (trip_id, paid_by_user_id, amount, description)
VALUES (1, 'user-uuid', 100, 'Cena');
-- ✅ Automáticamente crea expense_splits para cada participante
```

### 2. Cálculo de Balances
```sql
-- Ver quién debe a quién
SELECT * FROM calculate_debt_summary(1);

-- Ver balance de cada usuario
SELECT * FROM user_trip_balances WHERE trip_id = 1;
```

### 3. Generador de Códigos de Sesión
```sql
-- Generar código único de 6 caracteres
SELECT generate_session_code();
-- Retorna: "ABC123" (sin I, O, 0, 1, L para evitar confusión)
```

### 4. Estadísticas de Viajes
```sql
-- Ver estadísticas completas de un viaje
SELECT * FROM trip_summary_stats WHERE trip_id = 1;
```

## 🔧 Sin Cambios en el Código Actual

⚠️ **IMPORTANTE**: Estas migraciones **NO afectan** tu código actual:

- ✅ Tu app sigue funcionando igual
- ✅ Backend usa InMemorySaver (como antes)
- ✅ WebSocket sigue funcionando
- ✅ Supabase Storage sigue funcionando
- ✅ Solo añades la opción de persistencia

## 📊 Queries Útiles

### Ver mis viajes
```sql
SELECT t.*,
       COUNT(DISTINCT tp.user_id) as participants,
       COALESCE(SUM(e.amount), 0) as total_spent
FROM trips t
LEFT JOIN trip_participants tp ON t.id = tp.trip_id
LEFT JOIN expenses e ON t.id = e.trip_id
WHERE EXISTS (
  SELECT 1 FROM trip_participants
  WHERE trip_id = t.id AND user_id = auth.uid()
)
GROUP BY t.id;
```

### Ver gastos de un viaje
```sql
SELECT e.*, u.full_name as payer_name
FROM expenses e
JOIN users u ON e.paid_by_user_id = u.id
WHERE e.trip_id = 1
ORDER BY e.expense_date DESC;
```

### Calcular quién debe a quién
```sql
SELECT * FROM calculate_debt_summary(1);
```

## 🆘 Troubleshooting

### "Permission denied"
- Asegúrate de estar autenticado en Supabase
- Verifica que el usuario esté en `trip_participants`

### Backend no conecta
- Revisa el formato de `SUPABASE_DB_URL`
- Verifica que no haya espacios extra
- Chequea los logs del backend

### Tablas no aparecen
- Ejecuta las migraciones en orden: 001 → 002 → 003
- Refresca el navegador
- Revisa el SQL Editor por errores

## 📚 Documentos

- **DATABASE_SETUP_GUIDE.md**: Guía completa paso a paso
- **MIGRATION_STRATEGY.md**: Estrategia de migración sin romper nada
- **supabase/migrations/**: Scripts SQL listos para ejecutar

---

**Versión**: 1.0
**Última actualización**: 2024-11-29
**Proyecto**: Journi - AI-powered group expense tracking
