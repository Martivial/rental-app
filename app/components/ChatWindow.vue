<template>
<div v-show="isVisible" class="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 w-full sm:w-[390px] h-full sm:h-[620px] bg-white sm:rounded-2xl shadow-2xl border border-slate-300 z-[10020] flex flex-col overflow-hidden">
  <header class="h-16 border-b flex items-center justify-between px-4 bg-white flex-shrink-0">
    <div class="flex items-center gap-2 min-w-0">
      <button v-if="activeChat" @click="closeChat" class="text-slate-500 hover:text-slate-800">
        <ArrowLeft :size="19"/>
      </button>
      <div class="min-w-0">
        <p class="font-bold text-sm text-slate-800 truncate">
        {{ activeChat ? 'Wiadomości' : 'Konwersacje' }}
        </p>
       
      </div>
    </div>
    <button @click="$emit('close')" class="text-slate-400 hover:text-slate-800">
      <X :size="19"/>
    </button>
  </header>


  <!-- LISTA ROZMÓW -->
  <section v-if="!activeChat" class="flex-1 overflow-y-auto bg-slate-50">
    <div v-if="!conversations.length" class="h-full flex items-center justify-center text-sm text-slate-400">
      Brak rozmów
    </div>

   <div v-for="chat in conversations" :key="chat.id"
  @click="openConversation(chat)"
  class="flex items-center gap-3 p-4 bg-white border-b hover:bg-slate-50 transition-colors cursor-pointer">

  <!-- ZDJĘCIE Z BADGIEM POWIADOMIENIA W ROGU -->
  <div class="relative shrink-0">
    <div class="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100">
      <img v-if="chat.items?.image_path"
        :src="getImageUrl(chat.items.image_path)"
        class="w-full h-full object-cover">
      <Hammer v-else :size="22" class="text-slate-300"/>
    </div>

    <!-- Czerwona kropka z licznikiem zawieszona w prawym górnym rogu zdjęcia -->
    <span v-if="chat.unread_count > 0" 
      class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md ring-2 ring-white">
      {{ chat.unread_count }}
    </span>
  </div>

  <!-- GŁÓWNA TREŚĆ (teraz ładnie w jednej linii po prawej stronie) -->
  <div class="flex-1 min-w-0">
    
    <!-- Górny wiersz: Nazwa przedmiotu + Data -->
    <div class="flex items-center justify-between gap-2 mb-1">
      <p :class="['font-bold text-sm truncate', chat.unread_count > 0 ? 'text-slate-900 font-extrabold' : 'text-slate-800']">
        {{ chat.items?.name || 'Przedmiot' }}
      </p>
      <span class="text-[11px] text-slate-400 shrink-0">
        {{ formatDate(chat.created_at) }}
      </span>
    </div>

    <!-- Dolny wiersz: Rozmówca -->
    <p :class="['text-xs truncate', chat.unread_count > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500']">
      {{ chat.other_user_name }}
    </p>

  </div>
</div>
  </section>

  <section v-else class="flex-1 flex flex-col min-h-0 bg-slate-50">

    <div class="p-3 bg-white border-b flex gap-3 items-center">
      <div class="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
        <img v-if="activeChat.items?.image_path"
          :src="getImageUrl(activeChat.items.image_path)"
          class="w-full h-full object-cover">
        <Hammer v-else :size="18" class="text-slate-300"/>
      </div>

      <div class="min-w-0">
        <p class="font-bold text-xs text-slate-800 truncate">
          {{ activeChat.items?.name }}
        </p>
        <p class="text-[11px] text-slate-400">
          {{ activeChat.other_user_name }}
        </p>
      </div>
    </div>

    <!-- WIADOMOŚCI -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-if="loadingMessages" class="text-center text-xs text-slate-400">
        Ładowanie...
      </div>

      <div v-for="msg in messages" :key="msg.id" :class="msg.sender_id === userId ? 'flex justify-start' : 'flex justify-end'">

        
        <div :class="[
          'max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm',
          msg.sender_id === userId
          ? 'bg-green-600 text-white rounded-bl-none'
          : 'bg-white border text-slate-800 rounded-br-none'
        ]"> <p>{{ msg.content }}</p>

          <span :class="[
            'block text-[10px] mt-1',
            msg.sender_id === userId
            ? 'text-green-100'
            : 'text-slate-400'
          ]">{{ formatDate(msg.created_at) }}
          </span>
          
        </div>
      </div>
    </div>

    <!-- INPUT -->
    <div class="p-3 bg-white border-t flex gap-2">
      <input
        v-model="newMessage"
        @keyup.enter="send"
        placeholder="Napisz wiadomość..."
        class="flex-1 bg-slate-100 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-green-500"
      >
      <button
        @click="send"
        :disabled="isSending"
        class="px-4 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50">
        Wyślij
      </button>
    </div>
  </section>

