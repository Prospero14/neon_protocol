import React, { useState } from 'react';
import { Book, ChevronRight, Code, Info, Lock, Zap, Clock, Server, ArrowLeft, Play, RotateCcw, Terminal, Users } from 'lucide-react';
import { JAVA_REFERENCE } from '../logic/referenceData';
import { CARD_LIBRARY } from '../logic/combatCards';
import type { CombatCard } from '../logic/combatCards';
import { SPRING_CARD_LIBRARY } from '../logic/springCards';
import { SPRING_JAVA_REFERENCE } from '../logic/springReferenceData';
import type { CoopRole, DevLanguageStack, SessionMode } from '../logic/sessionMode';
import { getCoopRoleCatalogIds, buildCoopProtocolDocCards, COOP_ROLE_LABELS } from '../logic/sessionMode';

type DocPack = 'core' | 'spring' | 'infra' | 'soft-skills' | 'testing' | 'cookbook' | 'sandbox' | 'mechanics' | 'scripting' | 'exploits' | 'coop_protocol';

interface DocumentationProps {
  discoveredCardIds: Set<string>;
  initialEntryId?: string | null;
  onBack: () => void;
  solvedChains: Array<{ taskId: string, name: string, chain: string[] }>;
  /** В коопе списки карт ограничиваются каталогом роли; заметка открыта только если карта в колоде/инвентаре (discovered). */
  sessionMode?: SessionMode;
  coopRole?: CoopRole | null;
  devLanguageStack?: DevLanguageStack | null;
}

