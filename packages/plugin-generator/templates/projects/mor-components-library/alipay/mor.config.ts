import { defineConfig } from '@zakijs/cli'

export default defineConfig([
  {
    name: 'ali',
    sourceType: 'alipay',
    target: 'alipay',
  },
  {
    name: 'wechat',
    sourceType: 'alipay',
    target: 'wechat',
  },
])
