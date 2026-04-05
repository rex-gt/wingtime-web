<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1>Maintenance Tracking</h1>
        <p>Manage aircraft maintenance schedules and status</p>
      </div>
      <button v-if="authStore.canManageAircraft" class="btn-primary" @click="openCreateModal">
        + Add Maintenance Item
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-card">
      <div class="form-row">
        <div class="form-group">
          <label>Filter by Aircraft</label>
          <select v-model="filters.aircraft_id" @change="loadMaintenance">
            <option :value="undefined">All Aircraft</option>
            <option v-for="a in aircraft" :key="a.id" :value="a.id">
              {{ a.tail_number }} - {{ a.make }} {{ a.model }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Filter by Status</label>
          <select v-model="filters.status" @change="loadMaintenance">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="fixed">Fixed</option>
            <option value="obsolete">Obsolete</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Maintenance Table -->
    <div class="table-container desktop-only">
      <table>
        <thead>
          <tr>
            <th>Aircraft</th>
            <th>Title</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Created By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in maintenanceItems" :key="item.id">
            <td><strong>{{ item.tail_number }}</strong></td>
            <td>
              <div class="item-title">{{ item.title }}</div>
              <div class="item-description" v-if="item.description">{{ item.description }}</div>
            </td>
            <td>{{ item.due_date ? formatDate(item.due_date) : '—' }}</td>
            <td>
              <span class="status-badge" :class="`status-${item.status}`">
                {{ item.status }}
              </span>
            </td>
            <td>{{ item.creator_name }}</td>
            <td>
              <div class="action-buttons">
                <button v-if="authStore.canManageAircraft" class="btn-small btn-secondary" @click="editItem(item)">Edit</button>
                <button v-if="item.status === 'open' && authStore.canManageAircraft" class="btn-small btn-success" @click="updateStatus(item, 'fixed')">Fix</button>
                <button v-if="authStore.isAdmin" class="btn-small btn-danger" @click="deleteItem(item.id)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="maintenanceItems.length === 0">
            <td colspan="6" class="no-data">No maintenance items found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile View -->
    <div class="mobile-only maintenance-mobile-list">
      <div v-if="maintenanceItems.length > 0">
        <div v-for="item in maintenanceItems" :key="item.id" class="maintenance-mobile-card">
          <div class="card-header">
            <div class="item-identity">
              <h3>{{ item.tail_number }}</h3>
              <span class="item-title-small">{{ item.title }}</span>
            </div>
            <span class="status-badge" :class="`status-${item.status}`">
              {{ item.status }}
            </span>
          </div>
          
          <div class="card-details">
            <div v-if="item.description" class="detail-row description-row">
              <p>{{ item.description }}</p>
            </div>
            <div class="detail-row">
              <span class="detail-label">Due:</span>
              <span class="detail-value">{{ item.due_date ? formatDate(item.due_date) : '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reporter:</span>
              <span class="detail-value">{{ item.creator_name }}</span>
            </div>
          </div>

          <div v-if="authStore.canManageAircraft" class="card-actions">
            <button class="btn-small btn-secondary" @click="editItem(item)">Edit</button>
            <button v-if="item.status === 'open'" class="btn-small btn-success" @click="updateStatus(item, 'fixed')">Fix</button>
            <button v-if="authStore.isAdmin" class="btn-small btn-danger" @click="deleteItem(item.id)">Delete</button>
          </div>
        </div>
      </div>
      <div v-else class="no-data">
        No maintenance items found
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card form-card">
        <div class="modal-header">
          <h2>{{ editingItem ? 'Edit Maintenance Item' : 'Add Maintenance Item' }}</h2>
          <button class="btn-close" @click="closeModal">✕</button>
        </div>
        
        <form @submit.prevent="handleSubmit">
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

          <div class="form-group">
            <label>Title</label>
            <input v-model="formData.title" type="text" required placeholder="e.g. Annual Inspection, 50-hour oil change" />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="formData.description" rows="3" placeholder="Provide more details about the maintenance task..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Due Date (Optional)</label>
              <input v-model="formData.due_date" type="date" />
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="formData.status" required>
                <option value="open">Open</option>
                <option value="fixed">Fixed</option>
                <option value="obsolete">Obsolete</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : (editingItem ? 'Update' : 'Create') }}
            </button>
            <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { aircraftAPI, maintenanceAPI } from '../services/api'
import type { Aircraft, MaintenanceItem } from '../types'
import AppLayout from '../components/AppLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

const aircraft = ref<Aircraft[]>([])
const maintenanceItems = ref<MaintenanceItem[]>([])
const loading = ref(false)

const filters = reactive({
  aircraft_id: undefined as number | undefined,
  status: '' as string
})

const showModal = ref(false)
const editingItem = ref<MaintenanceItem | null>(null)
const isSubmitting = ref(false)
const formError = ref('')

const formData = reactive({
  aircraft_id: 0,
  title: '',
  description: '',
  due_date: '',
  status: 'open' as 'open' | 'fixed' | 'obsolete'
})

async function loadInitialData() {
  try {
    const aircraftRes = await aircraftAPI.getAll()
    aircraft.value = aircraftRes.data

    // Check for aircraft_id in query params
    if (route.query.aircraft_id) {
      filters.aircraft_id = Number(route.query.aircraft_id)
    }

    await loadMaintenance()
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

async function loadMaintenance() {
  loading.value = true
  try {
    const res = await maintenanceAPI.getAll({
      aircraft_id: filters.aircraft_id,
      status: filters.status || undefined
    })
    maintenanceItems.value = res.data
  } catch (error) {
    console.error('Error loading maintenance items:', error)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingItem.value = null
  resetForm()
  if (filters.aircraft_id) {
    formData.aircraft_id = filters.aircraft_id
  }
  showModal.value = true
}

function resetForm() {
  formData.aircraft_id = 0
  formData.title = ''
  formData.description = ''
  formData.due_date = ''
  formData.status = 'open'
  formError.value = ''
}

function editItem(item: MaintenanceItem) {
  editingItem.value = item
  formData.aircraft_id = item.aircraft_id
  formData.title = item.title
  formData.description = item.description || ''
  formData.due_date = item.due_date ? item.due_date.split('T')[0] : ''
  formData.status = item.status
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSubmit() {
  if (formData.aircraft_id === 0) {
    formError.value = 'Please select an aircraft.'
    return
  }

  isSubmitting.value = true
  formError.value = ''
  
  try {
    if (editingItem.value) {
      await maintenanceAPI.update(editingItem.value.id, formData)
    } else {
      await maintenanceAPI.create(formData)
    }
    await loadMaintenance()
    closeModal()
  } catch (error: any) {
    console.error('Error saving maintenance item:', error)
    formError.value = error.response?.data?.error || 'Failed to save maintenance item.'
  } finally {
    isSubmitting.value = false
  }
}

async function updateStatus(item: MaintenanceItem, status: 'open' | 'fixed' | 'obsolete') {
  try {
    await maintenanceAPI.update(item.id, { status })
    await loadMaintenance()
  } catch (error) {
    console.error('Error updating status:', error)
  }
}

async function deleteItem(id: number) {
  if (confirm('Are you sure you want to delete this maintenance item?')) {
    try {
      await maintenanceAPI.delete(id)
      await loadMaintenance()
    } catch (error) {
      console.error('Error deleting maintenance item:', error)
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

.item-title {
  font-weight: 600;
  color: #e2e8f0;
}

.item-description {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  max-width: 400px;
}

.status-badge.status-open {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-badge.status-fixed {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-badge.status-obsolete {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

@media (max-width: 768px) {
  .maintenance-mobile-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .maintenance-mobile-card {
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

  .item-title-small {
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .card-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .description-row p {
    font-size: 0.9rem;
    color: #cbd5e1;
    margin: 0;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
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
