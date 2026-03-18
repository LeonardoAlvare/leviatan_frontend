import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Enviroment } from "../../../utils/env/enviroment";

interface UserData {
  id: number;
  name: string;
  last_name: string;
  email: string;
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>({
    id: 0,
    name: "",
    last_name: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsFetching(true);
      const token = sessionStorage.getItem("access_token");
      const response = await fetch(`${Enviroment.API_URL}/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los datos del usuario");
      }

      const data: UserData = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Error al cargar los datos del usuario");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("access_token");
      const response = await fetch(`${Enviroment.API_URL}/user/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          name: userData.name,
          last_name: userData.last_name,
          email: userData.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el perfil");
      }

      setSuccess("Perfil actualizado exitosamente");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Error al actualizar el perfil. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/subject")}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8 transition-colors font-medium text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Información del perfil */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900">Editar Perfil</h2>
            <p className="mt-1 text-sm text-gray-500">
              Actualiza tu información personal y de la cuenta. Los cambios se guardarán para tu próxima sesión.
            </p>
            
            <div className="mt-6 flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
              </div>
              <div>
                <button 
                  className="text-sm font-medium text-purple-600 hover:text-purple-700" 
                  type="button"
                >
                  Cambiar foto
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, GIF o PNG. 1MB max.
                </p>
              </div>
            </div>
          </div>

          {/* Columna derecha - Formulario */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <form onSubmit={handleSubmit}>
                <div className="p-6 sm:p-8 space-y-8">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <span className="text-sm">{success}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre - Floating label */}
                    <div className="relative floating-label-input">
                      <input
                        className="block w-full px-3 py-2 bg-transparent border-b-2 border-gray-200 focus:outline-none focus:ring-0 focus:border-purple-600 peer text-gray-900 placeholder-transparent"
                        id="name"
                        name="name"
                        placeholder="Nombre"
                        type="text"
                        value={userData.name}
                        onChange={handleChange}
                        required
                      />
                      <label
                        className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-600"
                        htmlFor="name"
                      >
                        Nombre
                      </label>
                    </div>

                    {/* Apellido - Floating label */}
                    <div className="relative floating-label-input">
                      <input
                        className="block w-full px-3 py-2 bg-transparent border-b-2 border-gray-200 focus:outline-none focus:ring-0 focus:border-purple-600 peer text-gray-900 placeholder-transparent"
                        id="last_name"
                        name="last_name"
                        placeholder="Apellido"
                        type="text"
                        value={userData.last_name}
                        onChange={handleChange}
                        required
                      />
                      <label
                        className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-600"
                        htmlFor="last_name"
                      >
                        Apellido
                      </label>
                    </div>
                  </div>

                  {/* Email - Floating label */}
                  <div className="relative floating-label-input">
                    <input
                      className="block w-full px-3 py-2 bg-transparent border-b-2 border-gray-200 focus:outline-none focus:ring-0 focus:border-purple-600 peer text-gray-900 placeholder-transparent"
                      id="email"
                      name="email"
                      placeholder="Correo Electrónico"
                      type="email"
                      value={userData.email}
                      onChange={handleChange}
                      required
                    />
                    <label
                      className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-600"
                      htmlFor="email"
                    >
                      Correo Electrónico
                    </label>
                  </div>
                </div>

                {/* Footer del formulario */}
                <div className="bg-gray-50 px-6 sm:px-8 py-4 flex justify-end items-center space-x-4 rounded-b-lg">
                  <button
                    className="px-6 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition-colors"
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
