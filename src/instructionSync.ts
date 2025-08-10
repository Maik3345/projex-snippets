import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Template mínimo de instrucciones por defecto
 */
const DEFAULT_INSTRUCTIONS_TEMPLATE = `## 🎯 Sistema de Activación por Palabras Clave

**INSTRUCCIÓN PARA PROJEX SNIPPETS:** Cuando detectes cualquiera de estas palabras clave en el prompt del usuario, activa automáticamente las instrucciones correspondientes:

---

### 🤖 Para Copilot: Reglas de Activación Automática

1. **Detecta las palabras clave** en el prompt del usuario (sin importar mayúsculas/minúsculas)
2. **Activa automáticamente** las instrucciones del archivo correspondiente
3. **Sigue las instrucciones específicas** del archivo referenciado
4. **No requieras** que el usuario mencione explícitamente las instrucciones
5. **Ejecuta la tarea** según el flujo definido en las instrucciones específicas`;

/**
 * Gestiona la sincronización de instrucciones desde la extensión al workspace del usuario
 */
export class InstructionSyncManager {
  /**
   * Verifica el estado de las instrucciones en el workspace
   * @returns Verdadero si las instrucciones ya existen, falso en caso contrario
   */
  public static async hasInstructions(): Promise<boolean> {
    try {
      const workspaceFolder = this.getWorkspaceFolder();
      if (!workspaceFolder) {
        return false;
      }

      const githubFolder = path.join(workspaceFolder.uri.fsPath, ".github");
      const mainInstructionsPath = path.join(
        githubFolder,
        "copilot-instructions.md"
      );
      
      // Verificar si existe el archivo principal de instrucciones
      return fs.existsSync(mainInstructionsPath);
    } catch (error) {
      console.error("Error al verificar instrucciones:", error);
      return false;
    }
  }

  /**
   * Sincroniza las instrucciones desde la extensión al workspace del usuario
   * @param extensionPath Ruta de la extensión
   * @param isAutoSync Indica si la sincronización es automática (sin mensajes al usuario)
   */
  public static async syncInstructions(
    extensionPath: string,
    isAutoSync: boolean = false
  ): Promise<void> {
    try {
      const workspaceFolder = this.getWorkspaceFolder();
      if (!workspaceFolder) {
        if (!isAutoSync) {
          vscode.window.showErrorMessage("No se ha encontrado un workspace abierto");
        }
        return;
      }

      // Crear carpeta .github si no existe
      const githubFolder = path.join(workspaceFolder.uri.fsPath, ".github");
      if (!fs.existsSync(githubFolder)) {
        fs.mkdirSync(githubFolder, { recursive: true });
      }

      // Copiar el archivo principal de instrucciones y la carpeta de instrucciones
      this.copyFiles(extensionPath, githubFolder);

      if (!isAutoSync) {
          vscode.window.showInformationMessage(
            "💡 Instrucciones sincronizadas correctamente para Projex Snippets"
          );
      }
    } catch (error) {
      console.error("Error durante la sincronización:", error);
      if (!isAutoSync) {
        vscode.window.showErrorMessage(`Error al sincronizar instrucciones: ${error}`);
      }
    }
  }

