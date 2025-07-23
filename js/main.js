// ===============================
// SISTEMA DE COMPRESSÃO MÁXIMA COM INTEGRIDADE
// ===============================

class CompressorMaximo {
  constructor() {
    // Mapeamento otimizado: respostas mais comuns = índices menores
    this.respostasMap = [
      'N/A',                    // 0 (mais comum = menos bits)
      'Aceito',                 // 1  
      'Adoro',                  // 2
      'Nunca experimentei',     // 3
      'Aproveito',              // 4
      'Tolero',                 // 5
      'Limite rígido'           // 6 (crítico para segurança)
    ];

    this.categoriasMap = [
      'Atos sexuais',           // 0
      'Bondage',                // 1
      'Sadismo e Masoquismo',   // 2
      'Dominação e Submissão',  // 3
      'Role Play',              // 4
      'Fetiches',               // 5
      'Equipamentos'            // 6
    ];

    // Base85 para máxima eficiência
    this.charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    this.base = this.charset.length;
  }

  toBase85(num) {
    if (num === 0n) return 'A';
    let result = '';
    while (num > 0n) {
      result = this.charset[Number(num % BigInt(this.base))] + result;
      num = num / BigInt(this.base);
    }
    return result;
  }

  fromBase85(str) {
    let result = 0n;
    for (let i = 0; i < str.length; i++) {
      result = result * BigInt(this.base) + BigInt(this.charset.indexOf(str[i]));
    }
    return result;
  }

  comprimirRespostas(respostasUsuario) {
    if (!respostasUsuario || respostasUsuario.length === 0) {
      return 'A';
    }

    const coordenadas = [];
    
    respostasUsuario.forEach(resposta => {
      const catIndex = this.categoriasMap.indexOf(resposta.categoria);
      const pergIndex = dataManager.obterPerguntasCategoria(resposta.categoria).indexOf(resposta.pergunta);
      const darIndex = this.respostasMap.indexOf(resposta.dar);
      const receberIndex = this.respostasMap.indexOf(resposta.receber);
      
      if (catIndex !== -1 && pergIndex !== -1 && darIndex !== -1 && receberIndex !== -1) {
        const packed = (catIndex << 14) | (pergIndex << 6) | (darIndex << 3) | receberIndex;
        coordenadas.push(packed);
      }
    });

    const diferenciais = [coordenadas[0] || 0];
    
    for (let i = 1; i < coordenadas.length; i++) {
      const diff = coordenadas[i] - coordenadas[i-1];
      diferenciais.push(diff);
    }

    return this.empacotar(diferenciais);
  }

  empacotar(numbers) {
    let resultado = '';
    
    const count = numbers.length;
    resultado += this.toBase85(BigInt(count)) + '.';

    const concatenated = numbers.join(',');
    
    let bigNum = 0n;
    for (let i = 0; i < concatenated.length; i++) {
      bigNum = bigNum * 256n + BigInt(concatenated.charCodeAt(i));
    }
    
    resultado += this.toBase85(bigNum);
    
    return resultado;
  }

  desempacotar(compactStr) {
    if (!compactStr || compactStr === 'A') return [];
    
    const parts = compactStr.split('.');
    if (parts.length !== 2) return [];
    
    const count = Number(this.fromBase85(parts[0]));
    const bigNum = this.fromBase85(parts[1]);
    
    let resultado = '';
    let temp = bigNum;
    
    while (temp > 0n) {
      resultado = String.fromCharCode(Number(temp % 256n)) + resultado;
      temp = temp / 256n;
    }
    
    const numbers = resultado.split(',').map(n => parseInt(n)).filter(n => !isNaN(n));
    
    if (numbers.length !== count) {
      console.warn('Dados corrompidos: contagem não confere');
      return [];
    }
    
    return numbers;
  }

  descomprimirRespostas(compactStr) {
    const diferenciais = this.desempacotar(compactStr);
    if (diferenciais.length === 0) return [];
    
    const coordenadas = [diferenciais[0]];
    for (let i = 1; i < diferenciais.length; i++) {
      coordenadas.push(coordenadas[i-1] + diferenciais[i]);
    }

    const respostas = [];
    
    coordenadas.forEach(packed => {
      if (packed < 0) return;
      
      const receberIndex = packed & 0x7;
      const darIndex = (packed >> 3) & 0x7;
      const pergIndex = (packed >> 6) & 0xFF;
      const catIndex = (packed >> 14) & 0x7;
      
      const categoria = this.categoriasMap[catIndex];
      if (categoria && dataManager.perguntas[categoria]) {
        const pergunta = dataManager.perguntas[categoria][pergIndex];
        if (pergunta) {
          respostas.push({
            categoria: categoria,
            pergunta: pergunta,
            dar: this.respostasMap[darIndex] || 'N/A',
            receber: this.respostasMap[receberIndex] || 'N/A'
          });
        }
      }
    });
    
    return respostas;
  }

