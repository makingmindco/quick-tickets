"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Paperclip, Send, Mic, Trash2, Square, Loader2 } from "lucide-react";
import { CustomAudioPlayer } from "./custom-audio-player";
import { Lightbox } from "./lightbox";
import { toast } from "sonner";

import { User, Ticket, Message } from "@/types";

interface ChatModalProps {
  ticketId: number | null;
  onClose: () => void;
  currentUser: User | null;
}

export function ChatModal({ ticketId, onClose, currentUser }: ChatModalProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  
  // File attachments state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audio recording state
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioName, setRecordedAudioName] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Lightbox state
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load ticket details and fetch messages
  useEffect(() => {
    if (!ticketId) return;

    const fetchTicketDetails = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/tickets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const ticketsList: Ticket[] = await res.json();
          const found = ticketsList.find(t => t.id === ticketId);
          if (found) {
            setTicket(found);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicketDetails();
    fetchMessages();

    // Start polling every 5 seconds
    const interval = setInterval(fetchMessages, 5000);

    return () => {
      clearInterval(interval);
      cancelRecording();
      clearAttachment();
    };
  }, [ticketId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!ticketId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: Message[] = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Erro ao buscar mensagens do chat:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setRecordedAudioBlob(null);
      setSelectedFile(file);
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setRecordedAudioBlob(null);
    setRecordedAudioName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          options = { mimeType: "audio/ogg" };
          mimeType = "audio/ogg";
        } else if (MediaRecorder.isTypeSupported("audio/wav")) {
          options = { mimeType: "audio/wav" };
          mimeType = "audio/wav";
        }
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const actualMime = recorder.mimeType || mimeType;
        const blob = new Blob(chunks, { type: actualMime });

        let ext = "webm";
        if (actualMime.includes("mp4")) ext = "mp4";
        else if (actualMime.includes("ogg")) ext = "ogg";
        else if (actualMime.includes("wav")) ext = "wav";
        else if (actualMime.includes("mpeg")) ext = "mp3";

        setRecordedAudioBlob(blob);
        setRecordedAudioName(`Áudio Gravado.${ext}`);
        setSelectedFile(null);

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
      toast.error("Não foi possível acessar seu microfone. Verifique as permissões.");
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile && !recordedAudioBlob) return;

    const formData = new FormData();
    if (newMessage.trim()) {
      formData.append("mensagem", newMessage.trim());
    }

    if (selectedFile) {
      formData.append("arquivo", selectedFile);
    } else if (recordedAudioBlob) {
      formData.append("arquivo", recordedAudioBlob, recordedAudioName);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setNewMessage("");
        clearAttachment();
        fetchMessages();
      } else {
        const errData = await res.json();
        toast.error(errData.erro || "Falha ao enviar mensagem.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão com o servidor.");
    }
  };

  if (!ticketId) return null;

  const statusLabel = ticket?.status === "em_andamento" ? "EM ATENDIMENTO" : (ticket?.status?.toUpperCase() || "");

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[650px] h-[90vh] bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 p-5 bg-white shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-lg font-bold text-slate-800 truncate">
              {ticket?.titulo || ticket?.categoria || "Carregando..."}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-slate-500 font-medium truncate">
                Chamado #{ticket?.id} - {ticket?.categoria}
              </span>
              {ticket?.cliente_nome && (
                <span className="text-xs text-slate-400 font-medium">
                  | Cliente: {ticket.cliente_nome}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {ticket && (
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border tracking-wide select-none ${
                  ticket.status === "pendente"
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : ticket.status === "em_andamento"
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}
              >
                {statusLabel}
              </span>
            )}
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 shadow-inner"
          style={{
            backgroundColor: "#d1e2eb",
            backgroundImage: `linear-gradient(135deg, rgba(225, 238, 244, 0.95) 0%, rgba(200, 218, 228, 0.95) 100%),
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%230f62ac' fill-opacity='0.04'%3E%3Cpath fill-rule='evenodd' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zM11 13c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm48 25c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM30 20c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0-4c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm33 45c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0-4c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM21 48c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.105 0 2 .895 2 2s-.895 2-2 2-2-.895-2-2 .895-2 2-2zm28 24c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.105 0 2 .895 2 2s-.895 2-2 2-2-.895-2-2 .895-2 2-2zM8 64a4 4 0 1 1 8 0 4 4 0 0 1-8 0zm6 0a2 2 0 1 0-4 0 2 2 0 0 0 4 0zm41-36a4 4 0 1 1 8 0 4 4 0 0 1-8 0zm6 0a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM17 80h2v-2h-2v2zm0-4h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-4h2v-2h-2v2zm-4 4h2v-2H9v2zm0-4h2v-2H9v2zm-4 4h2v-2H5v2zm0-4h2v-2H5v2zm-4 4h2v-2H1v2zm0-4h2v-2H1v2zm76-4h2v-2h-2v2zm0-4h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-4h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-4h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-4h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-4h2v-2h-2v2zm-36 0h2v-2h-2v2zm0-4h2v-2h-2v2z'/%3E%3C/g%3E%3C/svg%3E")`
          }}
        >
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="text-sm text-slate-500 font-medium">Carregando conversa...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 bg-white/70 rounded-xl p-6 border border-slate-100 max-w-[80%] mx-auto shadow-sm backdrop-blur-sm">
              <span className="text-sm text-slate-600 font-medium">
                Nenhuma mensagem enviada. Envie uma mensagem para iniciar o atendimento!
              </span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = currentUser ? msg.usuario_id === currentUser.id : false;
              const date = new Date(msg.criado_em);
              const formattedTime = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

              const senderName = msg.usuario_nome + (msg.usuario_is_admin ? " (Atendente)" : "");
              const isSenderAdmin = !!msg.usuario_is_admin;

              return (
                <div key={msg.id} className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm relative border ${
                      isMine
                        ? "bg-[#e1f3fc] border-[#0f62ac]/10 rounded-br-sm"
                        : "bg-white border-slate-200/50 rounded-bl-sm"
                    }`}
                  >
                    {/* Received Message Sender Name Header */}
                    {!isMine && (
                      <span
                        className={`block text-[11px] font-bold mb-1 tracking-wide uppercase select-none ${
                          isSenderAdmin ? "text-purple-600" : "text-sky-600"
                        }`}
                      >
                        {senderName}
                      </span>
                    )}

                    {/* Message Content body */}
                    <div className="text-slate-800 text-sm leading-relaxed">
                      {msg.tipo === "texto" && (
                        <p className="whitespace-pre-wrap word-break">{msg.mensagem}</p>
                      )}
                      
                      {msg.tipo === "imagem" && msg.arquivo_url && (
                        <div className="flex flex-col gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.arquivo_url}
                            alt="Imagem anexada"
                            className="max-w-full max-h-[250px] object-contain rounded-lg border border-slate-100 hover:brightness-95 active:scale-99 transition-all cursor-pointer bg-slate-50/50"
                            onClick={() => setActivePhotoUrl(msg.arquivo_url)}
                          />
                          {msg.mensagem && <p className="whitespace-pre-wrap word-break">{msg.mensagem}</p>}
                        </div>
                      )}

                      {msg.tipo === "audio" && msg.arquivo_url && (
                        <div className="flex flex-col gap-2">
                          <CustomAudioPlayer msgId={msg.id} url={msg.arquivo_url} />
                          {msg.mensagem && <p className="whitespace-pre-wrap word-break">{msg.mensagem}</p>}
                        </div>
                      )}
                    </div>

                    <span className="block text-[9px] text-slate-400 font-semibold text-right mt-1.5 select-none">
                      {formattedTime}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Previews */}
        {(selectedFile || recordedAudioBlob) && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                {selectedFile ? "IMG" : "AUD"}
              </span>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[320px]">
                {selectedFile ? selectedFile.name : recordedAudioName}
              </span>
            </div>
            <button
              onClick={clearAttachment}
              className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors select-none"
            >
              Remover Anexo
            </button>
          </div>
        )}

        {/* Form Input Area */}
        <form onSubmit={handleSendMessage} className="p-5 bg-white border-t border-slate-100 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex items-center gap-3.5">
            {/* Attach File Button OR Trash Cancel Button */}
            {!isRecording ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                title="Anexar Imagem"
              >
                <Paperclip className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={cancelRecording}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0"
                title="Cancelar Gravação"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}

            {/* Input Bar OR Active Waveform Bars Container */}
            {!isRecording ? (
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 h-10 border border-slate-200 rounded-xl px-4 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0f62ac]/40 transition-colors"
                disabled={!!selectedFile || !!recordedAudioBlob}
              />
            ) : (
              <div className="flex-1 h-10 bg-red-50 border border-red-100 rounded-xl px-4 flex items-center justify-between gap-4">
                {/* Active Animated Waveform */}
                <div className="flex items-center gap-[3px]">
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                  <span className="recording-bar" />
                </div>
                <span className="text-xs font-bold text-red-500 font-mono select-none">
                  {formatTimer(recordingSeconds)}
                </span>
              </div>
            )}

            {/* Mic Button OR Send Button */}
            {!isRecording && !newMessage.trim() && !selectedFile && !recordedAudioBlob ? (
              <button
                type="button"
                onClick={startRecording}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0f62ac] text-white hover:bg-[#0d5494] transition-colors shrink-0"
                title="Gravar Áudio"
              >
                <Mic className="h-5 w-5" />
              </button>
            ) : isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                title="Parar Gravação"
              >
                <Square className="h-4.5 w-4.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0f62ac] text-white hover:bg-[#0d5494] active:scale-95 transition-all shrink-0"
                title="Enviar Mensagem"
              >
                <Send className="h-4.5 w-4.5 fill-current ml-0.5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lightbox Trigger Modal */}
      <Lightbox url={activePhotoUrl} onClose={() => setActivePhotoUrl(null)} />
    </div>
  );
}
