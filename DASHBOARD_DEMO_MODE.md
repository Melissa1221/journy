# 🎯 Dashboard Demo Mode - Guía de Uso

## 📋 Resumen

El dashboard ahora tiene **dos modos** para facilitar las presentaciones y demos:

1. **Modo Empty State** (Primera vez): Perfecto para demos desde cero
2. **Modo Con Viaje Activo**: Para mostrar la funcionalidad completa

## 🚀 Cómo Cambiar de Modo

### Archivo: `src/app/dashboard/page.tsx`

En la línea **32**, encontrarás esta variable:

```typescript
const hasActiveTrip = true; // Change to false for demo from scratch
```

### Para Demo desde Cero (Empty State):
```typescript
const hasActiveTrip = false;
```

### Para Mostrar Viaje Activo:
```typescript
const hasActiveTrip = true;
```

## 🎨 ¿Qué Muestra Cada Modo?

### Modo Empty State (`hasActiveTrip = false`)

**Ideal para presentar el flujo completo desde el inicio:**

✨ **Muestra:**
- ✈️ Animación de avión flotante
- Mensaje de bienvenida: "¡Bienvenido a tu hub de aventuras!"
- 2 cards interactivas:
  - 🚀 **Crear mi viaje** (lleva a `/create-session`)
  - 🎉 **Unirme a un viaje** (modal para ingresar código)
- Preview de features: Balance, Álbum, Mapa

**Perfecto para:**
- Demos del flujo completo
- Presentaciones del pitch
- Mostrar onboarding de nuevos usuarios
- Hackathons y competencias

### Modo Con Viaje Activo (`hasActiveTrip = true`)

**Muestra la funcionalidad completa:**

✨ **Muestra:**
- Hero card del viaje activo: "Aventura en Chile"
- Estadísticas en tiempo real
- Participantes del viaje
- Viajes anteriores (Paracas, Machu Picchu)
- Botón para crear nuevo viaje
- Floating action button (+)

**Perfecto para:**
- Demos de funcionalidades
- Mostrar el uso diario
- Testing de features
- Screenshots para marketing

## 📱 Navegación del Demo Completo

### Flujo Sugerido para Presentaciones:

1. **Inicio** → Landing page (`/`)
   - Mostrar el problema (estadísticas)
   - Explicar la solución

2. **Auth** → Login/Registro (`/auth`)
   - Crear cuenta o iniciar sesión
   - Verificación de email

3. **Dashboard Empty** → Primera vez (`/dashboard` con `hasActiveTrip = false`)
   - Click en "Crear mi viaje"

4. **Crear Sesión** → (`/create-session`)
   - Llenar detalles del viaje
   - Generar código

5. **Dashboard Activo** → (`/dashboard` con `hasActiveTrip = true`)
   - Mostrar viaje en progreso
   - Agregar gastos
   - Ver balance automático
   - Subir fotos

## 💡 Tips para Demos

### 1. Prepara dos ventanas del navegador:
- Ventana 1: Empty state (para mostrar inicio)
- Ventana 2: Con viaje activo (para mostrar funcionalidad)

### 2. Usa modo incógnito:
- Para simular diferentes usuarios
- Para mostrar el flujo de unirse a un viaje

### 3. Ten listas screenshots:
- Del flujo completo
- De las features principales
- Del responsive design (mobile + desktop)

### 4. Practica el cambio rápido:
- Cambia `hasActiveTrip` entre demos
- Recarga la página (Cmd/Ctrl + R)

## 🎬 Script Sugerido para Demo

```
1. Landing → "Miren el problema que resolvemos..." (30 seg)
2. Auth → "Creamos una cuenta en segundos" (20 seg)
3. Empty State → "Primera vez que entras, esto es lo que ves" (15 seg)
4. Create Trip → "Creamos nuestro viaje a Chile con Los Plátanos" (30 seg)
5. Dashboard Activo → "Y así se ve el viaje en progreso" (60 seg)
   - Mostrar balance
   - Mostrar participantes
   - Agregar gasto de ejemplo
6. Features → "Además tenemos álbum y mapa" (30 seg)
```

**Total: ~3 minutos** ⏱️

## 🔧 Personalización Rápida

### Cambiar el viaje de ejemplo:

En el mismo archivo `page.tsx`, líneas 35-60, puedes modificar:
- `name`: Nombre del viaje
- `location`: Destino
- `participants`: Lista de viajeros
- `stats`: Gastos, fotos, lugares

### Agregar más viajes pasados:

Líneas 63-82, en el array `pastTrips`

## ✅ Checklist Pre-Demo

- [ ] Decidir qué modo usar (`hasActiveTrip = true/false`)
- [ ] Verificar que todas las imágenes cargan
- [ ] Probar la navegación completa
- [ ] Verificar responsive en mobile
- [ ] Preparar datos de ejemplo realistas
- [ ] Tener el script memorizado
- [ ] Backup plan si falla internet (screenshots/video)

## 🚨 Troubleshooting

**Problema:** No se ve el cambio después de modificar `hasActiveTrip`
- **Solución:** Recarga la página (Cmd/Ctrl + R)

**Problema:** Aparece error en consola
- **Solución:** Verifica que el valor sea `true` o `false` (sin comillas)

**Problema:** El FAB (+) no aparece en empty state
- **Solución:** Es correcto, solo aparece cuando hay viaje activo

---

💪 ¡Ahora tienes un dashboard súper flexible para tus demos y presentaciones!
