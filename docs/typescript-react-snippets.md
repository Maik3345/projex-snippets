
# Projex Snippets: Snippets para TypeScript y React

Este documento describe los snippets de código para TypeScript y React provistos por la extensión Projex Snippets. Estos fragmentos aceleran el desarrollo ofreciendo patrones listos para componentes, hooks y utilidades.

### Snippet Categories

| Category   | Description                                  |
| ---------- | -------------------------------------------- |
| Components | Boilerplate for React functional components. |
| Hooks      | Custom and built-in React hooks.             |
| Utilities  | Helper functions for common tasks.           |

### Diagrama de Componentes Mermaid

```mermaid
flowchart TB
    classDef statementClass fill:#22c55e,color:white,stroke:#166534,stroke-width:2px

    subgraph "Snippets"
        A[Snippet de Componente]:::statementClass
        B[Snippet de Hook]:::statementClass
        C[Snippet de Utilidad]:::statementClass
    end
    subgraph "Flujo del Desarrollador"
        D[Insertar Snippet]:::statementClass
        E[Editar/Personalizar]:::statementClass
        F[Usar en Proyecto]:::statementClass
    end

    A --> D
    B --> D
    C --> D
    D --> E --> F
```

*Este diagrama muestra cómo los snippets se integran en el flujo de trabajo del desarrollador usando Projex Snippets.*

### Related Features

- [custom-chat-commands.md](./custom-chat-commands.md)