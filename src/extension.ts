import * as vscode from "vscode";
import { ProjexChatParticipant } from "./projexChatParticipant";
import { registerCommands } from "./commands";
import { InstructionSyncManager } from "./instructionSync";

export function activate(context: vscode.ExtensionContext) {
  console.log("Projex Snippets extension is now active!");

  // Registrar el Chat Participant
  const projexChatParticipant = new ProjexChatParticipant();

  const participant = vscode.chat.createChatParticipant(
    "projex",
    projexChatParticipant.handleRequest.bind(projexChatParticipant)
  );
  participant.iconPath = vscode.Uri.joinPath(
    context.extensionUri,
    "img",
    "logo.png"
  );
  participant.followupProvider = {
    provideFollowups:
      projexChatParticipant.provideFollowups.bind(projexChatParticipant),
  };

  context.subscriptions.push(participant);

  // Sincronización automática de instrucciones al inicio
  const config = vscode.workspace.getConfiguration("projexSnippets");
  const autoSync = config.get<boolean>("autoSyncInstructions", true);

  if (autoSync) {
    setTimeout(async () => {
      try {
        const hadInstructionsBefore = await InstructionSyncManager.hasInstructions();
        await InstructionSyncManager.syncInstructions(
          context.extensionPath,
          true
        );
        const hasInstructionsAfter = await InstructionSyncManager.hasInstructions();
        const hasChanges = !hadInstructionsBefore && hasInstructionsAfter;
        console.log("Auto-sincronización de instrucciones completada", hasChanges ? "con instalación inicial" : "sin cambios notables");
        if (hasChanges) {
          vscode.window.setStatusBarMessage("📝 Instrucciones Projex instaladas", 5000);
          vscode.window.showInformationMessage("📝 Instrucciones Projex instaladas correctamente", "OK");
        }
      } catch (error) {
        console.error("Error en auto-sincronización de instrucciones:", error);
      }
    }, 2000);
  }

  // Registrar comandos para el chat
  const clearChatCommand = vscode.commands.registerCommand(
    "projex-snippets.clearChat",
    () => {
      vscode.window.showInformationMessage("Projex Chat cleared!");
    }
  );
  context.subscriptions.push(clearChatCommand);

  // Registrar comandos para instrucciones
  registerCommands(context, context.extensionPath);

  // Registrar el comando en la paleta de comandos
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "projex-snippets.activateProjexInstructions",
      async () => {
        const action = await vscode.window.showInformationMessage(
          "¿Activar instrucciones de Projex Snippets en este workspace?",
          "Activar",
          "Cancelar"
        );
        if (action === "Activar") {
          vscode.commands.executeCommand("projex-snippets.syncInstructions");
        }
      }
    )
  );
}

export function deactivate() {
  console.log("Projex Snippets extension is now deactivated.");
}
