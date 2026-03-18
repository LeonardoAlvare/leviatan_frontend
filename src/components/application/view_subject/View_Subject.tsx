import { useState, useEffect } from "react";
import { Enviroment } from "../../../utils/env/enviroment";
import { motion } from "framer-motion";
import type { Subject } from "../../../utils/interfaces/subject.interface";
import { useAuth } from "../../../context/AuthContext";
import { SubjectList } from "./components/Subject_List";
import { SubjectModal } from "./components/Subject_Modal";
import type { DocumentR } from "../../../utils/interfaces/document.interface";
import { DocumentModal } from "./components/Document_Modal";
import { useNavigate } from "react-router-dom";

export function ViewSubject() {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<DocumentR[]>([]);

  const { token } = useAuth();
  const { user } = useAuth();

  const handleViewDocument = (document: DocumentR) => {
    sessionStorage.setItem("documentId", String(document.id));
    if (document.file_path) {
      sessionStorage.setItem("documentFilename", document.file_path);
    }
    if (document.title) {
      sessionStorage.setItem("documentTitle", document.title);
    }
    navigate("/documents");
  }
  // Crear materia
  const handleAddSubject = async () => {
    if (!newSubject.name) return alert("El nombre es obligatorio");
    if (!newSubject.description) return alert("La descripción es obligatoria");
    setLoading(true);

    try {
      const res = await fetch(`${Enviroment.API_URL}/subject/create?email=${user?.email}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSubject),
      });
      console.log(res);
      if (!res.ok) throw new Error("Error al crear materia");
      const data: Subject = await res.json();

      setSubjects((prev) => [...prev, data]);
      setNewSubject({ name: "", description: "" });
      setIsAddModalOpen(false);
      console.log(data);
    } catch (err) {
      console.error(err);
      alert("No se pudo crear la materia");
    } finally {
      setLoading(false);
    }
  };

  // Materia por usuario
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${Enviroment.API_URL}/subject/by-user?email=${user?.email}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Error al obtener materias");

        const data: Subject[] = await res.json();
        setSubjects(data);
        console.log(data);
      } catch (err) {
        console.error(err);
      }
    };

    if (token) fetchSubjects();
  }, [token]);

  // Documento por materia
  const fetchDocumentsBySubject = async (subjectId: number) => {
    try {
      const res = await fetch(
        `${Enviroment.API_URL}/subject/documents?id=${subjectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Error al obtener documentos");
      const data: DocumentR[] = await res.json();
      setDocuments(data);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.main
      className="flex-1 p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Mis Materias</h1>
        <button
          onClick={() => {
            setIsAddModalOpen(true);
          }}
          className="inline-block bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold py-3 px-8 rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Agregar materia
        </button>
      </div>
      {/* Lista de materias creadas en esta sesión */}
      <div className="max-w mx-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.length === 0 ? (
            <p className="text-center text-gray-500">No tienes materias aún.</p>
          ) : (
            <SubjectList
              subjects={subjects}
              onCardClick={(s) => {
                setSelectedSubject(s);
                sessionStorage.setItem("subjectCreatedId", String(s.id));
                fetchDocumentsBySubject(Number(s.id));
                setIsDocsModalOpen(true);
              }}

            />
          )}
        </div>
      </div>

      <SubjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddSubject}
        loading={loading}
        newSubject={newSubject}
        setNewSubject={setNewSubject}
      />

      {selectedSubject && (
        <DocumentModal
          isOpen={isDocsModalOpen}
          onClose={() => setIsDocsModalOpen(false)}
          // subjectName={selectedSubject.name}
          documents={documents}
          onAddDocument={() =>
            console.log("👉 Aquí abrirías modal de agregar documento")
          }
          onclick={() => navigate("/upload")}
          onViewDocument={handleViewDocument}
        />
      )}
    </motion.main>
  );
}
