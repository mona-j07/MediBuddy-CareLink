/* =========================================================
   MediBuddy CareLink – Message Management
   ========================================================= */

const MessageService = (function () {

  let messages = [];

  async function fetchMessages() {
    try {
      // In production: const response = await api.get('/messages');
      // messages = await response.json();
      render();
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  }

  function render() {
    const container = document.getElementById('message-list');
    if (!container) return;

    if (messages.length === 0) {
      container.innerHTML = '<div class="no-doctors">No messages logged yet.</div>';
      return;
    }

    container.innerHTML = messages.map(msg => `
      <div class="medicine-card">
        <div class="mc-icon">💬</div>
        <div class="mc-info">
          <div class="mc-name">${msg.receiver}</div>
          <div class="mc-sub">${msg.message_text}</div>
          <div class="mc-tags">
            <span class="mc-tag">${new Date(msg.created_at).toLocaleString()}</span>
          </div>
        </div>
        <div class="mc-actions">
           <button class="delete-btn" onclick="MessageService.deleteMessage('${msg.id}')">🗑️ Delete</button>
        </div>
      </div>
    `).join('');
  }

  async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message log?')) return;
    try {
      // API call: await api.delete(`/messages/${id}`);
      messages = messages.filter(m => m.id != id);
      render();
      showToast('Message record deleted.', 'success');
    } catch (err) {
      showToast('Failed to delete message.', 'danger');
    }
  }

  function logNewMessage(receiver, text) {
    const newMsg = {
      id: Date.now(),
      receiver,
      message_text: text,
      created_at: new Date().toISOString()
    };
    messages.unshift(newMsg);
    render();
  }

  return { fetchMessages, render, deleteMessage, logNewMessage };
})();
