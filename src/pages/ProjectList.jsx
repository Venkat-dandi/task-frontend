import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import Auth to check role
import { useProject } from "../context/ProjectContext"; // Import ProjectContext      

const ProjectList = () => {
  const { user } = useAuth(); // Get logged-in user details
  const {projects, fetchProjects} = useProject(); //Get projects from context

  useEffect(() => {
    if (user) {
      fetchProjects(); // Fetch projects from backend
    }
  }, [user]);

  return (
    <div className="p-8 ml-64 text-white">
  <h1 className="text-3xl font-bold mb-4">Projects</h1>

  {user?.role === "Manager" && (
    <Link
      to="/add-project"
      className="bg-green-500 px-4 py-2 rounded hover:bg-green-700 mb-4 inline-block"
    >
      + Add Project
    </Link>
  )}

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {projects.length === 0 ? (
      <p className="text-gray-400">No projects assigned yet.</p>
    ) : (
      projects.map((project) => (
        <div
          key={project._id}
          className="bg-gray-800 p-4 rounded-lg shadow-lg"
        >
          <h2 className="text-xl font-semibold">{project.name}</h2>
          <p className="text-gray-300">{project.description}</p>
          {user?.role === "Project Leader" ? (
            <p className="text-sm mt-2">
              <strong>Assigned by:</strong> {project.managerId?.name}
            </p>
          ) : user?.role === "Manager" ? (
            <p className="text-sm mt-2">
              <strong>Assigned to:</strong> {project.projectLeader?.name}
            </p>
          ) : null}
          <p className="text-sm">
            <strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}
          </p>
          <p className="text-sm">
            <strong>Status:</strong> {project.status}
          </p>

          {/* File Download Link for Project Leader */}
          {project.file && (
            <p className="text-sm mt-2">
              <strong>Attachment:</strong>{" "}
              <a
                href={`http://localhost:5001${project.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-500"
              >
                Download File
              </a>
            </p>
          )}

          {/* Show "Edit Project" button only for Managers */}
          {user?.role === "Manager" && (
            <Link
              to={`/edit-project/${project._id}`}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 mt-2 inline-block"
              onClick={() => console.log("Project ID:", project._id)}
            >
              Edit
            </Link>
          )}

          {/* Show "Create Task" & "View Tasks" only for Team Leaders */}
          {user?.role === "Project Leader" && (
            <>
              <Link
                to={`/add-task/${project._id}`}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-700 mt-2 inline-block ml-2"
              >
                Create Task
              </Link>
              <Link
                to={`/tasks/${project._id}`}
                className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-700 mt-2 inline-block ml-2"
              >
                View Tasks
              </Link>
            </>
          )}
        </div>
      ))
    )}
  </div>
</div>

  );
};

export default ProjectList;
