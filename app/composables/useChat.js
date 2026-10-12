import { ref, computed } from 'vue'

export function useChat() {
  const client = useSupabaseClient()
  
  const conversationsList = ref([])
  const showChat = ref(false)
  let globalChannel = null

  // Pobieranie konwersacji użytkownika wraz z wiadomościami i profilami
  async function loadConversations(userId) {
    if (!userId) return

    const { data, error } = await client.from('conversations').select(`
      id, created_at, user1_id, user2_id, item_id,
      items(id, name, image_path),
      p1:profiles!conversations_user1_id_fkey(name),
      p2:profiles!conversations_user2_id_fkey(name),
      messages(id, is_read, sender_id)
    `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Błąd pobierania konwersacji", error)
      return
    }

    conversationsList.value = (data || []).map(c => ({
      ...c,
      other_user_name: c.user1_id === userId
        ? (c.p2?.name || 'Użytkownik')
        : (c.p1?.name || 'Użytkownik'),
      unread_count: c.messages ? c.messages.filter(m => !m.is_read && m.sender_id !== userId).length : 0
    }))
  }

  // Łączna liczba nieprzeczytanych wiadomości (do powiadomienia w menu)
  const totalUnread = computed(() => {
    return conversationsList.value.reduce((sum, chat) => sum + (chat.unread_count || 0), 0)
  })

  // Oznaczanie wiadomości jako przeczytane
  function handleMessagesRead(conversationId) {
    const chat = conversationsList.value.find(c => c.id === conversationId)
    if (chat) {
      chat.unread_count = 0
    }
  }

  // Nasłuchiwanie nowych wiadomości w czasie rzeczywistym (Supabase Realtime)
  function initGlobalNotifications(userId) {
    if (globalChannel) {
      client.removeChannel(globalChannel)
      globalChannel = null
    }

    globalChannel = client.channel('global-notifications').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, (payload) => {
      const newMessage = payload.new

      if (newMessage.sender_id !== userId) {
        const chat = conversationsList.value.find(c => c.id === newMessage.conversationId)

        if (chat) {
          chat.unread_count = (chat.unread_count || 0) + 1
        } else {
          loadConversations(userId)
        }
      }
    }).subscribe()
  }

  // Czyszczenie kanału przy wylogowaniu
  function cleanupChat() {
    conversationsList.value = []
    showChat.value = false
    if (globalChannel) {
      client.removeChannel(globalChannel)
      globalChannel = null
    }
  }

  return {
    conversationsList,
    showChat,
    totalUnread,
    loadConversations,
    handleMessagesRead,
    initGlobalNotifications,
    cleanupChat
  }
}