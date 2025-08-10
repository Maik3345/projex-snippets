import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { InstructionSyncManager } from './instructionSync';
import {
    getDynamicInstructions,
    getAvailablePrompts,
    getStatusPanelContent,
    getHelpPanelContent
} from './dynamicInstructions';

/**
 * Registra los comandos de la extensión
 * @param context Contexto de la extensión
 * @param extensionPath Ruta de la extensión
 */
export function registerCommands(context: vscode.ExtensionContext, extensionPath: string): void {
    // Comando para sincronizar instrucciones
    const syncInstructionsCommand = vscode.commands.registerCommand(
        'projex-snippets.syncInstructions', 
        async () => {
            try {
                await InstructionSyncManager.syncInstructions(extensionPath);
            } catch (error) {
                console.error('Error al sincronizar instrucciones:', error);
            }
        }
    );
    context.subscriptions.push(syncInstructionsCommand);
    
    // Comando para activar/desactivar la sincronización automática
    const toggleAutoSyncCommand = vscode.commands.registerCommand(
        'projex-snippets.toggleAutoSync',
        async () => {
            try {
                // Obtener la configuración actual
                const config = vscode.workspace.getConfiguration('projexSnippets');
                const currentSetting = config.get<boolean>('autoSyncInstructions', true);
                
                // Invertir la configuración
                await config.update('autoSyncInstructions', !currentSetting, vscode.ConfigurationTarget.Global);
                
                // Mostrar mensaje de confirmación
                if (!currentSetting) {
                    vscode.window.showInformationMessage('✅ Sincronización automática de instrucciones ACTIVADA. Las instrucciones se sincronizarán al iniciar VS Code.');
                } else {
                    vscode.window.showInformationMessage('⏸️ Sincronización automática de instrucciones DESACTIVADA. Usa el comando manual para sincronizar.');
                }
            } catch (error) {
                console.error('Error al cambiar configuración de auto-sincronización:', error);
                vscode.window.showErrorMessage(`Error al cambiar configuración: ${error}`);
            }
        }
    );
    context.subscriptions.push(toggleAutoSyncCommand);

    // Comando para ver el estado de las instrucciones
    const checkInstructionsCommand = vscode.commands.registerCommand(
        'projex-snippets.checkInstructions',
        async () => {
            try {
                // En lugar de obtener un status completo, simplemente verificamos si existen instrucciones
                const hasInstructions = await InstructionSyncManager.hasInstructions();
                
                // Información básica sobre el workspace
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                const rootFolder = workspaceFolder ? workspaceFolder.uri.fsPath : '';
                const githubFolder = path.join(rootFolder, ".github");
                // Buscar copilot-instructions.md en .github y en raíz
                let mainInstructionsPath = path.join(githubFolder, "copilot-instructions.md");
                if (!fs.existsSync(mainInstructionsPath)) {
                    mainInstructionsPath = path.join(rootFolder, "copilot-instructions.md");
                }
                // Buscar carpeta de instrucciones en .github y en raíz
                let instructionsFolderPath = path.join(githubFolder, "instructions");
                if (!fs.existsSync(instructionsFolderPath)) {
                    instructionsFolderPath = path.join(rootFolder, "instructions");
                }
                
                // Definir el tipo para categoriesStatus
                interface CategoryStatus {
                    name: string;
                    exists: boolean;
                    fileCount: number;
                    path: string;
                }

                interface PromptStatus {
                    exists: boolean;
                    count: number;
                    path: string;
                }

                // Estado simplificado
                const status = {
                    mainInstructionsExist: hasInstructions,
                    mainInstructionsHasPco: hasInstructions,
                    mainInstructionsPath: mainInstructionsPath,
                    instructionsFolderExists: fs.existsSync(instructionsFolderPath),
                    instructionsFolderPath: instructionsFolderPath,
                    categoriesStatus: [] as CategoryStatus[],
                    promptsStatus: {
                        exists: false,
                        count: 0,
                        path: path.join(githubFolder, "prompts")
                    } as PromptStatus
                };
                
                // Si existe la carpeta de instrucciones, listar su contenido
                if (status.instructionsFolderExists) {
                    const items = fs.readdirSync(instructionsFolderPath, { withFileTypes: true });
                    for (const item of items) {
                        if (item.isDirectory()) {
                            const categoryPath = path.join(instructionsFolderPath, item.name);
                            try {
                                const files = fs.readdirSync(categoryPath);
                                const fileCount = files.filter(f => f.endsWith('.md') || f.endsWith('.instructions.md')).length;
                                status.categoriesStatus.push({
                                    name: item.name,
                                    exists: true,
                                    fileCount: fileCount,
                                    path: categoryPath
                                });
                            } catch (err) {
                                console.error(`Error al leer categoría ${item.name}:`, err);
                            }
                        }
                    }
                }
                // Verificar si existe la carpeta de prompts en .github y en raíz
                let promptsFolder = path.join(githubFolder, "prompts");
                if (!fs.existsSync(promptsFolder)) {
                    promptsFolder = path.join(rootFolder, "prompts");
                }
                if (fs.existsSync(promptsFolder)) {
                    status.promptsStatus.exists = true;
                    try {
                        const promptFiles = fs.readdirSync(promptsFolder, { withFileTypes: true })
                            .filter(f => f.isFile() && (f.name.endsWith('.md') || f.name.endsWith('.prompt')));
                        status.promptsStatus.count = promptFiles.length;
                    } catch (err) {
                        console.error(`Error al leer carpeta de prompts:`, err);
                    }
                }
                
                // Crear un webview panel para mostrar el estado
                const panel = vscode.window.createWebviewPanel(
                    'projexSnippetsStatus',
                    'Estado de Instrucciones Copilot',
                    vscode.ViewColumn.One,
                    {}
                );
                
                // Contenido HTML del panel de estado
                panel.webview.html = getStatusPanelContent(status);
            } catch (error) {
                console.error('Error al verificar instrucciones:', error);
                vscode.window.showErrorMessage(`Error al verificar instrucciones: ${error}`);
            }
        }
    );
    context.subscriptions.push(checkInstructionsCommand);

    // Comando para abrir el panel de ayuda
    const openHelpCommand = vscode.commands.registerCommand(
        'projex-snippets.openHelp',
        async () => {
            try {
                // Obtener instrucciones dinámicamente
                const dynamicInstructions = await getDynamicInstructions(extensionPath);
                
                // Obtener prompts disponibles
                const availablePrompts = await getAvailablePrompts(extensionPath);
                
                // Crear un webview panel
                const panel = vscode.window.createWebviewPanel(
                    'projexSnippetsHelp',
                    'Projex Snippets Instructions',
                    vscode.ViewColumn.One,
                    {}
                );

                // Contenido HTML del panel de ayuda con instrucciones dinámicas y prompts
                panel.webview.html = getHelpPanelContent(dynamicInstructions, availablePrompts);
            } catch (error) {
                console.error('Error al cargar panel de ayuda:', error);
                
                // Fallback al panel estático si hay error
                const panel = vscode.window.createWebviewPanel(
                    'projexSnippetsHelp',
                    'Projex Snippets Instructions',
                    vscode.ViewColumn.One,
                    {}
                );
                panel.webview.html = getHelpPanelContent([], []);
            }
        }
    );
    context.subscriptions.push(openHelpCommand);
}


