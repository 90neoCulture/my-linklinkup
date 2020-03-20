<template>
  <div class="game-page" :class="currentTheme.name">
    <table class="map" @click="handleClick">
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
      config: Object.assign(config),
      currentSelect: null // 当前选中的方块
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
    // 点击事件代理
    handleClick(e) {
      // 如果点击的不是方块或方块中的图片则退出
      if (e.target.nodeName !== 'IMG') return

      let col = e.target.cellIndex || e.target.parentNode.cellIndex
      let row = e.target.parentNode.rowIndex || e.target.parentNode.parentNode.rowIndex
      let currentCell = this.mapData[row][col]
      
      // 判断点击的方块，如果是空白方块则退出
      if (currentCell.isBlank) return
      this.selectCell(currentCell)
      this.$forceUpdate()
    },
    selectCell(cCell) {
      console.log(cCell)
      // 如果没有选中，则设置为选中状态
      if (!this.currentSelect) {
        cCell.isSelected = true
        this.currentSelect = cCell
        return
      }

      // 如果点击的是已选中的方块，那么取消选中状态
      if (this.currentSelect === cCell) {
        cCell.isSelected = false
        this.currentSelect = null
        return
      }
      
      let pCell = this.currentSelect
      // 如果两个方块的 className 不同，那么将点击的方块设置为选中状态,前一个方块设置为未选中状态
      if (pCell.className !== cCell.className) {
        cCell.isSelected = true
        pCell.isSelected = false
        this.currentSelect = cCell
        return
      }

      // 获取两个方块的连接线
      let result = this.getLine(pCell, cCell)
      if (result.length === 0) {
        // 如果没有获取到连接线，说明两个方块无法连接，那么将点击的方块设置为选中状态
        cCell.isSelected = true
        pCell.isSelected = false
        this.currentSelect = cCell
      } else {
        // 如果获取到连接线，那么将两个方块设置为空白方块
        cCell.isBlank = true
        pCell.isBlank = true
        cCell.isSelected = false
        pCell.isSelected = false
        pCell.className = ''
        cCell.className = ''

        // 绘制连接线
        this.drawLine(result)
      }
    },
    drawLine(line) {
      // 遍历线上的节点
      line.forEach((e, i) => {
        e.isLine = true
        // 通过节点的上一个与下一个节点计算lineClass
        e.lineClass = this.addLineClass(line[i - 1], e, line[i + 1])
      })

      // 根据设置中的延迟来隐藏连接线
      setTimeout(() => {
        this.hideLine(line)
      }, this.config.lineDelay)
    },
    addLineClass(p, c, n) {
      let result
      if (!p) {
        // 开始节点
        result = 'line-start line-' + this.getDirection(c, n)
      } else if (!n) {
        // 结束节点
        result = 'line-end line-' + this.getDirection(c, p)
      } else {
        result = 'line-'+ this.getDirection(c, p) + 'line-' + this.getDirection(c, n)
      }
      return 'line ' + result
    },
    // 判断方向
    getDirection(c, n) {
      return c.row === n.row ? (c.col > n.col ? 'l' : 'r') : (c.row > n.row ? 't' : 'b')
    },
    hideLine(line) {
      line.forEach((e, i) => {
        e.isLine = false
        e.lineClass = ''
      })
    },
    getLine(p, c) {
      let result = []

      // 一条直线相通的情况（无拐角）
      // 分别获取上一个选中方块的X轴与Y轴上的可连接线，
      // getHorizontalLine 与 getVerticalLine 均返回一个 Set 对象
      // 使用 has 可以快速高效地判断在可连接线上是否包含某个方块
      let pH = this.getHorizontalLine(p)
      let pV = this.getVerticalLine(p)
      if (pH.has(c)) return this.getBeeline(p, c)
      if (pV.has(c)) return this.getBeeline(p, c)

      // 如果直线无法连通，则获取另一个方块的可连接线
      let cH = this.getHorizontalLine(c)
      let cV = this.getVerticalLine(c)

      // 如果其中一个方块在X轴和Y轴上的可连接线长度都为0，则直接返回空数组
      if((!pH.size && !pV.size) || (!cH.size && !cV.size)) return result

      // 一个拐角的情况
      let intersection = this.getIntersection(pH, cV) || this.getIntersection(pV, cH)
      // 获取到交点则返回路径
      // 上一个选中 => 第一个拐角 => 当前选中
      if (intersection) return this.getBeeline(p, intersection).concat(this.getBeeline(intersection, c).slice(1))

      // 两个拐角的情况
      let intersectionArr = this.getIntersectionArr(pH, cH, p.row, c.row, true)

      if (intersectionArr.length === 0) {
        intersectionArr = this.getIntersectionArr(pH, cH, p.row, c.row, false)
      }

      // 如果数组有值，则返回一个包含两个拐角的方块的数组
      // 上一个选中 => 第一个拐角 => 第二个拐角 => 当前选中
      if (intersectionArr.length > 0) {
        result = this.getBeeline(p, intersectionArr[0]).concat(this.getBeeline(intersectionArr[0],intersectionArr[1]).slice(1)).concat(this.getBeeline(intersectionArr[1],c).slice(1))
      }
      
      return result
    },
    getHorizontalLine(c) {
      return this.checkCell(this.mapData[c.row], c.col)
    },
    getVerticalLine(c) {
      return this.checkCell(this.mapData.map(e => e[c.col]), c.row)
    },
    // 通过一个数组与需要要查找的数组下标来进行查找
    checkCell(arr, index) {
      let set = new Set()

      // 向后查找
      for (let i = index -1; i >= 0; i--) {
        let cell = arr[i]

        // 判断 className 是否相同或者是否为空白方块
        if( cell.className === arr[index].className || cell.isBlank) {
          set.add(cell)
        }

        // 若不是空白方块则终止查找
        if (!cell.isBlank) {
          break
        }
      }

      // 向前查找
      for (let i = index + 1, l = arr.length; i < l; i++) {
        let cell = arr[i]
        if (cell.className === arr[index].className || cell.isBlank) {
          set.add(cell)
        }

        if (!cell.isBlank) {
          break
        }
      }

      return set
    },
    getBeeline(start, end) {
      let startIndex
      let endIndex
      let arr
      if (start.row === end.row) {
        startIndex = start.col
        endIndex = end.col
        arr = this.mapData[start.row]
      } else {
        startIndex = start.row
        endIndex = end.row
        arr = this.mapData.map(e => e[start.col])
      }

      // 判断一下直线的方向，如果是反方向那么将数组reverse
      return startIndex < endIndex ? arr.slice(startIndex, endIndex + 1) : arr.slice(endIndex, startIndex + 1).reverse()
    },
    // 一个拐角
    getIntersection(pLine, cLine) {
      let intersection = null
      for(let cell of pLine) {
        if (cLine.has(cell) || cell.isBlank) {
          intersection = cell
          break
        }
      }

      return intersection
    },
    // 两个拐角
    getIntersectionArr(p, c, pIndex, cIndex, isRow) {
      let result = []
      if (!p.size || !c.size) {
        return result
      }

      let rowKey = isRow ? 'col' : 'row'
      let pFullLine = isRow ? this.mapData[pIndex] : this.mapData.map(e => e[pIndex])
      let cFullLine = isRow ? this.mapData[cIndex] : this.mapData.map(e => e[cIndex])

      for(let pCell of p) {
        if (!pCell.isBlank) continue

        let target = cFullLine[pCell[rowKey]]

        // 判断 target 是否在连接线中
        if (c.has(target)) {
          let index = target[rowKey]
          // 判断这条垂线是否是连通的
          let isBeeline = this.checkBeeline(pFullLine[index], cFullLine[index])

          if (isBeeline) {
            // 返回两个端点
            return [pFullLine[index], cFullLine[index]]
          }
        }
      }

      return result
    },
    checkBeeline(start, end) {
      let result = true
      // 获取两个点的连接线
      let beeline = this.getBeeline(start, end)
      for (let lineCell of beeline) {
        // 判断线上是否有非空节点，存在则无法连通
        if (!lineCell.isBlank) {
          result = false
          break
        }
      }
      return result
    },
    handleRestart() {
      this.mapData = this.initData()
    }
  }
}
</script>

