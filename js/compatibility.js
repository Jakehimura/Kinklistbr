// ===============================
// SISTEMA DE COMPARAÇÃO DE PERFIS
// ===============================

class CompatibilitySystem {
  constructor() {
    this.STORAGE_KEY = 'kinklistbr_comparisons';
    this.currentComparison = null;
    this.modalOpen = false;
  }

  // Abrir modal de comparação
  openComparisonModal() {
    if (this.modalOpen) return;
    
    this.modalOpen = true;
    this.createModal();
  }

  // Criar modal com apenas opção de link
  createModal() {
    const modal = document.createElement('div');
    modal.id = 'comparison-modal';
    modal.className = 'comparison-modal';
    
    modal.innerHTML = `
      <div class="modal-overlay" onclick="compatibilitySystem.closeModal()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>🔗 Comparar com Outro Perfil</h2>
          <button class="modal-close" onclick="compatibilitySystem.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="single-tab-content">
            <h3>📋 Cole o link do outro perfil:</h3>
            <input type="text" id="link-input" placeholder="https://app.com/#r=abc123 ou https://app.com/#share=..." class="modal-input">
            <p class="tab-description">
              💡 Peça para a pessoa enviar o link gerado nos resultados dela
            </p>
            <button class="modal-btn" onclick="compatibilitySystem.loadFromLink()">
              🔍 Carregar e Comparar Perfil
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-btn-secondary" onclick="compatibilitySystem.closeModal()">
            Cancelar
          </button>
        </div>
      </div>
    `;

    // Adicionar estilos
    this.addModalStyles();
    
    // Adicionar ao DOM
    document.body.appendChild(modal);
    
    // Focar no input
    setTimeout(() => {
      document.getElementById('link-input').focus();
    }, 100);
  }

