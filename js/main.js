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
  
  // Atualizar select de posição
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

  // Atualizar select de tolerância à dor
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

  // Atualizar selects de experiência
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

// Função para iniciar questionário
function iniciarQuestionario() {
  const selecionadas = Array.from(
    document.querySelectorAll('[data-subcategoria].active')
  ).map(btn => {
    // Remove emoji e espaços extras
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

// Função para atualizar cabeçalhos
function atualizarCabecalhosQuestionario() {
  const categoriaAtual = listaPerguntas[indice]?.categoria;
  const classificacao = dataManager.obterClassificacao(categoriaAtual);
  
  if (classificacao) {
    const darHeader = document.querySelector('.dar-header');
    const receberHeader = document.querySelector('.receber-header');
    
    if (darHeader && receberHeader) {
      darHeader.innerHTML = `${classificacao.icone1} ${classificacao.tipo1}`;
      receberHeader.innerHTML = `${classificacao.icone2} ${classificacao.tipo2}`;
      
      // Aplicar cores
      darHeader.style.background = `linear-gradient(135deg, ${classificacao.cor1} 0%, ${classificacao.cor1}dd 100%)`;
      receberHeader.style.background = `linear-gradient(135deg, ${classificacao.cor2} 0%, ${classificacao.cor2}dd 100%)`;
    }
  }
}

// Função para mostrar pergunta
function mostrarPergunta() {
  if (indice < 0 || indice >= listaPerguntas.length) return;
  
  const atual = listaPerguntas[indice];
  document.getElementById('categoriaAtual').textContent = `📋 ${atual.categoria}`;
  document.getElementById('perguntaAtual').textContent = atual.texto;

  // Limpar seleções anteriores
  respostaDarAtual = null;
  respostaReceberAtual = null;
  
  // Restaurar respostas se existirem
  if (respostasUsuario[indice]) {
    respostaDarAtual = respostasUsuario[indice].dar;
    respostaReceberAtual = respostasUsuario[indice].receber;
  }

  // Atualizar cabeçalhos com as classificações corretas
  atualizarCabecalhosQuestionario();
  
  criarRespostas();
  atualizarProgresso();
  verificarBotaoProximo();
}

// Função para criar respostas
function criarRespostas() {
  const container = document.getElementById('questionResponses');
  container.innerHTML = '';
  
  const respostas = dataManager.respostas;
  
  respostas.forEach(resposta => {
    const responseRow = document.createElement('div');
    responseRow.className = 'response-row';
    responseRow.setAttribute('data-resposta', resposta);
    
    // Switch DAR
    const darSwitch = document.createElement('div');
    darSwitch.className = 'response-switch';
    darSwitch.innerHTML = `
      <label class="switch">
        <input type="checkbox" id="dar-${resposta.replace(/\s+/g, '-').toLowerCase()}-${indice}">
        <span class="slider"></span>
      </label>
    `;
    
    // Texto da resposta
    const responseText = document.createElement('div');
    responseText.className = 'response-text';
    responseText.textContent = resposta;
    
    // Switch RECEBER
    const receberSwitch = document.createElement('div');
    receberSwitch.className = 'response-switch';
    receberSwitch.innerHTML = `
      <label class="switch">
        <input type="checkbox" id="receber-${resposta.replace(/\s+/g, '-').toLowerCase()}-${indice}">
        <span class="slider"></span>
      </label>
    `;
    
    // Event listeners
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
    
    // Marcar como selecionado se for a resposta atual
    if (respostaDarAtual === resposta) {
      darInput.checked = true;
    }
    if (respostaReceberAtual === resposta) {
      receberInput.checked = true;
    }
    
    // Montar a linha
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

// Função mostrarResultado
function mostrarResultado() {
  document.getElementById('questionario').classList.add('hidden');
  document.getElementById('resultados').classList.remove('hidden');

  const resumo = document.getElementById('resumo');
  resumo.innerHTML = '';
  
  const agrupado = {};

  // Filtrar respostas N/A
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

  // Adicionar resumo do perfil selecionado
  adicionarResumoPerfilSelecionado(resumo);

  // Adicionar estatísticas gerais
  adicionarEstatisticasGerais(resumo, respostasFiltradas);

  // Adicionar botão de compartilhamento
  adicionarBotaoCompartilhar(resumo);

  for (const categoria in agrupado) {
    const secao = document.createElement('div');
    secao.className = 'resultado-categoria';
    secao.innerHTML = `<h3>📋 ${categoria}</h3>`;
    
    // Obter os rótulos corretos para esta categoria usando dataManager
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
    <p>Gere um link único para compartilhar seus resultados com outras pessoas</p>
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

// Funções de compartilhamento (implementação básica)
function copiarLinkCompartilhamento() {
  try {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copiado para a área de transferência!');
    }).catch(() => {
      alert('Erro ao copiar link');
    });
  } catch (error) {
    console.error('Erro ao compartilhar:', error);
    alert('Erro ao gerar link de compartilhamento');
  }
}

// Função para verificar resultado compartilhado (implementação básica)
function verificarResultadoCompartilhado() {
  // Implementação futura para links compartilhados
  console.log('Verificando resultado compartilhado...');
}
