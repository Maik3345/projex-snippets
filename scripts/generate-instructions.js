const fs = require('fs');
const path = require('path');

/**
 * Script para generar el archivo de instrucciones de Copilot automáticamente
 * basado en la estructura de carpetas donde cada carpeta es un alias
 */

// Rutas importantes
const INSTRUCTIONS_DIR = path.join(__dirname, '..', 'instructions');
const OUTPUT_FILE = path.join(INSTRUCTIONS_DIR, 'main-copilot-instructions.md');

// Emojis para las categorías
const CATEGORY_EMOJIS = {
  'pr': '📋',
  'commit': '📋',
  'doc': '📚',
  'vtex': '🏪',
  'qa': '🧪',
  'coverage': '🧪',
  'default': '🔹'
};

// Descripciones para las categorías y sus combinaciones
const CATEGORY_DESCRIPTIONS = {
  'pr': 'Pull Request y Control de Versiones',
  'commit': 'Conventional Commits',
  'doc': 'Documentación General',
  'doc vtex': 'Documentación VTEX IO',
  'vtex': 'Documentación VTEX IO',
  'qa': 'QA y Testing',
  'coverage': 'Cobertura de Tests',
  'default': 'Instrucciones Personalizadas'
};

// Palabras clave para cada categoría
const CATEGORY_KEYWORDS = {
  'pr': ['pr', 'pull request', 'crear pr', 'generar pr'],
  'commit': ['commit', 'conventional commit', 'formato commit', 'mensaje commit'],
  'doc': ['doc', 'documentación', 'generar docs', 'crear documentación'],
  'qa': ['qa', 'qa-hu', 'resumen qa', 'testing guide', 'qa guide'],
  'coverage': ['coverage', 'test-coverage', 'cobertura', 'sonar quality gate', 'cobertura tests'],
  'doc vtex': ['doc vtex', 'vtex documentation', 'documentación vtex', 'vtex io'],
};

// Descripciones cortas de acciones
const CATEGORY_ACTIONS = {
  'pr': 'Automatiza la generación del contenido de Pull Request basándose en el template y el historial de cambios',
  'commit': 'Aplica las reglas de Conventional Commits 1.0.0 para estructurar mensajes de commit consistentes',
  'doc': 'Genera documentación detallada en la carpeta docs con diagramas Mermaid y actualiza README.md',
  'doc vtex': 'Especializada en documentación para proyectos VTEX IO, incluyendo componentes, props y APIs',
  'vtex': 'Especializada en documentación para proyectos VTEX IO, incluyendo componentes, props y APIs',
  'qa': 'Genera resumen estructurado para QA con casos de prueba, puntos críticos y regresiones a verificar',
  'coverage': 'Mejora sistemáticamente la cobertura de tests hasta alcanzar el 87% requerido por SonarQube'
};

function generateHeader() {
  return `## 🎯 Sistema de Activación por Palabras Clave\n\n**INSTRUCCIÓN PARA COPILOT:** Cuando detectes cualquiera de estas palabras clave en el prompt del usuario, activa automáticamente las instrucciones correspondientes:\n\n---\n`;
}

function generateFooter() {
  return `\n---\n\n### 🤖 Para Copilot: Reglas de Activación Automática\n\n1. **Detecta las palabras clave** en el prompt del usuario (sin importar mayúsculas/minúsculas)\n2. **Activa automáticamente** las instrucciones del archivo correspondiente\n3. **Sigue las instrucciones específicas** del archivo referenciado\n4. **No requieras** que el usuario mencione explícitamente las instrucciones\n5. **Ejecuta la tarea** según el flujo definido en las instrucciones específicas\n`;
}

function findInstructionFiles(folderPath, parentAlias = '') {
  const results = [];
  try {
    const baseFolderName = path.basename(INSTRUCTIONS_DIR);
    const relativePath = path.relative(INSTRUCTIONS_DIR, folderPath);
    const items = fs.readdirSync(folderPath);
    const instructionFiles = items.filter(item => {
      const itemPath = path.join(folderPath, item);
      return fs.statSync(itemPath).isFile() && 
             (item.endsWith('.instruction.md') || 
              item.endsWith('.instructions.md') || 
              item === 'instructions.md');
    });
    for (const file of instructionFiles) {
      const filePath = path.join(folderPath, file);
      const fileName = path.basename(file, path.extname(file)).replace(/\.instructions?$/, '');
      let alias = '';
      if (relativePath) {
        const pathParts = relativePath.split(path.sep);
        if (pathParts.length >= 1) {
          alias = pathParts[0];
          if (pathParts.length >= 2) {
            alias = `${alias}-${pathParts[1]}`;
          }
        }
      } else {
        alias = fileName;
      }
      results.push({
        alias,
        filePath,
        fileName,
        folderPath
      });
    }
    const subfolders = items.filter(item => {
      const itemPath = path.join(folderPath, item);
      return fs.statSync(itemPath).isDirectory() && 
             !['node_modules', 'templates'].includes(item);
    });
    for (const subfolder of subfolders) {
      const subfolderPath = path.join(folderPath, subfolder);
      const subResults = findInstructionFiles(subfolderPath);
      results.push(...subResults);
    }
  } catch (error) {
    console.error(`Error al buscar archivos en ${folderPath}:`, error);
  }
  return results;
}

