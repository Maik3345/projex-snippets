import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const DEFAULT_INSTRUCTIONS_TEMPLATE = `## 🎯 Sistema de Activación por Palabras Clave

**INSTRUCCIÓN PARA COPILOT:** Cuando detectes cualquiera de estas palabras clave en el prompt del usuario, activa automáticamente las instrucciones correspondientes:

---

### 🤖 Para Copilot: Reglas de Activación Automática

1. **Detecta las palabras clave** en el prompt del usuario (sin importar mayúsculas/minúsculas)
2. **Activa automáticamente** las instrucciones del archivo correspondiente
3. **Sigue las instrucciones específicas** del archivo referenciado
4. **No requieras** que el usuario mencione explícitamente las instrucciones
5. **Ejecuta la tarea** según el flujo definido en las instrucciones específicas`;

export class InstructionSyncManager {
  public static async hasInstructions(): Promise<boolean> {
    try {
      const workspaceFolder = this.getWorkspaceFolder();
      if (!workspaceFolder) return false;
      const githubFolder = path.join(workspaceFolder.uri.fsPath, ".github");
      const mainInstructionsPath = path.join(githubFolder, "copilot-instructions.md");
      return fs.existsSync(mainInstructionsPath);
    } catch (error) {
      console.error("Error al verificar instrucciones:", error);
      return false;
    }
  }

  public static async syncInstructions(extensionPath: string, isAutoSync: boolean = false): Promise<void> {
    try {
      const workspaceFolder = this.getWorkspaceFolder();
      if (!workspaceFolder) {
        if (!isAutoSync) vscode.window.showErrorMessage("No se ha encontrado un workspace abierto");
        return;
      }
      const githubFolder = path.join(workspaceFolder.uri.fsPath, ".github");
      if (!fs.existsSync(githubFolder)) fs.mkdirSync(githubFolder, { recursive: true });
      this.copyFiles(extensionPath, githubFolder);
      if (!isAutoSync) vscode.window.showInformationMessage("💡 Instrucciones sincronizadas correctamente para Projex Snippets");
    } catch (error) {
      console.error("Error durante la sincronización:", error);
      if (!isAutoSync) vscode.window.showErrorMessage(`Error al sincronizar instrucciones: ${error}`);
    }
  }

  private static getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0] : undefined;
  }

  private static copyFiles(extensionPath: string, githubFolder: string): void {
    try {
      // Copiar archivo principal
      const sourceMainFile = path.join(extensionPath, "instructions", "main-copilot-instructions.md");
      const destMainFile = path.join(githubFolder, "copilot-instructions.md");
      if (fs.existsSync(sourceMainFile)) {
        if (fs.existsSync(destMainFile)) {
          const sourceContent = fs.readFileSync(sourceMainFile, 'utf8');
          const destContent = fs.readFileSync(destMainFile, 'utf8');
          if (sourceContent !== destContent) {
            const mergedContent = this.mergeInstructionFiles(sourceContent, destContent);
            fs.writeFileSync(destMainFile, mergedContent, 'utf8');
          }
        } else {
          fs.copyFileSync(sourceMainFile, destMainFile);
        }
      } else {
        fs.writeFileSync(destMainFile, DEFAULT_INSTRUCTIONS_TEMPLATE, "utf8");
      }
      // Copiar carpeta de instrucciones
      const sourceDir = path.join(extensionPath, "instructions");
      const destDir = path.join(githubFolder, "instructions");
      if (fs.existsSync(sourceDir)) {
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
        for (const entry of entries) {
          if (["node_modules", ".git", ".DS_Store", "main-copilot-instructions.md"].includes(entry.name)) continue;
          const srcPath = path.join(sourceDir, entry.name);
          const destPath = path.join(destDir, entry.name);
          if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
            this.copyFolderRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
      // Copiar carpeta de prompts
      const sourcePromptsDir = path.join(extensionPath, "prompts");
      const destPromptsDir = path.join(githubFolder, "prompts");
      if (fs.existsSync(sourcePromptsDir)) {
        if (!fs.existsSync(destPromptsDir)) fs.mkdirSync(destPromptsDir, { recursive: true });
        const entries = fs.readdirSync(sourcePromptsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (["node_modules", ".git", ".DS_Store"].includes(entry.name)) continue;
          const srcPath = path.join(sourcePromptsDir, entry.name);
          const destPath = path.join(destPromptsDir, entry.name);
          if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
            this.copyFolderRecursive(srcPath, destPath);
          } else {
            if (fs.existsSync(destPath)) {
              const srcContent = fs.readFileSync(srcPath, 'utf8');
              const destContent = fs.readFileSync(destPath, 'utf8');
              if (srcContent === destContent) continue;
            }
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
    } catch (error) {
      console.error("❌ ERROR general al copiar archivos:", error);
      throw error;
    }
  }

  private static mergeInstructionFiles(sourceContent: string, destContent: string): string {
    const sectionHeader = '## 🎯 Sistema de Activación por Palabras Clave';
    const sectionIndex = destContent.indexOf(sectionHeader);
    if (sectionIndex > -1) {
      const beforeSection = destContent.substring(0, sectionIndex);
      const sourceSectionIndex = sourceContent.indexOf(sectionHeader);
      const newSection = sourceSectionIndex > -1 ? sourceContent.substring(sourceSectionIndex) : '';
      return beforeSection + newSection;
    } else {
      const sourceSectionIndex = sourceContent.indexOf(sectionHeader);
      const newSection = sourceSectionIndex > -1 ? sourceContent.substring(sourceSectionIndex) : '';
      return destContent + '\n\n' + newSection;
    }
  }

  private static copyFolderRecursive(src: string, dest: string): void {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (["node_modules", ".git", ".DS_Store", "main-copilot-instructions.md"].includes(entry.name)) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
        this.copyFolderRecursive(srcPath, destPath);
      } else {
        let shouldCopy = true;
        if (fs.existsSync(destPath)) {
          const srcContent = fs.readFileSync(srcPath, 'utf8');
          const destContent = fs.readFileSync(destPath, 'utf8');
          if (srcContent === destContent) shouldCopy = false;
        }
        if (shouldCopy) fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}
