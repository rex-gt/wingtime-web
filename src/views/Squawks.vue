<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1>Aircraft Squawks</h1>
        <p>Report and track aircraft maintenance issues</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        + Report Squawk
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-card">
      <div class="form-row">
        <div class="form-group">
          <label>Filter by Aircraft</label>
          <select v-model="filters.aircraft_id" @change="loadSquawks">
            <option :value="undefined">All Aircraft</option>
            <option v-for="a in aircraft" :key="a.id" :value="a.id">
              {{ a.tail_number }} - {{ a.make }} {{ a.model }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Filter by Status</label>
          <select v-model="filters.status" @change="loadSquawks">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Squawks Table -->
    <div class="table-container desktop-only">
      <table>
        <thead>
          <tr>
            <th>Aircraft</th>
            <th>Observed</th>
            <th>Severity</th>
            <th>Description</th>
            <th>Status</th>
            <th>Reported By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="squawk in squawks" :key="squawk.id">
            <td><strong>{{ squawk.tail_number }}</strong></td>
            <td>{{ formatDate(squawk.observed_date) }}</td>
            <td>
              <span class="severity-badge" :class="`severity-${squawk.severity.toLowerCase().replace(' ', '-')}`">
                {{ squawk.severity }}
              </span>
            </td>
            <td>
              <div class="description-preview">{{ squawk.description }}</div>
            </td>
            <td>
              <span class="status-badge" :class="`status-${squawk.status}`">
                {{ squawk.status }}
              </span>
            </td>
            <td>{{ squawk.creator_name }}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-small btn-secondary" @click="viewDetail(squawk)">Details</button>
                <button v-if="squawk.status === 'open' && (authStore.isAdmin || authStore.isOperator)" 
                        class="btn-small btn-success" @click="closeSquawk(squawk.id)">Close</button>
              </div>
            </td>
          </tr>
          <tr v-if="squawks.length === 0">
            <td colspan="7" class="no-data">No squawks found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile View -->
    <div class="mobile-only squawks-mobile-list">
      <div v-if="squawks.length > 0">
        <div v-for="squawk in squawks" :key="squawk.id" class="squawk-mobile-card">
          <div class="card-header">
            <div class="item-identity">
              <h3>{{ squawk.tail_number }}</h3>
              <span class="item-date">{{ formatDate(squawk.observed_date) }}</span>
            </div>
            <div class="badges">
              <span class="severity-badge" :class="`severity-${squawk.severity.toLowerCase().replace(' ', '-')}`">
                {{ squawk.severity }}
              </span>
              <span class="status-badge" :class="`status-${squawk.status}`">
                {{ squawk.status }}
              </span>
            </div>
          </div>
          
          <div class="card-details">
            <p class="mobile-description">{{ squawk.description }}</p>
            <div class="detail-row">
              <span class="detail-label">Reported By:</span>
              <span class="detail-value">{{ squawk.creator_name }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-small btn-secondary" @click="viewDetail(squawk)">View & Comment</button>
            <button v-if="squawk.status === 'open' && (authStore.isAdmin || authStore.isOperator)" 
                    class="btn-small btn-success" @click="closeSquawk(squawk.id)">Close</button>
          </div>
        </div>
      </div>
      <div v-else class="no-data">
        No squawks found
      </div>
    </div>

    <!-- Create Squawk Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal-card form-card">
        <div class="modal-header">
          <h2>Report New Squawk</h2>
          <button class="btn-close" @click="closeCreateModal">✕</button>
        </div>
        
        <form @submit.prevent="handleCreateSubmit">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          
          <div class="form-group">
            <label>Aircraft</label>
            <select v-model="formData.aircraft_id" required>
              <option :value="0">Select Aircraft</option>
              <option v-for="a in aircraft" :key="a.id" :value="a.id">
                {{ a.tail_number }} - {{ a.make }} {{ a.model }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Observed Date</label>
              <input v-model="formData.observed_date" type="date" required />
            </div>
            <div class="form-group">
              <label>Severity</label>
              <select v-model="formData.severity" required>
                <option value="Low">Low</option>
                <option value="Urgent">Urgent</option>
                <option value="Approved Grounding">Approved Grounding</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Description of Issue</label>
            <textarea v-model="formData.description" rows="4" required 
                      placeholder="Describe the problem in detail..."></textarea>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Submitting...' : 'Report Squawk' }}
            </button>
            <button type="button" class="btn-secondary" @click="closeCreateModal">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Detail & Comments Modal -->
    <div v-if="selectedSquawk" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-card detail-card">
        <div class="modal-header">
          <h2>Squawk Details</h2>
          <button class="btn-close" @click="closeDetailModal">✕</button>
        </div>

        <div class="squawk-info-section">
          <div class="info-grid">
            <div class="info-item">
              <label>Aircraft</label>
              <div class="info-value">{{ selectedSquawk.tail_number }}</div>
            </div>
            <div class="info-item">
              <label>Date Observed</label>
              <div class="info-value">{{ formatDate(selectedSquawk.observed_date) }}</div>
            </div>
            <div class="info-item">
              <label>Severity</label>
              <div class="info-value">
                <span class="severity-badge" :class="`severity-${selectedSquawk.severity.toLowerCase().replace(' ', '-')}`">
                  {{ selectedSquawk.severity }}
                </span>
              </div>
            </div>
            <div class="info-item">
              <label>Status</label>
              <div class="info-value">
                <span class="status-badge" :class="`status-${selectedSquawk.status}`">
                  {{ selectedSquawk.status }}
                </span>
              </div>
            </div>
          </div>

          <div class="description-box">
            <label>Description</label>
            <p>{{ selectedSquawk.description }}</p>
            <div class="reported-by">Reported by {{ selectedSquawk.creator_name }} on {{ formatDate(selectedSquawk.created_at) }}</div>
          </div>
        </div>

        <div class="comments-section">
          <h3>Comments</h3>
          
          <div class="comment-list">
            <div v-for="comment in selectedSquawk.comments" :key="comment.id" class="comment-item">
              <div class="comment-meta">
                <strong>{{ comment.user_name }}</strong>
                <span>{{ formatDate(comment.created_at) }}</span>
              </div>
              <div class="comment-text">{{ comment.comment }}</div>
            </div>
            <div v-if="!selectedSquawk.comments?.length" class="no-comments">
              No comments yet.
            </div>
          </div>

          <div v-if="selectedSquawk.status === 'open'" class="add-comment">
            <form @submit.prevent="submitComment">
              <textarea v-model="newComment" rows="2" placeholder="Add a comment..." required></textarea>
              <div class="modal-actions">
                <button type="submit" class="btn-primary btn-small" :disabled="isSubmittingComment">
                  {{ isSubmittingComment ? 'Sending...' : 'Post Comment' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="modal-actions main-actions">
          <button v-if="selectedSquawk.status === 'open' && (authStore.isAdmin || authStore.isOperator)" 
                  class="btn-success" @click="closeSquawk(selectedSquawk.id)">Close Squawk</button>
          <button type="button" class="btn-secondary" @click="closeDetailModal">Close</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { aircraftAPI, squawkAPI } from '../services/api'
import type { Aircraft, Squawk } from '../types'
import AppLayout from '../components/AppLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

const aircraft = ref<Aircraft[]>([])
const squawks = ref<Squawk[]>([])
const loading = ref(false)

const filters = reactive({
  aircraft_id: undefined as number | undefined,
  status: 'open' as string
})

const showCreateModal = ref(false)
const isSubmitting = ref(false)
const formError = ref('')

const formData = reactive({
  aircraft_id: 0,
  severity: 'Low' as 'Low' | 'Urgent' | 'Approved Grounding',
  description: '',
  observed_date: new Date().toISOString().split('T')[0]
})

const selectedSquawk = ref<Squawk | null>(null)
const newComment = ref('')
const isSubmittingComment = ref(false)

async function loadInitialData() {
  try {
    const aircraftRes = await aircraftAPI.getAll()
    aircraft.value = aircraftRes.data

    if (route.query.aircraft_id) {
      filters.aircraft_id = Number(route.query.aircraft_id)
    }

    await loadSquawks()
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

async function loadSquawks() {
  loading.value = true
  try {
    const res = await squawkAPI.getAll({
      aircraft_id: filters.aircraft_id,
      status: filters.status || undefined
    })
    squawks.value = res.data
  } catch (error) {
    console.error('Error loading squawks:', error)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  resetForm()
  if (filters.aircraft_id) {
    formData.aircraft_id = filters.aircraft_id
  }
  showCreateModal.value = true
}

function resetForm() {
  formData.aircraft_id = 0
  formData.severity = 'Low'
  formData.description = ''
  formData.observed_date = new Date().toISOString().split('T')[0]
  formError.value = ''
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function handleCreateSubmit() {
  if (formData.aircraft_id === 0) {
    formError.value = 'Please select an aircraft.'
    return
  }

  isSubmitting.value = true
  formError.value = ''
  
  try {
    await squawkAPI.create(formData)
    await loadSquawks()
    closeCreateModal()
  } catch (error: any) {
    console.error('Error reporting squawk:', error)
    formError.value = error.response?.data?.error || 'Failed to report squawk.'
  } finally {
    isSubmitting.value = false
  }
}

async function viewDetail(squawk: Squawk) {
  try {
    const res = await squawkAPI.getById(squawk.id)
    selectedSquawk.value = res.data
  } catch (error) {
    console.error('Error loading squawk details:', error)
  }
}

function closeDetailModal() {
  selectedSquawk.value = null
  newComment.value = ''
}

async function submitComment() {
  if (!selectedSquawk.value || !newComment.value.trim()) return

  isSubmittingComment.value = true
  try {
    await squawkAPI.addComment(selectedSquawk.value.id, newComment.value)
    // Refresh details to show new comment
    await viewDetail(selectedSquawk.value)
    newComment.value = ''
  } catch (error) {
    console.error('Error posting comment:', error)
  } finally {
    isSubmittingComment.value = false
  }
}

async function closeSquawk(id: number) {
  if (confirm('Are you sure you want to close this squawk? This indicates the issue has been addressed.')) {
    try {
      await squawkAPI.close(id)
      await loadSquawks()
      if (selectedSquawk.value?.id === id) {
        closeDetailModal()
      }
    } catch (error) {
      console.error('Error closing squawk:', error)
    }
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

onMounted(() => {
  loadInitialData()
})
</script>

<style scoped>
.filters-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.description-preview {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
  color: #94a3b8;
}

.severity-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-low {
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.severity-urgent {
  background: rgba(245, 158, 11, 0.15);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.severity-approved-grounding {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-badge.status-open {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge.status-closed {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

/* Detail Modal Styles */
.detail-card {
  max-width: 700px;
}

.squawk-info-section {
  background: rgba(255, 255, 255, 0.03);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-item label {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.info-value {
  font-weight: 600;
  color: #e2e8f0;
}

.description-box label {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.description-box p {
  line-height: 1.6;
  color: #cbd5e1;
  margin-bottom: 0.75rem;
}

.reported-by {
  font-size: 0.8rem;
  color: #64748b;
  font-style: italic;
}

.comments-section h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #e2e8f0;
}

.comment-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.comment-meta strong {
  color: var(--sky-blue);
}

.comment-meta span {
  color: #64748b;
}

.comment-text {
  font-size: 0.9rem;
  color: #cbd5e1;
  line-height: 1.4;
}

.no-comments, .no-data {
  text-align: center;
  padding: 2rem;
  color: #64748b;
  font-style: italic;
}

.add-comment textarea {
  margin-bottom: 0.5rem;
}

.main-actions {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .squawks-mobile-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .squawk-mobile-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .item-identity h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #e2e8f0;
  }

  .item-date {
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .badges {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
  }

  .mobile-description {
    font-size: 0.9rem;
    color: #cbd5e1;
    margin-bottom: 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }

  .detail-label {
    color: #94a3b8;
  }

  .detail-value {
    color: #cbd5e1;
    font-weight: 500;
  }

  .card-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .card-actions button {
    flex: 1;
    justify-content: center;
  }
}
</style>
