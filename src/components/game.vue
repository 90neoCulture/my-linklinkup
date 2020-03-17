<template>
  <div class="game-page" :class="currentTheme.name">
    <table class="map">
      <tr  :key="row" v-for="(cols, row) in mapData">
        <cell :key="col" v-for="(cell, col) in cols"  :className="cell.className"></cell>
      </tr>
    </table>
    <div class="configs">
      <span class="restart" @click="handleRestart">重新开始</span>
    </div>
  </div>
</template>

<script>
import cell from './cell'
import Utils from '../utils'
import config from '../config'
import themes from '../themes'
export default {
  name: 'Game',
  data() {
    return {
      mapData: [],
      config: Object.assign(config)
    }
  },
  computed: {
    currentTheme() {
      return themes.filter(e => e.name === this.config.defaultTheme)[0]
    }
  },
  components: {
    cell
  },
  mounted() {
    this.mapData = this.initData()
  },
  methods: {
    initData() {
      // classNames => ['a','b','c','d'] 每个元素代表一个方块的className
      // 生成一个方块的数组，将className放到其中
      let cellGroup = this.currentTheme.classNames.map(e => {
        return {
          isBlank: false, // 是否空白方块
          className: e, // 方块的className
          lineClass: '', // 连接线的className
          isLine: false, // 是否显示连接线
          isSelected: false
        }
      })

      // 空白方块
      let blankCell = {
        isBlank: true,
        className: '',
        lineClass: '',
        isLine: false,
        isSelected: false
      }

      // 先根据配置中的方块个数从方块数组中随机取出几条
      let randomCellGroup = Utils.arrayRandom(cellGroup, this.config.cellGroupCount)

      // 再根据配置中的行和列随机填充一个地图数据
      let cellData = Utils.arrayFillByRandomGroup(this.config.row * this.config.col, randomCellGroup)

      // 将数据根据行的大小转为二维数组，然后外部包裹一层空白节点
      let result = Utils.dyadicArrayWrap(Utils.arrayToDyadic(cellData, this.config.col), blankCell)

      // 最后把行和列的坐标设置到节点上
      result.forEach((cols, row) => {
        cols.forEach((cell, col) => {
          cell.row = row
          cell.col = col
        })
      })
      return result
    },
    handleRestart() {
      this.mapData = this.initData()
    }
  }
}
</script>

<style lang="scss" scoped>
.game-page {
  width: 100%;
  .map{
    border: 1px solid #f2f5f7;
    width: 100%;
    text-align: center;
  }
  .configs {
    width: 100%;
    .restart {
      display: inline-block;
      width: 100px;
      height: 40px;
      line-height: 40px;
      text-align: center;
      font-size: 14px;
      color: #fff;
      background: #fc9d03;
      border-radius: 5px;
      &:hover {
        cursor: pointer;
      }
    }
  }
  
}
</style>