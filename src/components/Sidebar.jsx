import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, ClipboardList, PlusSquare, MessageSquare, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext"; // Import ThemeContext

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { darkMode, setDarkMode } = useTheme(); // Use global theme context
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: <Home size={20} /> },
    user?.role === "Manager" &&
      { path: "/projects", label: "Projects", icon: <ClipboardList size={20} /> },
    user?.role === "Manager" &&
      { path: "/add-project", label: "Add Project", icon: <PlusSquare size={20} /> },
    user?.role === "Project Leader" &&
      { path: "/projects", label: "Projects", icon: <ClipboardList size={20} /> },
    user?.role === "Project Leader" &&
      { path: "/view-tasks", label: "Tasks List", icon: <ClipboardList size={20} /> },
    user?.role === "Team Member" &&
      { path: "/my-tasks", label: "My Tasks", icon: <ClipboardList size={20} /> },
    { path: "/chat", label: "Chat", icon: <MessageSquare size={20} />, highlight: true },
  ].filter(Boolean);

  return (
    // <div className="h-screen w-64 bg-gray-900 text-white flex flex-col p-6 fixed left-0 top-0">
    //   <h2 className="text-2xl font-bold mb-6">ManageMate</h2>

    //   <nav className="flex flex-col space-y-4">
    //     <Link to="/dashboard" className="hover:text-blue-400">Dashboard</Link>

    //     {user?.role === "Manager" && (
    //       <>
    //       <Link to="/projects" className="hover:text-blue-400">Projects</Link>
    //       <Link to="/add-project" className="hover:text-blue-400">Add Project</Link>
    //       </>
    //     )}

    //     {user?.role === "Project Leader" && (
    //       <>
    //       <Link to="/projects" className="hover:text-blue-400">Projects</Link>
    //       <Link to="/view-tasks" className="hover:text-blue-400">Tasks List</Link>
    //       </>
    //     )}

    //     {user?.role === "Team Member" && (
    //       <Link to="/my-tasks" className="hover:text-blue-400">My Tasks</Link>
    //     )}

    //     <Link to="/chat" className="hover:text-green-400 font-bold">💬 Chat</Link>
    //   </nav>

    //   <button
    //     onClick={logout}
    //     className="mt-auto bg-red-500 px-4 py-2 rounded hover:bg-red-700 transition"
    //   >
    //     Logout
    //   </button>
    // </div>
    <div className={`h-screen ${darkMode ? "bg-gray-950 text-white" : "bg-gray-200 text-black"} fixed top-0 left-0 ${collapsed ? "w-20" : "w-64"} transition-all duration-300 p-4 flex flex-col shadow-lg`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mb-6 focus:outline-none hover:scale-110 transition-transform"
      >
        <Menu size={24} className={darkMode ? "text-white" : "text-black"} />
      </button>
      
      <nav className="flex flex-col space-y-4">
        {menuItems.map(({ path, label, icon, highlight }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center space-x-3 p-2 rounded-lg transition-all hover:bg-blue-500 hover:scale-105 ${
              location.pathname === path ? "bg-blue-600" : ""
            } ${highlight ? "text-green-400 font-bold" : ""}`}
          >
            {icon}
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="mt-6 flex items-center space-x-3 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
      </button>

      <button
        onClick={logout}
        className="mt-auto flex items-center space-x-3 p-2 bg-red-500 rounded-lg hover:bg-red-700 transition hover:scale-105"
      >
        <LogOut size={20} />
        {!collapsed && <span>Logout</span>}
      </button>
    </div>
  );
};

export default Sidebar;
