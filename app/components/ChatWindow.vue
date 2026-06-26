<template>
  <div v-show="isVisible" class="fixed bottom-4 right-4 w-80 h-[450px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[10020] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
    <div class="p-3 border-b flex justify-between items-center bg-slate-50">
      <span class="text-sm font-bold truncate">
        {{ activeChat ? (activeChat.items?.name || 'Rozmowa') : 'Twoje wiadomości' }}
      </span>
      <div class="flex gap-2">
        <button v-if="activeChat" @click="activeChat = null"><ArrowLeft :size="16"/></button>
        <button @click="$emit('close')"><X :size="16"/></button>
      </div>
    </div>
    
    <div v-if="!activeChat" class="flex-1 overflow-y-auto">
      <div v-for="chat in conversations" :key="chat.id" @click="selectChat(chat)" class="p-4 border-b hover:bg-slate-50 cursor-pointer flex justify-between items-center transition">
        <span class="text-sm font-bold text-slate-800 truncate mr-2">{{ chat.items?.name || 'Przedmiot' }}</span>
        <div v-if="chat.unreadCount > 0" class="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
          {{ chat.unreadCount }}
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
        <div v-for="msg in messages" :key="msg.id" :class="['flex flex-col max-w-[85%]', msg.sender_id === userId ? 'items-start mr-auto' : 'items-end ml-auto']">
          <span class="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
            {{ msg.sender_id === userId ? 'Ty' : (msg.profiles?.name || '') + ' ' + (msg.profiles?.surname || 'Użytkownik') }}
          </span>
          <div :class="['text-sm p-3 rounded-2xl shadow-sm', msg.sender_id === userId ? 'bg-green-500 text-white rounded-bl-none' : 'bg-white border border-slate-200 text-slate-800 rounded-br-none']">
            {{ msg.content }}
          </div>
          <span class="text-[9px] text-slate-400 mt-1 px-1">
            {{ new Date(msg.created_at).toLocaleDateString() }} {{ new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </div>
      </div>
      
      <div class="p-2 border-t flex gap-1 bg-white">
        <input v-model="newMessage" class="flex-1 bg-slate-100 text-xs p-2 rounded-xl outline-none" placeholder="Napisz wiadomość..." @keyup.enter="send" />
        <button @click="send" class="bg-green-600 text-white px-3 rounded-xl font-bold text-xs hover:bg-green-700 transition">Wyślij</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick, defineEmits } from 'vue'
import { X, ArrowLeft } from 'lucide-vue-next'

const props = defineProps(['userId', 'isVisible'])
const emit = defineEmits(['close'])
const client = useSupabaseClient()

const activeChat = ref(null)
const conversations = ref([])
const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)
let channel = null

// Przewijanie na dół
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(messages, () => scrollToBottom(), { deep: true })

const fetchConversations = async () => {
  if (!props.userId || props.userId === 'undefined') return

  const { data } = await client
    .from('conversations')
    .select(`id, item_id, items (name), messages (id, is_read, sender_id)`)
    .or(`user1_id.eq.${props.userId},user2_id.eq.${props.userId}`)
    .not('messages', 'is', null)

  if (!data) return

  conversations.value = data.map(c => ({ 
    ...c, 
    unreadCount: c.messages.filter(m => m.sender_id !== props.userId && !m.is_read).length 
  }))
}

const selectChat = async (chat) => {
  activeChat.value = chat
  
  const { data } = await client
    .from('messages')
    .select(`*, profiles (name, surname)`)
    .eq('conversation_id', chat.id)
    .order('created_at', { ascending: true })
    
  messages.value = data || []
  chat.unreadCount = 0

  await client.from('messages').update({ is_read: true }).eq('conversation_id', chat.id).neq('sender_id', props.userId)
  setupRealtime(chat)
  scrollToBottom()
}

const setupRealtime = (chat) => {
  if (channel) client.removeChannel(channel)
  channel = client.channel('messages').on('postgres_changes', { 
    event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${chat.id}` 
  }, (payload) => {
    messages.value.push(payload.new)
    if (payload.new.sender_id !== props.userId) {
       client.from('messages').update({ is_read: true }).eq('id', payload.new.id)
    }
  }).subscribe()
}

const send = async () => {
  if (!newMessage.value.trim() || !activeChat.value) return
  const text = newMessage.value
  newMessage.value = ''
  await client.from('messages').insert({ conversation_id: activeChat.value.id, sender_id: props.userId, content: text })
  fetchConversations()
}

defineExpose({ findOrCreateConversation: async (item) => {
  const { data: existing } = await client.from('conversations').select('id, items(name)').eq('item_id', item.id).or(`user1_id.eq.${props.userId},user2_id.eq.${props.userId}`).maybeSingle()
  if (existing) selectChat(existing)
  else {
    const { data: newConv } = await client.from('conversations').insert({ item_id: item.id, user1_id: props.userId, user2_id: item.user_id }).select('id, items(name)').single()
    if (newConv) selectChat({ ...newConv, unreadCount: 0 })
  }
}})

watch(() => props.userId, (newId) => { if (newId) fetchConversations() }, { immediate: true })
onUnmounted(() => { if (channel) client.removeChannel(channel) })
</script>

<style scoped>
.overflow-y-auto {
  scroll-behavior: smooth;
}
</style>