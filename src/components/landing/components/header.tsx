import { Button } from "./Button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate("/login");
  };

  const nav = [
    {
      url: "features",
      name: "Beneficios",
    },
    {
      url: "steps",
      name: "Pasos",
    },
    {
      url: "testimonials",
      name: "Testimonios",
    },
    {
      url: "dashboard",
      name: "Dashboard",
    }
  ];

  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/80 backdrop-blur-xl border border-purple-200 rounded-2xl px-8 py-4 shadow-lg w-[70%] max-w-7xl">
      <div className="flex items-center justify-between gap-12">
        <div className="text-2xl font-bold text-purple-700 hover:scale-105 transition-transform">
          Tech Bot
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {nav.map((item) => (
            <a
              key={item.name}
              href={`#${item.url.toLowerCase()}`}
              className="text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              {item.name}
            </a>
          ))}
        </nav>
        <Button
          onClick={goToLogin}
          className="bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl"
        >
          Start Learning
        </Button>
      </div>
    </header>
  );
};
