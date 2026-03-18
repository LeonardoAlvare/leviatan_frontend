import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Enviroment } from "../utils/env/enviroment";

interface QuickStats {
    totalSubjects: number;
    totalDocuments: number;
    totalQuizzes: number;
    averageScore: number;
}

// Componentes SVG para los iconos
const BookIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const CheckCircleIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ChartIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const FireIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
);

const LibraryIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
);

const TrendingUpIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const SparklesIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const DocumentTextIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ChatIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const ChartBarIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const LightBulbIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const HandIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>
);

export default function Inicio() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState<QuickStats>({
        totalSubjects: 0,
        totalDocuments: 0,
        totalQuizzes: 0,
        averageScore: 0,
    });
    const { token } = useAuth();
    const userString = sessionStorage.getItem("user")
    let userId: number | null = null
    if (userString) {
        try {
            const userObj = JSON.parse(userString)
            userId = userObj.user_id ?? null
        } catch (error) {
            console.error("Error parsing user from sessionStorage:", error)
        }
    }

    useEffect(() => {
        const fetchQuickStats = async () => {
            try {
                const [subjectsRes, statsRes] = await Promise.all([
                    fetch(`${Enviroment.API_URL}/subject/by-user?email=${user?.email}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${Enviroment.API_URL}/statistics/user/statistics?user=${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (subjectsRes.ok) {
                    const subjects = await subjectsRes.json();
                    setStats((prev) => ({ ...prev, totalSubjects: subjects.length }));
                }

                if (statsRes.ok) {
                    const userStats = await statsRes.json();
                    setStats((prev) => ({
                        ...prev,
                        totalQuizzes: userStats.total_quizzes || 0,
                        averageScore: userStats.average_score || 0,
                    }));
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };

        if (token) fetchQuickStats();
    }, [token]);

    const quickActions = [
        {
            icon: <LibraryIcon className="w-16 h-16 text-white" />,
            title: "Mis Materias",
            description: "Organiza tus asignaturas",
            color: "from-blue-500 to-cyan-600",
            action: () => navigate("/subject"),
        },
        {
            icon: <TrendingUpIcon className="w-16 h-16 text-white" />,
            title: "Estadísticas",
            description: "Ve tu progreso",
            color: "from-green-500 to-emerald-600",
            action: () => navigate("/statistics"),
        },
    ];

    const features = [
        {
            icon: <SparklesIcon className="w-12 h-12 text-purple-600" />,
            title: "IA Inteligente",
            description: "Resúmenes y análisis automáticos de tus documentos",
        },
        {
            icon: <DocumentTextIcon className="w-12 h-12 text-blue-600" />,
            title: "Quizzes Adaptativos",
            description: "Practica con preguntas generadas por IA",
        },
        {
            icon: <ChatIcon className="w-12 h-12 text-green-600" />,
            title: "Chat Interactivo",
            description: "Pregunta sobre cualquier documento",
        },
        {
            icon: <ChartBarIcon className="w-12 h-12 text-orange-600" />,
            title: "Seguimiento",
            description: "Monitorea tu progreso en tiempo real",
        },
    ];

    const username = user?.email?.split("@")[0] ?? "Estudiante";

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header de Bienvenida */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                            ¡Hola, {username}!
                        </h1>
                        <HandIcon className="w-12 h-12 text-yellow-500" />
                    </div>
                    <p className="text-lg text-gray-600">
                        Bienvenido a tu espacio de aprendizaje inteligente
                    </p>
                </motion.div>

                {/* Estadísticas Rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Materias</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {stats.totalSubjects}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <BookIcon className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Quizzes</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {stats.totalQuizzes}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <CheckCircleIcon className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Promedio</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {stats.averageScore.toFixed(0)}%
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <ChartIcon className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Racha</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {Math.min(stats.totalQuizzes, 7)} días
                                </p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <FireIcon className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Acciones Rápidas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-8"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                        Acciones Rápidas
                    </h2>
                    <div className="flex justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                            {quickActions.map((action, index) => (
                                <motion.div
                                    key={action.title}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    onClick={action.action}
                                    className={`bg-gradient-to-br ${action.color} rounded-xl p-6 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300`}
                                >
                                    <div className="mb-4">{action.icon}</div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {action.title}
                                    </h3>
                                    <p className="text-white/90 text-sm">{action.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Características Destacadas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-white rounded-2xl p-8 shadow-xl mb-8"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        ¿Qué puedes hacer con Teach Bot?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0 + index * 0.1 }}
                                className="text-center"
                            >
                                <div className="flex justify-center mb-4">{feature.icon}</div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Tips y Consejos */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-8 text-white shadow-xl"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <LightBulbIcon className="w-12 h-12 text-yellow-300" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Consejo del día</h3>
                            <p className="text-white/90 text-lg">
                                Sube tus apuntes de clase y deja que la IA cree resúmenes y
                                flashcards automáticamente. ¡Estudiar nunca fue tan fácil!
                            </p>
                            <button
                                onClick={() => navigate("/subject")}
                                className="mt-4 bg-white text-purple-600 font-semibold py-2 px-6 rounded-lg hover:bg-purple-50 transition-colors"
                            >
                                Comenzar ahora →
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* CTA Final */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 }}
                    className="mt-8 text-center"
                >
                    <p className="text-gray-600 mb-4">
                        ¿Necesitas ayuda para comenzar?
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => navigate("/subject")}
                            className="bg-purple-600 text-white font-semibold py-3 px-8 rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
                        >
                            Crear mi primera materia
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
