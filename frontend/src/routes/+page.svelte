<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import type { CreateTripRequest } from '$lib/api/types';

  let title = '';
  let startDate = '';
  let endDate = '';
  let baseCurrency = 'TWD';

  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let createdTripId: string | null = null;

  let startDateError = '';

  function validateDates() {
    startDateError = '';
    if (startDate && endDate && startDate > endDate) {
      startDateError = 'Start date must be before or equal to end date';
    }
  }

  function handleStartDateChange(e: Event) {
    const input = e.target as HTMLInputElement;
    startDate = input.value;
    validateDates();
  }

  function handleEndDateChange(e: Event) {
    const input = e.target as HTMLInputElement;
    endDate = input.value;
    validateDates();
  }

  async function handleSubmit() {
    errorMessage = '';
    successMessage = '';
    createdTripId = null;

    // Validation
    if (!title.trim()) {
      errorMessage = 'Title is required';
      return;
    }

    if (startDate > endDate) {
      errorMessage = 'Start date must be before or equal to end date';
      return;
    }

    isLoading = true;

    try {
      const payload: CreateTripRequest = {
        title,
        startDate,
        endDate,
        baseCurrency,
      };

      const result = await api.createTrip(payload);
      createdTripId = result.id;
      successMessage = `Trip "${result.title}" created successfully!`;

      // Clear form
      title = '';
      startDate = '';
      endDate = '';
      baseCurrency = 'TWD';
      startDateError = '';
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'An unknown error occurred';
      }
    } finally {
      isLoading = false;
    }
  }

  function goToTrip() {
    if (createdTripId) {
      goto(`/trips/${createdTripId}`);
    }
  }
</script>

<div class="container">
  <h1>Create a New Trip</h1>

  {#if errorMessage}
    <div class="error-message">
      {errorMessage}
    </div>
  {/if}

  {#if successMessage}
    <div class="success-message">
      {successMessage}
    </div>
    <button on:click={goToTrip} class="primary-button">Go to Trip Details</button>
  {:else}
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="title">Trip Title *</label>
        <input
          id="title"
          type="text"
          bind:value={title}
          placeholder="e.g., Tokyo 2026"
          disabled={isLoading}
        />
      </div>

      <div class="form-group">
        <label for="startDate">Start Date *</label>
        <input
          id="startDate"
          type="date"
          bind:value={startDate}
          on:change={handleStartDateChange}
          disabled={isLoading}
        />
      </div>

      <div class="form-group">
        <label for="endDate">End Date *</label>
        <input
          id="endDate"
          type="date"
          bind:value={endDate}
          on:change={handleEndDateChange}
          disabled={isLoading}
        />
        {#if startDateError}
          <span class="inline-error">{startDateError}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="baseCurrency">Base Currency</label>
        <input
          id="baseCurrency"
          type="text"
          bind:value={baseCurrency}
          placeholder="e.g., TWD, USD, JPY"
          disabled={isLoading}
        />
      </div>

      <button type="submit" disabled={isLoading} class="primary-button">
        {isLoading ? 'Creating...' : 'Create Trip'}
      </button>
    </form>
  {/if}
</div>

<style>
  .container {
    max-width: 600px;
    margin: 40px auto;
    padding: 20px;
    font-family: sans-serif;
  }

  h1 {
    color: #333;
    margin-bottom: 30px;
  }

  .error-message {
    background-color: #fee;
    color: #c33;
    padding: 12px 16px;
    border: 1px solid #f99;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .success-message {
    background-color: #efe;
    color: #3c3;
    padding: 12px 16px;
    border: 1px solid #9f9;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .form-group {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
  }

  label {
    margin-bottom: 6px;
    font-weight: 500;
    color: #333;
    font-size: 14px;
  }

  input {
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: sans-serif;
  }

  input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  input:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
  }

  .inline-error {
    color: #c33;
    font-size: 12px;
    margin-top: 4px;
  }

  .primary-button {
    padding: 10px 20px;
    background-color: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .primary-button:hover:not(:disabled) {
    background-color: #0052a3;
  }

  .primary-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  form {
    display: flex;
    flex-direction: column;
  }
</style>
