<script lang="ts">
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import LockKeyhole from "@lucide/svelte/icons/lock-keyhole";
  import { api } from "../services/api";
  import { refreshUser } from "../lib/auth.svelte";

  let email = $state("");
  let password = $state("");
  let error = $state("");
  let busy = $state(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    error = "";
    busy = true;

    try {
      await api.login(email, password);
      await refreshUser();
      window.location.href = "/";
    } catch (err) {
      error = err instanceof Error ? err.message : "Sign in failed.";
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
      <LockKeyhole size={21} />
    </div>
    <p class="page-eyebrow">WELCOME BACK</p>
    <h1>Pick up where you left off.</h1>
    <p class="auth-description">
      Sign in to return to your personal video space.
    </p>

    <form onsubmit={(event) => void submit(event)}>
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
          autocomplete="current-password"
          required
          bind:value={password}
          placeholder="Your password"
        />
      </div>

      <div class="auth-forgot">
        <a href="/pages/forgot.html">Forgot password?</a>
      </div>

      {#if error}
        <p class="error-message">{error}</p>
      {/if}

      <button class="primary-button auth-submit" disabled={busy}>
        {busy ? "Signing in..." : "Sign in"}
        <ArrowRight size={16} />
      </button>
    </form>

    <p class="auth-switch">
      New to Frame°? <a href="/pages/signup.html">Create an account</a>
    </p>
  </main>

  <p class="auth-footer">YOUR PERSONAL VIDEO SPACE</p>
</div>
