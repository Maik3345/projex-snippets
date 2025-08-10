import * as vscode from "vscode";

/**
 * Interfaz para los comandos del chat participant
 */
interface ProjexCommand {
  name: string;
  description: string;
  handler: (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ) => Promise<void>;
}

/**
 * Clase para el chat participant de Projex
 * Esta clase maneja la interacción con el usuario en el chat
 */
export class ProjexChatParticipant {
  private commands: Map<string, ProjexCommand> = new Map();

  constructor() {
    this.initializeCommands();
  }

  /**
   * Inicializa los comandos disponibles
   * Aquí puedes agregar más comandos en el futuro
   */
  private initializeCommands() {
    // Comando simple de mensaje
    this.commands.set("message", {
      name: "message",
      description: "Muestra un mensaje de saludo",
      handler: this.handleMessageCommand.bind(this),
    });

    // Comando de ayuda
    this.commands.set("help", {
      name: "help",
      description: "Muestra todos los comandos disponibles",
      handler: this.handleHelpCommand.bind(this),
    });

    // Comando para interactuar con el LLM de Projex Snippets
    this.commands.set("ask", {
      name: "ask",
      description: "Hace una pregunta al LLM de Projex Snippets",
      handler: this.handleAskCommand.bind(this),
    });
  }

  /**
   * Maneja las solicitudes del usuario en el chat
   * Este método es llamado por VS Code cuando el usuario interactúa con el chat participant
   */
  async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    try {
      // Extraer el comando del prompt del usuario
      const userInput = request.prompt.trim().toLowerCase();
      const command = userInput.split(" ")[0] || "help";

      const commandHandler = this.commands.get(command);

      if (commandHandler) {
        await commandHandler.handler(request, context, stream, token);
      } else if (userInput === "" || userInput === "help") {
        await this.handleHelpCommand(request, context, stream, token);
      } else {
        stream.markdown(
          `❌ Comando no reconocido: **${command}**\n\nUsa \`@projex help\` para ver comandos disponibles.`
        );
      }
    } catch (error) {
      stream.markdown(
        `❌ Error: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  /**
   * Maneja el comando de mensaje simple
   * Este es un ejemplo para mostrar cómo implementar comandos
   */
  private async handleMessageCommand(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Extraer el texto del mensaje (todo después de "message")
    const messageText = request.prompt.replace(/^message\s*/i, "").trim() || "mundo";

    // Responder con un saludo
    stream.markdown(`# 👋 ¡Hola, ${messageText}!\n\n`);
  stream.markdown("Este es un comando simple de demostración para el Chat Participant de Projex.\n\n");
    stream.markdown("Puedes personalizar y expandir este comando, o añadir más comandos según tus necesidades.");
    
    // Mostrar información del workspace si está disponible
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      stream.markdown(`\n\n**Workspace actual:** \`${workspaceFolder.name}\``);
    }
  }

