export function Dashboard() {
    return (
        <section id="dashboard" className="min-h-screen bg-gradient-to-r from-purple-50 to-purple-100 py-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-purple-700 mb-4">Dashboard</h2>
                    <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                        Aquí podrás ver un pequeño dashboard de nuestros datos. Navega fácilmente a través de tus materiales de estudio y optimiza tu aprendizaje.
                    </p>
                </div>

                {/* Power BI Dashboard */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-5xl mx-auto">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe 
                            title="PROYECTOAULATALLERBD" 
                            className="absolute top-0 left-0 w-full h-full rounded-lg border-0"
                            src="https://app.powerbi.com/view?r=eyJrIjoiMTA5MTkyZDctZjc1ZC00YWU0LWI4N2MtZWNmZjEyNGY5NTk0IiwidCI6IjlkMTJiZjNmLWU0ZjYtNDdhYi05MTJmLTFhMmYwZmM0OGFhNCIsImMiOjR9"
                            allowFullScreen
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}