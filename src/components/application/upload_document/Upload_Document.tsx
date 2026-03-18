import React, { useState } from 'react';
import { Enviroment } from '../../../utils/env/enviroment';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, easeOut } from "framer-motion"
import type { DocumentResponse } from '../../../utils/interfaces/document.interface';

export default function UploadDocument() {
    const [selectedFile, setSelectedFile] = useState<File>();
    const [title, setTitle] = useState<string>('');
    const [uploading, setUploading] = useState<boolean>(false);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [isDragOver, setIsDragOver] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const { token } = useAuth();
    const navigate = useNavigate();
    const subjectDocumentId = Number(sessionStorage.getItem("subjectCreatedId"))
    const allowedMimeTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    console.log("ID de la materia para el documento:", subjectDocumentId);
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            const file = files[0]
            if (allowedMimeTypes.includes(file.type)) {
                setSelectedFile(file)
                if (!title.trim()) {
                    setTitle(file.name.replace(/\.[^/.]+$/, ''));
                }
            } else {
                alert("Por favor, selecciona un archivo PDF, DOC, DOCX o PPTX.")
            }
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            if (!allowedMimeTypes.includes(file.type)) {
                alert("Formato no permitido. Usa PDF, DOC, DOCX o PPTX.");
                return;
            }
            setSelectedFile(file);
            if (!title.trim()) {
                setTitle(file.name.replace(/\.[^/.]+$/, ''));
            }
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            alert("Por favor, selecciona un archivo antes de subir.");
            return;
        }

        if (!token) {
            alert("No estás autenticado. Por favor, inicia sesión.");
            return;
        }

        if (!Number.isFinite(subjectDocumentId) || subjectDocumentId <= 0) {
            alert("No se encontró una materia válida para asociar el documento.");
            return;
        }

        if (!title.trim()) {
            alert("El título del documento es obligatorio.");
            return;
        }

        setUploading(true)
        setUploadProgress(0)

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title.trim());

        try {
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval)
                        return 90
                    }
                    return prev + Math.random() * 15
                })
            }, 200)
            
            const res = await fetch(`${Enviroment.API_URL}/document/create?subjectId=${subjectDocumentId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            clearInterval(progressInterval)
            setUploadProgress(100)

            if (!res.ok) {
                let backendMessage = "Error en la subida del documento";
                try {
                    const errorData = await res.json();
                    if (Array.isArray(errorData?.message)) {
                        backendMessage = errorData.message.join(', ');
                    } else if (typeof errorData?.message === 'string') {
                        backendMessage = errorData.message;
                    }
                } catch {
                    // Keep generic message if response is not JSON.
                }
                throw new Error(backendMessage);
            }

            setProcessingStatus("Procesando documento... Esto puede tardar unos minutos.");

            const data: DocumentResponse = await res.json();
            setProcessingStatus("Documento procesado con éxito.");
            const uploadedFilename = data?.saveDocument?.filename;
            const uploadedTitle = data?.saveDocument?.name;
            const uploadedId = data?.saveDocument?.id;

            if (uploadedFilename) {
                sessionStorage.setItem('documentFilename', uploadedFilename);
            }
            if (uploadedTitle) {
                sessionStorage.setItem('documentTitle', uploadedTitle);
            }
            if (typeof uploadedId === 'number') {
                sessionStorage.setItem('documentId', uploadedId.toString());
            }
            console.log("Documento subido y procesado:", data);

            
            setTimeout(() => {
                if (res.ok) {
                    navigate('/documents')
                }
            }, 3000)

            setSelectedFile(undefined);
            setTitle('');
        } catch (error) {
            console.error("Error al subir el documento:", error);
            setProcessingStatus(error instanceof Error ? error.message : "Error al subir el documento. Por favor, inténtalo de nuevo.");
        } finally {
            setUploading(false)
            setSelectedFile(undefined)
            setTimeout(() => {
                setProcessingStatus("")
                setUploadProgress(0)
            }, 5000)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: easeOut },
        },
    }

    const uploadAreaVariants = {
        idle: {
            scale: 1,
            borderColor: "rgb(196, 181, 253)",
            backgroundColor: "rgb(255, 255, 255)",
        },
        hover: {
            scale: 1.02,
            borderColor: "rgb(139, 92, 246)",
            backgroundColor: "rgb(250, 245, 255)",
            transition: { duration: 0.2 },
        },
        dragOver: {
            scale: 1.05,
            borderColor: "rgb(124, 58, 237)",
            backgroundColor: "rgb(245, 243, 255)",
            transition: { duration: 0.2 },
        },
    }

    const iconVariants = {
        idle: { y: 0, rotate: 0 },
        hover: { y: -5, rotate: 5, transition: { duration: 0.3 } },
        dragOver: { y: -10, rotate: 10, scale: 1.1, transition: { duration: 0.3 } },
    }


    return (
        <motion.main className="flex-1 p-8" variants={containerVariants} initial="hidden" animate="visible">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                        Subir Documento
                    </h1>
                    <p className="text-gray-600 text-lg">Arrastra y suelta tus archivos o haz clic para seleccionar</p>
                </motion.div>

                <motion.div
                    className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer relative overflow-hidden"
                    variants={uploadAreaVariants}
                    initial="idle"
                    animate={isDragOver ? "dragOver" : "idle"}
                    whileHover="hover"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        boxShadow: isDragOver
                            ? "0 20px 25px -5px rgba(124, 58, 237, 0.2), 0 10px 10px -5px rgba(124, 58, 237, 0.1)"
                            : "0 10px 15px -3px rgba(109, 40, 217, 0.1), 0 4px 6px -2px rgba(109, 40, 217, 0.05)",
                    }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 opacity-0"
                        animate={{ opacity: isDragOver ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                    />

                    <div className="relative z-10">
                        <motion.div
                            className="mb-6"
                            variants={iconVariants}
                            initial="idle"
                            animate={isDragOver ? "dragOver" : "idle"}
                            whileHover="hover"
                        >
                            <motion.svg
                                className="w-20 h-20 mx-auto text-purple-500 mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </motion.svg>

                            <motion.h3
                                className="text-2xl font-bold mb-3 text-purple-700"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                {isDragOver ? "¡Suelta tu archivo aquí!" : "Subir documentos"}
                            </motion.h3>

                            <motion.p
                                className="text-gray-600 mb-6 text-lg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                Formatos soportados: PDF, DOC, DOCX, PPTX
                            </motion.p>

                                <input type="file" id="fileInput" accept=".pdf,.doc,.docx,.pptx" onChange={handleFileChange} className="hidden" />

                            <motion.label
                                htmlFor="fileInput"
                                className="inline-block bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold py-3 px-8 rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Seleccionar Archivo
                            </motion.label>
                        </motion.div>

                        <AnimatePresence>
                            {selectedFile && (
                                <motion.div
                                    className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                                                <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4 text-left">
                                        <label htmlFor="document-title" className="block text-sm font-medium text-gray-700 mb-1">
                                            Titulo del documento
                                        </label>
                                        <input
                                            id="document-title"
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Ej: Apuntes de Algebra"
                                            className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <motion.button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                        whileHover={{ scale: uploading ? 1 : 1.02 }}
                                        whileTap={{ scale: uploading ? 1 : 0.98 }}
                                    >
                                        {uploading ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <motion.div
                                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                                />
                                                <span>Subiendo... {Math.round(uploadProgress)}%</span>
                                            </div>
                                        ) : (
                                            "Subir archivo"
                                        )}
                                    </motion.button>

                                    {uploading && (
                                        <motion.div
                                            className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {processingStatus && (
                                <motion.div
                                    className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-center space-x-3">
                                        {processingStatus.includes("éxito") ? (
                                            <motion.div
                                                className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                            >
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </motion.div>
                                        ) : processingStatus.includes("Error") ? (
                                            <motion.div
                                                className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                            >
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                            />
                                        )}
                                        <p className="text-sm font-medium text-blue-800">{processingStatus}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </motion.main>
    )
}