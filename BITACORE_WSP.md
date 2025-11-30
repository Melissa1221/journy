# INTEGRACIÓN WHATSAPP - BITÁCORA

## ESTADO ACTUAL: MVP FUNCIONAL (con bug en "unirme")

---

## DIFICULTADES IDENTIFICADAS

### 1. Modelo de Comunicación
| Web App                             | WhatsApp/Twilio                  |
|-------------------------------------|----------------------------------|
| WebSocket bidireccional persistente | HTTP Webhooks (request/response) |
| Streaming de respuestas (chunks)    | Una sola respuesta completa      |
| Conexión abierta siempre            | Stateless, timeout ~15 segundos  |

### 2. Identificación de Usuarios
| Web App                       | WhatsApp                                    |
|-------------------------------|---------------------------------------------|
| user_id (JWT o token anónimo) | Número de teléfono +51999888777             |
| session_code en URL           | Usuario debe enviar código para vincularse  |

### 3. Contexto Multi-Trip
Usuario puede estar en múltiples trips. Solución: usar `active_trip_id` por defecto.

### 4. Timeouts de Twilio
15 segundos máximo. Solución: responder 200 OK inmediato + enviar respuesta async.

---

## EVALUACIÓN DE ARQUITECTURA (REVISADA)

### Lo que YA está bien:
- `graph.py` está **desacoplado** del transporte
- `graph.ainvoke()` ya existe para invocación sin streaming
- Helpers reutilizables: `build_multimodal_content()`, `calculate_debts()`, etc.

### Complejidad REAL: **BAJA-MEDIA** (no alta como se pensó inicialmente)

---

## PLAN DE IMPLEMENTACIÓN

### FASE 0: Setup Dev Environment [COMPLETADO]
- [x] Verificar tilt y ngrok instalados
- [x] Agregar variables Twilio al .env
- [x] Crear Tiltfile (front + back + ngrok)
- [x] Instalar dependencia twilio

### FASE 1: Core WhatsApp (MVP) [COMPLETADO]
- [x] Crear `process_message_complete()` en main.py
- [x] Crear `services/whatsapp_service.py`
- [x] Crear endpoints:
  - [x] GET  `/api/whatsapp/webhook` (verificación)
  - [x] POST `/api/whatsapp/webhook` (recibir mensajes)
- [x] Testear con ngrok + Twilio sandbox
- [x] **BUG RESUELTO**: "unirme CODIGO" - cambiado a `await session_service.get_trip_by_code()`

### FASE 2: Mapeo de Usuarios [EN PROGRESO]
- [x] Mapeo en memoria (whatsapp_service._users)
- [ ] Persistir en base de datos (tabla whatsapp_users)
- [x] Flujo onboarding: "unirme ABC123" → vincular trip (con bug)

