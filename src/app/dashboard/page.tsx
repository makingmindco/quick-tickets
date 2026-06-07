"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Plus,
  FolderClosed,
  Loader2,
  Wrench,
  ChevronRight,
  ArrowLeft,
  Paperclip,
  Send,
  Mic,
  Square,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Calendar,
  FileText,
  Lock,
  GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import { User, Ticket, Aviso, Message } from "@/types";
import { CustomAudioPlayer } from "@/components/custom-audio-player";

let dbClockOffset = 0;

export default function StudentDashboard() {
  const router = useRouter();

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Tab state: 'inicio' | 'tickets' | 'settings'
  const [activeTab, setActiveTab] = useState<"inicio" | "tickets" | "settings">("inicio");

  // Ticket sub-view: 'list' | 'create' | 'chat'
  const [ticketView, setTicketView] = useState<"list" | "create" | "chat">("list");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Data states
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Chat message states
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [selectedChatFile, setSelectedChatFile] = useState<File | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Audio recording state
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioName, setRecordedAudioName] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Wizard Form states (Steps 1 to 4)
  const [wizardStep, setWizardStep] = useState(1);
  const [ticketTitulo, setTicketTitulo] = useState("");
  const [ticketCategoria, setTicketCategoria] = useState(""); // "1" for Academic, "2" for Infra, "3" for others
  const [ticketDescricao, setTicketDescricao] = useState("");
  const [ticketUrgency, setTicketUrgency] = useState("media");
  const [wizardFiles, setWizardFiles] = useState<File[]>([]);
  const wizardFileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Settings states
  const [profileNome, setProfileNome] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefIdioma, setPrefIdioma] = useState("Português (BR)");
  const [prefTemaEscuro, setPrefTemaEscuro] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // SLA/Elapsed Timer states
  const [elapsedTimeText, setElapsedTimeText] = useState("00:00:00");
  const [elapsedPercent, setElapsedPercent] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

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
    setProfileNome(user.nome);
    setProfileEmail(user.email);
    setPrefTemaEscuro(user.tema_escuro === 1 || user.tema_escuro === true);

    // Apply dark theme dynamically based on database value
    if (user.tema_escuro === 1 || user.tema_escuro === true) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setIsLoadingAuth(false);
  }, [router]);

  // Load dashboard data and notifications once authenticated
  useEffect(() => {
    if (isLoadingAuth) return;
    loadDashboardData();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
      if (ticketView === "chat" && selectedTicketId) {
        fetchChatMessages(selectedTicketId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoadingAuth, activeTab, ticketView, selectedTicketId]);

  // Update SLA/Elapsed countdown
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
    if (activeTab === "inicio") {
      document.title = "QuickTickets - Início";
    } else if (activeTab === "tickets") {
      if (ticketView === "list") {
        document.title = "QuickTickets - Meus Chamados";
      } else if (ticketView === "create") {
        document.title = "QuickTickets - Novo Chamado";
      } else if (ticketView === "chat" && selectedTicket) {
        document.title = `QuickTickets - Chamado QT-${selectedTicket.id}`;
      } else {
        document.title = "QuickTickets - Chamados";
      }
    } else if (activeTab === "settings") {
      document.title = "QuickTickets - Ajustes da Conta";
    } else {
      document.title = "QuickTickets - Painel";
    }
  }, [activeTab, ticketView, selectedTicket]);

  // Auto-open ticket from notification query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ticketIdParam = params.get("ticketId");
      if (ticketIdParam) {
        const ticketId = parseInt(ticketIdParam);
        if (myTickets.length > 0) {
          const ticket = myTickets.find(t => t.id === ticketId);
          if (ticket) {
            setSelectedTicketId(ticketId);
            setSelectedTicket(ticket);
            setChatMessages([]);
            fetchChatMessages(ticketId);
            setActiveTab("tickets");
            setTicketView("chat");
            setShowDetails(false);
            
            // Clean up query param from URL without page reload
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        }
      }
    }
  }, [myTickets, ticketView]);

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

  const loadDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await syncClockOffset();

      // Load my tickets
      const ticketsRes = await fetch("/api/tickets", { headers });
      if (ticketsRes.ok) {
        const ticketsData: Ticket[] = await ticketsRes.json();
        setMyTickets(ticketsData);

        // If currently viewing a ticket, sync its state
        if (selectedTicketId) {
          const found = ticketsData.find(t => t.id === selectedTicketId);
          if (found) setSelectedTicket(found);
        }
      }

      // Load announcements
      const avisosRes = await fetch("/api/avisos", { headers });
      if (avisosRes.ok) {
        const avisosData: Aviso[] = await avisosRes.json();
        setAvisos(avisosData);
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
        const res = await fetch("/api/tickets", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const ticketsData: Ticket[] = await res.json();
          setMyTickets(ticketsData);
          const ticket = ticketsData.find(t => t.id === ticketId);
          if (ticket) {
            setSelectedTicketId(ticketId);
            setSelectedTicket(ticket);
            setChatMessages([]);
            fetchChatMessages(ticketId);
            setActiveTab("tickets");
            setTicketView("chat");
            setShowDetails(false);
            return;
          }
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

  const handleCloseTicket = async (ticketId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
        if (ticketView === "chat" && selectedTicketId === ticketId) {
          const updated = { ...selectedTicket!, status: "finalizado" as const, finalizado_em: new Date(new Date().getTime() + dbClockOffset).toISOString() };
          setSelectedTicket(updated);
        }
      } else {
        const data = await res.json();
        toast.error(data.erro || "Erro ao encerrar chamado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    }
  };

  // Request urgency handler (mock action for students)
  // Request urgency handler
  const handleRequestUrgency = async () => {
    if (!selectedTicket) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tickets/${selectedTicket.id}/urgente`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Solicitação de urgência registrada! A equipe de coordenação foi informada.");
        const updated = { ...selectedTicket, urgencia_solicitada: 1 };
        setSelectedTicket(updated);
        setMyTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, urgencia_solicitada: 1 } : t));
      } else {
        toast.error(data.erro || "Erro ao solicitar urgência.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão.");
    }
  };

  // Wizard Ticket Submission
  const handleWizardSubmit = async () => {
    if (!ticketTitulo || !ticketCategoria || !ticketDescricao) {
      toast.error("Preencha todos os campos obrigatórios na etapa 1.");
      setWizardStep(1);
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const token = localStorage.getItem("token");
      // Step 1: Create Ticket
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
        const data = await res.json();
        const newId = data.ticketId;

        // Step 2: Upload files if any exist
        if (wizardFiles.length > 0 && newId) {
          for (const file of wizardFiles) {
            const formData = new FormData();
            formData.append("arquivo", file);
            formData.append("mensagem", `Anexou arquivo: ${file.name}`);
            
            await fetch(`/api/tickets/${newId}/messages`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData
            });
          }
        }

        toast.success("Chamado aberto com sucesso! Nossa equipe foi notificada.");
        
        // Reset wizard state
        setTicketTitulo("");
        setTicketCategoria("");
        setTicketDescricao("");
        setTicketUrgency("media");
        setWizardFiles([]);
        setWizardStep(1);
        
        // Back to list
        setTicketView("list");
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

  // Chat message sending
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() && !selectedChatFile && !recordedAudioBlob) return;
    if (!selectedTicketId) return;

    const formData = new FormData();
    if (newChatMessage.trim()) {
      formData.append("mensagem", newChatMessage.trim());
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

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("token");
    toast.success("Sessão encerrada com sucesso!");
    router.push("/");
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
    toast.info("Alterações descartadas.");
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
  const unreadNotificationsCount = notifications.filter(n => !n.lida).length;

  const hasSettingsChanges = currentUser && (
    profileNome.trim() !== currentUser.nome ||
    prefTemaEscuro !== (currentUser.tema_escuro === 1 || currentUser.tema_escuro === true)
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row bg-slate-50 dark:bg-zinc-950 font-sans relative">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-[#001530] text-slate-100 flex-col justify-between shrink-0 select-none h-full shadow-lg">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-white/5 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="QuickTickets Logo" className="h-[38px] w-auto object-contain block" />
              <span className="text-[10px] font-extrabold text-white/40 tracking-wider uppercase">PORTAL - ESTUDANTE</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveTab("inicio"); setTicketView("list"); }}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                activeTab === "inicio" ? "bg-[#0f62ac] text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
              Início
            </button>
            <button
              onClick={() => { setActiveTab("tickets"); setTicketView("list"); }}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                activeTab === "tickets" ? "bg-[#0f62ac] text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              }`}
            >
              <Inbox className="h-4.5 w-4.5 shrink-0" />
              Chamados
            </button>
            <button
              onClick={() => { setActiveTab("settings"); setTicketView("list"); }}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                activeTab === "settings" ? "bg-[#0f62ac] text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              }`}
            >
              <Settings className="h-4.5 w-4.5 shrink-0" />
              Ajustes
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-1">
          <button
            onClick={() => toast.info("Central de Ajuda estará disponível em breve.")}
            className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-colors"
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
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden pb-16 md:pb-0">
        
        {/* Top Header Bar */}
        <header className="h-20 bg-white dark:bg-zinc-900 border-b border-slate-150 dark:border-zinc-800 flex items-center justify-between px-6 md:px-8 shrink-0 relative z-30">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.png" alt="QuickTickets Logo" className="md:hidden h-8 w-auto object-contain" />
            <h1 className="text-xl md:text-2xl font-black text-slate-850 dark:text-white tracking-tight select-none">
              {activeTab === "inicio" && "Painel Inicial"}
              {activeTab === "tickets" && (ticketView === "create" ? "Criar Novo Ticket" : ticketView === "chat" ? "Conversa com Suporte" : "Meus Tickets")}
              {activeTab === "settings" && "Configurações da Conta"}
            </h1>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification bell button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center relative cursor-pointer"
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
                    <div className="px-4.5 py-3.5 border-b border-slate-150 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 select-none">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-250 uppercase tracking-wide">Notificações</span>
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
                              !notif.lida ? "bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30" : "hover:bg-slate-55 dark:hover:bg-zinc-800/50"
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {notif.tipo === "system" || notif.tipo === "patch" ? (
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-500 dark:bg-indigo-950/20 dark:border-indigo-900 flex items-center justify-center">
                                  <Wrench className="h-4 w-4" />
                                </div>
                              ) : notif.tipo === "mensagem" ? (
                                <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-500 dark:bg-blue-950/20 dark:border-blue-900 flex items-center justify-center">
                                  <Inbox className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-500 dark:bg-amber-950/20 dark:border-amber-900 flex items-center justify-center">
                                  <Bell className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <h5 className={`text-xs font-extrabold truncate ${!notif.lida ? "text-[#0f62ac] dark:text-[#00afef]" : "text-slate-700 dark:text-slate-350"}`}>
                                  {notif.titulo}
                                </h5>
                                {!notif.lida && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed font-medium">
                                {notif.mensagem}
                              </p>
                              <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold block mt-1.5">
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
                  className="h-10 w-10 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-zinc-800"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-[#0f62ac] text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {avatarInitials}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[135px]">{currentUser?.nome}</span>
                <span className="text-xs text-slate-400 font-bold">{currentUser?.cargo || "Estudante"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel View Wrapper */}
        <div className={`flex-1 flex flex-col ${
          activeTab === "tickets" && ticketView === "chat"
            ? "overflow-hidden p-0 md:p-6"
            : "overflow-y-auto p-6 md:p-8"
        }`}>
          
          {/* TAB 1: INÍCIO (DASHBOARD) */}
          {activeTab === "inicio" && (
            <div className="space-y-8 select-none">
              {/* Hero Banner Welcome Card */}
              <div className="bg-gradient-to-r from-[#001530] via-[#052c56] to-[#0d599c] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10 max-w-lg">
                  <h2 className="text-3xl font-black text-white">Olá, {currentUser?.nome}! 👋</h2>
                  <p className="text-sm text-blue-100/90 mt-2 font-medium leading-relaxed">
                    {isLoadingData
                      ? "Buscando o status de seus chamados..."
                      : activeTickets.length === 0
                      ? "Você está em dia! Não possui chamados ativos ou pendentes no momento."
                      : activeTickets.length === 1
                      ? "Você tem 1 chamado ativo no sistema sob monitoramento."
                      : `Você tem ${activeTickets.length} chamados ativos sob monitoramento.`}
                  </p>
                  <button
                    onClick={() => { setActiveTab("tickets"); setTicketView("create"); setWizardStep(1); }}
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
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider">Meus Chamados Ativos</h3>
                    <button
                      onClick={() => setActiveTab("tickets")}
                      className="text-xs font-bold text-[#00afef] hover:underline"
                    >
                      Ver todos os chamados
                    </button>
                  </div>

                  {isLoadingData ? (
                    <div className="flex items-center justify-center p-12 bg-white border border-slate-150 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl">
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    </div>
                  ) : activeTickets.length === 0 ? (
                    <div className="p-10 border border-dashed border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl text-center select-none">
                      <FolderClosed className="h-9 w-9 text-slate-350 mx-auto mb-3" />
                      <p className="text-xs font-semibold text-slate-500">Nenhum chamado ativo no momento.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeTickets.map(ticket => (
                        <div
                          key={ticket.id}
                          onClick={() => {
                            setSelectedTicketId(ticket.id);
                            setSelectedTicket(ticket);
                            setChatMessages([]);
                            fetchChatMessages(ticket.id);
                            setActiveTab("tickets");
                            setTicketView("chat");
                            setShowDetails(false);
                          }}
                          className={`bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 hover:border-[#0f62ac]/20 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between ${
                            ticket.status === "pendente"
                              ? "border-t-4 border-t-amber-500"
                              : "border-t-4 border-t-[#0f62ac]"
                          }`}
                        >
                          <div className="flex gap-4 items-start">
                            {/* Red Folder Icon Block */}
                            <div className="h-11 w-11 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                              <FolderClosed className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white line-clamp-1">
                                  {ticket.titulo || ticket.categoria}
                                </h4>
                                <span className={`text-[10px] font-bold shrink-0 uppercase tracking-wide ${
                                  ticket.status === "pendente"
                                    ? "text-amber-500"
                                    : "text-[#0f62ac] dark:text-[#00afef]"
                                }`}>
                                  {ticket.status === "pendente" ? "ABERTO" : "ATENDIMENTO"}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                {ticket.categoria} - Chamado #{ticket.id}
                              </p>
                              <p className="text-xs text-slate-550 dark:text-slate-350 mt-2 line-clamp-2 leading-relaxed font-medium">
                                {ticket.descricao}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 mt-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {currentUser?.foto_url ? (
                                <img src={currentUser.foto_url} alt="Avatar" className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-[#0f62ac] text-white flex items-center justify-center font-bold text-[10px]">
                                  {avatarInitials}
                                </div>
                              )}
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Criado em {new Date(ticket.criado_em).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            
                            <button
                              onClick={(e) => handleCloseTicket(ticket.id, e)}
                              className="border border-red-200 text-red-500 hover:bg-rose-50 dark:hover:bg-red-950/20 rounded-lg px-3.5 py-1 text-xs font-bold transition-all cursor-pointer"
                            >
                              Encerrar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Columns: notice board */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-450 dark:text-zinc-550 uppercase tracking-wider">Avisos da Coordenação</h3>
                  </div>

                  {isLoadingData ? (
                    <div className="flex items-center justify-center p-12 bg-white border border-slate-150 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl">
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    </div>
                  ) : avisos.length === 0 ? (
                    <div className="p-10 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl text-center">
                      <p className="text-xs font-semibold text-slate-400">Nenhum aviso no momento.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {avisos.map(aviso => (
                        <div
                          key={aviso.id}
                          className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-4.5 rounded-2xl"
                        >
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{aviso.titulo}</h4>
                          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1.5 leading-relaxed">{aviso.mensagem}</p>
                          <div className="mt-3.5 text-[9px] text-slate-400 font-bold flex justify-between items-center border-t border-slate-100 dark:border-zinc-800 pt-2.5">
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

          {/* TAB 2: TICKETS (LIST/WIZARD/CHAT) */}
          {activeTab === "tickets" && (
            <div className={`w-full flex flex-col flex-1 ${
              ticketView === "chat" ? "h-full overflow-hidden" : ""
            }`}>
              
              {/* SUB-VIEW 2.1: LIST OF TICKETS */}
              {ticketView === "list" && (
                <div className="space-y-6 select-none animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-450 uppercase tracking-wide">Meus Chamados Registrados</p>
                    <button
                      onClick={() => { setTicketView("create"); setWizardStep(1); }}
                      className="flex items-center gap-2 bg-[#0f62ac] hover:bg-[#0d5494] text-white active:scale-95 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#0f62ac]/10 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      ABRIR NOVO TICKET
                    </button>
                  </div>

                  {isLoadingData ? (
                    <div className="flex items-center justify-center p-24 bg-white dark:bg-zinc-900 border border-slate-150 rounded-2xl">
                      <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
                    </div>
                  ) : myTickets.length === 0 ? (
                    <div className="p-16 border border-dashed border-slate-200 bg-white dark:bg-zinc-900 rounded-2xl text-center">
                      <FolderClosed className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-semibold text-slate-500">Você ainda não possui nenhum chamado no histórico.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myTickets.map(ticket => (
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
                          className={`bg-white dark:bg-zinc-900 border border-slate-155 dark:border-zinc-850 hover:border-[#0f62ac]/20 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between ${
                            ticket.status === "pendente"
                              ? "border-t-4 border-t-amber-500"
                              : ticket.status === "em_andamento"
                              ? "border-t-4 border-t-[#0f62ac]"
                              : "border-t-4 border-t-emerald-500"
                          }`}
                        >
                          <div className="flex gap-4 items-start">
                            <div className="h-11 w-11 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                              <FolderClosed className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white line-clamp-1">
                                  {ticket.titulo || ticket.categoria}
                                </h4>
                                <span className={`text-[10px] font-bold shrink-0 uppercase tracking-wide ${
                                  ticket.status === "pendente"
                                    ? "text-amber-500"
                                    : ticket.status === "em_andamento"
                                    ? "text-[#0f62ac]"
                                    : "text-emerald-500"
                                }`}>
                                  {ticket.status === "pendente" ? "ABERTO" : ticket.status === "em_andamento" ? "ATENDIMENTO" : "RESOLVIDO"}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                {ticket.categoria} - Chamado #{ticket.id}
                              </p>
                              <p className="text-xs text-slate-550 dark:text-slate-350 mt-2 line-clamp-2 leading-relaxed font-medium">
                                {ticket.descricao}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 mt-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {currentUser?.foto_url ? (
                                <img src={currentUser.foto_url} alt="Avatar" className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-[#0f62ac] text-white flex items-center justify-center font-bold text-[10px]">
                                  {getInitials(ticket.cliente || currentUser?.nome)}
                                </div>
                              )}
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Criado em {new Date(ticket.criado_em).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            
                            {(ticket.status === "pendente" || ticket.status === "em_andamento") && (
                              <button
                                onClick={(e) => handleCloseTicket(ticket.id, e)}
                                className="border border-red-200 text-red-500 hover:bg-rose-50 dark:hover:bg-red-950/20 rounded-lg px-3.5 py-1 text-xs font-bold transition-all cursor-pointer"
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

              {/* SUB-VIEW 2.2: WIZARD TICKET CREATION */}
              {ticketView === "create" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Stepper Wizard Form Column */}
                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 select-none">
                    
                    {/* Stepper Progress Bar */}
                    <div className="flex items-center justify-between relative px-2">
                      <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-slate-100 dark:bg-zinc-800 z-0" />
                      
                      <div className="flex flex-col items-center z-10">
                        <div className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center border-2 transition-all ${
                          wizardStep >= 1 ? "bg-[#001530] border-[#001530] text-white" : "bg-white border-slate-200 text-slate-400"
                        }`}>1</div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Assunto</span>
                      </div>

                      <div className="flex flex-col items-center z-10">
                        <div className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center border-2 transition-all ${
                          wizardStep >= 2 ? "bg-[#001530] border-[#001530] text-white" : "bg-white border-slate-200 text-slate-400"
                        }`}>2</div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Detalhes</span>
                      </div>

                      <div className="flex flex-col items-center z-10">
                        <div className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center border-2 transition-all ${
                          wizardStep >= 3 ? "bg-[#001530] border-[#001530] text-white" : "bg-white border-slate-200 text-slate-400"
                        }`}>3</div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Anexos</span>
                      </div>

                      <div className="flex flex-col items-center z-10">
                        <div className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center border-2 transition-all ${
                          wizardStep >= 4 ? "bg-[#001530] border-[#001530] text-white" : "bg-white border-slate-200 text-slate-400"
                        }`}>4</div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Revisão</span>
                      </div>
                    </div>

                    <hr className="border-slate-100 dark:border-zinc-800" />

                    {/* Step Contents */}
                    {wizardStep === 1 && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div>
                          <h3 className="text-xl font-extrabold text-[#001530] dark:text-white tracking-tight">Assunto Inicial</h3>
                          <p className="text-xs text-slate-400 font-medium">Selecione o assunto e a categoria da sua solicitação.</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-650 dark:text-zinc-400 uppercase tracking-wide">Assunto da Solicitação</label>
                          <select
                            value={ticketTitulo}
                            onChange={(e) => setTicketTitulo(e.target.value)}
                            className="w-full h-11 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 text-xs bg-slate-50 dark:bg-zinc-950 dark:text-white focus:bg-white focus:outline-none focus:border-[#0f62ac]/40 transition-all font-semibold"
                          >
                            <option value="">Selecione um assunto...</option>
                            <option value="Problema com matrícula">Problema com matrícula</option>
                            <option value="Ajuste de horário">Ajuste de horário</option>
                            <option value="Equipamento com defeito">Equipamento com defeito</option>
                            <option value="Problemas com ar condicionado">Problemas com ar condicionado</option>
                            <option value="Secretaria / Documentos">Secretaria / Documentos</option>
                            <option value="Outro...">Outro...</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase tracking-wide">Categoria</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                              onClick={() => setTicketCategoria("1")}
                              className={`border-2 rounded-2xl p-4.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-zinc-850 ${
                                ticketCategoria === "1" ? "border-[#001530] dark:border-[#00afef] bg-[#e1f3fc]/20" : "border-slate-200 dark:border-zinc-800"
                              }`}
                            >
                              <GraduationCap className={`h-6 w-6 shrink-0 mt-0.5 ${ticketCategoria === "1" ? "text-[#00afef]" : "text-slate-400"}`} />
                              <div>
                                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Acadêmico</h4>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">Matérias, avaliações, horários</p>
                              </div>
                            </div>

                            <div
                              onClick={() => setTicketCategoria("2")}
                              className={`border-2 rounded-2xl p-4.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-zinc-850 ${
                                ticketCategoria === "2" ? "border-[#001530] dark:border-[#00afef] bg-[#e1f3fc]/20" : "border-slate-200 dark:border-zinc-800"
                              }`}
                            >
                              <Wrench className={`h-6 w-6 shrink-0 mt-0.5 ${ticketCategoria === "2" ? "text-[#00afef]" : "text-slate-400"}`} />
                              <div>
                                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Infraestrutura</h4>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">Equipamentos, salas, ar condicionado</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase tracking-wide">Resumo do Ticket</label>
                          <div className="relative">
                            <textarea
                              rows={4}
                              value={ticketDescricao}
                              onChange={(e) => setTicketDescricao(e.target.value)}
                              placeholder="Descreva brevemente o motivo do seu contato..."
                              className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs bg-slate-50 dark:bg-zinc-950 dark:text-white focus:bg-white focus:outline-none focus:border-[#0f62ac]/40 transition-all font-medium leading-relaxed"
                            />
                            <span className={`text-[9px] font-bold absolute bottom-3.5 right-3.5 ${
                              ticketDescricao.length >= 20 ? "text-slate-400" : "text-amber-500 animate-pulse"
                            }`}>
                              Mínimo 20 caracteres ({ticketDescricao.length}/20)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {wizardStep === 2 && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div>
                          <h3 className="text-xl font-extrabold text-[#001530] dark:text-white tracking-tight">Detalhes Adicionais</h3>
                          <p className="text-xs text-slate-400 font-medium">Especifique a urgência e prazos esperados.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-650 dark:text-zinc-400 uppercase tracking-wide">Urgência do Atendimento</label>
                          <div className="grid grid-cols-3 gap-3">
                            {["baixa", "media", "alta"].map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setTicketUrgency(level)}
                                className={`h-11 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                                  ticketUrgency === level
                                    ? level === "alta"
                                      ? "bg-red-500 border-red-500 text-white"
                                      : level === "media"
                                      ? "bg-amber-500 border-amber-500 text-white"
                                      : "bg-[#00afef] border-[#00afef] text-white"
                                    : "border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-850"
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/30 p-4.5 rounded-2xl flex gap-3 text-xs text-blue-750 dark:text-blue-300">
                          <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
                          <div>
                            <span className="font-bold block">Aviso sobre prazos:</span>
                            <p className="mt-0.5 leading-relaxed font-semibold">Urgências elevadas são avaliadas pela coordenação e necessitam de comprovação posterior em caso de exames perdidos.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {wizardStep === 3 && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div>
                          <h3 className="text-xl font-extrabold text-[#001530] dark:text-white tracking-tight">Anexar Documentos</h3>
                          <p className="text-xs text-slate-400 font-medium">Faça upload de fotos ou documentos comprobatórios.</p>
                        </div>

                        <input
                          type="file"
                          ref={wizardFileInputRef}
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              setWizardFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                            }
                          }}
                          className="hidden"
                        />

                        <div
                          onClick={() => wizardFileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2.5"
                        >
                          <Paperclip className="h-8 w-8 text-slate-400 mx-auto" />
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                            Arraste ou clique para selecionar seus arquivos
                          </div>
                          <p className="text-[10px] text-slate-350 dark:text-slate-500 font-semibold">Tamanho máximo por arquivo: 10MB (Formatos aceitos: JPG, PNG, PDF)</p>
                        </div>

                        {wizardFiles.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <label className="text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase tracking-wide">Arquivos Selecionados</label>
                            <div className="space-y-2">
                              {wizardFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-100/60 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 p-2.5 rounded-xl text-xs">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setWizardFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                                  >
                                    Remover
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {wizardStep === 4 && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div>
                          <h3 className="text-xl font-extrabold text-[#001530] dark:text-white tracking-tight">Revisar Solicitação</h3>
                          <p className="text-xs text-slate-400 font-medium">Confirme os dados antes de submeter ao suporte.</p>
                        </div>

                        <div className="space-y-3 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 p-5 rounded-2xl text-xs">
                          <p className="text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Assunto:</span> {ticketTitulo || "Nenhum assunto selecionado"}</p>
                          <p className="text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Categoria:</span> {ticketCategoria === "1" ? "Acadêmico" : ticketCategoria === "2" ? "Infraestrutura" : "Nenhum selecionado"}</p>
                          <p className="text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Urgência:</span> <span className="font-bold uppercase">{ticketUrgency}</span></p>
                          <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-1">Descrição:</span>
                            {ticketDescricao || "Nenhuma descrição"}
                          </div>
                          {wizardFiles.length > 0 && (
                            <p className="text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-400 uppercase text-[9px] mr-1.5">Anexos:</span> {wizardFiles.length} arquivos anexados</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stepper Navigation Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          if (wizardStep === 1) {
                            setTicketView("list");
                          } else {
                            setWizardStep(prev => prev - 1);
                          }
                        }}
                        className="px-5 h-11 rounded-xl border border-slate-200 dark:border-zinc-850 text-slate-600 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-zinc-850 text-xs font-bold transition-all cursor-pointer"
                      >
                        {wizardStep === 1 ? "Cancelar" : "Voltar"}
                      </button>

                      {wizardStep < 4 ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (wizardStep === 1 && (!ticketTitulo || !ticketCategoria || ticketDescricao.length < 20)) {
                              toast.error("Assunto, categoria e descrição de pelo menos 20 caracteres são obrigatórios.");
                              return;
                            }
                            setWizardStep(prev => prev + 1);
                          }}
                          className="px-5 h-11 bg-[#001530] text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          Próximo
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleWizardSubmit}
                          disabled={isSubmittingTicket}
                          className="px-5.5 h-11 bg-[#0f62ac] hover:bg-[#0d5494] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
                        >
                          {isSubmittingTicket && <Loader2 className="h-4 w-4 animate-spin" />}
                          Confirmar e Enviar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stepper Right Sidebar Advice Columns */}
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#00afef] uppercase tracking-wider select-none">
                        <span className="text-base">💡</span> DICA DO CONCIERGE
                      </div>
                      <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                        Tickets com <span className="font-bold text-slate-750 dark:text-slate-300">assuntos claros</span> e <span className="font-bold text-slate-750 dark:text-slate-300">categorias bem definidas</span> são processados <span className="font-bold text-[#0f62ac] dark:text-[#00afef]">30% mais rápido</span> pela nossa equipe de coordenação.
                      </p>
                    </div>

                    <div className="bg-[#001530] text-white rounded-3xl p-6 shadow-md relative overflow-hidden h-44 flex flex-col justify-end select-none">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                      <div className="absolute top-4 right-4 text-3xl opacity-25">🎓</div>
                      <div className="absolute top-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/5 blur-lg" />
                      
                      <div className="relative z-20 space-y-1">
                        <span className="text-[9px] font-extrabold text-[#00afef] uppercase tracking-wider">QUICKTICKETS</span>
                        <h4 className="text-sm font-extrabold leading-snug">Agilidade no seu dia a dia acadêmico.</h4>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2.3: 3-COLUMN TICKET DETAILED CONVERSATION VIEW */}
              {ticketView === "chat" && selectedTicket && (
                <div className="h-full w-full flex flex-col xl:flex-row gap-6 overflow-hidden relative animate-in fade-in duration-200">
                  
                  {/* Column 1: Requestor Metadata Panel (Left) */}
                  <div className={`${
                    showDetails ? "absolute inset-0 z-20 flex bg-white dark:bg-zinc-900" : "hidden"
                  } xl:flex xl:relative xl:z-0 w-full xl:w-72 border border-slate-150 dark:border-zinc-800 rounded-3xl p-5.5 shadow-sm shrink-0 overflow-y-auto select-none flex-col space-y-5.5`}>
                    
                    <div className="flex items-center justify-between xl:block shrink-0">
                      <button
                        onClick={() => setTicketView("list")}
                        className="flex items-center gap-2 text-xs font-bold text-slate-455 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para Lista
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
                        {currentUser?.foto_url ? (
                          <img src={currentUser.foto_url} alt="Avatar" className="h-11 w-11 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-zinc-800" />
                        ) : (
                          <div className="h-11 w-11 rounded-xl bg-blue-50 text-[#0f62ac] border border-blue-100 flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
                            {avatarInitials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-white truncate">{selectedTicket.cliente_nome || "Aluno"}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">ID: #{selectedTicket.usuario_id}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl">
                        <p><span className="font-bold text-slate-455 dark:text-zinc-400 uppercase text-[9px] mr-1.5">Cargo:</span> {selectedTicket.cliente || "Estudante"}</p>
                        <p className="truncate" title={selectedTicket.cliente_email || ""}><span className="font-bold text-slate-455 dark:text-zinc-400 uppercase text-[9px] mr-1.5">E-mail:</span> {selectedTicket.cliente_email || "N/D"}</p>
                      </div>
                    </div>

                    <hr className="border-slate-100 dark:border-zinc-800" />

                    <div className="space-y-3">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">PRIORIDADE & STATUS</span>
                      
                      <div className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        selectedTicket.status === "finalizado"
                          ? "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400"
                          : selectedTicket.id % 3 === 0
                          ? "bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                          : selectedTicket.id % 3 === 1
                          ? "bg-amber-50 dark:bg-amber-950/20 text-amber-650 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                          : "bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30"
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
                          ? "bg-amber-50/50 text-amber-600 border-amber-200 dark:border-amber-800/40"
                          : selectedTicket.status === "em_andamento"
                          ? "bg-blue-50/50 text-blue-600 border-blue-200 dark:border-blue-800/40"
                          : "bg-emerald-50/50 text-emerald-600 border-emerald-200 dark:border-emerald-800/40"
                      }`}>
                        <span>Status:</span>
                        <span className="font-extrabold uppercase">{selectedTicket.status === "em_andamento" ? "Em Andamento" : selectedTicket.status === "pendente" ? "Aberto" : "Finalizado"}</span>
                      </div>
                    </div>

                    <hr className="border-slate-100 dark:border-zinc-800" />

                    <div className="space-y-2.5">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">CONTEÚDO DO TICKET</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-bold">{selectedTicket.categoria}</span>
                        <span className="bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-bold">Chamado #{selectedTicket.id}</span>
                      </div>
                    </div>

                    <hr className="border-slate-100 dark:border-zinc-800" />

                    <div className="space-y-2.5">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">ARQUIVOS ANEXADOS</span>
                      
                      {chatMessages.filter(m => m.arquivo_url).length === 0 ? (
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold italic">Nenhum anexo neste chamado.</p>
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
                                className="flex items-center gap-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 p-2 rounded-xl transition-all cursor-pointer"
                              >
                                <FileText className="h-4.5 w-4.5 text-[#0f62ac] dark:text-[#00afef]" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{fileName}</p>
                                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">Anexado em {formattedTime}</p>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Mobile-only sections from Column 3 */}
                    <div className="xl:hidden space-y-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
                      {/* circular SLA counter */}
                      <div className="bg-[#001530] text-white rounded-2xl p-5 text-center shadow-md relative overflow-hidden select-none space-y-3 flex flex-col items-center">
                        <span className="text-[9px] font-extrabold text-slate-355 tracking-wider uppercase">TEMPO EM ABERTO</span>
                        
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
                            <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wide">decorrido</span>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-[#00afef] tracking-wide w-full uppercase">
                          SLA ATIVO
                        </div>
                      </div>

                      {/* STATUS CONTROL Actions */}
                      <div className="space-y-2 select-none">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">AÇÕES DO ESTUDANTE</span>
                        
                        {selectedTicket.status !== "finalizado" ? (
                          <>
                            {selectedTicket.urgencia_solicitada === 1 ? (
                              <div
                                className="w-full h-11 bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800/80 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold flex items-center justify-between px-4 select-none"
                                title="Urgência já solicitada"
                              >
                                <span>Urgência Solicitada</span>
                                <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                              </div>
                            ) : (
                              <button
                                onClick={handleRequestUrgency}
                                className="w-full h-11 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-slate-350 dark:hover:border-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-between px-4 cursor-pointer"
                              >
                                <span>Solicitar Urgência</span>
                                <AlertCircle className="h-4.5 w-4.5 text-[#00afef]" />
                              </button>
                            )}

                            <button
                              onClick={() => handleCloseTicket(selectedTicket.id)}
                              className="w-full h-11 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 dark:text-red-400 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-between px-4 cursor-pointer"
                            >
                              <span>Cancelar Chamado</span>
                              <X className="h-4.5 w-4.5" />
                            </button>
                          </>
                        ) : (
                          <div className="p-3 border border-emerald-250 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-705 dark:text-emerald-300 rounded-xl text-center text-xs font-bold">
                            ✓ Chamado Encerrado
                          </div>
                        )}
                      </div>

                      {/* ACTIVITY LOG timeline */}
                      <div className="space-y-3.5 select-none">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">LOG DE ATIVIDADES</span>
                        <div className="space-y-4 border-l border-slate-200 dark:border-zinc-800 pl-3.5 relative">
                          <div className="relative text-xs space-y-0.5">
                            <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 border border-white dark:border-zinc-900" />
                            <p className="font-bold text-slate-700 dark:text-slate-300">Chamado Aberto</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{new Date(selectedTicket.criado_em).toLocaleDateString("pt-BR")}</p>
                          </div>

                          {selectedTicket.admin_id && (
                            <div className="relative text-xs space-y-0.5">
                              <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 border border-white dark:border-zinc-900" />
                              <p className="font-bold text-slate-700 dark:text-slate-300">Suporte Atribuído</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Atendimento iniciado</p>
                            </div>
                          )}

                          {selectedTicket.status === "finalizado" && (
                            <div className="relative text-xs space-y-0.5">
                              <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white dark:border-zinc-900" />
                              <p className="font-bold text-slate-700 dark:text-slate-300">Ticket Resolvido</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Encerrado no portal</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Chat Conversation Panel (Center) */}
                  <div className="flex-1 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-5.5 py-4 border-b border-slate-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/20 flex items-center justify-between shrink-0">
                      <div className="min-w-0 pr-4 flex items-center gap-2">
                        <button
                          onClick={() => setTicketView("list")}
                          className="xl:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">CHAMADO ID: QT-{selectedTicket.id}</span>
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
                          <div className="h-7 w-7 rounded-full bg-[#0f62ac] text-white border-2 border-white dark:border-zinc-900 flex items-center justify-center font-bold text-[9px]">
                            {avatarInitials}
                          </div>
                          {selectedTicket.admin_id && (
                            <div className="h-7 w-7 rounded-full bg-emerald-600 text-white border-2 border-white dark:border-zinc-900 flex items-center justify-center font-bold text-[9px]" title="Responsável do Suporte">
                              SUP
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chat Area with custom styled wallpaper */}
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
                      {/* Ticket Description as the first block */}
                      <div className="flex w-full justify-start select-none">
                        <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-[#001530] text-slate-100 shadow-sm border border-[#001530]/10 rounded-bl-sm">
                          <span className="block text-[10px] font-extrabold text-[#00afef] uppercase tracking-wider mb-1">DESCRIÇÃO ORIGINAL</span>
                          <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{selectedTicket.descricao}</p>
                          <span className="block text-[9px] text-slate-400 font-semibold text-right mt-1.5">
                            {new Date(selectedTicket.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      {/* Timeline Events */}
                      <div className="flex items-center justify-center py-2">
                        <span className="bg-slate-200/70 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest select-none">
                          Início do Atendimento
                        </span>
                      </div>

                      {/* Chat Messages */}
                      {isChatLoading && chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2">
                          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                          <span className="text-xs font-bold text-slate-400">Carregando histórico...</span>
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
                                    ? "bg-[#e1f3fc] dark:bg-blue-950/30 border-[#0f62ac]/10 dark:border-blue-900/30 text-slate-800 dark:text-white rounded-br-sm"
                                    : "bg-white dark:bg-zinc-850 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white rounded-bl-sm"
                                }`}
                              >
                                {!isMine && (
                                  <span className="block text-[10px] font-extrabold text-[#0f62ac] dark:text-[#00afef] uppercase tracking-wider mb-1 select-none">
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
                                <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-bold text-right mt-1.5 select-none">
                                  {formattedTime}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Attachments Preview Bar */}
                    {(selectedChatFile || recordedAudioBlob) && (
                      <div className="px-5 py-2.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between shrink-0 select-none">
                        <div className="flex items-center gap-2">
                          <span className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                            {selectedChatFile ? "IMG" : "AUD"}
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
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

                    {/* Chat Form Input */}
                    <form onSubmit={handleSendChatMessage} className="p-4.5 bg-white dark:bg-zinc-900 border-t border-slate-150 dark:border-zinc-800 shrink-0">
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

                      <div className="flex items-center gap-3">
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={() => chatFileInputRef.current?.click()}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
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
                            placeholder={`Escreva uma resposta para o suporte...`}
                            disabled={selectedTicket.status === "finalizado"}
                            className="flex-1 h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 text-xs font-medium bg-slate-50 dark:bg-zinc-955 dark:text-white focus:bg-white focus:outline-none focus:border-[#0f62ac]/40 transition-colors disabled:opacity-50"
                          />
                        ) : (
                          <div className="flex-1 h-10 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 flex items-center justify-between gap-4">
                            <span className="text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-wider">Microfone Ativo • Gravando Áudio</span>
                            <span className="text-xs font-bold text-red-500 font-mono">
                              {formatTimer(recordingSeconds)}
                            </span>
                          </div>
                        )}

                        {selectedTicket.status !== "finalizado" && (
                          <>
                            {!isRecording && !newChatMessage.trim() && !selectedChatFile && !recordedAudioBlob ? (
                              <button
                                type="button"
                                onClick={startRecording}
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0f62ac] text-white hover:bg-[#0d5494] transition-colors shrink-0 cursor-pointer"
                                title="Gravar Áudio"
                              >
                                <Mic className="h-4.5 w-4.5" />
                              </button>
                            ) : isRecording ? (
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0 cursor-pointer"
                                title="Parar e Usar"
                              >
                                <Square className="h-4 w-4 fill-current" />
                              </button>
                            ) : (
                              <button
                                type="submit"
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0f62ac] text-white hover:bg-[#0d5494] active:scale-95 transition-all shrink-0 cursor-pointer"
                                title="Enviar"
                              >
                                <Send className="h-4 w-4 ml-0.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Column 3: SLA Countdown Ring & Actions Panel (Right) */}
                  <div className="hidden xl:flex xl:flex-col w-full xl:w-72 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl p-5.5 shadow-sm shrink-0 overflow-y-auto space-y-6">
                    
                    {/* circular SLA counter */}
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
                          <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wide">decorrido</span>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-[#00afef] tracking-wide w-full uppercase">
                        SLA ATIVO
                      </div>
                    </div>

                    {/* STATUS CONTROL Actions */}
                    <div className="space-y-2 select-none">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">AÇÕES DO ESTUDANTE</span>
                      
                      {selectedTicket.status !== "finalizado" ? (
                        <>
                          {selectedTicket.urgencia_solicitada === 1 ? (
                            <div
                              className="w-full h-11 bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800/80 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold flex items-center justify-between px-4 select-none"
                              title="Urgência já solicitada"
                            >
                              <span>Urgência Solicitada</span>
                              <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                            </div>
                          ) : (
                            <button
                              onClick={handleRequestUrgency}
                              className="w-full h-11 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-slate-350 dark:hover:border-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-between px-4 cursor-pointer"
                            >
                              <span>Solicitar Urgência</span>
                              <AlertCircle className="h-4.5 w-4.5 text-[#00afef]" />
                            </button>
                          )}

                          <button
                            onClick={() => handleCloseTicket(selectedTicket.id)}
                            className="w-full h-11 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 dark:text-red-400 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-between px-4 cursor-pointer"
                          >
                            <span>Cancelar Chamado</span>
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </>
                      ) : (
                        <div className="p-3 border border-emerald-250 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-705 dark:text-emerald-300 rounded-xl text-center text-xs font-bold">
                          ✓ Chamado Encerrado
                        </div>
                      )}
                    </div>

                    {/* ACTIVITY LOG timeline */}
                    <div className="space-y-3.5 select-none">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">LOG DE ATIVIDADES</span>
                      <div className="space-y-4 border-l border-slate-200 dark:border-zinc-800 pl-3.5 relative">
                        <div className="relative text-xs space-y-0.5">
                          <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 border border-white dark:border-zinc-900" />
                          <p className="font-bold text-slate-700 dark:text-slate-300">Chamado Aberto</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{new Date(selectedTicket.criado_em).toLocaleDateString("pt-BR")}</p>
                        </div>

                        {selectedTicket.admin_id && (
                          <div className="relative text-xs space-y-0.5">
                            <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 border border-white dark:border-zinc-900" />
                            <p className="font-bold text-slate-700 dark:text-slate-300">Suporte Atribuído</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Atendimento iniciado</p>
                          </div>
                        )}

                        {selectedTicket.status === "finalizado" && (
                          <div className="relative text-xs space-y-0.5">
                            <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white dark:border-zinc-900" />
                            <p className="font-bold text-slate-700 dark:text-slate-300">Ticket Resolvido</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Encerrado no portal</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SETTINGS / AJUSTES DA CONTA (Screenshot 3) */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card & Preferences Column */}
              <div className="lg:col-span-2 space-y-6 select-none animate-in fade-in duration-200">
                
                {/* Profile Card */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
                  
                  {/* Photo Profile block */}
                  <div className="flex items-center gap-4">
                    <div className="relative cursor-pointer group" onClick={() => avatarFileInputRef.current?.click()}>
                      {currentUser?.foto_url ? (
                        <img
                          src={currentUser.foto_url}
                          alt="Avatar"
                          className="h-16 w-16 rounded-2xl object-cover shadow-md border-2 border-[#00afef]/30 group-hover:brightness-90 transition-all"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-[#001530] text-slate-100 flex items-center justify-center font-black text-xl shadow-md border-2 border-[#00afef]/30 group-hover:brightness-90 transition-all">
                          {avatarInitials}
                        </div>
                      )}
                      <div className="absolute bottom-[-4px] right-[-4px] h-6 w-6 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-650 dark:text-slate-300 shadow-sm">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    
                    <input
                      type="file"
                      ref={avatarFileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white leading-snug">{currentUser?.nome}</h3>
                      <p className="text-xs text-slate-450 dark:text-slate-400 font-bold tracking-tight mt-0.5">{currentUser?.email}</p>
                      <span className="inline-block bg-blue-50 dark:bg-blue-950/30 text-[#0f62ac] dark:text-[#00afef] px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider mt-2.5">
                        Estudante de Graduação
                      </span>
                    </div>
                  </div>

                  <hr className="border-slate-100 dark:border-zinc-800" />

                  {/* Profile Edit Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-450 uppercase tracking-wide">Nome Completo</label>
                      <input
                        type="text"
                        value={profileNome}
                        onChange={(e) => setProfileNome(e.target.value)}
                        className="w-full h-11 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 dark:text-white focus:bg-white focus:outline-none focus:border-[#0f62ac]/40 transition-colors"
                      />
                    </div>

                    <div className="space-y-1 relative">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-450 uppercase tracking-wide">E-mail Institucional (Bloqueado)</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={profileEmail}
                          disabled
                          className="w-full h-11 border border-slate-200 dark:border-zinc-800 rounded-xl pl-4 pr-10 text-xs font-semibold bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 cursor-not-allowed select-none"
                        />
                        <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Preferences Card */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#001530] dark:text-white uppercase tracking-wider">
                    <Wrench className="h-4.5 w-4.5 text-[#00afef]" /> Preferências do Sistema
                  </div>

                  <div className="space-y-4">
                    {/* Email Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Notificações por E-mail</h4>
                        <p className="text-[10px] text-slate-405 dark:text-slate-550 mt-0.5 leading-relaxed">Receba atualizações importantes sobre seus chamados por e-mail.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrefEmail(!prefEmail)}
                        className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 cursor-pointer ${
                          prefEmail ? "bg-[#0f62ac] justify-end" : "bg-slate-200 dark:bg-zinc-800 justify-start"
                        }`}
                      >
                        <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>

                    <hr className="border-slate-100 dark:border-zinc-800" />

                    {/* Language Dropdown */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Idioma</h4>
                        <p className="text-[10px] text-slate-405 dark:text-slate-550 mt-0.5 leading-relaxed">Idioma padrão das telas da interface do portal.</p>
                      </div>
                      <select
                        value={prefIdioma}
                        onChange={(e) => setPrefIdioma(e.target.value)}
                        className="h-10 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 text-xs bg-slate-50 dark:bg-zinc-950 dark:text-white focus:bg-white focus:outline-none focus:border-[#0f62ac]/40 font-bold select-none cursor-pointer"
                      >
                        <option value="Português (BR)">Português (BR)</option>
                      </select>
                    </div>

                    <hr className="border-slate-100 dark:border-zinc-800" />

                    {/* Dark Theme Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Tema Escuro</h4>
                        <p className="text-[10px] text-slate-405 dark:text-slate-550 mt-0.5 leading-relaxed">Reduza o cansaço visual em ambientes escuros.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDarkThemeChange(!prefTemaEscuro)}
                        className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 cursor-pointer ${
                          prefTemaEscuro ? "bg-[#0f62ac] justify-end" : "bg-slate-200 dark:bg-zinc-800 justify-start"
                        }`}
                      >
                        <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security, Activity Logs & Risks Column */}
              <div className="space-y-6 select-none animate-in fade-in duration-200">
                <div className="bg-[#001530] text-slate-100 rounded-3xl p-6 shadow-md space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#00afef] uppercase tracking-wider">
                    <Lock className="h-4.5 w-4.5 stroke-[2.5]" /> Segurança
                  </div>
                  <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                    Mantenha sua conta protegida alterando sua senha regularmente ou ativando a verificação em duas etapas.
                  </p>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => toast.info("Link de alteração de senha enviado ao seu e-mail institucional.")}
                      className="w-full h-11 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold flex items-center justify-between px-4 transition-all cursor-pointer"
                    >
                      <span>Alterar Senha</span>
                      <ChevronRight className="h-4 w-4 text-white/50" />
                    </button>

                    <button
                      onClick={() => toast.info("Verificação de Duas Etapas (2FA) configurada via e-mail corporativo.")}
                      className="w-full h-11 bg-white text-[#001530] hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center justify-between px-4 transition-all cursor-pointer"
                    >
                      <span>Ativar 2FA</span>
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 fill-current" />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl p-5.5 shadow-sm space-y-4">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">ATIVIDADE RECENTE</span>
                  <div className="space-y-4 border-l border-slate-200 dark:border-zinc-800 pl-3.5 relative">
                    <div className="relative text-xs space-y-0.5">
                      <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-[#00afef] border border-white dark:border-zinc-900" />
                      <p className="font-bold text-slate-700 dark:text-slate-305">Último Login</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">Hoje às 08:42 - São Paulo, BR</p>
                    </div>
                    <div className="relative text-xs space-y-0.5">
                      <span className="absolute left-[-19.5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-350 border border-white dark:border-zinc-900" />
                      <p className="font-bold text-slate-700 dark:text-slate-305">Alteração de Perfil</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">15 de Outubro de 2023</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Floating Unsaved Changes Warning Banner */}
              {hasSettingsChanges && (
                <div className="fixed bottom-6 left-6 right-6 md:left-[300px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl px-5 py-4.5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4.5 z-40 animate-in slide-in-from-bottom-5 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center sm:text-left select-none">
                      Existem alterações não salvas no seu perfil.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 select-none">
                    <button
                      onClick={discardSettingsChanges}
                      className="flex-1 sm:flex-initial px-4.5 h-10 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold rounded-xl text-slate-500 dark:text-slate-400 cursor-pointer transition-all"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="flex-1 sm:flex-initial px-5.5 h-10 bg-[#0f62ac] hover:bg-[#0d5494] text-xs font-bold rounded-xl text-white flex items-center justify-center gap-2 cursor-pointer transition-all disabled:bg-slate-300"
                    >
                      {isSavingSettings && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#001530] border-t border-white/5 flex items-center justify-around z-30 px-2 select-none">
        <button
          onClick={() => { setActiveTab("inicio"); setTicketView("list"); }}
          className={`p-2.5 rounded-xl transition-all ${
            activeTab === "inicio" ? "text-white bg-[#0f62ac]" : "text-slate-400"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
        </button>
        <button
          onClick={() => { setActiveTab("tickets"); setTicketView("list"); }}
          className={`p-2.5 rounded-xl transition-all ${
            activeTab === "tickets" ? "text-white bg-[#0f62ac]" : "text-slate-400"
          }`}
        >
          <Inbox className="h-5 w-5" />
        </button>
        <button
          onClick={() => { setActiveTab("settings"); setTicketView("list"); }}
          className={`p-2.5 rounded-xl transition-all ${
            activeTab === "settings" ? "text-white bg-[#0f62ac]" : "text-slate-400"
          }`}
        >
          <Settings className="h-5 w-5" />
        </button>
      </nav>
    </div>
  );
}