<style lang="scss" scoped>
table {
  border-spacing: 0;
}
.game-page {
  width: 100%;
  max-width: 800px;
  min-width: 300px;
  margin: 0 auto;
  .map{
    border: 1px solid #f2f5f7;
    width: 100%;
    text-align: center;
  }
  .configs {
    width: 100%;
    text-align: center;
    margin-top: 20px;
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
.default {
  td {
    border: 3px solid;
    border-color: transparent;
    border-radius: 4px;
    position: relative;
  }
  .blank {
    img {
      display: none;
      cursor: default;
    }
  }
  .selected {
    border-color: #ff0000;
  }
  .line {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    &:before, &:after {
      content: '';
      display: block;
      position: absolute;
      background-color: red;
    }
    &.line-l{
      &.line-r {
        &:before {
          width: calc(50% + 4px);
          height: 4px;
          top: 50%;
          right: 50%;
          margin-top: -2px;
        }
      }
    }
    &.line-l {
      &:before {
        right: -4px;
      }
    }
    &.line-r {
      &:before {
        width: calc(100% + 8px);
        left: -4px;
        right: -4px;
      }
    }
    &.line-t, &.line-b {
      &:after {
        width: 4px;
        height: calc(50% + 4px);
        left: 50%;
        bottom: 50%;
        margin-left: -2px;
      }
    }
    &.line-b {
      &:after {
        bottom: -4px;
      }
    }
    &.line-t {
      &.line-b {
        &:after {
          height: calc(100% + 8px);
          top: -4px;
          bottom: -4px;
        }
      }
    }
    &.line-t, &.line-b {
      &.line-r {
        &:before {
          width: calc(50% + 6px);
          border-top-left-radius: 2px;
          border-bottom-left-radius: 2px;
        }
      }
    }
    &.line-t, &.line-b {
      &.line-l {
        &:before {
          width: calc(50% + 6px);
          margin-right: -2px;
          border-top-right-radius: 2px;
          border-bottom-right-radius: 2px;
        }
      }
    }
    &.line-start {
      &.line-l, &.line-r {
        &:before {
          width: calc(20% + 4px);
          right: 80%;
        }
      }
    }
    &.line-end {
      &.line-l, &.line-r {
        &:before {
          width: calc(20% + 4px);
          right: 80%;
        }
      }
    }
    &.line-start, &.line-end {
      &.line-r {
        &:before {
          left: 80%;
        }
      }
    }
    &.line-start {
      &.line-l, &.line-r {
        &:after {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          right: 80%;
          top: 50%;
          margin-top: -5px;
          margin-right: -5px;
        }
      }
    }
    &.line-end {
      &.line-l, &.line-r {
        &:after {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          right: 80%;
          top: 50%;
          margin-top: -5px;
          margin-right: -5px;
        }
      }
    }
    &.line-start, &.line-end {
      &.line-r {
        &:after {
          margin-left: -5px;
          left: 80%;
        }
      }
    }
    &.line-start {
      &.line-t, &.line-b {
        &:after {
          height: calc(20% + 4px);
          bottom: 80%;
        }
      }
    }
    &.line-end {
      &.line-t, &.line-b {
        &:after {
          height: calc(20% + 4px);
          bottom: 80%;
        }
      }
    }
    &.line-start, &.line-end {
      &.line-b {
        &:after {
          top: 80%;
        }
      }
    }
    &.line-start {
      &.line-t, &.line-b {
        &:before {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          bottom: 80%;
          left: 50%;
          margin-left: -5px;
          margin-bottom: -5px;
        }
      }
    }
    &.line-end {
      &.line-t, &.line-b {
        &:before {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          bottom: 80%;
          left: 50%;
          margin-left: -5px;
          margin-bottom: -5px;
        }
      }
    }
    &.line-start, &.line-end {
      &.line-b {
        &:before {
          margin-top: -5px;
          top: 80%;
        }
      }
    }
  }
}
</style>