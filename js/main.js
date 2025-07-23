// ===============================
// SISTEMA FIREBASE + FALLBACK
// ===============================

class CompartilhamentoFirebase {
  constructor() {
    this.databaseURL = 'https://quest-bdsm-default-rtdb.firebaseio.com/';
    this.initialized = false;
    this.fallbackMode = false;
  }

  async initialize() {
    try {
      // Verificar se Firebase está disponível
      if (typeof fetch === 'undefined') {
        throw new Error('Fetch API não disponível');
      }
      
      // Testar conectividade com Firebase
      const testUrl = `${this.databaseURL}.json`;
      const response = await fetch(testUrl, { method: 'GET' });
      
      if (!response.ok) {
        throw new Error('Firebase inacessível');
      }
      
      this.initialized = true;
      console.log('✅ Firebase inicializado com sucesso');
      return true;
      
    } catch (error) {
      console.warn('⚠️ Firebase indisponível, usando fallback:', error.message);
      this.fallbackMode = true;
      return false;
    }
  }

  generateUniqueId() {
    // Gerar ID único de 8 caracteres
    return Math.random().toString(36).substring(2, 10);
  }

  async salvarResultado(dados) {
    if (this.fallbackMode) {
      return this.salvarFallback(dados);
    }

    try {
      const resultId = this.generateUniqueId();
      const url = `${this.databaseURL}results/${resultId}.json`;
      
      const payload = {
        ...dados,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 dias
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Firebase erro: ${response.status}`);
      }

      console.log('✅ Resultado salvo no Firebase:', resultId);
      return { success: true, id: resultId, size: resultId.length + 20 }; // ~28 chars total
      
    } catch (error) {
      console.warn('⚠️ Erro Firebase, tentando fallback:', error.message);
      return this.salvarFallback(dados);
    }
  }

  async carregarResultado(resultId) {
    if (this.fallbackMode) {
      return this.carregarFallback(resultId);
    }

    try {
      const url = `${this.databaseURL}results/${resultId}.json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Resultado não encontrado');
        }
        throw new Error(`Firebase erro: ${response.status}`);
      }

      const dados = await response.json();
      
      if (!dados) {
        throw new Error('Resultado não encontrado');
      }

      // Verificar expiração
      if (dados.expiresAt && new Date(dados.expiresAt) < new Date()) {
        throw new Error('Resultado expirado');
      }

      console.log('✅ Resultado carregado do Firebase:', resultId);
      return { success: true, dados: dados };
      
    } catch (error) {
      console.warn('⚠️ Erro ao carregar do Firebase:', error.message);
      
      // Se for erro de não encontrado, não tenta fallback
      if (error.message.includes('não encontrado') || error.message.includes('expirado')) {
        throw error;
      }
      
      return this.carregarFallback(resultId);
    }
  }

  // Sistema de fallback (Base64 simples)
  salvarFallback(dados) {
    try {
      const jsonString = JSON.stringify(dados);
      const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
      
      console.log('🔄 Usando sistema fallback (Base64)');
      return { 
        success: true, 
        id: base64Data, 
        size: base64Data.length,
        fallback: true 
      };
      
    } catch (error) {
      console.error('❌ Erro no fallback:', error);
      return { success: false, error: error.message };
    }
  }

  carregarFallback(base64Data) {
    try {
      const jsonString = decodeURIComponent(escape(atob(base64Data)));
      const dados = JSON.parse(jsonString);
      
      console.log('🔄 Carregado via sistema fallback');
      return { success: true, dados: dados, fallback: true };
      
    } catch (error) {
      throw new Error('Dados de fallback corrompidos');
    }
  }
}

// Instância global
const firebaseShare = new CompartilhamentoFirebase();

// ===============================
// APLICAÇÃO PRINCIPAL
// ===============================

// Instância global do gerenciador de dados
const dataManager = new DataManager();

// Variáveis globais do app
let listaPerguntas = [];
let indice = 0;
let respostasUsuario = [];
let respostaDarAtual = null;
let respostaReceberAtual = null;
let voltouPergunta = false;

