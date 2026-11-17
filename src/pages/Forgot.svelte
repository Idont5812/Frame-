<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Mail from "@lucide/svelte/icons/mail";

  let email = $state("");
  let message = $state("");

  function submit(event: SubmitEvent) {
    event.preventDefault();
    message =
      "Automatic password resets aren't set up on this Frame° space yet. If you're already signed in, you can change your password from your account page — otherwise contact the site administrator.";
  }
</script>

<div class="auth-page">
  <a class="wordmark auth-logo" href="/">
    Frame<span>°</span>
  </a>

  <main class="auth-card">
    <div class="auth-icon">
      <Mail size={21} />
    </div>
    <p class="page-eyebrow">ACCOUNT RECOVERY</p>
    <h1>Let's get you back in.</h1>
    <p class="auth-description">
      Enter the email address associated with your Frame° account.
    </p>

    <form onsubmit={submit}>
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

      {#if message}
        <p class="error-message">{message}</p>
      {/if}

      <button class="primary-button auth-submit">
        Request password reset
      </button>
    </form>

    <p class="auth-switch">
      <a href="/pages/login.html">
        <ArrowLeft size={13} /> Back to sign in
      </a>
    </p>
  </main>

  <p class="auth-footer">YOUR PERSONAL VIDEO SPACE</p>
</div>
