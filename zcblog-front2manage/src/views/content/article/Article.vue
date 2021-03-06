<template>
  <div>
    <el-form :inline="true">
      <el-form-item>
        <el-input placeholder="输入文章标题" v-model="dataForm.keyWord" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
        <el-button type="danger" :disabled="dataListSelections.length <= 0" @click="deleteHandle()">批量删除</el-button>
        <el-button type="warning"  @click="refreshCache()">刷新缓存</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="dataList" border v-loading="dataListLoading" @selection-change="selectionChangeHandle" style="width: 100%;">
      <el-table-column type="selection" header-align="center" align="center" width="50">
      </el-table-column>
      <el-table-column type="index" :index="index => index+1" prop="id" header-align="center" align="center" width="50" label="编号">
      </el-table-column>
      <el-table-column prop="title" header-align="center" align="center" label="文章标题" >
      </el-table-column>
      <el-table-column prop="tagList" header-align="center" align="center" label="标签">
        <template slot-scope="scope">
          <el-row>
            <el-button v-for="tag in scope.row.tagList" :key="tag.id" size="mini">{{tag.name}}</el-button>
          </el-row>
        </template>
      </el-table-column>
      <el-table-column prop="readNum" header-align="center" align="center" width="80" label="浏览量">
      </el-table-column>
      <el-table-column prop="likeNum" header-align="center" align="center" width="80" label="点赞数">
      </el-table-column>
      <el-table-column prop="publish" header-align="center" align="center" label="发布状态"  width="100">
        <template slot-scope="scope">
          <el-tooltip class="item" effect="dark" content="点击发布" v-if="!scope.row.publish" placement="top">
            <el-button type="info" size="mini" @click="updatePublish(scope.row.id, true)">未发布</el-button>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" content="点击下架" v-if="scope.row.publish" placement="top">
            <el-button type="success" size="mini" @click="updatePublish(scope.row.id, false)">已发布</el-button>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="top" header-align="center" align="center"  width="80" label="置顶">
        <template slot-scope="scope">
          <el-switch v-model="scope.row.top" active-color="#13ce66" @change="updateTop(scope.row.id,scope.row.top)">
          </el-switch>
        </template>
      </el-table-column>
      <el-table-column prop="recommend" header-align="center" align="center"  width="80" label="推荐">
        <template slot-scope="scope">
          <el-switch v-model="scope.row.recommend" active-color="#13ce66" @change="updateRecommend(scope.row.id,scope.row.recommend)">
          </el-switch>
        </template>
      </el-table-column>
      <el-table-column prop="needEncrypt" header-align="center" align="center" width="80" label="加密状态">
        <template slot-scope="scope">
          {{scope.row.needEncrypt ? '已加密' : '未加密'}}
        </template>
      </el-table-column>
      <el-table-column fixed="right" header-align="center" align="center" width="100" label="操作">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="addOrUpdateHandle(scope.row.id)">编辑</el-button>
          <el-button type="text" size="small" @click="deleteHandle(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalCount"
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>
  </div>
</template>

<script type="text/ecmascript-6">
import {
  executeGetArticleList,
  executeDeleteArticle,
  executeUpdateStatus,
  executeRefresh
} from 'network/api/article'

export default {
  name: 'Article',
  data () {
    return {
      dataForm: {
        keyWord: ''
      },
      dataList: [],
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      dataListLoading: false,
      dataListSelections: []
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    // 获取数据列表
    getDataList () {
      this.dataListLoading = true
      executeGetArticleList(this.currentPage, this.pageSize, this.dataForm.keyWord).then(data => {
        if (data && data.code === 200) {
          this.dataList = data.page.list
          this.totalCount = data.page.totalCount
        } else {
          this.dataList = []
          this.totalCount = 0
        }
        this.dataListLoading = false
      }).catch(() => {})
    },
    // 每页数
    sizeChangeHandle (val) {
      this.pageSize = val
      this.currentPage = 1
      this.getDataList()
    },
    // 当前页
    currentChangeHandle (val) {
      this.currentPage = val
      this.getDataList()
    },
    // 多选
    selectionChangeHandle (val) {
      this.dataListSelections = val
    },
    // 修改
    addOrUpdateHandle (id) {
      this.$router.push({
        name: 'article/update/:id',
        params: {
          id: id
        }
      })
    },
    // 删除
    deleteHandle (id) {
      const articleIds = id ? [id] : this.dataListSelections.map(item => { return item.id })
      this.$confirm(`确定对[id=${articleIds.join(',')}]进行[${id ? '删除' : '批量删除'}]操作?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        executeDeleteArticle(articleIds).then(data => {
          if (data && data.code === 200) {
            this.$message({
              message: '操作成功',
              type: 'success',
              duration: 1500,
              onClose: () => {
                this.getDataList()
              }
            })
          } else {
            this.$message.error(data.msg)
          }
        })
      }).catch(() => {})
    },
    // 更新文章推荐状态
    updateRecommend (id, value) {
      const data = {
        id: id,
        recommend: value
      }
      this.updateStatus(data)
    },
    // 更新文章置顶状态
    updateTop (id, value) {
      const data = {
        id: id,
        top: value
      }
      this.updateStatus(data)
    },
    // 更新文章发布状态
    updatePublish (id, value) {
      const data = {
        id: id,
        publish: value
      }
      this.updateStatus(data)
    },
    // 更新文章
    updateStatus (data) {
      executeUpdateStatus(data).then(data => {
        if (data && data.code === 200) {
          this.$message.success('更新成功')
          this.getDataList()
        } else {
          this.$message.error(data.msg)
        }
      })
    },
    // 刷新缓存
    refreshCache () {
      executeRefresh().then(data => {
        if (data && data.code === 200) {
          this.$message.success('刷新成功')
        } else {
          this.$message.error(data.msg)
        }
      })
    }
  }
}
</script>

<style lang="scss" type="text/scss" rel="stylesheet/scss" scoped>

</style>