// Inicialização do app
document.addEventListener('DOMContentLoaded', async function() {
  try {
    mostrarLoading(true);
    await dataManager.carregarTodos();
    inicializarInterface();
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
  const botoesToggle = document.querySelectorAll('.toggle');
  botoesToggle.forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });

  gerarSubcategorias();
  gerarOpcoesPerfil();
  
  console.log('✅ Interface inicializada');
}

function gerarSubcategorias() {
  const container = document.querySelector('[data-subcategoria="true"]').parentElement;
  container.innerHTML = '';
  
  dataManager.categoriasAtivas.forEach(([nome, categoria]) => {
    const botao = document.createElement('button');
    botao.className = 'toggle';
    botao.setAttribute('data-subcategoria', 'true');
    botao.innerHTML = `${categoria.icone} ${categoria.nome}`;
    botao.style.borderLeftColor = categoria.cor;
    
    botao.addEventListener('click', () => botao.classList.toggle('active'));
    container.appendChild(botao);
  });
}

function gerarOpcoesPerfil() {
  const opcoes = dataManager.opcoesPerfil;
  
  const selectPosicao = document.getElementById('posicao');
  if (selectPosicao) {
    selectPosicao.innerHTML = '';
    opcoes.posicoes?.forEach(pos => {
      const option = document.createElement('option');
      option.value = pos;
      option.textContent = pos;
      selectPosicao.appendChild(option);
    });
  }

  const selectDor = document.getElementById('dor');
  if (selectDor) {
    selectDor.innerHTML = '';
    opcoes.toleranciaDor?.forEach(dor => {
      const option = document.createElement('option');
      option.value = dor;
      option.textContent = dor;
      selectDor.appendChild(option);
    });
  }

  ['teorica', 'pratica'].forEach(tipo => {
    const select = document.getElementById(tipo);
    if (select) {
      select.innerHTML = '';
      opcoes.experiencia?.forEach(exp => {
        const option = document.createElement('option');
        option.value = exp;
        option.textContent = exp;
        select.appendChild(option);
      });
    }
  });
}

function iniciarQuestionario() {
  const selecionadas = Array.from(
    document.querySelectorAll('[data-subcategoria].active')
  ).map(btn => {
    const texto = btn.textContent.trim();
    return texto.replace(/^[^\s]+\s/, '');
  });
  
  if (selecionadas.length === 0) {
    alert('Por favor, selecione pelo menos uma subcategoria!');
    return;
  }
  
  listaPerguntas = [];
  respostasUsuario = [];
  indice = 0;
  voltouPergunta = false;
  
  selecionadas.forEach(cat => {
    const perguntas = dataManager.obterPerguntasCategoria(cat);
    perguntas.forEach(p => {
      listaPerguntas.push({ categoria: cat, texto: p });
    });
  });
  
  document.getElementById('questionario').classList.remove('hidden');
  document.getElementById('resultados').classList.add('hidden');
  mostrarPergunta();
}

function atualizarCabecalhosQuestionario() {
  const categoriaAtual = listaPerguntas[indice]?.categoria;
  const classificacao = dataManager.obterClassificacao(categoriaAtual);
  
  if (classificacao) {
    const darHeader = document.querySelector('.dar-header');
    const receberHeader = document.querySelector('.receber-header');
    
    if (darHeader && receberHeader) {
      darHeader.innerHTML = `${classificacao.icone1} ${classificacao.tipo1}`;
      receberHeader.innerHTML = `${classificacao.icone2} ${classificacao.tipo2}`;
      
      darHeader.style.background = `linear-gradient(135deg, ${classificacao.cor1} 0%, ${classificacao.cor1}dd 100%)`;
      receberHeader.style.background = `linear-gradient(135deg, ${classificacao.cor2} 0%, ${classificacao.cor2}dd 100%)`;
    }
  }
}