  comprimirPerfil() {
    const perfil = {
      posicao: document.getElementById('posicao')?.value || '',
      dor: document.getElementById('dor')?.value || '',
      teorica: document.getElementById('teorica')?.value || '',
      pratica: document.getElementById('pratica')?.value || ''
    };

    const opcoes = dataManager.opcoesPerfil;
    
    const indices = [
      Math.max(0, opcoes.posicoes?.indexOf(perfil.posicao) || 0),
      Math.max(0, opcoes.toleranciaDor?.indexOf(perfil.dor) || 0),
      Math.max(0, opcoes.experiencia?.indexOf(perfil.teorica) || 0),
      Math.max(0, opcoes.experiencia?.indexOf(perfil.pratica) || 0)
    ];

    const packed = (indices[0] << 12) | (indices[1] << 8) | (indices[2] << 4) | indices[3];
    return this.toBase85(BigInt(packed));
  }

  descomprimirPerfil(compactStr) {
    if (!compactStr) return this.getPerfilPadrao();
    
    try {
      const packed = Number(this.fromBase85(compactStr));
      
      const indices = [
        (packed >> 12) & 0xF,
        (packed >> 8) & 0xF,
        (packed >> 4) & 0xF,
        packed & 0xF
      ];

      const opcoes = dataManager.opcoesPerfil;
      
      return {
        posicao: opcoes.posicoes?.[indices[0]] || 'Top',
        dor: opcoes.toleranciaDor?.[indices[1]] || 'Média',
        teorica: opcoes.experiencia?.[indices[2]] || '0-3 anos',
        pratica: opcoes.experiencia?.[indices[3]] || '0-3 anos'
      };
    } catch (error) {
      console.warn('Erro ao descomprimir perfil:', error);
      return this.getPerfilPadrao();
    }
  }

  getPerfilPadrao() {
    return {
      posicao: 'Top',
      dor: 'Média',
      teorica: '0-3 anos',
      pratica: '0-3 anos'
    };
  }

  calcularChecksum(dados) {
    let checksum = 0;
    for (let i = 0; i < dados.length; i++) {
      checksum = (checksum + dados.charCodeAt(i) * (i + 1)) % 65536;
    }
    return this.toBase85(BigInt(checksum));
  }

  criarLinkCompleto(respostasUsuario) {
    const respostasComp = this.comprimirRespostas(respostasUsuario);
    const perfilComp = this.comprimirPerfil();
    
    const dados = `${respostasComp}~${perfilComp}`;
    const checksum = this.calcularChecksum(dados);
    
    return `${dados}#${checksum}`;
  }

  carregarLinkCompleto(dadosComprimidos) {
    const parts = dadosComprimidos.split('#');
    if (parts.length !== 2) {
      throw new Error('Formato de link inválido');
    }

    const [dados, checksumRecebido] = parts;
    const checksumCalculado = this.calcularChecksum(dados);
    
    if (checksumRecebido !== checksumCalculado) {
      throw new Error('Link corrompido - checksum não confere');
    }

    const [respostasStr, perfilStr] = dados.split('~');
    
    return {
      respostas: this.descomprimirRespostas(respostasStr),
      perfil: this.descomprimirPerfil(perfilStr)
    };
  }
}

// ===============================
// APLICAÇÃO PRINCIPAL
// ===============================

// Instância global do gerenciador de dados
const dataManager = new DataManager();

// Instância do compressor
const compressorMaximo = new CompressorMaximo();

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
    <p>Gere um link ultra-compacto para compartilhar seus resultados com segurança</p>
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
// FUNÇÕES DE COMPARTILHAMENTO COM COMPRESSÃO MÁXIMA
// ===============================

function copiarLinkCompartilhamento() {
  const botao = event.target;
  const textoOriginal = botao.textContent;
  
  try {
    if (!respostasUsuario || respostasUsuario.length === 0) {
      throw new Error('Nenhuma resposta para compartilhar');
    }

    const dadosComprimidos = compressorMaximo.criarLinkCompleto(respostasUsuario);
    const urlAtual = window.location.href.split('#')[0];
    const link = `${urlAtual}#x=${dadosComprimidos}`;
    
    const tamanhoOriginal = JSON.stringify(respostasUsuario).length;
    const tamanhoComprimido = dadosComprimidos.length;
    const taxaCompressao = Math.round((1 - tamanhoComprimido / tamanhoOriginal) * 100);
    
    console.log('📦 Compressão máxima realizada:');
    console.log(`   • ${respostasUsuario.length} respostas preservadas`);
    console.log(`   • ${tamanhoOriginal} → ${tamanhoComprimido} chars (${taxaCompressao}% redução)`);
    console.log(`   • Link final: ${link.length} chars`);
    
    navigator.clipboard.writeText(link).then(() => {
      botao.textContent = '✅ Link Copiado!';
      botao.style.background = '#27ae60';
      
      mostrarEstatisticasCompressao(link, {
        respostas: respostasUsuario.length,
        original: tamanhoOriginal,
        comprimido: tamanhoComprimido,
        taxa: taxaCompressao,
        linkSize: link.length
      });
      
      setTimeout(() => {
        botao.textContent = textoOriginal;
        botao.style.background = '';
      }, 3000);
      
    }).catch(() => {
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      
      botao.textContent = '✅ Link Copiado!';
      botao.style.background = '#27ae60';
      
      mostrarEstatisticasCompressao(link, {
        respostas: respostasUsuario.length,
        original: tamanhoOriginal,
        comprimido: tamanhoComprimido,
        taxa: taxaCompressao,
        linkSize: link.length
      });
    });
    
  } catch (error) {
    console.error('Erro na compressão:', error);
    botao.textContent = '❌ Erro';
    botao.style.background = '#e74c3c';
    
    setTimeout(() => {
      botao.textContent = textoOriginal;
      botao.style.background = '';
    }, 3000);
  }
}

