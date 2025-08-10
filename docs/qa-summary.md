
# Projex Snippets: Automatización de Resúmenes QA

Este documento explica la funcionalidad de automatización de resúmenes QA en Projex Snippets. Permite generar reportes concisos para pull requests y cambios de código.

### Overview

The extension can produce QA summaries based on code changes, test results, and project conventions, improving review quality and traceability.

### Diagrama de Secuencia Mermaid

```mermaid
%%{init: { "sequence": { "actorTextColor": "#1e40af", "actorBorderColor": "#0ea5e9", "actorBackground": "#e0f2fe", "noteBackground": "#22c55e" } } }%%
sequenceDiagram
    participant Usuario as Usuario
    participant ProjexSnippets as Projex Snippets
    participant MotorQA as Motor QA

    Usuario->>ProjexSnippets: Ejecuta comando de resumen QA
    ProjexSnippets->>MotorQA: Analiza cambios de código
    MotorQA-->>ProjexSnippets: Devuelve resumen QA
    ProjexSnippets-->>Usuario: Muestra resumen QA
```

*Este diagrama muestra el proceso de generación de resúmenes QA en Projex Snippets.*

### Related Features

- [custom-chat-commands.md](./custom-chat-commands.md)
- [documentation-generation.md](./documentation-generation.md)