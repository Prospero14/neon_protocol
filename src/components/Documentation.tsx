import React, { useState } from 'react';
import { Book, ChevronRight, Code, Info, Lock, Zap, Clock, Server, ArrowLeft, Play, RotateCcw, Terminal } from 'lucide-react';
import { JAVA_REFERENCE } from '../logic/referenceData';
import { CARD_LIBRARY } from '../logic/combatCards';
import type { CombatCard } from '../logic/combatCards';
import { SPRING_CARD_LIBRARY } from '../logic/springCards';
import { SPRING_JAVA_REFERENCE } from '../logic/springReferenceData';

type DocPack = 'core' | 'spring' | 'infra' | 'soft-skills' | 'testing' | 'cookbook' | 'sandbox' | 'mechanics' | 'scripting';

interface DocumentationProps {
  discoveredCardIds: Set<string>;
  initialEntryId?: string | null;
  onBack: () => void;
}

const Documentation: React.FC<DocumentationProps> = ({ discoveredCardIds, initialEntryId, onBack }) => {
  const [pack, setPack] = useState<DocPack>('mechanics');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(initialEntryId || null);
  
  // Sandbox State
  const [sandboxCards, setSandboxCards] = useState<CombatCard[]>([]);
  const [sandboxResult, setSandboxResult] = useState<{ code: string; output: string; status: 'idle' | 'success' | 'error' }>({
    code: '',
    output: '',
    status: 'idle'
  });

  // Cookbook state
  const [cookbookTab, setCookbookTab] = useState<'core' | 'libs' | 'infra' | 'qa'>('core');

  React.useEffect(() => {
    if (initialEntryId) {
       setSelectedEntryId(initialEntryId);
       // Auto-detect pack
       const card = CARD_LIBRARY.find(c => c.id === initialEntryId) || SPRING_CARD_LIBRARY.find(c => c.id === initialEntryId);
       if (card) {
          if (card.type === 'INFRASTRUCTURE') setPack('infra');
          else if (card.type === 'SOFT') setPack('soft-skills');
          else if (card.type === 'SCRIPT') setPack('scripting');
          else if (card.type === 'REACTION' || card.type === 'DEFENSIVE') setPack('testing');
          else if (card.libs?.includes('spring')) setPack('spring');
          else setPack('core');
       }
    }
  }, [initialEntryId]);

  const cardLibrary = React.useMemo(() => {
      switch(pack) {
          case 'spring': return SPRING_CARD_LIBRARY;
          case 'infra': return CARD_LIBRARY.filter(c => c.type === 'INFRASTRUCTURE');
          case 'soft-skills': return CARD_LIBRARY.filter(c => c.type === 'SOFT');
          case 'scripting': return CARD_LIBRARY.filter(c => c.type === 'SCRIPT');
          case 'testing': return CARD_LIBRARY.filter(c => c.type === 'REACTION' || c.type === 'DEFENSIVE');
          case 'core': return CARD_LIBRARY.filter(c => c.type === 'SYNTAX' || c.type === 'FUNCTION');
          default: return CARD_LIBRARY;
      }
  }, [pack]);

  const refBook = pack === 'spring' ? SPRING_JAVA_REFERENCE : JAVA_REFERENCE;
  const selectedEntry = selectedEntryId ? refBook[selectedEntryId] : null;

  const runSandbox = () => {
    if (sandboxCards.length === 0) {
      setSandboxResult({ code: '// NO_MODELS_LOADED', output: '> ARCHITECTURE_EMPTY_EXCEPTION', status: 'error' });
      return;
    }

    const ids = sandboxCards.map(c => c.id);
    let code = '';
    let output = '> INITIALIZING_RUNTIME...\n';

    // Basic Logic Detection
    const hasPackage = ids.includes('syntax_package');
    const hasClass = ids.includes('syntax_class_decl');
    const hasMain = ids.includes('syntax_main_method');
    const hasPrint = ids.includes('fn_sysout_print');

    // Generate Code Preview
    if (hasPackage) code += 'package com.neon.app;\n\n';
    if (hasClass) code += 'public class NeuralAgent {\n';
    if (hasMain) code += '  public static void main(String[] args) {\n';
    
    sandboxCards.forEach(c => {
      if (c.id === 'fn_sysout_print') code += '    System.out.println("Hello World");\n';
      else if (c.id === 'syntax_if') code += '    if (integrity > 50) { ... }\n';
      else if (c.id === 'syntax_foreach') code += '    for (var item : data) { ... }\n';
    });

    if (hasMain) code += '  }\n';
    if (hasClass) code += '}\n';

    // Result Logic
    if (hasPackage && hasClass && hasMain && hasPrint) {
      output += '> COMPILATION_SUCCESS\n> RUNNING_NEON_VM...\nHello World\n> PROCESS_EXIT_0';
      setSandboxResult({ code, output, status: 'success' });
    } else if (hasPrint && !hasMain) {
       output += '> ERROR: UNREACHABLE_CODE\n> System.out.println cannot exist outside a method block.';
       setSandboxResult({ code, output, status: 'error' });
    } else if (ids.filter(id => id === 'syntax_class_decl').length > 1) {
       output += '> ERROR: DUPLICATE_CLASS_DEFINITION\n> Only one public class is allowed per module.';
       setSandboxResult({ code, output, status: 'error' });
    } else {
       output += '> PARTIAL_MODULE_COMPILED\n> Awaiting more logical protocols...';
       setSandboxResult({ code, output, status: 'success' });
    }
  };

  return (
    <div className="reference-v4-view">
      <header className="ref-header neon-panel">
        <div className="ref-brand">
          <Book size={20} color="var(--neon-cyan)" />
          <div>
            <h3>NEON_PROTOCOL_DOCS [V6.4]</h3>
            <div className="ref-pack-tabs mono-text">
              <button className={`ref-pack-tab ${pack === 'mechanics' ? 'active' : ''}`} onClick={() => setPack('mechanics')}>GAME_SYSTEMS</button>
              <button className={`ref-pack-tab core ${pack === 'core' ? 'active' : ''}`} onClick={() => setPack('core')}>JAVA_CORE</button>
              <button className={`ref-pack-tab scripting ${pack === 'scripting' ? 'active' : ''}`} onClick={() => setPack('scripting')}>SCRIPTS</button>
              <button className={`ref-pack-tab spring ${pack === 'spring' ? 'active' : ''}`} onClick={() => setPack('spring')}>SPRING_BOOT</button>
              <button className={`ref-pack-tab infra ${pack === 'infra' ? 'active' : ''}`} onClick={() => setPack('infra')}>INFRA</button>
              <button className={`ref-pack-tab soft ${pack === 'soft-skills' ? 'active' : ''}`} onClick={() => setPack('soft-skills')}>SOFT_SKILLS</button>
              <button className={`ref-pack-tab testing ${pack === 'testing' ? 'active' : ''}`} onClick={() => setPack('testing')}>TESTS & REACTIONS</button>
              <button className={`ref-pack-tab cookbook ${pack === 'cookbook' ? 'active' : ''}`} onClick={() => setPack('cookbook')}>DEV_COOKBOOK</button>
              <button className={`ref-pack-tab sandbox ${pack === 'sandbox' ? 'active' : ''}`} onClick={() => setPack('sandbox')}>SANDBOX</button>
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
      </header>

      {pack === 'mechanics' && (
        <div className="ref-guide-full neon-panel">
          <h2 className="ref-guide-title">Системные механики боя [Combat_Engine_v6]</h2>
          <div className="ref-guide-body">
            <section className="mechanic-section">
              <div className="mech-header">
                <Zap size={20} color="var(--neon-cyan)" />
                <h4 className="section-label">1. РЕСУРСЫ: INTEGRITY И RAM</h4>
              </div>
              <p>Ваша выживаемость и мощь зависят от двух базовых метрик:</p>
              <ul className="mech-list">
                <li><strong>INTEGRITY [HP]:</strong> Целостность нейро-оболочки. Если падает до 0 — происходит Fatal Error (смерть).</li>
                <li><strong>RAM [ENERGY]:</strong> Оперативная память. Тратится на выполнение карт. Восстанавливается в начале цикла.</li>
                <li><strong>CPU CORES:</strong> Количество потоков, определяющее, сколько карт можно запустить за ход.</li>
              </ul>
            </section>
      
            <section className="mechanic-section">
              <div className="mech-header">
                <Server size={20} color="var(--neon-amber)" />
                <h4 className="section-label">2. ИНФРАСТРУКТУРНЫЕ МОДУЛИ (INFRA)</h4>
              </div>
              <p>Развертываются в фазе <strong>PLANNING</strong>. Навсегда увеличивают лимиты системы:</p>
              <ul className="mech-list">
                <li><strong>DNS / Basic Pod:</strong> +1 CPU Core.</li>
                <li><strong>Docker:</strong> +512MB RAM (открывает +1 слот на шине).</li>
                <li><strong>PostgreSQL:</strong> +2 CPU Core (требование для Senior-сред).</li>
                <li><strong>S3 Bucket:</strong> +1536MB RAM (открывает сразу +3 слота).</li>
                <li><strong>RAID Array:</strong> +50 к целостности системы (HP).</li>
              </ul>
            </section>
      
            <section className="mechanic-section">
              <div className="mech-header">
                <Clock size={20} color="var(--neon-pink)" />
                <h4 className="section-label">3. ДЕДЛАЙН И ТЕХ.ДОЛГ (DEADLINE)</h4>
              </div>
              <p>У каждого проекта есть жесткий срок исполнения (AI_DEADLINE_TICK).</p>
              <ul className="mech-list">
                <li><strong>Дедлайн (0):</strong> При обнулении счетчика активируется <code>TECH_DEBT</code>: стоимость всех карт в CPU возрастает на <strong>+1</strong>.</li>
                <li><strong>Баги:</strong> Ошибки (ERRORS) накапливаются от действий противника и замедляют ваш прогресс.</li>
              </ul>
            </section>
          </div>
        </div>
      )}
      
      {pack === 'cookbook' && (
        <div className="ref-guide-full neon-panel animate-float-stable">
          <div className="cookbook-nav mono-text">
            <button className={`cb-tab ${cookbookTab === 'core' ? 'active' : ''}`} onClick={() => setCookbookTab('core')}>01_CORE_SYNTAX</button>
            <button className={`cb-tab ${cookbookTab === 'libs' ? 'active' : ''}`} onClick={() => setCookbookTab('libs')}>02_COLLECTIONS</button>
            <button className={`cb-tab ${cookbookTab === 'infra' ? 'active' : ''}`} onClick={() => setCookbookTab('infra')}>03_CLOUD_INFRA</button>
            <button className={`cb-tab ${cookbookTab === 'qa' ? 'active' : ''}`} onClick={() => setCookbookTab('qa')}>04_QA_SYSTEM</button>
          </div>
          
          <div className="ref-guide-body">
             {cookbookTab === 'core' && (
                <section className="cb-section">
                  <h4 className="section-label">[ EXAMPLE: HELLO_WORLD_APP ]</h4>
                  <div className="cb-layout">
                    <div className="cb-cards">
                      <span className="cb-card-tag">PACKAGE_DECL</span>
                      <span className="cb-card-tag">CLASS_PUBLIC</span>
                      <span className="cb-card-tag">STATIC_MAIN</span>
                      <span className="cb-card-tag">SYSOUT_PRINT</span>
                    </div>
                    <div className="cb-code-block mono-text">
<pre>{`public class App {
  public static void main(String[] args) {
    System.out.println("Hello World");
  }
}`}</pre>
                    </div>
                    <div className="cb-output">
                      <span className="label">RESULT:</span>
                      <p>Console output: Hello World</p>
                    </div>
                  </div>
                </section>
             )}
             
             {cookbookTab === 'libs' && (
                <section className="cb-section">
                  <h4 className="section-label">[ EXAMPLE: DATA_TRANSFORMATION ]</h4>
                  <div className="cb-layout">
                    <div className="cb-cards">
                      <span className="cb-card-tag">STREAM_API</span>
                      <span className="cb-card-tag">STREAM_MAP</span>
                    </div>
                    <div className="cb-code-block mono-text">
<pre>{`list.stream()
    .map(x -> x * 2)
    .collect(Collectors.toList());`}</pre>
                    </div>
                    <div className="cb-output">
                      <span className="label">RESULT:</span>
                      <p>All numeric elements in the collection are doubled.</p>
                    </div>
                  </div>
                </section>
             )}

             {cookbookTab === 'infra' && (
                <section className="cb-section">
                  <h4 className="section-label">[ EXAMPLE: K8S_DEPLOYMENT ]</h4>
                  <div className="cb-layout">
                    <div className="cb-cards">
                      <span className="cb-card-tag">BASIC_POD</span>
                      <span className="cb-card-tag">DOCKER_CONTAINER</span>
                    </div>
                    <div className="cb-code-block mono-text">
<pre>{`# Simulated Pod Spec
kind: Pod
metadata: { name: app-v1 }
spec: { containers: [{ image: neon-app:latest }] }`}</pre>
                    </div>
                    <div className="cb-output">
                      <span className="label">RESULT:</span>
                      <p>System gain: +1 CPU, +1GB RAM Limit.</p>
                    </div>
                  </div>
                </section>
             )}

             {cookbookTab === 'qa' && (
                <section className="cb-section">
                  <h4 className="section-label">[ EXAMPLE: WEB_INTEGRATION_TEST ]</h4>
                  <div className="cb-layout">
                    <div className="cb-cards">
                      <span className="cb-card-tag">UNIT_TEST</span>
                      <span className="cb-card-tag">MOCK_MVC</span>
                    </div>
                    <div className="cb-code-block mono-text">
<pre>{`mockMvc.perform(get("/api"))
       .andExpect(status().isOk());`}</pre>
                    </div>
                    <div className="cb-output">
                      <span className="label">RESULT:</span>
                      <p>System Integrity: +15%. Bugs reduced by 5%.</p>
                    </div>
                  </div>
                </section>
             )}
          </div>
        </div>
      )}

      {pack === 'sandbox' && (
        <div className="ref-layout animate-float-stable">
           <div className="ref-list-pane neon-panel">
            <div className="pane-header">
              <Terminal size={16} />
              <span>LOGIC_ASSEMBLER</span>
            </div>
            <div className="entries-scroll-list">
              {CARD_LIBRARY.filter(c => discoveredCardIds.has(c.id)).map((card) => (
                <div key={card.id} className="ref-item discovered" onClick={() => setSandboxCards([...sandboxCards, card])}>
                  <div className="ref-item-main">
                    <Zap size={14} color="var(--neon-cyan)" />
                    <span className="ref-item-title">{card.name}</span>
                  </div>
                  <span className="ref-item-card-tag">+ ADD</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ref-detail-pane neon-panel sandbox-workspace">
             <div className="sandbox-header">
                <div className="sh-left">
                  <h3>[ CURRENT_ASSEMBLY ]</h3>
                  <p className="mono-text opacity-50">Assemble protocols and click INITIALIZE</p>
                </div>
                <div className="sh-right">
                  <button className="sandbox-ctrl-btn reset" onClick={() => { setSandboxCards([]); setSandboxResult({ code: '', output: '', status: 'idle' }); }}>
                    <RotateCcw size={14} /> RESET
                  </button>
                  <button className="sandbox-ctrl-btn run" onClick={runSandbox}>
                    <Play size={14} /> INITIALIZE_RUN
                  </button>
                </div>
             </div>

             <div className="sandbox-assembly-line">
                {sandboxCards.map((c, i) => (
                  <div key={i} className="assembly-item animate-float-stable" onClick={() => setSandboxCards(sandboxCards.filter((_, idx) => idx !== i))}>
                    <span className="ai-name">{c.name}</span>
                    <span className="ai-remove">×</span>
                  </div>
                ))}
                {sandboxCards.length === 0 && <div className="empty-assembly mono-text opacity-30">NO_PROTOCOLS_LOADED</div>}
             </div>

             {sandboxResult.status !== 'idle' && (
               <div className={`sandbox-results animate-float-stable ${sandboxResult.status}`}>
                  <div className="res-block code">
                    <h5 className="mono-text">[ GENERATED_SOURCE ]</h5>
                    <pre className="mono-text">{sandboxResult.code}</pre>
                  </div>
                  <div className="res-block console">
                    <h5 className="mono-text">[ NEON_CONSOLE_OUTPUT ]</h5>
                    <div className="console-line mono-text">{sandboxResult.output}</div>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {(pack === 'core' || pack === 'spring' || pack === 'infra' || pack === 'soft-skills' || pack === 'testing' || pack === 'scripting') && (
        <div className="ref-layout">
          <div className="ref-list-pane neon-panel">
            <div className="pane-header">
              <Info size={16} />
              <span>DISCOVERED_CONCEPTS</span>
            </div>
            <div className="entries-scroll-list">
              {cardLibrary.map((card) => {
                const isDiscovered = discoveredCardIds.has(card.id);
                const ref = refBook[card.id];
                if (!ref) return null;

                return (
                  <div
                    key={card.id}
                    className={`ref-item ${isDiscovered ? 'discovered' : 'locked'} ${selectedEntryId === card.id ? 'active' : ''}`}
                    onClick={() => isDiscovered && setSelectedEntryId(card.id)}
                  >
                    <div className="ref-item-main">
                      {isDiscovered ? (
                        <ChevronRight size={16} color="var(--neon-cyan)" />
                      ) : (
                        <Lock size={16} opacity={0.3} />
                      )}
                      <span className="ref-item-title">{isDiscovered ? ref.title : '????????????'}</span>
                    </div>
                    {isDiscovered && <span className="ref-item-card-tag">{card.name}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ref-detail-pane neon-panel">
            {selectedEntry ? (
              <div className="entry-content animate-float">
                <div className="entry-header">
                  <h2 className="entry-title">{selectedEntry.title}</h2>
                  <div className="entry-concept mono-text">{selectedEntry.concept}</div>
                </div>

                <div className="entry-section">
                  <h4 className="section-label">[ EXPLANATION ]</h4>
                  <p className="section-text">{selectedEntry.explanation}</p>
                </div>

                {selectedEntry.bullets && (
                  <div className="entry-section">
                    <h4 className="section-label">[ KEY_CONCEPTS ]</h4>
                    <ul className="entry-tech-list mono-text">
                      {selectedEntry.bullets.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="entry-section">
                  <h4 className="section-label">[ CODE_EXAMPLE ]</h4>
                  <div className="code-block-v4 mono-text">
                    <pre>{selectedEntry.example}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-entry-state">
                <Code size={48} opacity={0.1} />
                <p>SELECT_DATA_ENTRY_TO_VIEW_DOCUMENTATION</p>
                <span className="hint">
                  Use cards in combat to unlock descriptions.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <button className="doc-sticky-back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> [ RETURN ]
      </button>
    </div>
  );
};

export default Documentation;
