<script lang="ts">
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import type { GetTripResponse, CreateExpenseRequest } from '$lib/api/types';

  let tripData: GetTripResponse | null = null;
  let isLoadingTrip = false;
  let tripError = '';

  // Expense form state
  let expenseAmount = '';
  let expenseCurrency = '';
  let expenseCategory = '';
  let expenseSpentAt = '';
  let expensePayer = '';
  let expenseNote = '';

  let isSubmittingExpense = false;
  let expenseError = '';

  // Sorted expenses
  $: sortedExpenses = (tripData?.expenses || []).sort((a, b) => {
    return new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime();
  });

  $: tripId = $page.params.tripId;

  async function loadTrip() {
    if (!tripId) return;

    isLoadingTrip = true;
    tripError = '';
    tripData = null;

    try {
      tripData = await api.getTrip(tripId);
    } catch (error) {
      if (error instanceof Error) {
        tripError = error.message;
      } else {
        tripError = 'Failed to load trip';
      }
    } finally {
      isLoadingTrip = false;
    }
  }

  async function handleAddExpense() {
    expenseError = '';

    // Validation
    if (!expenseAmount || !expenseCurrency || !expenseCategory || !expenseSpentAt || !expensePayer) {
      expenseError = 'Please fill in all required fields';
      return;
    }

    isSubmittingExpense = true;

    try {
      const payload: CreateExpenseRequest = {
        amount: parseFloat(expenseAmount),
        currency: expenseCurrency,
        category: expenseCategory,
        spentAt: expenseSpentAt,
        payer: expensePayer,
        note: expenseNote || null,
      };

      await api.createExpense(tripId, payload);

      // Clear form
      expenseAmount = '';
      expenseCurrency = '';
      expenseCategory = '';
      expenseSpentAt = '';
      expensePayer = '';
      expenseNote = '';

      // Reload trip data
      await loadTrip();
    } catch (error) {
      if (error instanceof Error) {
        expenseError = error.message;
      } else {
        expenseError = 'Failed to add expense';
      }
    } finally {
      isSubmittingExpense = false;
    }
  }

  // Load trip on mount
  $: if (tripId) {
    loadTrip();
  }
</script>

