<script lang="ts">
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import UserRoundPlus from "@lucide/svelte/icons/user-round-plus";
  import { api } from "../services/api";
  import { refreshUser } from "../lib/auth.svelte";

  let name = $state("");
  let email = $state("");
  let password = $state("");
  let error = $state("");
  let busy = $state(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    error = "";
    busy = true;

    try {
      await api.signup(name, email, password);
      await refreshUser();
      window.location.href = "/";
    } catch (err) {
      error = err instanceof Error ? err.message : "Sign up failed.";
      busy = false;
    }
  }
</script>

<div class="auth-page">
  <a class="wordmark auth-logo" href="/">
    Frame<span>°</span>
  </a>

  <main class="auth-card">
    <div class="auth-icon">
      <UserRoundPlus size={21} />
    </div>
    <p class="page-eyebrow">MAKE YOURSELF AT HOME</p>
    <h1>Your space starts here.</h1>
    <p class="auth-description">
      Create an account and make Frame° yours.
    </p>

    <form onsubmit={(event) => void submit(event)}>
      <div class="form-field">
        <label for="name">Display name</label>
        <input
          id="name"
          autocomplete="name"
          required
          maxlength={40}
          bind:value={name}
          placeholder="What should we call you?"
        />
      </div>

      <div class="form-field">
        <label for="email">Email address</label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          required
          bind:value={email}
          placeholder="you@example.com"
        />
      </div>

      <div class="form-field">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          autocomplete="new-password"
          minlength={8}
          required
          bind:value={password}
          placeholder="At least 8 characters"
        />
      </div>

      {#if error}
        <p class="error-message">{error}</p>
      {/if}

      <button class="primary-button auth-submit" disabled={busy}>
        {busy ? "Creating account..." : "Create account"}
        <ArrowRight size={16} />
      </button>
    </form>

    <p class="auth-switch">
      Already have an account? <a href="/pages/login.html">Sign in</a>
    </p>
  </main>

  <p class="auth-footer">YOUR PERSONAL VIDEO SPACE</p>
</div>
