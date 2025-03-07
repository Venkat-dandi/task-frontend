import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
window.global = window;
import { useProject } from "../context/ProjectContext";
import moment from "moment"; // ✅ Import Moment.js for timestamps

const socket = io("https://task-backend-suak.onrender.com");

const Chat = () => {
  const { user } = useProject();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [unreadMessages, setUnreadMessages] = useState({});
  const messagesEndRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const myAudioRef = useRef();
  const peerAudioRef = useRef();
  const connectionRef = useRef();

  const [videoStream, setVideoStream] = useState(null);
const myVideoRef = useRef();
const peerVideoRef = useRef();


  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");

        // ✅ Fetch Users
        const response = await fetch("https://task-backend-suak.onrender.com/auth/users", {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data.filter((u) => u._id !== user._id));

        // ✅ Fetch Unread Messages
        const unreadResponse = await fetch("https://task-backend-suak.onrender.com/messages/unread", {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (unreadResponse.ok) {
          const unreadData = await unreadResponse.json();
          setUnreadMessages(unreadData); // ✅ Store unread messages
        }
      } catch (error) {
        console.error("Error fetching users/unread messages:", error);
      }
    };

    fetchUsers();
  }, [user?._id]);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`https://task-backend-suak.onrender.com/messages/${selectedUser._id}`, {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!response.ok) throw new Error("Failed to fetch messages");
        const data = await response.json();
        setMessages(data);

        // ✅ Mark messages as read
        setUnreadMessages((prev) => ({ ...prev, [selectedUser._id]: false }));
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedUser?._id]);

  useEffect(() => {
    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);

      // ✅ Mark as unread if the sender is NOT the currently selected user
      if (newMessage.sender !== selectedUser?._id) {
        setUnreadMessages((prev) => ({ ...prev, [newMessage.sender]: true }));
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !selectedUser) return;

    const newMessage = {
      sender: user._id,
      receiver: selectedUser._id,
      message,
      createdAt: new Date().toISOString(), // ✅ Add timestamp
    };

    socket.emit("sendMessage", newMessage);
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };

  // ✅ Function to group messages by date
  const groupMessagesByDate = (messages) => {
    const grouped = {};
    messages.forEach((msg) => {
      const msgDate = moment(msg.createdAt).format("YYYY-MM-DD");
      if (!grouped[msgDate]) grouped[msgDate] = [];
      grouped[msgDate].push(msg);
    });
    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  // Audio Call - Get Microphone Access
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        setVideoStream(mediaStream);
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = mediaStream;
        }
        if (myAudioRef.current) {
          myAudioRef.current.srcObject = mediaStream;
        }
      })
      .catch((error) => console.error("❌ Error accessing camera & microphone:", error));
  }, []);
  

  // Handle Outgoing Call
  const callUser = (userId) => {
    if (!videoStream) {
      console.error("No video stream available. Please allow camera & microphone access.");
      return;
    }
  
    const peer = new Peer({ initiator: true, trickle: false, stream: videoStream });
  
    peer.on("signal", (signalData) => {
      socket.emit("callUser", { from: user._id, to: userId, signalData });
    });
  
    peer.on("stream", (remoteStream) => {
      if (peerAudioRef.current) {
        peerAudioRef.current.srcObject = remoteStream;
      }
      if (peerVideoRef.current) {
        peerVideoRef.current.srcObject = remoteStream;
      }
    });
  
    socket.off("callAccepted");
    socket.on("callAccepted", (signalData) => {
      peer.signal(signalData);
      setCallAccepted(true);
    });
  
    connectionRef.current = peer;
};

  
  

useEffect(() => {
  socket.on("incomingCall", ({ from, signalData }) => {
    setReceivingCall(true);
    setCaller(from);
    setCallerSignal(signalData);
  });

  socket.on("callEnded", () => {
    endCall();
  });

  return () => {
    socket.off("incomingCall");
    socket.off("callEnded");
  };
}, []);

// Accept Call
const acceptCall = () => {
  setCallAccepted(true);
  const peer = new Peer({ initiator: false, trickle: false, stream: videoStream });

  peer.on("signal", (signalData) => {
    socket.emit("acceptCall", { to: caller, signalData });
  });

  peer.on("stream", (remoteStream) => {
    if (peerAudioRef.current) {
      peerAudioRef.current.srcObject = remoteStream;
    }
    if (peerVideoRef.current) {
      peerVideoRef.current.srcObject = remoteStream;
    }
  });

  peer.on("error", (err) => {
    console.error("Peer connection error:", err);
    endCall(); // Optionally end the call if there is an error
  });

  peer.signal(callerSignal);
  connectionRef.current = peer;
};

