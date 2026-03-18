import { Document, Page, pdfjs } from "react-pdf"
import { Enviroment } from "../../../../utils/env/enviroment"
import { useEffect, useState, useCallback } from "react"
import { motion } from "motion/react"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { useAuth } from "../../../../context/AuthContext"

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

export default function Pdf_view() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(0.75)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [audioLoading, setAudioLoading] = useState<boolean>(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const { token } = useAuth()

  const documentId = Number(sessionStorage.getItem("documentId"))
  const documentFilename = sessionStorage.getItem("documentFilename")

  useEffect(() => {
    let isMounted = true
    let objectUrl: string | null = null

    const fetchDocument = async () => {
      if (!token) {
        setError("Faltan datos de autenticación")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        let filename = documentFilename
        if (!filename && documentId) {
          const metadataResponse = await fetch(`${Enviroment.API_URL}/document/${documentId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json() as { file_path?: string; title?: string }
            if (metadata.file_path) {
              filename = metadata.file_path
              sessionStorage.setItem("documentFilename", metadata.file_path)
            }
            if (metadata.title) {
              sessionStorage.setItem("documentTitle", metadata.title)
            }
          }
        }

        if (!filename) {
          throw new Error("No se encontro el archivo del documento")
        }

        const response = await fetch(`${Enviroment.API_URL}/document/file/${encodeURIComponent(filename)}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Error al obtener documento: ${response.status}`)
        }

        const blob = await response.blob()

        if (!isMounted) {
          return
        }

        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching document:", err)
        if (isMounted) {
          setError("Error al cargar el documento")
          setIsLoading(false)
        }
      }
    }

    fetchDocument()

    return () => {
      isMounted = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      if (audio) {
        audio.pause()
        audio.src = ""
      }
    }
  }, [documentId, documentFilename, token, audio])

  const fetchTextToSpeech = async () => {
    if (!documentId || !token) {
      setAudioError("Faltan datos del documento para TTS")
      return
    }

    try {
      setAudioLoading(true)
      setAudioError(null)

      const response = await fetch(`${Enviroment.API_URL}/document/Audio?id=${documentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener TTS: ${response.status}`)
      }

      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)
      const newAudio = new Audio(audioUrl)

      // Configurar eventos del audio
      newAudio.addEventListener("loadedmetadata", () => {
        setDuration(newAudio.duration)
      })

      newAudio.addEventListener("timeupdate", () => {
        setCurrentTime(newAudio.currentTime)
      })

      newAudio.addEventListener("ended", () => {
        setAudioPlaying(false)
        setCurrentTime(0)
      })

      newAudio.addEventListener("error", () => {
        setAudioError("Error al reproducir el audio")
        setAudioPlaying(false)
      })

      setAudio(newAudio)
      setAudioLoading(false)
    } catch (err) {
      console.error("Error fetching TTS:", err)
      setAudioError("Error al cargar el audio del documento")
      setAudioLoading(false)
    }
  }

  const playAudio = () => {
    if (!audio) {
      fetchTextToSpeech()
    } else {
      audio.play()
      setAudioPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audio) {
      audio.pause()
      setAudioPlaying(false)
    }
  }

  const stopAudio = () => {
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      setAudioPlaying(false)
      setCurrentTime(0)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audio || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration

    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setCurrentPage(1)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("Error loading PDF:", error)
    setError("Error al cargar el PDF")
  }, [])

  const goToPage = useCallback(
    (pageNumber: number) => {
      if (pageNumber >= 1 && pageNumber <= numPages) {
        setCurrentPage(pageNumber)
      }
    },
    [numPages],
  )

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages))
  }, [numPages])

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3.0))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1.0)
  }, [])

  const width = Math.min(1200 * scale, window.innerWidth - 80)

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar el documento</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <svg
            className="animate-spin h-12 w-12 text-primary mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-600">Cargando documento...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col h-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white border-b border-gray-200 p-4 flex items-center shadow-sm flex-shrink-0 flex-wrap gap-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Controles de navegación de páginas */}
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center transition-all duration-200 shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ x: currentPage <= 1 ? 0 : -2 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </motion.svg>
            Anterior
          </motion.button>

          <motion.div
            className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-gray-700 font-medium">Página</span>
            <motion.input
              type="number"
              min="1"
              max={numPages}
              value={currentPage}
              onChange={(e) => goToPage(Number.parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              whileFocus={{ scale: 1.05 }}
            />
            <span className="text-gray-700 font-medium">de {numPages}</span>
          </motion.div>

          <motion.button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center transition-all duration-200 shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Siguiente
            <motion.svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ x: currentPage >= numPages ? 0 : 2 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </motion.svg>
          </motion.button>
        </div>

        {/* Spacer para empujar los controles a la derecha */}
        <div className="flex-1"></div>

        {/* Controles de Audio TTS */}
        <motion.div
          className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-purple-100 px-2 py-2 rounded-lg border border-purple-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {audioLoading ? (
            <div className="flex items-center space-x-2">
              <svg
                className="animate-spin h-5 w-5 text-purple-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm text-purple-700">Cargando audio...</span>
            </div>
          ) : (
            <>
              <motion.button
                onClick={audioPlaying ? pauseAudio : playAudio}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full shadow-md transition-all duration-200"
                title={audioPlaying ? "Pausar" : "Reproducir"}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {audioPlaying ? (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.6582 9.28638C18.098 10.1862 18.8178 10.6361 19.0647 11.2122C19.2803 11.7152 19.2803 12.2847 19.0647 12.7878C18.8178 13.3638 18.098 13.8137 16.6582 14.7136L9.896 18.94C8.29805 19.9387 7.49907 20.4381 6.83973 20.385C6.26501 20.3388 5.73818 20.0469 5.3944 19.584C5 19.053 5 18.1108 5 16.2264V7.77357C5 5.88919 5 4.94701 5.3944 4.41598C5.73818 3.9531 6.26501 3.66111 6.83973 3.6149C7.49907 3.5619 8.29805 4.06126 9.896 5.05998L16.6582 9.28638Z" />
                  </svg>
                )}
              </motion.button>

              <motion.button
                onClick={stopAudio}
                disabled={!audio}
                className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-md transition-all duration-200"
                title="Detener"
                whileHover={{ scale: audio ? 1.1 : 1 }}
                whileTap={{ scale: audio ? 0.95 : 1 }}
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </motion.button>

              {audio && duration > 0 && (
                <div className="flex items-center space-x-2 ml-2">
                  <span className="text-xs font-medium text-purple-700 min-w-[40px]">{formatTime(currentTime)}</span>
                  <div
                    className="w-32 h-2 bg-purple-200 rounded-full cursor-pointer overflow-hidden"
                    onClick={handleProgressClick}
                  >
                    <motion.div
                      className="h-full bg-purple-600"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentTime / duration) * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <span className="text-xs font-medium text-purple-700 min-w-[40px]">{formatTime(duration)}</span>
                </div>
              )}

              {!audio && (
                <span className="text-xs text-purple-700 font-medium">Escuchar documento</span>
              )}

              {audioError && (
                <span className="text-xs text-red-600 font-medium">{audioError}</span>
              )}
            </>
          )}
        </motion.div>

        {/* Separador con padding */}
        <div className="w-4"></div>

        {/* Controles de Zoom */}
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <motion.button
            onClick={zoomOut}
            className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg shadow-sm transition-all duration-200"
            title="Alejar"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
          </motion.button>

          <motion.button
            onClick={resetZoom}
            className="px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg text-sm font-medium shadow-sm transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {Math.round(scale * 100)}%
          </motion.button>

          <motion.button
            onClick={zoomIn}
            className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg shadow-sm transition-all duration-200"
            title="Acercar"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        </motion.div>
      </motion.div>

      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-2">
        <div className="flex justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {pdfUrl && (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <svg
                      className="animate-spin h-8 w-8 text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                }
                error={<div className="text-center p-8 text-red-500">Error al cargar el documento</div>}
              >
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="shadow-2xl rounded-lg overflow-hidden"
                >
                  <Page
                    pageNumber={currentPage}
                    width={width}
                    className="bg-white"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div
                        className="flex items-center justify-center p-8 bg-white"
                        style={{ width, height: width * 1.414 }}
                      >
                        <svg
                          className="animate-spin h-8 w-8 text-primary"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </div>
                    }
                  />
                </motion.div>
              </Document>
            )}
          </motion.div>
        </div>
      </div>

      <motion.div
        className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-4 py-3 text-sm text-gray-600 flex justify-center items-center shadow-sm flex-shrink-0"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <motion.span
          key={`${currentPage}-${numPages}-${scale}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="font-medium"
        >
          Mostrando página {currentPage} de {numPages} • Zoom: {Math.round(scale * 100)}%
        </motion.span>
      </motion.div>
    </motion.div>
  )
}