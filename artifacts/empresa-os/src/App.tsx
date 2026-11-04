import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertCircle, ArrowRight, ArrowUpRight, BarChart3, Building2, CheckCircle2, ChevronDown, CircleDashed, ClipboardList, Download, Gauge, Layers3, Lightbulb, LoaderCircle, MapPin, Menu, MoreHorizontal, Plus, RefreshCw, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, TrendingUp, X } from 'lucide-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useCreateCompany, useCreateDecisionRule, useCreateOperation, useDeleteDecisionRule, useDeleteOperation, useGetCompanyAnalytics, useGetCompanyDashboard, useGetCompanyInsights, useListCompanies, useListCompanyOperations, useListCompanyRules, useUpdateDecisionRule, useUpdateOperation, getListCompaniesQueryKey, getGetCompanyDashboardQueryKey, getListCompanyOperationsQueryKey, getListCompanyRulesQueryKey, getGetCompanyAnalyticsQueryKey, getGetCompanyInsightsQueryKey } from '@workspace/api-client-react';
import type { Company, CompanyInput, DecisionRule, DecisionRuleInput, DecisionRuleMetric, DecisionRuleOperator, Operation, OperationInput, OperationPriority, OperationStatus } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const navItems = [
  { href: '/', label: 'Visão geral', icon: Gauge },
  { href: '/operacoes', label: 'Operações', icon: ClipboardList },
  { href: '/inteligencia', label: 'Inteligência', icon: BarChart3 },
  { href: '/regras', label: 'Regras internas', icon: Settings2 },
];

function AppShell() {
  const [path] = useLocation();
  const companiesQuery = useListCompanies();
  const companies = companiesQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const stored = localStorage.getItem('nexo-company');
    return stored ? Number(stored) : null;
  });
  const [companyModal, setCompanyModal] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (companies.length && !companies.some((company) => company.id === selectedId)) setSelectedId(companies[0].id);
  }, [companies, selectedId]);
  useEffect(() => {
    if (selectedId !== null) localStorage.setItem('nexo-company', String(selectedId));
  }, [selectedId]);
  const selectedCompany = companies.find((company) => company.id === selectedId);

  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]"><Layers3 size={21} strokeWidth={2.4}/></div>
          <div><div className="font-display text-[17px] font-extrabold tracking-tight text-[#f6f2e7]">nexo<span className="text-[#e9bd63]">.</span></div><div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.2em] text-white/45">centro empresarial</div></div>
          <button aria-label="Fechar navegação" onClick={() => setMobileNav(false)} className="ml-auto rounded p-2 text-white/60 lg:hidden"><X size={18}/></button>
        </div>

        <div className="px-4 pt-6">
          <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/40"><span>Espaço de trabalho</span><span className="mono">{companies.length.toString().padStart(2, '0')}</span></div>
          <div className="relative">
            <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50"/>
            <select aria-label="Selecionar empresa" data-testid="select-company" value={selectedId ?? ''} onChange={(event) => setSelectedId(Number(event.target.value))} className="w-full appearance-none rounded-lg border border-white/10 bg-white/[.07] py-3 pl-10 pr-9 text-[13px] font-semibold text-[#f7f4eb] outline-none transition focus:border-[#d9aa52]">
              {!companies.length && <option value="">Nenhuma empresa</option>}
              {companies.map((company) => <option className="text-slate-900" key={company.id} value={company.id}>{company.name}</option>)}
            </select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50"/>
          </div>
          <button onClick={() => setCompanyModal(true)} data-testid="button-add-company" className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-white/65 transition hover:bg-white/[.07] hover:text-white"><Plus size={15}/> Adicionar empresa</button>
        </div>

        <div className="mt-8 px-4">
          <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/40">Operação</div>
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = path === href;
              return <Link key={href} href={href} data-testid={`link-${href === '/' ? 'overview' : href.slice(1)}`} onClick={() => setMobileNav(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-semibold transition ${active ? 'bg-white/[.11] text-[#f4cf7f]' : 'text-white/65 hover:bg-white/[.06] hover:text-white'}`}><Icon size={17} strokeWidth={active ? 2.3 : 1.8}/><span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#e9bd63]"/>}</Link>;
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-5">
          <div className="flex items-center gap-3 rounded-xl bg-white/[.055] p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d5e4db] text-xs font-bold text-[#275b4f]">NX</div>
            <div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-white/90">Seu espaço</div><div className="mt-0.5 text-[10px] text-white/45">Acesso de gestão</div></div>
            <MoreHorizontal size={17} className="text-white/40"/>
          </div>
          <div className="mt-4 flex items-center gap-2 px-1 text-[10px] text-white/35"><ShieldCheck size={13}/> Recomendações sempre sob revisão humana</div>
        </div>
      </aside>

      {mobileNav && <button aria-label="Fechar menu" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-[#14232d]/45 lg:hidden"/>}
      <main className="min-h-[100dvh] lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-border/80 bg-background/95 px-5 backdrop-blur-md sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button aria-label="Abrir menu" onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-foreground/70 hover:bg-secondary lg:hidden"><Menu size={19}/></button>
            <div className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex"><span>Nexo</span><span className="text-border">/</span><span className="font-semibold text-foreground">{navItems.find((item) => item.href === path)?.label ?? 'Página'}</span></div>
            <div className="sm:hidden text-sm font-semibold">{navItems.find((item) => item.href === path)?.label}</div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCompany && <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground md:flex"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]"/>{selectedCompany.sector}</div>}
            <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-[11px] font-bold text-primary">NX</div>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          {companiesQuery.isLoading ? <LoadingScreen/> : companiesQuery.isError ? <ErrorPanel title="Não foi possível carregar empresas" onRetry={() => companiesQuery.refetch()}/> : !companies.length ? <NoCompanies onCreate={() => setCompanyModal(true)}/> : selectedCompany ? (
            <RoutedErrorBoundary resetKey={path}>
              <Switch>
                <Route path="/" component={() => <DashboardPage company={selectedCompany}/>}/>
                <Route path="/operacoes" component={() => <OperationsPage company={selectedCompany}/>}/>
                <Route path="/inteligencia" component={() => <IntelligencePage company={selectedCompany}/>}/>
                <Route path="/regras" component={() => <RulesPage company={selectedCompany}/>}/>
                <Route component={NotFound}/>
              </Switch>
            </RoutedErrorBoundary>
          ) : <LoadingScreen/>}
        </div>
      </main>
      {companyModal && <CompanyDialog onClose={() => setCompanyModal(false)} onCreated={(company) => { setSelectedId(company.id); setCompanyModal(false); }}/>}
    </div>
  );
}

function RoutedErrorBoundary({ children, resetKey }: { children: ReactNode; resetKey: string }) {
  return <ErrorBoundary resetKey={resetKey}>{children}</ErrorBoundary>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-primary"><span className="h-px w-5 bg-[hsl(var(--accent))]"/>{eyebrow}</div><h1 className="font-display text-[30px] font-extrabold leading-tight tracking-[-.04em] text-foreground sm:text-[38px]">{title}</h1><p className="mt-2 max-w-[620px] text-[13px] leading-relaxed text-muted-foreground sm:text-sm">{description}</p></div>{action}</div>;
}

function Button({ children, onClick, variant = 'primary', disabled, type = 'button', className = '', testId }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean; type?: 'button' | 'submit'; className?: string; testId?: string }) {
  const styles = { primary: 'bg-primary text-primary-foreground hover:brightness-110', secondary: 'border border-border bg-card text-foreground hover:bg-secondary', ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground', danger: 'bg-destructive text-destructive-foreground hover:brightness-110' };
  return <button type={type} onClick={onClick} disabled={disabled} data-testid={testId} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}>{children}</button>;
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-border bg-card shadow-[0_2px_10px_rgba(32,50,54,.025)] ${className}`}>{children}</section>;
}

