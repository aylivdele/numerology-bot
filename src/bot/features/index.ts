import { analyzeFeature } from '#root/bot/features/analyze.js'
import { extendedForecastFeature } from '#root/bot/features/extendedForecast.js'
import { forecastFeature } from '#root/bot/features/forecast.js'
import { questionFeature } from '#root/bot/features/question.js'
import { changeSettingsFeature } from '#root/bot/features/settings.js'
import { welcomeFeature } from '#root/bot/features/welcome.js'

export const conversationFeatures = [analyzeFeature, forecastFeature, extendedForecastFeature, questionFeature, changeSettingsFeature, welcomeFeature]
