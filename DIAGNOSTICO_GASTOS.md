# Diagnóstico: Guardar Gastos de Fundación

## Estado del Análisis

He analizado el proyecto y confirmado que es **solo frontend** (Angular). El backend debe estar corriendo en `http://localhost:9090`.

## Código Frontend Verificado ✓

### 1. GastosComponent (`gastos.component.ts`)
- ✓ Estructura correcta del formulario
- ✓ Validaciones implementadas
- ✓ Payload construido correctamente
- ✓ Manejo de errores mejorado con logging detallado

### 2. GastoFundacionService (`gasto-fundacion.service.ts`)
- ✓ URL correcta: `http://localhost:9090/api/gastos`
- ✓ Headers de autenticación configurados
- ✓ Método `crear()` implementado correctamente

### 3. Servicios Relacionados
- ✓ ArticuloService - Headers restaurados
- ✓ TipoGastoService - Headers restaurados
- ✓ EmpleadoService - Headers restaurados

## Posibles Causas del Problema

### A. Problemas de Backend (MÁS PROBABLE)
1. **Backend no está corriendo**
   - Verificar que el servidor esté corriendo en `http://localhost:9090`
   
2. **Error de validación en el backend**
   - El backend podría estar rechazando el payload por validación
   
3. **CORS no configurado**
   - El backend podría bloquear peticiones desde `http://localhost:4200`

4. **Estructura del DTO incorrecta**
   - El backend espera una estructura diferente a la que envía el frontend

### B. Problemas de Frontend (MENOS PROBABLE)
1. **Token no disponible**
   - El `AuthService.getToken()` podría retornar `null` o token inválido
   
2. **Datos de combos no cargados**
   - Artículos, tipos de gasto o empleados no se cargaron

## Pasos para Diagnosticar

### 1. Abrir DevTools del Navegador (F12)

### 2. Ir a la pestaña "Console"
Buscar estos mensajes:
```
Payload a enviar /api/gastos => {...}
Error al guardar gasto: ...
```

### 3. Ir a la pestaña "Network"
- Filtrar por "gastos"
- Hacer click en "Guardar"
- Buscar la petición POST a `/api/gastos`
- Ver:
  - **Status Code**: ¿403? ¿400? ¿404? ¿500?
  - **Request Headers**: ¿Tiene `Authorization: Bearer ...`?
  - **Request Payload**: ¿Se envían los detalles?
  - **Response**: ¿Qué mensaje de error devuelve?

### 4. Verificar Backend
Ejecutar en el terminal del backend (Spring Boot):
```bash
# Ver si está corriendo
curl http://localhost:9090/api/gastos
```

## Estructura del Payload Enviado

```json
{
  "fechaGasto": "2025-11-29",
  "descripcion": "Descripcion del gasto",
  "comprobante": "COMP-001",
  "tipoGasto": {
    "idTipoGasto": 1
  },
  "empleado": {
    "id": 1
  },
  "detalles": [
    {
      "articulo": {
        "idArticulo": 1
      },
      "cantidadComprada": 5,
      "precioUnitario": 100.50,
      "descripcion": "Descripción del detalle",
      "unidadMedida": "UNIDADES",
      "proveedor": "Proveedor Inc"
    }
  ]
}
```

## Próximo Paso

**IMPORTANTE:** Por favor, realiza los siguientes pasos y repórtame los resultados:

1. **Abre el navegador** y ve a la página de Gastos de Fundación
2. **Abre DevTools** (F12)
3. **Intenta guardar** un gasto
4. **Captura y envíame:**
   - El mensaje de error que aparece en Swal (popup)
   - El mensaje en la consola (pestaña Console)
   - El status code y response de la petición (pestaña Network → POST /api/gastos)

Con esta información podré determinar si el problema es:
- **403**: Problema de autenticación/autorización
- **400**: Problema de validación (estructura del payload)
- **404**: Endpoint no existe en el backend
- **500**: Error interno del servidor
- **CORS**: Error de Cross-Origin
- **Network Error**: Backend no está corriendo
