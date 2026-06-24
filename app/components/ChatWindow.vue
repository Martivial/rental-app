<template>
  <div class="fixed bottom-4 right-4 w-80 h-[400px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[10020] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
    <div class="p-3 border-b flex justify-between items-center bg-slate-50">
      <span class="text-sm font-bold truncate">{{ activeChat ? (activeChat.items?.name || 'Rozmowa') : 'Twoje rozmowy' }}</span>
      <div class="flex gap-2">
        <button v-if="activeChat" @click="activeChat = null"><ArrowLeft :size="16"/></button>
        <button @click="$emit('close')"><X :size="16"/></button>
      </div>
    </div>
    
    <div v-if="!activeChat" class="flex-1 overflow-y-auto">
      <div v-for="chat in conversations" :key="chat.id" @click="selectChat(chat)" class="p-4 border-b hover:bg-slate-50 cursor-pointer flex justify-between items-center transition">
        <span class="text-sm font-bold text-slate-800">{{ chat.items?.name || 'Przedmiot usunięty' }}</span>
        <div v-if="chat.hasNew" class="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col h-full overflow-hidden">
      <div class="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
        <div v-for="msg in messages" :key="msg.id" :class="['flex flex-col max-w-[85%]', msg.sender_id === userId ? 'items-end ml-auto' : 'items-start']">
          <div :class="['text-[11px] p-2 rounded-lg', msg.sender_id === userId ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-700']">
            {{ msg.content }}
          </div>
          <span class="text-[9px] text-slate-400 mt-0.5 px-1">{{ new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>
      </div>
      <div class="p-2 border-t flex gap-1 bg-white">
        <input v-model="newMessage" class="flex-1 bg-slate-100 text-xs p-2 rounded-xl outline-none" placeholder="Napisz..." @keyup.enter="send" />
        <button @click="send" class="bg-green-600 text-white px-3 rounded-xl font-bold text-xs">Wyślij</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { X, ArrowLeft } from 'lucide-vue-next'
const props = defineProps(['userId'])
const emit = defineEmits(['close'])
const client = useSupabaseClient()
const activeChat = ref(null)
const conversations = ref([])
const messages = ref([])
const newMessage = ref('')
let channel = null

const fetchConversations = async () => {
  const { data } = await client.from('conversations').select('id, items(name)').or(`user1_id.eq.${props.userId},user2_id.eq.${props.userId}`)
  conversations.value = (data || []).map(c => ({ ...c, hasNew: false }))
}

const selectChat = async (chat) => {
  activeChat.value = chat
  chat.hasNew = false
  const { data } = await client.from('messages').select('*').eq('conversation_id', chat.id).order('created_at', { ascending: true })
  messages.value = data || []
  if (channel) client.removeChannel(channel)
  channel = client.channel('realtime:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${chat.id}` }, (payload) => {
    messages.value.push(payload.new)
    if (payload.new.sender_id !== props.userId) chat.hasNew = true
  }).subscribe()
}

const findOrCreateConversation = async (item) => {
  if (!item?.id || !item?.user_id) return
  const { data: existing } = await client.from('conversations').select('id, items(name)').eq('item_id', item.id).or(`user1_id.eq.${props.userId},user2_id.eq.${props.userId}`).maybeSingle()
  if (existing) selectChat(existing)
  else {
    const { data: newConv } = await client.from('conversations').insert({ item_id: item.id, user1_id: props.userId, user2_id: item.user_id }).select('id, items(name)').single()
    if (newConv) { conversations.value.push(newConv); selectChat(newConv) }
  }
}

const send = async () => {
  if (!newMessage.value.trim()) return
  await client.from('messages').insert({ conversation_id: activeChat.value.id, sender_id: props.userId, content: newMessage.value })
  newMessage.value = ''
}
defineExpose({ findOrCreateConversation })
onMounted(() => fetchConversations())
onUnmounted(() => { if (channel) client.removeChannel(channel) })
</script>