"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Inbox, Users, LogOut, Plus, Megaphone, Bell, Loader2, ClipboardList, HelpCircle, GraduationCap, BarChart3, Settings, FolderClosed } from "lucide-react";
import { toast } from "sonner";
import { User, Ticket, Aviso } from "@/types";
import { ChatModal } from "@/components/chat-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function StudentDashboard() {
  const router = useRouter();

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Tab state: 'inicio' | 'tickets' | 'comunidade'
  const [activeTab, setActiveTab] = useState<"inicio" | "tickets" | "comunidade">("inicio");

  // Data states
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [publicTickets, setPublicTickets] = useState<Ticket[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Modal open states
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [chatTicketId, setChatTicketId] = useState<number | null>(null);

  // Form states
  const [ticketTitulo, setTicketTitulo] = useState("");
  const [ticketCategoria, setTicketCategoria] = useState("");
  const [ticketDescricao, setTicketDescricao] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Check auth on load
  useEffect(() => {
    const userString = localStorage.getItem("usuarioLogado");
    const token = localStorage.getItem("token");

    if (!userString || !token) {
      toast.error("Você precisa fazer login primeiro!");
      router.push("/");
      return;
    }

    const user: User = JSON.parse(userString);
    if (user.is_admin === 1 || user.is_admin === true) {
      toast.error("Painel incorreto. Redirecionando para o painel de administrador.");
      router.push("/admin");
      return;
    }

    setCurrentUser(user);
    setIsLoadingAuth(false);
  }, [router]);

  // Load dashboard data once authenticated
  useEffect(() => {
    if (isLoadingAuth) return;
    loadDashboardData();
  }, [isLoadingAuth, activeTab]);

  const loadDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Load my tickets
      const ticketsRes = await fetch("/api/tickets", { headers });
      if (ticketsRes.ok) {
        const ticketsData: Ticket[] = await ticketsRes.json();
        setMyTickets(ticketsData);
      }

      // Load announcements
      const avisosRes = await fetch("/api/avisos", { headers });
      if (avisosRes.ok) {
        const avisosData: Aviso[] = await avisosRes.json();
        setAvisos(avisosData);
      }

      // Load community mural if active tab is comunidade
      if (activeTab === "comunidade") {
        const publicRes = await fetch("/api/tickets/public", { headers });
        if (publicRes.ok) {
          const publicData: Ticket[] = await publicRes.json();
          setPublicTickets(publicData);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar os dados do painel.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("token");
    toast.success("Sessão encerrada com sucesso!");
    router.push("/");
  };

  const handleCloseTicket = async (ticketId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o modal de chat ao clicar no botão
    if (!confirm(`Deseja realmente encerrar o chamado #${ticketId}?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tickets/${ticketId}/close`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success(`Chamado #${ticketId} encerrado com sucesso.`);
        loadDashboardData();
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao encerrar chamado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitulo || !ticketCategoria || !ticketDescricao) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: ticketTitulo,
          categoria_id: parseInt(ticketCategoria),
          descricao: ticketDescricao
        })
      });

      if (res.ok) {
        toast.success("Chamado aberto com sucesso! Nossa equipe foi notificada.");
        setTicketTitulo("");
        setTicketCategoria("");
        setTicketDescricao("");
        setIsNewTicketOpen(false);
        loadDashboardData();
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao abrir chamado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de rede. Tente novamente.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 text-blue-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Verificando credenciais...</span>
        </div>
      </div>
    );
  }

  const activeTickets = myTickets.filter(t => t.status === "pendente" || t.status === "em_andamento");
  const getInitials = (name?: string) => {
    if (!name) return "QT";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatarInitials = getInitials(currentUser?.nome);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-base dark:bg-zinc-950 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-sidebar-user text-slate-100 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-col items-start gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="QuickTickets Logo" className="h-[38px] w-auto object-contain block" />
              <span className="text-[10px] font-extrabold text-white/40 tracking-wider uppercase font-heading">PORTAL - ESTUDANTE</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("inicio")}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                activeTab === "inicio" ? "bg-primary-corp text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
              Início
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                activeTab === "tickets" ? "bg-primary-corp text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              }`}
            >
              <Inbox className="h-4.5 w-4.5 shrink-0" />
              Chamados
            </button>
            <button
              onClick={() => setActiveTab("comunidade")}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                activeTab === "comunidade" ? "bg-primary-corp text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              }`}
            >
              <GraduationCap className="h-4.5 w-4.5 shrink-0" />
              Mural da Comunidade
            </button>
            <button
              disabled
              className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold text-white/20 cursor-not-allowed select-none"
            >
              <BarChart3 className="h-4.5 w-4.5 shrink-0" />
              Relatórios
            </button>
            <button
              disabled
              className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold text-white/20 cursor-not-allowed select-none"
            >
              <Settings className="h-4.5 w-4.5 shrink-0" />
              Configurações
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <button
            onClick={() => toast.info("Central de Ajuda estará disponível em breve.")}
            className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold text-slate-450 hover:bg-slate-800/50 hover:text-slate-100 transition-colors"
          >
            <HelpCircle className="h-4.5 w-4.5 shrink-0" />
            Central de Ajuda
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 shrink-0">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight select-none">
            {activeTab === "inicio" && "Início"}
            {activeTab === "tickets" && "Chamados"}
            {activeTab === "comunidade" && "Mural da Comunidade"}
          </h1>

          <div className="flex items-center gap-5">
            {/* Notification bell */}
            <button className="text-slate-400 hover:text-slate-600 transition-colors relative flex items-center justify-center">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500" />
            </button>

            {/* Profile badge */}
            <div className="flex items-center gap-3 select-none">
              <div className="h-10 w-10 rounded-full bg-primary-corp text-white flex items-center justify-center font-bold text-sm">
                {avatarInitials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-bold text-slate-800 truncate max-w-[130px]">{currentUser?.nome}</span>
                <span className="text-xs text-slate-400 font-medium">{currentUser?.cargo || "Estudante"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel View Wrapper */}
        <div className="p-6 md:p-8 flex-1">
          {/* TAB 1: INÍCIO (HOME DASHBOARD) */}
          {activeTab === "inicio" && (
            <div className="space-y-8">
              {/* Hero Banner Welcome Card */}
              <div className="bg-gradient-to-r from-[#001530] via-[#052c56] to-[#0d599c] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg select-none">
                <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10 max-w-lg">
                  <h2 className="text-3xl font-black text-white">Olá, {currentUser?.nome}! 👋</h2>
                  <p className="text-sm text-blue-100/90 mt-2 font-medium leading-relaxed">
                    {isLoadingData
                      ? "Buscando o status de seus tickets..."
                      : activeTickets.length === 0
                      ? "Você está em dia! Não possui tickets em atendimento ou pendentes no momento."
                      : activeTickets.length === 1
                      ? "Você tem 1 ticket em atendimento e um aviso importante da coordenação."
                      : `Você tem ${activeTickets.length} tickets em atendimento e um aviso importante da coordenação.`}
                  </p>
                  <button
                    onClick={() => setIsNewTicketOpen(true)}
                    className="mt-5 flex items-center gap-2 bg-[#00afef] hover:bg-[#0093ca] text-white active:scale-95 px-5 py-3 rounded-lg text-xs font-bold transition-all shadow-md shadow-accent-blue/10 tracking-wider cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    ABRIR NOVO TICKET
                  </button>
                </div>
              </div>

              {/* Split Content Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Columns: Active Tickets Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center select-none">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Meus Tickets Ativos</h3>
                    <button
                      onClick={() => setActiveTab("tickets")}
                      className="text-xs font-bold text-[#00afef] hover:underline"
                    >
                      Ver todos os tickets
                    </button>
                  </div>

                  {isLoadingData ? (
                    <div className="flex items-center justify-center p-12 bg-white border border-slate-100 rounded-2xl">
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    </div>
                  ) : activeTickets.length === 0 ? (
                    <div className="p-10 border border-dashed border-slate-200 bg-white rounded-2xl text-center select-none">
                      <ClipboardList className="h-9 w-9 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-semibold text-slate-500">Nenhum ticket ativo no momento.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeTickets.map(ticket => (
                        <div
                          key={ticket.id}
                          onClick={() => setChatTicketId(ticket.id)}
                          className={`bg-white border border-slate-100 hover:border-primary-corp/20 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none flex flex-col justify-between ${
                            ticket.status === "pendente"
                              ? "border-t-4 border-t-amber-500"
                              : "border-t-4 border-t-primary-corp"
                          }`}
                        >
                          <div className="flex gap-4 items-start">
                            {/* Red Folder Icon Block */}
                            <div className="h-12 w-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                              <FolderClosed className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1">
                                  {ticket.titulo || ticket.categoria}
                                </h4>
                                <span className={`text-[10px] font-bold shrink-0 uppercase tracking-wide ${
                                  ticket.status === "pendente"
                                    ? "text-amber-500"
                                    : "text-primary-corp"
                                }`}>
                                  {ticket.status === "pendente" ? "ABERTO" : "ATENDIMENTO"}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                {ticket.categoria} - Chamado #{ticket.id}
                              </p>
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                                {ticket.descricao}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-slate-50 pt-3 mt-4 flex justify-between items-center select-none">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary-corp text-white flex items-center justify-center font-bold text-[10px]">
                                {getInitials(ticket.cliente || currentUser?.nome)}
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Criado em {new Date(ticket.criado_em).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            
                            <button
                              onClick={(e) => handleCloseTicket(ticket.id, e)}
                              className="border border-red-200 text-red-500 hover:bg-rose-50 rounded-lg px-3.5 py-1 text-xs font-bold transition-all cursor-pointer"
                            >
                              Encerrar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Columns: Megaphone notices */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center select-none">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Avisos</h3>
                    <HelpCircle className="h-4.5 w-4.5 text-[#00afef]" />
                  </div>

                  {isLoadingData ? (
                    <div className="flex items-center justify-center p-12 bg-white border border-slate-100 rounded-2xl">
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    </div>
                  ) : avisos.length === 0 ? (
                    <div className="p-10 bg-white border border-slate-150 rounded-2xl text-center select-none">
                      <p className="text-xs font-semibold text-red-500">Erro ao buscar avisos.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {avisos.map(aviso => (
                        <div
                          key={aviso.id}
                          className="bg-white border border-slate-100 p-4.5 rounded-2xl select-none"
                        >
                          <h4 className="text-xs font-extrabold text-slate-800">{aviso.titulo}</h4>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{aviso.mensagem}</p>
                          <div className="mt-3.5 text-[9px] text-slate-400 font-bold flex justify-between items-center border-t border-slate-50 pt-2.5">
                            <span>Por: {aviso.autor || "Coordenação"}</span>
                            <span>{new Date(aviso.data_criacao).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HISTÓRICO DE TICKETS */}
          {activeTab === "tickets" && (
            <div className="space-y-4">
              {isLoadingData ? (
                <div className="flex items-center justify-center p-24 bg-white border border-slate-100 rounded-2xl">
                  <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
                </div>
              ) : myTickets.length === 0 ? (
                <div className="p-16 border border-dashed border-slate-200 bg-white rounded-2xl text-center select-none">
                  <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-semibold text-slate-500">Você ainda não possui nenhum chamado no histórico.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setChatTicketId(ticket.id)}
                      className={`bg-white border border-slate-100 hover:border-primary-corp/20 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none flex flex-col justify-between ${
                        ticket.status === "pendente"
                          ? "border-t-4 border-t-amber-500"
                          : ticket.status === "em_andamento"
                          ? "border-t-4 border-t-primary-corp"
                          : "border-t-4 border-t-emerald-500"
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        {/* Red Folder Icon Block */}
                        <div className="h-12 w-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                          <FolderClosed className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1">
                              {ticket.titulo || ticket.categoria}
                            </h4>
                            <span className={`text-[10px] font-bold shrink-0 uppercase tracking-wide ${
                              ticket.status === "pendente"
                                ? "text-amber-500"
                                : ticket.status === "em_andamento"
                                ? "text-primary-corp"
                                : "text-emerald-500"
                            }`}>
                              {ticket.status === "pendente" ? "ABERTO" : ticket.status === "em_andamento" ? "ATENDIMENTO" : "RESOLVIDO"}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                            {ticket.categoria} - Chamado #{ticket.id}
                          </p>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                            {ticket.descricao}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-50 pt-3 mt-4 flex justify-between items-center select-none">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary-corp text-white flex items-center justify-center font-bold text-[10px]">
                            {getInitials(ticket.cliente || currentUser?.nome)}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Criado em {new Date(ticket.criado_em).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        
                        {(ticket.status === "pendente" || ticket.status === "em_andamento") && (
                          <button
                            onClick={(e) => handleCloseTicket(ticket.id, e)}
                            className="border border-red-200 text-red-500 hover:bg-rose-50 rounded-lg px-3.5 py-1 text-xs font-bold transition-all cursor-pointer"
                          >
                            Encerrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MURAL DA COMUNIDADE */}
          {activeTab === "comunidade" && (
            <div className="space-y-4">
              {isLoadingData ? (
                <div className="flex items-center justify-center p-24 bg-white border border-slate-100 rounded-2xl">
                  <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
                </div>
              ) : publicTickets.length === 0 ? (
                <div className="p-16 border border-slate-100 bg-white rounded-2xl text-center select-none">
                  <p className="text-xs font-semibold text-slate-500">Não há chamados públicos da comunidade no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publicTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setChatTicketId(ticket.id)}
                      className={`bg-white border border-slate-100 hover:border-primary-corp/20 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none flex flex-col justify-between ${
                        ticket.status === "pendente"
                          ? "border-t-4 border-t-amber-500"
                          : "border-t-4 border-t-primary-corp"
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        {/* Red Folder Icon Block */}
                        <div className="h-12 w-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                          <FolderClosed className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1">
                              {ticket.titulo || ticket.categoria}
                            </h4>
                            <span className={`text-[10px] font-bold shrink-0 uppercase tracking-wide ${
                              ticket.status === "pendente"
                                ? "text-amber-500"
                                : "text-primary-corp"
                            }`}>
                              {ticket.status === "pendente" ? "ABERTO" : "ATENDIMENTO"}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                            {ticket.categoria} - Chamado #{ticket.id}
                          </p>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                            {ticket.descricao}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-50 pt-3 mt-4 flex justify-between items-center select-none">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary-corp text-white flex items-center justify-center font-bold text-[10px]">
                            {getInitials(ticket.cliente || ticket.cliente_nome)}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Criado em {new Date(ticket.criado_em).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        
                        {(ticket.status === "pendente" || ticket.status === "em_andamento") && ticket.usuario_id === currentUser?.id && (
                          <button
                            onClick={(e) => handleCloseTicket(ticket.id, e)}
                            className="border border-red-200 text-red-500 hover:bg-rose-50 rounded-lg px-3.5 py-1 text-xs font-bold transition-all cursor-pointer"
                          >
                            Encerrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button (FAB) Triggering New Ticket Dialog */}
      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
        <DialogTrigger render={
          <button className="fixed bottom-8 right-8 bg-primary-corp text-white hover:bg-primary-corp-hover active:scale-95 px-5 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-primary-corp/25 cursor-pointer select-none font-bold text-xs tracking-wider z-30 transition-all">
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>NOVO TICKET</span>
          </button>
        } />
        <DialogContent className="sm:max-w-[480px] rounded-2xl border border-slate-100 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Abrir Novo Chamado</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Preencha os detalhes da sua solicitação para que possamos te ajudar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label htmlFor="titulo" className="text-xs font-bold text-slate-600">Assunto / Título</label>
              <input
                id="titulo"
                type="text"
                required
                value={ticketTitulo}
                onChange={(e) => setTicketTitulo(e.target.value)}
                placeholder="Ex: Problema com nota, equipamento quebrado..."
                className="w-full h-10 border border-slate-200 rounded-xl px-4.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500/40 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="categoria" className="text-xs font-bold text-slate-600">Categoria</label>
              <select
                id="categoria"
                required
                value={ticketCategoria}
                onChange={(e) => setTicketCategoria(e.target.value)}
                className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500/40 transition-all select-none"
              >
                <option value="" disabled>Selecione uma categoria...</option>
                <option value="1">Preciso de ajuda acadêmica</option>
                <option value="2">Equipamento ou Infraestrutura</option>
                <option value="3">Problemas Financeiros ou Secretaria</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="descricao" className="text-xs font-bold text-slate-600">Descrição do Problema</label>
              <textarea
                id="descricao"
                required
                rows={4}
                value={ticketDescricao}
                onChange={(e) => setTicketDescricao(e.target.value)}
                placeholder="Detalhe o máximo possível o que está acontecendo..."
                className="w-full border border-slate-200 rounded-xl p-3.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500/40 transition-all"
              />
            </div>

            <div className="flex justify-end gap-3.5 pt-3.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="px-4.5 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingTicket}
                className="px-4.5 h-10 rounded-xl bg-primary-corp hover:bg-primary-corp-hover text-white transition-colors text-xs font-bold disabled:bg-slate-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingTicket && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Enviar Chamado
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chat Window modal overlay */}
      {chatTicketId && (
        <ChatModal
          ticketId={chatTicketId}
          onClose={() => {
            setChatTicketId(null);
            loadDashboardData();
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