function generateInstructionSection(instruction) {
  const { alias, filePath, fileName, folderPath } = instruction;
  const baseAlias = alias.split('-')[0];
  const emoji = CATEGORY_EMOJIS[baseAlias] || CATEGORY_EMOJIS.default;
  let description;
  if (alias.includes('-')) {
    const specificAlias = alias.split('-').join(' ');
    description = CATEGORY_DESCRIPTIONS[specificAlias] || 
                  CATEGORY_DESCRIPTIONS[baseAlias] || 
                  alias.charAt(0).toUpperCase() + alias.slice(1).replace(/-/g, ' ');
  } else {
    description = CATEGORY_DESCRIPTIONS[alias] || 
                  alias.charAt(0).toUpperCase() + alias.slice(1);
  }
  let keywords = [];
  if (alias.includes('-')) {
    const aliasParts = alias.split('-');
    const combinedKeyword = aliasParts.join(' ');
    const specificAlias = alias.split('-').join(' ');
    if (CATEGORY_KEYWORDS[specificAlias]) {
      keywords = CATEGORY_KEYWORDS[specificAlias];
    } else {
      keywords = [combinedKeyword];
    }
  } else {
    keywords = CATEGORY_KEYWORDS[alias] || [alias];
  }
  const specificAlias = alias.split('-').join(' ');
  const action = CATEGORY_ACTIONS[specificAlias] || 
                CATEGORY_ACTIONS[baseAlias] || 
                `Ejecuta instrucciones específicas para ${alias.replace(/-/g, ' ')}`;
  let section = `### ${emoji} ${description}\n\n`;
  const keywordsText = keywords.map(k => `\`"${k}"\``).join(' | ');
  const relativePath = path.relative(INSTRUCTIONS_DIR, filePath).replace(/\\/g, '/');
  section += `**Palabras clave:** ${keywordsText}  \n`;
  section += `**→ ACTIVAR:** [${path.basename(filePath)}](./instructions/${relativePath})  \n`;
  section += `**Acción:** ${action}\n\n`;
  return section;
}

function generateInstructions() {
  try {
    console.log('🔄 Generando instrucciones basadas en estructura de carpetas...');
    const mainFolders = fs.readdirSync(INSTRUCTIONS_DIR)
      .filter(item => {
        const itemPath = path.join(INSTRUCTIONS_DIR, item);
        return fs.statSync(itemPath).isDirectory() && 
              !['node_modules', 'templates', 'pull-request', 'documentation', 'backlog', 'unit-testing'].includes(item);
      });
    if (mainFolders.length === 0) {
      console.error('❌ No se encontraron carpetas de alias válidas en el directorio de instrucciones.');
      return;
    }
    const allInstructions = [];
    for (const folder of mainFolders) {
      const folderPath = path.join(INSTRUCTIONS_DIR, folder);
      const instructions = findInstructionFiles(folderPath);
      allInstructions.push(...instructions);
    }
    if (allInstructions.length === 0) {
      console.error('❌ No se encontraron archivos de instrucciones válidos.');
      return;
    }
    let content = generateHeader();
    for (const instruction of allInstructions) {
      content += generateInstructionSection(instruction);
    }
    content += generateFooter();
    fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
    console.log(`✅ Instrucciones generadas correctamente en: ${OUTPUT_FILE}`);
    console.log(`📊 Se generaron secciones para ${allInstructions.length} instrucciones.`);
    console.log(`📁 Instrucciones encontradas:`);
    allInstructions.forEach(instruction => {
      console.log(`   - ${instruction.alias}: ${path.basename(instruction.filePath)}`);
    });
  } catch (error) {
    console.error('❌ Error al generar las instrucciones:', error);
  }
}

generateInstructions();
