<script lang="ts">
  import UserRound from "@lucide/svelte/icons/user-round";
  import LogOut from "@lucide/svelte/icons/log-out";
  import VideoIcon from "@lucide/svelte/icons/video";
  import Star from "@lucide/svelte/icons/star";
  import Eye from "@lucide/svelte/icons/eye";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import KeyRound from "@lucide/svelte/icons/key-round";
  import Check from "@lucide/svelte/icons/check";
  import X from "@lucide/svelte/icons/x";
  import AppShell from "../components/AppShell.svelte";
  import VideoCard from "../components/VideoCard.svelte";
  import ConfirmDialog from "../components/ConfirmDialog.svelte";
  import { toast } from "../lib/toast.svelte";
  import { auth, logoutUser, refreshUser } from "../lib/auth.svelte";
  import { api } from "../services/api";
  import { prefs } from "../lib/prefs.svelte";
  import { effectiveColumns } from "../lib/grid";
  import type { AccountStats, Video } from "../types";

  let stats = $state<AccountStats | null>(null);
  let uploads = $state<Video[]>([]);
  let pageError = $state("");

  let nameDraft = $state("");
  let editingName = $state(false);
  let savingName = $state(false);

  let showPasswordForm = $state(false);
  let currentPassword = $state("");
  let newPassword = $state("");
  let savingPassword = $state(false);

  let deleteTarget = $state<Video | null>(null);
  let deleting = $state(false);

  let viewportWidth = $state(window.innerWidth);
  const columns = $derived(effectiveColumns(prefs.gridCols, viewportWidth));

  $effect(() => {
    const onResize = () => {
      viewportWidth = window.innerWidth;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  async function loadUploads() {
    try {
      const result = await api.myVideos();
      uploads = result.videos ?? [];
    } catch {
      // The uploads list is supplementary; stats already surfaced errors above.
    }
  }

  $effect(() => {
    if (!auth.user) return;

    void api
      .account()
      .then((result) => {
        stats = result.stats;
        nameDraft = result.user.name;
      })
      .catch((err: unknown) =>
        pageError =
          err instanceof Error
            ? err.message
            : "Couldn't load your account."
      );

    void loadUploads();
  });

  async function saveName() {
    const name = nameDraft.trim();

    if (!name || name.length > 40) {
      toast("Name must be 1-40 characters.", "error");
      return;
    }

    savingName = true;
    try {
      await api.updateAccount({ name });
      await refreshUser();
      editingName = false;
      toast("Display name updated.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Couldn't update your name.",
        "error"
      );
    } finally {
      savingName = false;
    }
  }

  async function changePassword() {
    if (newPassword.length < 8 || newPassword.length > 128) {
      toast("New password must be 8-128 characters.", "error");
      return;
    }

    savingPassword = true;
    try {
      await api.changePassword(currentPassword, newPassword);
      currentPassword = "";
      newPassword = "";
      showPasswordForm = false;
      toast("Password updated.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Couldn't change your password.",
        "error"
      );
    } finally {
      savingPassword = false;
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    deleting = true;
    try {
      await api.deleteVideo(deleteTarget.id);
      uploads = uploads.filter((item) => item.id !== deleteTarget!.id);
      if (stats) {
        stats = { ...stats, uploads: Math.max(0, stats.uploads - 1) };
      }
      toast("Video deleted.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Couldn't delete the video.",
        "error"
      );
      void loadUploads();
    } finally {
      deleting = false;
      deleteTarget = null;
    }
  }

  async function signOut() {
    try {
      await logoutUser();
      window.location.href = "/";
    } catch (err) {
      pageError =
        err instanceof Error ? err.message : "Sign out failed.";
    }
  }
</script>

<AppShell>
  <p class="page-eyebrow">YOUR FRAME°</p>
  <h1 class="page-title">Your space.</h1>
  <p class="page-subtitle">Your profile, uploads, and saved videos.</p>

  {#if auth.loading}
    <div class="empty-state" style="margin-top:35px;">
      <p>Loading account...</p>
    </div>
  {:else if !auth.user}
    <div class="empty-state" style="margin-top:35px;">
      <UserRound size={24} />
      <h3>Your account lives here</h3>
      <p>Sign in to view your profile and library.</p>
      <a class="primary-button" href="/pages/login.html">
        Sign in
      </a>
    </div>
  {:else}
    <section class="account-profile">
      <div class="account-avatar">
        {(auth.user.name || "F").charAt(0).toUpperCase()}
      </div>
      <div class="account-identity">
        {#if editingName}
          <div class="name-edit-row">
            <input
              class="name-edit-input"
              aria-label="Display name"
              maxlength={40}
              bind:value={nameDraft}
              onkeydown={(e) => {
                if (e.key === "Enter") void saveName();
                if (e.key === "Escape") editingName = false;
              }}
            />
            <button
              class="icon-button is-confirm"
              aria-label="Save name"
              disabled={savingName}
              onclick={() => void saveName()}
            >
              <Check size={16} />
            </button>
            <button
              class="icon-button"
              aria-label="Cancel editing"
              onclick={() => (editingName = false)}
            >
              <X size={16} />
            </button>
          </div>
        {:else}
          <button
            class="icon-button"
            style="padding:0; text-align:left;"
            title="Click to edit your display name"
            onclick={() => (editingName = true)}
          >
            <h2>{auth.user.name}</h2>
          </button>
        {/if}
        <p>{auth.user.email}</p>
      </div>
      <button
        class="secondary-button"
        onclick={() => (showPasswordForm = !showPasswordForm)}
      >
        <KeyRound size={15} />
        Change password
      </button>
      <button class="secondary-button account-logout" onclick={() => void signOut()}>
        <LogOut size={15} />
        Sign out
      </button>
    </section>

    {#if showPasswordForm}
      <form
        class="upload-form"
        style="margin-top:20px; gap:14px;"
        onsubmit={(event) => {
          event.preventDefault();
          void changePassword();
        }}
      >
        <div class="form-field" style="margin-bottom:0;">
          <label for="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            autocomplete="current-password"
            required
            bind:value={currentPassword}
          />
        </div>
        <div class="form-field" style="margin-bottom:0;">
          <label for="new-password">New password (8-128 characters)</label>
          <input
            id="new-password"
            type="password"
            autocomplete="new-password"
            required
            minlength={8}
            maxlength={128}
            bind:value={newPassword}
          />
        </div>
        <button class="primary-button" disabled={savingPassword}>
          {savingPassword ? "Saving..." : "Save new password"}
        </button>
      </form>
    {/if}

    <div class="account-stats">
      <div class="account-stat">
        <VideoIcon size={18} />
        <strong>{stats?.uploads ?? "—"}</strong>
        <span>Uploads</span>
      </div>
      <div class="account-stat">
        <Star size={18} />
        <strong>{stats?.starred ?? "—"}</strong>
        <span>Starred</span>
      </div>
      <div class="account-stat">
        <Eye size={18} />
        <strong>{stats?.views ?? "—"}</strong>
        <span>Video views</span>
      </div>
    </div>

    {#if pageError}
      <p class="error-message">{pageError}</p>
    {/if}

    <section style="margin-top:34px;">
      <div class="section-heading">
        <div>
          <div class="section-kicker">
            <VideoIcon size={15} />
            <span>YOUR LIBRARY</span>
          </div>
          <h2>Your uploads</h2>
        </div>
      </div>

      {#if uploads.length}
        <div class="video-grid" style:--grid-cols={columns}>
          {#each uploads as video (video.id)}
            <div class="video-card-wrap" style="position:relative;">
              <VideoCard {video} />
              <button
                class="card-delete-button"
                aria-label="Delete {video.title || 'video'}"
                title="Delete video"
                onclick={() => (deleteTarget = video)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state" style="margin-top:34px;">
          <p>You haven't uploaded anything yet.</p>
          <a class="secondary-button" href="/pages/upload.html">
            Open Creator Studio
          </a>
        </div>
      {/if}
    </section>

    <div class="account-links">
      <a href="/pages/upload.html">
        Open Creator Studio <span>→</span>
      </a>
      <a href="/pages/starred.html">
        View starred videos <span>→</span>
      </a>
    </div>

    <ConfirmDialog
      open={deleteTarget !== null}
      title="Delete this video?"
      message={
        deleteTarget
          ? `“${deleteTarget.title}” and its files will be permanently removed.`
          : ""
      }
      confirmText={deleting ? "Deleting..." : "Delete"}
      danger
      onConfirm={() => void confirmDelete()}
      onCancel={() => (deleteTarget = null)}
    />
  {/if}
</AppShell>
