import SvgIcon from 'components/common/SvgIcon'
import Vue from 'vue'

// 注册到全局
Vue.component('svg-icon', SvgIcon)

// 批量导入.svg文件
const requireAll = requireContext => requireContext.keys().map(requireContext)
const req = require.context('./svg', false, /\.svg$/)
requireAll(req)