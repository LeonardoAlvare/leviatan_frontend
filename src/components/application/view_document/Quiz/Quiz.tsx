import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import type { Quiz } from "../../../../utils/interfaces/quiz.interface"
import { Enviroment } from "../../../../utils/env/enviroment"
import { useAuth } from "../../../../context/AuthContext"

export function Quiz() {
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showExplanation, setShowExplanation] = useState(false)
    const [score, setScore] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [userAnswers, setUserAnswers] = useState<{ question_id: number, selected_option: string }[]>([])
    const [startTime, setStartTime] = useState<number | null>(null)
    const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false)
    const [quizExists, setQuizExists] = useState<boolean | null>(null)
    const documentId = Number(sessionStorage.getItem("documentId"))
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

    useEffect(() => {
        const checkQuizExists = async () => {
            try {
                const response = await fetch(`${Enviroment.API_URL}/quiz/find?document=${documentId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (response.ok) {
                    const quiz = await response.json()
                    console.log("Quiz data:", quiz)
                    setQuiz(quiz)
                    setQuizExists(true)
                } else if (response.status === 404) {
                    setQuizExists(false)
                }
            } catch (error) {
                console.error("Error checking quiz:", error)
                setQuizExists(false)
            }
        }

        if (documentId && token) {
            checkQuizExists()
        }
    }, [documentId, token])

    const handleCreateQuiz = async () => {
        setIsLoadingQuiz(true)
        try {
            const response = await fetch(
                `${Enviroment.API_URL}/quiz/create?document=${documentId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                throw new Error("Error creating quiz")
            }
            const data = await response.json()
            console.log("Quiz created:", data)
            
            // Extraer el quiz del objeto de respuesta
            const newQuiz = data.quiz || data
            console.log("Quiz object:", newQuiz)
            console.log("Quiz questions:", newQuiz.questions)
            
            setQuiz(newQuiz)
            setQuizExists(true)
            setStartTime(Date.now())
        }
        catch (error) {
            console.error("Error creating quiz:", error)
        } finally {
            setIsLoadingQuiz(false)
        }
    }

    const createAttempt = async (): Promise<boolean> => {
        if (!quiz || !startTime) return false;
        const timeTaken = Math.floor((Date.now() - startTime) / 1000)
        if (!userId) return false;
        const payload = {
            answers: userAnswers,
            time_taken: timeTaken
        }

        try {
            const response = await fetch(`${Enviroment.API_URL}/statistics/quiz/${quiz.id}/submit?user=${userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Error creating quiz attempt: ${response.status} ${errorText}`)
            }
            console.log("Payload sent:", payload)
            const result = await response.json()
            console.log("Quiz attempt recorded:", result)
            console.log(timeTaken)
            return true
        } catch (error) {
            console.error("Error creating quiz attempt:", error)
            return false
        }
    }

    

    const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer === null && quiz?.questions) {
        setSelectedAnswer(answerIndex)
        setShowExplanation(true)

        const currentQuestionData = quiz.questions[currentQuestion]
        const selectedOption = currentQuestionData?.options[answerIndex]
        
        // Extraer el texto de la opción (puede ser string u objeto)
        const selectedOptionText = typeof selectedOption === 'string' ? selectedOption : selectedOption?.option_text || ""

        const newAnswer = {
            question_id: currentQuestionData.id,
            selected_option: selectedOptionText
        }
        setUserAnswers(prev => [...prev, newAnswer])

        if (selectedOptionText && selectedOptionText === currentQuestionData?.correct_option) {
            setScore(score + 1)
        }
    }
}

    const handleNextQuestion = async () => {
        if (quiz?.questions && currentQuestion < quiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1)
            setSelectedAnswer(null)
            setShowExplanation(false)
        } else {
            const success = await createAttempt()
            if (success) {
                setIsCompleted(true)
            } else {
                setIsCompleted(true)
            }
        }
    }

    const resetQuiz = () => {
        setCurrentQuestion(0)
        setSelectedAnswer(null)
        setShowExplanation(false)
        setScore(0)
        setIsCompleted(false)
        setUserAnswers([])
        setStartTime(Date.now())
    }

    const handleQuizClick = () => {
        setIsModalOpen(true)
        if (quizExists === true && quiz?.questions?.length) {
            setStartTime(Date.now())
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        resetQuiz()
    }

    const progress = quiz?.questions?.length ? ((currentQuestion + 1) / quiz.questions.length) * 100 : 0

    // Verificar si el quiz está listo para mostrarse
    const isQuizReady = quizExists === true && quiz?.questions && Array.isArray(quiz.questions) && quiz.questions.length > 0 && !isLoadingQuiz

    // Debug logs
    useEffect(() => {
        console.log("Quiz state:", quiz)
        console.log("Quiz exists:", quizExists)
        console.log("Is loading:", isLoadingQuiz)
        console.log("Is quiz ready:", isQuizReady)
    }, [quiz, quizExists, isLoadingQuiz, isQuizReady])

    return (
        <>
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                exit={{ opacity: 0 }}
                className="w-full text-left bg-gradient-to-r from-primary to-primary-light text-white rounded-lg hover:from-primary-light hover:to-primary transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2" onClick={handleQuizClick}
            >
                Quiz
            </motion.button>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        key="quiz-modal"
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/50"
                            onClick={closeModal}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        <motion.div
                            className="relative bg-white rounded-xl shadow-2xl w-[90%] max-w-2xl max-h-[80vh] overflow-hidden z-10"
                            initial={{ y: 20, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 10, opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{ boxShadow: "0 25px 50px -12px rgba(109, 40, 217, 0.25)" }}
                        >
                            <div className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-4 border-b border-lavender">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-xl font-semibold">Quiz Interactivo</h2>
                                    <button
                                        onClick={closeModal}
                                        className="text-white/80 hover:text-white transition-colors"
                                        aria-label="Cerrar"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                {!isCompleted && isQuizReady && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-white/90">
                                            <span>
                                                Pregunta {currentQuestion + 1} de {quiz.questions.length}
                                            </span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-white/20 rounded-full h-2">
                                            <motion.div
                                                className="bg-white rounded-full h-2"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {isLoadingQuiz ? (
                                    <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <motion.div
                                            className="w-16 h-16 mx-auto mb-4 border-4 border-primary/30 border-t-primary rounded-full animate-spin"
                                        />
                                        <p className="text-primary text-lg font-medium">Generando quiz...</p>
                                        <p className="text-gray-500 text-sm mt-2">Por favor espera mientras creamos tu quiz</p>
                                    </motion.div>
                                ) : quizExists === false ? (
                                    <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <svg
                                            className="mx-auto h-16 w-16 text-gray-400 mb-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                            />
                                        </svg>
                                        <p className="text-gray-500 text-lg mb-4">No hay quiz disponible</p>
                                        <button
                                            onClick={handleCreateQuiz}
                                            className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-lg hover:brightness-110 transition-all duration-200 font-medium"
                                        >
                                            Generar Quiz
                                        </button>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Haz clic para crear un quiz del documento
                                        </p>
                                    </motion.div>
                                ) : quizExists === null ? (
                                    <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-gray-300 border-t-primary rounded-full animate-spin" />
                                        <p className="text-gray-500 text-lg">Verificando quiz...</p>
                                    </motion.div>
                                ) : !isQuizReady ? (
                                    <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <svg
                                            className="mx-auto h-16 w-16 text-gray-400 mb-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                            />
                                        </svg>
                                        <p className="text-gray-500 text-lg">Cargando preguntas del quiz...</p>
                                    </motion.div>
                                ) : isCompleted ? (
                                    <motion.div
                                        className="text-center py-8"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <motion.div
                                            className="mb-6"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                        >
                                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-center">
                                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </div>
                                        </motion.div>

                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Quiz Completado!</h3>
                                        <p className="text-gray-600 mb-6">Has terminado el quiz exitosamente</p>

                                        <div className="bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-lg p-6 mb-6 border border-lavender">
                                            <div className="text-3xl font-bold text-primary mb-2">
                                                {score} / {quiz?.questions?.length || 0}
                                            </div>
                                            <div className="text-gray-600">
                                                {quiz?.questions?.length ? Math.round((score / quiz.questions.length) * 100) : 0}% de respuestas correctas
                                            </div>
                                        </div>

                                        <button
                                            onClick={resetQuiz}
                                            className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-lg hover:brightness-110 transition-all duration-200 font-medium"
                                        >
                                            Reintentar Quiz
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={currentQuestion}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h3 className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
                                            {quiz?.questions?.[currentQuestion]?.question_text}
                                        </h3>

                                        <div className="space-y-3 mb-6">
                                            {quiz?.questions?.[currentQuestion]?.options?.map((option, index) => {
                                                // Manejar tanto strings como objetos
                                                const optionText = typeof option === 'string' ? option : option.option_text
                                                const isSelected = selectedAnswer === index
                                                const isCorrect = optionText === quiz?.questions?.[currentQuestion]?.correct_option
                                                const showResult = showExplanation

                                                let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 "

                                                if (!showResult) {
                                                    buttonClass += "border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer"
                                                } else if (isCorrect) {
                                                    buttonClass += "border-green-500 bg-green-50 text-green-800"
                                                } else if (isSelected && !isCorrect) {
                                                    buttonClass += "border-red-500 bg-red-50 text-red-800"
                                                } else {
                                                    buttonClass += "border-gray-200 bg-gray-50 text-gray-600"
                                                }

                                                return (
                                                    <motion.button
                                                        key={index}
                                                        className={buttonClass}
                                                        onClick={() => handleAnswerSelect(index)}
                                                        disabled={showExplanation}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        whileHover={!showExplanation ? { scale: 1.02 } : {}}
                                                        whileTap={!showExplanation ? { scale: 0.98 } : {}}
                                                    >
                                                        <div className="flex items-center">
                                                            <span className="w-6 h-6 rounded-full border-2 border-current mr-3 flex items-center justify-center text-sm font-medium">
                                                                {String.fromCharCode(65 + index)}
                                                            </span>
                                                            {optionText}
                                                            {showResult && isCorrect && (
                                                                <svg
                                                                    className="w-5 h-5 ml-auto text-green-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                            )}
                                                            {showResult && isSelected && !isCorrect && (
                                                                <svg
                                                                    className="w-5 h-5 ml-auto text-red-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M6 18L18 6M6 6l12 12"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </motion.button>
                                                )
                                            })}
                                        </div>

                                        <AnimatePresence>
                                            {showExplanation && (
                                                <motion.div
                                                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div className="flex items-start">
                                                        <svg
                                                            className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        <div>
                                                            <h4 className="font-medium text-blue-800 mb-1">Explicación</h4>
                                                            <p className="text-blue-700 text-sm leading-relaxed">
                                                                {selectedAnswer !== null && quiz?.questions?.[currentQuestion]?.correct_option
                                                                    ? `La respuesta correcta es: ${quiz.questions[currentQuestion].correct_option}`
                                                                    : "Respuesta registrada"
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <AnimatePresence>
                                            {showExplanation && (
                                                <motion.div
                                                    className="flex justify-end"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ delay: 0.2 }}
                                                >
                                                    <button
                                                        onClick={handleNextQuestion}
                                                        className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-2 rounded-lg hover:brightness-110 transition-all duration-200 font-medium"
                                                    >
                                                        {quiz?.questions && currentQuestion < quiz.questions.length - 1 ? "Siguiente Pregunta" : "Ver Resultados"}
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}