function mostrarPergunta() {
  if (indice < 0 || indice >= listaPerguntas.length) return;
  
  const atual = listaPerguntas[indice];
  document.getElementById('categoriaAtual').textContent = `📋 ${atual.categoria}`;
  document.getElementById('perguntaAtual').textContent = atual.texto;

  respostaDarAtual = null;
  respostaReceberAtual = null;
  
  if (respostasUsuario[indice]) {
    respostaDarAtual = respostasUsuario[indice].dar;
    respostaReceberAtual = respostasUsuario[indice].receber;
  }

  atualizarCabecalhosQuestionario();
  criarRespostas();
  atualizarProgresso();
  verificarBotaoProximo();
}

function criarRespostas() {
  const container = document.getElementById('questionResponses');
  container.innerHTML = '';
  
  const respostas = dataManager.respostas;
  
  respostas.forEach(resposta => {
    const responseRow = document.createElement('div');
    responseRow.className = 'response-row';
    responseRow.setAttribute('data-resposta', resposta);
    
    const darSwitch = document.createElement('div');
    darSwitch.className = 'response-switch';
    darSwitch.innerHTML = `
      <label class="switch">
        <input type="checkbox" id="dar-${resposta.replace(/\s+/g, '-').toLowerCase()}-${indice}">
        <span class="slider"></span>
      </label>
    `;
    
    const responseText = document.createElement('div');
    responseText.className = 'response-text';
    responseText.textContent = resposta;
    
    const receberSwitch = document.createElement('div');
    receberSwitch.className = 'response-switch';
    receberSwitch.innerHTML = `
      <label class="switch">
        <input type="checkbox" id="receber-${resposta.replace(/\s+/g, '-').toLowerCase()}-${indice}">
        <span class="slider"></span>
      </label>
    `;
    
    const darInput = darSwitch.querySelector('input');
    const receberInput = receberSwitch.querySelector('input');
    
    darInput.addEventListener('change', function() {
      if (this.checked) {
        container.querySelectorAll('.response-switch:first-child input').forEach(cb => {
          if (cb !== this) cb.checked = false;
        });
        respostaDarAtual = resposta;
      } else {
        respostaDarAtual = null;
      }
      verificarBotaoProximo();
    });
    
    receberInput.addEventListener('change', function() {
      if (this.checked) {
        container.querySelectorAll('.response-switch:last-child input').forEach(cb => {
          if (cb !== this) cb.checked = false;
        });
        respostaReceberAtual = resposta;
      } else {
        respostaReceberAtual = null;
      }
      verificarBotaoProximo();
    });
    
    if (respostaDarAtual === resposta) {
      darInput.checked = true;
    }
    if (respostaReceberAtual === resposta) {
      receberInput.checked = true;
    }
    
    responseRow.appendChild(darSwitch);
    responseRow.appendChild(responseText);
    responseRow.appendChild(receberSwitch);
    
    container.appendChild(responseRow);
  });
}

function verificarBotaoProximo() {
  const btnProximo = document.querySelector('.btn-proximo');
  
  if (respostaDarAtual && respostaReceberAtual) {
    if (voltouPergunta) {
      if (!btnProximo) {
        const navButtons = document.querySelector('.navigation-buttons');
        const novoBtn = document.createElement('button');
        novoBtn.className = 'nav-btn btn-proximo';
        novoBtn.textContent = '➡️ Próximo';
        novoBtn.onclick = proximaPergunta;
        navButtons.appendChild(novoBtn);
      }
    } else {
      setTimeout(() => {
        proximaPergunta();
      }, 500);
    }
  } else {
    if (btnProximo) {
      btnProximo.remove();
    }
  }
}

function proximaPergunta() {
  if (!respostaDarAtual || !respostaReceberAtual) {
    return;
  }
  
  voltouPergunta = false;
  const btnProximo = document.querySelector('.btn-proximo');
  if (btnProximo) {
    btnProximo.remove();
  }
  
  const atual = listaPerguntas[indice];
  respostasUsuario[indice] = {
    categoria: atual.categoria,
    pergunta: atual.texto,
    dar: respostaDarAtual,
    receber: respostaReceberAtual
  };
  
  indice++;
  
  if (indice < listaPerguntas.length) {
    mostrarPergunta();
  } else {
    mostrarResultado();
  }
}

