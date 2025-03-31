import { analyzeFeature } from '#root/bot/features/analyze.js'
import { dialogFeature } from '#root/bot/features/dialog.js'
import { forecastFeature } from '#root/bot/features/forecast.js'
import { psychoFeature } from '#root/bot/features/psycho.js'
import { questionFeature } from '#root/bot/features/question.js'
import { changeSettingsFeature } from '#root/bot/features/settings.js'
import { testCommand } from '#root/bot/features/test.js'
import { welcomeFeature } from '#root/bot/features/welcome.js'

export const conversationFeatures = [analyzeFeature, forecastFeature, questionFeature, changeSettingsFeature, welcomeFeature, psychoFeature, testCommand, dialogFeature]
