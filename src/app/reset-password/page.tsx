"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "QuickTickets - Redefinir Senha";
    if (!token) {
      toast.error("Token de recuperação ausente. Redirecionando...");
      router.push("/");
    }
  }, [token, router]);

  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(criteria).filter(Boolean).length;

  const getStrengthText = () => {
    if (password.length === 0) return "";
    if (score <= 2) return "Senha fraca";
    if (score <= 4) return "Senha média";
    return "Senha forte";
  };

  const getStrengthColor = () => {
    if (score <= 2) return "bg-red-500";
    if (score <= 4) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthTextColor = () => {
    if (score <= 2) return "text-red-500";
    if (score <= 4) return "text-amber-500";
    return "text-emerald-500";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Token inválido.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (score < 5) {
      toast.error("A senha deve atender a todos os critérios de segurança.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha: password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.mensagem || "Senha alterada com sucesso!");
        router.push("/");
      } else {
        toast.error(data.erro || "Erro ao redefinir a senha.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] flex flex-col bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="mb-6 select-none text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/logo.png"
          alt="QuickTickets Logo"
          className="h-10 w-auto object-contain mx-auto mb-4"
        />
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Nova Senha</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Crie uma senha nova e segura para a sua conta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-650 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Nova Senha</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a nova senha"
              className="block w-full h-11 pl-10 pr-10 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500/40 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-650 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Confirmar Nova Senha</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              className="block w-full h-11 pl-10 pr-10 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500/40 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Strength Checker Display */}
        {password.length > 0 && (
          <div className="space-y-2 pt-1 select-none">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-650 dark:text-zinc-300">Força da senha:</span>
              <span className={getStrengthTextColor()}>
                {getStrengthText()}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                style={{ width: `${(score / 5) * 100}%` }}
              />
            </div>
            <ul className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 space-y-1 pt-1.5">
              <li className="flex items-center gap-1.5">
                {criteria.length ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-current" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-350" />}
                Mínimo de 8 caracteres
              </li>
              <li className="flex items-center gap-1.5">
                {criteria.uppercase ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-current" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-350" />}
                Pelo menos uma letra maiúscula (A-Z)
              </li>
              <li className="flex items-center gap-1.5">
                {criteria.lowercase ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-current" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-350" />}
                Pelo menos uma letra minúscula (a-z)
              </li>
              <li className="flex items-center gap-1.5">
                {criteria.number ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-current" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-350" />}
                Pelo menos um número (0-9)
              </li>
              <li className="flex items-center gap-1.5">
                {criteria.special ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-current" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-350" />}
                Um caractere especial (ex: @, $, !)
              </li>
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-primary-corp hover:bg-primary-corp-hover active:scale-[0.99] disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-corp/10 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Alterar Senha
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 font-sans">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 text-blue-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Carregando formulário...</span>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