function anteriorPergunta() {
  if (indice > 0) {
    indice--;
    voltouPergunta = true;
    mostrarPergunta();
  }
}

function atualizarProgresso() {
  const progressText = document.getElementById('progressText');
  const progressBar = document.getElementById('progressBar');
  
  const atual = indice + 1;
  const total = listaPerguntas.length;
  
  progressText.textContent = `Pergunta ${atual} de ${total}`;
  
  const porcentagem = (indice / listaPerguntas.length) * 100;
  progressBar.style.width = porcentagem + '%';
}

function mostrarResultado() {
  document.getElementById('questionario').classList.add('hidden');
  document.getElementById('resultados').classList.remove('hidden');

  const resumo = document.getElementById('resumo');
  resumo.innerHTML = '';
  
  const agrupado = {};

  const respostasFiltradas = respostasUsuario.filter(r => 
    r.dar !== 'N/A' || r.receber !== 'N/A'
  );

  respostasFiltradas.forEach(r => {
    if (!agrupado[r.categoria]) {
      agrupado[r.categoria] = {
        tipo1: {},
        tipo2: {}
      };
    }
    
    if (r.dar !== 'N/A') {
      if (!agrupado[r.categoria].tipo1[r.dar]) {
        agrupado[r.categoria].tipo1[r.dar] = [];
      }
      agrupado[r.categoria].tipo1[r.dar].push(r.pergunta);
    }
    
    if (r.receber !== 'N/A') {
      if (!agrupado[r.categoria].tipo2[r.receber]) {
        agrupado[r.categoria].tipo2[r.receber] = [];
      }
      agrupado[r.categoria].tipo2[r.receber].push(r.pergunta);
    }
  });

  adicionarResumoPerfilSelecionado(resumo);
  adicionarEstatisticasGerais(resumo, respostasFiltradas);
  adicionarBotaoCompartilhar(resumo);

  for (const categoria in agrupado) {
    const secao = document.createElement('div');
    secao.className = 'resultado-categoria';
    secao.innerHTML = `<h3>📋 ${categoria}</h3>`;
    
    const classificacao = dataManager.obterClassificacao(categoria);
    
    if (classificacao) {
      const tabelaTipo1 = criarTabelaResultado(
        agrupado[categoria].tipo1, 
        classificacao.tipo1,
        categoria
      );
      secao.appendChild(tabelaTipo1);
      
      const tabelaTipo2 = criarTabelaResultado(
        agrupado[categoria].tipo2, 
        classificacao.tipo2,
        categoria
      );
      secao.appendChild(tabelaTipo2);
    }
    
    resumo.appendChild(secao);
  }
}

function adicionarResumoPerfilSelecionado(container) {
  const perfilSelecionado = {
    posicao: document.getElementById('posicao')?.value || 'N/A',
    dor: document.getElementById('dor')?.value || 'N/A',
    teorica: document.getElementById('teorica')?.value || 'N/A',
    pratica: document.getElementById('pratica')?.value || 'N/A'
  };

  const relacionamentosSelecionados = Array.from(
    document.querySelectorAll('.section:nth-child(3) .toggle.active')
  ).map(btn => btn.textContent);

  const locaisSelecionados = Array.from(
    document.querySelectorAll('.section:nth-child(4) .toggle.active')
  ).map(btn => btn.textContent);

  const categoriasRespondidas = [...new Set(respostasUsuario.map(r => r.categoria))];

  const resumoDiv = document.createElement('div');
  resumoDiv.className = 'resumo-perfil-selecionado';
  
  resumoDiv.innerHTML = `
    <h3>👤 Seu Perfil</h3>
    <div class="perfil-grid">
      <div class="perfil-card">
        <div class="perfil-icon">🎯</div>
        <div class="perfil-label">Posição</div>
        <div class="perfil-valor">${perfilSelecionado.posicao}</div>
      </div>
      <div class="perfil-card">
        <div class="perfil-icon">⚡</div>
        <div class="perfil-label">Tolerância à Dor</div>
        <div class="perfil-valor">${perfilSelecionado.dor}</div>
      </div>
      <div class="perfil-card">
        <div class="perfil-icon">📚</div>
        <div class="perfil-label">Experiência Teórica</div>
        <div class="perfil-valor">${perfilSelecionado.teorica}</div>
      </div>
      <div class="perfil-card">
        <div class="perfil-icon">🔥</div>
        <div class="perfil-label">Experiência Prática</div>
        <div class="perfil-valor">${perfilSelecionado.pratica}</div>
      </div>
    </div>

    ${relacionamentosSelecionados.length > 0 ? `
    <h4>💕 Tipos de Relacionamento</h4>
    <div class="tags-container">
      ${relacionamentosSelecionados.map(rel => `<span class="tag tag-relacionamento">${rel}</span>`).join('')}
    </div>
    ` : ''}

    ${locaisSelecionados.length > 0 ? `
    <h4>📍 Locais de Interesse</h4>
    <div class="tags-container">
      ${locaisSelecionados.map(local => `<span class="tag tag-local">${local}</span>`).join('')}
    </div>
    ` : ''}

    <h4>📋 Categorias Respondidas</h4>
    <div class="tags-container">
      ${categoriasRespondidas.map(cat => `<span class="tag tag-categoria">${cat}</span>`).join('')}
    </div>
  `;
  
  container.appendChild(resumoDiv);
}

