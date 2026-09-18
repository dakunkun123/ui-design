import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUp } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { Pause } from '@phosphor-icons/react/dist/csr/Pause';
import { Play } from '@phosphor-icons/react/dist/csr/Play';
import { BookOpen } from '@phosphor-icons/react/dist/csr/BookOpen';
import { SpatialScene } from './GPUScene.jsx';
import { InkTitle } from './InkTitle.jsx';
import { SceneControls } from './SceneControls.jsx';
import { useInkRoutes } from './inkRoutes.js';
import { ArtLabel } from './ArtLabel.jsx';
import { EntryInk, InkPractice } from './EntryInk.jsx';
import { InkInteraction } from './InkInteraction.jsx';
import { StoryAtlas } from './StoryAtlas.jsx';
import { StoryExperience } from './StoryExperience.jsx';
import { LeafCurtain } from './LeafCurtain.jsx';
import { JournalWorld } from './JournalWorld.jsx';

const swordViews = [
  { label: '观其形', eyebrow: '形制 · 墨骨', heading: '一线藏锋，朱环系风。', text: '银纹收于窄柄，朱痕隐入直刃。环首系一缕墨穗，风来，细丝各有去处。世人看剑，先问出自何家；持剑的人，只试它还能不能挡住来刃。', detail: '银纹朱环', second: '直刃轻穗' },
  { label: '悟其意', eyebrow: '剑意 · 自持', heading: '出剑以前，先问所求。', text: '进时有度，不是畏惧；退时有守，也未必清高。胜负算得清，得失未必。若连为何拔剑都要旁人替你作答，这柄剑再利，也不过借在你手里。', detail: '知所取舍', second: '不借人心' },
  { label: '听其事', eyebrow: '来历 · 听雨', heading: '雨停之后，各有去处。', text: '剑客抵渡时，追兵已到山口。他将随身的青玉押给船家，换来一程。多年后重过此地，玉还在，摆渡的人却换了。他付了船钱，又把那笔旧债留在岸上。', detail: '渡口旧债', second: '原创剑录' },
];
const stories = [
  { id: 'autumn', kind: '山河手记', title: '山路尽处，仍须向前', intro: '山不替人开路，风也不替人作答。', image: 'story-ink', minutes: '约 2 分钟', body: ['入秋以后，山上的路断了一截。石阶坠在雾里，听不见落地的声响。', '他在崖边解开行囊，倒出半袋干粮、两件旧衣和一本受潮的剑谱。对岸不过三丈。若只带剑，他有七成把握过去；带着这些东西，便只剩四成。', '身后那个跛脚少年问，书不要了么。他翻到末页，看了看自己早年添上的批注，又将书合好，压在一块避雨的山石下。那些道理既已记住，便不必再多背一份。', '他先将少年送过断崖，回来时左手裂了道口子。少年要拜师，他摇头；少年又问姓名，他说，先走到山下再问。雾正在涨，眼下认路比认人要紧。', '日暮时，他们终于看见村里的炊烟。少年回头，想记住来时那座山，却发现每一座山都已暗了下去。他没有催，只把剩下的干粮分成两半，将较大的一半收回袖中。明日还有一段更长的路。'] },
  { id: 'ferry', kind: '江湖旧闻', title: '一程渡水，两笔旧账', intro: '船钱照付。别的账，上岸再算。', image: 'hero-ink', minutes: '约 2 分钟', body: ['摆渡的老人认出了他，却仍照规矩伸手，要三枚铜钱。', '十年前，他带着一身伤来到这里，付不起船钱，便将随身的青玉押在船头。老人渡了他，又独自把船撑回追兵所在的岸。这件事后来少有人提起，他却一直记得。', '如今老人不在了，撑船的是老人的女儿。她从舱里取出一只布包，青玉裹在里面，连当年的血痕也擦净了。她说，父亲交代过，东西可以还，船钱不能免。', '他数出三枚铜钱，放在湿木板上，又取出一张田契。女子没有接，只问这块田从何而来。他沉默片刻，将田契收了回去。原来有些东西拿来还债，只会让债更重。', '船靠岸时，他将缆绳系好，没有说改日再来。次年春汛，渡口多了一座石埠。没人知道是谁出的钱，女子也没问。她仍收三枚铜钱，风大时，便少载一个人。'] },
  { id: 'sword', kind: '剑客随笔', title: '鞘中尚有未决之事', intro: '有些胜负，拔剑的那一刻便已输了。', image: 'sword-ink', minutes: '约 1 分钟', body: ['对手倒下以后，四周的人开始叫好。我却只看见他腰间那只缝了三遍的药囊。', '这一战我等了七年。七年里，我算过他的步法、伤势、出剑时习惯偏向哪边，却没有算过赢了以后，该拿这些年月去做什么。', '有人递来酒，有人劝我斩草除根。我都没有接。不是忽然心软，只是不愿再把下一段路，也交给一个已经倒下的人来决定。', '我收剑时，手仍在抖。于是多站了一会儿，等它停下。山门外有人叫卖热饼，我买了两个，吃完才发现天已经亮了。'] },
];
function InkButton({ href, onClick, children }) {
  const Tag = href ? 'a' : 'button';
  const disturb=e=>e.currentTarget.closest('section')?.querySelector('.gpu-surface')?.dispatchEvent(new CustomEvent('ink-scene-control',{detail:{action:'water'}}));
  return <Tag href={href} onClick={onClick} onPointerEnter={disturb} onFocus={disturb} className="ink-button"><ArtLabel name="explore">{children}</ArtLabel><ArrowRight size={25} weight="light" aria-hidden="true" /></Tag>;
}
export function App() {
  const [assets,setAssets]=useState({}),[entered,setEntered]=useState(false),[forceStatic,setForceStatic]=useState(false);
  const settle=useCallback((kind,status)=>setAssets(old=>old[kind]===status?old:{...old,[kind]:status}),[]);
  const enterStatic=()=>{setForceStatic(true);setEntered(true);};
  useEffect(()=>{if(entered)return;const timer=setTimeout(()=>{setForceStatic(true);setEntered(true);},15000);return()=>clearTimeout(timer);},[entered]);
  useEffect(()=>{if(entered||Object.keys(assets).length<4)return;let frame2;const frame1=requestAnimationFrame(()=>{frame2=requestAnimationFrame(()=>setEntered(true));});return()=>{cancelAnimationFrame(frame1);cancelAnimationFrame(frame2);};},[assets,entered]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [swordView, setSwordView] = useState(0);
  const [motion, setMotion] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [practice,setPractice]=useState(false);
  const activeSection=useInkRoutes(motion,entered);
  const [reader, commitReader] = useState(null);
  const curtain=useRef(null);
  const setReader=story=>story?curtain.current?.enter(()=>commitReader(story),story.id):commitReader(null);
  const openStory=setReader;
  const [collected, setCollected] = useState(()=>{try{const saved=JSON.parse(localStorage.getItem('fengluo-bookmarks')||'[]');return Array.isArray(saved)?saved.filter(id=>stories.some(s=>s.id===id)):[];}catch{return [];}});
  const [query,setQuery]=useState(''),[savedOnly,setSavedOnly]=useState(false),[saveStatus,setSaveStatus]=useState(''),[readProgress,setReadProgress]=useState(0);
  const listedStories=stories.filter(story=>(!savedOnly||collected.includes(story.id))&&(`${story.title}${story.kind}${story.intro}`).includes(query.trim()));
  function toggleBookmark(id){const next=collected.includes(id)?collected.filter(item=>item!==id):[...collected,id];setCollected(next);try{localStorage.setItem('fengluo-bookmarks',JSON.stringify(next));setSaveStatus(next.includes(id)?'已存于此浏览器，重访仍在。':'已从本机书签移除。');}catch{setSaveStatus('浏览器未允许保存，书签仅在本次打开期间有效。');}}
  useEffect(()=>{setSaveStatus('');setReadProgress(0);if(reader&&dialogRef.current)dialogRef.current.scrollTop=0;},[reader]);
  const dialogRef = useRef(null), menuButtonRef = useRef(null), tabsRef = useRef([]);
  const currentView = swordViews[swordView];
  useEffect(()=>{setMenuOpen(false);setReader(null);},[activeSection]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotion(!preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => { document.documentElement.dataset.motion = motion ? 'on' : 'off'; }, [motion]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (reader && !dialog.open) dialog.showModal();
    if (!reader && dialog.open) dialog.close();
    document.body.style.overflow = reader ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [reader]);
  useEffect(() => {
    const closeMenu = event => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButtonRef.current?.focus(); } };
    document.addEventListener('keydown', closeMenu);
    return () => document.removeEventListener('keydown', closeMenu);
  }, [menuOpen]);
  function changeTab(event, index) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % swordViews.length;
    else if (event.key === 'ArrowLeft') next = (index + swordViews.length - 1) % swordViews.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = swordViews.length - 1;
    else return;
    event.preventDefault(); setSwordView(next); tabsRef.current[next]?.focus();
  }
  return <>
    <LeafCurtain controller={curtain} motion={motion}/>
    <a className="skip-link" href="#sword-scroll">跳至主要内容</a>
    <header className="masthead">
      <a className="brand" href="#prologue" aria-label="枫落见锋，返回序章" onClick={() => setMenuOpen(false)}><span className="brand-name">枫落见锋</span><span className="brand-mark">剑<br />意</span></a>
      <p className="brand-motto">山河为证 · 去留由心</p>
      <button ref={menuButtonRef} className="menu-toggle icon-button" aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={25} weight="light" /> : <List size={25} weight="light" />}</button>
      <nav id="main-navigation" className={menuOpen ? 'navigation is-open' : 'navigation'} aria-label="主导航">
        {[['prologue', '序章'], ['sword-scroll', '剑录'], ['journal', '江湖志']].map(([id, label]) => <a key={id} href={id==='prologue'?'#/':id==='sword-scroll'?'#/jianlu':'#/jianghu'} aria-current={activeSection === id ? 'page' : undefined} onClick={() => setMenuOpen(false)}><ArtLabel name={id==='sword-scroll'?'jianlu':id}>{label}</ArtLabel></a>)}
        <a className="nav-action" href="#journal" onClick={() => setMenuOpen(false)}><ArtLabel name="enter">入江湖</ArtLabel></a>
      </nav>
    </header>
    {!entered&&<div className="entry-gate"><EntryInk loading count={Object.keys(assets).length} onExit={enterStatic}/></div>}
    {practice&&<InkPractice onClose={()=>setPractice(false)}/>}
    <InkInteraction enabled={motion&&entered&&!reader&&!practice&&!menuOpen}/>
    {entered&&<button className="ink-practice-open" onClick={()=>setPractice(true)}>试墨</button>}
    {forceStatic&&<p className="render-notice" role="status">已以静画入境 · 本次不再切换模型</p>}
    <main data-entry={entered?'ready':'preparing'} data-render-mode={forceStatic?'static':'gpu'} aria-busy={!entered} inert={!entered}>
      <section className="hero" id="prologue" aria-labelledby="hero-title" data-active={activeSection==='prologue'} aria-hidden={activeSection!=='prologue'} inert={activeSection!=='prologue'}>
        <SpatialScene kind="hero" motion={motion&&!practice} suspended={!entered || activeSection!=='prologue' || !!reader || menuOpen} onSettled={settle} forceStatic={forceStatic} />
        <div className="hero-copy"><p className="hero-kicker">山河无主 · 此心有途</p><h1 id="hero-title"><span className="sr-only">一剑入江湖，一叶知秋意</span><InkTitle motion={motion&&!practice} suspended={!entered || activeSection!=='prologue' || !!reader || menuOpen} started={entered} onSettled={settle} forceStatic={forceStatic} /></h1><p className="hero-subtitle"><ArtLabel name="motto">天地不作答，且向风雪行。</ArtLabel></p><div className="hero-actions"><InkButton href="#journal">探入江湖</InkButton><a className="text-link" href="#sword-scroll"><ArtLabel name="read">阅剑录</ArtLabel></a></div></div>
        <div className="river-caption" aria-hidden="true"><span>渡口</span><p>一水浮墨<br/>半岸听风</p></div>
        <SceneControls kind="hero" motion={motion} available={!forceStatic&&assets.hero==='ready'} />
        <p className="hero-bottom-note">来路落叶深，前山尚有灯。</p>
        <a className="scroll-cue" href="#sword-scroll"><ArrowRight size={26} weight="thin" aria-hidden="true" /><span>进入剑录</span></a>
      </section>
      <section id="sword-scroll" className="sword-section" aria-labelledby="sword-title" data-active={activeSection==='sword-scroll'} aria-hidden={activeSection!=='sword-scroll'} inert={activeSection!=='sword-scroll'}>
        <div className="section-heading page-width"><div><p className="eyebrow">卷一 · 剑录</p><h2 id="sword-title"><img className="cangfeng-title" src="/assets/cangfeng-v13.png" alt="藏锋" /></h2><p className="sword-intro-name">听雨剑</p><p className="sword-intro-line">雨打锋刃，不问归人。</p></div></div>
        <div id="sword-detail" className="sword-layout page-width">
          <figure className="sword-art" tabIndex={0} aria-describedby="sword-drag-help" aria-label="听雨剑观览，可左右拖动"><SpatialScene kind="sword" motion={motion&&!practice} suspended={!entered || activeSection!=='sword-scroll' || !!reader || menuOpen} onSettled={settle} forceStatic={forceStatic} />{!forceStatic&&assets.sword==='ready'&&<><button className="sword-hotspot" data-sword-focus="pommel" aria-label="近观环首">环首</button><button className="sword-hotspot" data-sword-focus="edge" aria-label="近观锋刃">锋刃</button></>}<figcaption>听雨 · 一器一生，一剑一江湖</figcaption></figure>
          <SceneControls kind="sword" motion={motion} available={!forceStatic&&assets.sword==='ready'} />
          <div className="sword-detail-strip" aria-hidden="true"><div className="detail-crop"><img src="/assets/sword-display-v2.webp" alt="" /></div><span>观其骨 · 知其锋</span></div>
          <details className="sword-info"><summary>阅器志 · 听雨</summary><p className="eyebrow red">江湖名器 · 壹</p><h3 className="sword-name">听雨剑</h3><p className="sword-line">雨打锋刃，不问归人。</p>
            <div className="sword-tabs" role="tablist" aria-label="听雨剑的不同篇章">{swordViews.map((view, index) => <button key={view.label} id={`sword-tab-${index}`} role="tab" aria-selected={swordView === index} aria-controls="sword-panel" tabIndex={swordView === index ? 0 : -1} ref={el => { tabsRef.current[index] = el; }} onKeyDown={event => changeTab(event, index)} onClick={() => setSwordView(index)}>{view.label}</button>)}</div>
            <div id="sword-panel" role="tabpanel" aria-labelledby={`sword-tab-${swordView}`} tabIndex={0} className="sword-panel"><div key={swordView} className="ink-transition"><p className="panel-eyebrow">{currentView.eyebrow}</p><h4>{currentView.heading}</h4><p className="body-copy">{currentView.text}</p><div className="sword-notes"><span>{currentView.detail}</span><span>{currentView.second}</span></div></div></div>
            <button className="text-link with-arrow" onClick={() => setReader(stories[2])}>读剑客随笔<ArrowRight size={25} weight="thin" /></button>
          </details>
        </div>
        <div className="sword-closing page-width"><a href="#/">返回山间</a></div>
      </section>
      <section id="journal" className="journal-section page-width" aria-labelledby="journal-title" data-active={activeSection==='journal'} aria-hidden={activeSection!=='journal'} inert={activeSection!=='journal'}>
        <JournalWorld stories={stories} onOpen={openStory} motion={motion&&!practice} suspended={!entered || activeSection!=='journal' || !!reader || menuOpen} onSettled={settle} forceStatic={forceStatic}/>
        <div className="journal-tools"><label><span>寻篇</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="篇名、山河、剑客…" aria-label="检索江湖篇章" /></label><button aria-pressed={savedOnly} onClick={()=>setSavedOnly(!savedOnly)}>只看书签 · {collected.length}</button>{(query||savedOnly)&&<button onClick={()=>{setQuery('');setSavedOnly(false);}}>清除筛选</button>}<p className="journal-count" role="status">寻得 {listedStories.length} 篇{savedOnly?' · 本机书签':''}</p></div>
        {listedStories.length===0&&<p className="journal-empty">此处尚无篇章。换个词寻一寻，或清除筛选。</p>}
        <StoryAtlas stories={listedStories} allStories={stories} onOpen={openStory} motion={motion}/>
      </section>
      <section className="epilogue page-width" aria-label="卷尾"><p className="eyebrow">卷尾 · 未尽</p><p className="closing-calligraphy">此卷有尽，行路未休。</p><p>收起这一页山水，再去走自己的路。</p><a className="text-link with-arrow" href="#prologue">重回序章<ArrowUp size={23} weight="thin" /></a></section>
    </main>
    <button className="motion-control" onClick={() => setMotion(!motion)} aria-pressed={!motion} aria-label={motion ? '暂停画面动态' : '开启画面动态'}>{motion ? <Pause size={16} weight="light" /> : <Play size={16} weight="light" />}<span>{motion ? '静观山河' : '风起山河'}</span></button>
    <footer className="footer page-width"><a href="#prologue" className="footer-brand">枫落见锋</a><p>山河为证 · 去留由心</p><span>水墨江湖 · 原创意境</span></footer>
    <dialog ref={dialogRef} className="reader" onScroll={e=>{const el=e.currentTarget;setReadProgress(el.scrollHeight>el.clientHeight?Math.round(el.scrollTop/(el.scrollHeight-el.clientHeight)*100):100);}} onCancel={() => setReader(null)} onClose={() => setReader(null)} onClick={event => { if (event.target === event.currentTarget) { const b = event.currentTarget.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) setReader(null); } }} aria-labelledby="reader-title">
      {reader && <><div className="reader-toolbar"><span>江湖志 · {reader.kind}</span><button autoFocus className="icon-button" aria-label="关闭文章" onClick={() => setReader(null)}><X size={25} weight="light" /></button></div><StoryExperience key={reader.id} story={reader} motion={motion} onToggleMotion={()=>setMotion(v=>!v)} collected={collected.includes(reader.id)} onBookmark={()=>toggleBookmark(reader.id)}/><p className="save-status" role="status">{saveStatus}</p></>}
    </dialog>
  </>;
}
