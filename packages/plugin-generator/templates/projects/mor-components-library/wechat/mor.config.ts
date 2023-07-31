import { defineConfig } from '@zakijs/cli'

export default defineConfig([
  {
    name: 'ali',
    sourceType: 'wechat',
    target: 'alipay',
  },
  {
    name: 'wechat',
    sourceType: 'wechat',
    target: 'wechat',
  },
])