function adicionarEstatisticasGerais(container, respostasFiltradas) {
  const stats = calcularEstatisticas(respostasFiltradas);
  
  const estatisticas = document.createElement('div');
  estatisticas.className = 'estatisticas-gerais';
  
  estatisticas.innerHTML = `
    <h3>📊 Resumo dos Seus Resultados</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number" style="color: #27ae60;">${stats.totalAdoro}</div>
        <div class="stat-label">Práticas que você ADORA</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: #f39c12;">${stats.totalAceito}</div>
        <div class="stat-label">Práticas que você ACEITA</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: #e74c3c;">${stats.totalLimites}</div>
        <div class="stat-label">Limites Rígidos</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: #95a5a6;">${stats.totalNunca}</div>
        <div class="stat-label">Nunca Experimentou</div>
      </div>
    </div>
  `;
  
  container.appendChild(estatisticas);
}

function calcularEstatisticas(respostas) {
  const stats = {
    totalAdoro: 0,
    totalAceito: 0,
    totalLimites: 0,
    totalNunca: 0
  };
  
  respostas.forEach(r => {
    [r.dar, r.receber].forEach(resposta => {
      if (resposta === 'Adoro' || resposta === 'Aproveito') stats.totalAdoro++;
      else if (resposta === 'Aceito' || resposta === 'Tolero') stats.totalAceito++;
      else if (resposta === 'Limite rígido') stats.totalLimites++;
      else if (resposta === 'Nunca experimentei') stats.totalNunca++;
    });
  });
  
  return stats;
}

function adicionarBotaoCompartilhar(container) {
  const compartilhar = document.createElement('div');
  compartilhar.className = 'compartilhar-container';
  
  compartilhar.innerHTML = `
    <h3>🔗 Compartilhar Resultados</h3>
    <button class="btn-compartilhar" onclick="copiarLinkCompartilhamento()">
      📋 Copiar Link de Compartilhamento
    </button>
    <div id="linkGerado" style="display: none; margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
      <strong>🔗 Link gerado:</strong><br>
      <span id="linkTexto" style="font-family: monospace; word-break: break-all; font-size: 0.9rem;"></span>
    </div>
  `;
  
  container.appendChild(compartilhar);
}

