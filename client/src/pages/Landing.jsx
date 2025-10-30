import React from "react";
import { Code2, Video, PlayCircle, Clock, FileCode, MessageSquare } from "lucide-react";
import DarkModeToggle from '../components/ThemeToggler';
import DeviceCheckModal from "../components/TestModal";


const Landing = () => {
  const [openModal, setOpenModal] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState({});

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible({
        hero: true,
        features: true,
        stats: true,
        cta: true
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <Code2 size={48} />,
      title: "Collaborative Editor",
      description: "Write and edit code together in real-time with instant updates and syntax highlighting."
    },
    {
      icon: <Video size={48} />,
      title: "Peer Video Calls",
      description: "Communicate seamlessly while coding — talk, explain, and debug together."
    },
    {
      icon: <PlayCircle size={48} />,
      title: "Judge0 Integration",
      description: "Execute code securely across multiple languages, right in the browser."
    },
    {
      icon: <FileCode size={48} />,
      title: "Multi-File Support",
      description: "Organize your code with multiple files and effortlessly switch between them."
    },
    
  ];

  const stats = [
    { number: "50+", label: "Programming Languages" },
    { number: "Real-time", label: "Code Synchronization" },
    { number: "HD", label: "Video Quality" },
    { number: "Secure", label: "Code Execution" }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 text-gray-900 dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-950 dark:to-black dark:text-gray-100 transition-colors duration-300">
      {/* Navbar */}
      <header 
        className="w-full flex justify-between items-center px-10 py-6 backdrop-blur-md bg-white/70 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 transition-all"
        style={{
          opacity: isVisible.hero ? 1 : 0,
          transform: isVisible.hero ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.6s ease-out'
        }}
      >
        <h1 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
          CollabCode
        </h1>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex gap-8 text-gray-700 dark:text-gray-300">
            <button
              onClick={() => setOpenModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-300 font-medium hover:shadow-lg hover:shadow-blue-500/30"
            >
              Launch App
            </button>
          </nav>
          <DarkModeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="flex flex-col items-center text-center py-20 px-6 max-w-4xl"
        style={{
          opacity: isVisible.hero ? 1 : 0,
          transform: isVisible.hero ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out 0.2s'
        }}
      >
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-6 leading-tight">
          Code. Connect. Create.
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl">
          Collaborate live on code, discuss ideas face-to-face, and execute instantly — powered by Judge0.
        </p>

        <button 
          onClick={() => setOpenModal(true)}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 flex items-center gap-2"
        >
          Start Your Session Now
          <PlayCircle size={20} />
        </button>

        {/* Stats Bar */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 w-full"
          style={{
            opacity: isVisible.stats ? 1 : 0,
            transform: isVisible.stats ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out 0.6s'
          }}
        >
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {stat.number}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Screenshot Showcase */}
        <div 
          className="relative w-full max-w-5xl mt-16 group"
          style={{
            opacity: isVisible.hero ? 1 : 0,
            transform: isVisible.hero ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 1s ease-out 0.4s'
          }}
        >
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-600 rounded-3xl group-hover:opacity-50 transition-all duration-500"></div>
          <img
            src="/image.png"
            alt="App Preview"
            className="relative w-full rounded-2xl border border-gray-300 dark:border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="grid md:grid-cols-4 gap-8 px-10 py-24 w-full max-w-6xl"
      >
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center hover:border-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              opacity: isVisible.features ? 1 : 0,
              transform: isVisible.features ? 'translateY(0)' : 'translateY(30px)',
              transition: `all 0.6s ease-out ${0.8 + idx * 0.1}s`
            }}
          >
            <div className="mx-auto text-blue-600 dark:text-blue-400 mb-4">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      {/* CTA Section */}
      <section 
        className="w-full max-w-6xl px-10 py-20"
        style={{
          opacity: isVisible.cta ? 1 : 0,
          transform: isVisible.cta ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out 1.2s'
        }}
      >
        <div className="relative overflow-hidden bg-blue-600 rounded-3xl p-12 text-center text-white">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Coding Sessions?
            </h2>
            <p className="text-xl mb-8 text-blue-50">
              Join thousands of developers collaborating in real-time
            </p>
            <button
              onClick={() => setOpenModal(true)}
              className="bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 hover:shadow-2xl hover:scale-105"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-8 border-t border-gray-200 dark:border-white/10 text-gray-500 text-sm">
        © {new Date().getFullYear()} CollabCode. All rights reserved.
      </footer>

      <DeviceCheckModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onJoin={() => {
          window.location.href = "/code"
          setOpenModal(false);
        }}
      />
    </div>
  );
};

export default Landing;