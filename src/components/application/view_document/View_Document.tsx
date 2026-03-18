import Pdf_view from "./PDF/Pdf_view"
import { pdfjs } from "react-pdf"
import { useState } from "react"
import { useEffect } from "react"
import { Enviroment } from "../../../utils/env/enviroment"
import { useAuth } from "../../../context/AuthContext"
import { motion, AnimatePresence } from "motion/react"
import type { Summary } from "../../../utils/interfaces/summary.interface"
import type { Flashcard } from "../../../utils/interfaces/flashcards.interfaces"
import { Chatbot } from "../view_document/Chat/Chat"
import { Quiz } from "../view_document/Quiz/Quiz"
import { StudyPlan } from "../view_document/StudyPlan/StudyPlan"

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

export function ViewDocument() {
    const documentId = Number(sessionStorage.getItem("documentId"))
    const [summary, setSummary] = useState<Summary>({
        content: "",
        document_id: 0,
        id: 0,
    })
    const [flashcards, setFlashcards] = useState<Flashcard[]>([])
    const [modalFlashcard, setModalFlashcard] = useState<Flashcard | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isLoadingFlashcards, setIsLoadingFlashcards] = useState<boolean>(false)
    const [summaryExists, setSummaryExists] = useState<boolean | null>(null)
    const [flashcardsExist, setFlashcardsExist] = useState<boolean | null>(null)
    const { token } = useAuth()
    const [activeTab, setActiveTab] = useState<"summary" | "flashcards" | "chat" | "quiz" | "study_plan">("summary")

    console.log("Viewing document with ID:", documentId)

    useEffect(() => {
        const checkSummaryExists = async () => {
            try {
                const response = await fetch(`${Enviroment.API_URL}/summary/find?id=${Number(sessionStorage.getItem("summaryId"))}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (response.ok) {
                    const summary = await response.json()
                    setSummary(summary)
                    sessionStorage.setItem("summaryId", String(summary.id))
                    setSummaryExists(true)
                } else if (response.status === 404) {
                    setSummaryExists(false)
                }
            } catch (error) {
                console.error("Error checking summary:", error)
                setSummaryExists(false)
            }
        }

        const checkFlashcardsExist = async () => {
            try {
                const response = await fetch(`${Enviroment.API_URL}/flashcard/find?id=${documentId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (response.ok) {
                    const flashcards = await response.json()
                    setFlashcards(flashcards)
                    setFlashcardsExist(true)
                } else if (response.status === 404) {
                    setFlashcardsExist(false)
                }
            } catch (error) {
                console.error("Error checking flashcards:", error)
                setFlashcardsExist(false)
            }
        }

        if (documentId && token) {
            checkSummaryExists()
            checkFlashcardsExist()
        }
    }, [documentId, token])

    // Limpiar summaryId cuando se cambia de documento o se sale de la ruta
    useEffect(() => {
        return () => {
            sessionStorage.removeItem("summaryId")
        }
    }, [documentId])

    const handleCreateSummary = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${Enviroment.API_URL}/summary/create?document=${documentId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                throw new Error("Error creating summary")
            }
            const newSummary = await response.json()
            console.log("New summary created:", newSummary)
            
            setSummary(newSummary)
            sessionStorage.setItem("summaryId", String(newSummary.id))
            setSummaryExists(true)
        } catch (error) {
            console.error("Error creating summary:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateFlashcards = async () => {
        setIsLoadingFlashcards(true)
        setFlashcardsExist(null) // Reset state while creating
        try {
            const response = await fetch(`${Enviroment.API_URL}/flashcard/create?document=${documentId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error("Error creating flashcards")
            }

            // Esperar un poco para que el backend procese
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Recargar las flashcards desde el servidor
            const fetchResponse = await fetch(`${Enviroment.API_URL}/flashcard/find?id=${documentId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (fetchResponse.ok) {
                const flashcardsData = await fetchResponse.json()
                console.log("Flashcards loaded after creation:", flashcardsData)

                // Asegurarse de que flashcardsData es un array
                if (Array.isArray(flashcardsData) && flashcardsData.length > 0) {
                    setFlashcards(flashcardsData)
                    setFlashcardsExist(true)
                } else {
                    // Si viene vacío, intentar extraer del objeto
                    setFlashcards([])
                    setFlashcardsExist(false)
                }
            } else {
                setFlashcardsExist(false)
            }
        } catch (error) {
            console.error("Error creating flashcards:", error)
            setFlashcardsExist(false)
        } finally {
            setIsLoadingFlashcards(false)
        }
    }

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setModalFlashcard(null)
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])

    return (
        <div className="flex h-screen bg-bg-light">
            <main className="flex-1 flex flex-col overflow-hidden">
                <Pdf_view />
            </main>

            <aside className="w-80 bg-white border-l border-lavender flex flex-col overflow-hidden">
                {/* Sidebar Header - fixed at top */}
                <div className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 border-b border-lavender flex-shrink-0">
                    <h3 className="text-lg font-medium">Herramientas de Estudio</h3>
                </div>

                <div className="flex border-b border-lavender flex-shrink-0 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("summary")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === "summary"
                            ? "border-b-2 border-primary text-primary bg-lavender/10"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                        </svg>
                        Resumen
                    </button>
                    <button
                        onClick={() => setActiveTab("flashcards")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === "flashcards"
                            ? "border-b-2 border-primary text-primary bg-lavender/10"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            ></path>
                        </svg>
                        Tarjetas
                    </button>
                    <button
                        onClick={() => setActiveTab("quiz")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === "quiz"
                            ? "border-b-2 border-primary text-primary bg-lavender/10"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                        Quiz
                    </button>
                    <button
                        onClick={() => setActiveTab("study_plan")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === "study_plan"
                            ? "border-b-2 border-primary text-primary bg-lavender/10"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                        </svg>
                        Plan de Estudio
                    </button>
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === "chat"
                            ? "border-b-2 border-primary text-primary bg-lavender/10"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            ></path>
                        </svg>
                        Chat
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === "summary" && (
                            <motion.div
                                key="summary"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="h-full overflow-y-auto"
                            >
                                <div className="p-4 space-y-4">
                                    {/* Summary Section */}
                                    <div
                                        className="bg-white rounded-lg p-4 border border-lavender"
                                        style={{ boxShadow: "0 4px 6px -1px rgba(109, 40, 217, 0.1)" }}
                                    >
                                        <h4 className="font-medium text-text-dark mb-3 flex items-center">
                                            <svg
                                                className="w-5 h-5 mr-2 text-primary-light"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                ></path>
                                            </svg>
                                            Resumen
                                        </h4>

                                        <div className="text-sm text-gray-700 space-y-2">
                                            {isLoading ? (
                                                <motion.div
                                                    className="space-y-3"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <motion.div
                                                        className="h-4 bg-gradient-to-r from-lavender via-primary-light/30 to-lavender rounded"
                                                        animate={{
                                                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Number.POSITIVE_INFINITY,
                                                            ease: "linear",
                                                        }}
                                                        style={{
                                                            backgroundSize: "200% 100%",
                                                        }}
                                                    />
                                                    <motion.div
                                                        className="h-4 bg-gradient-to-r from-lavender via-primary-light/30 to-lavender rounded w-4/5"
                                                        animate={{
                                                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Number.POSITIVE_INFINITY,
                                                            ease: "linear",
                                                            delay: 0.1,
                                                        }}
                                                        style={{
                                                            backgroundSize: "200% 100%",
                                                        }}
                                                    />
                                                    <motion.div
                                                        className="h-4 bg-gradient-to-r from-lavender via-primary-light/30 to-lavender rounded w-3/4"
                                                        animate={{
                                                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Number.POSITIVE_INFINITY,
                                                            ease: "linear",
                                                            delay: 0.2,
                                                        }}
                                                        style={{
                                                            backgroundSize: "200% 100%",
                                                        }}
                                                    />

                                                    <motion.div
                                                        className="flex items-center justify-center mt-4"
                                                        animate={{
                                                            scale: [1, 1.05, 1],
                                                            opacity: [0.7, 1, 0.7],
                                                        }}
                                                        transition={{
                                                            duration: 1.5,
                                                            repeat: Number.POSITIVE_INFINITY,
                                                        }}
                                                    >
                                                        <svg
                                                            className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            />
                                                        </svg>
                                                        <p className="text-primary text-sm font-medium">Generando resumen...</p>
                                                    </motion.div>
                                                </motion.div>
                                            ) : summaryExists === true ? (
                                                <motion.p
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.5 }}
                                                    className="leading-relaxed"
                                                >
                                                    {summary.content || "No hay resumen disponible"}
                                                </motion.p>
                                            ) : summaryExists === false ? (
                                                <motion.div
                                                    className="text-center py-6"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <button
                                                        onClick={handleCreateSummary}
                                                        className="w-full px-4 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg hover:from-primary-light hover:to-primary transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        <span>Generar Resumen</span>
                                                    </button>
                                                    <p className="text-xs text-gray-500 mt-2">Haz clic para crear un resumen del documento</p>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    className="text-center py-6"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                                                    <p className="text-xs text-gray-500 mt-2">Verificando disponibilidad del resumen...</p>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "flashcards" && (
                            <motion.div
                                key="flashcards"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="h-full overflow-y-auto"
                            >
                                <div className="p-4 space-y-4">
                                    {/* Flashcards Section */}
                                    <div
                                        className="bg-white rounded-lg p-4 border border-lavender"
                                        style={{ boxShadow: "0 4px 6px -1px rgba(109, 40, 217, 0.1)" }}
                                    >
                                        <h4 className="font-medium text-text-dark mb-3 flex items-center">
                                            <svg
                                                className="w-5 h-5 mr-2 text-primary-light"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                ></path>
                                            </svg>
                                            Flashcards
                                        </h4>

                                        <div className="space-y-3">
                                            {isLoadingFlashcards ? (
                                                <motion.div
                                                    className="space-y-3"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <motion.div
                                                        className="h-16 bg-gradient-to-r from-lavender via-primary-light/30 to-lavender rounded"
                                                        animate={{
                                                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Number.POSITIVE_INFINITY,
                                                            ease: "linear",
                                                        }}
                                                        style={{
                                                            backgroundSize: "200% 100%",
                                                        }}
                                                    />
                                                    <motion.div
                                                        className="h-16 bg-gradient-to-r from-lavender via-primary-light/30 to-lavender rounded"
                                                        animate={{
                                                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Number.POSITIVE_INFINITY,
                                                            ease: "linear",
                                                            delay: 0.1,
                                                        }}
                                                        style={{
                                                            backgroundSize: "200% 100%",
                                                        }}
                                                    />
                                                    <motion.div
                                                        className="h-16 bg-gradient-to-r from-lavender via-primary-light/30 to-lavender rounded"
                                                        animate={{
                                                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Number.POSITIVE_INFINITY,
                                                            ease: "linear",
                                                            delay: 0.2,
                                                        }}
                                                        style={{
                                                            backgroundSize: "200% 100%",
                                                        }}
                                                    />

                                                    <motion.div
                                                        className="flex items-center justify-center mt-4"
                                                        animate={{
                                                            scale: [1, 1.05, 1],
                                                            opacity: [0.7, 1, 0.7],
                                                        }}
                                                        transition={{
                                                            duration: 1.5,
                                                            repeat: Number.POSITIVE_INFINITY,
                                                        }}
                                                    >
                                                        <svg
                                                            className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            />
                                                        </svg>
                                                        <p className="text-primary text-sm font-medium">Generando flashcards...</p>
                                                    </motion.div>
                                                </motion.div>
                                            ) : flashcardsExist === true && flashcards.length > 0 ? (
                                                flashcards.map((flashcard, index) => (
                                                    <motion.div
                                                        key={index}
                                                        className="p-3 border border-lavender rounded-lg bg-gray-50 hover:bg-lavender cursor-pointer transition-colors"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                                        onClick={() => {
                                                            setModalFlashcard(flashcard)
                                                        }}
                                                    >
                                                        <p className="text-sm font-medium text-text-dark">{flashcard.question}</p>
                                                        <p className="text-xs text-gray-500 mt-1 italic">(Haz clic para ver la respuesta)</p>
                                                    </motion.div>
                                                ))
                                            ) : flashcardsExist === false ? (
                                                <motion.div
                                                    className="text-center py-6"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <button
                                                        onClick={handleCreateFlashcards}
                                                        className="w-full px-4 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg hover:from-primary-light hover:to-primary transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        <span>Generar Flashcards</span>
                                                    </button>
                                                    <p className="text-xs text-gray-500 mt-2">Haz clic para crear flashcards del documento</p>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    className="text-center py-6"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                                                    <p className="text-xs text-gray-500 mt-2">Verificando disponibilidad de flashcards...</p>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "quiz" && (
                            <motion.div
                                key="quiz"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="h-full overflow-y-auto"
                            >
                                <div className="p-4">
                                    <div
                                        className="bg-white rounded-lg p-4 border border-lavender"
                                        style={{ boxShadow: "0 4px 6px -1px rgba(109, 40, 217, 0.1)" }}
                                    >
                                        <h4 className="font-medium text-text-dark mb-3 flex items-center">
                                            <svg
                                                className="w-5 h-5 mr-2 text-primary-light"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                ></path>
                                            </svg>
                                            Quiz
                                        </h4>
                                        <Quiz />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "study_plan" && (
                            <motion.div
                                key="study_plan"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="h-full overflow-y-auto"
                            >
                                <StudyPlan documentId={documentId} />
                            </motion.div>
                        )}

                        {activeTab === "chat" && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <Chatbot />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            <AnimatePresence>
                {modalFlashcard && (
                    <motion.div
                        key="flashcard-modal"
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setModalFlashcard(null)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        <motion.div
                            className="relative bg-white rounded-xl shadow-2xl w-[90%] max-w-lg p-6 z-10"
                            initial={{ y: 20, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 10, opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                        >
                            <button
                                onClick={() => setModalFlashcard(null)}
                                className="absolute right-4 top-3 text-gray-500 hover:text-gray-700"
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>

                            <motion.h3
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.2 }}
                                className="text-2xl font-bold text-primary mb-3.5 text-center"
                            >
                                {modalFlashcard?.question}
                            </motion.h3>

                            <hr className="bg-gray-300 border-0 h-0.5 mb-3.5 rounded-lg" />

                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.15, duration: 0.2 }}
                                className="text-sm text-gray-700 leading-relaxed"
                            >
                                {modalFlashcard?.answer}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