function criarTabelaResultado(dados, titulo, categoria) {
  const container = document.createElement('div');
  
  const coresHeader = {
    'RECEBER': '#e74c3c',
    'FAZER': '#27ae60', 
    'SER PRESO(A)': '#e74c3c',
    'PRENDER': '#27ae60',
    'DAR': '#e74c3c',
    'MANDAR': '#e74c3c', 
    'OBEDECER': '#27ae60',
    'AUTOR': '#e74c3c',
    'VÍTIMA': '#27ae60',
    'APLICAR': '#e74c3c',
    'ASSISTIR': '#27ae60'
  };

  const icones = {
    'RECEBER': '💖',
    'FAZER': '🔥',
    'SER PRESO(A)': '🔒',
    'PRENDER': '⛓️',
    'DAR': '🔥',
    'MANDAR': '👑',
    'OBEDECER': '🙇',
    'AUTOR': '🎭',
    'VÍTIMA': '🎪',
    'APLICAR': '🔧',
    'ASSISTIR': '👀'
  };
  
  const cor = coresHeader[titulo] || '#667eea';
  const icone = icones[titulo] || '📋';
  
  container.innerHTML = `
    <h4 style="
      margin: 1.5rem 0 1rem 0; 
      color: ${cor};
      font-size: 1.2rem;
      font-weight: 700;
      text-align: center;
      padding: 0.8rem;
      background: linear-gradient(135deg, ${cor}15 0%, ${cor}05 100%);
      border-radius: 10px;
      border-left: 4px solid ${cor};
    ">
      ${icone} ${titulo}
    </h4>
  `;
  
  const tabela = document.createElement('table');
  tabela.style.marginBottom = '1.5rem';
  
  const headerRow = document.createElement('tr');

  const respostasVisiveis = dataManager.respostas.filter(r => r !== 'N/A');

  respostasVisiveis.forEach(res => {
      const th = document.createElement('th');
      th.textContent = res;
      headerRow.appendChild(th);
  });

  tabela.appendChild(headerRow);

  const maxLinhas = Math.max(...respostasVisiveis.map(r => (dados[r] || []).length));

  for (let i = 0; i < maxLinhas; i++) {
      const row = document.createElement('tr');
      respostasVisiveis.forEach(res => {
          const td = document.createElement('td');
          const conteudo = dados[res]?.[i] || "";
          td.textContent = conteudo;
          
          if (conteudo) {
            td.setAttribute('data-resposta', res);
          }
          
          if (i % 2 === 0 && !conteudo) {
              td.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }
          
          row.appendChild(td);
      });
      tabela.appendChild(row);
  }

  container.appendChild(tabela);
  return container;
}

// ===============================
// FUNÇÕES DE COMPARTILHAMENTO FIREBASE + FALLBACK
// ===============================

async function copiarLinkCompartilhamento() {
  const botao = event.target;
  const textoOriginal = botao.textContent;
  
  try {
    if (!respostasUsuario || respostasUsuario.length === 0) {
      throw new Error('Nenhuma resposta para compartilhar');
    }

    // Mostrar loading
    botao.textContent = '⏳ Gerando...';
    botao.disabled = true;

    // Inicializar Firebase se necessário
    if (!firebaseShare.initialized && !firebaseShare.fallbackMode) {
      await firebaseShare.initialize();
    }

    // Preparar dados para compartilhamento
    const dadosCompartilhamento = {
      respostas: respostasUsuario,
      perfil: {
        posicao: document.getElementById('posicao')?.value || 'Top',
        dor: document.getElementById('dor')?.value || 'Média',
        teorica: document.getElementById('teorica')?.value || '0-3 anos',
        pratica: document.getElementById('pratica')?.value || '0-3 anos'
      },
      relacionamentos: Array.from(
        document.querySelectorAll('.section:nth-child(3) .toggle.active')
      ).map(btn => btn.textContent.trim()),
      locais: Array.from(
        document.querySelectorAll('.section:nth-child(4) .toggle.active')
      ).map(btn => btn.textContent.trim())
    };

    // Salvar dados
    const resultado = await firebaseShare.salvarResultado(dadosCompartilhamento);
    
    if (!resultado.success) {
      throw new Error(resultado.error || 'Erro ao salvar');
    }

    // Gerar link
    const urlAtual = window.location.href.split('#')[0];
    const linkType = resultado.fallback ? 'share' : 'r';
    const link = `${urlAtual}#${linkType}=${resultado.id}`;
    
    // Copiar para clipboard
    await navigator.clipboard.writeText(link);
    
    // Feedback de sucesso
    botao.textContent = '✅ Link Copiado!';
    botao.style.background = '#27ae60';
    
    // Mostrar informações do link
    mostrarInformacoesLink(link, resultado, dadosCompartilhamento);
    
    setTimeout(() => {
      botao.textContent = textoOriginal;
      botao.style.background = '';
      botao.disabled = false;
    }, 3000);
    
  } catch (error) {
    console.error('Erro ao gerar link:', error);
    
    botao.textContent = '❌ Erro';
    botao.style.background = '#e74c3c';
    
    // Mostrar erro detalhado
    mostrarErroCompartilhamento(error.message);
    
    setTimeout(() => {
      botao.textContent = textoOriginal;
      botao.style.background = '';
      botao.disabled = false;
    }, 3000);
  }
}