<div class="container">
  {#if tripError}
    <div class="error-box">
      <strong>Error:</strong> {tripError}
    </div>
  {/if}

  {#if isLoadingTrip}
    <div class="loading">Loading trip...</div>
  {:else if tripData}
    <!-- Trip Summary -->
    <section class="trip-summary">
      <h1>{tripData.trip.title}</h1>
      <p class="date-range">
        {tripData.trip.startDate} to {tripData.trip.endDate}
      </p>
      <p class="base-currency">Base Currency: <strong>{tripData.trip.baseCurrency}</strong></p>
    </section>

    <!-- Stats -->
    <section class="stats-section">
      <h2>Statistics</h2>
      <div class="stats-grid">
        <!-- Total by Currency -->
        <div class="stat-box">
          <h3>Total by Currency</h3>
          <ul>
            {#each Object.entries(tripData.stats.totalByCurrency) as [currency, total]}
              <li>{currency}: {total.toFixed(2)}</li>
            {/each}
          </ul>
        </div>

        <!-- Total by Category -->
        <div class="stat-box">
          <h3>Total by Category</h3>
          <ul>
            {#each Object.entries(tripData.stats.totalByCategory) as [category, total]}
              <li>{category}: {total.toFixed(2)}</li>
            {/each}
          </ul>
        </div>

        <!-- Total by Day -->
        <div class="stat-box">
          <h3>Total by Day</h3>
          <ul>
            {#each Object.entries(tripData.stats.totalByDay)
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB)) as [day, total]}
              <li>{day}: {total.toFixed(2)}</li>
            {/each}
          </ul>
        </div>
      </div>
    </section>

    <!-- Expenses -->
    <section class="expenses-section">
      <h2>Expenses</h2>

      {#if expenseError}
        <div class="error-box">
          {expenseError}
        </div>
      {/if}

      <!-- Add Expense Form -->
      <div class="add-expense-form">
        <h3>Add New Expense</h3>
        <form on:submit|preventDefault={handleAddExpense}>
          <div class="form-row">
            <div class="form-group">
              <label for="amount">Amount *</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                bind:value={expenseAmount}
                placeholder="0.00"
                disabled={isSubmittingExpense}
              />
            </div>

            <div class="form-group">
              <label for="currency">Currency *</label>
              <input
                id="currency"
                type="text"
                bind:value={expenseCurrency}
                placeholder="USD, TWD, JPY..."
                disabled={isSubmittingExpense}
              />
            </div>

            <div class="form-group">
              <label for="category">Category *</label>
              <input
                id="category"
                type="text"
                bind:value={expenseCategory}
                placeholder="food, transport..."
                disabled={isSubmittingExpense}
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="spentAt">Date *</label>
              <input
                id="spentAt"
                type="date"
                bind:value={expenseSpentAt}
                disabled={isSubmittingExpense}
              />
            </div>

            <div class="form-group">
              <label for="payer">Payer *</label>
              <input
                id="payer"
                type="text"
                bind:value={expensePayer}
                placeholder="Name"
                disabled={isSubmittingExpense}
              />
            </div>

            <div class="form-group">
              <label for="note">Note</label>
              <input
                id="note"
                type="text"
                bind:value={expenseNote}
                placeholder="Optional"
                disabled={isSubmittingExpense}
              />
            </div>
          </div>

          <button type="submit" disabled={isSubmittingExpense} class="submit-button">
            {isSubmittingExpense ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>

      <!-- Expenses Table -->
      {#if sortedExpenses.length > 0}
        <table class="expenses-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Payer</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedExpenses as expense (expense.id)}
              <tr>
                <td>{expense.spentAt}</td>
                <td>{expense.category}</td>
                <td>{expense.amount.toFixed(2)}</td>
                <td>{expense.currency}</td>
                <td>{expense.payer}</td>
                <td>{expense.note || '-'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="no-expenses">No expenses yet for this trip.</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    font-family: sans-serif;
  }

  .error-box {
    background-color: #fee;
    color: #c33;
    padding: 12px 16px;
    border: 1px solid #f99;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #666;
    font-size: 16px;
  }

  /* Trip Summary */
  .trip-summary {
    border-bottom: 2px solid #ddd;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }

  .trip-summary h1 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 28px;
  }

  .trip-summary .date-range {
    margin: 8px 0;
    color: #666;
    font-size: 14px;
  }

  .trip-summary .base-currency {
    margin: 8px 0;
    color: #666;
    font-size: 14px;
  }

  /* Stats Section */
  .stats-section {
    margin-bottom: 30px;
  }

  .stats-section h2 {
    color: #333;
    font-size: 20px;
    margin-bottom: 15px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .stat-box {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
  }

  .stat-box h3 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 14px;
    font-weight: 600;
  }

  .stat-box ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .stat-box li {
    padding: 6px 0;
    color: #555;
    font-size: 13px;
    border-bottom: 1px solid #eee;
  }

  .stat-box li:last-child {
    border-bottom: none;
  }

  /* Expenses Section */
  .expenses-section {
    margin-top: 30px;
  }

  .expenses-section h2 {
    color: #333;
    font-size: 20px;
    margin-bottom: 15px;
  }

  /* Add Expense Form */
  .add-expense-form {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 30px;
  }

  .add-expense-form h3 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 16px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
    color: #333;
  }

  .form-group input {
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    font-family: sans-serif;
  }

  .form-group input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  .form-group input:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
  }

  .submit-button {
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

  .submit-button:hover:not(:disabled) {
    background-color: #0052a3;
  }

  .submit-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  /* Expenses Table */
  .expenses-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    border: 1px solid #ddd;
    margin-top: 20px;
  }

  .expenses-table thead {
    background-color: #f5f5f5;
  }

  .expenses-table th {
    padding: 12px;
    text-align: left;
    font-weight: 600;
    font-size: 13px;
    color: #333;
    border-bottom: 2px solid #ddd;
  }

  .expenses-table td {
    padding: 12px;
    font-size: 13px;
    color: #666;
    border-bottom: 1px solid #ddd;
  }

  .expenses-table tbody tr:hover {
    background-color: #f9f9f9;
  }

  .no-expenses {
    color: #999;
    font-size: 14px;
    text-align: center;
    padding: 20px;
  }
</style>
