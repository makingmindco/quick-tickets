"use client";

import React, { useState, useEffect, useRef } from "react";
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
  FolderClosed,
  ChevronRight,
  ArrowLeft,
  Paperclip,
  Send,
  Mic,
  Square,
  X,
  FileText,
  Wrench,
  Settings,
  AlertCircle,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { User, Ticket, Aviso, Message } from "@/types";
import { CustomAudioPlayer } from "@/components/custom-audio-player";

export default function AdminDashboard() {
  const router = useRouter();

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Tab state: 'fila' | 'resolvidos' | 'usuarios' | 'avisos' | 'configuracoes'
  const [activeTab, setActiveTab] = useState<"fila" | "resolvidos" | "usuarios" | "avisos" | "configuracoes">("fila");

  // Ticket sub-view: 'list' | 'chat'
  const [ticketView, setTicketView] = useState<"list" | "chat">("list");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Data states
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<Ticket[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [avisosList, setAvisosList] = useState<Aviso[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [statusStats, setStatusStats] = useState({ pendente: 0, em_andamento: 0, finalizado: 0 });
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Chat message states
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [selectedChatFile, setSelectedChatFile] = useState<File | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Audio recording state
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioName, setRecordedAudioName] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Status/Deadline modal state
  const [statusDialogTicket, setStatusDialogTicket] = useState<Ticket | null>(null);
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

  // Profile/Settings states
  const [profileNome, setProfileNome] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [prefTemaEscuro, setPrefTemaEscuro] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // System configurations states (mocked/stored in localStorage for persistence)
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultSlaHours, setDefaultSlaHours] = useState(24);
  const [systemCategories, setSystemCategories] = useState<string[]>([
    "Acadêmico",
    "Financeiro / Secretaria",
    "Infraestrutura",
    "Acessos / TI",
    "Outros"
  ]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [requireStrongPassword, setRequireStrongPassword] = useState(true);
  const [blockRegistrations, setBlockRegistrations] = useState(false);
  const [isSavingSystemSettings, setIsSavingSystemSettings] = useState(false);

  // SLA/Elapsed Timer states
  const [elapsedTimeText, setElapsedTimeText] = useState("00:00:00");
  const [elapsedPercent, setElapsedPercent] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Verification user auth
  useEffect(() => {
    const userString = localStorage.getItem("usuarioLogado");
    const token = localStorage.getItem("token");

    if (!userString || !token) {
      toast.error("Acesso não autorizado. Faça login primeiro!");
      router.push("/");
      return;
    }

    try {
      const user: User = JSON.parse(userString);
      const isAdmin = user.is_admin === 1 || user.is_admin === true;
      if (!isAdmin) {
        toast.error("Você não tem privilégios de administrador!");
        router.push("/dashboard");
        return;
      }

      setCurrentUser(user);
      setProfileNome(user.nome || "");
      setProfileEmail(user.email || "");
      setPrefTemaEscuro(user.tema_escuro === 1 || user.tema_escuro === true);

      // Apply dark theme dynamically based on database value
      if (user.tema_escuro === 1 || user.tema_escuro === true) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      console.error("Error parsing logged user info:", e);
      toast.error("Erro ao autenticar sessão.");
      router.push("/");
      return;
    }

    setIsLoadingAuth(false);
  }, [router]);

  // Load appropriate data when tab or parameters change
  useEffect(() => {
    if (isLoadingAuth) return;
    loadData();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
      if (ticketView === "chat" && selectedTicketId) {
        fetchChatMessages(selectedTicketId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoadingAuth, activeTab, ticketView, selectedTicketId]);

  // Load system configurations from localStorage on mount safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedMaintenance = localStorage.getItem("sys_maintenanceMode");
        if (savedMaintenance !== null) setMaintenanceMode(savedMaintenance === "true");

        const savedSla = localStorage.getItem("sys_defaultSlaHours");
        if (savedSla !== null) setDefaultSlaHours(parseInt(savedSla) || 24);

        const savedCategories = localStorage.getItem("sys_systemCategories");
        if (savedCategories !== null) {
          const parsed = JSON.parse(savedCategories);
          if (Array.isArray(parsed)) {
            setSystemCategories(parsed);
          }
        }

        const savedStrongPass = localStorage.getItem("sys_requireStrongPassword");
        if (savedStrongPass !== null) setRequireStrongPassword(savedStrongPass === "true");

        const savedBlockReg = localStorage.getItem("sys_blockRegistrations");
        if (savedBlockReg !== null) setBlockRegistrations(savedBlockReg === "true");
      } catch (e) {
        console.error("Error loading system config from localStorage:", e);
      }
    }
  }, []);

  // Update Elapsed countdown
  useEffect(() => {
    if (ticketView !== "chat" || !selectedTicket) return;

    const updateTimer = () => {
      const createdTime = new Date(selectedTicket.criado_em).getTime();
      const now = new Date().getTime();
      const diff = now - createdTime;

      if (diff <= 0) {
        setElapsedTimeText("00:00:00");
        setElapsedPercent(0);
        return;
      }

      // Format to HH:MM:SS
      const diffSecs = Math.floor((diff / 1000) % 60);
      const diffMins = Math.floor((diff / (1000 * 60)) % 60);
      const diffHours = Math.floor(diff / (1000 * 60 * 60));

      const timeStr = `${String(diffHours).padStart(2, "0")}:${String(diffMins).padStart(2, "0")}:${String(diffSecs).padStart(2, "0")}`;
      setElapsedTimeText(timeStr);

      // Percentage of first 24h (86,400,000 ms)
      const targetMs = 24 * 60 * 60 * 1000;
      const pct = Math.min(100, (diff / targetMs) * 100);
      setElapsedPercent(pct);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [ticketView, selectedTicket]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Load Statistics
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

          // If currently viewing a ticket, sync its state
          if (selectedTicketId) {
            const found = data.find(t => t.id === selectedTicketId);
            if (found) setSelectedTicket(found);
          }
        }
      } else if (activeTab === "resolvidos") {
        const res = await fetch("/api/admin/tickets/finalizados", { headers });
        if (res.ok) {
          const data: Ticket[] = await res.json();
          setResolvedTickets(data);
          
          if (selectedTicketId) {
            const found = data.find(t => t.id === selectedTicketId);
            if (found) setSelectedTicket(found);
          }
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
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notificacoes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notificacoes", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Todas as notificações foram marcadas como lidas.");
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleNotificationRead = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/notificacoes/${id}/ler`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatMessages = async (ticketId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error(err);
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
          prazo: ticket.prazo
        })
      });

      if (res.ok) {
        toast.success(`Você assumiu o chamado #${ticket.id}!`);
        loadData();
        if (ticketView === "chat" && selectedTicketId === ticket.id) {
          const updated = { ...selectedTicket!, status: "em_andamento" as const, admin_id: currentUser?.id || null };
          setSelectedTicket(updated);
        }
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
    setStatusDialogTicket(ticket);
    setTicketStatus(ticket.status);
    if (ticket.prazo) {
      const d = new Date(ticket.prazo);
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
    if (!statusDialogTicket) return;

    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/tickets/${statusDialogTicket.id}/status`, {
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
        toast.success(`Chamado #${statusDialogTicket.id} atualizado com sucesso!`);
        setIsStatusDialogOpen(false);
        setStatusDialogTicket(null);
        loadData();
        if (ticketView === "chat" && selectedTicketId === statusDialogTicket.id) {
          const updated = { ...selectedTicket!, status: ticketStatus, prazo: ticketPrazo ? new Date(ticketPrazo).toISOString() : null };
          setSelectedTicket(updated);
        }
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
        if (ticketView === "chat" && selectedTicketId === ticketId) {
          const updated = { ...selectedTicket!, status: "finalizado" as const, prazo: null };
          setSelectedTicket(updated);
        }
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

  // Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/users/profile/avatar", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          toast.success("Foto de perfil atualizada com sucesso!");
          setCurrentUser(data.usuario);
          localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
        } else {
          const data = await res.json();
          toast.error(data.erro || "Falha ao fazer upload da imagem.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro de conexão.");
      }
    }
  };

  // Settings Save (and Dark Mode Toggle Sync)
  const handleSaveSettings = async () => {
    if (!profileNome.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }

    setIsSavingSettings(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: profileNome.trim(),
          tema_escuro: prefTemaEscuro
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.mensagem || "Perfil atualizado com sucesso!");
        setCurrentUser(data.usuario);
        localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
      } else {
        toast.error(data.erro || "Erro ao salvar perfil.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDarkThemeChange = (checked: boolean) => {
    setPrefTemaEscuro(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const discardSettingsChanges = () => {
    if (currentUser) {
      setProfileNome(currentUser.nome);
      setPrefTemaEscuro(currentUser.tema_escuro === 1 || currentUser.tema_escuro === true);
      if (currentUser.tema_escuro === 1 || currentUser.tema_escuro === true) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSystemSettings(true);
    setTimeout(() => {
      localStorage.setItem("sys_maintenanceMode", String(maintenanceMode));
      localStorage.setItem("sys_defaultSlaHours", String(defaultSlaHours));
      localStorage.setItem("sys_systemCategories", JSON.stringify(systemCategories));
      localStorage.setItem("sys_requireStrongPassword", String(requireStrongPassword));
      localStorage.setItem("sys_blockRegistrations", String(blockRegistrations));
      setIsSavingSystemSettings(false);
      toast.success("Configurações do sistema salvas com sucesso!");
    }, 800);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    if (systemCategories.includes(newCategoryName.trim())) {
      toast.error("Esta categoria já existe!");
      return;
    }
    const updated = [...systemCategories, newCategoryName.trim()];
    setSystemCategories(updated);
    setNewCategoryName("");
    localStorage.setItem("sys_systemCategories", JSON.stringify(updated));
    toast.success("Categoria adicionada!");
  };

  const handleRemoveCategory = (cat: string) => {
    const updated = systemCategories.filter(c => c !== cat);
    setSystemCategories(updated);
    localStorage.setItem("sys_systemCategories", JSON.stringify(updated));
    toast.success("Categoria removida!");
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

  // Chat message sending
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() && !selectedChatFile && !recordedAudioBlob) return;
    if (!selectedTicketId) return;

    const formData = new FormData();
    // Support visual private notes by prefixing message body
    const bodyText = isInternalNote ? `[Nota Interna / Privada] ${newChatMessage.trim()}` : newChatMessage.trim();
    if (bodyText) {
      formData.append("mensagem", bodyText);
    }

    if (selectedChatFile) {
      formData.append("arquivo", selectedChatFile);
    } else if (recordedAudioBlob) {
      formData.append("arquivo", recordedAudioBlob, recordedAudioName);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tickets/${selectedTicketId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setNewChatMessage("");
        clearChatAttachment();
        fetchChatMessages(selectedTicketId);
      } else {
        const errData = await res.json();
        toast.error(errData.erro || "Falha ao enviar mensagem.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    }
  };

  const clearChatAttachment = () => {
    setSelectedChatFile(null);
    setRecordedAudioBlob(null);
    setRecordedAudioName("");
    if (chatFileInputRef.current) chatFileInputRef.current.value = "";
  };

  // Audio Recording Flow
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let options = {};
      let mimeType = "audio/webm";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          options = { mimeType: "audio/webm" };
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options = { mimeType: "audio/mp4" };
          mimeType = "audio/mp4";
        }
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const actualMime = recorder.mimeType || mimeType;
        const blob = new Blob(chunks, { type: actualMime });

        let ext = "webm";
        if (actualMime.includes("mp4")) ext = "mp4";

        setRecordedAudioBlob(blob);
        setRecordedAudioName(`Áudio Gravado.${ext}`);
        setSelectedChatFile(null);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordedAudioBlob(null);
    setRecordedAudioName("");
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
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
  const unreadNotificationsCount = notifications.filter(n => !n.lida).length;

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row bg-slate-50 dark:bg-zinc-950 font-sans relative">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-[#0d1317] text-slate-100 flex-col justify-between shrink-0 select-none h-full shadow-lg">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex flex-col items-start gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="QuickTickets Logo" className="h-[38px] w-auto object-contain block" />
              <span className="text-[10px] font-extrabold text-[#10b981] tracking-wider uppercase">Painel do Administrador</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveTab("fila"); setTicketView("list"); }}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "fila" && ticketView === "list"
                  ? "bg-[#1e293b] text-white border-l-4 border-[#10b981] rounded-l-none pl-3.5"
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
              onClick={() => { setActiveTab("resolvidos"); setTicketView("list"); }}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "resolvidos" && ticketView === "list"
                  ? "bg-[#1e293b] text-white border-l-4 border-[#10b981] rounded-l-none pl-3.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 pl-4.5"
              }`}
            >
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              Histórico / Resolvidos
            </button>
            <button
              onClick={() => { setActiveTab("usuarios"); setTicketView("list"); }}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "usuarios"
                  ? "bg-[#1e293b] text-white border-l-4 border-[#10b981] rounded-l-none pl-3.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 pl-4.5"
              }`}
            >
              <Users className="h-4.5 w-4.5 shrink-0" />
              Gerenciar Usuários
            </button>
            <button
              onClick={() => { setActiveTab("avisos"); setTicketView("list"); }}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "avisos"
                  ? "bg-[#1e293b] text-white border-l-4 border-[#10b981] rounded-l-none pl-3.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 pl-4.5"
              }`}
            >
              <Megaphone className="h-4.5 w-4.5 shrink-0" />
              Mural de Avisos
            </button>
            <button
              onClick={() => { setActiveTab("configuracoes"); setTicketView("list"); }}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "configuracoes"
                  ? "bg-[#1e293b] text-white border-l-4 border-[#10b981] rounded-l-none pl-3.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 pl-4.5"
              }`}
            >
              <Settings className="h-4.5 w-4.5 shrink-0" />
              Configurações
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-1">
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
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden pb-16 md:pb-0">
        
        {/* Maintenance warning banner at top of main container if active */}
        {maintenanceMode && (
          <div className="bg-amber-500 text-white text-center py-1 text-xs font-bold animate-pulse select-none flex items-center justify-center gap-1.5 shrink-0">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>O sistema está atualmente em MODO DE MANUTENÇÃO.</span>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-slate-150 flex items-center justify-between px-6 md:px-8 shrink-0 relative z-30">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.png" alt="QuickTickets Logo" className="md:hidden h-8 w-auto object-contain" />
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight select-none">
              {activeTab === "fila" && (ticketView === "chat" ? "Conversa / Detalhes" : "Fila de Atendimento")}
              {activeTab === "resolvidos" && (ticketView === "chat" ? "Histórico de Conversa" : "Chamados Resolvidos")}
              {activeTab === "usuarios" && "Gerenciar Usuários"}
              {activeTab === "avisos" && "Mural de Avisos"}
              {activeTab === "configuracoes" && "Configurações do Sistema"}
            </h1>
          </div>

          <div className="flex items-center gap-5">
            {/* Quick Metrics display */}
            <div className="hidden lg:flex items-center gap-3 text-xs font-bold text-slate-500 border-r border-slate-150 pr-5 select-none">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /> {statusStats.pendente} pendentes</span>
              <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 text-primary-corp animate-spin" /> {statusStats.em_andamento} em atendimento</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {statusStats.finalizado} resolvidos</span>
            </div>

            {/* Notification bell button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-500 hover:text-slate-800 transition-colors h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center relative cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center select-none animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl border border-slate-150 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-4.5 py-3.5 border-b border-slate-150 flex items-center justify-between bg-slate-50 select-none">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Notificações</span>
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-bold text-[#00afef] hover:underline cursor-pointer"
                      >
                        Marcar todas como lidas
                      </button>
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs font-semibold text-slate-400">
                          Nenhuma notificação no momento.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markSingleNotificationRead(notif.id);
                              setShowNotifications(false);
                              if (notif.link) {
                                router.push(notif.link);
                              }
                            }}
                            className={`p-4 transition-colors flex gap-3 cursor-pointer ${
                              !notif.lida ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-slate-55"
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {notif.tipo === "system" || notif.tipo === "patch" ? (
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center">
                                  <Wrench className="h-4 w-4" />
                                </div>
                              ) : notif.tipo === "mensagem" ? (
                                <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center">
                                  <Inbox className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center">
                                  <Bell className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <h5 className={`text-xs font-extrabold truncate ${!notif.lida ? "text-[#0f62ac]" : "text-slate-700"}`}>
                                  {notif.titulo}
                                </h5>
                                {!notif.lida && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                              </div>
                              <p className="text-[11px] text-slate-550 mt-0.5 line-clamp-2 leading-relaxed font-medium">
                                {notif.mensagem}
                              </p>
                              <span className="text-[9px] text-slate-400 font-bold block mt-1.5">
                                {new Date(notif.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile badge */}
            <div className="flex items-center gap-3 select-none">
              {currentUser?.foto_url ? (
                <img
                  src={currentUser.foto_url}
                  alt="Avatar"
                  className="h-9 w-9 rounded-xl object-cover shadow-sm border border-slate-200"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs shadow-sm">
                  {avatarInitials}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{currentUser?.nome}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{currentUser?.cargo || "Administrador"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel View Wrapper */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* TICKET DETAILS SCREEN (3-Column View, Screenshot 4) */}
          {ticketView === "chat" && selectedTicket ? (
            <div className="h-[calc(100vh-140px)] flex flex-col xl:flex-row gap-6 overflow-hidden">
              
              {/* Column 1: Requestor Metadata Panel (Left) */}
              <div className="w-full xl:w-72 bg-white border border-slate-150 rounded-3xl p-5.5 shadow-sm shrink-0 overflow-y-auto select-none space-y-5.5">
                <button
                  onClick={() => setTicketView("list")}
                  className="flex items-center gap-2 text-xs font-bold text-slate-450 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para Fila
                </button>

                <hr className="border-slate-100" />

                <div className="space-y-3.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">SOLICITANTE</span>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-750 border border-emerald-100 flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
                      {getInitials(selectedTicket.cliente_nome || selectedTicket.cliente)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-800 truncate">{selectedTicket.cliente_nome || selectedTicket.cliente || "Aluno"}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">ID: #{selectedTicket.usuario_id}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-650 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <p><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Cargo:</span> {selectedTicket.cliente || "Estudante"}</p>
                    <p className="truncate" title={selectedTicket.cliente_email || ""}><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">E-mail:</span> {selectedTicket.cliente_email || "N/D"}</p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">PRIORIDADE & STATUS</span>
                  
                  <div className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    selectedTicket.status === "finalizado"
                      ? "bg-slate-100 text-slate-600"
                      : selectedTicket.id % 3 === 0
                      ? "bg-red-50 text-red-650 border border-red-100"
                      : selectedTicket.id % 3 === 1
                      ? "bg-amber-50 text-amber-650 border border-amber-100"
                      : "bg-blue-50 text-blue-650 border border-blue-100"
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      selectedTicket.status === "finalizado"
                        ? "bg-slate-400"
                        : selectedTicket.id % 3 === 0
                        ? "bg-red-500 animate-pulse"
                        : selectedTicket.id % 3 === 1
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`} />
                    <span>
                      {selectedTicket.status === "finalizado"
                        ? "Finalizado"
                        : selectedTicket.id % 3 === 0
                        ? "Alta Prioridade"
                        : selectedTicket.id % 3 === 1
                        ? "Média Prioridade"
                        : "Baixa Prioridade"}
                    </span>
                  </div>

                  <div className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                    selectedTicket.status === "pendente"
                      ? "bg-amber-50/50 text-amber-600 border-amber-200"
                      : selectedTicket.status === "em_andamento"
                      ? "bg-blue-50/50 text-blue-600 border-blue-200"
                      : "bg-emerald-50/50 text-emerald-600 border-emerald-200"
                  }`}>
                    <span>Status:</span>
                    <span className="font-extrabold uppercase">{selectedTicket.status === "em_andamento" ? "Em Andamento" : selectedTicket.status}</span>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">CONTEXTO ACADÊMICO</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">1º Semestre</span>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">{selectedTicket.categoria}</span>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">ID-{selectedTicket.id}</span>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ARQUIVOS ANEXADOS</span>
                  
                  {chatMessages.filter(m => m.arquivo_url).length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold italic">Nenhum anexo neste chamado.</p>
                  ) : (
                    <div className="space-y-2">
                      {chatMessages.filter(m => m.arquivo_url).map((msg) => {
                        const fileName = msg.arquivo_url!.split("/").pop() || "anexo";
                        const formattedTime = new Date(msg.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                        
                        return (
                          <a
                            key={msg.id}
                            href={msg.arquivo_url!}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2.5 bg-slate-50 border border-slate-150 hover:bg-slate-100 p-2 rounded-xl transition-all cursor-pointer"
                          >
                            <FileText className="h-4.5 w-4.5 text-[#10b981]" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-slate-700 truncate">{fileName}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5">Anexado em {formattedTime}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Chat Conversation Panel (Center) */}
              <div className="flex-1 bg-white border border-slate-150 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                <div className="px-5.5 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between shrink-0">
                  <div className="min-w-0 pr-4">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">TICKET ID: QT-{selectedTicket.id}</span>
                    <h3 className="text-sm font-extrabold text-slate-800 truncate mt-0.5">
                      {selectedTicket.titulo || selectedTicket.categoria}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex -space-x-2 select-none">
                      <div className="h-7 w-7 rounded-full bg-emerald-600 text-white border-2 border-white flex items-center justify-center font-bold text-[9px]">
                        {avatarInitials}
                      </div>
                      <div className="h-7 w-7 rounded-full bg-[#0f62ac] text-white border-2 border-white flex items-center justify-center font-bold text-[9px]">
                        {getInitials(selectedTicket.cliente_nome || selectedTicket.cliente)}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  ref={chatScrollContainerRef}
                  className="flex-1 overflow-y-auto p-5 space-y-4 transition-all duration-300"
                  style={{
                    backgroundImage: prefTemaEscuro 
                      ? `radial-gradient(rgba(16, 185, 129, 0.05) 1.5px, transparent 1.5px), linear-gradient(to bottom, #0d1317, #1c2125)` 
                      : `radial-gradient(rgba(15, 98, 172, 0.05) 1.5px, transparent 1.5px), linear-gradient(to bottom, #f8fafc, #eef2f6)`,
                    backgroundSize: "24px 24px, 100% 100%"
                  }}
                >
                  <div className="flex w-full justify-start select-none">
                    <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-[#0d1317] text-slate-100 shadow-sm border border-slate-800 rounded-bl-sm">
                      <span className="block text-[10px] font-extrabold text-[#10b981] uppercase tracking-wider mb-1">DESCRIÇÃO ORIGINAL</span>
                      <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{selectedTicket.descricao}</p>
                      <span className="block text-[9px] text-slate-455 font-semibold text-right mt-1.5">
                        {new Date(selectedTicket.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    <span className="bg-slate-200/70 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest select-none">
                      Início da Fila Administrativa
                    </span>
                  </div>

                  {isChatLoading && chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                      <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
                      <span className="text-xs font-bold text-slate-450">Carregando histórico...</span>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMine = currentUser ? msg.usuario_id === currentUser.id : false;
                      const date = new Date(msg.criado_em);
                      const formattedTime = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                      const senderName = msg.usuario_nome + (msg.usuario_is_admin ? " (Suporte)" : "");

                      return (
                        <div key={msg.id} className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] px-4.5 py-3 rounded-2xl shadow-sm relative border ${
                              isMine
                                ? "bg-[#e6fbf3] border-emerald-250 text-slate-800 rounded-br-sm dark:bg-emerald-950/20 dark:border-emerald-900/35 dark:text-emerald-100"
                                : "bg-white border-slate-200 text-slate-800 rounded-bl-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
                            }`}
                          >
                            {!isMine && (
                              <span className="block text-[10px] font-extrabold text-[#10b981] uppercase tracking-wider mb-1 select-none">
                                {senderName}
                              </span>
                            )}
                            <div className="text-xs font-medium leading-relaxed whitespace-pre-wrap word-break">
                              {msg.tipo === "texto" && <p>{msg.mensagem}</p>}
                              {msg.tipo === "imagem" && msg.arquivo_url && (
                                <div className="space-y-2">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={msg.arquivo_url} alt="Imagem" className="max-w-full max-h-48 object-contain rounded-lg border dark:border-zinc-800" />
                                  {msg.mensagem && <p>{msg.mensagem}</p>}
                                </div>
                              )}
                              {msg.tipo === "audio" && msg.arquivo_url && (
                                <div className="space-y-2">
                                  <CustomAudioPlayer msgId={msg.id} url={msg.arquivo_url} />
                                  {msg.mensagem && <p className="mt-1">{msg.mensagem}</p>}
                                </div>
                              )}
                            </div>
                            <span className="block text-[9px] text-slate-400 font-bold text-right mt-1.5 select-none">
                              {formattedTime}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {(selectedChatFile || recordedAudioBlob) && (
                  <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 select-none">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                        {selectedChatFile ? "IMG" : "AUD"}
                      </span>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[240px]">
                        {selectedChatFile ? selectedChatFile.name : recordedAudioName}
                      </span>
                    </div>
                    <button
                      onClick={clearChatAttachment}
                      className="text-[11px] font-bold text-red-500 hover:text-red-750 cursor-pointer"
                    >
                      Remover Anexo
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendChatMessage} className="p-4 bg-white border-t border-slate-150 shrink-0">
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedChatFile(e.target.files[0]);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-col gap-2">
                    {/* Private Internal Note checkbox toggle */}
                    <div className="flex items-center gap-2 px-1 select-none">
                      <input
                        type="checkbox"
                        id="internal_note"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <label htmlFor="internal_note" className="text-[10px] font-bold text-slate-500 cursor-pointer uppercase tracking-wider">
                        Nota interna / privada (Apenas para equipe de suporte)
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={() => chatFileInputRef.current?.click()}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-650 hover:bg-slate-200 hover:text-slate-800 transition-colors shrink-0"
                          title="Anexar Imagem"
                        >
                          <Paperclip className="h-4.5 w-4.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0"
                          title="Cancelar Gravação"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}

                      {!isRecording ? (
                        <input
                          type="text"
                          value={newChatMessage}
                          onChange={(e) => setNewChatMessage(e.target.value)}
                          placeholder={isInternalNote ? "Escreva uma nota interna privada..." : "Escreva uma resposta ao aluno..."}
                          className="flex-1 h-10 border border-slate-200 rounded-xl px-4 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                        />
                      ) : (
                        <div className="flex-1 h-10 bg-red-50 border border-red-100 rounded-xl px-4 flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-wider">Gravando Áudio do Atendente</span>
                          <span className="text-xs font-bold text-red-500 font-mono">
                            {formatTimer(recordingSeconds)}
                          </span>
                        </div>
                      )}

                      {!isRecording && !newChatMessage.trim() && !selectedChatFile && !recordedAudioBlob ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-750 transition-colors shrink-0 cursor-pointer"
                          title="Gravar Áudio"
                        >
                          <Mic className="h-4.5 w-4.5" />
                        </button>
                      ) : isRecording ? (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-650 transition-colors shrink-0 cursor-pointer"
                          title="Parar e Usar"
                        >
                          <Square className="h-4 w-4 fill-current" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-750 active:scale-95 transition-all shrink-0 cursor-pointer"
                          title="Enviar"
                        >
                          <Send className="h-4 w-4 ml-0.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Column 3: SLA Countdown Ring & Actions Panel (Right) */}
              <div className="w-full xl:w-72 bg-white border border-slate-150 rounded-3xl p-5.5 shadow-sm shrink-0 overflow-y-auto space-y-6">
                
                <div className="bg-[#001530] text-white rounded-2xl p-5 text-center shadow-md relative overflow-hidden select-none space-y-3 flex flex-col items-center">
                  <span className="text-[9px] font-extrabold text-slate-350 tracking-wider uppercase">TEMPO EM ABERTO</span>
                  
                  <div className="relative flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="46" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                      <circle cx="56" cy="56" r="46" className={`transition-all duration-500 strokeWidth="6" fill="transparent" ${
                        elapsedPercent >= 100 ? "stroke-red-500" : "stroke-[#00afef]"
                      }`} strokeWidth="6" strokeDasharray={289.026} strokeDashoffset={289.026 - (289.026 * elapsedPercent) / 100} strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-sm font-black font-mono tracking-tight">
                        {elapsedTimeText}
                      </span>
                      <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wide font-sans">decorrido</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-[#00afef] tracking-wide w-full uppercase">
                    Nível de SLA: {selectedTicket.categoria_id === 1 ? "Padrão Acadêmico" : "Infraestrutura Urgente"}
                  </div>
                </div>

                <div className="space-y-2 select-none">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">CONTROLE DO STATUS</span>
                  
                  {selectedTicket.status !== "finalizado" ? (
                    <>
                      {selectedTicket.status === "pendente" ? (
                        <button
                          onClick={() => handleAssumeTicket(selectedTicket)}
                          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-between px-4 cursor-pointer"
                        >
                          <span>Assumir Chamado</span>
                          <UserCheck className="h-4.5 w-4.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFinalizeTicket(selectedTicket.id)}
                          className="w-full h-11 bg-[#10b981] hover:bg-[#0da06f] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-between px-4 cursor-pointer"
                        >
                          <span>Marcar Resolvido</span>
                          <CheckCircle2 className="h-4.5 w-4.5 text-white" />
                        </button>
                      )}

                      <button
                        onClick={() => openStatusDialog(selectedTicket)}
                        className="w-full h-11 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-between px-4 cursor-pointer"
                      >
                        <span>Definir Prazo / Status</span>
                        <Calendar className="h-4.5 w-4.5 text-slate-450" />
                      </button>
                    </>
                  ) : (
                    <div className="p-3 border border-emerald-250 bg-emerald-50 text-emerald-700 rounded-xl text-center text-xs font-bold">
                      ✓ Chamado Finalizado / Resolvido
                    </div>
                  )}

                  <button
                    onClick={() => handleFinalizeTicket(selectedTicket.id)}
                    disabled={selectedTicket.status === "finalizado"}
                    className="w-full h-11 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center justify-between px-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Rejeitar / Encerrar</span>
                    <X className="h-4.5 w-4.5 text-red-450" />
                  </button>
                </div>

                <div className="space-y-3.5 select-none">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">LOG DE ATIVIDADES</span>
                  <div className="space-y-4 border-l border-slate-200 pl-3.5 relative">
                    <div className="relative text-xs space-y-0.5">
                      <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 border border-white" />
                      <p className="font-bold text-slate-700">Chamado Aberto</p>
                      <p className="text-[10px] text-slate-450 font-bold">{new Date(selectedTicket.criado_em).toLocaleDateString("pt-BR")}</p>
                    </div>

                    {selectedTicket.admin_id && (
                      <div className="relative text-xs space-y-0.5">
                        <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
                        <p className="font-bold text-slate-700">Responsável Atribuído</p>
                        <p className="text-[10px] text-slate-450 font-bold">Admin ID #{selectedTicket.admin_id}</p>
                      </div>
                    )}

                    {selectedTicket.status === "finalizado" && (
                      <div className="relative text-xs space-y-0.5">
                        <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-red-500 border border-white" />
                        <p className="font-bold text-slate-700">Ticket Finalizado</p>
                        <p className="text-[10px] text-slate-450 font-bold">Resolvido pelo Suporte</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: FILA DE ATENDIMENTO */}
              {activeTab === "fila" && (
                <div className="space-y-6">
                  {activeTickets.length === 0 ? (
                    <div className="p-16 border border-dashed border-slate-250 bg-white rounded-2xl text-center select-none animate-in fade-in">
                      <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-sm font-bold text-slate-700">Fila limpa!</h3>
                      <p className="text-xs text-slate-450 mt-1">Nenhum chamado aberto ou pendente precisando de atenção no momento.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      {activeTickets.map(ticket => {
                        const formattedDate = new Date(ticket.criado_em).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                        
                        return (
                          <div
                            key={ticket.id}
                            onClick={() => {
                              setSelectedTicketId(ticket.id);
                              setSelectedTicket(ticket);
                              setChatMessages([]);
                              fetchChatMessages(ticket.id);
                              setTicketView("chat");
                            }}
                            className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-500/20 cursor-pointer flex flex-col justify-between relative ${
                              ticket.status === "em_andamento"
                                ? "border-t-4 border-t-emerald-600"
                                : "border-t-4 border-t-amber-500"
                            }`}
                          >
                            <div className="flex gap-4 items-start">
                              <div className="h-11 w-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
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
                                        : "text-[#0d1317]"
                                    }`}>
                                      {ticket.status === "pendente" ? "ABERTO" : "ATENDIMENTO"}
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl mt-3 text-xs space-y-1">
                                  <p className="text-slate-600 font-semibold"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Aluno:</span> {ticket.cliente || "Estudante"}</p>
                                  <p className="text-slate-600 font-semibold"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Categoria:</span> {ticket.categoria}</p>
                                  <p className="text-slate-650 font-semibold"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Criado em:</span> {formattedDate}</p>
                                </div>

                                <p className="text-xs text-slate-500 mt-3 line-clamp-3 leading-relaxed font-medium">
                                  {ticket.descricao}
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 select-none">
                                <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                                  {getInitials(ticket.cliente)}
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  Criado por {ticket.cliente || "Estudante"}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                {ticket.status === "pendente" ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAssumeTicket(ticket); }}
                                    className="bg-emerald-650 hover:bg-emerald-700 text-white active:scale-95 px-4 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    Assumir
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openStatusDialog(ticket); }}
                                      className="border border-slate-200 text-slate-650 hover:bg-slate-50 active:scale-95 px-2.5 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                                      title="Definir prazo / Alterar status"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleFinalizeTicket(ticket.id); }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 px-3 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
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
                      <p className="text-xs font-semibold text-slate-400">Nenhum chamado no histórico de finalizados.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
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
                              <tr key={ticket.id} className="hover:bg-slate-55 transition-colors">
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
                                    onClick={() => {
                                      setSelectedTicketId(ticket.id);
                                      setSelectedTicket(ticket);
                                      setChatMessages([]);
                                      fetchChatMessages(ticket.id);
                                      setTicketView("chat");
                                    }}
                                    className="bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-3.5 py-1.5 rounded-lg font-bold transition-all text-[11px] cursor-pointer"
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
                  <div className="xl:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">Usuários Cadastrados</h3>
                    <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
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
                                <tr key={user.id} className="hover:bg-slate-55 transition-colors">
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
                                      className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                                      title="Editar Usuário"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      disabled={currentUser?.id === user.id}
                                      onClick={() => handleDeleteUser(user.id)}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        currentUser?.id === user.id ? "text-slate-350 cursor-not-allowed" : "text-slate-550 hover:text-red-600 hover:bg-slate-100 cursor-pointer"
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
                          className="w-full h-10 border border-slate-200 rounded-xl px-4.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all font-semibold"
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
                          className="w-full h-10 border border-slate-200 rounded-xl px-4.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all font-semibold"
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
                          className="w-full h-10 border border-slate-200 rounded-xl px-4.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Cargo / Função</label>
                        <input
                          type="text"
                          value={newAdminCargo}
                          onChange={(e) => setNewAdminCargo(e.target.value)}
                          placeholder="Ex: Coordenador, Suporte TI"
                          className="w-full h-10 border border-slate-200 rounded-xl px-4.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all font-semibold"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAdmin}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
                      >
                        {isSubmittingAdmin && <Loader2 className="h-4 w-4 animate-spin" />}
                        Cadastrar Administrador
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 4: MURAL DE AVISOS */}
              {activeTab === "avisos" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                  <div className="xl:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">Comunicados no Mural</h3>
                    <div className="space-y-4">
                      {avisosList.length === 0 ? (
                        <div className="p-12 border border-dashed border-slate-200 bg-white rounded-2xl text-center select-none">
                          <p className="text-xs font-semibold text-slate-400">Nenhum aviso publicado no momento.</p>
                        </div>
                      ) : (
                        avisosList.map(aviso => (
                          <div key={aviso.id} className="bg-white border border-slate-150 p-5 rounded-2xl flex justify-between gap-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-extrabold text-[#0d1317]">{aviso.titulo}</h4>
                              <p className="text-xs text-slate-550 leading-relaxed font-medium">{aviso.mensagem}</p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold pt-2">
                                <span>Por: {aviso.autor || "Coordenação"}</span>
                                <span>•</span>
                                <span>{new Date(aviso.data_criacao).toLocaleString("pt-BR")}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteAviso(aviso.id)}
                              className="text-red-500 hover:text-red-750 hover:bg-red-50 p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center transition-colors cursor-pointer"
                              title="Remover Aviso"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 select-none">
                      <Megaphone className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-sm font-extrabold text-slate-800">Publicar Novo Comunicado</h3>
                    </div>
                    
                    <form onSubmit={handlePublishAviso} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Título do Aviso</label>
                        <input
                          type="text"
                          required
                          value={avisoTitulo}
                          onChange={(e) => setAvisoTitulo(e.target.value)}
                          placeholder="Ex: Manutenção do ar condicionado..."
                          className="w-full h-10 border border-slate-200 rounded-xl px-4.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Mensagem do Comunicado</label>
                        <textarea
                          required
                          rows={5}
                          value={avisoMensagem}
                          onChange={(e) => setAvisoMensagem(e.target.value)}
                          placeholder="Digite aqui o aviso detalhado..."
                          className="w-full border border-slate-200 rounded-xl p-3.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-all font-medium leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAviso}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
                      >
                        {isSubmittingAviso && <Loader2 className="h-4 w-4 animate-spin" />}
                        Publicar Comunicado
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 5: CONFIGURAÇÕES DO SISTEMA E DO PERFIL */}
              {activeTab === "configuracoes" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-200">
                  {/* Column 1 & 2: System Settings and Categories */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* System Config Card */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                      <div className="flex items-center gap-2 border-b border-slate-105 pb-3 mb-4 select-none dark:border-zinc-800">
                        <Wrench className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                        <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">Configurações Gerais do Sistema</h3>
                      </div>
                      
                      <form onSubmit={handleSaveSystemSettings} className="space-y-5">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl select-none dark:bg-zinc-950 dark:border-zinc-800">
                          <div className="space-y-0.5">
                            <label className="text-xs font-bold text-slate-700 block dark:text-zinc-300">Modo de Manutenção</label>
                            <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-semibold leading-relaxed">
                              Bloqueia temporariamente a criação de novos chamados por alunos.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                              maintenanceMode ? "bg-amber-500" : "bg-slate-350 dark:bg-zinc-800"
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                maintenanceMode ? "translate-x-6" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-650 dark:text-zinc-400">Prazo Padrão de SLA (Horas)</label>
                            <input
                              type="number"
                              min={1}
                              max={720}
                              value={defaultSlaHours}
                              onChange={(e) => setDefaultSlaHours(parseInt(e.target.value) || 24)}
                              className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-955 dark:text-white"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-650 dark:text-zinc-400 font-sans">Idioma do Sistema</label>
                            <select
                              disabled
                              value="pt-BR"
                              className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-slate-100 font-semibold text-slate-500 cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-450"
                            >
                              <option value="pt-BR">Português (Brasil)</option>
                            </select>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="require_strong_pass"
                              checked={requireStrongPassword}
                              onChange={(e) => setRequireStrongPassword(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                            />
                            <label htmlFor="require_strong_pass" className="text-xs font-bold text-slate-650 dark:text-zinc-400 cursor-pointer">
                              Exigir complexidade mínima de senhas
                            </label>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="block_registrations"
                              checked={blockRegistrations}
                              onChange={(e) => setBlockRegistrations(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                            />
                            <label htmlFor="block_registrations" className="text-xs font-bold text-slate-650 dark:text-zinc-400 cursor-pointer">
                              Bloquear novos cadastros
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={isSavingSystemSettings}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 px-5 h-10 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-350"
                          >
                            {isSavingSystemSettings && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Salvar Configurações do Sistema
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Manage Categories Card */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 select-none dark:border-zinc-800">
                        <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                        <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">Gerenciar Categorias de Chamados</h3>
                      </div>

                      <div className="space-y-4">
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Nova categoria (Ex: Financeiro)"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 h-10 border border-slate-200 rounded-xl px-4 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-955 dark:text-white"
                          />
                          <button
                            type="submit"
                            className="bg-emerald-650 hover:bg-emerald-700 text-white px-4 h-10 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            Adicionar
                          </button>
                        </form>

                        <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
                          {systemCategories.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 text-xs bg-slate-50/50 hover:bg-slate-50 transition-colors dark:bg-zinc-950/20 dark:hover:bg-zinc-900 dark:text-zinc-350">
                              <span className="font-semibold text-slate-700 dark:text-zinc-300">{cat}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(cat)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Admin Profile Settings (Meu Perfil) */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
                      <div className="flex items-center gap-2 border-b border-slate-105 pb-3 select-none dark:border-zinc-800">
                        <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                        <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">Ajustes de Perfil (Meu Perfil)</h3>
                      </div>

                      {/* Photo Profile block */}
                      <div className="flex flex-col items-center gap-3.5 select-none">
                        <div className="relative cursor-pointer group" onClick={() => avatarFileInputRef.current?.click()}>
                          {currentUser?.foto_url ? (
                            <img
                              src={currentUser.foto_url}
                              alt="Minha Foto"
                              className="h-20 w-20 rounded-2xl object-cover border border-slate-200 shadow-sm dark:border-zinc-800"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-2xl bg-emerald-105 text-emerald-700 flex items-center justify-center font-extrabold text-xl shadow-sm border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400">
                              {avatarInitials}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/45 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Alterar</span>
                          </div>
                        </div>
                        <input
                          type="file"
                          ref={avatarFileInputRef}
                          onChange={handleAvatarUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="text-center">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{currentUser?.nome}</h4>
                          <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">
                            {currentUser?.cargo || "Administrador"}
                          </span>
                        </div>
                      </div>

                      {/* Form */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block">Nome Completo</label>
                          <input
                            type="text"
                            value={profileNome}
                            onChange={(e) => setProfileNome(e.target.value)}
                            className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-955 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 block flex items-center gap-1 select-none dark:text-zinc-400">
                            E-mail Institucional <Lock className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                          </label>
                          <input
                            type="email"
                            disabled
                            value={profileEmail}
                            className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-500"
                          />
                        </div>

                        {/* Dark Mode Switch */}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl select-none dark:bg-zinc-955 dark:border-zinc-800">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-700 block dark:text-zinc-350">Tema Escuro</span>
                            <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold leading-relaxed">
                              Ativa o modo escuro no painel administrativo.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDarkThemeChange(!prefTemaEscuro)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                              prefTemaEscuro ? "bg-emerald-600" : "bg-slate-300 dark:bg-zinc-800"
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                prefTemaEscuro ? "translate-x-6" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2.5 pt-2 select-none">
                          <button
                            onClick={discardSettingsChanges}
                            className="flex-1 h-10 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-850"
                          >
                            Descartar
                          </button>
                          <button
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="flex-1 h-10 bg-[#0d1317] hover:bg-[#1a2329] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:bg-slate-350"
                          >
                            {isSavingSettings && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Salvar Perfil
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Dialog: Edit User Details */}
      {isEditUserOpen && selectedUser && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditUserOpen(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-slate-150 rounded-2xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-4 select-none">Editar Dados do Usuário</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-605">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-605">E-mail institucional</label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-605">Cargo / Curso</label>
                <input
                  type="text"
                  value={editUserCargo}
                  onChange={(e) => setEditUserCargo(e.target.value)}
                  className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40"
                />
              </div>

              <div className="flex items-center gap-2 select-none pt-1">
                <input
                  type="checkbox"
                  id="edit_is_admin"
                  checked={editUserIsAdmin}
                  onChange={(e) => setEditUserIsAdmin(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="edit_is_admin" className="text-xs font-bold text-slate-650 cursor-pointer">
                  Conceder privilégios de Administrador
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="px-4.5 h-10 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-4.5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
                >
                  {isUpdatingUser && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Floating Dialog: Update Ticket Status & Deadline */}
      {isStatusDialogOpen && statusDialogTicket && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsStatusDialogOpen(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-slate-150 rounded-2xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-4 select-none">Definir Prazo e Status (Chamado #{statusDialogTicket.id})</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1 select-none">
                <label className="text-xs font-bold text-slate-605">Status do Atendimento</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value as any)}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40 font-semibold cursor-pointer"
                >
                  <option value="pendente">Aberto / Pendente</option>
                  <option value="em_andamento">Em Atendimento</option>
                  <option value="finalizado">Finalizado / Resolvido</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-605">Definir Prazo de SLA Limite</label>
                <input
                  type="datetime-local"
                  value={ticketPrazo}
                  onChange={(e) => setTicketPrazo(e.target.value)}
                  className="w-full h-10 border border-slate-200 rounded-xl px-4 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500/40"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStatusDialogOpen(false)}
                  className="px-4.5 h-10 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-4.5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
                >
                  {isUpdatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Atualizar Chamado
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0d1317] border-t border-white/5 flex items-center justify-around z-30 px-2 select-none">
        <button
          onClick={() => { setActiveTab("fila"); setTicketView("list"); }}
          className={`p-2.5 rounded-xl transition-all ${
            activeTab === "fila" ? "text-white bg-[#1e293b] border-t-2 border-emerald-500 rounded-t-none" : "text-slate-400"
          }`}
        >
          <Inbox className="h-5 w-5" />
        </button>
        <button
          onClick={() => { setActiveTab("resolvidos"); setTicketView("list"); }}
          className={`p-2.5 rounded-xl transition-all ${
            activeTab === "resolvidos" ? "text-white bg-[#1e293b] border-t-2 border-emerald-500 rounded-t-none" : "text-slate-400"
          }`}
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
        <button
          onClick={() => { setActiveTab("usuarios"); setTicketView("list"); }}
          className={`p-2.5 rounded-xl transition-all ${
            activeTab === "usuarios" ? "text-white bg-[#1e293b] border-t-2 border-emerald-500 rounded-t-none" : "text-slate-400"
          }`}
        >
          <Users className="h-5 w-5" />
        </button>
        <button
          onClick={() => { setActiveTab("avisos"); setTicketView("list"); }}
          className={`p-2.5 rounded-xl transition-all ${
            activeTab === "avisos" ? "text-white bg-[#1e293b] border-t-2 border-emerald-500 rounded-t-none" : "text-slate-400"
          }`}
        >
          <Megaphone className="h-5 w-5" />
        </button>
        <button
          onClick={() => { setActiveTab("configuracoes"); setTicketView("list"); }}
          className={`p-2.5 rounded-xl transition-all ${
            activeTab === "configuracoes" ? "text-white bg-[#1e293b] border-t-2 border-emerald-500 rounded-t-none" : "text-slate-400"
          }`}
        >
          <Settings className="h-5 w-5" />
        </button>
      </nav>
    </div>
  );
}
