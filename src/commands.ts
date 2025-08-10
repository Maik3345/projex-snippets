import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { InstructionSyncManager } from './instructionSync';

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
                const githubFolder = workspaceFolder ? path.join(workspaceFolder.uri.fsPath, ".github") : 'Sin workspace';
                const mainInstructionsPath = path.join(githubFolder, "copilot-instructions.md");
                const instructionsFolderPath = path.join(githubFolder, "instructions");
                
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
                
                // Verificar si existe la carpeta de prompts y cuántos prompts contiene
                const promptsFolder = path.join(githubFolder, "prompts");
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
                    'Estado de Instrucciones Projex Snippets',
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

/**
 * Interface para definir una instrucción dinámica
 */
interface DynamicInstruction {
    title: string;
    keywords: string[];
    description: string;
    category: string;
}

/**
 * Interface para definir un prompt disponible
 */
interface PromptInfo {
    name: string;
    description: string;
    mode?: string;
    model?: string;
    tools?: string[];
    path: string;
}

/**
 * Obtiene las instrucciones dinámicamente desde los archivos
 * @param extensionPath Ruta de la extensión
 * @returns Array de instrucciones dinámicas
 */
async function getDynamicInstructions(extensionPath: string): Promise<DynamicInstruction[]> {
    const instructions: DynamicInstruction[] = [];
    
    try {
        // Leer el archivo principal de instrucciones
        const mainInstructionsPath = path.join(extensionPath, 'instructions', 'main-copilot-instructions.md');
        
        if (fs.existsSync(mainInstructionsPath)) {
            const content = fs.readFileSync(mainInstructionsPath, 'utf8');
            
            // Parsear las secciones de instrucciones usando regex
            const sectionRegex = /### ([📋🧪📚🤖][^#\n]+)\n\n\*\*Palabras clave:\*\* ([^\n]+)\n\*\*→ ACTIVAR:\*\* ([^\n]+)\n\*\*Acción:\*\* ([^\n]+)/g;
            
            let match;
            while ((match = sectionRegex.exec(content)) !== null) {
                const [, title, keywordsStr, activateStr, description] = match;
                
                // Extraer palabras clave (remover comillas y pipes)
                const keywords = keywordsStr
                    .split('|')
                    .map(k => k.trim().replace(/["`]/g, ''))
                    .filter(k => k.length > 0);
                
                // Determinar categoría basada en emoji
                let category = 'General';
                if (title.includes('📋')) category = 'Commits & PR';
                else if (title.includes('🧪')) category = 'Testing & QA';
                else if (title.includes('📚')) category = 'Documentación';
                else if (title.includes('🤖')) category = 'Copilot';
                
                instructions.push({
                    title: title.trim(),
                    keywords,
                    description: description.trim(),
                    category
                });
            }
        }
        
        console.log(`✅ Se cargaron ${instructions.length} instrucciones dinámicamente`);
        
    } catch (error) {
        console.error('Error al cargar instrucciones dinámicas:', error);
    }
    
    return instructions;
}

/**
 * Obtiene información sobre los prompts disponibles
 * @param extensionPath Ruta de la extensión
 * @returns Array de información de prompts
 */
async function getAvailablePrompts(extensionPath: string): Promise<PromptInfo[]> {
    const prompts: PromptInfo[] = [];
    
    try {
        // Usar solo la carpeta de prompts de la extensión
        const promptFolder = path.join(extensionPath, 'prompts');
        
        if (!fs.existsSync(promptFolder)) {
            console.log(`⚠️ Carpeta de prompts no encontrada: ${promptFolder}`);
            return prompts;
        }
        
        const files = fs.readdirSync(promptFolder, { withFileTypes: true });
        
        for (const file of files) {
            if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.prompt'))) {
                const promptPath = path.join(promptFolder, file.name);
                const content = fs.readFileSync(promptPath, 'utf8');
                
                // Extraer información del frontmatter si existe
                let description = 'No description';
                let mode = undefined;
                let model = undefined;
                let tools = undefined;
                
                // Verificar si hay frontmatter YAML entre --- ---
                const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
                if (frontmatterMatch) {
                    const frontmatter = frontmatterMatch[1];
                    
                    // Extraer descripción
                    const descMatch = frontmatter.match(/description:\s*['"]?(.*?)['"]?$/m);
                    if (descMatch) {
                        description = descMatch[1].trim();
                    }
                    
                    // Extraer mode
                    const modeMatch = frontmatter.match(/mode:\s*['"]?(.*?)['"]?$/m);
                    if (modeMatch) {
                        mode = modeMatch[1].trim();
                    }
                    
                    // Extraer model
                    const modelMatch = frontmatter.match(/model:\s*['"]?(.*?)['"]?$/m);
                    if (modelMatch) {
                        model = modelMatch[1].trim();
                    }
                    
                    // Extraer tools
                    const toolsMatch = frontmatter.match(/tools:\s*\[(.*?)\]/m);
                    if (toolsMatch) {
                        tools = toolsMatch[1].split(',')
                            .map(t => t.trim().replace(/['"]/g, ''))
                            .filter(t => t.length > 0);
                    }
                } else {
                    // Si no hay frontmatter, intentar extraer la primera línea como descripción
                    const firstLine = content.trim().split('\n')[0];
                    if (firstLine) {
                        description = firstLine.replace(/^#\s*/, '').trim();
                    }
                }
                
                // Nombre legible del prompt
                const promptName = file.name
                    .replace(/\.(md|prompt)$/, '')
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase());
                
                prompts.push({
                    name: promptName,
                    description,
                    mode,
                    model,
                    tools,
                    path: promptPath
                });
            }
        }
        
        console.log(`✅ Se encontraron ${prompts.length} prompts disponibles`);
    } catch (error) {
        console.error('Error al leer prompts disponibles:', error);
    }
    
    return prompts;
}

// Cambios en paneles y textos para eliminar referencias a PCO y Copilot
function getStatusPanelContent(status: { 
    mainInstructionsExist: boolean;
    mainInstructionsHasPco: boolean;
    mainInstructionsPath: string;
    instructionsFolderExists: boolean;
    instructionsFolderPath: string;
    categoriesStatus: Array<{
        name: string;
        exists: boolean;
        fileCount: number;
        path: string;
    }>;
    promptsStatus: {
        exists: boolean;
        count: number;
        path: string;
    };
}): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estado de Instrucciones Projex Snippets</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: var(--vscode-foreground);
        }
        h1 { 
            color: var(--vscode-editor-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        .status-item {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 5px;
        }
        .status-ok {
            background: rgba(0, 128, 0, 0.1);
            border-left: 4px solid green;
        }
        .status-warning {
            background: rgba(255, 166, 0, 0.1);
            border-left: 4px solid orange;
        }
        .status-error {
            background: rgba(255, 0, 0, 0.1);
            border-left: 4px solid red;
        }
        .file-path {
            font-family: monospace;
            background: var(--vscode-textCodeBlock-background);
            padding: 5px;
            border-radius: 3px;
            display: inline-block;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <h1>📋 Estado de Instrucciones Projex Snippets</h1>
    
    <div class="status-item ${status.mainInstructionsExist ? 'status-ok' : 'status-error'}">
        <h2>Archivo Principal de Instrucciones</h2>
        <div class="file-path">${status.mainInstructionsPath || 'No existe'}</div>
        ${status.mainInstructionsExist 
            ? '<p>✅ El archivo principal de instrucciones está presente.</p>' 
            : '<p>❌ No se encontró el archivo principal de instrucciones.</p>'}
        ${status.mainInstructionsHasPco 
            ? '<p>✅ Contiene instrucciones Projex.</p>' 
            : status.mainInstructionsExist ? '<p>⚠️ No contiene instrucciones Projex. Considera sincronizar.</p>' : ''}
    </div>
    
    <div class="status-item ${status.instructionsFolderExists ? 'status-ok' : 'status-warning'}">
        <h2>Carpeta de Instrucciones</h2>
        <div class="file-path">${status.instructionsFolderPath || 'No existe'}</div>
        ${status.instructionsFolderExists 
            ? '<p>✅ La carpeta de instrucciones específicas está presente.</p>' 
            : '<p>⚠️ No se encontró la carpeta de instrucciones específicas.</p>'}
    </div>
    
    <div class="status-item ${status.categoriesStatus.some(cat => cat.exists) ? 'status-ok' : 'status-warning'}">
        <h2>Categorías de Instrucciones</h2>
        <ul>
        ${status.categoriesStatus.map((category: any) => `
            <li>
                ${category.exists ? '✅' : '❌'} 
                <strong>${category.name}</strong>: 
                ${category.exists ? `${category.fileCount} archivos` : 'No existe'}
            </li>
        `).join('')}
        </ul>
    </div>
    
    <div class="status-item ${status.promptsStatus.exists ? 'status-ok' : 'status-warning'}">
        <h2>Prompts Disponibles</h2>
        <div class="file-path">${status.promptsStatus.path}</div>
        ${status.promptsStatus.exists 
            ? `<p>✅ La carpeta de prompts está configurada con ${status.promptsStatus.count} prompts disponibles.</p>` 
            : '<p>⚠️ No se encontró la carpeta de prompts. Sincroniza para incluirlos.</p>'}
    </div>
    
    <div class="status-item status-info">
        <h2>Acciones Recomendadas</h2>
        ${!status.mainInstructionsExist || !status.mainInstructionsHasPco || !status.promptsStatus.exists
            ? '<p><strong>Recomendación:</strong> Ejecuta "Projex: Sincronizar Instrucciones" para configurar correctamente.</p>' 
            : '<p><strong>Todo listo:</strong> Las instrucciones y prompts de Projex Snippets están correctamente configurados.</p>'}
    </div>
</body>
</html>`;
}

function getHelpPanelContent(instructions: DynamicInstruction[], prompts: PromptInfo[] = []): string {
    // Agrupar instrucciones por categoría
    const groupedInstructions: { [key: string]: DynamicInstruction[] } = {};
    instructions.forEach(instruction => {
        if (!groupedInstructions[instruction.category]) {
            groupedInstructions[instruction.category] = [];
        }
        groupedInstructions[instruction.category].push(instruction);
    });
    
    // Generar HTML para las instrucciones
    const instructionsHtml = Object.keys(groupedInstructions).length > 0 
        ? Object.keys(groupedInstructions).map(category => {
            const categoryInstructions = groupedInstructions[category];
            return `
                <h3>${category}</h3>
                ${categoryInstructions.map(instruction => `
                    <div class="command">
                        <strong>${instruction.title}</strong><br>
                        Palabras clave: ${instruction.keywords.map(k => `<span class="keyword">${k}</span>`).join(', ')}<br>
                        ${instruction.description}
                    </div>
                `).join('')}
            `;
        }).join('')
        : `
            <div class="command">
                <strong>⚠️ No se encontraron instrucciones</strong><br>
                Ejecuta "Projex: Sincronizar Instrucciones" para cargar las instrucciones disponibles.
            </div>
        `;
        
    // Generar HTML para los prompts
    const promptsHtml = prompts.length > 0
        ? `
            <h2>📝 Prompts Disponibles</h2>
            ${prompts.map(prompt => `
                <div class="prompt">
                    <h3>${prompt.name}</h3>
                    <p>${prompt.description}</p>
                    <div class="prompt-details">
                        ${prompt.model ? `<span class="tag model">Modelo: ${prompt.model}</span>` : ''}
                        ${prompt.mode ? `<span class="tag mode">Modo: ${prompt.mode}</span>` : ''}
                        ${prompt.tools && prompt.tools.length > 0 
                            ? `<div class="tools">Herramientas: ${prompt.tools.map(tool => 
                                `<span class="tool">${tool}</span>`).join(' ')}
                              </div>` 
                            : ''}
                    </div>
                </div>
            `).join('')}
        `
        : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projex Snippets Instructions</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: var(--vscode-foreground);
        }
        h1 { 
            color: var(--vscode-editor-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        h2, h3 {
            color: var(--vscode-editor-foreground);
            margin-top: 20px;
        }
        .command {
            background: var(--vscode-editor-background);
            padding: 10px;
            border-radius: 4px;
            border-left: 4px solid var(--vscode-activityBarBadge-background);
            margin-bottom: 15px;
        }
        .keyword {
            font-family: monospace;
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
            color: var(--vscode-textLink-foreground);
        }
        .steps {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 15px;
            border-radius: 5px;
        }
        .tip {
            border-left: 4px solid #3794ff;
            padding-left: 15px;
            font-style: italic;
            margin: 20px 0;
        }
        .stats {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            text-align: center;
        }
        .prompt {
            background: var(--vscode-editor-background);
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #ff7b00;
            margin-bottom: 15px;
        }
        .prompt h3 {
            margin-top: 0;
            color: #ff7b00;
        }
        .prompt-details {
            margin-top: 8px;
            font-size: 0.9em;
        }
        .tag {
            display: inline-block;
            padding: 2px 6px;
            margin-right: 6px;
            border-radius: 3px;
            font-size: 0.8em;
        }
        .model {
            background: rgba(55, 148, 255, 0.2);
            color: #3794ff;
        }
        .mode {
            background: rgba(75, 156, 94, 0.2);
            color: #4b9c5e;
        }
        .tools {
            margin-top: 5px;
        }
        .tool {
            display: inline-block;
            background: rgba(192, 192, 192, 0.2);
            color: #c0c0c0;
            padding: 2px 6px;
            margin-right: 4px;
            margin-bottom: 4px;
            border-radius: 3px;
            font-size: 0.8em;
        }
        .section {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid var(--vscode-panel-border);
        }
    </style>
</head>
<body>
    <h1>🚀 Projex Snippets Instructions</h1>
    
    <div class="stats">
        📊 <strong>${instructions.length} instrucciones</strong> disponibles en <strong>${Object.keys(groupedInstructions).length} categorías</strong>
        ${prompts.length > 0 ? `| 📝 <strong>${prompts.length} prompts</strong> disponibles` : ''}
    </div>
    
    <p>Esta extensión te permite activar instrucciones específicas para Projex Snippets en tu workspace.</p>
    
    <h2>Cómo utilizar las instrucciones</h2>
    
    <div class="steps">
        <h3>Paso 1: Sincronizar instrucciones</h3>
        <p>Ejecuta el comando <span class="keyword">Projex: Sincronizar Instrucciones</span> desde la paleta de comandos (Ctrl+Shift+P)</p>
        
        <h3>Paso 2: Activar instrucciones</h3>
        <p>Usa palabras clave específicas en tus prompts para activar comportamientos especializados:</p>
    </div>

    <h2>📋 Instrucciones Disponibles</h2>
    
    ${instructionsHtml}

    ${promptsHtml}

    <div class="tip section">
        <p><strong>Tip:</strong> Las instrucciones y prompts se sincronizan en la carpeta .github de tu workspace, donde Projex Snippets las lee automáticamente.</p>
    </div>
</body>
</html>`;
}
