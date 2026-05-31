"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  LogOut,
  Plus,
  Megaphone,
  Bell,
  Loader2,
  ClipboardList,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  BarChart3,
  ShieldAlert,
  Check,
  Search,
  UserCheck,
  Shield,
  FolderClosed
} from "lucide-react";
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

export default function AdminDashboard() {
  const router = useRouter();

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Tab state: 'fila' | 'resolvidos' | 'usuarios' | 'avisos' | 'relatorios'
  const [activeTab, setActiveTab] = useState<"fila" | "resolvidos" | "usuarios" | "avisos" | "relatorios">("fila");

  // Data states
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<Ticket[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [avisosList, setAvisosList] = useState<Aviso[]>([]);
  const [statusStats, setStatusStats] = useState({ pendente: 0, em_andamento: 0, finalizado: 0 });
  const [reportTickets, setReportTickets] = useState<Ticket[]>([]);
  const [reportPeriod, setReportPeriod] = useState<"dia" | "semana" | "mes">("dia");
  
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [chatTicketId, setChatTicketId] = useState<number | null>(null);

  // Status/Deadline modal state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<"pendente" | "em_andamento" | "finalizado">("pendente");
  const [ticketPrazo, setTicketPrazo] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // User Management Dialog States
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserCargo, setEditUserCargo] = useState("");
  const [editUserIsAdmin, setEditUserIsAdmin] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Register Admin Form States
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminCargo, setNewAdminCargo] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // Notices Form States
  const [avisoTitulo, setAvisoTitulo] = useState("");
  const [avisoMensagem, setAvisoMensagem] = useState("");
  const [isSubmittingAviso, setIsSubmittingAviso] = useState(false);

  // Verification user auth
  useEffect(() => {
    const userString = localStorage.getItem("usuarioLogado");
    const token = localStorage.getItem("token");

    if (!userString || !token) {
      toast.error("Acesso não autorizado. Faça login primeiro!");
      router.push("/");
      return;
    }

    const user: User = JSON.parse(userString);
    const isAdmin = user.is_admin === 1 || user.is_admin === true;
    if (!isAdmin) {
      toast.error("Você não tem privilégios de administrador!");
      router.push("/dashboard");
      return;
    }

    setCurrentUser(user);
    setIsLoadingAuth(false);
  }, [router]);

  // Load appropriate data when tab or parameters change
  useEffect(() => {
    if (isLoadingAuth) return;
    loadData();
  }, [isLoadingAuth, activeTab, reportPeriod]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Load Statistics (always useful)
      const statsRes = await fetch("/api/admin/dashboard", { headers });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setStatusStats(stats);
      }

      if (activeTab === "fila") {
        const res = await fetch("/api/admin/tickets", { headers });
        if (res.ok) {
          const data: Ticket[] = await res.json();
          setActiveTickets(data);
        }
      } else if (activeTab === "resolvidos") {
        const res = await fetch("/api/admin/tickets/finalizados", { headers });
        if (res.ok) {
          const data: Ticket[] = await res.json();
          setResolvedTickets(data);
        }
      } else if (activeTab === "usuarios") {
        const res = await fetch("/api/admin/users", { headers });
        if (res.ok) {
          const data: User[] = await res.json();
          setUsersList(data);
        }
      } else if (activeTab === "avisos") {
        const res = await fetch("/api/avisos", { headers });
        if (res.ok) {
          const data: Aviso[] = await res.json();
          setAvisosList(data);
        }
      } else if (activeTab === "relatorios") {
        const res = await fetch(`/api/admin/reports?periodo=${reportPeriod}`, { headers });
        if (res.ok) {
          const data: Ticket[] = await res.json();
          setReportTickets(data);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados.");
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

  // Assume Ticket Handler
  const handleAssumeTicket = async (ticket: Ticket) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/tickets/${ticket.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "em_andamento",
          prazo: ticket.prazo // Keeps current deadline if any
        })
      });

      if (res.ok) {
        toast.success(`Você assumiu o chamado #${ticket.id}! O cliente foi notificado.`);
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao assumir chamado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    }
  };

  // Open Status Dialog Handler
  const openStatusDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketStatus(ticket.status);
    // Format prazo for datetime-local value (YYYY-MM-DDTHH:MM)
    if (ticket.prazo) {
      const d = new Date(ticket.prazo);
      // Adjust timezone offset
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      setTicketPrazo(localISOTime);
    } else {
      setTicketPrazo("");
    }
    setIsStatusDialogOpen(true);
  };

  // Save Status/Deadline Handler
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: ticketStatus,
          prazo: ticketPrazo ? new Date(ticketPrazo).toISOString() : null
        })
      });

      if (res.ok) {
        toast.success(`Chamado #${selectedTicket.id} atualizado com sucesso!`);
        setIsStatusDialogOpen(false);
        setSelectedTicket(null);
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao atualizar chamado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Finalize Ticket Handler Directly
  const handleFinalizeTicket = async (ticketId: number) => {
    if (!confirm(`Deseja realmente finalizar o chamado #${ticketId}?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "finalizado",
          prazo: null
        })
      });

      if (res.ok) {
        toast.success(`Chamado #${ticketId} finalizado com sucesso!`);
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao finalizar chamado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    }
  };

  // Admin Registration
  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail || !newAdminPassword) {
      toast.error("Preencha os campos obrigatórios para cadastro.");
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: newAdminName,
          email: newAdminEmail,
          senha: newAdminPassword,
          cargo: newAdminCargo || "Administrador"
        })
      });

      if (res.ok) {
        toast.success("Novo administrador cadastrado com sucesso!");
        setNewAdminName("");
        setNewAdminEmail("");
        setNewAdminPassword("");
        setNewAdminCargo("");
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao cadastrar administrador.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // User details update
  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setEditUserName(user.nome);
    setEditUserEmail(user.email);
    setEditUserCargo(user.cargo || "");
    setEditUserIsAdmin(user.is_admin === 1 || user.is_admin === true);
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsUpdatingUser(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: editUserName,
          email: editUserEmail,
          cargo: editUserCargo,
          is_admin: editUserIsAdmin
        })
      });

      if (res.ok) {
        toast.success("Usuário atualizado com sucesso!");
        setIsEditUserOpen(false);
        setSelectedUser(null);
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao atualizar usuário.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de rede.");
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (userId: number) => {
    if (currentUser && userId === currentUser.id) {
      toast.error("Você não pode remover sua própria conta de administrador!");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir permanentemente este usuário? Esta ação não pode ser desfeita.")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Usuário removido com sucesso!");
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao remover usuário.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    }
  };

  // Notices Board Publisher
  const handlePublishAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTitulo || !avisoMensagem) {
      toast.error("Preencha título e mensagem para publicar.");
      return;
    }

    setIsSubmittingAviso(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/avisos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: avisoTitulo,
          mensagem: avisoMensagem
        })
      });

      if (res.ok) {
        toast.success("Aviso publicado com sucesso!");
        setAvisoTitulo("");
        setAvisoMensagem("");
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao publicar aviso.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    } finally {
      setIsSubmittingAviso(false);
    }
  };

  // Delete Notice Handler
  const handleDeleteAviso = async (avisoId: number) => {
    if (!confirm("Deseja realmente remover este aviso do mural?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/avisos/${avisoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Aviso removido com sucesso!");
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao remover aviso.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Autenticando administrador...</span>
        </div>
      </div>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return "QT";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatarInitials = getInitials(currentUser?.nome);

  // Report statistics calculations
  const totalReportCount = reportTickets.length;
  const resolvedReportCount = reportTickets.filter(t => t.status === "finalizado").length;
  const percentageSolved = totalReportCount > 0 ? Math.round((resolvedReportCount / totalReportCount) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-base dark:bg-zinc-950 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-sidebar-admin text-slate-100 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-col items-start gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="QuickTickets Logo" className="h-[38px] w-auto object-contain block" />
              <span className="text-[10px] font-extrabold text-[#10b981] tracking-wider uppercase font-heading">Painel do Administrador</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("fila")}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "fila"
                  ? "bg-[#1e293b] text-white border-l-4 border-emerald-500 rounded-l-none pl-3.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 pl-4.5"
              }`}
            >
              <Inbox className="h-4.5 w-4.5 shrink-0" />
              Fila de Atendimento
              {statusStats.pendente + statusStats.em_andamento > 0 && (
                <span className="ml-auto bg-amber-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                  {statusStats.pendente + statusStats.em_andamento}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("resolvidos")}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "resolvidos"
                  ? "bg-[#1e293b] text-white border-l-4 border-emerald-500 rounded-l-none pl-3.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 pl-4.5"
              }`}
            >
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              Histórico / Resolvidos
            </button>
            <button
              onClick={() => setActiveTab("usuarios")}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "usuarios"
                  ? "bg-[#1e293b] text-white border-l-4 border-emerald-500 rounded-l-none pl-3.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 pl-4.5"
              }`}
            >
              <Users className="h-4.5 w-4.5 shrink-0" />
              Gerenciar Usuários
            </button>
            <button
              onClick={() => setActiveTab("avisos")}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "avisos"
                  ? "bg-[#1e293b] text-white border-l-4 border-emerald-500 rounded-l-none pl-3.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 pl-4.5"
              }`}
            >
              <Megaphone className="h-4.5 w-4.5 shrink-0" />
              Mural de Avisos
            </button>
            <button
              onClick={() => setActiveTab("relatorios")}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "relatorios"
                  ? "bg-[#1e293b] text-white border-l-4 border-emerald-500 rounded-l-none pl-3.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 pl-4.5"
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5 shrink-0" />
              Relatórios e Métricas
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-colors"
          >
            <Shield className="h-4.5 w-4.5 shrink-0" />
            Visão do Aluno
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
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 shrink-0">
          <h1 className="text-md font-extrabold text-slate-800 uppercase tracking-wider select-none">
            {activeTab === "fila" && "Fila Ativa de Suporte"}
            {activeTab === "resolvidos" && "Chamados Finalizados"}
            {activeTab === "usuarios" && "Usuários & Permissões"}
            {activeTab === "avisos" && "Publicação de Comunicados"}
            {activeTab === "relatorios" && "Painel Analítico e Métricas"}
          </h1>

          <div className="flex items-center gap-5">
            {/* Quick Metrics display */}
            <div className="hidden lg:flex items-center gap-3 text-xs font-bold text-slate-500 border-r border-slate-150 pr-5 select-none">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /> {statusStats.pendente} pendentes</span>
              <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 text-primary-corp animate-spin" /> {statusStats.em_andamento} em atendimento</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {statusStats.finalizado} resolvidos</span>
            </div>

            {/* Profile badge */}
            <div className="flex items-center gap-3 select-none">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs">
                {avatarInitials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{currentUser?.nome}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{currentUser?.cargo || "Administrador"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel View Wrapper */}
        <div className="p-6 md:p-8 flex-1">
          {isLoadingData && (
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-400 bg-white border border-slate-100 p-3 rounded-xl animate-pulse">
              <Loader2 className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
              Sincronizando com o banco de dados...
            </div>
          )}

          {/* TAB 1: FILA DE ATENDIMENTO */}
          {activeTab === "fila" && (
            <div className="space-y-6">
              {activeTickets.length === 0 ? (
                <div className="p-16 border border-dashed border-slate-200 bg-white rounded-2xl text-center select-none">
                  <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-slate-700">Fila limpa!</h3>
                  <p className="text-xs text-slate-400 mt-1">Nenhum chamado aberto ou pendente precisando de atenção no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {activeTickets.map(ticket => {
                    const isMyAssigned = ticket.status === "em_andamento";
                    const formattedDate = new Date(ticket.criado_em).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    
                    return (
                      <div
                        key={ticket.id}
                        className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between relative ${
                          ticket.status === "em_andamento"
                            ? "border-t-4 border-t-primary-corp"
                            : "border-t-4 border-t-amber-500"
                        }`}
                      >
                        {/* Ticket Card Header & Body */}
                        <div className="flex gap-4 items-start">
                          {/* Red Folder Icon Block */}
                          <div className="h-12 w-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                            <FolderClosed className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-sm font-extrabold text-slate-800 line-clamp-1">
                                {ticket.titulo || ticket.categoria}
                              </h3>
                              <div className="flex items-center gap-2 shrink-0">
                                {ticket.prazo && (
                                  <span className="text-[9px] font-extrabold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1 select-none">
                                    <Calendar className="h-3 w-3" />
                                    Prazo: {new Date(ticket.prazo).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${
                                  ticket.status === "pendente"
                                    ? "text-amber-500"
                                    : "text-primary-corp"
                                }`}>
                                  {ticket.status === "pendente" ? "ABERTO" : "ATENDIMENTO"}
                                </span>
                              </div>
                            </div>

                            {/* Client Metadata block */}
                            <div className="bg-slate-50 border border-slate-100/50 p-2.5 rounded-xl mt-3 text-xs space-y-1">
                              <p className="text-slate-600"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Aluno:</span> {ticket.cliente || "Estudante"}</p>
                              <p className="text-slate-600"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Categoria:</span> {ticket.categoria}</p>
                              <p className="text-slate-600"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Criado em:</span> {formattedDate}</p>
                            </div>

                            <p className="text-xs text-slate-500 mt-3 line-clamp-3 leading-relaxed font-medium">
                              {ticket.descricao}
                            </p>
                          </div>
                        </div>

                        {/* Ticket Card Footer Controls */}
                        <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 select-none">
                            <div className="h-6 w-6 rounded-full bg-primary-corp text-white flex items-center justify-center font-bold text-[10px]">
                              {getInitials(ticket.cliente)}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Criado por {ticket.cliente || "Estudante"}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setChatTicketId(ticket.id)}
                              className="bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-800 active:scale-95 px-3 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Inbox className="h-3.5 w-3.5" />
                              Chat
                            </button>

                            {ticket.status === "pendente" ? (
                              <button
                                onClick={() => handleAssumeTicket(ticket)}
                                className="bg-primary-corp text-white hover:bg-primary-corp-hover active:scale-95 px-3 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                Assumir
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => openStatusDialog(ticket)}
                                  className="border border-slate-200 text-slate-650 hover:bg-slate-50 active:scale-95 px-2.5 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                                  title="Definir prazo / Alterar status"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleFinalizeTicket(ticket.id)}
                                  className="bg-emerald-550 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-250 active:scale-95 px-3 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  Finalizar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHAMADOS RESOLVIDOS */}
          {activeTab === "resolvidos" && (
            <div className="space-y-6">
              {resolvedTickets.length === 0 ? (
                <div className="p-16 bg-white border border-slate-100 rounded-2xl text-center select-none">
                  <p className="text-xs font-semibold text-slate-500">Nenhum chamado no histórico de finalizados.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider select-none">
                          <th className="p-4 pl-6">ID</th>
                          <th className="p-4">Assunto</th>
                          <th className="p-4">Aluno</th>
                          <th className="p-4">Categoria</th>
                          <th className="p-4">Responsável</th>
                          <th className="p-4">Abertura</th>
                          <th className="p-4 pr-6 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {resolvedTickets.map(ticket => (
                          <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-400">#{ticket.id}</td>
                            <td className="p-4 font-bold text-slate-800 truncate max-w-[180px]" title={ticket.titulo || ""}>
                              {ticket.titulo || ticket.categoria}
                            </td>
                            <td className="p-4">{ticket.cliente || "Estudante"}</td>
                            <td className="p-4">
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold select-none">
                                {ticket.categoria}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-500">{ticket.admin_nome || "Nenhum"}</td>
                            <td className="p-4 text-slate-400">
                              {new Date(ticket.criado_em).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <button
                                onClick={() => setChatTicketId(ticket.id)}
                                className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg font-bold transition-all text-[11px]"
                              >
                                Ver Conversa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GERENCIAR USUÁRIOS */}
          {activeTab === "usuarios" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
              {/* Left & Middle: Users Table List */}
              <div className="xl:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">Usuários Cadastrados</h3>
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider select-none">
                          <th className="p-4 pl-6">ID</th>
                          <th className="p-4">Nome</th>
                          <th className="p-4">E-mail</th>
                          <th className="p-4">Cargo / Função</th>
                          <th className="p-4">Nível</th>
                          <th className="p-4 pr-6 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {usersList.map(user => {
                          const isUserAdmin = user.is_admin === 1 || user.is_admin === true;
                          return (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 pl-6 font-bold text-slate-400">#{user.id}</td>
                              <td className="p-4 font-bold text-slate-850">{user.nome}</td>
                              <td className="p-4 text-slate-500">{user.email}</td>
                              <td className="p-4 font-bold text-slate-400">{user.cargo || "Aluno"}</td>
                              <td className="p-4">
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full select-none ${
                                  isUserAdmin ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500"
                                }`}>
                                  {isUserAdmin ? "ADMIN" : "ESTUDANTE"}
                                </span>
                              </td>
                              <td className="p-4 pr-6 text-right space-x-2">
                                <button
                                  onClick={() => openEditUserDialog(user)}
                                  className="text-slate-500 hover:text-primary-corp hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                                  title="Editar Usuário"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  disabled={currentUser?.id === user.id}
                                  onClick={() => handleDeleteUser(user.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    currentUser?.id === user.id ? "text-slate-350 cursor-not-allowed" : "text-slate-500 hover:text-red-600 hover:bg-slate-100"
                                  }`}
                                  title="Excluir Usuário"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Side: Register Admin Form Panel */}
              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 select-none">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-800">Cadastrar Novo Admin</h3>
                </div>
                
                <form onSubmit={handleRegisterAdmin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">E-mail</label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="Ex: joao.silva@admin.com"
                      className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Senha Provisória</label>
                    <input
                      type="password"
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Cargo / Função</label>
                    <input
                      type="text"
                      value={newAdminCargo}
                      onChange={(e) => setNewAdminCargo(e.target.value)}
                      placeholder="Ex: Coordenador, Suporte TI"
                      className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAdmin}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {isSubmittingAdmin && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Registrar Administrador
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: MURAL DE AVISOS */}
          {activeTab === "avisos" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
              {/* Left Side: Create announcement Form */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 select-none">
                  <Megaphone className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-800">Publicar no Mural</h3>
                </div>

                <form onSubmit={handlePublishAviso} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Título do Aviso</label>
                    <input
                      type="text"
                      required
                      value={avisoTitulo}
                      onChange={(e) => setAvisoTitulo(e.target.value)}
                      placeholder="Ex: Instabilidade no Portal Acadêmico"
                      className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Mensagem / Conteúdo</label>
                    <textarea
                      required
                      rows={5}
                      value={avisoMensagem}
                      onChange={(e) => setAvisoMensagem(e.target.value)}
                      placeholder="Escreva os detalhes para os alunos visualizarem no dashboard principal..."
                      className="w-full border border-slate-200 rounded-xl p-3.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAviso}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200"
                  >
                    {isSubmittingAviso && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Publicar Comunicado
                  </button>
                </form>
              </div>

              {/* Right Side: Announcements History list */}
              <div className="xl:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">Mural de Avisos Ativos</h3>
                {avisosList.length === 0 ? (
                  <div className="p-10 border border-dashed border-slate-200 bg-white rounded-2xl text-center select-none">
                    <p className="text-xs text-slate-500 font-semibold">Nenhum comunicado ativo publicado no momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {avisosList.map(aviso => (
                      <div
                        key={aviso.id}
                        className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">{aviso.titulo}</h4>
                            <button
                              onClick={() => handleDeleteAviso(aviso.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Remover Aviso"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium whitespace-pre-wrap">{aviso.mensagem}</p>
                        </div>
                        <div className="mt-4 pt-3.5 border-t border-slate-50 text-[9px] text-slate-400 font-semibold flex justify-between select-none">
                          <span>Publicado por: {aviso.autor || "Coordenação"}</span>
                          <span>{new Date(aviso.data_criacao).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: RELATÓRIOS E MÉTRICAS */}
          {activeTab === "relatorios" && (
            <div className="space-y-8">
              {/* Report period selectors */}
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-150 pb-4 select-none">
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setReportPeriod("dia")}
                    className={`px-4.5 py-2 text-xs font-bold rounded-lg transition-all ${
                      reportPeriod === "dia" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Últimas 24 Horas
                  </button>
                  <button
                    onClick={() => setReportPeriod("semana")}
                    className={`px-4.5 py-2 text-xs font-bold rounded-lg transition-all ${
                      reportPeriod === "semana" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Últimos 7 Dias
                  </button>
                  <button
                    onClick={() => setReportPeriod("mes")}
                    className={`px-4.5 py-2 text-xs font-bold rounded-lg transition-all ${
                      reportPeriod === "mes" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Últimos 30 Dias
                  </button>
                </div>

                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-250 px-3 py-1.5 rounded-xl">
                  {totalReportCount} chamados localizados neste período
                </span>
              </div>

              {/* Grid Dashboard Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
                {/* Solved percentage SVG chart card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Taxa de Resolução</span>
                  
                  <div className="relative h-28 w-28 flex items-center justify-center">
                    <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500 transition-all duration-500"
                        strokeDasharray={`${percentageSolved}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xl font-black text-slate-800">{percentageSolved}%</span>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase">Solucionados</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium text-center mt-4">
                    {resolvedReportCount} de {totalReportCount} chamados criados no período foram devidamente finalizados.
                  </p>
                </div>

                {/* Status distribution bar card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between md:col-span-2">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Resumo da Fila do Período</span>

                  <div className="space-y-4 my-2">
                    {/* Status 1 */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Finalizados (Resolvidos)</span>
                        <span>{resolvedReportCount} ({totalReportCount > 0 ? Math.round((resolvedReportCount / totalReportCount) * 100) : 0}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${totalReportCount > 0 ? (resolvedReportCount / totalReportCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Status 2 */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Em Atendimento</span>
                        <span>
                          {reportTickets.filter(t => t.status === "em_andamento").length} ({totalReportCount > 0 ? Math.round((reportTickets.filter(t => t.status === "em_andamento").length / totalReportCount) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-corp transition-all duration-300"
                          style={{ width: `${totalReportCount > 0 ? (reportTickets.filter(t => t.status === "em_andamento").length / totalReportCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Status 3 */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Pendentes (Abertos)</span>
                        <span>
                          {reportTickets.filter(t => t.status === "pendente").length} ({totalReportCount > 0 ? Math.round((reportTickets.filter(t => t.status === "pendente").length / totalReportCount) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${totalReportCount > 0 ? (reportTickets.filter(t => t.status === "pendente").length / totalReportCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 italic">
                    Dados calculados dinamicamente com base nas datas de criação.
                  </span>
                </div>
              </div>

              {/* Tickets table for current report */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">Chamados Criados no Período</h3>
                {reportTickets.length === 0 ? (
                  <div className="p-10 bg-white border border-slate-100 rounded-2xl text-center select-none">
                    <p className="text-xs text-slate-500 font-semibold">Sem movimentações de chamados registradas no filtro selecionado.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider select-none">
                          <th className="p-4 pl-6">ID</th>
                          <th className="p-4">Assunto</th>
                          <th className="p-4">Aluno</th>
                          <th className="p-4">Categoria</th>
                          <th className="p-4">Criação</th>
                          <th className="p-4 pr-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {reportTickets.map(ticket => (
                          <tr key={ticket.id}>
                            <td className="p-4 pl-6 font-bold text-slate-450">#{ticket.id}</td>
                            <td className="p-4 font-bold text-slate-800 truncate max-w-[200px]" title={ticket.titulo || ""}>
                              {ticket.titulo || ticket.categoria}
                            </td>
                            <td className="p-4">{ticket.cliente || "Estudante"}</td>
                            <td className="p-4">{ticket.categoria}</td>
                            <td className="p-4 text-slate-400">
                              {new Date(ticket.criado_em).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="p-4 pr-6">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full select-none uppercase ${
                                ticket.status === "pendente"
                                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                                  : ticket.status === "em_andamento"
                                  ? "bg-blue-50/50 text-primary-corp border border-primary-corp/20"
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              }`}>
                                {ticket.status === "pendente" ? "aberto" : ticket.status === "em_andamento" ? "atendimento" : "resolvido"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DIALOG 1: STATUS AND DEADLINE ADJUSTMENTS */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl border border-slate-100 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Alterar Status & Prazo</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Defina o prazo limite e o status atual para o chamado #{selectedTicket?.id}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateStatus} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Status</label>
              <select
                required
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value as any)}
                className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all select-none"
              >
                <option value="pendente">Aberto / Pendente</option>
                <option value="em_andamento">Em Atendimento</option>
                <option value="finalizado">Finalizado / Resolvido</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Prazo Máximo de Resolução</label>
              <input
                type="datetime-local"
                value={ticketPrazo}
                onChange={(e) => setTicketPrazo(e.target.value)}
                className="w-full h-10 border border-slate-200 rounded-xl px-4.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsStatusDialogOpen(false)}
                className="px-4.5 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="px-4.5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isUpdatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Salvar Alterações
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: USER EDIT DETAILS MODAL */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl border border-slate-100 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Editar Usuário</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Altere os dados cadastrais e permissões do usuário #{selectedUser?.id}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Nome Completo</label>
              <input
                type="text"
                required
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                className="w-full h-10 border border-slate-200 rounded-xl px-4.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">E-mail</label>
              <input
                type="email"
                required
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                className="w-full h-10 border border-slate-200 rounded-xl px-4.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Cargo / Função</label>
              <input
                type="text"
                value={editUserCargo}
                onChange={(e) => setEditUserCargo(e.target.value)}
                className="w-full h-10 border border-slate-200 rounded-xl px-4.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5 py-1 select-none">
              <input
                type="checkbox"
                id="is_admin_check"
                checked={editUserIsAdmin}
                onChange={(e) => setEditUserIsAdmin(e.target.checked)}
                className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="is_admin_check" className="text-xs font-bold text-slate-700 cursor-pointer">
                Dar privilégios de administrador (Administrador do Sistema)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditUserOpen(false)}
                className="px-4.5 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdatingUser}
                className="px-4.5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isUpdatingUser && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Salvar Dados
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
            loadData();
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