  /**
   * Maneja el comando de preguntas al LLM de GitHub Copilot
   * Este comando permite hacer preguntas al modelo de lenguaje utilizando el API de Copilot Chat
   */
  private async handleAskCommand(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Extraer la pregunta (todo después de "ask")
      const question = request.prompt.replace(/^ask\s*/i, "").trim();

      if (!question) {
        stream.markdown("❓ **Por favor, proporciona una pregunta después del comando 'ask'.**\n\nEjemplo: `@projex ask ¿Cómo puedo usar Projex Snippets en VS Code?`");
        return;
      }

      try {
        // Mostrar la conversación en formato de chat
        stream.markdown("## 💬 Conversación con Projex Snippets\n\n");
      
        // Mostrar la pregunta del usuario
        stream.markdown("### 👤 Usuario\n\n");
        stream.markdown(question + "\n\n");
      
        // Mostrar la respuesta del asistente
        stream.markdown("### 🤖 Asistente\n\n");
      
        // Simular la respuesta de Projex Snippets
        const respuestas = {
          "¿Cómo puedo usar Projex Snippets en VS Code?": 
            "Para usar Projex Snippets en VS Code:\n\n" +
            "1. **Instala la extensión**: Busca 'Projex Snippets' en el marketplace de extensiones y instálala.\n\n" +
            "2. **Configura tus snippets**: Personaliza los snippets y comandos según tus necesidades.\n\n" +
            "3. **Accede a los comandos**: Usa la paleta de comandos para ejecutar las funciones de Projex Snippets.\n\n" +
            "4. **Utiliza el chat**: Interactúa con el chat participant para obtener ayuda y ejecutar comandos.\n\n" +
            "Recuerda que puedes personalizar el comportamiento en la configuración de VS Code.",
        
          "¿Qué es Projex Snippets?": 
            "Projex Snippets es una extensión para VS Code que facilita la gestión y uso de fragmentos de código personalizados.\n\n" +
            "Principales características:\n\n" +
            "• **Snippets personalizables**: Crea y edita tus propios fragmentos de código.\n\n" +
            "• **Comandos rápidos**: Accede a funciones útiles desde la paleta de comandos.\n\n" +
            "• **Integración con el chat**: Interactúa mediante comandos en el chat participant.\n\n" +
            "• **Soporte para múltiples lenguajes**: Utiliza snippets en diferentes lenguajes de programación.\n\n" +
            "Projex Snippets está diseñado para acelerar tu flujo de trabajo y mejorar la productividad.",
          
          "default": 
            "Gracias por tu pregunta. Como asistente de programación, puedo ayudarte con:\n\n" +
            "• Explicaciones sobre conceptos de programación\n" +
            "• Sugerencias de código y soluciones técnicas\n" +
            "• Información sobre Projex Snippets y VS Code\n" +
            "• Consejos de desarrollo y buenas prácticas\n\n" +
            "Para esta pregunta específica, te sugiero consultar la documentación oficial o proporcionar más detalles para que pueda darte una respuesta más precisa."
        };
      
        // Pequeña pausa para simular procesamiento
        await new Promise(resolve => setTimeout(resolve, 800));
      
        // Determinar qué respuesta mostrar
        let respuesta = respuestas.default;
      
        // Buscar respuestas preprogramadas que coincidan
        for (const [clave, valor] of Object.entries(respuestas)) {
          if (question.toLowerCase().includes(clave.toLowerCase().replace(/[¿?]/g, "").trim())) {
            respuesta = valor;
            break;
          }
        }
      
        // Mostrar la respuesta
        stream.markdown(respuesta);
      
        stream.markdown("\n\n---\n\n*Nota: Esta es una simulación. Para integrar con el LLM real de Projex Snippets, se necesitaría implementar el API completo.*");

      } catch (error) {
        stream.markdown(`❌ **Error al procesar la pregunta:** ${error instanceof Error ? error.message : "Error desconocido"}`);
        stream.markdown("\n\nPor favor, intenta con otra pregunta o contacta al administrador del sistema si el problema persiste.");
      }

    if (!question) {
      stream.markdown("❓ **Por favor, proporciona una pregunta después del comando 'ask'.**\n\nEjemplo: `@projex ask ¿Cómo puedo usar GitHub Copilot en VS Code?`");
      return;
    }

    try {
      // Mostrar la conversación en formato de chat
      stream.markdown("## 💬 Conversación con GitHub Copilot\n\n");
      
      // Mostrar la pregunta del usuario
      stream.markdown("### 👤 Usuario\n\n");
      stream.markdown(question + "\n\n");
      
      // Mostrar la respuesta del asistente
      stream.markdown("### 🤖 Asistente\n\n");
      
      // Simular la respuesta de Copilot
      // En una implementación real, este sería el punto de integración con el LLM
      const respuestas = {
        "¿Cómo puedo usar GitHub Copilot en VS Code?": 
          "Para usar GitHub Copilot en VS Code:\n\n" +
          "1. **Instala la extensión**: Busca 'GitHub Copilot' en el marketplace de extensiones y instálala.\n\n" +
          "2. **Inicia sesión**: Al instalar, se te pedirá iniciar sesión con tu cuenta de GitHub.\n\n" +
          "3. **Activa una suscripción**: Asegúrate de tener una suscripción activa a GitHub Copilot.\n\n" +
          "4. **Empieza a codificar**: Cuando escribas código, Copilot te sugerirá automáticamente completaciones.\n\n" +
          "5. **Acepta sugerencias**: Presiona Tab para aceptar las sugerencias.\n\n" +
          "6. **Usa comandos específicos**: Puedes acceder a funciones adicionales como Chat o explicación de código desde la paleta de comandos.\n\n" +
          "Recuerda que puedes personalizar su comportamiento en la configuración de VS Code.",
        
        "¿Qué es Copilot?": 
          "GitHub Copilot es una herramienta de inteligencia artificial desarrollada por GitHub y OpenAI que actúa como un asistente de programación.\n\n" +
          "Principales características:\n\n" +
          "• **Autocompletado de código**: Sugiere líneas o bloques completos de código mientras escribes.\n\n" +
          "• **Generación de funciones**: Puede crear funciones completas basadas en comentarios descriptivos.\n\n" +
          "• **Conversación en lenguaje natural**: A través de Copilot Chat, puedes hacer preguntas y recibir explicaciones sobre código.\n\n" +
          "• **Integración con múltiples lenguajes**: Funciona con Python, JavaScript, TypeScript, Ruby, Go, C#, y muchos otros.\n\n" +
          "• **Aprendizaje contextual**: Analiza tu código existente para ofrecer sugerencias más relevantes.\n\n" +
          "Copilot está entrenado con millones de repositorios públicos y está diseñado para acelerar tu flujo de trabajo de desarrollo.",
          
        "default": 
          "Gracias por tu pregunta. Como asistente de programación, puedo ayudarte con:\n\n" +
          "• Explicaciones sobre conceptos de programación\n" +
          "• Sugerencias de código y soluciones técnicas\n" +
          "• Información sobre GitHub Copilot y VS Code\n" +
          "• Consejos de desarrollo y buenas prácticas\n\n" +
          "Para esta pregunta específica, te sugiero consultar la documentación oficial o proporcionar más detalles para que pueda darte una respuesta más precisa."
      };
      
      // Pequeña pausa para simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Determinar qué respuesta mostrar
      let respuesta = respuestas.default;
      
      // Buscar respuestas preprogramadas que coincidan
      for (const [clave, valor] of Object.entries(respuestas)) {
        if (question.toLowerCase().includes(clave.toLowerCase().replace(/[¿?]/g, "").trim())) {
          respuesta = valor;
          break;
        }
      }
      
      // Mostrar la respuesta
      stream.markdown(respuesta);
      
      stream.markdown("\n\n---\n\n*Nota: Esta es una simulación. Para integrar con el LLM real de Copilot, se necesitaría implementar el API completo.*");

    } catch (error) {
      stream.markdown(`❌ **Error al procesar la pregunta:** ${error instanceof Error ? error.message : "Error desconocido"}`);
      stream.markdown("\n\nPor favor, intenta con otra pregunta o contacta al administrador del sistema si el problema persiste.");
    }
  }

