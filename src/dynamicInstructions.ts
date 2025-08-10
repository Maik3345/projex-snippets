// ...existing code...

/**
 * Interface para definir una instrucción dinámica
 */
export interface DynamicInstruction {
    title: string;
    keywords: string[];
    description: string;
    category: string;
}

/**
 * Interface para definir un prompt disponible
 */
export interface PromptInfo {
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
export async function getDynamicInstructions(extensionPath: string): Promise<DynamicInstruction[]> {
    const fs = require('fs');
    const path = require('path');
    const workspaceFolders = (require('vscode').workspace.workspaceFolders || []);
    if (workspaceFolders.length === 0) return [];
    const rootFolder = workspaceFolders[0].uri.fsPath;
    const githubInstructions = path.join(rootFolder, '.github', 'instructions');
    const rootInstructions = path.join(rootFolder, 'instructions');
    let instructionsDirs = [];
    if (fs.existsSync(githubInstructions)) instructionsDirs.push(githubInstructions);
    if (fs.existsSync(rootInstructions)) instructionsDirs.push(rootInstructions);
    const results = [];
    for (const dir of instructionsDirs) {
        const categories = fs.readdirSync(dir, { withFileTypes: true }).filter((d: any) => d.isDirectory());
        for (const cat of categories) {
            const catPath = path.join(dir, cat.name);
            const files = fs.readdirSync(catPath).filter((f: string) => f.endsWith('.md') || f.endsWith('.instructions.md'));
            for (const file of files) {
                const filePath = path.join(catPath, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    results.push({
                        name: file,
                        title: file,
                        category: cat.name,
                        description: content.substring(0, 120).replace(/\n/g, ' '),
                        path: filePath,
                        keywords: []
                    });
                } catch {}
            }
        }
    }
    return results as DynamicInstruction[];
}

/**
 * Obtiene información sobre los prompts disponibles
 * @param extensionPath Ruta de la extensión
 * @returns Array de información de prompts
 */
export async function getAvailablePrompts(extensionPath: string): Promise<PromptInfo[]> {
    const fs = require('fs');
    const path = require('path');
    const workspaceFolders = (require('vscode').workspace.workspaceFolders || []);
    if (workspaceFolders.length === 0) return [];
    const rootFolder = workspaceFolders[0].uri.fsPath;
    const githubPrompts = path.join(rootFolder, '.github', 'prompts');
    const rootPrompts = path.join(rootFolder, 'prompts');
    let promptsDirs = [];
    if (fs.existsSync(githubPrompts)) promptsDirs.push(githubPrompts);
    if (fs.existsSync(rootPrompts)) promptsDirs.push(rootPrompts);
    const results = [];
    for (const dir of promptsDirs) {
        const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.md') || f.endsWith('.prompt'));
        for (const file of files) {
            const filePath = path.join(dir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                results.push({
                    name: file,
                    title: file,
                    description: content.substring(0, 120).replace(/\n/g, ' '),
                    path: filePath
                });
            } catch {}
        }
    }
    return results as PromptInfo[];
}

/**
 * Obtiene el contenido del panel de estado de instrucciones
 * @param status Estado de las instrucciones
 * @returns HTML del panel de estado
 */
export function getStatusPanelContent(status: any): string {
    // Panel de estado de instrucciones Projex
    return `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; padding: 24px; }
                h2 { color: #89009a; }
                .status { margin-bottom: 16px; }
                .category { margin-bottom: 8px; }
                .ok { color: #2ecc40; }
                .fail { color: #ff4136; }
            </style>
        </head>
        <body>
            <h2>Estado de Instrucciones Projex Snippets</h2>
            <div class="status">
                <strong>Archivo principal:</strong> <span class="${status.mainInstructionsExist ? 'ok' : 'fail'}">${status.mainInstructionsExist ? 'Existe' : 'No existe'}</span><br>
                <strong>Carpeta de instrucciones:</strong> <span class="${status.instructionsFolderExists ? 'ok' : 'fail'}">${status.instructionsFolderExists ? 'Existe' : 'No existe'}</span><br>
                <strong>Carpeta de prompts:</strong> <span class="${status.promptsStatus.exists ? 'ok' : 'fail'}">${status.promptsStatus.exists ? 'Existe' : 'No existe'}</span><br>
            </div>
            <h3>Categorías de instrucciones</h3>
            <ul>
                ${status.categoriesStatus && status.categoriesStatus.length > 0 ? status.categoriesStatus.map((cat: any) => `<li class="category"><strong>${cat.name}</strong>: ${cat.fileCount} archivos</li>`).join('') : '<li>No hay categorías encontradas.</li>'}
            </ul>
            <h3>Prompts disponibles</h3>
            <div>${status.promptsStatus.count} archivos de prompt encontrados.</div>
        </body>
        </html>
    `;
}

/**
 * Obtiene el contenido del panel de ayuda dinámicamente
 * @param instructions Array de instrucciones dinámicas
 * @param prompts Array de prompts disponibles
 * @returns HTML del panel de ayuda
 */
export function getHelpPanelContent(instructions: DynamicInstruction[], prompts: PromptInfo[] = []): string {
    // Panel de ayuda de instrucciones Projex
    return `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; padding: 24px; }
                h2 { color: #89009a; }
                .section { margin-bottom: 24px; }
                .item { margin-bottom: 8px; }
            </style>
        </head>
        <body>
            <h2>Ayuda de Instrucciones Projex Snippets</h2>
            <div class="section">
                <h3>Instrucciones dinámicas</h3>
                <ul>
                    ${instructions && instructions.length > 0 ? instructions.map((inst: any) => `<li class="item"><strong>${inst.name || inst.title || 'Sin nombre'}</strong>: ${inst.description || 'Sin descripción'}</li>`).join('') : '<li>No hay instrucciones dinámicas encontradas.</li>'}
                </ul>
            </div>
            <div class="section">
                <h3>Prompts disponibles</h3>
                <ul>
                    ${prompts && prompts.length > 0 ? prompts.map((p: any) => `<li class="item"><strong>${p.name || p.title || 'Sin nombre'}</strong>: ${p.description || 'Sin descripción'}</li>`).join('') : '<li>No hay prompts encontrados.</li>'}
                </ul>
            </div>
        </body>
        </html>
    `;
}