// End Call
const endCall = () => {
  setCallEnded(true);

  if (connectionRef.current) {
    connectionRef.current.destroy(); // Properly close WebRTC connection
    connectionRef.current = null;
  }

  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop()); // Stop video & audio
  }

  socket.emit("endCall", { to: caller || selectedUser?._id });

  setCallAccepted(false);
  setReceivingCall(false);
  setCaller("");
  setCallerSignal(null);
};

  
return (
  <div className="flex h-screen bg-gray-100 text-gray-900 ml-64">
    {!user ? (
      <p className="text-center text-gray-900">Loading chat...</p>
    ) : (
      <>
        {/* Sidebar - User List */}
        <div className="w-1/3 border-r border-gray-300 p-4 bg-white">
          <h2 className="text-xl font-bold mb-4">Users</h2>
          {users.length > 0 ? (
            users.map((u) => (
              <div
                key={u._id}
                className={`p-2 cursor-pointer rounded-lg flex items-center space-x-4 relative ${
                  selectedUser?._id === u._id ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                }`}
                onClick={() => setSelectedUser(u)}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${u.name}&background=random&rounded=true`}
                  alt={`${u.name}'s avatar`}
                  className="w-10 h-10 rounded-full"
                />
                <span>{u.name}</span>

                {/* ✅ Video Call Button */}
                <button
                  onClick={() => callUser(u._id)}
                  className="ml-auto bg-green-500 text-white px-2 py-1 rounded"
                >
                  🎥 Video Call
                </button>

                {/* ✅ Show unread message dot */}
                {unreadMessages[u._id] && (
                  <span className="absolute right-2 top-2 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400">No users available</p>
          )}
        </div>

        {/* Chat & Video Area */}
        <div className="w-2/3 p-4 flex flex-col bg-gray-100">
          {selectedUser ? (
            <>
              <h2 className="text-xl font-bold mb-2">Chat with {selectedUser.name}</h2>

              {/* ✅ Video Call UI */}
              {callAccepted && (
                <div className="flex justify-center items-center bg-black p-4 rounded-lg">
                  <div className="mr-4">
                    <p className="text-white">📷 You</p>
                    <video ref={myVideoRef} autoPlay playsInline className="w-40 h-40 border border-white rounded-lg" />
                  </div>
                  <div>
                    <p className="text-white">🎥 {selectedUser?.name}</p>
                    <video ref={peerVideoRef} autoPlay playsInline className="w-40 h-40 border border-white rounded-lg" />
                  </div>
                </div>
              )}

              {/* ✅ Incoming Call Notification */}
              {receivingCall && !callAccepted && (
                <div className="p-4 bg-yellow-200 text-gray-900 rounded-lg flex justify-between items-center">
                  <p>📞 Incoming video call from {caller}</p>
                  <button onClick={acceptCall} className="bg-blue-500 text-white px-3 py-1 rounded">
                    Accept
                  </button>
                </div>
              )}

              {/* ✅ End Call Button (only if call is active) */}
              {callAccepted && (
                <button
                  onClick={endCall}
                  className="mt-2 bg-red-500 text-white px-3 py-2 rounded-lg"
                >
                  🔴 End Call
                </button>
              )}

              {/* Message Input */}
              <div className="flex-1 overflow-y-auto p-4 bg-white rounded-lg shadow">
                {Object.keys(groupedMessages).map((date) => (
                  <div key={date}>
                    {/* ✅ Display Date Header */}
                    <div className="text-center text-gray-500 text-sm my-2">
                      {moment(date).calendar(null, {
                        sameDay: "[Today]",
                        lastDay: "[Yesterday]",
                        lastWeek: "dddd",
                        sameElse: "MMMM D, YYYY",
                      })}
                    </div>

                    {groupedMessages[date].map((msg, index) => (
                      <div
                        key={index}
                        className={`p-2 my-2 rounded-lg max-w-[60%] ${
                          msg.sender === user._id ? "bg-blue-500 text-white ml-auto" : "bg-gray-300"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <span className="block text-xs text-gray-600 text-right">
                          {moment(msg.createdAt).format("hh:mm A")}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Field */}
              <div className="mt-4 flex items-center">
                <input
                  type="text"
                  className="flex-1 p-2 rounded-lg bg-white border border-gray-300 text-gray-900"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </div>

              {/* ✅ Video & Audio Elements for Calls */}
              <video ref={myVideoRef} autoPlay playsInline className="hidden" />
              <video ref={peerVideoRef} autoPlay playsInline className="hidden" />
              <audio ref={myAudioRef} autoPlay playsInline />
              <audio ref={peerAudioRef} autoPlay playsInline />
            </>
          ) : (
            <p className="text-gray-400 text-center">Select a user to start chatting.</p>
          )}
        </div>
      </>
    )}
  </div>
);

  
};

export default Chat;