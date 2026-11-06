import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, selectedUser, receiveMessage, getMyChatPartners, getMessagesByUserId, reset } = useChatStore();
  const socket = useAuthStore((state) => state.socket);
  useEffect(() => {
    if (!socket) return;
    const onConnect = () => {
      getMyChatPartners();
      const user = useChatStore.getState().selectedUser;
      if (user) getMessagesByUserId(user.id);
    };
    socket.on("newMessage", receiveMessage);
    socket.on("connect", onConnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off("newMessage", receiveMessage);
      socket.off("connect", onConnect);
    };
  }, [socket, receiveMessage, getMyChatPartners, getMessagesByUserId]);
  useEffect(() => () => reset(), [reset]);

  return (
    <div className="relative w-full max-w-6xl h-[calc(100dvh-2rem)] max-h-[800px]">
      <BorderAnimatedContainer>
        <div className={`${selectedUser ? "hidden md:flex" : "flex"} w-full md:w-80 bg-slate-800/50 backdrop-blur-sm flex-col`}>
          <ProfileHeader />
          <ActiveTabSwitch />
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>
        <div className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1 flex-col bg-slate-900/50 backdrop-blur-sm min-w-0`}>
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}
export default ChatPage;