### FASE 3: Multimodalidad [COMPLETADO]
- [x] Estructura para recibir imágenes (MediaUrl parsing)
- [x] Descargar y procesar imágenes de Twilio → Vision API
- [x] Recibir audio → transcribir con Whisper → enviar como texto
- [x] Filtrado por tipo de media (image/* vs audio/*)

### FASE 4: Sincronización Web ↔ WhatsApp [PARCIAL]
- [x] Mensajes WhatsApp persisten en LangGraph state
- [x] Broadcast a usuarios web (room_manager.broadcast)

## ARQUITECTURA FINAL

```
                    ┌─────────────────────────────────────────┐
                    │           LANGGRAPH AGENT               │
                    │  graph.ainvoke() / graph.astream()      │
                    └─────────────────┬───────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼─────────┐   ┌─────────▼─────────┐
    │  WebSocket Handler │   │  WhatsApp Handler │
    │  /ws/{id}/{user}   │   │  /api/whatsapp/   │
    │                    │   │     webhook       │
    │  - Streaming ✓     │   │  - Sync response  │
    │  - RoomManager     │   │  - Twilio client  │
    └────────────────────┘   └─────────┬─────────┘
                                       │
                             ┌─────────▼─────────┐
                             │ process_message   │
                             │ _complete()       │
                             │ (wrapper ~50 LOC) │
                             └─────────┬─────────┘
                                       │
                             ┌─────────▼─────────┐
                             │   Twilio API      │
                             │   Send Message    │
                             └───────────────────┘
```

---

## ARCHIVOS CREADOS/MODIFICADOS

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `Tiltfile` | NUEVO | Dev environment (front + back + ngrok) |
| `backend/.env` | MODIFICADO | Variables Twilio agregadas |
| `backend/.env.example` | MODIFICADO | Template actualizado |
| `backend/services/whatsapp_service.py` | NUEVO | Servicio WhatsApp + Twilio client |
| `backend/main.py` | MODIFICADO | Endpoints webhook + `process_message_complete()` |

---

## CONFIGURACIÓN

### Variables de Entorno (.env)
```
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Twilio Sandbox Setup
1. Ir a https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Conectar teléfono al sandbox: enviar "join <palabra>" al +14155238886
3. Configurar webhook URL: `https://<ngrok-url>/api/whatsapp/webhook`

### Comandos WhatsApp Implementados
- `hola` / cualquier mensaje → Pide unirse a viaje
- `unirme CODIGO` → Vincula al trip (BUG: falla por función sync)
- `mis viajes` → Muestra viaje activo
- `ayuda` → Lista de comandos
- `balance` → (pendiente de probar)

---

## BUGS CONOCIDOS

### BUG-001: "unirme CODIGO" falla [RESUELTO ✓]
**Síntoma**: Responde "Hubo un error al unirte al viaje"
**Causa**: Usando `get_db().get_trip_by_code()` que no existe
**Solución**: Cambiar a `await session_service.get_trip_by_code()`
**Archivo**: `main.py:2422` (antes era 2422-2423)
**Estado**: RESUELTO - 2025-11-30

---

## LOG DE PROGRESO

### 2025-11-30 01:15
- Evaluación inicial de arquitectura
- Descubrimiento: graph.py ya está desacoplado
- Reducción de complejidad: Alta → Baja-Media

### 2025-11-30 01:20
- Creado Tiltfile
- Instalado twilio
- Creado whatsapp_service.py
- Agregados endpoints webhook a main.py
- Probado localmente con curl - FUNCIONA

### 2025-11-30 01:22
- Configurado ngrok + webhook en Twilio
- Primera prueba real desde WhatsApp
- Mensaje "hola" → Responde correctamente
- Mensaje "unirme AKJBWR" → ERROR (bug identificado)

### 2025-11-30 (continúa)
- BUG-001 RESUELTO: Cambiado `get_db().get_trip_by_code()` → `await session_service.get_trip_by_code()`
- Test local exitoso: `WhatsApp message sent: SM19f9f44d58fe69046d06957a158f7525`
- FASE 1 completada

### 2025-11-30 - FASE 5: Vinculación de Cuentas Web ↔ WhatsApp
- Creada migración `008_whatsapp_linking.sql` con columnas `phone_number` y `whatsapp_linked_at`
- Creada tabla `whatsapp_verification_codes` para códigos de verificación temporales
- Creado componente `LinkWhatsAppDialog.tsx` en frontend con flujo de 3 pasos
- Agregado botón "Vincular WhatsApp" en el dropdown del Header
- Backend endpoints:
  - `POST /api/whatsapp/generate-code` - Genera código de verificación
  - `GET /api/whatsapp/verify-status?code=XXX` - Polling de estado de verificación
- Nuevo comando WhatsApp: `vincular CODE` - Vincula número a cuenta web

---

## PRÓXIMOS PASOS

1. [x] ~~Arreglar BUG-001 (unirme CODIGO)~~ HECHO
2. [x] ~~Persistir usuarios WhatsApp en DB~~ HECHO (via `vincular` command)
3. [ ] **REINICIAR BACKEND** en Tilt para aplicar cambios
4. [ ] **APLICAR MIGRACIÓN** `008_whatsapp_linking.sql` en Supabase
5. [ ] Probar flujo completo de vinculación: web → WhatsApp → verificación
6. [ ] Probar que gastos de WhatsApp usen el nombre del usuario vinculado
