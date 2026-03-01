export type ModuleConfig = {
    hasPetName: boolean
    hasVaccinationCard: boolean
    calendarIcon: 'scissors' | 'paw' | 'stethoscope' | 'calendar'
    customerLabel: string
}

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
    barber: {
        hasPetName: false,
        hasVaccinationCard: false,
        calendarIcon: 'scissors',
        customerLabel: 'Müşteri',
    },
    veterinary: {
        hasPetName: true,
        hasVaccinationCard: true,
        calendarIcon: 'paw',
        customerLabel: 'Hasta Sahibi',
    },
    health: {
        hasPetName: false,
        hasVaccinationCard: false,
        calendarIcon: 'stethoscope',
        customerLabel: 'Hasta',
    },
    default: {
        hasPetName: false,
        hasVaccinationCard: false,
        calendarIcon: 'calendar',
        customerLabel: 'Müşteri',
    }
}

export function getModuleConfig(moduleName: string | null | undefined): ModuleConfig {
    if (!moduleName || !MODULE_CONFIGS[moduleName]) {
        return MODULE_CONFIGS['default']
    }
    return MODULE_CONFIGS[moduleName]
}
