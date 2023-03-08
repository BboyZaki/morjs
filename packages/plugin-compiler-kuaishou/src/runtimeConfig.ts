import { target as CurrentTarget } from './constants'

/**
 * 生成文件路径
 * @param fileName - 文件名
 */
function generatePath(fileName: string): string {
  return require.resolve(`@zakijs/runtime-mini/lib/kuaishou/${fileName}.js`)
}

/**
 * 获取运行时抹平相关代码路径
 * @param sourceType - 源码类型
 * @param target - 目标平台
 */
export function getRuntimeFiles(sourceType: string, target: string) {
  let api: string
  let app: string
  let page: string
  let component: string
  let behavior: string

  if (sourceType !== target && target === CurrentTarget) {
    api = generatePath('apis')
  }

  return {
    api,
    app,
    page,
    component,
    behavior
  }
}
