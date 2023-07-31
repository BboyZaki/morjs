import { aComponent } from '@zakijs/core'

aComponent({
  props: {
    text: 'Button',
    onClickMe: () => {}
  },

  methods: {
    onClickMe() {
      this.props.onClickMe()
    }
  }
})
