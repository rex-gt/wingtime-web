<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1>Billing</h1>
        <p>Manage member invoices and payments</p>
      </div>
    </div>

    <div class="table-container desktop-only">
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th class="desktop-only">Aircraft</th>
            <th>Date</th>
            <th class="desktop-only">Tach Hours</th>
            <th class="desktop-only">Rate</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bill in billingRecords" :key="bill.id">
            <td>{{ getMemberName(bill.member_id) }}</td>
            <td class="desktop-only">{{ getAircraftName(bill.aircraft_id) }}</td>
            <td>{{ formatDate(bill.billing_date) }}</td>
            <td class="desktop-only">{{ bill.tach_hours }}</td>
            <td class="desktop-only">${{ bill.hourly_rate }}/hr</td>
            <td><strong>${{ bill.amount }}</strong></td>
            <td>
              <span class="status-badge" :class="bill.is_paid ? 'status-paid' : 'status-unpaid'">
                {{ bill.is_paid ? 'Paid' : 'Unpaid' }}
              </span>
            </td>
            <td>
              <button v-if="!bill.is_paid" class="btn-small btn-primary" @click="markAsPaid(bill.id)">
                Mark Paid
              </button>
            </td>
          </tr>
          <tr v-if="billingRecords.length === 0">
            <td colspan="8" class="no-data">No billing records found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Billing Cards -->
    <div class="mobile-only billing-mobile-list">
      <div v-if="billingRecords.length > 0">
        <div v-for="bill in billingRecords" :key="bill.id" class="billing-mobile-card">
          <div class="card-header">
            <div class="bill-identity">
              <h3>{{ getMemberName(bill.member_id) }}</h3>
            </div>
            <span class="status-badge" :class="bill.is_paid ? 'status-paid' : 'status-unpaid'">
              {{ bill.is_paid ? 'Paid' : 'Unpaid' }}
            </span>
          </div>
          
          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">Aircraft:</span>
              <span class="detail-value">{{ getAircraftName(bill.aircraft_id) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">{{ formatDate(bill.billing_date) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tach Hours:</span>
              <span class="detail-value">{{ bill.tach_hours }}</span>
            </div>
            <div class="detail-row amount-row">
              <span class="detail-label">Total Amount:</span>
              <span class="detail-value amount-value">${{ bill.amount }}</span>
            </div>
          </div>

          <div v-if="!bill.is_paid" class="card-actions">
            <button class="btn-primary" @click="markAsPaid(bill.id)">Mark As Paid</button>
          </div>
        </div>
      </div>
      <div v-else class="no-data">
        No billing records found
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { billingAPI, membersAPI, aircraftAPI } from '../services/api'
import type { BillingRecord, Member, Aircraft } from '../types'
import AppLayout from '../components/AppLayout.vue'

const billingRecords = ref<BillingRecord[]>([])
const members = ref<Member[]>([])
const aircraft = ref<Aircraft[]>([])

async function loadData() {
  try {
    const [billingRes, membersRes, aircraftRes] = await Promise.all([
      billingAPI.getAll(),
      membersAPI.getAll(),
      aircraftAPI.getAll()
    ])
    billingRecords.value = billingRes.data
    members.value = membersRes.data
    aircraft.value = aircraftRes.data
  } catch (error) {
    console.error('Error loading billing data:', error)
  }
}

async function markAsPaid(id: number) {
  try {
    await billingAPI.markPaid(id)
    await loadData()
  } catch (error) {
    console.error('Error marking as paid:', error)
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

onMounted(() => {
  loadData()
})
</script>

<style scoped>
@media (max-width: 768px) {
  /* Modern Mobile Card Styles for Billing */
  .billing-mobile-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
  }

  .billing-mobile-card {
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

  .bill-identity h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #e2e8f0;
  }

  .bill-id {
    font-size: 0.8rem;
    color: #94a3b8;
    font-family: 'Space Mono', monospace;
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

  .amount-row {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
  }

  .amount-value {
    color: #93c5fd;
    font-size: 1.2rem;
    font-weight: 700;
    font-family: 'Space Mono', monospace;
  }

  .card-actions {
    margin-top: 0.5rem;
  }

  .card-actions button {
    width: 100%;
    justify-content: center;
  }
}
</style>
