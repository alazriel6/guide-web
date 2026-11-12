<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
  show: boolean
  title?: string
  ariaLabel?: string
  maxWidth?: string
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  ariaLabel: '',
  maxWidth: '640px',
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const modalRef = ref<HTMLElement | null>(null)
let previousActiveElement: HTMLElement | null = null

const titleId = `modal-title-${Math.random().toString(36).substring(2, 9)}`

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  return Array.from(container.querySelectorAll<HTMLElement>(selector))
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.show) return

  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key === 'Tab' && modalRef.value) {
    const focusable = getFocusableElements(modalRef.value)
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!

    if (event.shiftKey) {
      if (document.activeElement === first || !modalRef.value.contains(document.activeElement)) {
        event.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last || !modalRef.value.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      }
    }
  }
}

function onBackdropClick(event: MouseEvent) {
  if (props.closeOnBackdrop && event.target === event.currentTarget) {
    emit('close')
  }
}

watch(
  () => props.show,
  async (isOpen) => {
    if (isOpen) {
      previousActiveElement = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeydown)

      await nextTick()
      if (modalRef.value) {
        const focusable = getFocusableElements(modalRef.value)
        if (focusable.length > 0) {
          focusable[0]?.focus()
        } else {
          modalRef.value.focus()
        }
      }
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeydown)
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus()
      }
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="accessible-modal-backdrop"
        @click="onBackdropClick"
        aria-hidden="false"
      >
        <div
          ref="modalRef"
          class="accessible-modal-card"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          :aria-label="!title && ariaLabel ? ariaLabel : undefined"
          tabindex="-1"
          :style="{ maxWidth }"
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="modal-header">
            <slot name="header">
              <h2 :id="titleId" class="modal-title font-serif">{{ title }}</h2>
            </slot>

            <button
              type="button"
              class="modal-close-btn"
              aria-label="Tutup dialog"
              @click="emit('close')"
            >
              <X :size="16" :stroke-width="1.5" />
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.accessible-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: var(--scrim-modal, rgba(0, 0, 0, 0.6));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}

.accessible-modal-card {
  width: 100%;
  background-color: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  outline: none;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--rule);
}

.modal-title {
  margin: 0;
  font-size: 18px;
  color: var(--text);
  font-weight: 400;
}

.modal-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background-color: transparent;
  color: var(--text-2);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.12s ease;
}

.modal-close-btn:hover {
  background-color: var(--hover);
  color: var(--text);
  border-color: var(--rule-strong);
}

.modal-close-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.modal-body {
  padding: 18px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--rule);
  background-color: var(--elevated);
}

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
