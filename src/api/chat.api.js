import { http } from "./http";

export const chatApi = {
  // recipientId ile conversation oluştur/bul
  findOrCreateConversation: async (recipientId) => {
    const res = await http.post("http://localhost:8080/api/chat/conversations", { recipientId });
    return res.data; // { conversationId }
  },

  // mesaj geçmişi
  getMessages: async (conversationId) => {
    const res = await http.get(`http://localhost:8080/api/chat/conversations/${conversationId}/messages`);
    return res.data; // MessageResponse[]
  },
};
