import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const authAPI = "http://localhost:5001/auth";

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if(storedUser){
      setUser(storedUser);
      fetchProfile();
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/auth/users", {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const login = async (email, password) => {
    try{
      const response = await fetch(`${authAPI}/login`,{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password}),
        credentials: "include"
      });

      const data = await response.json();

      if(!response.ok){
        throw new Error(data.message || "Login failed");
      }

      const userData = {
        id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        token: data.token,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      fetchUsers();

      navigate("/dashboard");

      return true;
    }
    catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }

  const register = async (name, email, password, role) => {
    try{
      const response = await fetch(`${authAPI}/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name, email, password, role}),
        credentials: "include"
      });

      const data = await response.json();

      if(!response.ok){
        throw new Error(data.message || "Registration failed");
      }

      navigate("/");

      return true;
    }
    catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  }

  const logout = async () => {
    try {
      await fetch("http://localhost:5001/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("user");
      setUser(null);
      setUsers([]);
      setProfile(null);

      setTimeout(() => {
        navigate("/");
      }, 100);
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  }

  const fetchProfile = async () => {
    try{
      const response = await fetch(`${authAPI}/profile`,{
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setProfile(data);
    }
    catch (error) {
      console.error("Error fetching profile:", error);
    }
  }

  return(
    <AuthContext.Provider value={{user, profile, setProfile, users, register, login, logout, fetchProfile}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);