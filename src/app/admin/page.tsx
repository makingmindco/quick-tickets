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

let dbClockOffset = 0;

export default function AdminDashboard() {
  const router = useRouter();

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Tab state: 'fila' | 'resolvidos' | 'relatorios' | 'usuarios' | 'avisos' | 'configuracoes'
  const [activeTab, setActiveTab] = useState<"fila" | "resolvidos" | "relatorios" | "usuarios" | "avisos" | "configuracoes">("fila");


  // Ticket sub-view: 'list' | 'chat'
  const [ticketView, setTicketView] = useState<"list" | "chat">("list");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Data states
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<Ticket[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [avisosList, setAvisosList] = useState<Aviso[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [statusStats, setStatusStats] = useState({ pendente: 0, em_andamento: 0, finalizado: 0 });
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Metrics states
  const [metricsData, setMetricsData] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Canned responses states
  const [cannedResponses, setCannedResponses] = useState<{ id: number; titulo: string; mensagem: string }[]>([]);
  const [showCannedDropdown, setShowCannedDropdown] = useState(false);
  const [cannedSearchQuery, setCannedSearchQuery] = useState("");

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("todas");
  const [filterPriority, setFilterPriority] = useState("todas");

  const filteredActiveTickets = activeTickets.filter(ticket => {
    const matchesSearch = 
      (ticket.titulo && ticket.titulo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ticket.cliente && ticket.cliente.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ticket.descricao && ticket.descricao.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (`#${ticket.id}`.includes(searchQuery));

    const matchesCategory = filterCategory === "todas" || ticket.categoria === filterCategory;

    const matchesPriority = filterPriority === "todas" || 
      (filterPriority === "urgente" && ticket.urgencia_solicitada === 1) ||
      (filterPriority === "normal" && ticket.urgencia_solicitada === 0);

    return matchesSearch && matchesCategory && matchesPriority;
  });

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
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoadingAuth, activeTab, ticketView, selectedTicketId]);

  // SSE connection for real-time chat
  useEffect(() => {
    if (ticketView !== "chat" || !selectedTicketId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const eventSource = new EventSource(`/api/tickets/${selectedTicketId}/stream?token=${encodeURIComponent(token)}`);

    eventSource.addEventListener("message_new", (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      } catch (err) {
        console.error("Erro ao analisar nova mensagem SSE:", err);
      }
    });

    eventSource.addEventListener("status_update", (event) => {
      try {
        const updatedTicket = JSON.parse(event.data);
        setSelectedTicket(updatedTicket);
        
        // Update ticket inside activeTickets or resolvedTickets lists
        setActiveTickets((prev) =>
          prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
        );
        setResolvedTickets((prev) =>
          prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
        );
      } catch (err) {
        console.error("Erro ao analisar atualização de status SSE:", err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn("Conexão SSE encontrou um erro. Fechando/reconectando...", err);
    };

    return () => {
      eventSource.close();
    };
  }, [ticketView, selectedTicketId]);

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
      const start = selectedTicket.atendido_em ? new Date(selectedTicket.atendido_em).getTime() : 0;
      if (selectedTicket.status === "pendente" || start === 0) {
        setElapsedTimeText("00:00:00");
        setElapsedPercent(0);
        return;
      }
      
      const end = selectedTicket.status === "finalizado" && selectedTicket.finalizado_em
        ? new Date(selectedTicket.finalizado_em).getTime()
        : new Date().getTime() + dbClockOffset;
      
      const diff = end - start;

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

  // Update document title dynamically based on active tab and view
  useEffect(() => {
    if (ticketView === "chat" && selectedTicket) {
      document.title = `QuickTickets - Atendimento QT-${selectedTicket.id}`;
    } else {
      if (activeTab === "fila") {
        document.title = "QuickTickets - Fila de Chamados";
      } else if (activeTab === "resolvidos") {
        document.title = "QuickTickets - Chamados Resolvidos";
      } else if (activeTab === "usuarios") {
        document.title = "QuickTickets - Gestão de Usuários";
      } else if (activeTab === "avisos") {
        document.title = "QuickTickets - Mural de Avisos";
      } else if (activeTab === "configuracoes") {
        document.title = "QuickTickets - Ajustes do Painel";
      } else {
        document.title = "QuickTickets - Painel Admin";
      }
    }
  }, [activeTab, ticketView, selectedTicket]);

  // Auto-open ticket from notification query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ticketIdParam = params.get("ticketId");
      if (ticketIdParam) {
        const ticketId = parseInt(ticketIdParam);
        const allTickets = [...activeTickets, ...resolvedTickets];
        if (allTickets.length > 0) {
          const ticket = allTickets.find(t => t.id === ticketId);
          if (ticket) {
            setSelectedTicketId(ticketId);
            setSelectedTicket(ticket);
            setChatMessages([]);
            fetchChatMessages(ticketId);
            setTicketView("chat");
            setShowDetails(false);
            
            // Clean up query param from URL without page reload
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        }
      }
    }
  }, [activeTickets, resolvedTickets, ticketView]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const syncClockOffset = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/time", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.db_time) {
          const dbTime = new Date(data.db_time).getTime();
          const localTime = new Date().getTime();
          dbClockOffset = dbTime - localTime;
        }
      }
    } catch (e) {
      console.error("Error syncing clock offset:", e);
    }
  };

  const fetchCannedResponses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/respostas-rapidas", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCannedResponses(data);
      }
    } catch (e) {
      console.error("Erro ao carregar respostas rápidas:", e);
    }
  };

  const fetchMetricsData = async () => {
    setIsLoadingMetrics(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/metrics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetricsData(data);
      }
    } catch (e) {
      console.error("Erro ao buscar métricas:", e);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (activeTab === "relatorios") {
      fetchMetricsData();
    }
  }, [activeTab]);

  const handleChatInputChange = (val: string) => {
    setNewChatMessage(val);
    if (val.startsWith("/")) {
      setShowCannedDropdown(true);
      setCannedSearchQuery(val.slice(1));
    } else {
      setShowCannedDropdown(false);
      setCannedSearchQuery("");
    }
  };

  const handleSelectCanned = (message: string) => {
    setNewChatMessage(message);
    setShowCannedDropdown(false);
  };

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await syncClockOffset();
      fetchCannedResponses();

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
          if (data.length > 0 && data[0].db_time) {
            const dbTime = new Date(data[0].db_time).getTime();
            const localTime = new Date().getTime();
            dbClockOffset = dbTime - localTime;
          }
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
          if (data.length > 0 && data[0].db_time) {
            const dbTime = new Date(data[0].db_time).getTime();
            const localTime = new Date().getTime();
            dbClockOffset = dbTime - localTime;
          }
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

  const handleNotificationClick = async (notif: any) => {
    markSingleNotificationRead(notif.id);
    setShowNotifications(false);
    if (!notif.link) return;

    try {
      const url = new URL(notif.link, window.location.origin);
      const ticketIdParam = url.searchParams.get("ticketId");
      if (ticketIdParam) {
        const ticketId = parseInt(ticketIdParam);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const queueRes = await fetch("/api/admin/tickets", { headers });
        const finishedRes = await fetch("/api/admin/tickets/finalizados", { headers });

        let foundTicket: Ticket | undefined;
        if (queueRes.ok) {
          const data = await queueRes.json();
          foundTicket = data.find((t: any) => t.id === ticketId);
        }
        if (!foundTicket && finishedRes.ok) {
          const data = await finishedRes.json();
          foundTicket = data.find((t: any) => t.id === ticketId);
        }

        if (foundTicket) {
          setSelectedTicketId(ticketId);
          setSelectedTicket(foundTicket);
          setChatMessages([]);
          fetchChatMessages(ticketId);

          if (foundTicket.status === "finalizado") {
            setActiveTab("resolvidos");
          } else {
            setActiveTab("fila");
          }
          setTicketView("chat");
          setShowDetails(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    router.push(notif.link);
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
          const updated = { ...selectedTicket!, status: "em_andamento" as const, admin_id: currentUser?.id || null, atendido_em: selectedTicket?.atendido_em || new Date(new Date().getTime() + dbClockOffset).toISOString() };
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
          const updated = { 
            ...selectedTicket!, 
            status: ticketStatus, 
            prazo: ticketPrazo ? new Date(ticketPrazo).toISOString() : null,
            atendido_em: ticketStatus === "em_andamento" || ticketStatus === "finalizado" ? (selectedTicket?.atendido_em || new Date(new Date().getTime() + dbClockOffset).toISOString()) : null,
            finalizado_em: ticketStatus === "finalizado" ? (selectedTicket?.finalizado_em || new Date(new Date().getTime() + dbClockOffset).toISOString()) : null
          };
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
          const updated = { 
            ...selectedTicket!, 
            status: "finalizado" as const, 
            prazo: null, 
            finalizado_em: new Date(new Date().getTime() + dbClockOffset).toISOString(), 
            atendido_em: selectedTicket?.atendido_em || new Date(new Date().getTime() + dbClockOffset).toISOString() 
          };
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
        setShowCannedDropdown(false);
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
          <div className="p-6 border-b border-white/5 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-center">
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
              onClick={() => { setActiveTab("relatorios"); setTicketView("list"); }}
              className={`w-full flex items-center gap-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === "relatorios" && ticketView === "list"
                  ? "bg-[#1e293b] text-white border-l-4 border-emerald-500 rounded-l-none pl-3.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 pl-4.5"
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5 shrink-0" />
              Gráficos / Métricas
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
        <header className="h-20 bg-white dark:bg-zinc-900 border-b border-slate-150 dark:border-zinc-800/80 flex items-center justify-between px-6 md:px-8 shrink-0 relative z-30">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.png" alt="QuickTickets Logo" className="md:hidden h-8 w-auto object-contain" />
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight select-none">
              {activeTab === "fila" && (ticketView === "chat" ? "Conversa / Detalhes" : "Fila de Atendimento")}
              {activeTab === "resolvidos" && (ticketView === "chat" ? "Histórico de Conversa" : "Chamados Resolvidos")}
              {activeTab === "usuarios" && "Gerenciar Usuários"}
              {activeTab === "avisos" && "Mural de Avisos"}
              {activeTab === "configuracoes" && "Configurações do Sistema"}
            </h1>
          </div>

          <div className="flex items-center gap-5">
            {/* Quick Metrics display */}
            <div className="hidden lg:flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-zinc-400 border-r border-slate-150 dark:border-zinc-800 pr-5 select-none">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /> {statusStats.pendente} pendentes</span>
              <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 text-primary-corp animate-spin" /> {statusStats.em_andamento} em atendimento</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {statusStats.finalizado} resolvidos</span>
            </div>

            {/* Notification bell button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-500 hover:text-slate-800 dark:text-zinc-450 dark:hover:text-white transition-colors h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 flex items-center justify-center relative cursor-pointer"
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
                  <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-150 dark:border-zinc-800 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-4.5 py-3.5 border-b border-slate-150 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950 select-none">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">Notificações</span>
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-bold text-[#00afef] hover:underline cursor-pointer"
                      >
                        Marcar todas como lidas
                      </button>
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs font-semibold text-slate-400">
                          Nenhuma notificação no momento.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 transition-colors flex gap-3 cursor-pointer ${
                              !notif.lida ? "bg-blue-50/50 dark:bg-[#0f62ac]/10 hover:bg-blue-50 dark:hover:bg-[#0f62ac]/20" : "hover:bg-slate-55 dark:hover:bg-zinc-850/50"
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {notif.tipo === "system" || notif.tipo === "patch" ? (
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                                  <Wrench className="h-4 w-4" />
                                </div>
                              ) : notif.tipo === "mensagem" ? (
                                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                                  <Inbox className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                                  <Bell className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <h5 className={`text-xs font-extrabold truncate ${!notif.lida ? "text-[#0f62ac] dark:text-[#00afef]" : "text-slate-700 dark:text-zinc-350"}`}>
                                  {notif.titulo}
                                </h5>
                                {!notif.lida && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                              </div>
                              <p className="text-[11px] text-slate-550 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed font-medium">
                                {notif.mensagem}
                              </p>
                              <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-bold block mt-1.5">
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
                  className="h-9 w-9 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-zinc-800"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 flex items-center justify-center font-extrabold text-xs shadow-sm">
                  {avatarInitials}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[130px]">{currentUser?.nome}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-550">{currentUser?.cargo || "Administrador"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel View Wrapper */}
        <div className={`flex-1 flex flex-col ${
          ticketView === "chat"
            ? "overflow-hidden p-0 md:p-6"
            : "overflow-y-auto p-6 md:p-8"
        }`}>
          
          {/* TICKET DETAILS SCREEN (3-Column View, Screenshot 4) */}
          {ticketView === "chat" && selectedTicket ? (
            <div className="h-full w-full flex flex-col xl:flex-row gap-6 overflow-hidden relative">
              
              {/* Column 1: Requestor Metadata Panel (Left) */}
              <div className={`${
                showDetails ? "absolute inset-0 z-20 flex bg-white dark:bg-zinc-900" : "hidden"
              } xl:flex xl:relative xl:z-0 w-full xl:w-72 border border-slate-150 dark:border-zinc-800 rounded-3xl p-5.5 shadow-sm shrink-0 overflow-y-auto select-none flex-col space-y-5.5`}>
                
                <div className="flex items-center justify-between xl:block shrink-0">
                  <button
                    onClick={() => setTicketView("list")}
                    className="flex items-center gap-2 text-xs font-bold text-slate-455 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para Fila
                  </button>
                  
                  <button
                    onClick={() => setShowDetails(false)}
                    className="xl:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850"
                    title="Fechar Detalhes"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <hr className="border-slate-100 dark:border-zinc-800" />

                <div className="space-y-3.5">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">SOLICITANTE</span>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-750 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
                      {getInitials(selectedTicket.cliente_nome || selectedTicket.cliente)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-white truncate">{selectedTicket.cliente_nome || selectedTicket.cliente || "Aluno"}</h4>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 mt-0.5 uppercase tracking-wide">ID: #{selectedTicket.usuario_id}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-650 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl">
                    <p><span className="font-bold text-slate-400 dark:text-zinc-500 uppercase text-[9px] mr-1.5">Cargo:</span> {selectedTicket.cliente || "Estudante"}</p>
                    <p className="truncate" title={selectedTicket.cliente_email || ""}><span className="font-bold text-slate-400 dark:text-zinc-500 uppercase text-[9px] mr-1.5">E-mail:</span> {selectedTicket.cliente_email || "N/D"}</p>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-zinc-800" />

                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">PRIORIDADE & STATUS</span>
                  
                  <div className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    selectedTicket.status === "finalizado"
                      ? "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                      : selectedTicket.id % 3 === 0
                      ? "bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/35"
                      : selectedTicket.id % 3 === 1
                      ? "bg-amber-50 dark:bg-amber-950/20 text-amber-655 dark:text-amber-400 border border-amber-100 dark:border-amber-900/35"
                      : "bg-blue-50 dark:bg-blue-950/20 text-blue-655 dark:text-blue-400 border border-blue-100 dark:border-blue-900/35"
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
                      ? "bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30"
                      : selectedTicket.status === "em_andamento"
                      ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30"
                      : "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30"
                  }`}>
                    <span>Status:</span>
                    <span className="font-extrabold uppercase">{selectedTicket.status === "em_andamento" ? "Em Andamento" : selectedTicket.status}</span>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-zinc-800" />

                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">CONTEXTO ACADÊMICO</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans">1º Semestre</span>
                    <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans">{selectedTicket.categoria}</span>
                    <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans">ID-{selectedTicket.id}</span>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-zinc-800" />

                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">ARQUIVOS ANEXADOS</span>
                  
                  {chatMessages.filter(m => m.arquivo_url).length === 0 ? (
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold italic">Nenhum anexo neste chamado.</p>
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
                            className="flex items-center gap-2.5 bg-slate-50 dark:bg-zinc-950/30 border border-slate-150 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition-all cursor-pointer"
                          >
                            <FileText className="h-4.5 w-4.5 text-[#10b981]" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate">{fileName}</p>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 mt-0.5">Anexado em {formattedTime}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedTicket.status === "finalizado" && selectedTicket.avaliacao_nota !== null && (
                  <>
                    <hr className="border-slate-100 dark:border-zinc-800" />
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">AVALIAÇÃO DO ALUNO</span>
                      <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4.5 w-4.5 ${i < (selectedTicket.avaliacao_nota || 0) ? "fill-current text-amber-500" : "text-slate-300 dark:text-zinc-700"}`}
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.49 11.1c-.783-.57-.38-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                            </svg>
                          ))}
                        </div>
                        {selectedTicket.avaliacao_comentario ? (
                          <p className="text-[11px] text-slate-650 dark:text-zinc-350 font-medium leading-relaxed italic">
                            "{selectedTicket.avaliacao_comentario}"
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-medium italic">
                            Sem comentário enviado.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Mobile-only sections from Column 3 */}
                <div className="xl:hidden space-y-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
                  {/* circular SLA counter */}
                  <div className="bg-[#001530] text-white rounded-2xl p-5 text-center shadow-md relative overflow-hidden select-none space-y-3 flex flex-col items-center">
                    <span className="text-[9px] font-extrabold text-slate-355 dark:text-zinc-400 tracking-wider uppercase">TEMPO EM ABERTO</span>
                    
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

                  {/* STATUS CONTROL Actions */}
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

                  {/* ACTIVITY LOG timeline */}
                  <div className="space-y-3.5 select-none">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">LOG DE ATIVIDADES</span>
                    <div className="space-y-4 border-l border-slate-200 pl-3.5 relative">
                      <div className="relative text-xs space-y-0.5">
                        <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 border border-white" />
                        <p className="font-bold text-slate-700">Chamado Aberto</p>
                        <p className="text-[10px] text-slate-455 font-bold">{new Date(selectedTicket.criado_em).toLocaleDateString("pt-BR")}</p>
                      </div>

                      {selectedTicket.admin_id && (
                        <div className="relative text-xs space-y-0.5">
                          <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
                          <p className="font-bold text-slate-700">Responsável Atribuído</p>
                          <p className="text-[10px] text-slate-455 font-bold">Admin ID #{selectedTicket.admin_id}</p>
                        </div>
                      )}

                      {selectedTicket.status === "finalizado" && (
                        <div className="relative text-xs space-y-0.5">
                          <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-red-500 border border-white" />
                          <p className="font-bold text-slate-700">Ticket Finalizado</p>
                          <p className="text-[10px] text-slate-455 font-bold">Resolvido pelo Suporte</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Chat Conversation Panel (Center) */}
              <div className="flex-1 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                <div className="px-5.5 py-4 border-b border-slate-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/20 flex items-center justify-between shrink-0">
                  <div className="min-w-0 pr-4 flex items-center gap-2">
                    <button
                      onClick={() => setTicketView("list")}
                      className="xl:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">TICKET ID: QT-{selectedTicket.id}</span>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white truncate mt-0.5">
                        {selectedTicket.titulo || selectedTicket.categoria}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setShowDetails(true)}
                      className="xl:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Ver Detalhes do Chamado"
                    >
                      <AlertCircle className="h-5 w-5" />
                    </button>
                    
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
                  <div className="px-5 py-2.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between shrink-0 select-none">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 flex items-center justify-center text-[10px] font-bold">
                        {selectedChatFile ? "IMG" : "AUD"}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[240px]">
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

                <form onSubmit={handleSendChatMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-150 dark:border-zinc-800 shrink-0">
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

                  <div className="flex flex-col gap-2 relative">
                    {/* Private Internal Note checkbox toggle */}
                    <div className="flex items-center gap-2 px-1 select-none">
                      <input
                        type="checkbox"
                        id="internal_note"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <label htmlFor="internal_note" className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 cursor-pointer uppercase tracking-wider">
                        Nota interna / privada (Apenas para equipe de suporte)
                      </label>
                    </div>

                    {/* Canned Responses Autocomplete Dropdown */}
                    {showCannedDropdown && (
                      <div className="absolute bottom-full mb-2 left-0 right-0 max-h-60 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1">
                        <div className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-1 border-b border-slate-100 dark:border-zinc-800/80 mb-1">
                          Respostas Rápidas (Selecione uma)
                        </div>
                        {cannedResponses
                          .filter(item => 
                            item.titulo.toLowerCase().includes(cannedSearchQuery.toLowerCase()) ||
                            item.mensagem.toLowerCase().includes(cannedSearchQuery.toLowerCase())
                          )
                          .map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectCanned(item.mensagem)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors flex flex-col gap-0.5 group"
                            >
                              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 group-hover:text-emerald-500">
                                {item.titulo}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-zinc-450 line-clamp-1">
                                {item.mensagem}
                              </span>
                            </button>
                          ))}
                        {cannedResponses.filter(item => 
                          item.titulo.toLowerCase().includes(cannedSearchQuery.toLowerCase()) ||
                          item.mensagem.toLowerCase().includes(cannedSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="text-[11px] text-slate-500 dark:text-zinc-450 px-2 py-2">
                            Nenhuma resposta rápida encontrada para "/{cannedSearchQuery}"
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={() => chatFileInputRef.current?.click()}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-800 dark:hover:text-white transition-colors shrink-0"
                          title="Anexar Imagem"
                        >
                          <Paperclip className="h-4.5 w-4.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shrink-0"
                          title="Cancelar Gravação"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}

                      {!isRecording ? (
                        <input
                          type="text"
                          value={newChatMessage}
                          onChange={(e) => handleChatInputChange(e.target.value)}
                          placeholder={isInternalNote ? "Escreva uma nota interna privada..." : "Escreva uma resposta ao aluno..."}
                          className="flex-1 h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 text-xs font-medium bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-emerald-500/40 transition-colors dark:text-white"
                        />
                      ) : (
                        <div className="flex-1 h-10 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-wider">Gravando Áudio do Atendente</span>
                          <span className="text-xs font-bold text-red-500 dark:text-red-400 font-mono">
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
              <div className="hidden xl:flex xl:flex-col w-full xl:w-72 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl p-5.5 shadow-sm shrink-0 overflow-y-auto space-y-6">
                
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
                        className="w-full h-11 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-between px-4 cursor-pointer"
                      >
                        <span>Definir Prazo / Status</span>
                        <Calendar className="h-4.5 w-4.5 text-slate-450 dark:text-zinc-500" />
                      </button>
                    </>
                  ) : (
                    <div className="p-3 border border-emerald-250 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 rounded-xl text-center text-xs font-bold">
                      ✓ Chamado Finalizado / Resolvido
                    </div>
                  )}

                  <button
                    onClick={() => handleFinalizeTicket(selectedTicket.id)}
                    disabled={selectedTicket.status === "finalizado"}
                    className="w-full h-11 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-xs font-bold flex items-center justify-between px-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Rejeitar / Encerrar</span>
                    <X className="h-4.5 w-4.5 text-red-450 dark:text-red-500" />
                  </button>
                </div>

                <div className="space-y-3.5 select-none">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">LOG DE ATIVIDADES</span>
                  <div className="space-y-4 border-l border-slate-200 dark:border-zinc-800 pl-3.5 relative">
                    <div className="relative text-xs space-y-0.5">
                      <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 border border-white dark:border-zinc-900" />
                      <p className="font-bold text-slate-700 dark:text-zinc-300">Chamado Aberto</p>
                      <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold">{new Date(selectedTicket.criado_em).toLocaleDateString("pt-BR")}</p>
                    </div>

                    {selectedTicket.admin_id && (
                      <div className="relative text-xs space-y-0.5">
                        <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white dark:border-zinc-900" />
                        <p className="font-bold text-slate-700 dark:text-zinc-300">Responsável Atribuído</p>
                        <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold">Admin ID #{selectedTicket.admin_id}</p>
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
                    <div className="p-16 border border-dashed border-slate-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl text-center select-none animate-in fade-in">
                      <ClipboardList className="h-12 w-12 text-slate-300 dark:text-zinc-700 mx-auto mb-4" />
                      <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200">Fila limpa!</h3>
                      <p className="text-xs text-slate-450 dark:text-zinc-500 mt-1">Nenhum chamado aberto ou pendente precisando de atenção no momento.</p>
                    </div>
                  ) : (
                    <>
                      {/* Search and Filters Header */}
                      <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-4.5 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center select-none">
                        <div className="relative w-full md:w-80">
                          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-zinc-550" />
                          <input
                            type="text"
                            placeholder="Buscar por ID, título, aluno ou descrição..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-500/40 transition-colors dark:text-white"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-650 dark:text-zinc-550 dark:hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                          {/* Category Filter Selector */}
                          <div className="flex flex-col gap-1 w-full sm:w-auto">
                            <select
                              value={filterCategory}
                              onChange={(e) => setFilterCategory(e.target.value)}
                              className="h-10 rounded-xl border border-slate-205 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 px-3.5 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-emerald-500/40 cursor-pointer"
                            >
                              <option value="todas">Todas as Categorias</option>
                              <option value="Acadêmico">Acadêmico</option>
                              <option value="Financeiro / Secretaria">Financeiro / Secretaria</option>
                              <option value="Infraestrutura">Infraestrutura</option>
                              <option value="Acessos / TI">Acessos / TI</option>
                              <option value="Outros">Outros</option>
                            </select>
                          </div>

                          {/* Urgency Filter Selector */}
                          <div className="flex flex-col gap-1 w-full sm:w-auto">
                            <select
                              value={filterPriority}
                              onChange={(e) => setFilterPriority(e.target.value)}
                              className="h-10 rounded-xl border border-slate-205 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 px-3.5 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-emerald-500/40 cursor-pointer"
                            >
                              <option value="todas">Todas as Prioridades</option>
                              <option value="normal">Normal</option>
                              <option value="urgente">Urgência Solicitada</option>
                            </select>
                          </div>

                          {/* Clear Filters Button */}
                          {(searchQuery || filterCategory !== "todas" || filterPriority !== "todas") && (
                            <button
                              onClick={() => {
                                setSearchQuery("");
                                setFilterCategory("todas");
                                setFilterPriority("todas");
                              }}
                              className="h-10 px-4 rounded-xl text-xs font-extrabold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-650 transition-colors uppercase tracking-wider cursor-pointer"
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                      </div>

                      {filteredActiveTickets.length === 0 ? (
                        <div className="p-16 border border-dashed border-slate-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl text-center select-none animate-in fade-in">
                          <Search className="h-12 w-12 text-slate-300 dark:text-zinc-700 mx-auto mb-4" />
                          <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200">Nenhum chamado encontrado</h3>
                          <p className="text-xs text-slate-450 dark:text-zinc-500 mt-1">Nenhum chamado na fila corresponde aos critérios de busca ou filtros selecionados.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                          {filteredActiveTickets.map(ticket => {
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
                                  setShowDetails(false);
                                }}
                                className={`bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-500/20 cursor-pointer flex flex-col justify-between relative ${
                                  ticket.status === "em_andamento"
                                    ? "border-t-4 border-t-emerald-650"
                                    : "border-t-4 border-t-amber-500"
                                }`}
                          >
                            <div className="flex gap-4 items-start">
                              <div className="h-11 w-11 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 shrink-0 mt-0.5">
                                <FolderClosed className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white line-clamp-1">
                                    {ticket.titulo || ticket.categoria}
                                  </h3>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {ticket.prazo && (
                                      <span className="text-[9px] font-extrabold bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-2 py-0.5 rounded-full flex items-center gap-1 select-none">
                                        <Calendar className="h-3 w-3" />
                                        Prazo: {new Date(ticket.prazo).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                      </span>
                                    )}
                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                                      ticket.status === "pendente"
                                        ? "text-amber-500"
                                        : "text-[#0d1317] dark:text-[#00afef]"
                                    }`}>
                                      {ticket.status === "pendente" ? "ABERTO" : "ATENDIMENTO"}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-105 dark:border-zinc-800 p-2.5 rounded-xl mt-3 text-xs space-y-1">
                                  <p className="text-slate-600 dark:text-zinc-350 font-semibold"><span className="font-bold text-slate-400 dark:text-zinc-500 uppercase text-[9px] mr-1">Aluno:</span> {ticket.cliente || "Estudante"}</p>
                                  <p className="text-slate-600 dark:text-zinc-350 font-semibold"><span className="font-bold text-slate-400 dark:text-zinc-500 uppercase text-[9px] mr-1">Categoria:</span> {ticket.categoria}</p>
                                  <p className="text-slate-655 dark:text-zinc-300 font-semibold"><span className="font-bold text-slate-400 dark:text-zinc-500 uppercase text-[9px] mr-1">Criado em:</span> {formattedDate}</p>
                                </div>
                                
                                <p className="text-xs text-slate-550 dark:text-zinc-400 mt-3 line-clamp-3 leading-relaxed font-medium">
                                  {ticket.descricao}
                                </p>
                              </div>
                            </div>
                            
                            <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 mt-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 select-none">
                                <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                                  {getInitials(ticket.cliente)}
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
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
                                      className="border border-slate-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-305 hover:bg-slate-50 dark:hover:bg-zinc-850 active:scale-95 px-2.5 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
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
                  </>
                  )}
                </div>
              )}

              {/* TAB 2: CHAMADOS RESOLVIDOS */}
              {activeTab === "resolvidos" && (
                <div className="space-y-6">
                  {resolvedTickets.length === 0 ? (
                    <div className="p-16 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-center select-none">
                      <p className="text-xs font-semibold text-slate-400 dark:text-zinc-550">Nenhum chamado no histórico de finalizados.</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider select-none">
                              <th className="p-4 pl-6">ID</th>
                              <th className="p-4">Assunto</th>
                              <th className="p-4">Aluno</th>
                              <th className="p-4">Categoria</th>
                              <th className="p-4">Responsável</th>
                              <th className="p-4">Avaliação</th>
                              <th className="p-4">Abertura</th>
                              <th className="p-4 pr-6 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-855 font-medium text-slate-700 dark:text-zinc-300">
                            {resolvedTickets.map(ticket => (
                              <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-zinc-850/50 transition-colors">
                                <td className="p-4 pl-6 font-bold text-slate-400 dark:text-zinc-550">#{ticket.id}</td>
                                <td className="p-4 font-bold text-slate-800 dark:text-white truncate max-w-[180px]" title={ticket.titulo || ""}>
                                  {ticket.titulo || ticket.categoria}
                                </td>
                                <td className="p-4">{ticket.cliente || "Estudante"}</td>
                                <td className="p-4">
                                  <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-350 px-2 py-0.5 rounded-md font-semibold select-none">
                                    {ticket.categoria}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-slate-500 dark:text-zinc-450">{ticket.admin_nome || "Nenhum"}</td>
                                <td className="p-4">
                                  {ticket.avaliacao_nota !== null && ticket.avaliacao_nota !== undefined ? (
                                    <div className="flex items-center gap-1 text-amber-500" title={ticket.avaliacao_comentario || "Sem comentário"}>
                                      <span className="text-amber-500">★</span>
                                      <span className="font-extrabold text-[11px]">{ticket.avaliacao_nota}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 dark:text-zinc-650 font-bold">-</span>
                                  )}
                                </td>
                                <td className="p-4 text-slate-400 dark:text-zinc-500">
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
                                      setShowDetails(false);
                                    }}
                                    className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-800 dark:hover:text-white px-3.5 py-1.5 rounded-lg font-bold transition-all text-[11px] cursor-pointer"
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

              {/* TAB 1.5: GRÁFICOS E RELATÓRIOS */}
              {activeTab === "relatorios" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center select-none">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                      Métricas e Estatísticas do Sistema
                    </h3>
                    <button
                      onClick={fetchMetricsData}
                      disabled={isLoadingMetrics}
                      className="bg-slate-100 dark:bg-zinc-800 hover:bg-slate-205 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-350 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {isLoadingMetrics ? "Atualizando..." : "Atualizar Dados"}
                    </button>
                  </div>

                  {isLoadingMetrics && !metricsData ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="h-9 w-9 text-blue-650 animate-spin" />
                      <span className="text-sm font-semibold text-slate-500">Compilando relatórios analíticos...</span>
                    </div>
                  ) : !metricsData ? (
                    <div className="p-16 border border-dashed border-slate-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl text-center">
                      <p className="text-xs text-slate-400">Nenhum dado de métrica disponível no momento.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Grid of Key Performance Indicators (KPIs) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        
                        {/* KPI 1: SLA Tempo de Resposta */}
                        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between select-none">
                          <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Tempo Médio de Resposta</span>
                          <div className="mt-3 flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                              {metricsData.avgResponseTime < 60 
                                ? `${metricsData.avgResponseTime}m`
                                : `${Math.floor(metricsData.avgResponseTime / 60)}h ${metricsData.avgResponseTime % 60}m`
                              }
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 mt-2 block">Média desde a criação até o primeiro atendimento</span>
                        </div>

                        {/* KPI 2: Tempo de Resolução */}
                        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between select-none">
                          <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Tempo Médio de Resolução</span>
                          <div className="mt-3 flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                              {metricsData.avgResolutionTime < 60 
                                ? `${metricsData.avgResolutionTime}m`
                                : `${Math.floor(metricsData.avgResolutionTime / 60)}h ${metricsData.avgResolutionTime % 60}m`
                              }
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 mt-2 block">Média desde o início do atendimento até a conclusão</span>
                        </div>

                        {/* KPI 3: Satisfação Geral */}
                        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between select-none">
                          <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Satisfação Geral</span>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                              {metricsData.satisfaction.avgRating > 0 ? metricsData.satisfaction.avgRating : "-"}
                            </span>
                            {metricsData.satisfaction.avgRating > 0 && (
                              <div className="flex text-amber-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`h-4.5 w-4.5 ${i < Math.round(metricsData.satisfaction.avgRating) ? "fill-current" : "text-slate-200 dark:text-zinc-800"}`}
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.49 11.1c-.783-.57-.38-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                                  </svg>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 mt-2 block">Baseado em {metricsData.satisfaction.totalRatings} avaliações enviadas</span>
                        </div>

                        {/* KPI 4: Solicitações de Urgência */}
                        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between select-none">
                          <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Avisos de Urgência</span>
                          <div className="mt-3 flex items-baseline gap-1">
                            <span className="text-3xl font-black text-red-500 tracking-tight">
                              {metricsData.urgencyStats.urgente}
                            </span>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500">solicitados</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 mt-2 block">Número de chamados que usaram "solicitar urgência"</span>
                        </div>

                      </div>

                      {/* Charts Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
                        
                        {/* Chart 1: Volumetria por Categoria (Gráfico de Barras SVG) */}
                        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Volumetria por Categoria</span>
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Quantidade total de chamados abertos por setor</span>
                          </div>

                          <div className="mt-6 space-y-4">
                            {metricsData.categoryStats.length === 0 ? (
                              <div className="h-48 flex items-center justify-center text-xs text-slate-400 italic">Sem chamados registrados por categoria.</div>
                            ) : (
                              metricsData.categoryStats.map((item: any, i: number) => {
                                const maxVal = Math.max(...metricsData.categoryStats.map((c: any) => c.total), 1);
                                const pct = (item.total / maxVal) * 100;
                                const barColors = [
                                  "bg-[#0f62ac] dark:bg-blue-500",
                                  "bg-emerald-600 dark:bg-emerald-500",
                                  "bg-amber-500 dark:bg-amber-500",
                                  "bg-rose-500 dark:bg-rose-500",
                                  "bg-purple-650 dark:bg-purple-500"
                                ];
                                const colorClass = barColors[i % barColors.length];

                                return (
                                  <div key={item.categoria} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[11px] font-bold">
                                      <span className="text-slate-700 dark:text-zinc-350">{item.categoria}</span>
                                      <span className="text-slate-800 dark:text-white font-black">{item.total} chamados</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-1000 ${colorClass}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Chart 2: Distribuição de Status (Gráfico de Rosca/Doughnut SVG) */}
                        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Status dos Chamados</span>
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Divisão percentual dos chamados no sistema</span>
                          </div>

                          <div className="mt-6 flex flex-col sm:flex-row items-center justify-around gap-6">
                            {/* Doughnut SVG Drawing */}
                            {(() => {
                              const total = metricsData.statusStats.pendente + metricsData.statusStats.em_andamento + metricsData.statusStats.finalizado;
                              if (total === 0) {
                                return <div className="h-48 flex items-center justify-center text-xs text-slate-400 italic">Sem chamados cadastrados.</div>;
                              }

                              const pPct = (metricsData.statusStats.pendente / total) * 100;
                              const ePct = (metricsData.statusStats.em_andamento / total) * 100;
                              const fPct = (metricsData.statusStats.finalizado / total) * 100;

                              const circ = 226.19;
                              const pStroke = (pPct / 100) * circ;
                              const eOffset = circ - pStroke;
                              const eStroke = (ePct / 100) * circ;
                              const fOffset = circ - pStroke - eStroke;
                              const fStroke = (fPct / 100) * circ;

                              return (
                                <>
                                  <div className="relative flex items-center justify-center shrink-0">
                                    <svg className="w-36 h-36 transform -rotate-90">
                                      <circle cx="72" cy="72" r="36" className="stroke-slate-100 dark:stroke-zinc-800" strokeWidth="16" fill="transparent" />
                                      {pStroke > 0 && (
                                        <circle cx="72" cy="72" r="36" className="stroke-amber-500" strokeWidth="16" strokeDasharray={`${pStroke} ${circ}`} strokeDashoffset={circ} fill="transparent" strokeLinecap="round" />
                                      )}
                                      {eStroke > 0 && (
                                        <circle cx="72" cy="72" r="36" className="stroke-[#0f62ac] dark:stroke-blue-500" strokeWidth="16" strokeDasharray={`${eStroke} ${circ}`} strokeDashoffset={eOffset} fill="transparent" strokeLinecap="round" />
                                      )}
                                      {fStroke > 0 && (
                                        <circle cx="72" cy="72" r="36" className="stroke-emerald-650 dark:stroke-emerald-500" strokeWidth="16" strokeDasharray={`${fStroke} ${circ}`} strokeDashoffset={fOffset} fill="transparent" strokeLinecap="round" />
                                      )}
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center text-center">
                                      <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{total}</span>
                                      <span className="text-[7.5px] font-extrabold text-slate-455 dark:text-zinc-550 uppercase tracking-widest">Total</span>
                                    </div>
                                  </div>

                                  <div className="flex-1 space-y-3 w-full max-w-[200px]">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                      <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                                        <span className="text-slate-655 dark:text-zinc-350">Abertos</span>
                                      </div>
                                      <span className="text-slate-850 dark:text-white font-black">{metricsData.statusStats.pendente} ({Math.round(pPct)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold">
                                      <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full bg-[#0f62ac] dark:bg-blue-500 shrink-0" />
                                        <span className="text-slate-655 dark:text-zinc-350">Em Atendimento</span>
                                      </div>
                                      <span className="text-slate-850 dark:text-white font-black">{metricsData.statusStats.em_andamento} ({Math.round(ePct)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold">
                                      <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full bg-emerald-650 dark:bg-emerald-500 shrink-0" />
                                        <span className="text-slate-655 dark:text-zinc-350">Finalizados</span>
                                      </div>
                                      <span className="text-slate-850 dark:text-white font-black">{metricsData.statusStats.finalizado} ({Math.round(fPct)}%)</span>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: GERENCIAR USUÁRIOS */}
              {activeTab === "usuarios" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                  <div className="xl:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider select-none">Usuários Cadastrados</h3>
                    <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider select-none">
                              <th className="p-4 pl-6">ID</th>
                              <th className="p-4">Nome</th>
                              <th className="p-4">E-mail</th>
                              <th className="p-4">Cargo / Função</th>
                              <th className="p-4">Nível</th>
                              <th className="p-4 pr-6 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium text-slate-700 dark:text-zinc-300">
                            {usersList.map(user => {
                              const isUserAdmin = user.is_admin === 1 || user.is_admin === true;
                              return (
                                <tr key={user.id} className="hover:bg-slate-55 dark:hover:bg-zinc-850/50 transition-colors">
                                  <td className="p-4 pl-6 font-bold text-slate-400 dark:text-zinc-550">#{user.id}</td>
                                  <td className="p-4 font-bold text-slate-850 dark:text-white">{user.nome}</td>
                                  <td className="p-4 text-slate-500 dark:text-zinc-400">{user.email}</td>
                                  <td className="p-4 font-bold text-slate-400 dark:text-zinc-500">{user.cargo || "Aluno"}</td>
                                  <td className="p-4">
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full select-none ${
                                      isUserAdmin ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                                    }`}>
                                      {isUserAdmin ? "ADMIN" : "ESTUDANTE"}
                                    </span>
                                  </td>
                                  <td className="p-4 pr-6 text-right space-x-2">
                                    <button
                                      onClick={() => openEditUserDialog(user)}
                                      className="text-slate-500 dark:text-zinc-450 hover:text-emerald-600 dark:hover:text-emerald-450 hover:bg-slate-100 dark:hover:bg-zinc-805 p-1.5 rounded-lg transition-colors cursor-pointer"
                                      title="Editar Usuário"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      disabled={currentUser?.id === user.id}
                                      onClick={() => handleDeleteUser(user.id)}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        currentUser?.id === user.id ? "text-slate-350 dark:text-zinc-700 cursor-not-allowed" : "text-slate-550 dark:text-zinc-400 hover:text-red-650 dark:hover:text-red-450 hover:bg-slate-100 dark:hover:bg-zinc-805 cursor-pointer"
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

                  <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4 select-none">
                      <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Cadastrar Novo Admin</h3>
                    </div>
                    
                    <form onSubmit={handleRegisterAdmin} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-650 dark:text-zinc-400">Nome Completo</label>
                        <input
                          type="text"
                          required
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          placeholder="Ex: João da Silva"
                          className="w-full h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4.5 text-xs bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-905 focus:outline-none focus:border-emerald-500/40 transition-all font-semibold dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-650 dark:text-zinc-400">E-mail</label>
                        <input
                          type="email"
                          required
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="Ex: joao.silva@admin.com"
                          className="w-full h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4.5 text-xs bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-905 focus:outline-none focus:border-emerald-500/40 transition-all font-semibold dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-650 dark:text-zinc-400">Senha Provisória</label>
                        <input
                          type="password"
                          required
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4.5 text-xs bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-905 focus:outline-none focus:border-emerald-500/40 transition-all font-semibold dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-650 dark:text-zinc-400">Cargo / Função</label>
                        <input
                          type="text"
                          value={newAdminCargo}
                          onChange={(e) => setNewAdminCargo(e.target.value)}
                          placeholder="Ex: Coordenador, Suporte TI"
                          className="w-full h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4.5 text-xs bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-905 focus:outline-none focus:border-emerald-500/40 transition-all font-semibold dark:text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAdmin}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 dark:disabled:bg-zinc-800"
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
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider select-none">Comunicados no Mural</h3>
                    <div className="space-y-4">
                      {avisosList.length === 0 ? (
                        <div className="p-12 border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl text-center select-none">
                          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-550">Nenhum aviso publicado no momento.</p>
                        </div>
                      ) : (
                        avisosList.map(aviso => (
                          <div key={aviso.id} className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-5 rounded-2xl flex justify-between gap-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-extrabold text-[#0d1317] dark:text-white">{aviso.titulo}</h4>
                              <p className="text-xs text-slate-550 dark:text-zinc-400 leading-relaxed font-medium">{aviso.mensagem}</p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-zinc-500 font-bold pt-2">
                                <span>Por: {aviso.autor || "Coordenação"}</span>
                                <span>•</span>
                                <span>{new Date(aviso.data_criacao).toLocaleString("pt-BR")}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteAviso(aviso.id)}
                              className="text-red-500 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/20 p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center transition-colors cursor-pointer"
                              title="Remover Aviso"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4 select-none">
                      <Megaphone className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Publicar Novo Comunicado</h3>
                    </div>
                    
                    <form onSubmit={handlePublishAviso} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-650 dark:text-zinc-400">Título do Aviso</label>
                        <input
                          type="text"
                          required
                          value={avisoTitulo}
                          onChange={(e) => setAvisoTitulo(e.target.value)}
                          placeholder="Ex: Manutenção do ar condicionado..."
                          className="w-full h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4.5 text-xs bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-905 focus:outline-none focus:border-emerald-500/40 transition-all font-semibold dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-655 dark:text-zinc-400">Mensagem do Comunicado</label>
                        <textarea
                          required
                          rows={5}
                          value={avisoMensagem}
                          onChange={(e) => setAvisoMensagem(e.target.value)}
                          placeholder="Digite aqui o aviso detalhado..."
                          className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-905 focus:outline-none focus:border-emerald-500/40 transition-all font-medium leading-relaxed dark:text-white"
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
          <div className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-zinc-950/60 backdrop-blur-sm" onClick={() => setIsEditUserOpen(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white mb-4 select-none">Editar Dados do Usuário</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-605 dark:text-zinc-400">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-emerald-500/40 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-605 dark:text-zinc-400">E-mail institucional</label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-emerald-500/40 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-605 dark:text-zinc-400">Cargo / Curso</label>
                <input
                  type="text"
                  value={editUserCargo}
                  onChange={(e) => setEditUserCargo(e.target.value)}
                  className="w-full h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-emerald-500/40 dark:text-white"
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
                <label htmlFor="edit_is_admin" className="text-xs font-bold text-slate-650 dark:text-zinc-350 cursor-pointer">
                  Conceder privilégios de Administrador
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="px-4.5 h-10 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-4.5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 dark:disabled:bg-zinc-850 dark:disabled:text-zinc-650"
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
          <div className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-zinc-950/60 backdrop-blur-sm" onClick={() => setIsStatusDialogOpen(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white mb-4 select-none">Definir Prazo e Status (Chamado #{statusDialogTicket.id})</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1 select-none">
                <label className="text-xs font-bold text-slate-605 dark:text-zinc-400">Status do Atendimento</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value as any)}
                  className="w-full h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 text-xs bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-emerald-500/40 font-semibold cursor-pointer dark:text-white"
                >
                  <option value="pendente">Aberto / Pendente</option>
                  <option value="em_andamento">Em Atendimento</option>
                  <option value="finalizado">Finalizado / Resolvido</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-605 dark:text-zinc-400">Definir Prazo de SLA Limite</label>
                <input
                  type="datetime-local"
                  value={ticketPrazo}
                  onChange={(e) => setTicketPrazo(e.target.value)}
                  className="w-full h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-emerald-500/40 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsStatusDialogOpen(false)}
                  className="px-4.5 h-10 border border-slate-200 dark:border-zinc-800 hover:bg-slate-55 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-4.5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 dark:disabled:bg-zinc-850 dark:disabled:text-zinc-650"
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
          onClick={() => { setActiveTab("relatorios"); setTicketView("list"); }}
          className={`p-2.5 rounded-xl transition-all ${
            activeTab === "relatorios" ? "text-white bg-[#1e293b] border-t-2 border-emerald-500 rounded-t-none" : "text-slate-400"
          }`}
          title="Gráficos e Métricas"
        >
          <BarChart3 className="h-5 w-5" />
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
