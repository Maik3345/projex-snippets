
# Projex Snippets: Comandos de Chat Personalizados

Este documento describe los comandos personalizados de chat (`@projex`) disponibles en la extensión Projex Snippets. Estos comandos automatizan tareas de desarrollo, documentación y mejoran la productividad en Visual Studio Code.

### Overview

The extension introduces several chat commands that trigger automation, such as generating PR templates, documentation, and QA summaries.

### Diagrama de Flujo Mermaid: Ejecución de Comando

```mermaid
%%{init: { "flowchart": { "defaultRenderer": "elk" } } }%%
flowchart TB
    classDef inicioClass fill:#1e40af,color:white,stroke-width:2px,stroke:#0ea5e9
    classDef statementClass fill:#22c55e,color:white,stroke:#166534,stroke-width:2px
    classDef conditionalClass fill:#f59e42,color:white,stroke:#b45309,stroke-width:2px
    classDef finClass fill:#334155,color:white,stroke-width:2px

    inicio(("Usuario escribe comando @projex")):::inicioClass
    process["Projex Snippets interpreta el comando"]:::statementClass
    decision{"¿Comando reconocido?"}:::conditionalClass
    action["Ejecutar automatización"]:::statementClass
    fin(("Fin")):::finClass

    inicio --> process --> decision
    decision -- Sí --> action --> fin
    decision -- No --> fin
```

*Este diagrama muestra cómo la extensión Projex Snippets procesa comandos personalizados y activa automatizaciones.*

### Related Features

- [documentation-generation.md](./documentation-generation.md)
- [qa-summary.md](./qa-summary.md)