  /**
   * Obtiene la carpeta del workspace
   * @returns La carpeta del workspace o undefined si no hay workspace
   */
  private static getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0] : undefined;
  }

  /**
   * Copia todos los archivos de instrucciones necesarios
   * @param extensionPath Ruta de la extensión
   * @param githubFolder Ruta de la carpeta .github
   */
  private static copyFiles(extensionPath: string, githubFolder: string): void {
    try {
      console.log("🔄 Iniciando sincronización de instrucciones...");
      console.log(`🔍 Ruta de extensión: ${extensionPath}`);
      console.log(`🔍 Ruta de carpeta GitHub: ${githubFolder}`);
      
      // 1. Fusionar archivo principal
      const sourceMainFile = path.join(extensionPath, "instructions", "main-copilot-instructions.md");
      const destMainFile = path.join(githubFolder, "copilot-instructions.md");
      
      if (fs.existsSync(sourceMainFile)) {
        console.log(`📄 Actualizando archivo principal: ${sourceMainFile} -> ${destMainFile}`);
        
        // Si el archivo de destino ya existe, fusionamos el contenido
        if (fs.existsSync(destMainFile)) {
          console.log(`🔄 Archivo destino existente, fusionando contenido...`);
          
          // Leemos ambos archivos
          const sourceContent = fs.readFileSync(sourceMainFile, 'utf8');
          const destContent = fs.readFileSync(destMainFile, 'utf8');
          
          // Actualizamos solo si son diferentes
          if (sourceContent !== destContent) {
            try {
              // Realizamos una fusión inteligente en lugar de reemplazar completamente
              const mergedContent = this.mergeInstructionFiles(sourceContent, destContent);
              
              // Escribimos el contenido fusionado
              fs.writeFileSync(destMainFile, mergedContent, 'utf8');
              console.log(`✅ Archivo principal actualizado con fusión inteligente`);
            } catch (mergeError) {
              console.error(`⚠️ Error durante la fusión inteligente:`, mergeError);
              console.log(`⚠️ Se mantiene el archivo existente para evitar pérdida de datos`);
            }
          } else {
            console.log(`✓ No es necesario actualizar, los archivos son idénticos`);
          }
        } else {
          // Si el archivo destino no existe, simplemente copiamos
          fs.copyFileSync(sourceMainFile, destMainFile);
          console.log(`✓ Archivo principal creado`);
        }
      } else {
        console.log(`📝 Creando archivo principal con plantilla por defecto: ${destMainFile}`);
        fs.writeFileSync(destMainFile, DEFAULT_INSTRUCTIONS_TEMPLATE, "utf8");
      }
      
      // 2. Copiar carpeta de instrucciones
      const sourceDir = path.join(extensionPath, "instructions");
      const destDir = path.join(githubFolder, "instructions");
      
      console.log(`📂 Verificando directorio fuente: ${sourceDir}`);
      if (!fs.existsSync(sourceDir)) {
        console.error("❌ ERROR: Carpeta de instrucciones no encontrada en la extensión");
        console.log("Verificando si la extensión existe:", fs.existsSync(extensionPath));
        console.log("Contenido de la extensión:", fs.existsSync(extensionPath) ? fs.readdirSync(extensionPath) : "N/A");
        return;
      }
      
      // Mostrar estructura del directorio fuente
      console.log("📋 Estructura del directorio fuente:");
      this.logDirectoryStructure(sourceDir);
      
      // Crear carpeta destino si no existe (sin eliminar la existente)
      if (!fs.existsSync(destDir)) {
        console.log(`📁 Creando carpeta destino: ${destDir}`);
        fs.mkdirSync(destDir, { recursive: true });
      } else {
        console.log(`📂 La carpeta destino ya existe, conservando contenido existente: ${destDir}`);
      }
      
      // Copiar cada subdirectorio individualmente para mayor control
      try {
        const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
        console.log(`📦 Encontrados ${entries.length} elementos para copiar`);
        
        for (const entry of entries) {
          // Ignorar archivos y carpetas específicos
          if (["node_modules", ".git", ".DS_Store", "main-copilot-instructions.md"].includes(entry.name)) {
            console.log(`⏭️ Ignorando: ${entry.name}`);
            continue;
          }
          
          const srcPath = path.join(sourceDir, entry.name);
          const destPath = path.join(destDir, entry.name);
          
          if (entry.isDirectory()) {
            console.log(`📂 Copiando carpeta: ${entry.name}`);
            // Crear carpeta destino
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
            }
            
            // Copiar contenido recursivamente
            try {
              this.copyFolderRecursive(srcPath, destPath);
            } catch (copyError) {
              console.error(`❌ ERROR al copiar carpeta ${entry.name}:`, copyError);
            }
          } else {
            // Copiar archivo directo
            console.log(`📄 Copiando archivo directo: ${entry.name}`);
            try {
              fs.copyFileSync(srcPath, destPath);
            } catch (fileError) {
              console.error(`❌ ERROR al copiar archivo ${entry.name}:`, fileError);
            }
          }
        }
      } catch (readError) {
        console.error(`❌ ERROR al leer directorio fuente:`, readError);
      }
      
      // Verificar resultado final
      try {
        if (fs.existsSync(destDir)) {
          console.log("✅ Carpeta de instrucciones copiada correctamente");
          console.log("📋 Estructura del directorio destino después de la copia:");
          this.logDirectoryStructure(destDir);
          
          // Verificar si hay contenido
          const finalEntries = fs.readdirSync(destDir);
          if (finalEntries.length === 0) {
            console.error(`⚠️ ADVERTENCIA: El directorio destino está vacío después de la copia!`);
          } else {
            console.log(`✅ Directorio destino contiene ${finalEntries.length} elementos`);
          }
        } else {
          console.error(`❌ ERROR: La carpeta de destino no existe después de la copia`);
        }
      } catch (finalError) {
        console.error(`❌ ERROR al verificar resultado final:`, finalError);
      }
      
      // 3. Copiar carpeta de prompts
      console.log("🔄 Sincronizando carpeta de prompts...");
      const sourcePromptsDir = path.join(extensionPath, "prompts");
      const destPromptsDir = path.join(githubFolder, "prompts");
      
      // Verificar si existe la carpeta de prompts en la extensión
      if (fs.existsSync(sourcePromptsDir)) {
        console.log(`📂 Carpeta de prompts encontrada: ${sourcePromptsDir}`);
        
        // Crear carpeta destino si no existe (sin eliminar la existente)
        if (!fs.existsSync(destPromptsDir)) {
          console.log(`📁 Creando carpeta de prompts destino: ${destPromptsDir}`);
          fs.mkdirSync(destPromptsDir, { recursive: true });
        } else {
          console.log(`📂 La carpeta de prompts destino ya existe, conservando contenido existente: ${destPromptsDir}`);
        }
        
        // Copiar cada prompt individualmente para mayor control
        try {
          const entries = fs.readdirSync(sourcePromptsDir, { withFileTypes: true });
          console.log(`📦 Encontrados ${entries.length} prompts para copiar`);
          
          for (const entry of entries) {
            // Ignorar archivos y carpetas específicos
            if (["node_modules", ".git", ".DS_Store"].includes(entry.name)) {
              console.log(`⏭️ Ignorando: ${entry.name}`);
              continue;
            }
            
            const srcPath = path.join(sourcePromptsDir, entry.name);
            const destPath = path.join(destPromptsDir, entry.name);
            
            if (entry.isDirectory()) {
              console.log(`📂 Copiando carpeta de prompts: ${entry.name}`);
              // Crear carpeta destino
              if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
              }
              
              // Copiar contenido recursivamente
              try {
                this.copyFolderRecursive(srcPath, destPath);
              } catch (copyError) {
                console.error(`❌ ERROR al copiar carpeta de prompts ${entry.name}:`, copyError);
              }
            } else {
              // Copiar archivo directo
              console.log(`📄 Copiando prompt: ${entry.name}`);
              try {
                // Si el archivo ya existe, verificar si son idénticos
                if (fs.existsSync(destPath)) {
                  const srcContent = fs.readFileSync(srcPath, 'utf8');
                  const destContent = fs.readFileSync(destPath, 'utf8');
                  
                  if (srcContent === destContent) {
                    console.log(`⏭️ Prompt idéntico, omitiendo: ${entry.name}`);
                    continue;
                  } else {
                    console.log(`🔄 Actualizando prompt existente: ${entry.name}`);
                  }
                }
                
                fs.copyFileSync(srcPath, destPath);
              } catch (fileError) {
                console.error(`❌ ERROR al copiar prompt ${entry.name}:`, fileError);
              }
            }
          }
          
          // Verificar resultado final de prompts
          if (fs.existsSync(destPromptsDir)) {
            console.log("✅ Carpeta de prompts sincronizada correctamente");
            console.log("📋 Estructura de prompts después de la sincronización:");
            this.logDirectoryStructure(destPromptsDir);
          }
        } catch (readError) {
          console.error(`❌ ERROR al leer directorio de prompts:`, readError);
        }
      } else {
        console.log(`📝 Carpeta de prompts no encontrada en la extensión, omitiendo sincronización de prompts`);
      }
      
    } catch (error) {
      console.error("❌ ERROR general al copiar archivos:", error);
      throw error;
    }
  }
  
  /**
   * Elimina un directorio y todo su contenido recursivamente
   * @param dirPath Ruta del directorio a eliminar
   */
  private static deleteFolderRecursive(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach(file => {
        const curPath = path.join(dirPath, file);
        if (fs.statSync(curPath).isDirectory()) {
          // Recursive delete subdirectory
          this.deleteFolderRecursive(curPath);
        } else {
          // Delete file
          fs.unlinkSync(curPath);
        }
      });
      // Delete empty directory
      fs.rmdirSync(dirPath);
    }
  }
  
  /**
   * Registra la estructura de un directorio para depuración
   * @param dir Directorio a mostrar
   * @param level Nivel de indentación (para uso recursivo)
   */
  private static logDirectoryStructure(dir: string, level: number = 0): void {
    try {
      if (!fs.existsSync(dir)) {
        console.log(`${"  ".repeat(level)}${dir} (no existe)`);
        return;
      }
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const indent = "  ".repeat(level);
      
      if (entries.length === 0) {
        console.log(`${indent}${path.basename(dir)}/ (vacío)`);
        return;
      }
      
      if (level === 0) {
        console.log(`${indent}${dir}/`);
      }
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          console.log(`${indent}  ${entry.name}/`);
          // Solo mostrar un nivel adicional de profundidad para no saturar los logs
          if (level < 2) {
            this.logDirectoryStructure(path.join(dir, entry.name), level + 1);
          }
        } else {
          console.log(`${indent}  ${entry.name}`);
        }
      }
    } catch (error) {
      console.error(`Error al mostrar estructura de directorio ${dir}:`, error);
    }
  }
  
  /**
   * Fusiona el contenido conservando todo antes de la sección de activación
   * @param sourceContent Contenido del archivo fuente
   * @param destContent Contenido del archivo destino existente
   * @returns Contenido fusionado
   */
  private static mergeInstructionFiles(sourceContent: string, destContent: string): string {
    const sectionHeader = '## 🎯 Sistema de Activación por Palabras Clave';
    
    // Buscar si ya existe la sección en el archivo destino
    const sectionIndex = destContent.indexOf(sectionHeader);
    
    if (sectionIndex > -1) {
      // Si existe, mantener todo lo que está ANTES de la sección
      const beforeSection = destContent.substring(0, sectionIndex);
      
      // Extraer la nueva sección del archivo fuente
      const sourceSectionIndex = sourceContent.indexOf(sectionHeader);
      const newSection = sourceSectionIndex > -1 ? sourceContent.substring(sourceSectionIndex) : '';
      
      console.log(`🔄 Actualizando sección existente en el archivo`);
      return beforeSection + newSection;
    } else {
      // Si no existe, agregar la sección al final del archivo existente
      const sourceSectionIndex = sourceContent.indexOf(sectionHeader);
      const newSection = sourceSectionIndex > -1 ? sourceContent.substring(sourceSectionIndex) : '';
      
      console.log(`➕ Agregando nueva sección al final del archivo`);
      return destContent + '\n\n' + newSection;
    }
  }

  /**
   * Copia una carpeta y su contenido recursivamente
   * @param src Carpeta origen
   * @param dest Carpeta destino
   */
  private static copyFolderRecursive(src: string, dest: string): void {
    try {
      // Verificar que la carpeta fuente existe
      if (!fs.existsSync(src)) {
        console.error(`❌ ERROR: La carpeta fuente no existe: ${src}`);
        return;
      }
      
      // Crear carpeta destino si no existe
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      } else {
        // Lista los archivos en el directorio destino para debug
        console.log(`📂 El directorio destino ya existe: ${dest}`);
        console.log(`📋 Contenido actual del directorio destino:`);
        if (fs.readdirSync(dest).length === 0) {
          console.log(`   (directorio vacío)`);
        } else {
          fs.readdirSync(dest).forEach(file => {
            console.log(`   - ${file}`);
          });
        }
      }
      
      // Obtener el contenido de la carpeta
      const entries = fs.readdirSync(src, { withFileTypes: true });
      console.log(`📦 Copiando ${entries.length} elementos de ${src}`);
      
      // Para cada entrada en el directorio fuente
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        // Archivos y carpetas a ignorar
        if (["node_modules", ".git", ".DS_Store", "main-copilot-instructions.md"].includes(entry.name)) {
          console.log(`⏭️ Ignorando: ${entry.name}`);
          continue;
        }
        
        // Si es un directorio, crear en destino y copiar contenido
        if (entry.isDirectory()) {
          console.log(`📁 Procesando directorio: ${srcPath} -> ${destPath}`);
          
          try {
            // Crear directorio si no existe
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
              console.log(`📁 Carpeta creada: ${destPath}`);
            }
            
            // Copiar contenido recursivamente
            this.copyFolderRecursive(srcPath, destPath);
            
          } catch (dirError) {
            console.error(`❌ ERROR al crear/procesar directorio ${destPath}:`, dirError);
          }
        } 
        // Si es un archivo, copiarlo solo si es necesario
        else {
          try {
            let shouldCopy = true;
            
            // Verificar si el archivo ya existe y es idéntico
            if (fs.existsSync(destPath)) {
              const srcContent = fs.readFileSync(srcPath, 'utf8');
              const destContent = fs.readFileSync(destPath, 'utf8');
              
              if (srcContent === destContent) {
                console.log(`⏭️ Archivo idéntico, omitiendo: ${entry.name}`);
                shouldCopy = false;
              } else {
                console.log(`� Actualizando archivo existente: ${entry.name}`);
              }
            } else {
              console.log(`📄 Copiando nuevo archivo: ${entry.name}`);
            }
            
            if (shouldCopy) {
              fs.copyFileSync(srcPath, destPath);
              
              // Verificar que el archivo se copió correctamente
              if (fs.existsSync(destPath)) {
                const srcStats = fs.statSync(srcPath);
                const destStats = fs.statSync(destPath);
                console.log(`✅ Archivo procesado correctamente: ${entry.name} (${destStats.size} bytes, original: ${srcStats.size} bytes)`);
              } else {
                console.error(`❌ ERROR: El archivo destino no existe después de copiar: ${destPath}`);
              }
            }
          } catch (fileError) {
            console.error(`❌ ERROR al procesar archivo ${srcPath} -> ${destPath}:`, fileError);
          }
        }
      }
      
      // Verificar el resultado final
      console.log(`📋 Contenido final del directorio ${dest} después de copiar:`);
      try {
        const finalEntries = fs.readdirSync(dest);
        if (finalEntries.length === 0) {
          console.log(`   (directorio vacío)`);
        } else {
          finalEntries.forEach(file => {
            const filePath = path.join(dest, file);
            const isDir = fs.statSync(filePath).isDirectory();
            console.log(`   - ${file}${isDir ? '/' : ''}`);
          });
        }
      } catch (readError) {
        console.error(`❌ ERROR al leer el directorio final ${dest}:`, readError);
      }
      
    } catch (error) {
      console.error(`❌ ERROR en copyFolderRecursive (${src} -> ${dest}):`, error);
      throw error;
    }
  }
}