function mostrarInformacoesLink(link, resultado, dados) {
  const linkDiv = document.getElementById('linkGerado');
  const linkTexto = document.getElementById('linkTexto');
  
  linkTexto.textContent = link;
  linkDiv.style.display = 'block';
  
  // Remover info anterior
  const infoAnterior = linkDiv.querySelector('.info-link');
  if (infoAnterior) {
    infoAnterior.remove();
  }
  
  const infoDiv = document.createElement('div');
  infoDiv.className = 'info-link';
  infoDiv.style.cssText = 'margin-top: 1rem; padding: 1rem; background: rgba(0,255,0,0.1); border-radius: 8px; font-size: 0.9rem;';
  
  if (resultado.fallback) {
    infoDiv.innerHTML = `
      <strong>🔄 Sistema Fallback Ativo</strong><br>
      • 📊 ${dados.respostas.length} respostas preservadas<br>
      • 🔗 Link: ${link.length} caracteres<br>
      • ⚠️ Firebase temporariamente indisponível<br>
      • ✅ Dados funcionais via Base64
    `;
  } else {
    infoDiv.innerHTML = `
      <strong>✅ Link Gerado com Sucesso!</strong><br>
      • 📊 ${dados.respostas.length} respostas preservadas<br>
      • 🔗 Link: ${link.length} caracteres<br>
      • ⚡ ID único: ${resultado.id}<br>
      • 🗓️ Expira em 90 dias
    `;
  }
  
  linkDiv.appendChild(infoDiv);
}

function mostrarErroCompartilhamento(mensagem) {
  const linkDiv = document.getElementById('linkGerado');
  
  const erroDiv = document.createElement('div');
  erroDiv.style.cssText = 'margin-top: 1rem; padding: 1rem; background: rgba(255,0,0,0.1); border-radius: 8px; font-size: 0.9rem; color: #e74c3c;';
  erroDiv.innerHTML = `
    <strong>❌ Erro ao Compartilhar</strong><br>
    ${mensagem}<br>
    <small>Tente novamente em alguns segundos</small>
  `;
  
  linkDiv.appendChild(erroDiv);
  linkDiv.style.display = 'block';
  
  // Remover erro após 5 segundos
  setTimeout(() => {
    erroDiv.remove();
    if (linkDiv.children.length <= 2) {
      linkDiv.style.display = 'none';
    }
  }, 5000);
}

async function verificarResultadoCompartilhado() {
  const hash = window.location.hash;
  
  // Firebase links (curtos)
  if (hash.startsWith('#r=')) {
    try {
      const resultId = hash.substring(3);
      
      // Inicializar Firebase
      await firebaseShare.initialize();
      
      // Carregar dados
      const resultado = await firebaseShare.carregarResultado(resultId);
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao carregar');
      }
      
      // Aplicar dados
      aplicarDadosCompartilhados(resultado.dados, resultado.fallback);
      
      console.log('✅ Resultado compartilhado carregado via Firebase');
      return true;
      
    } catch (error) {
      console.error('Erro ao carregar resultado compartilhado:', error);
      mostrarErroCarregamento(error.message);
      return false;
    }
  }
  
  // Fallback links (longos)
  if (hash.startsWith('#share=')) {
    try {
      const base64Data = hash.substring(7);
      const resultado = firebaseShare.carregarFallback(base64Data);
      
      if (!resultado.success) {
        throw new Error('Dados corrompidos');
      }
      
      aplicarDadosCompartilhados(resultado.dados, true);
      
      console.log('✅ Resultado compartilhado carregado via fallback');
      return true;
      
    } catch (error) {
      console.error('Erro ao carregar fallback:', error);
      mostrarErroCarregamento('Link de fallback corrompido');
      return false;
    }
  }
  
  return false;
}

