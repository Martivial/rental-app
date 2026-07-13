<template>
  <div v-show="isVisible" class="fixed bottom-4 right-4 w-96 h-[600px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[10020] flex flex-col overflow-hidden">
    
    <div class="p-4 border-b flex justify-between items-center bg-white flex-shrink-0">
      <span class="text-sm font-bold text-slate-800 truncate">
        {{ activeChat ? activeChat.other_user_name : 'Twoje wiadomości' }}
      </span>
      <div class="flex gap-2">
        <button v-if="activeChat" @click="closeChat" class="text-slate-500 hover:text-slate-800"><ArrowLeft :size="18"/></button>
        <button @click="$emit('close')" class="text-slate-500 hover:text-slate-800"><X :size="18"/></button>
      </div>
    </div>
    
    <div v-if="!activeChat" class="flex-1 overflow-y-auto bg-slate-50">
      <div v-for="chat in conversations" :key="chat.id" @click="selectChat(chat)" class="p-4 border-b hover:bg-white cursor-pointer flex items-center gap-3 transition">
        <div class="w-12 h-12 flex-shrink-0 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
          <img v-if="chat.items?.image_path" :src="getImageUrl(chat.items.image_path)" class="w-full h-full object-cover" />
          <Hammer v-else class="text-slate-400" :size="20" />
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-sm font-bold text-slate-800 truncate">{{ chat.items?.name || 'Przedmiot' }}</span>
          <span class="text-[11px] text-slate-500 truncate">Rozmowa z: {{ chat.other_user_name }}</span>
        </div>
        <div v-if="chat.unreadCount > 0" class="ml-auto bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">
          {{ chat.unreadCount }}
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col min-h-0 bg-slate-50">
      <div class="p-3 border-b bg-white flex gap-3 items-center flex-shrink-0">
        <div class="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
           <img v-if="activeChat.items?.image_path" :src="getImageUrl(activeChat.items.image_path)" class="w-full h-full object-cover" />
           <Hammer v-else class="text-slate-400" :size="18" />
        </div>
        <span class="text-xs font-bold text-slate-800 truncate">{{ activeChat.items?.name }}</span>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" ref="messagesContainer">
        <div v-for="msg in messages" :key="msg.id" :class="['flex flex-col max-w-[85%]', msg.sender_id === userId ? 'items-end ml-auto' : 'items-start mr-auto']">
          <div :class="['text-sm p-3 rounded-2xl shadow-sm', msg.sender_id === userId ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none']">
            {{ msg.content }}
          </div>
        </div>
      </div>
      
      <div class="p-3 border-t flex gap-2 bg-white flex-shrink-0 items-center">
        <input v-model="newMessage" class="flex-1 bg-slate-100 text-sm p-3 rounded-xl outline-none min-w-0" placeholder="Napisz..." @keyup.enter="send" :disabled="isSending" />
        <button @click="send" :disabled="isSending" class="bg-blue-600 text-white px-4 h-[44px] rounded-xl font-bold text-sm hover:bg-blue-700 transition flex-shrink-0">
          Wyślij
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick, onMounted } from 'vue'
import { X, ArrowLeft, Hammer } from 'lucide-vue-next'

const props = defineProps(['userId', 'isVisible'])
const emit = defineEmits(['close', 'open-item'])
const client = useSupabaseClient()

const activeChat = ref(null)
const conversations = ref([])
const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)
let channel = null
const tempItem = ref(null)

const getImageUrl = (path) => {
  if (!path) return null
  const { data } = client.storage.from('items').getPublicUrl(path)
  return data.publicUrl
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

const fetchConversations = async () => {
  const { data } = await client.from('conversations')
    .select(`
      id, item_id, user1_id, user2_id, 
      items (name, image_path), 
      messages (is_read, sender_id), 
      p1:profiles!conversations_user1_id_fkey(name), 
      p2:profiles!conversations_user2_id_fkey(name)
    `)
    .or(`user1_id.eq.${props.userId},user2_id.eq.${props.userId}`);
  
  if (data) {
    conversations.value = data.map(c => {

      const isUser1 = c.user1_id === props.userId;
      const otherUser = isUser1 ? c.p2 : c.p1;
      
      return {
        ...c,
        unreadCount: c.messages.filter(m => m.sender_id !== props.userId && !m.is_read).length,
        other_user_name: otherUser?.name || 'Użytkownik'
      };
    });
  }
};

const selectChat = async (chat) => {
  activeChat.value = chat
  tempItem.value = null
  const { data } = await client.from('messages').select(`*`).eq('conversation_id', chat.id).order('created_at', { ascending: true })
  messages.value = data || []
  await client.from('messages').update({ is_read: true }).eq('conversation_id', chat.id).neq('sender_id', props.userId)
  chat.unreadCount = 0
  scrollToBottom()
  setupRealtime(chat)
}

const setupRealtime = (chat) => {
  if (channel) client.removeChannel(channel)
  channel = client.channel('chat-' + chat.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${chat.id}` }, (payload) => {
    messages.value.push(payload.new)
    if (payload.new.sender_id !== props.userId) {
      client.from('messages').update({ is_read: true }).eq('id', payload.new.id)
      scrollToBottom()
    }
  }).subscribe()
}

const send = async () => {
  if (!newMessage.value.trim()) return
  let targetChatId = activeChat.value?.id
  if (tempItem.value && !targetChatId) {
    const { data: newConv } = await client.from('conversations').insert({ item_id: tempItem.value.id, user1_id: props.userId, user2_id: tempItem.value.user_id }).select('id').single()
    targetChatId = newConv.id
  }
  const text = newMessage.value
  newMessage.value = ''
  await client.from('messages').insert({ conversation_id: targetChatId, sender_id: props.userId, content: text })
  if (tempItem.value) {
    tempItem.value = null
    fetchConversations()
    const { data: existing } = await client.from('conversations').select('*, items(name, image_path), p1:profiles!conversations_user1_id_fkey(name), p2:profiles!conversations_user2_id_fkey(name)').eq('id', targetChatId).single()
    selectChat({...existing, other_user_name: existing.user1_id === props.userId ? existing.p2?.name : existing.p1?.name})
  }
}

const closeChat = () => {
  activeChat.value = null
  tempItem.value = null
  fetchConversations()
}

defineExpose({ findOrCreateConversation: async (item) => {
  const { data: existing } = await client.from('conversations').select('*, items(name, image_path), p1:profiles!conversations_user1_id_fkey(name), p2:profiles!conversations_user2_id_fkey(name)').eq('item_id', item.id).or(`and(user1_id.eq.${props.userId},user2_id.eq.${item.user_id}),and(user1_id.eq.${item.user_id},user2_id.eq.${props.userId})`).maybeSingle()
  if (existing) {
    selectChat({ ...existing, other_user_name: existing.user1_id === props.userId ? (existing.p2?.name || 'Użytkownik') : (existing.p1?.name || 'Użytkownik') })
  } else {
    tempItem.value = item
    activeChat.value = { items: item, other_user_name: 'Nowa wiadomość', item_id: item.id }
    messages.value = []
  }
}})

onMounted(() => {
  fetchConversations()
  client.channel('convs').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchConversations()).subscribe()
})

onUnmounted(() => { if (channel) client.removeChannel(channel) })
</script>

<style scoped>
.overflow-y-auto { scroll-behavior: smooth; }
</style>