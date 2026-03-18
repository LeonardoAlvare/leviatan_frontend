import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Enviroment } from "../../../../utils/env/enviroment"
import { useAuth } from "../../../../context/AuthContext"


interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hola, soy tu asistente de estudio. ¿En qué puedo ayudarte con este documento?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { token } = useAuth()
  const documentId = Number(sessionStorage.getItem("documentId"))

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Cargar historial de chat al montar el componente
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!documentId || !token) {
        setIsLoadingHistory(false)
        return
      }

      try {
        const response = await fetch(
          `${Enviroment.API_URL}/chat/history?user=${userId}&document=${documentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        if (!response.ok) {
          throw new Error("Error al cargar el historial")
        }
        const data = await response.json()
        
        const historyMessages: Message[] = []
        const historyItems = Array.isArray(data) ? data : (data.history || [])
        
        const sortedHistory = [...historyItems].sort((a: any, b: any) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        
        sortedHistory.forEach((entry: any) => {
          historyMessages.push({
            id: `${entry.id}-user`,
            text: entry.message,
            sender: "user",
            timestamp: new Date(entry.timestamp),
          })
          historyMessages.push({
            id: `${entry.id}-bot`,
            text: entry.response,
            sender: "bot",
            timestamp: new Date(entry.timestamp),
          })
        })

        if (historyMessages.length > 0) {
          setMessages([
            {
              id: "1",
              text: "Hola, soy tu asistente de estudio. ¿En qué puedo ayudarte con este documento?",
              sender: "bot",
              timestamp: new Date(),
            },
            ...historyMessages,
          ])
        }
      } catch (err) {
        console.error("Error loading chat history:", err)
        setError("No se pudo cargar el historial del chat")
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadChatHistory()
  }, [documentId, token])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !documentId || !token) return

    const messageToSend = inputValue.trim()

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageToSend,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setError(null)

    try {
      const botMessageId = `bot-stream-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          text: "",
          sender: "bot",
          timestamp: new Date(),
        },
      ])

      const response = await fetch(
        `${Enviroment.API_URL}/chat/stream?document=${documentId}&user=${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: messageToSend,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Error al enviar el mensaje")
      }

      if (!response.body) {
        throw new Error("No se recibió stream de respuesta")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        accumulated += decoder.decode(value, { stream: true })

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, text: accumulated }
              : msg,
          ),
        )
      }

      if (!accumulated.trim()) {
        throw new Error("La respuesta llegó vacía")
      }
    } catch (err) {
      console.error("Error sending message:", err)
      setError("No se pudo enviar el mensaje. Inténtalo de nuevo.")
      
      // Mensaje de error del bot
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center">
        <motion.div
          className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        <p className="text-gray-500 mt-4">Cargando historial...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-red-50 border-l-4 border-red-500 p-3 mx-4 mt-4"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.sender === "user"
                    ? "bg-gradient-to-r from-primary to-primary-light text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.1 }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Escribe tu pregunta..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg hover:from-primary-light hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          El asistente responde basándose en el contenido del documento
        </p>
      </div>
    </div>
  )
}