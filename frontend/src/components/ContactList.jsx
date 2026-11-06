import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UserLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      {allContacts.map((contact) => (
        <div
          key={contact._id ?? contact.id}
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`avatar ${
                onlineUsers.includes(String(contact.id)) ? "online" : "offline"
              }`}
            >
              <div className="size-12 rounded-full">
                <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} onError={(e) => { e.currentTarget.src = "/avatar.png"; }} />
              </div>
            </div>
            <div className="min-w-0">
              <h4 className="text-slate-200 font-medium truncate">{contact.fullName}</h4>
              <p className="text-slate-400 text-xs">{onlineUsers.includes(String(contact.id)) ? "Online" : "Offline"}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default ContactList;
