// Instância global do gerenciador de dados
const dataManager = new DataManager();

// Variáveis globais do app (mantendo as mesmas que você tinha)
let listaPerguntas = [];
let indice = 0;
let respostasUsuario = [];
let respostaDarAtual = null;
let respostaReceberAtual = null;
let voltouPergunta = false;

// Inicialização do app
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Mostrar loading
    mostrarLoading(true);
    
    // Carregar dados
    await dataManager.carregarTodos();
    
    // Inicializar interface
    inicializarInterface();
    
    // Verificar resultado compartilhado
    verificarResultadoCompartilhado();
    
  } catch (error) {
    console.error('Erro na inicialização:', error);
    mostrarErroCarregamento();
  } finally {
    mostrarLoading(false);
  }
});

function mostrarLoading(show) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = show ? 'block' : 'none';
  }
}

function mostrarErroCarregamento() {
  const container = document.querySelector('.container');
  const erro = document.createElement('div');
  erro.className = 'erro-carregamento';
  erro.style.cssText = 'background: #e74c3c; color: white; padding: 2rem; border-radius: 15px; text-align: center; margin: 2rem 0;';
  erro.innerHTML = `
    <h2>❌ Erro ao Carregar</h2>
    <p>Não foi possível carregar os dados do questionário.</p>
    <button onclick="location.reload()" class="btn" style="margin-top: 1rem;">🔄 Tentar Novamente</button>
  `;
  container.innerHTML = '';
  container.appendChild(erro);
}

function inicializarInterface() {
  // Configurar botões toggle
  const botoesToggle = document.querySelectorAll('.toggle');
  botoesToggle.forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });

  // Gerar subcategorias dinamicamente
  gerarSubcategorias();
  
  // Gerar opções de perfil dinamicamente
  gerarOpcoesPerfil();
  
  console.log('✅Interface inicializada');
