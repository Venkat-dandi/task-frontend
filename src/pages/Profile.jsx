import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Profile</h2>
        
        {profile ? (
          <div className="text-gray-800">
            <p className="mb-2">
              <span className="font-semibold">Name:</span> {profile.name}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Email:</span> {profile.email}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Role:</span> {profile.role}
            </p>
          </div>
        ) : (
          <p className="text-red-500 text-center">No profile data available.</p>
        )}

        <button 
          className="mt-6 w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Profile;
