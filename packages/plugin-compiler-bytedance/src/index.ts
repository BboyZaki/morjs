import { BytedanceCompilerPlugin } from './plugin'

export { twbTemplateProcessor as templateProcessor } from '@zakijs/plugin-compiler-wechat'
export * from './constants'
export * from './runtimeConfig'

// 定制编译插件
export const Plugin = BytedanceCompilerPlugin