function LoadingScreen() {
  return <div className="page-in space-y-5"><div className="skeleton h-8 w-56 rounded-lg"/><div className="skeleton h-4 w-80 max-w-full rounded"/><div className="mt-8 grid gap-4 md:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="skeleton h-32 rounded-xl"/> )}</div><div className="skeleton mt-5 h-64 rounded-xl"/></div>;
}

function ErrorPanel({ title, onRetry }: { title: string; onRetry: () => void }) {
  return <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-[#e5c5bd] bg-[#fbf2ef] px-6 text-center"><AlertCircle className="mb-3 text-destructive" size={26}/><h3 className="font-display text-lg font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">Tente novamente. Seus dados não foram alterados.</p><Button className="mt-5" variant="secondary" onClick={onRetry}><RefreshCw size={14}/> Tentar novamente</Button></div>;
}

function EmptyState({ icon: Icon = CircleDashed, title, description, action }: { icon?: typeof CircleDashed; title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-[230px] flex-col items-center justify-center px-5 text-center"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary"><Icon size={21}/></div><h3 className="font-display text-base font-bold">{title}</h3><p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function NoCompanies({ onCreate }: { onCreate: () => void }) {
  return <div className="page-in flex min-h-[62vh] flex-col items-center justify-center text-center"><div className="mb-5 grid h-16 w-16 place-items-center rounded-[22px] bg-[#e3eee8] text-primary"><Building2 size={27}/></div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Nexo Empresarial</div><h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">Tudo começa com uma empresa.</h1><p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Cadastre uma empresa para reunir operações, acompanhar indicadores e transformar sinais em recomendações claras.</p><Button className="mt-7" onClick={onCreate}><Plus size={16}/> Cadastrar empresa</Button></div>;
}

function Dialog({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#12242b]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl sm:p-7 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}><div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-extrabold tracking-tight">{title}</h2>{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}</div><button aria-label="Fechar" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><X size={17}/></button></div>{children}</div></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-foreground/80">{label}</span>{children}</label>;
}

const inputStyle = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/65 focus:border-primary focus:ring-2 focus:ring-primary/10';
function CompanyDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (company: Company) => void }) {
  const queryClient = useQueryClient();
  const createCompany = useCreateCompany();
  const [error, setError] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    const data: CompanyInput = { name: String(form.get('name')).trim(), sector: String(form.get('sector')).trim(), location: String(form.get('location')).trim() };
    createCompany.mutate({ data }, { onSuccess: (company) => { queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() }); onCreated(company); }, onError: () => setError('Não foi possível cadastrar a empresa. Revise os dados e tente novamente.') });
  };
  return <Dialog title="Adicionar empresa" subtitle="Crie um novo espaço para acompanhar a operação." onClose={onClose}><form onSubmit={submit} className="space-y-4"><Field label="Nome da empresa"><input className={inputStyle} name="name" required placeholder="Ex.: Horizonte Logística"/></Field><Field label="Setor"><input className={inputStyle} name="sector" required placeholder="Ex.: Logística"/></Field><Field label="Localização"><input className={inputStyle} name="location" required placeholder="Ex.: São Paulo, SP"/></Field>{error && <p className="text-xs text-destructive">{error}</p>}<div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={createCompany.isPending}>{createCompany.isPending && <LoaderCircle size={14} className="animate-spin"/>} Criar empresa</Button></div></form></Dialog>;
}

