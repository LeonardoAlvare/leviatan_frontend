import { motion, AnimatePresence } from "framer-motion";
import type { DocumentR } from "../../../../utils/interfaces/document.interface";

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentR[];
  onAddDocument: (doc: {
    title: string;
    content: string;
    file?: File | null;
  }) => void;
  loading?: boolean;
  onclick: () => void;
  onViewDocument: (document: DocumentR) => void;
}

export function DocumentModal({
  isOpen,
  onClose,
  documents,
  onclick,
  onViewDocument,
  loading = false,
}: DocumentModalProps) {


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-purple-primary mb-6">
              Documentos de la materia
            </h2>

            {/* Lista de documentos */}
            {documents.length === 0 ? (
              <p className="text-gray-500 mb-6">
                No hay documentos cargados en esta materia.
              </p>
            ) : (
              <ul className="space-y-4 max-h-96 overflow-y-auto">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="bg-white border-2 border-[#DDD6FE] rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#A78BFA]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-[#F5F3FF] rounded-xl flex items-center justify-center flex-shrink-0 border border-[#DDD6FE]">
                          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1F1F1F] text-lg truncate">{doc.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5">Documento de estudio</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onViewDocument?.(doc)}
                        className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 shadow-md hover:shadow-xl transition-all duration-300 flex-shrink-0"
                      >
                        Ver documento
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={loading}
                onClick={onclick}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 shadow-md"
              >
                {loading ? "Guardando..." : "Agregar documento"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
