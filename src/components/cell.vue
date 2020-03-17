<template>
  <td :class="classNames">
    <div v-if="isLine" :class="lineClass"></div>
    <img v-if="imgList[className-1]" :src="imgList[className-1]" />
  </td>
</template>

<script>
import url1 from '@/assets/1.png'
import url2 from '@/assets/2.png'
import url3 from '@/assets/3.png'
import url4 from '@/assets/4.png'
import url5 from '@/assets/5.png'
import url6 from '@/assets/6.png'
import url7 from '@/assets/7.png'
import url8 from '@/assets/8.png'
import url9 from '@/assets/9.png'
export default {
  name: 'cell',
  data() {
    return {
      imgList: [ url1, url2, url3, url4, url5, url6, url7, url8, url9 ]
    }
  },
  props: ['isSelected', 'isBlank', 'className', 'lineClass', 'isLine'],
  computed: {
    classNames () {
      return {
        'selected': this.isSelected, // 选中
        'blank': this.isBlank // 空白
      }
    }
  }
}
</script>

<style lang='scss' scoped>
img {
  width: 40px;
  height: 40px;
}
</style>