function CompanyLabel({ company }: { company: Company }) {
  return <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Building2 size={12}/>{company.sector}</span><span className="inline-flex items-center gap-1"><MapPin size={12}/>{company.location}</span></div>;
}

function StatCard({ label, value, note, icon: Icon, tone = 'green' }: { label: string; value: string | number; note: string; icon: typeof Activity; tone?: 'green' | 'amber' | 'blue' | 'coral' }) {
  const tones = { green: 'bg-[#e6f0ea] text-[#326754]', amber: 'bg-[#f7efdb] text-[#9b762a]', blue: 'bg-[#e6edf0] text-[#426f80]', coral: 'bg-[#f6e9e4] text-[#a15e4d]' };
  return <Panel className="relative overflow-hidden p-5"><div className="flex items-start justify-between"><div><div className="text-[11px] font-semibold text-muted-foreground">{label}</div><div className="mt-3 font-display text-[33px] font-extrabold leading-none tracking-[-.04em]">{value}</div></div><div className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}><Icon size={17}/></div></div><div className="mt-4 text-[10px] text-muted-foreground">{note}</div><div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-primary/35 via-[hsl(var(--accent))]/45 to-transparent"/></Panel>;
}

function DashboardPage({ company }: { company: Company }) {
  const id = company.id;
  const query = useGetCompanyDashboard(id, { query: { enabled: !!id, queryKey: getGetCompanyDashboardQueryKey(id) } });
  const insightQuery = useGetCompanyInsights(id, { query: { enabled: !!id, queryKey: getGetCompanyInsightsQueryKey(id) } });
  const summary = query.data;
  return <div className="page-in">
    <PageHeading eyebrow="Painel de controle" title={`Bom dia, ${company.name}.`} description="Uma leitura clara do que está acontecendo — e do que merece atenção agora." action={<div className="rounded-lg border border-border bg-card px-3 py-2 text-right"><div className="text-[9px] font-bold uppercase tracking-[.13em] text-muted-foreground">Empresa ativa</div><div className="mt-0.5 text-xs font-bold">{company.name}</div></div>}/>
    <CompanyLabel company={company}/>
    {query.isLoading ? <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((i)=><div key={i} className="skeleton h-32 rounded-xl"/> )}</div> : query.isError ? <div className="mt-7"><ErrorPanel title="Resumo indisponível" onRetry={() => query.refetch()}/></div> : summary ? <>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Operações em aberto" value={summary.openOperations} note="Aguardam início ou encaminhamento" icon={ClipboardList} tone="green"/>
        <StatCard label="Em andamento" value={summary.inProgressOperations} note="Trabalho ativo neste momento" icon={Activity} tone="blue"/>
        <StatCard label="Fora do prazo" value={summary.overdueOperations} note="Precisam de uma nova avaliação" icon={AlertCircle} tone="coral"/>
        <StatCard label="Prioridade alta" value={summary.highPriorityOperations} note="Maior impacto potencial" icon={ArrowUpRight} tone="amber"/>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6"><div><div className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Acompanhamento</div><h2 className="mt-1 font-display text-base font-bold">Atividade recente</h2></div><Link href="/operacoes" className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">Ver operações <ArrowRight size={13}/></Link></div>
          {summary.recentOperations.length ? <div className="divide-y divide-border">{summary.recentOperations.slice(0,6).map((operation) => <OperationRow key={operation.id} operation={operation}/>)}</div> : <EmptyState title="Tudo em dia por aqui" description="Quando houver uma nova operação, ela aparecerá nesta lista." icon={CheckCircle2}/>}
        </Panel>
        <Panel className="overflow-hidden">
          <div className="border-b border-border px-5 py-4 sm:px-6"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-primary"><Sparkles size={13}/> Leitura do negócio</div><h2 className="mt-1 font-display text-base font-bold">Recomendações explicáveis</h2></div>
          {insightQuery.isLoading ? <div className="space-y-3 p-5">{[1,2].map(i=><div className="skeleton h-20 rounded-lg" key={i}/>)}</div> : insightQuery.isError ? <ErrorPanel title="Insights indisponíveis" onRetry={() => insightQuery.refetch()}/> : insightQuery.data?.length ? <div className="divide-y divide-border">{insightQuery.data.slice(0,4).map((insight) => <div key={insight.id} className="p-5"><div className="flex items-start justify-between gap-3"><div className="text-xs font-bold leading-snug">{insight.ruleName}</div><Severity severity={insight.severity}/></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{insight.guidance}</p><div className="mono mt-3 text-[10px] text-muted-foreground">Valor atual {insight.actualValue} <span className="mx-1 text-border">/</span> limite {insight.threshold}</div></div>)}</div> : <EmptyState icon={Lightbulb} title="Sem recomendações no momento" description="As regras ativas avaliam os indicadores e explicam quando algo merece atenção." action={<Link href="/regras" className="text-xs font-bold text-primary hover:underline">Revisar regras internas <ArrowRight className="ml-1 inline" size={13}/></Link>}/>}
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_1.4fr]">
        <Panel className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Conclusão</div><h2 className="mt-1 font-display text-base font-bold">Ritmo de entrega</h2></div><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e6f0ea] text-primary"><TrendingUp size={17}/></div></div><div className="mt-6 flex items-end gap-2"><span className="font-display text-[40px] font-extrabold tracking-[-.05em]">{Math.round(summary.completionRate)}%</span><span className="mb-2 text-xs text-muted-foreground">das operações concluídas</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, summary.completionRate))}%` }}/></div><div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>{summary.completedOperations} concluídas</span><span>{summary.openOperations + summary.inProgressOperations + summary.completedOperations} no total</span></div></Panel>
        <Panel className="flex items-center justify-between gap-4 bg-[#e8f0eb] p-5 sm:p-6"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-primary"><Lightbulb size={13}/> Próximo passo</div><h2 className="mt-2 max-w-md font-display text-lg font-extrabold tracking-tight">Transforme o sinal em uma conversa de equipe.</h2><p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">As recomendações orientam a revisão — a decisão continua com quem conhece o contexto.</p></div><Link href="/inteligencia" className="hidden h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:translate-x-1 sm:grid"><ArrowRight size={18}/></Link></Panel>
      </div>
    </> : <div className="mt-7"><EmptyState title="Sem dados para exibir" description="O painel desta empresa ainda não tem indicadores disponíveis."/></div>}
  </div>;
}

