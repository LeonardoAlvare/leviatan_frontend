import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Enviroment } from "../../../../utils/env/enviroment"
import { useAuth } from "../../../../context/AuthContext"

interface StudyPlanProps {
    documentId: number
}

export function StudyPlan({ documentId }: StudyPlanProps) {
    const [studyPlan, setStudyPlan] = useState<any>(null)
    const [isLoadingStudyPlan, setIsLoadingStudyPlan] = useState<boolean>(false)
    const [selectedLevel, setSelectedLevel] = useState<"basico" | "intermedio" | "avanzado">("basico")
    const [isChecking, setIsChecking] = useState<boolean>(true)
    const { token } = useAuth()

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

    const normalizeStudyPlan = (raw: any) => {
        if (!raw) return null

        if (Array.isArray(raw)) {
            return raw.length > 0 ? raw[0] : null
        }

        if (raw.studyPlan) {
            return raw.studyPlan
        }

        return raw
    }


    useEffect(() => {
        const checkStudyPlanExists = async () => {
            setIsChecking(true)
            try {
                const response = await fetch(
                    `${Enviroment.API_URL}/study-plan/find?user=${userId}&document=${documentId}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )

                if (response.ok) {
                    const planResponse = await response.json()
                    const normalizedPlan = normalizeStudyPlan(planResponse)
                    console.log("Study plan found:", normalizedPlan)
                    setStudyPlan(normalizedPlan)
                } else if (response.status === 404) {
                    console.log("Study plan not found for level:", selectedLevel)
                    setStudyPlan(null)
                } else {
                    console.error("Unexpected error status:", response.status)
                    setStudyPlan(null)
                }
            } catch (error) {
                console.error("Error checking study plan:", error)
                setStudyPlan(null)
            } finally {
                setIsChecking(false)
            }
        }

        if (documentId && token) {
            checkStudyPlanExists()
        }
    }, [documentId, selectedLevel, token])

    const handleCreateStudyPlan = async () => {
        setIsLoadingStudyPlan(true)
        try {
            console.log("Creating study plan with level:", selectedLevel)
            const response = await fetch(`${Enviroment.API_URL}/study-plan/create?document=${documentId}&user=${userId}&level=${selectedLevel}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            console.log("Create study plan response status:", response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("Error response:", errorText)
                throw new Error("Error creating study plan")
            }

            const data = await response.json()
            console.log("Study plan created successfully:", data)

            // Renderizar inmediatamente el plan creado
            setStudyPlan(normalizeStudyPlan(data))
            setIsChecking(false)
        } catch (error) {
            console.error("Error creating study plan:", error)
        } finally {
            setIsLoadingStudyPlan(false)
        }
    }

    return (
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                    </svg>
                    Plan de Estudio
                </h4>

                {isChecking ? (
                    <motion.div
                        className="text-center py-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="animate-pulse space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Verificando disponibilidad...</p>
                    </motion.div>
                ) : isLoadingStudyPlan ? (
                    <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="h-6 bg-gradient-to-r from-lavender via-primary-light/30 to-lavender rounded"
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
                            className="h-20 bg-gradient-to-r from-lavender via-primary-light/30 to-lavender rounded"
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
                            <p className="text-primary text-sm font-medium">Generando plan de estudio...</p>
                        </motion.div>
                    </motion.div>
                ) : studyPlan?.content ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                    >
                        {/* Título y Nivel */}
                        <div className="flex items-center justify-between">
                            <h5 className="text-lg font-semibold text-primary">{studyPlan.title || "Plan de Estudio"}</h5>
                            {studyPlan.level && (
                                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                    {studyPlan.level.charAt(0).toUpperCase() + studyPlan.level.slice(1)}
                                </span>
                            )}
                        </div>

                        {/* Objetivos */}
                        {studyPlan.content.objectives && studyPlan.content.objectives.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                                <h6 className="font-semibold text-gray-800 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path
                                            fillRule="evenodd"
                                            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Objetivos
                                </h6>
                                <ul className="space-y-2">
                                    {studyPlan.content.objectives.map((objective: string, index: number) => (
                                        <motion.li
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-start text-sm text-gray-700"
                                        >
                                            <span className="text-primary mr-2">•</span>
                                            {objective}
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Cronograma */}
                        {studyPlan.content.schedule && (
                            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">
                                <h6 className="font-semibold text-gray-800 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Cronograma
                                </h6>
                                <div className="space-y-3">
                                    {Object.entries(studyPlan.content.schedule).map(([week, content], index) => (
                                        <motion.div
                                            key={week}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-white rounded-lg p-3 shadow-sm"
                                        >
                                            <p className="text-xs font-semibold text-green-700 uppercase mb-1">
                                                {week.replace("_", " ")}
                                            </p>
                                            <p className="text-sm text-gray-700">{String(content)}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recursos Recomendados */}
                        {studyPlan.content.recommended_resources && studyPlan.content.recommended_resources.length > 0 && (
                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                                <h6 className="font-semibold text-gray-800 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                    </svg>
                                    Recursos Recomendados
                                </h6>
                                <ul className="space-y-2">
                                    {studyPlan.content.recommended_resources.map((resource: string, index: number) => (
                                        <motion.li
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center text-sm text-gray-700 bg-white rounded px-3 py-2"
                                        >
                                            <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            {resource}
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        className="text-center py-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Selector de Nivel */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selecciona el nivel de dificultad:
                            </label>
                            <div className="flex gap-2 justify-center">
                                {(["basico", "intermedio", "avanzado"] as const).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setSelectedLevel(level)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            selectedLevel === level
                                                ? "bg-primary text-white shadow-md"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleCreateStudyPlan}
                            className="w-full px-4 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg hover:from-primary-light hover:to-primary transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Generar Plan de Estudio</span>
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Haz clic para crear un plan de estudio personalizado</p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
