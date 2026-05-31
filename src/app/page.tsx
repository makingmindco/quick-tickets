"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, ShieldAlert, CheckCircle2, AlertCircle, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  
  // Box states: 'login' | 'register' | 'forgot' | 'confirm'
  const [activeBox, setActiveBox] = useState<"login" | "register" | "forgot" | "confirm">("login");
  
  // Form states
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrarEmail, setLembrarEmail] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  // Register states
  const [regNome, setRegNome] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCargo, setRegCargo] = useState("");
  const [regSenha, setRegSenha] = useState("");
  const [showRegSenha, setShowRegSenha] = useState(false);
  const [emailConfirmTarget, setEmailConfirmTarget] = useState("");

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");

  // Confirm states
  const [confirmCode, setConfirmCode] = useState("");

  // Load remembered email
  useEffect(() => {
    const emailSalvo = localStorage.getItem("lembrar_email_qt");
    if (emailSalvo) {
      setEmail(emailSalvo);
      setLembrarEmail(true);
    }
  }, []);

  // Password strength logic
  const regSenhaCriteria = {
    length: regSenha.length >= 8,
    uppercase: /[A-Z]/.test(regSenha),
    lowercase: /[a-z]/.test(regSenha),
    number: /[0-9]/.test(regSenha),
    special: /[^A-Za-z0-9]/.test(regSenha),
  };

  const score = Object.values(regSenhaCriteria).filter(Boolean).length;
  
  const getStrengthText = () => {
    if (regSenha.length === 0) return "";
    if (score <= 2) return "Senha fraca";
    if (score <= 4) return "Senha média";
    return "Senha forte";
  };

  const getStrengthColor = () => {
    if (score <= 2) return "bg-red-500 text-red-500 border-red-500";
    if (score <= 4) return "bg-amber-500 text-amber-500 border-amber-500";
    return "bg-emerald-500 text-emerald-500 border-emerald-500";
  };

  // Submit handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) return;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Bem-vindo de volta! Login realizado com sucesso.");
        
        if (lembrarEmail) {
          localStorage.setItem("lembrar_email_qt", email);
        } else {
          localStorage.removeItem("lembrar_email_qt");
        }

        localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
        localStorage.setItem("token", data.token);

        setTimeout(() => {
          if (data.usuario.trocar_senha_obrigatorio) {
            router.push("/change-password");
          } else if (data.usuario.is_admin === 1) {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        }, 800);
      } else {
        toast.error(data.erro || "E-mail ou senha incorretos.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Servidor inacessível. Tente novamente.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNome || !regEmail || !regSenha || !regCargo) {
      toast.error("Todos os campos são obrigatórios.");
      return;
    }

    if (score < 5) {
      toast.error("A senha não atende aos requisitos mínimos de segurança.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: regNome, email: regEmail, senha: regSenha, cargo: regCargo })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Conta criada! Código de confirmação enviado ao seu e-mail.");
        setEmailConfirmTarget(regEmail);
        setActiveBox("confirm");
      } else {
        toast.error(data.erro || "Falha ao registrar.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão. Tente novamente.");
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmCode || confirmCode.length !== 6) {
      toast.error("Código de 6 dígitos inválido.");
      return;
    }

    try {
      const res = await fetch("/api/auth/confirmar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailConfirmTarget || email, codigo: confirmCode })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("E-mail verificado! Agora você pode fazer login.");
        setEmail(emailConfirmTarget || email);
        setConfirmCode("");
        setActiveBox("login");
      } else {
        toast.error(data.erro || "Código de confirmação incorreto.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão. Tente novamente.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.mensagem);
        setEmail(forgotEmail);
        setActiveBox("login");
      } else {
        toast.error(data.erro || "Ocorreu um erro. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950 font-poppins">
      {/* Form Area */}
      <div className="w-full lg:w-[50%] flex items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-[400px] flex flex-col">
          {/* Logo Brand Header */}
          <div className="mb-8 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo.png"
              alt="QuickTickets Logo"
              className="h-10 w-auto object-contain block"
            />
          </div>

          {/* BOX 1: LOGIN */}
          {activeBox === "login" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Bem-vindo de volta!</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Faça login para gerenciar seus chamados.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu e-mail"
                    className="block w-full h-11 px-4 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:border-primary-corp/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Senha</label>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    className="block w-full h-11 px-4 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:border-primary-corp/50 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold select-none pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={lembrarEmail}
                      onChange={(e) => setLembrarEmail(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border transition-all ${
                      lembrarEmail ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-350 bg-white dark:bg-zinc-900"
                    }`}>
                      {lembrarEmail && <Check className="h-3 w-3 stroke-[3.5] text-white" />}
                    </div>
                    <span className="text-slate-600 dark:text-zinc-400 text-xs font-medium">Lembrar meu e-mail</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveBox("forgot")}
                    className="text-primary-corp hover:underline font-bold"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-primary-corp hover:bg-primary-corp-hover active:scale-[0.99] text-white rounded-lg text-sm font-bold shadow-md shadow-primary-corp/10 transition-all cursor-pointer mt-2"
                >
                  Entrar
                </button>
              </form>

              <div className="text-center text-xs font-semibold text-slate-500 select-none pt-2">
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => setActiveBox("register")}
                  className="text-primary-corp hover:underline font-bold cursor-pointer"
                >
                  Cadastre-se
                </button>
              </div>
            </div>
          )}

          {/* BOX 2: REGISTER */}
          {activeBox === "register" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Criar Conta</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Cadastre-se para abrir chamados de suporte</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Nome Completo</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={regNome}
                      onChange={(e) => setRegNome(e.target.value)}
                      placeholder="Seu nome completo"
                      className="block w-full h-11 pl-10 pr-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">E-mail Corporativo</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nome@corporativo.com"
                      className="block w-full h-11 pl-10 pr-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Perfil de Usuário</label>
                  <select
                    required
                    value={regCargo}
                    onChange={(e) => setRegCargo(e.target.value)}
                    className="block w-full h-11 px-3.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500/40 transition-colors select-none"
                  >
                    <option value="" disabled>Selecione seu perfil...</option>
                    <option value="Estudante">Estudante (Aluno)</option>
                    <option value="Docente">Docente (Professor)</option>
                    <option value="Equipe Administrativa">Equipe Administrativa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Crie uma Senha</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type={showRegSenha ? "text" : "password"}
                      required
                      value={regSenha}
                      onChange={(e) => setRegSenha(e.target.value)}
                      placeholder="Crie uma senha forte"
                      className="block w-full h-11 pl-10 pr-10 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegSenha(!showRegSenha)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showRegSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength checklist display panel */}
                {regSenha.length > 0 && (
                  <div className="p-3.5 bg-slate-100/50 dark:bg-zinc-900/50 rounded-xl border border-slate-200/50 dark:border-zinc-800/50 space-y-2 select-none animate-in slide-in-from-top-1 duration-250">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-zinc-300">Força da senha:</span>
                      <span className={score <= 2 ? "text-red-500" : score <= 4 ? "text-amber-500" : "text-emerald-500"}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                    <ul className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 space-y-1 pt-1.5">
                      <li className="flex items-center gap-1.5">
                        {regSenhaCriteria.length ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-current" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-400" />}
                        Mínimo de 8 caracteres
                      </li>
                      <li className="flex items-center gap-1.5">
                        {regSenhaCriteria.uppercase ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-current" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-400" />}
                        Pelo menos uma letra maiúscula (A-Z)
                      </li>
                      <li className="flex items-center gap-1.5">
                        {regSenhaCriteria.lowercase ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-current" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-400" />}
                        Pelo menos uma letra minúscula (a-z)
                      </li>
                      <li className="flex items-center gap-1.5">
                        {regSenhaCriteria.number ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-current" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-400" />}
                        Pelo menos um número (0-9)
                      </li>
                      <li className="flex items-center gap-1.5">
                        {regSenhaCriteria.special ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-current" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-400" />}
                        Um caractere especial (ex: @, $, !)
                      </li>
                    </ul>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-11 bg-primary-corp hover:bg-primary-corp-hover active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md shadow-primary-corp/10 transition-all cursor-pointer"
                >
                  Cadastrar
                </button>
              </form>

              <div className="text-center text-xs font-semibold text-slate-500 select-none">
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => setActiveBox("login")}
                  className="text-primary-corp hover:underline font-bold cursor-pointer"
                >
                  Faça Login
                </button>
              </div>
            </div>
          )}

          {/* BOX 3: FORGOT PASSWORD */}
          {activeBox === "forgot" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Recuperar Senha</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Digite seu e-mail para receber as instruções de recuperação.</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">E-mail</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Seu e-mail cadastrado"
                      className="block w-full h-11 pl-10 pr-4 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500/40 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-primary-corp hover:bg-primary-corp-hover active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md shadow-primary-corp/10 transition-all cursor-pointer"
                >
                  Enviar Link de Recuperação
                </button>
              </form>

              <div className="text-center text-xs font-semibold text-slate-500 select-none">
                Lembrou a senha?{" "}
                <button
                  type="button"
                  onClick={() => setActiveBox("login")}
                  className="text-primary-corp hover:underline font-bold cursor-pointer"
                >
                  Voltar ao Login
                </button>
              </div>
            </div>
          )}

          {/* BOX 4: EMAIL CONFIRMATION CODE */}
          {activeBox === "confirm" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Confirmar E-mail</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Digite o código de 6 dígitos enviado para seu e-mail para ativar sua conta.</p>
              </div>

              <form onSubmit={handleConfirmCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Código de Confirmação</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    placeholder="Ex: 123456"
                    className="block w-full h-12 text-center border border-slate-200 dark:border-zinc-800 rounded-xl font-bold font-mono text-xl tracking-[6px] pl-4 focus:outline-none focus:border-blue-500/40 bg-white dark:bg-zinc-900 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-primary-corp hover:bg-primary-corp-hover active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md shadow-primary-corp/10 transition-all cursor-pointer"
                >
                  Ativar Minha Conta
                </button>
              </form>

              <div className="text-center text-xs font-semibold text-slate-500 select-none">
                Problemas com o código?{" "}
                <button
                  type="button"
                  onClick={() => {
                    toast.info("Por favor, realize o cadastro novamente para reenviar o e-mail.");
                    setActiveBox("register");
                  }}
                  className="text-primary-corp hover:underline font-bold cursor-pointer"
                >
                  Voltar ao Cadastro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Brand Visual Illustration Area */}
      <div className="hidden lg:block lg:w-[50%] bg-[#0d1317] relative overflow-hidden select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/login_illustration.png"
          alt="Central de Suporte Ilustração"
          className="w-full h-full object-cover block illustration-img scale-110"
        />
      </div>
    </div>
  );
}
