# Migración a DHIS2 v43 — Tracker (operaciones de **lectura**)

Análisis de `tracker43.md` (documentación oficial) contra el código actual del
cliente d2-api, focalizado en endpoints de **lectura** del Tracker:

- `GET /api/tracker/trackedEntities` (colección y `/{uid}`)
- `GET /api/tracker/enrollments` (colección y `/{uid}`)
- `GET /api/tracker/events` (colección y `/{uid}`)
- `GET /api/tracker/relationships`
- `GET /api/tracker/trackedEntities/{uid}/changeLogs`
- `GET /api/tracker/events/{uid}/changeLogs`

Los endpoints legacy `GET /api/trackedEntityInstance|events|enrollments|relationships`
ya fueron **eliminados en v42**, así que en v43 no hay cambios adicionales por ese lado:
si tu código sigue usando esos endpoints, ya está roto. El cliente actual ya apunta
a `/api/tracker/*`, así que ese punto está cubierto.

---

## 1. Resumen de impactos

| Área | Impacto v43 | Severidad |
|---|---|---|
| Param `programStatus` en `GET /tracker/trackedEntities` | **Eliminado** (usar `enrollmentStatus`) | Breaking |
| Param `programStatus` en `GET /tracker/enrollments` | **Eliminado** (usar `status`) | Breaking |
| Param `programStatus` en `GET /tracker/events` | **Eliminado** (usar `enrollmentStatus`) | Breaking |
| `assignedUserMode=ALL` en `GET /tracker/events` | Ya no aparece en la lista permitida del doc (sí en `/trackedEntities`) | Posible breaking |
| Tipos de respuesta incompletos (TE, Enrollment, Event, Relationship, Note) | Faltan campos respecto al doc v43 | No-breaking, pero deja typings débiles |
| Endpoints faltantes (`getById` para TE/Enrollment, changeLogs, relationships) | No implementados | Funcionalidad faltante |

---

## 2. Cambios **breaking** confirmados por el doc v43

### 2.1 `GET /api/tracker/trackedEntities`

El doc marca explícitamente:

> `programStatus` **deprecated for removal in version 43, use `enrollmentStatus`**

Y el archivo `src/api/trackerTrackedEntities.ts` declara *los dos* parámetros
en `TrackedEntitiesParamsBase` (`src/api/trackerTrackedEntities.ts:165-166`):

```ts
programStatus: ProgramStatus;     // <-- eliminar en v43
enrollmentStatus: ProgramStatus;  // <-- el único válido a partir de v43
```

**Acción**: borrar `programStatus` del tipo. La integración test
(`src/api/__test__/trackerTrackedEntities.integration.test.ts:40`) ya usa
`enrollmentStatus`, así que no hay regresión de tests.

### 2.2 `GET /api/tracker/enrollments`

Doc:

> `programStatus` **deprecated for removal in version 43, use `status`**

El código (`src/api/trackerEnrollments.ts:97-98`) ya tiene la marca
`@deprecated and to be removed in v43`:

```ts
status: ProgramStatus;
/** @deprecated and to be removed in v43. use status */
programStatus: ProgramStatus;
```

**Acción**: eliminar `programStatus` de `TrackerEnrollmentsParamsBase`.
Atención: el test `src/api/__test__/trackerEnrollments.integration.test.ts:33-51`
("honors the legacy programStatus alias server-side") va a romper contra v43 —
hay que reescribirlo o borrarlo.

### 2.3 `GET /api/tracker/events`

Doc:

> `programStatus` **deprecated for removal in version 43, use `enrollmentStatus`**

El código (`src/api/trackerEvents.ts:115-116`):

```ts
programStatus?: ProgramStatus;     // <-- eliminar en v43
enrollmentStatus?: ProgramStatus;  // <-- el único válido
```

**Acción**: eliminar `programStatus` de `EventsParamsBase`. El test
(`trackerEvents.integration.test.ts:44-62`) ya usa `enrollmentStatus`.

### 2.4 `assignedUserMode` en `/tracker/events`

Doc v43 (line 2535) lista solo `CURRENT, PROVIDED, NONE, ANY` para events
(sin `ALL`). En cambio, `/tracker/trackedEntities` (line 1787) **sí** acepta `ALL`.

Código actual (`src/api/trackerEvents.ts:146`):

```ts
assignedUserMode?: "CURRENT" | "PROVIDED" | "NONE" | "ANY" | "ALL";
```

**Acción**: validar contra una instancia v43; si `ALL` ya no es válido para events,
ajustar el tipo a `"CURRENT" | "PROVIDED" | "NONE" | "ANY"`. Para
`trackerTrackedEntities` (línea 178) mantener `ALL`.

---

## 3. Respuestas de lectura: campos faltantes en los tipos

El doc v43 expone más campos de los que tipa el cliente. No bloquean la migración,
pero conviene corregirlo aprovechando el cambio de versión (Boy Scout Rule).

### 3.1 `D2TrackerEnrollment` (`src/api/trackerEnrollments.ts:34-60`)

Falta:

- `attributeOptionCombo: Id` — documentado en la tabla de Enrollment (line 98 del doc).

### 3.2 `Relationship` (`src/api/trackerTrackedEntities.ts:111-117`)

Faltan:

- `createdAt`, `updatedAt`, `createdAtClient` — todos `IsoDate`.
- `bidirectional: boolean`.

### 3.3 `RelationshipItem` (`src/api/trackerTrackedEntities.ts:119-124`)

Falta el caso `enrollment`:

```ts
enrollment?: { enrollment: Id };
```

El doc lo lista explícitamente como uno de los tres tipos posibles (line 167).

### 3.4 `Note` (`src/api/trackerEvents.ts:96-101`)