  // Adicionar estilos do modal
  addModalStyles() {
    if (document.getElementById('comparison-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'comparison-modal-styles';
    styles.textContent = `
      .comparison-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
      }

      .modal-content {
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        animation: modalAppear 0.3s ease-out;
      }

      .dark .modal-content {
        background: #2c3e50;
        color: #ecf0f1;
      }

      @keyframes modalAppear {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 2rem 2rem 1rem 2rem;
        border-bottom: 2px solid #ecf0f1;
      }

      .dark .modal-header {
        border-bottom-color: #34495e;
      }

      .modal-header h2 {
        margin: 0;
        color: #2c3e50;
        font-size: 1.5rem;
      }

      .dark .modal-header h2 {
        color: #ecf0f1;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #7f8c8d;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.3s ease;
      }

      .modal-close:hover {
        background: #ecf0f1;
        color: #2c3e50;
      }

      .dark .modal-close:hover {
        background: #34495e;
        color: #ecf0f1;
      }

      .modal-tabs {
        display: flex;
        background: #f8f9fa;
        margin: 0;
      }

      .dark .modal-tabs {
        background: #34495e;
      }

      .tab-btn {
        flex: 1;
        padding: 1rem;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 600;
        color: #7f8c8d;
        transition: all 0.3s ease;
        border-bottom: 3px solid transparent;
      }

      .tab-btn:hover {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
      }

      .tab-btn.active {
        color: #667eea;
        background: white;
        border-bottom-color: #667eea;
      }

      .dark .tab-btn.active {
        color: #3498db;
        background: #2c3e50;
        border-bottom-color: #3498db;
      }

      .modal-body {
        padding: 2rem;
      }

      .tab-content {
        display: none;
      }

      .tab-content.active {
        display: block;
        animation: fadeIn 0.3s ease-in;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .tab-content h3 {
        margin: 0 0 1rem 0;
        color: #2c3e50;
        font-size: 1.2rem;
      }

      .dark .tab-content h3 {
        color: #ecf0f1;
      }

      .modal-input {
        width: 100%;
        padding: 1rem;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        font-size: 1rem;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
      }

      .modal-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .dark .modal-input {
        background: #34495e;
        border-color: #7f8c8d;
        color: #ecf0f1;
      }

      .modal-file {
        width: 100%;
        padding: 1rem;
        border: 2px dashed #e0e0e0;
        border-radius: 10px;
        background: #f8f9fa;
        margin-bottom: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .modal-file:hover {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.05);
      }

      .dark .modal-file {
        background: #34495e;
        border-color: #7f8c8d;
        color: #ecf0f1;
      }

      .tab-description {
        color: #7f8c8d;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #667eea;
      }

      .dark .tab-description {
        background: #34495e;
        border-left-color: #3498db;
      }

      .modal-btn {
        width: 100%;
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }

      .modal-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      }

      .dark .modal-btn {
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      }

      .modal-footer {
        padding: 1rem 2rem 2rem 2rem;
        display: flex;
        justify-content: center;
      }

      .modal-btn-secondary {
        padding: 0.8rem 1.5rem;
        background: #95a5a6;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .modal-btn-secondary:hover {
        background: #7f8c8d;
        transform: translateY(-1px);
      }

      /* Loading states */
      .modal-btn.loading {
        position: relative;
        color: transparent;
      }

      .modal-btn.loading::after {
        content: '⏳';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }

      /* Responsivo */
      @media (max-width: 768px) {
        .modal-content {
          max-width: 95%;
          margin: 1rem;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-header {
          padding: 1.5rem 1.5rem 1rem 1.5rem;
        }

        .tab-btn {
          padding: 0.8rem 0.5rem;
          font-size: 0.9rem;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  // Configurar sistema de tabs
  setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // Remover classe active de todos
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Adicionar active no clicado
        btn.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
      });
    });
  }

  // Carregar perfil via link
  async loadFromLink() {
    const input = document.getElementById('link-input');
    const btn = input.nextElementSibling.nextElementSibling; // Pegar o botão
    
    try {
      const link = input.value.trim();
      if (!link) {
        this.showError('Por favor, cole um link válido');
        return;
      }

      btn.classList.add('loading');
      btn.disabled = true;

      // Extrair dados do link
      const profile = await this.extractProfileFromLink(link);
      
      if (!profile) {
        throw new Error('Link inválido ou perfil não encontrado');
      }

      // Realizar comparação
      await this.performComparison(profile);
      
    } catch (error) {
      console.error('Erro ao carregar link:', error);
      this.showError(error.message);
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  // Carregar perfil via arquivo
  async loadFromFile() {
    const input = document.getElementById('file-input');
    const btn = input.nextElementSibling.nextElementSibling;
    
    try {
      const file = input.files[0];
      if (!file) {
        this.showError('Por favor, selecione um arquivo');
        return;
      }

      btn.classList.add('loading');
      btn.disabled = true;

      // Ler arquivo
      const text = await this.readFile(file);
      const profile = JSON.parse(text);

      // Validar estrutura
      if (!this.validateProfile(profile)) {
        throw new Error('Arquivo de perfil inválido');
      }

      // Realizar comparação
      await this.performComparison(profile);
      
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
      this.showError('Arquivo inválido ou corrompido');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  // Carregar perfil via código
  async loadFromCode() {
    const input = document.getElementById('code-input');
    const btn = input.nextElementSibling.nextElementSibling;
    
    try {
      const code = input.value.trim().toUpperCase();
      if (!code || code.length !== 6) {
        this.showError('Código deve ter exatamente 6 caracteres');
        return;
      }

      btn.classList.add('loading');
      btn.disabled = true;

      // Simular busca por código (implementar com backend real)
      const profile = await this.findProfileByCode(code);
      
      if (!profile) {
        throw new Error('Código não encontrado');
      }

      // Realizar comparação
      await this.performComparison(profile);
      
    } catch (error) {
      console.error('Erro ao carregar código:', error);
      this.showError(error.message);
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  // Extrair perfil do link
  async extractProfileFromLink(link) {
    try {
      // Extrair hash do link
      const url = new URL(link);
      const hash = url.hash;

      if (hash.startsWith('#r=')) {
        // Link Firebase
        const resultId = hash.substring(3);
        await firebaseShare.initialize();
        const resultado = await firebaseShare.carregarResultado(resultId);
        return resultado.success ? resultado.dados : null;
        
      } else if (hash.startsWith('#share=')) {
        // Link fallback
        const base64Data = hash.substring(7);
        const resultado = firebaseShare.carregarFallback(base64Data);
        return resultado.success ? resultado.dados : null;
      }
      
      throw new Error('Formato de link não reconhecido');
      
    } catch (error) {
      console.error('Erro ao extrair perfil:', error);
      return null;
    }
  }

  // Ler arquivo
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }

  // Validar estrutura do perfil
  validateProfile(profile) {
    return profile && 
           profile.respostas && 
           Array.isArray(profile.respostas) && 
           profile.perfil &&
           profile.respostas.length > 0;
  }

  // Buscar perfil por código (placeholder)
  async findProfileByCode(code) {
    // TODO: Implementar busca real no backend
    // Por enquanto, retorna null (código não encontrado)
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
    return null;
  }

  // Realizar comparação
  async performComparison(profile2) {
    try {
      // Perfil atual do usuário
      const profile1 = {
        respostas: respostasUsuario,
        perfil: {
          posicao: document.getElementById('posicao')?.value || 'N/A',
          dor: document.getElementById('dor')?.value || 'N/A',
          teorica: document.getElementById('teorica')?.value || 'N/A',
          pratica: document.getElementById('pratica')?.value || 'N/A'
        },
        relacionamentos: Array.from(
          document.querySelectorAll('.section:nth-child(3) .toggle.active')
        ).map(btn => btn.textContent.trim()),
        locais: Array.from(
          document.querySelectorAll('.section:nth-child(4) .toggle.active')
        ).map(btn => btn.textContent.trim())
      };

      // Usar o CompatibilityAnalyzer existente
      const analysis = compatibilityAnalyzer.analyzeCompatibility(profile1, profile2);
      
      // Salvar comparação
      this.currentComparison = {
        profile1,
        profile2,
        analysis,
        timestamp: new Date().toISOString()
      };

      // Fechar modal e mostrar resultados
      this.closeModal();
      this.showComparisonResults();
      
    } catch (error) {
      console.error('Erro na comparação:', error);
      this.showError('Erro ao processar comparação');
    }
  }

  // Mostrar resultados da comparação
  showComparisonResults() {
    // Ocultar resultados normais
    document.getElementById('resultados').classList.add('hidden');
    
    // Criar e mostrar resultados da comparação
    this.createComparisonResultsUI();
  }

  // Criar interface dos resultados
  createComparisonResultsUI() {
    // Remover container anterior se existir
    const existing = document.getElementById('comparison-results');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'comparison-results';
    container.className = 'section';
    
    container.innerHTML = this.generateComparisonHTML();
    
    // Adicionar após a seção de resultados
    const resultados = document.getElementById('resultados');
    resultados.parentNode.insertBefore(container, resultados.nextSibling);
    
    // Adicionar estilos específicos
    this.addComparisonStyles();
    
    // Scroll para os resultados
    container.scrollIntoView({ behavior: 'smooth' });
  }

  // Gerar HTML dos resultados
  generateComparisonHTML() {
    const { profile1, profile2, analysis } = this.currentComparison;
    
    return `
      <div class="comparison-header">
        <h2>🎯 Análise de Compatibilidade</h2>
        <div class="comparison-actions">
          <button class="btn-action" onclick="compatibilitySystem.exportComparison()">
            📄 Exportar Comparação
          </button>
          <button class="btn-action" onclick="compatibilitySystem.saveComparison()">
            💾 Salvar Comparação
          </button>
          <button class="btn-action" onclick="compatibilitySystem.closeComparison()">
            🏠 Voltar aos Resultados
          </button>
        </div>
      </div>

      ${this.generateScoreHeader()}
      ${this.generateQuickSummary()}
      ${this.generateCategoryRadar()}
      ${this.generateDetailedAnalysis()}
      ${this.generateRecommendations()}
    `;
  }

  // Gerar cabeçalho com score
  generateScoreHeader() {
    const { profile1, profile2, analysis } = this.currentComparison;
    
    return `
      <div class="score-header">
        <div class="profiles-comparison">
          <div class="profile-card">
            <h3>👤 Você</h3>
            <div class="profile-info">
              <span class="profile-position">${profile1.perfil.posicao}</span>
              <span class="profile-experience">Exp: ${profile1.perfil.pratica}</span>
            </div>
          </div>
          
          <div class="vs-indicator">
            <span>VS</span>
          </div>
          
          <div class="profile-card">
            <h3>👤 Parceiro(a)</h3>
            <div class="profile-info">
              <span class="profile-position">${profile2.perfil.posicao}</span>
              <span class="profile-experience">Exp: ${profile2.perfil.pratica}</span>
            </div>
          </div>
        </div>
        
        <div class="compatibility-score">
          <div class="score-circle">
            <div class="score-number">${analysis.overallScore}%</div>
            <div class="score-label">COMPATIBILIDADE</div>
          </div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${analysis.overallScore}%"></div>
          </div>
          <div class="score-description">${this.getCompatibilityDescription(analysis.overallScore)}</div>
        </div>
      </div>
    `;
  }

  // Gerar resumo rápido
  generateQuickSummary() {
    const { analysis } = this.currentComparison;
    
    const totalMatches = Object.values(analysis.categoryScores)
      .reduce((sum, cat) => sum + cat.matches.perfect.length + cat.matches.good.length, 0);
    
    const totalConflicts = Object.values(analysis.categoryScores)
      .reduce((sum, cat) => sum + cat.matches.conflicts.length, 0);
      
    const totalPotential = Object.values(analysis.categoryScores)
      .reduce((sum, cat) => sum + cat.matches.potential.length, 0);

    return `
      <div class="quick-summary">
        <h3>✨ Resumo Rápido</h3>
        <div class="summary-grid">
          <div class="summary-card good">
            <div class="summary-number">${totalMatches}</div>
            <div class="summary-label">Práticas Compatíveis</div>
            <div class="summary-icon">🎉</div>
          </div>
          <div class="summary-card warning">
            <div class="summary-number">${totalConflicts}</div>
            <div class="summary-label">Possíveis Conflitos</div>
            <div class="summary-icon">⚠️</div>
          </div>
          <div class="summary-card potential">
            <div class="summary-number">${totalPotential}</div>
            <div class="summary-label">Áreas para Explorar</div>
            <div class="summary-icon">🔍</div>
          </div>
          <div class="summary-card recommendation">
            <div class="summary-number">${analysis.recommendations.length}</div>
            <div class="summary-label">Recomendações</div>
            <div class="summary-icon">💬</div>
          </div>
        </div>
      </div>
    `;
  }

  // Gerar gráfico radar (placeholder)
  generateCategoryRadar() {
    return `
      <div class="category-radar">
        <h3>📈 Compatibilidade por Categoria</h3>
        <div class="radar-placeholder">
          <p>🚧 Gráfico radar será implementado em breve</p>
          <div class="category-scores">
            ${Object.entries(this.currentComparison.analysis.categoryScores)
              .map(([category, data]) => `
                <div class="category-score-item">
                  <span class="category-name">${category}</span>
                  <div class="category-bar">
                    <div class="category-fill" style="width: ${data.score}%"></div>
                  </div>
                  <span class="category-percentage">${data.score}%</span>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Gerar análise detalhada
  generateDetailedAnalysis() {
    const { analysis } = this.currentComparison;
    
    return `
      <div class="detailed-analysis">
        <h3>🎯 Análise Detalhada por Categoria</h3>
        ${Object.entries(analysis.categoryScores).map(([category, data]) => `
          <div class="category-analysis">
            <h4 class="category-title">
              ${this.getCategoryIcon(category)} ${category} 
              <span class="category-score-badge ${this.getScoreClass(data.score)}">${data.score}%</span>
            </h4>
            
            ${data.matches.perfect.length > 0 ? `
              <div class="matches-section perfect">
                <h5>💚 MATCHES PERFEITOS (${data.matches.perfect.length})</h5>
                <div class="matches-list">
                  ${data.matches.perfect.slice(0, 3).map(match => `
                    <div class="match-item">
                      <span class="match-practice">${match.practice}</span>
                      <span class="match-reason">${match.reason}</span>
                    </div>
                  `).join('')}
                  ${data.matches.perfect.length > 3 ? `<div class="more-items">+${data.matches.perfect.length - 3} mais...</div>` : ''}
                </div>
              </div>
            ` : ''}
            
            ${data.matches.conflicts.length > 0 ? `
              <div class="matches-section conflicts">
                <h5>🚨 POSSÍVEIS CONFLITOS (${data.matches.conflicts.length})</h5>
                <div class="matches-list">
                  ${data.matches.conflicts.slice(0, 3).map(match => `
                    <div class="match-item">
                      <span class="match-practice">${match.practice}</span>
                      <span class="match-reason">${match.reason}</span>
                    </div>
                  `).join('')}
                  ${data.matches.conflicts.length > 3 ? `<div class="more-items">+${data.matches.conflicts.length - 3} mais...</div>` : ''}
                </div>
              </div>
            ` : ''}
            
            ${data.matches.potential.length > 0 ? `
              <div class="matches-section potential">
                <h5>🔍 ÁREAS PROMISSORAS (${data.matches.potential.length})</h5>
                <div class="matches-list">
                  ${data.matches.potential.slice(0, 3).map(match => `
                    <div class="match-item">
                      <span class="match-practice">${match.practice}</span>
                      <span class="match-reason">${match.reason}</span>
                    </div>
                  `).join('')}
                  ${data.matches.potential.length > 3 ? `<div class="more-items">+${data.matches.potential.length - 3} mais...</div>` : ''}
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Gerar recomendações
  generateRecommendations() {
    const { analysis } = this.currentComparison;
    
    return `
      <div class="recommendations">
        <h3>🎯 Recomendações Personalizadas</h3>
        <div class="recommendations-list">
          ${analysis.recommendations.map(rec => `
            <div class="recommendation-item ${rec.type}">
              <div class="recommendation-icon">${this.getRecommendationIcon(rec.type)}</div>
              <div class="recommendation-content">
                <h4>${rec.title}</h4>
                <p>${rec.message}</p>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="next-steps">
          <h4>💬 PRÓXIMOS PASSOS SUGERIDOS:</h4>
          <ol class="steps-list">
            <li>🗣️ Conversem sobre os possíveis conflitos identificados</li>
            <li>🔍 Explorem gradualmente as áreas de potencial</li>
            <li>🎉 Divirtam-se com as práticas compatíveis</li>
            <li>📚 Leiam sobre comunicação em BDSM</li>
            <li>🔄 Refaçam o teste em 6 meses para ver evolução</li>
          </ol>
        </div>
      </div>
    `;
  }

  // Adicionar estilos da comparação
  addComparisonStyles() {
    if (document.getElementById('comparison-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'comparison-styles';
    styles.textContent = `
      .comparison-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .comparison-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .score-header {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        padding: 2rem;
        border-radius: 20px;
        margin-bottom: 2rem;
        text-align: center;
      }

      .dark .score-header {
        background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
      }

      .profiles-comparison {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 2rem;
        align-items: center;
        margin-bottom: 2rem;
      }

      .profile-card {
        background: white;
        padding: 1.5rem;
        border-radius: 15px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        text-align: center;
      }

      .dark .profile-card {
        background: #2c3e50;
      }

      .profile-card h3 {
        margin: 0 0 1rem 0;
        color: #2c3e50;
        font-size: 1.3rem;
      }

      .dark .profile-card h3 {
        color: #ecf0f1;
      }

      .profile-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .profile-position {
        font-weight: 700;
        color: #667eea;
        font-size: 1.1rem;
      }

      .dark .profile-position {
        color: #3498db;
      }

      .profile-experience {
        color: #7f8c8d;
        font-size: 0.9rem;
      }

      .vs-indicator {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 50%;
        font-weight: 700;
        font-size: 1.2rem;
        min-width: 60px;
        min-height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dark .vs-indicator {
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      }

      .compatibility-score {
        max-width: 400px;
        margin: 0 auto;
      }

      .score-circle {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 50%;
        width: 150px;
        height: 150px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem auto;
        box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
      }

      .dark .score-circle {
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      }

      .score-number {
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1;
      }

      .score-label {
        font-size: 0.8rem;
        font-weight: 600;
        opacity: 0.9;
      }

      .score-bar {
        background: #e0e0e0;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .score-fill {
        background: linear-gradient(90deg, #e74c3c 0%, #f39c12 50%, #27ae60 100%);
        height: 100%;
        border-radius: 4px;
        transition: width 0.8s ease;
      }

      .score-description {
        font-size: 1.1rem;
        font-weight: 600;
        color: #2c3e50;
      }

      .dark .score-description {
        color: #ecf0f1;
      }

      .quick-summary {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .dark .quick-summary {
        background: #2c3e50;
      }

      .quick-summary h3 {
        margin: 0 0 1.5rem 0;
        color: #2c3e50;
        text-align: center;
      }

      .dark .quick-summary h3 {
        color: #ecf0f1;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .summary-card {
        padding: 1.5rem;
        border-radius: 12px;
        text-align: center;
        position: relative;
        color: white;
        overflow: hidden;
      }

      .summary-card.good {
        background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
      }

      .summary-card.warning {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      }

      .summary-card.potential {
        background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
      }

      .summary-card.recommendation {
        background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
      }

      .summary-number {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .summary-label {
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .summary-icon {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 1.5rem;
        opacity: 0.7;
      }

      .category-radar {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .dark .category-radar {
        background: #2c3e50;
      }

      .category-radar h3 {
        margin: 0 0 1.5rem 0;
        color: #2c3e50;
        text-align: center;
      }

      .dark .category-radar h3 {
        color: #ecf0f1;
      }

      .radar-placeholder {
        text-align: center;
        padding: 2rem;
        background: #f8f9fa;
        border-radius: 10px;
        border: 2px dashed #e0e0e0;
      }

      .dark .radar-placeholder {
        background: #34495e;
        border-color: #7f8c8d;
      }

      .category-scores {
        margin-top: 2rem;
      }

      .category-score-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 0.8rem;
        background: white;
        border-radius: 8px;
      }

      .dark .category-score-item {
        background: #2c3e50;
      }

      .category-name {
        min-width: 150px;
        font-weight: 600;
        color: #2c3e50;
      }

      .dark .category-name {
        color: #ecf0f1;
      }

      .category-bar {
        flex: 1;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
      }

      .category-fill {
        height: 100%;
        background: linear-gradient(90deg, #e74c3c 0%, #f39c12 50%, #27ae60 100%);
        border-radius: 4px;
        transition: width 0.8s ease;
      }

      .category-percentage {
        min-width: 40px;
        text-align: right;
        font-weight: 600;
        color: #667eea;
      }

      .dark .category-percentage {
        color: #3498db;
      }

      .detailed-analysis {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .dark .detailed-analysis {
        background: #2c3e50;
      }

      .detailed-analysis h3 {
        margin: 0 0 2rem 0;
        color: #2c3e50;
        text-align: center;
      }

      .dark .detailed-analysis h3 {
        color: #ecf0f1;
      }

      .category-analysis {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 12px;
        border-left: 4px solid #667eea;
      }

      .dark .category-analysis {
        background: #34495e;
        border-left-color: #3498db;
      }

      .category-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0 0 1rem 0;
        color: #2c3e50;
        font-size: 1.3rem;
      }

      .dark .category-title {
        color: #ecf0f1;
      }

      .category-score-badge {
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 700;
        color: white;
      }

      .category-score-badge.high {
        background: #27ae60;
      }

      .category-score-badge.medium {
        background: #f39c12;
      }

      .category-score-badge.low {
        background: #e74c3c;
      }

      .matches-section {
        margin: 1rem 0;
        padding: 1rem;
        border-radius: 8px;
      }

      .matches-section.perfect {
        background: rgba(39, 174, 96, 0.1);
        border-left: 4px solid #27ae60;
      }

      .matches-section.conflicts {
        background: rgba(231, 76, 60, 0.1);
        border-left: 4px solid #e74c3c;
      }

      .matches-section.potential {
        background: rgba(243, 156, 18, 0.1);
        border-left: 4px solid #f39c12;
      }

      .matches-section h5 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 700;
      }

      .matches-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .match-item {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding: 0.8rem;
        background: white;
        border-radius: 6px;
      }

      .dark .match-item {
        background: rgba(44, 62, 80, 0.5);
      }

      .match-practice {
        font-weight: 600;
        color: #2c3e50;
      }

      .dark .match-practice {
        color: #ecf0f1;
      }

      .match-reason {
        font-size: 0.9rem;
        color: #7f8c8d;
      }

      .more-items {
        text-align: center;
        padding: 0.5rem;
        color: #7f8c8d;
        font-style: italic;
        font-size: 0.9rem;
      }

      .recommendations {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .dark .recommendations {
        background: #2c3e50;
      }

      .recommendations h3 {
        margin: 0 0 1.5rem 0;
        color: #2c3e50;
        text-align: center;
      }

      .dark .recommendations h3 {
        color: #ecf0f1;
      }

      .recommendations-list {
        margin-bottom: 2rem;
      }

      .recommendation-item {
        display: flex;
        gap: 1rem;
        padding: 1.5rem;
        margin-bottom: 1rem;
        border-radius: 12px;
        align-items: flex-start;
      }

      .recommendation-item.success {
        background: rgba(39, 174, 96, 0.1);
        border-left: 4px solid #27ae60;
      }

      .recommendation-item.good {
        background: rgba(52, 152, 219, 0.1);
        border-left: 4px solid #3498db;
      }

      .recommendation-item.moderate {
        background: rgba(243, 156, 18, 0.1);
        border-left: 4px solid #f39c12;
      }

      .recommendation-item.low {
        background: rgba(231, 76, 60, 0.1);
        border-left: 4px solid #e74c3c;
      }

      .recommendation-item.warning {
        background: rgba(231, 76, 60, 0.1);
        border-left: 4px solid #e74c3c;
      }

      .recommendation-icon {
        font-size: 1.5rem;
        min-width: 40px;
      }

      .recommendation-content h4 {
        margin: 0 0 0.5rem 0;
        color: #2c3e50;
        font-size: 1.1rem;
      }

      .dark .recommendation-content h4 {
        color: #ecf0f1;
      }

      .recommendation-content p {
        margin: 0;
        color: #7f8c8d;
        line-height: 1.5;
      }

      .next-steps {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 12px;
        border-left: 4px solid #667eea;
      }

      .dark .next-steps {
        background: #34495e;
        border-left-color: #3498db;
      }

      .next-steps h4 {
        margin: 0 0 1rem 0;
        color: #2c3e50;
      }

      .dark .next-steps h4 {
        color: #ecf0f1;
      }

      .steps-list {
        margin: 0;
        padding-left: 1.5rem;
      }

      .steps-list li {
        margin-bottom: 0.8rem;
        color: #2c3e50;
        line-height: 1.5;
      }

      .dark .steps-list li {
        color: #ecf0f1;
      }

      /* Responsivo */
      @media (max-width: 768px) {
        .profiles-comparison {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .vs-indicator {
          order: 2;
          margin: 1rem auto;
        }

        .comparison-header {
          flex-direction: column;
          align-items: stretch;
        }

        .comparison-actions {
          justify-content: center;
        }

        .summary-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .category-score-item {
          flex-direction: column;
          text-align: center;
          gap: 0.5rem;
        }

        .category-name {
          min-width: auto;
        }

        .category-title {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .recommendation-item {
          flex-direction: column;
          text-align: center;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  // Métodos auxiliares
  getCompatibilityDescription(score) {
    if (score >= 80) return 'Muito Alta Compatibilidade! 🎉';
    if (score >= 60) return 'Boa Compatibilidade 👍';
    if (score >= 40) return 'Compatibilidade Moderada ⚖️';
    if (score >= 20) return 'Baixa Compatibilidade ⚠️';
    return 'Muito Baixa Compatibilidade 😔';
  }

  getCategoryIcon(category) {
    const icons = {
      'Atos sexuais': '💕',
      'Bondage': '⛓️',
      'Shibari/Rope Play': '🪢',
      'Sadismo e Masoquismo': '⚡',
      'Dominação e Submissão': '👑',
      'Humilhação e Degradação': '😈',
      'Role Play': '🎭',
      'Fetiches': '🌟',
      'Pessoas': '👥',
      'Vestimentas': '👗',
      'Equipamentos de Contenção': '🔒',
      'Equipamentos de Estimulação': '⚡',
      'Fluidos Corporais': '💧'
    };
    return icons[category] || '📋';
  }

  getScoreClass(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  getRecommendationIcon(type) {
    const icons = {
      'success': '🎉',
      'good': '👍',
      'moderate': '⚖️',
      'low': '⚠️',
      'warning': '⛔'
    };
    return icons[type] || '💡';
  }

  // Fechar modal
  closeModal() {
    const modal = document.getElementById('comparison-modal');
    if (modal) {
      modal.remove();
    }
    this.modalOpen = false;
  }

  // Fechar comparação
  closeComparison() {
    const comparisonResults = document.getElementById('comparison-results');
    if (comparisonResults) {
      comparisonResults.remove();
    }
    
    // Mostrar resultados normais
    document.getElementById('resultados').classList.remove('hidden');
  }

  // Exportar comparação
  async exportComparison() {
    try {
      if (!this.currentComparison) {
        throw new Error('Nenhuma comparação para exportar');
      }

      // Usar o sistema de export existente, mas com dados da comparação
      const mobile = isMobile();
      const tipoExport = mobile ? 'Imagem' : 'PDF';
      
      console.log(`📄 Exportando comparação como ${tipoExport}...`);
      
      // Preparar container específico para comparação
      const container = await this.prepareComparisonExport();
      
      if (mobile) {
        await gerarImagem(container);
      } else {
        await gerarPDF(container);
      }
      
      // Cleanup
      container.remove();
      
      console.log('✅ Comparação exportada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao exportar comparação:', error);
      alert(`Erro ao exportar: ${error.message}`);
    }
  }

  // Preparar layout de export da comparação
  async prepareComparisonExport() {
    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      padding: 40px;
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #2c3e50;
      line-height: 1.6;
    `;
    
    // Clonar conteúdo da comparação
    const comparisonContent = document.getElementById('comparison-results');
    if (comparisonContent) {
      const clone = comparisonContent.cloneNode(true);
      
      // Remover botões de ação
      const actions = clone.querySelector('.comparison-actions');
      if (actions) actions.remove();
      
      container.appendChild(clone);
    }
    
    document.body.appendChild(container);
    return container;
  }

  // Salvar comparação
  saveComparison() {
    try {
      if (!this.currentComparison) {
        throw new Error('Nenhuma comparação para salvar');
      }

      // Usar o CompatibilityAnalyzer para salvar
      const comparisonId = compatibilityAnalyzer.saveComparison(
        this.currentComparison.profile1,
        this.currentComparison.profile2,
        this.currentComparison.analysis
      );

      if (comparisonId) {
        alert('✅ Comparação salva com sucesso!');
        console.log('Comparação salva com ID:', comparisonId);
      } else {
        throw new Error('Erro ao salvar comparação');
      }

    } catch (error) {
      console.error('Erro ao salvar comparação:', error);
      alert(`Erro ao salvar: ${error.message}`);
    }
  }

  // Mostrar erro
  showError(message) {
    alert(`❌ ${message}`);
  }
}

// Instância global
const compatibilitySystem = new CompatibilitySystem();

// Função para abrir comparação (substitui o placeholder no main.js)
function abrirComparacao() {
  compatibilitySystem.openComparisonModal();
}
