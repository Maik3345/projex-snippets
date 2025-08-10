## 🎯 Sistema de Activación por Palabras Clave

**INSTRUCCIÓN PARA COPILOT:** Cuando detectes cualquiera de estas palabras clave en el prompt del usuario, activa automáticamente las instrucciones correspondientes:

---
### 📋 Conventional Commits

**Palabras clave:** `"commit"` | `"conventional commit"` | `"formato commit"` | `"mensaje commit"`  
**→ ACTIVAR:** [commit.instructions.md](./instructions/commit/commit.instructions.md)  
**Acción:** Aplica las reglas de Conventional Commits 1.0.0 para estructurar mensajes de commit consistentes

### 🧪 Cobertura de Tests

**Palabras clave:** `"coverage"` | `"test-coverage"` | `"cobertura"` | `"sonar quality gate"` | `"cobertura tests"`  
**→ ACTIVAR:** [coverage.instructions.md](./instructions/coverage/coverage.instructions.md)  
**Acción:** Mejora sistemáticamente la cobertura de tests hasta alcanzar el 87% requerido por SonarQube

### 📚 Documentación General

**Palabras clave:** `"doc"` | `"documentación"` | `"generar docs"` | `"crear documentación"`  
**→ ACTIVAR:** [doc.instructions.md](./instructions/doc/doc.instructions.md)  
**Acción:** Genera documentación detallada en la carpeta docs con diagramas Mermaid y actualiza README.md

### 📚 Documentación VTEX IO

**Palabras clave:** `"doc vtex"` | `"vtex documentation"` | `"documentación vtex"` | `"vtex io"`  
**→ ACTIVAR:** [vtex-io.instructions.md](./instructions/doc/vtex/vtex-io.instructions.md)  
**Acción:** Especializada en documentación para proyectos VTEX IO, incluyendo componentes, props y APIs

### 📋 Pull Request y Control de Versiones

**Palabras clave:** `"pr"` | `"pull request"` | `"crear pr"` | `"generar pr"`  
**→ ACTIVAR:** [pr-auto-fill.instructions.md](./instructions/pr/pr-auto-fill.instructions.md)  
**Acción:** Automatiza la generación del contenido de Pull Request basándose en el template y el historial de cambios

### 🧪 QA y Testing

**Palabras clave:** `"qa"` | `"qa-hu"` | `"resumen qa"` | `"testing guide"` | `"qa guide"`  
**→ ACTIVAR:** [qa-hu.instructions.md](./instructions/qa/qa-hu.instructions.md)  
**Acción:** Genera resumen estructurado para QA con casos de prueba, puntos críticos y regresiones a verificar


---

### 🤖 Para Copilot: Reglas de Activación Automática

1. **Detecta las palabras clave** en el prompt del usuario (sin importar mayúsculas/minúsculas)
2. **Activa automáticamente** las instrucciones del archivo correspondiente
3. **Sigue las instrucciones específicas** del archivo referenciado
4. **No requieras** que el usuario mencione explícitamente las instrucciones
5. **Ejecuta la tarea** según el flujo definido en las instrucciones específicas
