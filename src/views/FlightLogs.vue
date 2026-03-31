<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1>Flight Logs</h1>
        <p>View all completed flights</p>
      </div>
    </div>

    <div class="table-container desktop-only">
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th class="desktop-only">Aircraft</th>
            <th>Flight Date</th>
            <th class="desktop-only">Departure</th>
            <th class="desktop-only">Arrival</th>
            <th>Tach Hours</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in flightLogs" :key="log.id">
            <td>{{ getMemberName(log.member_id) }}</td>
            <td class="desktop-only">{{ getAircraftName(log.aircraft_id) }}</td>
            <td>{{ formatDate(log.flight_date) }}</td>
            <td class="desktop-only">{{ formatTime(log.departure_time) }}</td>
            <td class="desktop-only">{{ formatTime(log.arrival_time) }}</td>
            <td><strong>{{ log.tach_hours }}</strong></td>
          </tr>
          <tr v-if="flightLogs.length === 0">
            <td colspan="6" class="no-data">No flight logs found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Flight Log Cards -->
    <div class="mobile-only flight-logs-mobile-list">
      <div v-if="flightLogs.length > 0">
        <div v-for="log in flightLogs" :key="log.id" class="flight-log-mobile-card">
          <div class="card-header">
            <div class="log-identity">
              <h3>{{ getMemberName(log.member_id) }}</h3>
            </div>
            <div class="log-date">
              {{ formatDate(log.flight_date) }}
            </div>
          </div>
          
          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">Aircraft:</span>
              <span class="detail-value">{{ getAircraftName(log.aircraft_id) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Departure:</span>
              <span class="detail-value">{{ formatTime(log.departure_time) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Arrival:</span>
              <span class="detail-value">{{ formatTime(log.arrival_time) }}</span>
            </div>
            <div class="detail-row tach-row">
              <span class="detail-label">Tach Hours:</span>
              <span class="detail-value tach-value">{{ log.tach_hours }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-data">
        No flight logs found
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { flightLogsAPI, membersAPI, aircraftAPI } from '../services/api'
import type { FlightLog, Member, Aircraft } from '../types'
import AppLayout from '../components/AppLayout.vue'

const flightLogs = ref<FlightLog[]>([])
const members = ref<Member[]>([])
const aircraft = ref<Aircraft[]>([])

async function loadData() {
  try {
    const [logsRes, membersRes, aircraftRes] = await Promise.all([
      flightLogsAPI.getAll(),
      membersAPI.getAll(),
      aircraftAPI.getAll()
    ])
    flightLogs.value = logsRes.data
    members.value = membersRes.data
    aircraft.value = aircraftRes.data
  } catch (error) {
    console.error('Error loading flight logs:', error)
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
  return new Date(dateString).toLocaleDateString()
}

function formatTime(timeString: string) {
  return new Date(timeString).toLocaleTimeString()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
@media (max-width: 768px) {
  /* Modern Mobile Card Styles for Flight Logs */
  .flight-logs-mobile-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
  }

  .flight-log-mobile-card {
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

  .log-identity h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #e2e8f0;
  }

  .log-id {
    font-size: 0.8rem;
    color: #94a3b8;
    font-family: 'Space Mono', monospace;
  }

  .log-date {
    font-size: 0.85rem;
    color: #93c5fd;
    font-weight: 600;
  }

  .card-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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

  .tach-row {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
  }

  .tach-value {
    color: #93c5fd;
    font-size: 1.1rem;
    font-weight: 700;
    font-family: 'Space Mono', monospace;
  }
}
</style>