const Documentation: React.FC<DocumentationProps> = ({
  discoveredCardIds,
  initialEntryId,
  onBack,
  solvedChains,
  sessionMode = 'solo',
  coopRole = null,
  devLanguageStack = null,
}) => {
  const [pack, setPack] = useState<DocPack>('mechanics');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(initialEntryId || null);
  const [selectedCoopCardId, setSelectedCoopCardId] = useState<string | null>(null);
  
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

  const coopCatalogIds = React.useMemo(() => {
    if (sessionMode !== 'coop' || !coopRole) return null;
    return getCoopRoleCatalogIds(
      coopRole,
      coopRole === 'developer' ? (devLanguageStack ?? 'java') : null
    );
  }, [sessionMode, coopRole, devLanguageStack]);

  const filterCoopCatalog = React.useCallback(
    (cards: CombatCard[]) => {
      if (!coopCatalogIds) return cards;
      return cards.filter((c) => coopCatalogIds.has(c.id));
    },
    [coopCatalogIds]
  );

  const coopDocCatalog = React.useMemo(() => {
    if (sessionMode !== 'coop' || !coopRole) return null;
    const cards = buildCoopProtocolDocCards(
      coopRole,
      coopRole === 'developer' ? (devLanguageStack ?? 'java') : null
    );
    const total = cards.length;
    let open = 0;
    for (const c of cards) {
      if (discoveredCardIds.has(c.id)) open++;
    }
    return { cards, total, open, roleTitle: COOP_ROLE_LABELS[coopRole].title };
  }, [sessionMode, coopRole, devLanguageStack, discoveredCardIds]);

  React.useEffect(() => {
    if (sessionMode !== 'coop' && pack === 'coop_protocol') setPack('mechanics');
  }, [sessionMode, pack]);

  React.useEffect(() => {
    if (pack !== 'coop_protocol' || !coopDocCatalog) return;
    if (!selectedCoopCardId || !coopDocCatalog.cards.some((c) => c.id === selectedCoopCardId)) {
      setSelectedCoopCardId(coopDocCatalog.cards[0]?.id ?? null);
    }
  }, [pack, coopDocCatalog, selectedCoopCardId]);

  const cardLibrary: CombatCard[] = React.useMemo(() => {
      switch(pack) {
          case 'spring': return filterCoopCatalog(SPRING_CARD_LIBRARY);
          case 'infra': return filterCoopCatalog(CARD_LIBRARY.filter(c => c.type === 'INFRASTRUCTURE'));
          case 'soft-skills': return filterCoopCatalog(CARD_LIBRARY.filter(c => c.type === 'SOFT'));
          case 'scripting': return filterCoopCatalog(CARD_LIBRARY.filter(c => c.type === 'SCRIPT'));
          case 'testing': return filterCoopCatalog(CARD_LIBRARY.filter((c: any) => c.type === 'REACTION' || c.type === 'DEFENSIVE' || (c.tags && c.tags.includes('reaction'))));
          case 'core': return filterCoopCatalog(CARD_LIBRARY.filter((c: any) => c.type === 'SYNTAX' || c.type === 'FUNCTION'));
          default: return filterCoopCatalog(CARD_LIBRARY);
      }
  }, [pack, filterCoopCatalog]);

  const refBook = pack === 'spring' ? SPRING_JAVA_REFERENCE : JAVA_REFERENCE;
  const getEntryById = React.useCallback((id: string | null) => {
    if (!id) return null;
    const fromBook = refBook[id];
    if (fromBook) return fromBook;
    const card = [...CARD_LIBRARY, ...SPRING_CARD_LIBRARY].find((c) => c.id === id);
    if (!card) return null;
    return {
      title: card.name,
      concept: `${card.type} / ${card.grade}`,
      explanation: card.description,
      bullets: [
        `Тип: ${card.type}`,
        `Стоимость: ${card.cost} CPU`,
        `Фаза: ${card.phaseConstraint || 'ANY'}`,
      ],
      example: `// ${card.id}\n// Описание: ${card.description}`,
    };
  }, [refBook]);
  const selectedEntry = getEntryById(selectedEntryId);

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
            <h3>OCTOBERLINE_DOCS [V6.4]</h3>
            {sessionMode === 'coop' && coopRole && (
              <p className="mono-text" style={{ margin: '6px 0 0', fontSize: 11, opacity: 0.75 }}>
                COOP // каталог роли: только протоколы, доступные вашему классу. Заметка открыта, если карта уже у вас (колода/инвентарь).
              </p>
            )}
            <div className="ref-pack-tabs mono-text">
              <button className={`ref-pack-tab ${pack === 'mechanics' ? 'active' : ''}`} onClick={() => setPack('mechanics')}>GAME_SYSTEMS</button>
              {sessionMode === 'coop' && coopRole && (
                <button
                  className={`ref-pack-tab ${pack === 'coop_protocol' ? 'active' : ''}`}
                  onClick={() => setPack('coop_protocol')}
                  title="Каталог коопа: открыто / закрыто"
                >
                  COOP_CATALOG
                </button>
              )}
              <button className={`ref-pack-tab core ${pack === 'core' ? 'active' : ''}`} onClick={() => setPack('core')}>JAVA_CORE</button>
              <button className={`ref-pack-tab scripting ${pack === 'scripting' ? 'active' : ''}`} onClick={() => setPack('scripting')}>SCRIPTS</button>
              <button className={`ref-pack-tab spring ${pack === 'spring' ? 'active' : ''}`} onClick={() => setPack('spring')}>SPRING_BOOT</button>
              <button className={`ref-pack-tab infra ${pack === 'infra' ? 'active' : ''}`} onClick={() => setPack('infra')}>INFRA</button>
              <button className={`ref-pack-tab soft ${pack === 'soft-skills' ? 'active' : ''}`} onClick={() => setPack('soft-skills')}>SOFT_SKILLS</button>
              <button className={`ref-pack-tab testing ${pack === 'testing' ? 'active' : ''}`} onClick={() => setPack('testing')}>TESTS & COUNTERS</button>
              <button className={`ref-pack-tab cookbook ${pack === 'cookbook' ? 'active' : ''}`} onClick={() => setPack('cookbook')}>DEV_COOKBOOK</button>
              <button className={`ref-pack-tab sandbox ${pack === 'sandbox' ? 'active' : ''}`} onClick={() => setPack('sandbox')}>SANDBOX</button>
              <button className={`ref-pack-tab exploits ${pack === 'exploits' ? 'active' : ''}`} onClick={() => setPack('exploits')}>EXPLOITS_DB</button>
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
      </header>

      {pack === 'coop_protocol' && sessionMode === 'coop' && coopRole && coopDocCatalog && (
        <div className="ref-coop-protocol-stack">
          <div className="ref-guide-full neon-panel ref-coop-protocol-intro">
            <div className="ref-guide-body">
              <section className="mechanic-section">
                <div className="mech-header">
                  <Users size={20} color="var(--neon-cyan)" />
                  <h4 className="section-label">КООП: КАТАЛОГ ПРОТОКОЛОВ И ЗАМЕТКИ</h4>
                </div>
                <p className="mono-text" style={{ opacity: 0.85 }}>
                  Роль: <strong>{coopDocCatalog.roleTitle}</strong>
                  {' · '}
                  Открыто заметок: <strong>{coopDocCatalog.open}</strong> / <strong>{coopDocCatalog.total}</strong> (в каталоге роли)
                </p>
                <p>
                  <strong>Каталог</strong> — это набор id карт, разрешённых для вашей роли в коопе (полигон <code>coop_yard</code>).
                  Во вкладках JAVA_CORE, SCRIPTS, SPRING_BOOT, INFRA, SOFT_SKILLS, TESTS показываются только карты из этого каталога;
                  протоколы других ролей скрыты — это разделение зон ответственности, а не ошибка списка.
                </p>
              </section>

              <section className="mechanic-section">
                <div className="mech-header">
                  <Info size={20} color="var(--neon-amber)" />
                  <h4 className="section-label">ОТКРЫТО И ЗАКРЫТО</h4>
                </div>
                <ul className="mech-list">
                  <li>
                    <strong>Открыто (discovered)</strong> — id карты есть в множестве открытых протоколов: карта в{' '}
                    <strong>активной колоде</strong> или в <strong>инвентаре</strong>. В списке слева видно название, справа — полный текст; строка подсвечена как открытая.
                  </li>
                  <li>
                    <strong>Закрыто (locked)</strong> — карта входит в каталог роли, но вы её ещё не получили в колоду/инвентарь.
                    В списке показывается маска <code>????????????</code>, описание недоступно до открытия.
                  </li>
                </ul>
                <p>
                  Новые заметки открываются, когда вы добавляете карту в колоду или получаете её наградой; после синхронизации сохранения множество открытых id обновляется вместе с колодой и инвентарём.
                </p>
              </section>

              <section className="mechanic-section">
                <div className="mech-header">
                  <Terminal size={20} color="var(--neon-pink)" />
                  <h4 className="section-label">SANDBOX В КООПЕ</h4>
                </div>
                <p>
                  В песочницу можно подгрузить только карты, которые уже <strong>открыты</strong> и входят в ваш кооп-каталог (те же правила фильтра, что и для списка протоколов).
                </p>
              </section>

              <section className="mechanic-section">
                <div className="mech-header">
                  <Server size={20} color="var(--neon-amethyst)" />
                  <h4 className="section-label">РАЗМЕР КОЛОДЫ (КООП)</h4>
                </div>
                <p>
                  Минимум <strong>30</strong> карт в стартовой колоде; в конструкторе — до <strong>200</strong> карт. Подробности в коде:{' '}
                  <code>sessionMode.ts</code> (<code>COOP_DECK_MIN_CARDS</code>, <code>COOP_DECK_MAX_CARDS</code>, <code>buildCoopProtocolDocCards</code>).
                </p>
                <p className="mono-text opacity-60" style={{ fontSize: 11, marginTop: 8 }}>
                  Полный текст: <code>docs/COOP_CARD_DOCUMENTATION.md</code>
                </p>
              </section>
            </div>
          </div>

          <div className="ref-coop-catalog-block neon-panel">
            <div className="ref-coop-catalog-head mech-header">
              <Book size={18} color="var(--neon-cyan)" />
              <h4 className="section-label" style={{ marginBottom: 0 }}>
                ДОКУМЕНТАЦИЯ ПО ВСЕМ КАРТАМ КАТАЛОГА
              </h4>
            </div>
            <div className="ref-layout ref-layout--coop-catalog">
              <div className="ref-list-pane ref-coop-catalog-pane">
                <div className="ref-coop-pane-header">
                  <Info size={16} />
                  <span>COOP_PROTOCOLS</span>
                </div>
                <div className="entries-scroll-list">
                  {coopDocCatalog.cards.map((card) => {
                    const isDiscovered = discoveredCardIds.has(card.id);
                    return (
                      <div
                        key={card.id}
                        className={`ref-item ${isDiscovered ? 'discovered' : 'locked'} ${selectedCoopCardId === card.id ? 'active' : ''}`}
                        onClick={() => setSelectedCoopCardId(card.id)}
                      >
                        <div className="ref-item-main">
                          {isDiscovered ? (
                            <ChevronRight size={16} color="var(--neon-cyan)" />
                          ) : (
                            <Lock size={16} opacity={0.3} />
                          )}
                          <span className="ref-item-title">{isDiscovered ? card.name : '????????????'}</span>
                        </div>
                        <span className="ref-item-card-tag">{isDiscovered ? card.id : 'LOCKED'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="ref-detail-pane ref-coop-catalog-pane">
                {(() => {
                  const selected = coopDocCatalog.cards.find((c) => c.id === selectedCoopCardId) ?? null;
                  if (!selected) {
                    return (
                      <div className="empty-entry-state">
                        <Code size={48} opacity={0.1} />
                        <p>SELECT_DATA_ENTRY_TO_VIEW_DOCUMENTATION</p>
                      </div>
                    );
                  }
                  const isDiscovered = discoveredCardIds.has(selected.id);
                  return (
                    <div className="entry-content animate-float">
                      <div className="entry-header">
                        <h2 className="entry-title">{isDiscovered ? selected.name : '????????????'}</h2>
                        <div className="entry-concept mono-text">
                          {isDiscovered ? `${selected.type} / ${selected.grade} / ${selected.id}` : 'LOCKED_ENTRY'}
                        </div>
                      </div>
                      {isDiscovered ? (
                        <>
                          <div className="entry-section">
                            <h4 className="section-label">[ EXPLANATION ]</h4>
                            <p className="section-text">{selected.description}</p>
                          </div>
                          <div className="entry-section">
                            <h4 className="section-label">[ KEY_CONCEPTS ]</h4>
                            <ul className="entry-tech-list mono-text">
                              <li>Тип: {selected.type}</li>
                              <li>Грейд: {selected.grade}</li>
                              <li>Стоимость: {selected.cost} CPU</li>
                              <li>Фаза: {selected.phaseConstraint || 'ANY'}</li>
                            </ul>
                          </div>
                        </>
                      ) : (
                        <div className="entry-section">
                          <h4 className="section-label">[ LOCKED ]</h4>
                          <p className="section-text">
                            Запись закрыта. Получите карту в колоду или инвентарь, чтобы открыть полную документацию.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

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

            <section className="mechanic-section">
              <div className="mech-header">
                <Zap size={20} color="var(--neon-cyan)" />
                <h4 className="section-label">4. OVERHEAT (ПЕРЕГРЕВ)</h4>
              </div>
              <p>Перегрев в бою = рост <strong>STRESS</strong>. Это не отдельная скрытая шкала, а прямое давление на нервную систему.</p>
              <ul className="mech-list">
                <li><strong>Что повышает стресс:</strong> атаки ИИ, некоторые агрессивные эффекты (например Overclock/Street Fusion), затяжные неэффективные ходы.</li>
                <li><strong>Что снижает стресс:</strong> defensive/reaction-инструменты, часть soft/infra-карт, грамотный контрплей по типу сбоя.</li>
                <li><strong>Критическая зона:</strong> при <strong>STRESS = 100%</strong> бой завершается аварией (SYSTEM_CRASH).</li>
                <li><strong>Практика:</strong> OC включайте как рывок в нужный ход, а не по кулдауну — это ресурс за цену перегрева.</li>
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

      {pack === 'exploits' && (
        <div className="ref-guide-full exploits-view-v4 neon-panel animate-float-stable">
          <div className="exploits-header">
            <Terminal size={24} color="var(--neon-amethyst)" />
            <h3 className="mono-text">PERSONAL_EXPLOIT_DATABASE [VERIFIED_STABLE]</h3>
          </div>
          
          <div className="exploits-scroll-area">
            {solvedChains.length === 0 ? (
               <div className="empty-exploits-state mono-text">
                  &gt; NO_SUCCESSFUL_CHAINS_RECORDED
                  <br/>&gt; PERFORM_INJECTION_OR_CLEANUP_TO_GENERATE_LOG
               </div>
            ) : (
               <div className="exploits-grid">
                 {solvedChains.map((item, idx) => (
                   <div key={idx} className="exploit-card mono-text">
                     <div className="ex-header">
                        <span className="ex-task-id">#{item.taskId.slice(0, 8)}</span>
                        <span className="ex-job-name">{item.name}</span>
                     </div>
                     <div className="ex-chain-rail">
                        {item.chain.map((card, cidx) => (
                          <div key={cidx} className="ex-chain-node">
                             <div className="ex-node-val">{card}</div>
                             {cidx < item.chain.length - 1 && <ChevronRight size={12} color="#444" />}
                          </div>
                        ))}
                     </div>
                     <div className="ex-footer">
                        <span className="ex-status-tag">STABLE_EXPLOIT</span>
                        <span className="ex-timestamp">LOG_SAVED: {new Date().toLocaleDateString()}</span>
                     </div>
                   </div>
                 ))}
               </div>
            ) }
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
              {filterCoopCatalog(CARD_LIBRARY).filter(c => discoveredCardIds.has(c.id)).map((card) => (
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
              {cardLibrary.map((card: any) => {
                const isDiscovered = discoveredCardIds.has(card.id);
                const ref = getEntryById(card.id);
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