</div>
</template>
<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { X, ArrowLeft, Hammer } from 'lucide-vue-next'

const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  isVisible: {
    type: Boolean,
    default: false
  },
  initialConversations: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'messages-read'])
const client = useSupabaseClient()

const conversations = ref(props.initialConversations)
const activeChat = ref(null)
const messages = ref([])
const newMessage = ref('')
const loadingMessages = ref(false)
const isSending = ref(false)
const messagesContainer = ref(null)
let channel = null
let tempItem = null

watch(() => props.initialConversations, (newList) => {
  conversations.value = newList
}, { immediate: true })

const getImageUrl = path => {
  if (!path) return null
  return client.storage.from('items').getPublicUrl(path).data.publicUrl
}

const formatDate = date => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

const scrollBottom = async () => {
  await nextTick()
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

const openConversation = async (chat) => {

  if(!props.userId) {
    alert("Trwa ładowanie wiadomości, odczekaj chwile")
    return;
  }

  chat.unread_count = 0

  activeChat.value = chat
  loadingMessages.value = true

  const { data } = await client.from('messages').select('*').eq('conversation_id', chat.id).order('created_at', { ascending: true })
  messages.value = data || []
  loadingMessages.value = false

  await scrollBottom()
  markRead(chat.id) // Optymalizacja: Nie czekamy na odczyt (await), niech działa w tle
  subscribe(chat.id)

  emit('messages-read', chat.id)
}

const subscribe = id => {
  if (channel) client.removeChannel(channel)

  channel = client.channel('chat-' + id).on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${id}`
  }, payload => {
    // Zapobiegamy duplikowaniu własnych wiadomości, które już dopisaliśmy lokalnie
    if (!messages.value.find(m => m.id === payload.new.id)) {
      messages.value.push(payload.new)
      scrollBottom()
    }
  }).subscribe()
}

const send = async () => {
  if(!props.userId) {
    alert("Trwa ładowanie sesji, spróbuj ponownie za chwilę")
    return;
  }
  if (!newMessage.value.trim() || isSending.value) return

  const text = newMessage.value.trim()
  newMessage.value = ''
  isSending.value = true

  try {
    let conversationId = activeChat.value?.id

    // Jeśli to nowa rozmowa, musimy ją najpierw utworzyć w bazie
    if (tempItem && !conversationId) {
      const { data, error } = await client.from('conversations').insert({
        item_id: tempItem.id,
        user1_id: props.userId,
        user2_id: tempItem.user_id
      }).select('id').single()

      if (error) throw error
      conversationId = data.id
      activeChat.value.id = conversationId
      tempItem = null
      await loadConversations()
    }

    // Natychmiastowy podgląd lokalny (Optimistic Update)
    const tempId = crypto.randomUUID()
    const temp = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: props.userId,
      content: text,
      created_at: new Date().toISOString()
    }

    messages.value.push(temp)
    scrollBottom()

    // Wysyłamy do bazy w tle (bez czekania na skomplikowane selecty)
    const { error } = await client.from('messages').insert({
      id: tempId, // Wymuszenie naszego ID eliminuje problem duplikatów przy websocketach
      conversation_id: conversationId,
      sender_id: props.userId,
      content: text
    })

    if (error) throw error

  } catch (e) {
    console.error(e)
    alert('Nie udało się wysłać wiadomości')
  } finally {
    isSending.value = false
  }
}

const markRead = async (id) => {
  await client.from('messages')
    .update({ is_read: true })
    .eq('conversation_id', id)
    .neq('sender_id', props.userId)
}

const closeChat = () => {
  activeChat.value = null
  messages.value = []
  tempItem = null
  if (channel) {
    client.removeChannel(channel)
    channel = null
  }
}

const findOrCreateConversation = async (item) => {
  const { data } = await client.from('conversations')
    .select(`
      *,
      items(id, name, image_path),
      p1:profiles!conversations_user1_id_fkey(name),
      p2:profiles!conversations_user2_id_fkey(name)
    `)
    .eq('item_id', item.id)
    .or(`and(user1_id.eq.${props.userId},user2_id.eq.${item.user_id}),and(user1_id.eq.${item.user_id},user2_id.eq.${props.userId})`)
    .maybeSingle()

  if (data) {
    openConversation({
      ...data,
      other_user_name: data.user1_id === props.userId ? (data.p2?.name || 'Użytkownik') : (data.p1?.name || 'Użytkownik')
    })
  } else {
    tempItem = item
    activeChat.value = {
      items: item,
      other_user_name: item.profiles?.name || 'Nowa wiadomość',
      item_id: item.id
    }
    messages.value = []
  }
}

onUnmounted(() => {
  if (channel) client.removeChannel(channel)
})

defineExpose({ findOrCreateConversation })
</script>