function Severity({ severity }: { severity: string }) {
  const cls = severity === 'high' ? 'bg-[#f6e5e0] text-[#a34d3c]' : severity === 'medium' ? 'bg-[#f8efd9] text-[#947021]' : 'bg-[#e5eee9] text-[#3d765f]';
  const label = severity === 'high' ? 'Alta atenção' : severity === 'medium' ? 'Acompanhar' : 'Informativo';
  return <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${cls}`}>{label}</span>;
}

function OperationRow({ operation }: { operation: Operation }) {
  return <div className="flex items-center gap-3 px-5 py-4 sm:px-6"><div className={`h-2 w-2 shrink-0 rounded-full ${operation.status === 'done' ? 'bg-[#64947c]' : operation.status === 'in_progress' ? 'bg-[#6c96a5]' : 'bg-[#d8aa53]'}`}/><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{operation.title}</div><div className="mt-1 truncate text-[10px] text-muted-foreground">{operation.category} <span className="px-1 text-border">·</span>{operation.owner}</div></div><StatusBadge status={operation.status}/><PriorityBadge priority={operation.priority}/></div>;
}

function StatusBadge({ status }: { status: OperationStatus }) {
  const labels: Record<OperationStatus,string> = { open: 'Aberta', in_progress: 'Em andamento', done: 'Concluída' };
  const styles: Record<OperationStatus,string> = { open: 'bg-[#f7efdc] text-[#8e6e2d]', in_progress: 'bg-[#e5eef1] text-[#456f7c]', done: 'bg-[#e5eee9] text-[#3f755f]' };
  return <span className={`whitespace-nowrap rounded-md px-2 py-1 text-[9px] font-bold ${styles[status]}`}>{labels[status]}</span>;
}

function PriorityBadge({ priority }: { priority: OperationPriority }) {
  const labels: Record<OperationPriority,string> = { low: 'Baixa', medium: 'Média', high: 'Alta' };
  return <span className={`hidden whitespace-nowrap text-[9px] font-bold sm:inline ${priority === 'high' ? 'text-destructive' : priority === 'medium' ? 'text-[#9b762a]' : 'text-muted-foreground'}`}>{labels[priority]}</span>;
}

function OperationsPage({ company }: { company: Company }) {
  const id = company.id;
  const client = useQueryClient();
  const query = useListCompanyOperations(id, { query: { enabled: !!id, queryKey: getListCompanyOperationsQueryKey(id) } });
  const create = useCreateOperation();
  const update = useUpdateOperation();
  const remove = useDeleteOperation();
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const refresh = () => { client.invalidateQueries({ queryKey: getListCompanyOperationsQueryKey(id) }); client.invalidateQueries({ queryKey: getGetCompanyDashboardQueryKey(id) }); client.invalidateQueries({ queryKey: getGetCompanyAnalyticsQueryKey(id) }); client.invalidateQueries({ queryKey: getGetCompanyInsightsQueryKey(id) }); };
  const operations = query.data ?? [];
  const filtered = operations.filter((op) => (statusFilter === 'all' || op.status === statusFilter) && `${op.title} ${op.category} ${op.owner}`.toLowerCase().includes(search.toLowerCase()));
  const handleCreate = (data: OperationInput) => create.mutate({ companyId: id, data }, { onSuccess: () => { refresh(); setModal(false); } });
  const updateOp = (op: Operation, data: { status?: OperationStatus; priority?: OperationPriority }) => update.mutate({ operationId: op.id, data }, { onSuccess: refresh });
  const deleteOp = (op: Operation) => { if (window.confirm(`Remover a operação “${op.title}”?`)) remove.mutate({ operationId: op.id }, { onSuccess: refresh }); };
  return <div className="page-in">
    <PageHeading eyebrow="Execução diária" title="Operações" description="Organize o trabalho, ajuste prioridades e acompanhe cada entrega." action={<Button onClick={() => setModal(true)} testId="button-new-operation"><Plus size={15}/> Nova operação</Button>}/>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><CompanyLabel company={company}/><div className="mono text-[10px] text-muted-foreground">{operations.length} {operations.length === 1 ? 'operação' : 'operações'}</div></div>
    <Panel>
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input data-testid="input-search-operations" className={`${inputStyle} py-2 pl-9 text-xs`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar operação, categoria ou responsável"/></div>
        <div className="flex items-center gap-2"><SlidersHorizontal size={14} className="text-muted-foreground"/><select data-testid="select-operation-status" className={`${inputStyle} w-auto py-2 text-xs`} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos os status</option><option value="open">Abertas</option><option value="in_progress">Em andamento</option><option value="done">Concluídas</option></select></div>
      </div>
      {query.isLoading ? <div className="space-y-3 p-5">{[1,2,3,4].map(i=><div key={i} className="skeleton h-14 rounded-lg"/>)}</div> : query.isError ? <ErrorPanel title="Não foi possível carregar as operações" onRetry={() => query.refetch()}/> : !operations.length ? <EmptyState icon={ClipboardList} title="Nenhuma operação cadastrada" description="Registre o primeiro item para organizar o trabalho desta empresa." action={<Button onClick={() => setModal(true)}><Plus size={14}/> Criar operação</Button>}/> : !filtered.length ? <EmptyState icon={Search} title="Nenhum resultado" description="Tente outro termo ou altere o filtro de status."/> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-border bg-secondary/45 text-[9px] font-bold uppercase tracking-[.13em] text-muted-foreground"><th className="px-5 py-3">Operação</th><th className="px-4 py-3">Responsável</th><th className="px-4 py-3">Prazo</th><th className="px-4 py-3">Prioridade</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((op) => <tr key={op.id} data-testid={`row-operation-${op.id}`} className="group transition hover:bg-secondary/30"><td className="px-5 py-4"><div className="text-xs font-bold">{op.title}</div><div className="mt-1 text-[10px] text-muted-foreground">{op.category} <span className="px-1 text-border">·</span>{op.impact}</div></td><td className="px-4 py-4 text-xs">{op.owner}</td><td className="px-4 py-4 text-[11px] text-muted-foreground">{op.dueDate ? formatDate(op.dueDate) : 'Sem prazo'}</td><td className="px-4 py-4"><select aria-label={`Prioridade de ${op.title}`} data-testid={`select-priority-${op.id}`} value={op.priority} onChange={(event) => updateOp(op, { priority: event.target.value as OperationPriority })} className="rounded-md border border-border bg-card px-2 py-1.5 text-[10px] font-semibold outline-none focus:border-primary"><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select></td><td className="px-4 py-4"><select aria-label={`Status de ${op.title}`} data-testid={`select-status-${op.id}`} value={op.status} onChange={(event) => updateOp(op, { status: event.target.value as OperationStatus })} className="rounded-md border border-border bg-card px-2 py-1.5 text-[10px] font-semibold outline-none focus:border-primary"><option value="open">Aberta</option><option value="in_progress">Em andamento</option><option value="done">Concluída</option></select></td><td className="px-4 py-4 text-right"><button aria-label={`Remover ${op.title}`} data-testid={`button-delete-operation-${op.id}`} disabled={remove.isPending} onClick={() => deleteOp(op)} className="rounded-lg p-2 text-muted-foreground opacity-70 transition hover:bg-[#f8e9e5] hover:text-destructive disabled:opacity-30 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>}
    </Panel>
    {(create.isError || update.isError || remove.isError) && <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#e5c5bd] bg-[#fbf2ef] p-3 text-xs text-destructive"><AlertCircle size={14}/> A alteração não foi salva. Tente novamente.</div>}
    {modal && <OperationDialog loading={create.isPending} onClose={() => setModal(false)} onSubmit={handleCreate}/>}
  </div>;
}

function OperationDialog({ onClose, onSubmit, loading }: { onClose: () => void; onSubmit: (data: OperationInput) => void; loading: boolean }) {
  const [error, setError] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    onSubmit({ title: String(form.get('title')).trim(), category: String(form.get('category')).trim(), owner: String(form.get('owner')).trim(), impact: String(form.get('impact')).trim(), status: form.get('status') as OperationStatus, priority: form.get('priority') as OperationPriority, dueDate: String(form.get('dueDate') || '') || null });
  };
  return <Dialog title="Nova operação" subtitle="Registre uma entrega e seu contexto." onClose={onClose} wide><form onSubmit={submit} className="space-y-4"><Field label="Título"><input name="title" className={inputStyle} required placeholder="Ex.: Revisar contratos de fornecedores"/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Categoria"><input name="category" className={inputStyle} required placeholder="Ex.: Financeiro"/></Field><Field label="Responsável"><input name="owner" className={inputStyle} required placeholder="Nome da pessoa"/></Field></div><Field label="Impacto esperado"><input name="impact" className={inputStyle} required placeholder="Qual resultado esta entrega deve gerar?"/></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="Prioridade"><select name="priority" className={inputStyle}><option value="medium">Média</option><option value="high">Alta</option><option value="low">Baixa</option></select></Field><Field label="Status"><select name="status" className={inputStyle}><option value="open">Aberta</option><option value="in_progress">Em andamento</option><option value="done">Concluída</option></select></Field><Field label="Prazo"><input name="dueDate" type="date" className={inputStyle}/></Field></div>{error && <p className="text-xs text-destructive">{error}</p>}<div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={loading}>{loading && <LoaderCircle className="animate-spin" size={14}/>} Salvar operação</Button></div></form></Dialog>;
}

function IntelligencePage({ company }: { company: Company }) {
  const id = company.id;
  const analyticsQuery = useGetCompanyAnalytics(id, { query: { enabled: !!id, queryKey: getGetCompanyAnalyticsQueryKey(id) } });
  const insightsQuery = useGetCompanyInsights(id, { query: { enabled: !!id, queryKey: getGetCompanyInsightsQueryKey(id) } });
  const report = analyticsQuery.data;
  const maxMonthly = Math.max(1, ...(report?.monthly.map((item) => Math.max(item.opened, item.completed)) ?? [1]));
  const totalOps = report?.statuses.reduce((sum, status) => sum + status.count, 0) ?? 0;
  const exportCsv = () => {
    if (!report) return;
    const rows = [['Relatório Nexo Empresarial', company.name], [], ['Mês', 'Abertas', 'Concluídas'], ...report.monthly.map((item) => [item.month, String(item.opened), String(item.completed)]), [], ['Categoria', 'Quantidade'], ...report.categories.map((item) => [item.category, String(item.count)]), [], ['Status', 'Quantidade'], ...report.statuses.map((item) => [statusLabel(item.status), String(item.count)])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"','""')}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `nexo-relatorio-${company.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="page-in">
    <PageHeading eyebrow="Inteligência operacional" title="O que os dados estão dizendo" description="Encontre tendências, entenda a composição do trabalho e revise os sinais que pedem atenção." action={<Button variant="secondary" onClick={exportCsv} disabled={!report} testId="button-export-report"><Download size={15}/> Exportar relatório</Button>}/>
    <div className="mb-6"><CompanyLabel company={company}/></div>
    {analyticsQuery.isLoading ? <div className="grid gap-4 lg:grid-cols-2">{[1,2,3].map(i=><div key={i} className="skeleton h-64 rounded-xl"/>)}</div> : analyticsQuery.isError ? <ErrorPanel title="Relatório indisponível" onRetry={() => analyticsQuery.refetch()}/> : report ? <>
      <div className="mb-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Fluxo de trabalho</div><h2 className="mt-1 font-display text-lg font-bold">Abertas e concluídas</h2><p className="mt-1 text-[11px] text-muted-foreground">Movimento mensal das operações</p></div><div className="flex gap-3 text-[10px] font-semibold"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary"/>Abertas</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]"/>Concluídas</span></div></div>
          {report.monthly.length ? <div className="mt-6 overflow-x-auto"><div className="flex min-w-[480px] items-end justify-between gap-3 border-b border-border px-2 pb-2" style={{ height: 202 }}>{report.monthly.map((month) => <div key={month.month} className="flex h-full flex-1 flex-col items-center justify-end"><div className="flex h-[162px] w-full items-end justify-center gap-1.5">{[[month.opened,'bg-primary'],[month.completed,'bg-[hsl(var(--accent))]']].map(([value,color],i) => <div key={i} className={`w-3/12 max-w-7 rounded-t-md transition-all ${color}`} style={{height: `${Math.max(4, Number(value)/maxMonthly*100)}%`}} title={`${i === 0 ? 'Abertas' : 'Concluídas'}: ${value}`}/>)}</div><div className="mt-3 max-w-full truncate text-[9px] font-semibold text-muted-foreground">{month.month}</div></div>)}</div></div> : <EmptyState title="Sem movimentação mensal" description="O gráfico será preenchido conforme houver atividade."/ >}
        </Panel>
        <Panel className="p-5 sm:p-6"><div className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Visão do volume</div><h2 className="mt-1 font-display text-lg font-bold">Categorias de operação</h2><p className="mt-1 text-[11px] text-muted-foreground">Onde a equipe concentra sua energia</p>
          {report.categories.length ? <div className="mt-6 space-y-4">{report.categories.slice(0,7).map((cat,index) => { const max = Math.max(1,...report.categories.map(c=>c.count)); const colors=['bg-primary','bg-[#d8aa53]','bg-[#7195a0]','bg-[#ce826d]','bg-[#8ba179]','bg-[#9d8caa]']; return <div key={cat.category}><div className="mb-1.5 flex justify-between text-[11px]"><span className="font-semibold">{cat.category}</span><span className="mono text-muted-foreground">{cat.count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${colors[index%colors.length]}`} style={{width:`${cat.count/max*100}%`}}/></div></div>; })}</div> : <EmptyState title="Sem categorias" description="Não há categorias para comparar."/ >}
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-[.8fr_1.4fr]">
        <Panel className="p-5 sm:p-6"><div className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Composição atual</div><h2 className="mt-1 font-display text-lg font-bold">Status das operações</h2><div className="mt-5 space-y-4">{report.statuses.length ? report.statuses.map((item) => <div key={item.status} className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${item.status === 'done' ? 'bg-[#64947c]' : item.status === 'in_progress' ? 'bg-[#7195a0]' : 'bg-[#d8aa53]'}`}/><div className="flex-1 text-xs font-semibold">{statusLabel(item.status)}</div><div className="mono text-xs font-semibold">{item.count}</div><div className="w-14 text-right text-[10px] text-muted-foreground">{totalOps ? Math.round(item.count/totalOps*100) : 0}%</div></div>) : <p className="py-5 text-xs text-muted-foreground">Sem dados de status disponíveis.</p>}</div><div className="mt-6 flex h-2 overflow-hidden rounded-full bg-secondary">{report.statuses.map((item) => <div key={item.status} className={`${item.status === 'done' ? 'bg-[#64947c]' : item.status === 'in_progress' ? 'bg-[#7195a0]' : 'bg-[#d8aa53]'}`} style={{width:`${totalOps ? item.count/totalOps*100 : 0}%`}}/>)}</div></Panel>
        <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-primary"><Sparkles size={13}/> Sinais para revisão</div><h2 className="mt-1 font-display text-base font-bold">Insights explicáveis</h2></div><Link href="/regras" className="text-[10px] font-bold text-primary hover:underline">Ver regras</Link></div>
          {insightsQuery.isLoading ? <div className="space-y-3 p-5">{[1,2].map(i=><div key={i} className="skeleton h-20 rounded-lg"/>)}</div> : insightsQuery.isError ? <ErrorPanel title="Não foi possível carregar os insights" onRetry={() => insightsQuery.refetch()}/> : insightsQuery.data?.length ? <div className="divide-y divide-border">{insightsQuery.data.map((item) => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="font-display text-sm font-bold">{item.ruleName}</div><div className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.guidance}</div><div className="mono mt-2 text-[10px] text-muted-foreground">{metricLabel(item.metric)}: {item.actualValue} <span className="px-1 text-border">·</span> limite {item.threshold}</div></div><Severity severity={item.severity}/></div>)}</div> : <EmptyState icon={CheckCircle2} title="Nenhum sinal para revisar" description="Não há regras ativas disparadas pelos indicadores atuais."/ >}
        </Panel>
      </div>
    </> : <Panel><EmptyState title="Relatório sem dados" description="Quando houver atividade registrada, as tendências aparecerão aqui."/></Panel>}
  </div>;
}

function statusLabel(status: string) { return status === 'done' ? 'Concluídas' : status === 'in_progress' ? 'Em andamento' : status === 'open' ? 'Abertas' : status; }
function metricLabel(metric: string) { return metric === 'overdue_operations' ? 'Operações fora do prazo' : metric === 'high_priority_operations' ? 'Operações de alta prioridade' : 'Operações em aberto'; }

function RulesPage({ company }: { company: Company }) {
  const id = company.id;
  const client = useQueryClient();
  const query = useListCompanyRules(id, { query: { enabled: !!id, queryKey: getListCompanyRulesQueryKey(id) } });
  const create = useCreateDecisionRule();
  const update = useUpdateDecisionRule();
  const remove = useDeleteDecisionRule();
  const [editing, setEditing] = useState<DecisionRule | null>(null);
  const [creating, setCreating] = useState(false);
  const refresh = () => { client.invalidateQueries({ queryKey: getListCompanyRulesQueryKey(id) }); client.invalidateQueries({ queryKey: getGetCompanyInsightsQueryKey(id) }); };
  const save = (data: DecisionRuleInput, rule?: DecisionRule) => {
    if (rule) update.mutate({ ruleId: rule.id, data }, { onSuccess: () => { refresh(); setEditing(null); } });
    else create.mutate({ companyId: id, data }, { onSuccess: () => { refresh(); setCreating(false); } });
  };
  const toggleRule = (rule: DecisionRule) => update.mutate({ ruleId: rule.id, data: { enabled: !rule.enabled } }, { onSuccess: refresh });
  const deleteRule = (rule: DecisionRule) => { if (window.confirm(`Excluir a regra “${rule.name}”?`)) remove.mutate({ ruleId: rule.id }, { onSuccess: refresh }); };
  return <div className="page-in">
    <PageHeading eyebrow="Critérios de atenção" title="Regras internas" description="Defina quando um indicador merece uma recomendação. A equipe revisa cada sugestão antes de agir." action={<Button onClick={() => setCreating(true)} testId="button-new-rule"><Plus size={15}/> Nova regra</Button>}/>
    <div className="mb-6 flex items-center gap-2 rounded-lg border border-[#e6d7b5] bg-[#f8f1df] px-4 py-3 text-[11px] leading-relaxed text-[#705c2d]"><Lightbulb size={15} className="shrink-0"/><span>As regras geram recomendações explicáveis para revisão humana. Nenhuma ação externa é executada automaticamente.</span></div>
    <div className="mb-5 flex items-center justify-between"><CompanyLabel company={company}/><span className="mono text-[10px] text-muted-foreground">{(query.data ?? []).length} regras</span></div>
    {query.isLoading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-32 rounded-xl"/>)}</div> : query.isError ? <ErrorPanel title="Não foi possível carregar as regras" onRetry={() => query.refetch()}/> : query.data?.length ? <div className="space-y-3">{query.data.map((rule) => <Panel key={rule.id} className={`p-5 transition sm:p-6 ${rule.enabled ? '' : 'opacity-75'}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${rule.enabled ? 'bg-[#e5eee9] text-primary' : 'bg-secondary text-muted-foreground'}`}><Settings2 size={18}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-base font-bold">{rule.name}</h2><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${rule.enabled ? 'bg-[#e5eee9] text-[#3f755f]' : 'bg-secondary text-muted-foreground'}`}>{rule.enabled ? 'Ativa' : 'Pausada'}</span></div><div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground"><span className="font-semibold text-foreground/75">{metricLabel(rule.metric)}</span><span>atinge</span><span className="mono rounded bg-secondary px-1.5 py-0.5 font-semibold text-foreground">{operatorLabel(rule.operator)} {rule.threshold}</span></div><div className="mt-3 flex items-start gap-2 rounded-lg bg-background px-3 py-2.5 text-xs leading-relaxed text-muted-foreground"><Lightbulb size={14} className="mt-0.5 shrink-0 text-[#b18b3c]"/><span>{rule.guidance}</span></div></div><div className="flex shrink-0 items-center gap-1 self-end sm:self-start"><button aria-label={rule.enabled ? 'Desativar regra' : 'Ativar regra'} data-testid={`button-toggle-rule-${rule.id}`} disabled={update.isPending} onClick={() => toggleRule(rule)} className={`rounded-lg px-3 py-2 text-[10px] font-bold transition ${rule.enabled ? 'text-muted-foreground hover:bg-secondary' : 'bg-primary text-primary-foreground'}`}>{rule.enabled ? 'Pausar' : 'Ativar'}</button><button aria-label={`Editar ${rule.name}`} data-testid={`button-edit-rule-${rule.id}`} onClick={() => setEditing(rule)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Settings2 size={15}/></button><button aria-label={`Excluir ${rule.name}`} data-testid={`button-delete-rule-${rule.id}`} disabled={remove.isPending} onClick={() => deleteRule(rule)} className="rounded-lg p-2 text-muted-foreground hover:bg-[#f8e9e5] hover:text-destructive"><Trash2 size={15}/></button></div></div></Panel>)}</div> : <Panel><EmptyState icon={Settings2} title="Nenhuma regra configurada" description="Crie critérios internos para destacar indicadores que precisam de uma conversa." action={<Button onClick={() => setCreating(true)}><Plus size={14}/> Criar primeira regra</Button>}/></Panel>}
    {(create.isError || update.isError || remove.isError) && <p className="mt-3 flex items-center gap-2 text-xs text-destructive"><AlertCircle size={14}/> Não foi possível salvar a alteração. Tente novamente.</p>}
    {(creating || editing) && <RuleDialog rule={editing ?? undefined} loading={create.isPending || update.isPending} onClose={() => {setCreating(false);setEditing(null);}} onSubmit={(data) => save(data, editing ?? undefined)}/>}
  </div>;
}

function operatorLabel(operator: DecisionRuleOperator) {
  return ({ gt: '>', gte: '≥', lt: '<', lte: '≤' })[operator];
}

function RuleDialog({ rule, loading, onClose, onSubmit }: { rule?: DecisionRule; loading: boolean; onClose: () => void; onSubmit: (data: DecisionRuleInput) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    onSubmit({ name: String(form.get('name')).trim(), metric: form.get('metric') as DecisionRuleMetric, operator: form.get('operator') as DecisionRuleOperator, threshold: Number(form.get('threshold')), guidance: String(form.get('guidance')).trim(), enabled: form.get('enabled') === 'on' });
  };
  return <Dialog title={rule ? 'Editar regra' : 'Nova regra interna'} subtitle="Escolha um indicador e explique o que a equipe deve revisar." onClose={onClose} wide><form onSubmit={submit} className="space-y-4"><Field label="Nome da regra"><input name="name" className={inputStyle} required defaultValue={rule?.name} placeholder="Ex.: Atenção a atrasos recorrentes"/></Field><Field label="Indicador"><select name="metric" className={inputStyle} defaultValue={rule?.metric ?? 'overdue_operations'}><option value="overdue_operations">Operações fora do prazo</option><option value="high_priority_operations">Operações de alta prioridade</option><option value="open_operations">Operações em aberto</option></select></Field><div className="grid gap-4 sm:grid-cols-[1fr_1fr]"><Field label="Condição"><select name="operator" className={inputStyle} defaultValue={rule?.operator ?? 'gt'}><option value="gt">Maior que (&gt;)</option><option value="gte">Maior ou igual (≥)</option><option value="lt">Menor que (&lt;)</option><option value="lte">Menor ou igual (≤)</option></select></Field><Field label="Limite"><input name="threshold" type="number" min="0" step="1" className={inputStyle} required defaultValue={rule?.threshold ?? 3}/></Field></div><Field label="Orientação para revisão humana"><textarea name="guidance" className={`${inputStyle} min-h-[94px] resize-y`} required defaultValue={rule?.guidance} placeholder="Descreva o que vale a pena conferir e por quê."/></Field><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold"><input name="enabled" type="checkbox" defaultChecked={rule?.enabled ?? true} className="h-4 w-4 accent-[hsl(var(--primary))]"/> Regra ativa</label><div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={loading}>{loading && <LoaderCircle size={14} className="animate-spin"/>} {rule ? 'Salvar alterações' : 'Criar regra'}</Button></div></form></Dialog>;
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0,10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}

function Router() {
  return <ErrorBoundary><Switch><Route path="/" component={AppShell}/><Route path="/operacoes" component={AppShell}/><Route path="/inteligencia" component={AppShell}/><Route path="/regras" component={AppShell}/><Route component={NotFound}/></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}

export default App;
