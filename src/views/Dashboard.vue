<template>
  <AppLayout>
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome back! Here's what's happening with your flying club.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-if="authStore.canManageMembers">
        <h3>Total Members</h3>
        <div class="value">{{ members.length }}</div>
      </div>

      <div class="stat-card">
        <h3>Available Aircraft</h3>
        <div class="value">{{ availableAircraft }}</div>
      </div>

      <div class="stat-card">
        <h3>Upcoming Reservations</h3>
        <div class="value">{{ upcomingReservations }}</div>
      </div>

      <div class="stat-card" v-if="authStore.canManageBilling">
        <h3>Unpaid Bills</h3>
        <div class="value">{{ unpaidBills }}</div>
      </div>
    </div>

    <div class="recent-activity">
      <h2>Recent Reservations</h2>
      <div class="table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th class="desktop-only">ID</th>
              <th>Member</th>
              <th>Aircraft</th>
              <th>Start Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reservation in displayReservations" :key="reservation.id">
              <td class="desktop-only">{{ reservation.id }}</td>
              <td>{{ getMemberName(reservation.member_id) }}</td>
              <td>{{ getAircraftName(reservation.aircraft_id) }}</td>
              <td>{{ formatDate(reservation.start_time) }}</td>
              <td>
                <span class="status-badge" :class="`status-${reservation.status}`">
                  {{ reservation.status }}
                </span>
              </td>
            </tr>
            <tr v-if="displayReservations.length === 0">
              <td colspan="5" class="no-data">
                No reservations found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards for Recent Reservations -->
      <div class="mobile-only dashboard-mobile-list">
        <div v-if="displayReservations.length > 0">
          <div v-for="reservation in displayReservations" :key="reservation.id" class="reservation-mobile-card">
            <div class="card-header">
              <div class="res-identity">
                <h3>{{ getAircraftName(reservation.aircraft_id) }}</h3>
                <span class="res-id">#{{ reservation.id }}</span>
              </div>
              <span class="status-badge" :class="`status-${reservation.status}`">
                {{ reservation.status }}
              </span>
            </div>
            
            <div class="card-details">
              <div class="detail-row">
                <span class="detail-label">Member:</span>
                <span class="detail-value">{{ getMemberName(reservation.member_id) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Time:</span>
                <span class="detail-value">{{ formatDate(reservation.start_time) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          No reservations found
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { membersAPI, aircraftAPI, reservationsAPI, billingAPI } from '../services/api'
import type { Member, Aircraft, Reservation, BillingRecord } from '../types'
import AppLayout from '../components/AppLayout.vue'

const authStore = useAuthStore()

const members = ref<Member[]>([])
const aircraft = ref<Aircraft[]>([])
const reservations = ref<Reservation[]>([])
const billing = ref<BillingRecord[]>([])

const availableAircraft = computed(() => aircraft.value.filter(a => a.is_available).length)
const upcomingReservations = computed(() => {
  const now = new Date()
  let filtered = reservations.value
  
  if (authStore.isMember) {
    filtered = filtered.filter(r => r.member_id === authStore.user?.id)
  }

  return filtered.filter(r => 
    (r.status === 'scheduled' || r.status === 'in_progress') && 
    new Date(r.end_time) > now
  ).length
})
const unpaidBills = computed(() => billing.value.filter(b => !b.is_paid).length)

const displayReservations = computed(() => {
  let filtered = reservations.value
  
  if (authStore.isMember) {
    filtered = filtered.filter(r => r.member_id === authStore.user?.id)
  }

  return [...filtered]
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .slice(0, 5)
})

async function loadData() {
  try {
    const promises: Promise<any>[] = [
      aircraftAPI.getAll(),
      reservationsAPI.getAll()
    ]

    // Only fetch members list if authorized (prevents 403 crashing the whole load)
    if (authStore.canManageMembers) {
      promises.push(membersAPI.getAll())
    }

    if (authStore.canManageBilling) {
      promises.push(billingAPI.getAll())
    }

    const results = await Promise.all(promises)

    aircraft.value = results[0].data
    reservations.value = results[1].data

    let nextResultIndex = 2
    if (authStore.canManageMembers) {
      members.value = results[nextResultIndex++].data
    }

    if (authStore.canManageBilling) {
      billing.value = results[nextResultIndex++].data
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

function getMemberName(memberId: number): string {
  const member = members.value.find(m => m.id === memberId)
  return member ? `${member.first_name} ${member.last_name}` : `Member #${memberId}`
}

function getAircraftName(aircraftId: number): string {
  const plane = aircraft.value.find(a => a.id === aircraftId)
  return plane ? `${plane.tail_number} - ${plane.make} ${plane.model}` : `Aircraft #${aircraftId}`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 2rem;
  }

  .dashboard-header p {
    font-size: 1rem;
  }

  /* Modern Mobile Card Styles for Dashboard */
  .dashboard-mobile-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .reservation-mobile-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .res-identity h3 {
    margin: 0;
    font-size: 1rem;
    color: #e2e8f0;
  }

  .res-id {
    font-size: 0.75rem;
    color: #94a3b8;
    font-family: 'Space Mono', monospace;
  }

  .card-details {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
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
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.quick-actions, .recent-activity {
  margin-bottom: 3rem;
}

.quick-actions h2, .recent-activity h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
</style>
