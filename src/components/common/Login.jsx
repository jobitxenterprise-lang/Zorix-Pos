import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBar } from "../../context/BarContext";
import { 
  Lock, 
  User, 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  Calculator, 
  Utensils, 
  ChevronRight, 
  Waves,
  ArrowLeft
} from 'lucide-react';
import logo from "../../assets/Imagenes/logo.png";

export const Login = () => {
  const { login, loginMesero } = useBar();
  const navigate = useNavigate();

  // manejo de estados para login
  const [step, setStep] = useState(1);
  const [loginType, setLoginType] = useState("mesero");
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // funcion, clic en un perfil
  const handleSelectprofile = (type) => {
    setLoginType(type);
    setErrorMsg("");
    setStep(2); // avanzamos al formulario de login
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    let res;
    if (loginType === "mesero" || loginType === "cajero") {
      if (!pin.trim()) {
        setErrorMsg("Debes ingresar tu PIN de acceso");
        return;
      }
      res = loginMesero(pin, loginType);
    } else {
      res = login(username, password);
    }

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    // Redirigir al panel correspondiente según el rol
    if (res.user.role === "admin") navigate("/admin");
    else if (res.user.role === "cajero" || res.user.role === "super_cajero") navigate("/cajero");
    else navigate("/mesero");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Elemento decorativo superior estilo ola/gradiente */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-blue-100/60 via-blue-50/30 to-transparent pointer-events-none" />

      {/* Card principal del login */}
      <div className="relative bg-white border border-slate-100 rounded-[28px] w-full max-w-md shadow-2xl shadow-blue-900/10 overflow-hidden flex flex-col justify-between my-auto">
        
        {/* Contenido principal */}
        <div className="pt-8 pb-6 px-7">
          {/* Header del login / Logo */}
          <div className="flex items-center justify-center mx-auto mb-5">
            <div className="p-3 bg-blue-50/40 rounded-2xl border border-blue-100/60 shadow-sm flex items-center justify-center max-w-[220px]">
              <img src={logo} alt="Zorix POS" className="max-h-24 w-auto object-contain" />
            </div>
          </div>

          {/* Cabecera del step */}
          <h1 className="text-center text-2xl font-bold text-slate-800 tracking-tight">
            {step === 1
              ? "Selecciona tu perfil"
              : loginType === "cajero"
              ? "Acceso Cajero / Super Cajero"
              : loginType === "mesero"
              ? "Acceso Mesero"
              : "Acceso Administrador"}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 text-center px-4 font-medium">
            {step === 1
              ? "Elige según tu rol para ingresar al sistema"
              : loginType === "admin"
              ? "Ingresa tu usuario y contraseña de administrador."
              : "Ingresa tu PIN de acceso rápido."}
          </p>

          {/* Contenido del step */}
          <div className="mt-6">
            {step === 1 ? (
              <div className="space-y-3.5">
                {/* Opción Administrador */}
                <button
                  type="button"
                  onClick={() => handleSelectprofile("admin")}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-blue-50/40 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-900 transition-colors">
                        Administrador
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Acceso total al sistema
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Opción Cajero */}
                <button
                  type="button"
                  onClick={() => handleSelectprofile("cajero")}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-emerald-50/40 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-900 transition-colors">
                        Cajero / Super Cajero
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Ventas, cobros y control de caja
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Opción Mesero */}
                <button
                  type="button"
                  onClick={() => handleSelectprofile("mesero")}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-amber-50/40 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-amber-900 transition-colors">
                        Mesero
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Registro y gestión de pedidos
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5 text-red-600 text-xs font-bold shadow-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {loginType === "mesero" || loginType === 'cajero' ? (
                  <div className="pt-1">
                    <input
                      type="password"
                      required
                      placeholder="••••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full text-center tracking-[0.5em] text-2xl py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-mono shadow-inner"
                      maxLength={32}
                      autoFocus
                    />
                    <label className="block text-[11px] mt-3 font-bold text-slate-400 uppercase tracking-wider text-center">
                      PIN de Seguridad / Contraseña
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" /> Usuario
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" /> Contraseña
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setErrorMsg(""); }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer border border-slate-200/80 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" /> Entrar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer con gráfico decorativo tipo ola y mensaje de bienvenida */}
        <div className="relative pt-4 pb-7 px-6 bg-gradient-to-b from-transparent to-blue-50/70 text-center border-t border-slate-100/60 mt-2">
          <div className="flex items-center justify-center gap-2 mb-1 text-blue-400">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-blue-200" />
            <Waves className="w-5 h-5 text-blue-400" />
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-blue-200" />
          </div>
          <h4 className="text-blue-600 font-bold text-sm tracking-wide">¡Bienvenido!</h4>
        
          
          {/* Olas decorativas SVG al pie */}
          <div className="absolute bottom-0 left-0 right-0 h-5 overflow-hidden pointer-events-none opacity-40">
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
              <path d="M0.00,49.98 C150.00,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" className="fill-blue-400" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