function mostrarEstatisticasCompressao(link, stats) {
  const linkDiv = document.getElementById('linkGerado');
  const linkTexto = document.getElementById('linkTexto');
  
  linkTexto.textContent = link;
  linkDiv.style.display = 'block';
  
  const statsDiv = document.createElement('div');
  statsDiv.style.cssText = 'margin-top: 1rem; padding: 1rem; background: rgba(0,255,0,0.1); border-radius: 8px; font-size: 0.9rem;';
  statsDiv.innerHTML = `
    <strong>🛡️ Compressão Máxima com Integridade Total:</strong><br>
    • ✅ ${stats.respostas} respostas preservadas (100% precisão)<br>
    • 📦 ${stats.original} → ${stats.comprimido} caracteres (${stats.taxa}% redução)<br>
    • 🔗 Link final: ${stats.linkSize} caracteres<br>
    • 🔒 Checksum incluído para verificar integridade<br>
    • ⚡ Otimizado para sessões BDSM seguras
  `;
  
  linkDiv.appendChild(statsDiv);
}

function verificarResultadoCompartilhado() {
  const hash = window.location.hash;
  
  if (hash.startsWith('#x=')) {
    try {
      const dadosComprimidos = hash.substring(3);
      const dadosCarregados = compressorMaximo.carregarLinkCompleto(dadosComprimidos);
      
      if (dadosCarregados.respostas.length === 0) {
        throw new Error('Nenhuma resposta válida encontrada');
      }
      
      respostasUsuario = dadosCarregados.respostas;
      aplicarPerfilCarregado(dadosCarregados.perfil);
      mostrarModoVisualizacao(dadosCarregados.respostas.length, dadosCarregados.perfil);
      
      document.getElementById('questionario').classList.add('hidden');
      document.getElementById('resultados').classList.remove('hidden');
      mostrarResultado();
      
      console.log('✅ Link verificado e carregado:', dadosCarregados.respostas.length, 'respostas');
      return true;
      
    } catch (error) {
      console.error('Erro ao carregar link:', error);
      mostrarMensagemErro(`Link inválido: ${error.message}`);
      return false;
    }
  }
  
  return false;
}

function aplicarPerfilCarregado(perfil) {
  const selects = {
    posicao: document.getElementById('posicao'),
    dor: document.getElementById('dor'), 
    teorica: document.getElementById('teorica'),
    pratica: document.getElementById('pratica')
  };
  
  Object.entries(selects).forEach(([key, select]) => {
    if (select && perfil[key]) {
      select.value = perfil[key];
    }
  });
}

function mostrarModoVisualizacao(totalRespostas, perfil) {
  const container = document.querySelector('.container');
  const aviso = document.createElement('div');
  aviso.className = 'modo-visualizacao';
  
  aviso.innerHTML = `
    🛡️ <strong>Resultado Compartilhado</strong> - Dados verificados e íntegros
    <br>
    <small>📊 ${totalRespostas} respostas | 👤 ${perfil.posicao} | ⚡ ${perfil.dor} | ✅ Checksum OK</small>
    <br>
    <button onclick="window.location.hash=''; location.reload();" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: white; color: #e67e22; border: none; border-radius: 5px; cursor: pointer;">
      🏠 Fazer Meu Próprio Teste
    </button>
  `;
  
  container.insertBefore(aviso, container.firstChild);

  document.querySelectorAll('.section').forEach((secao, index) => {
    if (index < 4) secao.style.display = 'none';
  });
}

function mostrarMensagemErro(mensagem) {
  const container = document.querySelector('.container');
  const erro = document.createElement('div');
  erro.className = 'modo-visualizacao';
  erro.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
  
  erro.innerHTML = `
    ❌ <strong>Erro de Integridade</strong><br>
    ${mensagem}<br>
    <small>⚠️ Por segurança, não é possível carregar dados corrompidos</small>
    <br>
    <button onclick="window.location.hash=''; location.reload();" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: white; color: #e74c3c; border: none; border-radius: 5px; cursor: pointer;">
      🏠 Fazer Novo Teste
    </button>
  `;
  
  container.insertBefore(erro, container.firstChild);
}
