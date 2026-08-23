/**
 * 🧠 IA Script: Automação Completa de Release para Extensões Browser
 * 
 * OBJETIVO EDUCACIONAL PARA PROGRAMADORES JS/TS EXPERIENTES:
 * -----------------------------------------------------------------------------
 * 1. Automação de Workflows CLI no Node.js com `child_process.execSync`:
 *    - Captura de output stdio em tempo real (`stdio: 'inherit'`) para dar feedback visual limpo.
 *    - Tratamento defensivo de erros: se qualquer comando falhar (testes, lint, git, build),
 *      o script interrompe o fluxo com `process.exit(1)` evitando releases corrompidas.
 * 
 * 2. Manipulação de Arquivos JSON sem perder formatação (Indentação & EOL):
 *    - Lemos `package.json` e `extension/manifest.json`, atualizamos a propriedade `version` e
 *      reescrevemos preservando a indentação de 2 espaços e nova linha final (`\n`).
 * 
 * 3. Cálculo de SemVer (Semantic Versioning) sem dependências externas:
 *    - Suporta tipos de incremento (`patch`, `minor`, `major`) ou string direta de versão (`1.4.0`).
 * 
 * 4. Integração fluida com Git e GitHub CLI (`gh release create`):
 *    - Automação de Tagging, Push e anexação de artefatos ZIP gerados pelo `web-ext`.
 * -----------------------------------------------------------------------------
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Caminhos dos arquivos de configuração e caminhos raiz do projeto
const projectRoot = path.join(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const manifestJsonPath = path.join(projectRoot, 'extension/manifest.json');
const artifactsDir = path.join(projectRoot, 'web-ext-artifacts');

/**
 * Função utilitária para executar comandos no shell com log visível
 * @param {string} command Comando bash a ser executado
 */
function runCommand(command) {
  console.log(`\n📌 [EXEC] ${command}`);
  try {
    execSync(command, { cwd: projectRoot, stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Falha ao executar o comando: "${command}"`);
    console.error(`  Código de erro: ${error.status}`);
    process.exit(1);
  }
}

/**
 * Função para calcular o próximo número SemVer
 * @param {string} currentVersion Versão atual (ex: "1.3.0")
 * @param {string} releaseType Tipo de bump ("patch" | "minor" | "major" | "X.Y.Z")
 * @returns {string} Nova versão calculada
 */
function bumpSemver(currentVersion, releaseType = 'patch') {
  if (/^\d+\.\d+\.\d+$/.test(releaseType)) {
    return releaseType; // Versão explícita informada pelo usuário
  }

  const parts = currentVersion.split('.').map(Number);
  let [major, minor, patch] = parts;

  switch (releaseType.toLowerCase()) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
    default:
      patch += 1;
      break;
  }

  return `${major}.${minor}.${patch}`;
}

/**
 * Atualiza o arquivo JSON preservando formatação e final de linha
 */
function updateJsonVersion(filePath, newVersion) {
  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);
  json.version = newVersion;
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log(`  ✔ ${path.basename(filePath)} atualizado para v${newVersion}`);
}

async function main() {
  const args = process.argv.slice(2);
  const releaseType = args[0] || 'patch'; // Padrão: patch bump se não especificado

  console.log('🚀 ===================================================');
  console.log('   No Posts No Shorts for YouTube - Release Automation');
  console.log('======================================================\n');

  // 1. Ler versão atual
  const pkgContent = fs.readFileSync(packageJsonPath, 'utf8');
  const currentVersion = JSON.parse(pkgContent).version;
  const newVersion = bumpSemver(currentVersion, releaseType);

  console.log(`📌 Versão Atual:   v${currentVersion}`);
  console.log(`✨ Nova Versão:    v${newVersion} (Incremento: ${releaseType})\n`);

  // 2. Executar testes e lint antes de prosseguir
  console.log('⚡ Etapa 1/6: Executando Suíte de Testes Unitários...');
  runCommand('npm test');

  console.log('\n🔍 Etapa 2/6: Executando Linter da Extensão (web-ext lint)...');
  runCommand('npx web-ext lint --source-dir extension');

  // 3. Atualizar arquivos de versão
  console.log('\n📝 Etapa 3/6: Atualizando números de versão (package.json & extension/manifest.json)...');
  updateJsonVersion(packageJsonPath, newVersion);
  updateJsonVersion(manifestJsonPath, newVersion);

  // 4. Compilar artefato ZIP com web-ext
  console.log('\n📦 Etapa 4/6: Gerando Pacote ZIP de Produção (web-ext build)...');
  runCommand('npx web-ext build --source-dir extension --artifacts-dir web-ext-artifacts --overwrite-dest');

  const zipFilename = `no_posts_no_shorts_for_youtube-${newVersion}.zip`;
  const zipPath = path.join('web-ext-artifacts', zipFilename);

  // 5. Registrar Commit e Tag no Git
  console.log('\n🏷️ Etapa 5/6: Criando Commit e Tag de Versão no Git...');
  runCommand(`git add package.json extension/manifest.json Readme.md package-lock.json`);
  runCommand(`git commit -m "chore(release): v${newVersion}"`);
  runCommand(`git tag v${newVersion}`);

  // 6. Push de Commits/Tags e Criação de Release no GitHub
  console.log('\n🌐 Etapa 6/6: Enviando Commits/Tags e Criando Release no GitHub...');
  runCommand(`git push origin main --tags`);
  
  const releaseTitle = `v${newVersion} - Release Automática`;
  const releaseNotes = `Release oficial v${newVersion} compilada e empacotada automaticamente.`;
  runCommand(`gh release create v${newVersion} ${zipPath} --title "${releaseTitle}" --notes "${releaseNotes}"`);

  console.log('\n======================================================');
  console.log(`🎉 RELEASE v${newVersion} PUBLICADA COM SUCESSO!`);
  console.log(`🔗 Tag no GitHub: https://github.com/codexico/no_posts_no_shorts/releases/tag/v${newVersion}`);
  console.log('======================================================\n');
}

main();