Falta `createdBy: UserInfo` (line 299 del doc).

### 3.5 `D2TrackerEventBase` (`src/api/trackerEvents.ts:46-75`)

Ya tiene `enrollmentStatus`, `attributeCategoryOptions`, etc. Está alineado.
Confirmar que `followUp` (no `followup`) sigue siendo el nombre correcto en la
respuesta — el test `trackerEvents.integration.test.ts:27-42` ya valida ese caso.

### 3.6 `D2TrackerTrackedEntityBase` (`src/api/trackerTrackedEntities.ts:64-86`)

Aparentemente completo. Verificar campo `storedBy` (en el doc es opcional para algunos
objetos: `storedBy: Username` está bien tipado).

---

## 4. Endpoints de lectura **no implementados** en el cliente

Estos endpoints existen en v43 (y existían en v42) pero el cliente no los expone.
No es un breaking change de v43, pero al migrar conviene decidir si añadirlos:

| Endpoint | Estado en el cliente |
|---|---|
| `GET /api/tracker/trackedEntities/{uid}` | **Falta** `TrackedEntities.getById` |
| `GET /api/tracker/enrollments/{uid}` | **Falta** `TrackerEnrollments.getById` |
| `GET /api/tracker/events/{uid}` | OK (`TrackerEvents.getById` en `src/api/trackerEvents.ts:21`) |
| `GET /api/tracker/relationships` | **Falta** clase `TrackerRelationships` (sólo existe el tipo) |
| `GET /api/tracker/trackedEntities/{uid}/changeLogs` | **Falta** |
| `GET /api/tracker/events/{uid}/changeLogs` | **Falta** |

`Tracker` (`src/api/tracker.ts:13-50`) sólo expone `trackedEntities`, `enrollments`,
`events`. Habría que añadir `relationships` y, opcionalmente, los `changeLogs`.

---

## 5. Cambios menores / verificaciones

- **`idScheme` en lectura**: el doc v43 lo restringe a `UID | CODE | NAME | ATTRIBUTE:{uid}`.
  En el cliente está tipado como `IdScheme = string` (`trackerTrackedEntities.ts:62`,
  `trackerEvents.ts:44`). Funcionalmente correcto, pero se podría endurecer derivando
  el tipo de un `const` array (ver CLAUDE.md §TypeScript).
- **Pagination**: sin cambios. `page`, `pageSize`, `totalPages`, `paging` siguen igual.
- **`order`**:
  - `trackedEntities`: los campos válidos siguen siendo `createdAt, createdAtClient,
    enrolledAt, inactive, trackedEntity, updatedAt, updatedAtClient` — ya cubiertos
    en `TrackedOrderField` (`trackerTrackedEntities.ts:194-204`).
  - `events`: la lista soportada en v43 incluye más campos
    (`assignedUser, assignedUserDisplayName, attributeOptionCombo, completedAt,
    completedBy, createdBy, deleted, enrolledAt, enrollment, enrollmentStatus, event,
    followUp, occurredAt, orgUnit, program, programStage, scheduledAt, status, storedBy,
    trackedEntity, updatedBy`, entre otros). Actualmente `events.order` está tipado
    como `CommaDelimitedListOfUid` (string), así que no es restrictivo — opcionalmente,
    pasarlo a una unión literal como ya está en `trackedEntities`.
  - `enrollments`: idem (`completedAt, createdAt, createdAtClient, enrolledAt,
    updatedAt, updatedAtClient`).
- **CSV / ZIP / GZIP** para `trackedEntities` y `events`: no hay soporte en el
  cliente (todo va vía JSON). No es regresión.

---

## 6. Checklist de migración (sólo lectura)

1. [ ] Eliminar `programStatus` de `TrackedEntitiesParamsBase` (`src/api/trackerTrackedEntities.ts:165`).
2. [ ] Eliminar `programStatus` de `TrackerEnrollmentsParamsBase` (`src/api/trackerEnrollments.ts:98`) y borrar/reescribir el test "honors the legacy programStatus alias server-side".
3. [ ] Eliminar `programStatus` de `EventsParamsBase` (`src/api/trackerEvents.ts:115`).
4. [ ] Validar contra v43 si `assignedUserMode=ALL` sigue siendo válido para `/tracker/events`; si no, removerlo del tipo.
5. [ ] Añadir `attributeOptionCombo: Id` a `D2TrackerEnrollment`.
6. [ ] Ampliar `Relationship` con `createdAt`, `updatedAt`, `createdAtClient`, `bidirectional`.
7. [ ] Ampliar `RelationshipItem` con `enrollment?: { enrollment: Id }`.
8. [ ] Añadir `createdBy: UserInfo` a `Note`.
9. [ ] Migrar los 3 archivos de tests de integración para que importen `../../2.43` en lugar de `../../2.42` y apuntar a `play.dhis2.org/43`.
10. [ ] (Opcional, pero recomendado) Añadir `TrackedEntities.getById`, `TrackerEnrollments.getById`, `TrackerRelationships.get` y los `changeLogs`.

---

## 7. Notas sobre el flujo de migración

- El directorio `src/2.43/` ya existe (renombrado desde `2.42/`) y `src/index.ts`
  reexporta `./2.43`. Falta:
  - Actualizar los tests para importar `../../2.43`.
  - Generar/regenerar `src/2.43/schemas.ts` si la generación depende de la versión
    de DHIS2 (`src/scripts/generate-schemas.ts`).
- El servidor v43 sigue aceptando `/api/tracker/*` con los mismos verbos. El
  formato de respuesta JSON descrito en el doc coincide con lo que el cliente ya
  decodifica; sólo cambian los puntos enumerados arriba.
