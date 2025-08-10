# Projex Snippets: Generación de Documentación

## Automatización de Generación de Documentación

Este documento detalla la funcionalidad de generación automática de documentación de la extensión Projex Snippets. Crea archivos Markdown para cada caso de uso o funcionalidad, siguiendo las convenciones del proyecto.

### Overview

Cuando se activa, la extensión escanea el proyecto en busca de funcionalidades y genera los archivos `.md` correspondientes en la carpeta `docs`. Cada archivo incluye explicaciones, diagramas Mermaid y referencias cruzadas.

### Mermaid Flowchart: Documentation Generation

```mermaid
%%{init: { "flowchart": { "defaultRenderer": "elk" } } }%%
flowchart TB
    classDef inicioClass fill:#1e40af,color:white,stroke-width:2px,stroke:#0ea5e9
    classDef statementClass fill:#22c55e,color:white,stroke:#166534,stroke-width:2px
    classDef conditionalClass fill:#f59e42,color:white,stroke:#b45309,stroke-width:2px
    classDef finClass fill:#334155,color:white,stroke-width:2px
    classDef rejectClass fill:#ef4444,color:white,stroke:#991b1b,stroke-width:2px

    inicio(("Inicio")):::inicioClass
    scan["Escanear proyecto por funcionalidades"]:::statementClass
    found{"¿Funcionalidad encontrada?"}:::conditionalClass
    generate["Generar documentación .md"]:::statementClass
    update["Actualizar README.md"]:::statementClass
    fin(("Fin")):::finClass
    error["Error/Inválido"]:::rejectClass

    inicio --> scan --> found
    found -- Sí --> generate --> update --> fin
    found -- No --> error --> fin
```

*Este diagrama muestra los pasos para la generación automática de documentación en Projex Snippets.*

### Diagrama de Arquitectura

```mermaid
flowchart TB
    classDef statementClass fill:#22c55e,color:white,stroke:#166534,stroke-width:2px
    classDef dbClass fill:#1e40af,color:white,stroke:#0ea5e9,stroke-width:2px

    subgraph "Projex Snippets Extension"
        A[Escuchador de Comandos]:::statementClass
        B[Generador de Documentación]:::statementClass
        C[Actualizador de README]:::statementClass
    end
    subgraph "Proyecto"
        D[Archivos Fuente]:::dbClass
        E[Carpeta docs]:::dbClass
    end

    A --> B
    B --> E
    C --> E
    D --> B
```

*Este diagrama ilustra los componentes principales involucrados en la generación de documentación.*

### Related Features

- [custom-chat-commands.md](./custom-chat-commands.md)
- [qa-summary.md](./qa-summary.md)