import React, { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  PopupEmailPassword,
  PopupPasswordMismatch,
} from "../../utils/pop_ups/error_Pops";
import {
  PopupUserCreated,
  PopupLoginSuccess,
} from "../../utils/pop_ups/confirm_Pops";
import { Enviroment } from "../../utils/env/enviroment";
import type {
  LoginRequest,
  LoginResponse,
} from "../../utils/interfaces/login.interface";
import type { User } from "../../utils/interfaces/user.interface";
import { motion } from "framer-motion";

type Data = {
  name?: string;
  last_name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Data>({
    name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showEmailPasswordPopup, setShowEmailPasswordPopup] =
    useState<boolean>(false);
  const [showPasswordMismatchPopup, setShowPasswordMismatchPopup] =
    useState<boolean>(false);

  const [showUserCreatedPopup, setShowUserCreatedPopup] =
    useState<boolean>(false);
  const [showLoginSuccessPopup, setShowLoginSuccessPopup] =
    useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((s) => ({ ...s, [name]: value }));
  };

  const resetForm = () => {
    setData({
      name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data.email || !data.password) {
      setShowEmailPasswordPopup(true);
      setTimeout(() => setShowEmailPasswordPopup(false), 3000);
      return;
    }
    if (!isLogin && data.password !== data.confirmPassword) {
      setShowPasswordMismatchPopup(true);
      setTimeout(() => setShowPasswordMismatchPopup(false), 3000);
      return;
    }
    setLoading(true);

    try {
      if (!isLogin) {
        const registerData: User = {
          name: data.name!,
          last_name: data.last_name!,
          email: data.email,
          password: data.password,
        };

        const registerRes = await fetch(`${Enviroment.API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerData),
        });

        console.log(registerRes);
        if (!registerRes.ok) throw new Error("Error en el registro");


        setShowUserCreatedPopup(true);
        setTimeout(() => setShowUserCreatedPopup(false), 3000);
        setTimeout(() => {
          setIsLogin(true);
          resetForm();
        }, 3000);
      } else {
        const loginData: LoginRequest = {
          email: data.email,
          password: data.password,
        };

        const loginRes = await fetch(`${Enviroment.API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData),
        });

        const loginResult: LoginResponse = await loginRes.json();
        if (!loginRes.ok) throw new Error("Credenciales incorrectas");

        login(loginResult);

        setShowLoginSuccessPopup(true);
        setTimeout(() => setShowLoginSuccessPopup(false), 5000);
        setTimeout(() => navigate("/inicio"), 3000);
      }
    } catch (err) {
      setShowEmailPasswordPopup(true);
      setTimeout(() => setShowEmailPasswordPopup(false), 3000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-white to-violet-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="flex bg-violet-100 rounded-xl p-1 mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsLogin(true);
            }}
            className={
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all " +
              (isLogin
                ? "bg-white text-violet-700 shadow-sm"
                : "text-violet-600 hover:text-violet-700")
            }
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsLogin(false);
            }}
            className={
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all " +
              (!isLogin
                ? "bg-white text-violet-700 shadow-sm"
                : "text-violet-600 hover:text-violet-700")
            }
          >
            Registrarse
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white/80 backdrop-blur border border-violet-200 shadow-xl rounded-2xl"
        >
          <div className="p-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              {isLogin
                ? "Accede con tus credenciales"
                : "Completa los datos para registrarte"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Inputs dinámicos */}
              {!isLogin && (
                <>
                  <InputField
                    label="Nombre completo"
                    name="name"
                    type="text"
                    value={data.name}
                    onChange={handleChange}
                  />
                  <InputField
                    label="Apellido"
                    name="last_name"
                    type="text"
                    value={data.last_name}
                    onChange={handleChange}
                  />
                </>
              )}
              <InputField
                label="Correo electrónico"
                name="email"
                type="email"
                value={data.email}
                onChange={handleChange}
              />
              <InputField
                label="Contraseña"
                name="password"
                type="password"
                value={data.password}
                onChange={handleChange}
              />
              {!isLogin && (
                <InputField
                  label="Confirmar contraseña"
                  name="confirmPassword"
                  type="password"
                  value={data.confirmPassword}
                  onChange={handleChange}
                />
              )}

              {/* POPUPS */}
              {showEmailPasswordPopup && (
                <PopupEmailPassword
                  onClose={() => setShowEmailPasswordPopup(false)}
                />
              )}
              {showPasswordMismatchPopup && (
                <PopupPasswordMismatch
                  onClose={() => setShowPasswordMismatchPopup(false)}
                />
              )}
              {showUserCreatedPopup && (
                <PopupUserCreated
                  onClose={() => setShowUserCreatedPopup(false)}
                />
              )}
              {showLoginSuccessPopup && (
                <PopupLoginSuccess
                  onClose={() => setShowLoginSuccessPopup(false)}
                />
              )}

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className="w-full bg-violet-700 hover:bg-violet-800 text-white font-medium py-2.5 px-4 mt-5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:opacity-60"
              >
                {loading
                  ? "Procesando..."
                  : isLogin
                  ? "Iniciar Sesión"
                  : "Crear Cuenta"}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* 🔹 Componente de Input reutilizable con animación */
function InputField({
  label,
  name,
  type,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type: string;
  value: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-2"
    >
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={label}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-violet-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
      />
    </motion.div>
  );
}
