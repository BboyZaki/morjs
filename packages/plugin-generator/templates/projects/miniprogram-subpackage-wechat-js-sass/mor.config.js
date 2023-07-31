import { defineConfig } from '@zakijs/cli'

export default defineConfig([
  {
    name: 'wechat-subpackage',
    sourceType: 'wechat',
    target: 'wechat',
    compileType: 'subpackage',
    compileMode: 'bundle'
  },
  {
    name: 'alipay-subpackage',
    sourceType: 'wechat',
    target: 'alipay',
    compileType: 'subpackage',
    compileMode: 'bundle'
  }
])
