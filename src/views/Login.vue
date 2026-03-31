<template>
  <div class="login-container">
    <div class="login-box">
      <img src="/aerobook-logo.svg" alt="AeroBook" class="logo" />
      <h1>Welcome to AeroBook</h1>
      <p>Sign in to manage your flights</p>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <!-- Login Form -->
      <form v-if="!isForgotPassword" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            v-model="email"
            type="email"
            id="email"
            placeholder="your@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            v-model="password"
            type="password"
            id="password"
            placeholder="Enter your password"
            required
          />
        </div>

        <div class="form-actions-link">
          <a href="#" @click.prevent="isForgotPassword = true" class="forgot-link">Forgot Password?</a>
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <!-- Forgot Password Form -->
      <form v-else @submit.prevent="handleForgotPassword">
        <div class="form-group">
          <label for="resetEmail">Email</label>
          <input
            v-model="email"
            type="email"
            id="resetEmail"
            placeholder="your@email.com"
            required
          />
          <p class="form-help">Enter your email to receive a reset link</p>
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Sending Link...' : 'Send Reset Link' }}
        </button>

        <div class="form-actions-link">
          <a href="#" @click.prevent="isForgotPassword = false" class="back-link">Back to Sign In</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { authAPI } from '../services/api'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const isForgotPassword = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await authStore.login(email.value, password.value)
  } catch (error: any) {
    if (!error.response) {
      errorMessage.value = 'Unable to reach the server. Please try again later.'
    } else if (error.response.status === 401) {
      errorMessage.value = error.response.data?.message || 'Invalid email or password.'
    } else {
      errorMessage.value = error.response.data?.message || `Server error (${error.response.status}). Please try again.`
    }
  } finally {
    isLoading.value = false
  }
}

async function handleForgotPassword() {
  if (!email.value) {
    errorMessage.value = 'Please enter your email'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await authAPI.forgotPassword(email.value)
    successMessage.value = 'Reset link sent! Please check your email.'
    // Keep email but clear it from form if you want? 
    // Usually better to leave it so they know where it went.
  } catch (error: any) {
    if (!error.response) {
      errorMessage.value = 'Unable to reach the server. Please try again later.'
    } else if (error.response.status === 404) {
      errorMessage.value = 'This email is not registered in our system.'
    } else {
      errorMessage.value = error.response.data?.message || 'Failed to send reset link. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.login-box {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

@media (max-width: 480px) {
  .login-box {
    padding: 2rem 1.5rem;
  }
  
  .login-box h1 {
    font-size: 1.5rem;
  }
}

.logo {
  height: 48px;
  margin-bottom: 1.5rem;
}

.login-box h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.login-box p {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
}

.form-help {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.5rem;
}

.form-actions-link {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.forgot-link, .back-link {
  color: #93c5fd;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.forgot-link:hover, .back-link:hover {
  color: #60a5fa;
  text-decoration: underline;
}

button[type="submit"] {
  width: 100%;
  margin-top: 1rem;
}

.alert-success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
</style>