  /**
   * Maneja el comando de ayuda
   * Muestra todos los comandos disponibles
   */
  private async handleHelpCommand(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ) {
  stream.markdown("# 🚀 Projex Assistant - Comandos Disponibles\n\n");

    // Listar todos los comandos disponibles
    for (const [key, command] of this.commands) {
      if (key !== "help") {
        stream.markdown(
          `**@projex ${command.name}** - ${command.description}\n\n`
        );
      }
    }

    stream.markdown("**Ejemplos de uso:**\n\n");
  stream.markdown("- `@projex message hola` - Muestra un saludo personalizado\n");
  stream.markdown("- `@projex message equipo` - Saluda al equipo\n");
  stream.markdown("- `@projex ask ¿Cómo funciona Projex Snippets?` - Realiza preguntas al modelo\n\n");

    stream.markdown(
      '💡 **Tip:** Puedes agregar más comandos personalizados en la función initializeCommands()'
    );
  }

  /**
   * Proporciona sugerencias de seguimiento para el chat
   * Este método es llamado por VS Code para mostrar botones de seguimiento
   */
  async provideFollowups(
    result: vscode.ChatResult,
    context: vscode.ChatContext,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatFollowup[]> {
    return [
      {
        prompt: "@projex help",
        label: "📋 Ver comandos disponibles",
      },
      {
        prompt: "@projex message",
        label: "👋 Saludar",
      },
      {
        prompt: "@projex ask ¿Cómo puedo usar Projex Snippets en VS Code?",
        label: "🤖 Hacer una pregunta a Projex Snippets",
      }
    ];
  }
}
