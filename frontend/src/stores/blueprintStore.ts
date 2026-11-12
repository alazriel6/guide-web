import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createBlankModel, type PrdModel } from '@/lib/prd/sections'
import { FALLBACK_PRD_PRESETS } from '@/services/defaultPresets'
import { fromPayload } from '@/lib/prd/adapter'

export const useBlueprintStore = defineStore('blueprint', () => {
  // Initialize with saved blueprint or first preset
  const initialModel = (): PrdModel => {
    try {
      const saved = localStorage.getItem('prd.active_blueprint')
      if (saved) {
        return JSON.parse(saved) as PrdModel
      }
    } catch {
      // fallback
    }

    if (FALLBACK_PRD_PRESETS.length > 0 && FALLBACK_PRD_PRESETS[0]) {
      return fromPayload(FALLBACK_PRD_PRESETS[0])
    }

    return createBlankModel('Sistem Manajemen Layanan Cloud', 'SaaS Web App')
  }

  const activeModel = ref<PrdModel>(initialModel())

  const setActiveModel = (model: PrdModel) => {
    activeModel.value = { ...model }
    try {
      localStorage.setItem('prd.active_blueprint', JSON.stringify(activeModel.value))
    } catch {
      // storage quota
    }
  }

  const updateSection = <K extends keyof PrdModel>(key: K, value: PrdModel[K]) => {
    activeModel.value[key] = value
    try {
      localStorage.setItem('prd.active_blueprint', JSON.stringify(activeModel.value))
    } catch {
      // storage quota
    }
  }

  return {
    activeModel,
    setActiveModel,
    updateSection,
  }
})