function aplicarDadosCompartilhados(dados, isFallback) {
  // Aplicar respostas
  respostasUsuario = dados.respostas || [];
  
  // Aplicar perfil
  if (dados.perfil) {
    const selects = {
      posicao: document.getElementById('posicao'),
      dor: document.getElementById('dor'),
      teorica: document.getElementById('teorica'),
      pratica: document.getElementById('pratica')
    };
    
    Object.entries(selects).forEach(([key, select]) => {
      if (select && dados.perfil[key]) {
        select.value = dados.perfil[key];
      }
    });
  }
  
  // Aplicar seleções
  aplicarSelecoes(dados.relacionamentos || [], dados.locais || []);
  
  // Mostrar modo visualização
  mostrarModoVisualizacao(dados, isFallback);
  
  // Ir para resultados
  document.getElementById('questionario').classList.add('hidden');
  document.getElementById('resultados').classList.remove('hidden');
  mostrarResultado();
}

function aplicarSelecoes(relacionamentos, locais) {
  // Aplicar relacionamentos
  if (relacionamentos.length > 0) {
    const botoesRel = document.querySelectorAll('.section:nth-child(3) .toggle');
    botoesRel.forEach(botao => {
      if (relacionamentos.includes(botao.textContent.trim())) {
        botao.classList.add('active');
      }
    });
  }
  
  // Aplicar locais
  if (locais.length > 0) {
    const botoesLoc = document.querySelectorAll('.section:nth-child(4) .toggle');
    botoesLoc.forEach(botao => {
      if (locais.includes(botao.textContent.trim())) {
        botao.classList.add('active');
      }
    });
  }
}

function mostrarModoVisualizacao(dados, isFallback) {
  const container = document.querySelector('.container');
  const aviso = document.createElement('div');
  aviso.className = 'modo-visualizacao';
  
  const dataFormatada = dados.timestamp ? 
    new Date(dados.timestamp).toLocaleDateString('pt-BR') : 
    'Data desconhecida';
  
  const sistemaUsado = isFallback ? 'Sistema Fallback' : 'Firebase';
  const icone = isFallback ? '🔄' : '🔥';
  
  aviso.innerHTML = `
    ${icone} <strong>Resultado Compartilhado</strong> - Carregado via ${sistemaUsado}
    <br>
    <small>📊 ${dados.respostas?.length || 0} respostas | 👤 ${dados.perfil?.posicao || 'N/A'} | 📅 ${dataFormatada}</small>
    <br>
    <button onclick="window.location.hash=''; location.reload();" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: white; color: #e67e22; border: none; border-radius: 5px; cursor: pointer;">
      🏠 Fazer Meu Próprio Teste
    </button>
  `;
  
  container.insertBefore(aviso, container.firstChild);

  // Ocultar formulários
  document.querySelectorAll('.section').forEach((secao, index) => {
    if (index < 4) {
      secao.style.display = 'none';
    }
  });
}

function mostrarErroCarregamento(mensagem) {
  const container = document.querySelector('.container');
  const erro = document.createElement('div');
  erro.className = 'modo-visualizacao';
  erro.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
  
  erro.innerHTML = `
    ❌ <strong>Erro ao Carregar</strong><br>
    ${mensagem}<br>
    <small>Verifique se o link está correto e completo</small>
    <br>
    <button onclick="window.location.hash=''; location.reload();" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: white; color: #e74c3c; border: none; border-radius: 5px; cursor: pointer;">
      🏠 Fazer Novo Teste
    </button>
  `;
  
  container.insertBefore(erro, container.firstChild);
}
